import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import CashRegisterSession from "@/models/CashRegisterSession";
import TicketModel from "@/models/Ticket";
import { getTenantIdFromRequest } from "@/lib/tenant";
import { requireAuth } from "@/lib/apiAuth";
import { serializeCashRegisterSession } from "@/lib/cashRegister";

type CashTotals = {
  cash: number;
  change: number;
  tickets: number;
};

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

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const auth = await requireAuth(req);
    if (!auth.ok) return auth.res;
    const tenantId =
      auth.ctx.account.tenantId || getTenantIdFromRequest(req);

    const session = await CashRegisterSession.findOne({
      tenantId,
      status: "open",
    })
      .sort({ openedAt: -1 })
      .lean();

    const sessionDoc = Array.isArray(session) ? session[0] : session;
    if (!sessionDoc) {
      return NextResponse.json({ open: false, session: null });
    }

    const sessionId =
      (sessionDoc as { _id?: unknown })._id?.toString?.() ??
      String((sessionDoc as { _id?: unknown })._id);
    const totals = await computeSessionCash(sessionId);
    const netCash = roundCurrency(totals.cash - totals.change);
    const expectedCash = roundCurrency(
      toNumber(sessionDoc.openingAmount) + netCash
    );

    return NextResponse.json({
      open: true,
      session: serializeCashRegisterSession(sessionDoc),
      expectedCash,
      netCash,
      ticketCount: totals.tickets,
    });
  } catch (error) {
    console.error("GET /api/cash-register error", error);
    return NextResponse.json(
      { error: "Error al obtener el estado de caja" },
      { status: 500 },
    );
  }
}
