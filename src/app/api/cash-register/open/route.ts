import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import CashRegisterSession from "@/models/CashRegisterSession";
import { getTenantIdFromRequest, getUserSubFromRequest } from "@/lib/tenant";
import { requireAuth } from "@/lib/apiAuth";
import { serializeCashRegisterSession } from "@/lib/cashRegister";

function toNumber(value: unknown, fallback = 0) {
  const num = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(num) ? Number(num) : fallback;
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const auth = await requireAuth(req, "cash.close");
    if (!auth.ok) return auth.res;
    const tenantId =
      auth.ctx.account.tenantId || getTenantIdFromRequest(req);
    const openedBy = auth.ctx.account.userId || getUserSubFromRequest(req);

    const existing = await CashRegisterSession.findOne({
      tenantId,
      status: "open",
    }).lean();
    if (existing) {
      return NextResponse.json(
        { error: "cash_register_open" },
        { status: 409 },
      );
    }

    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    const openingAmount = toNumber(body?.openingAmount, 0);
    if (openingAmount < 0) {
      return NextResponse.json(
        { error: "invalid_amount" },
        { status: 400 },
      );
    }
    const notes =
      typeof body?.notes === "string" && body.notes.trim()
        ? body.notes.trim().slice(0, 240)
        : null;

    const session = await CashRegisterSession.create({
      tenantId,
      status: "open",
      openingAmount,
      openedAt: new Date(),
      openedBy: openedBy ?? null,
      notes,
    });

    return NextResponse.json({
      open: true,
      session: serializeCashRegisterSession(session),
    });
  } catch (error) {
    console.error("POST /api/cash-register/open error", error);
    return NextResponse.json(
      { error: "Error al abrir la caja" },
      { status: 500 },
    );
  }
}
