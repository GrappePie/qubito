import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import CashRegisterSession from "@/models/CashRegisterSession";
import TicketModel from "@/models/Ticket";
import { getTenantIdFromRequest, getUserSubFromRequest } from "@/lib/tenant";
import { requireAuth } from "@/lib/apiAuth";
import { serializeCashRegisterSession } from "@/lib/cashRegister";

type CashTotals = {
  cash: number;
  change: number;
  tickets: number;
};

function parseOptionalNumber(value: unknown) {
  if (value == null) return null;
  const num = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(num) ? Number(num) : null;
}

function toNumber(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

async function computeSessionCash(sessionId: string): Promise<CashTotals> {
  const tickets = await TicketModel.find({ cashSessionId: sessionId }).lean();
  return tickets.reduce<CashTotals>(
    (acc, ticket) => {
      const payments = ticket.payments ?? {};
      acc.cash += toNumber(payments.cash);
      acc.change += toNumber(payments.change);
      acc.tickets += 1;
      return acc;
    },
    { cash: 0, change: 0, tickets: 0 }
  );
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const auth = await requireAuth(req, "cash.close");
    if (!auth.ok) return auth.res;
    const tenantId =
      auth.ctx.account.tenantId || getTenantIdFromRequest(req);
    const closedBy = auth.ctx.account.userId || getUserSubFromRequest(req);

    const session = await CashRegisterSession.findOne({
      tenantId,
      status: "open",
    });
    if (!session) {
      return NextResponse.json(
        { error: "cash_register_closed" },
        { status: 409 },
      );
    }

    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    const closingAmount = parseOptionalNumber(body?.closingAmount);
    if (closingAmount == null) {
      return NextResponse.json(
        { error: "closing_amount_required" },
        { status: 400 },
      );
    }
    if (closingAmount < 0) {
      return NextResponse.json(
        { error: "invalid_amount" },
        { status: 400 },
      );
    }
    const notes =
      typeof body?.notes === "string" && body.notes.trim()
        ? body.notes.trim().slice(0, 240)
        : null;

    const sessionId = session._id?.toString?.() ?? String(session._id);
    const totals = await computeSessionCash(sessionId);
    const netCash = roundCurrency(totals.cash - totals.change);
    const expectedCash = roundCurrency(toNumber(session.openingAmount) + netCash);
    const discrepancy = roundCurrency(closingAmount - expectedCash);
    const needsReason = Math.abs(discrepancy) > 0.009;
    if (needsReason && !notes) {
      return NextResponse.json(
        { error: "closing_reason_required", expectedCash, discrepancy },
        { status: 409 },
      );
    }

    session.status = "closed";
    session.closedAt = new Date();
    session.closedBy = closedBy ?? null;
    session.closingAmount = closingAmount;
    session.expectedCash = expectedCash;
    session.discrepancy = discrepancy;
    if (notes) session.notes = notes;
    // TODO: send email/push notifications to tenant when cash discrepancy is detected.
    await session.save();

    return NextResponse.json({
      open: false,
      session: serializeCashRegisterSession(session),
    });
  } catch (error) {
    console.error("POST /api/cash-register/close error", error);
    return NextResponse.json(
      { error: "Error al cerrar la caja" },
      { status: 500 },
    );
  }
}
