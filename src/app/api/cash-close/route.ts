import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import TicketModel from "@/models/Ticket";
import { getTenantIdFromRequest } from "@/lib/tenant";
import { requireAuth } from "@/lib/apiAuth";

type Totals = {
  tickets: number;
  items: number;
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
  cash: number;
  card: number;
  change: number;
  paid: number;
};

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function endOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

function parseDateParam(value: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
    return new Date(year, month - 1, day);
  }
  const parsed = new Date(trimmed);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
}

function toNumber(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const auth = await requireAuth(req, "cash.close");
    if (!auth.ok) return auth.res;
    const tenant = auth.ctx.account.tenantId || getTenantIdFromRequest(req);
    const { searchParams } = new URL(req.url);
    const fromParam = parseDateParam(searchParams.get("from"));
    const toParam = parseDateParam(searchParams.get("to"));
    const now = new Date();
    const fromDate = startOfDay(fromParam ?? now);
    const toDate = endOfDay(toParam ?? now);
    if (fromDate > toDate) {
      return NextResponse.json({ error: "invalid_range" }, { status: 400 });
    }

    const tickets = await TicketModel.find({
      customerId: tenant,
      createdAt: { $gte: fromDate, $lte: toDate },
    })
      .sort({ createdAt: -1 })
      .lean();

    const totals: Totals = {
      tickets: 0,
      items: 0,
      subtotal: 0,
      tax: 0,
      tip: 0,
      total: 0,
      cash: 0,
      card: 0,
      change: 0,
      paid: 0,
    };

    const normalized = tickets.map((ticket) => {
      const payments = ticket.payments ?? {};
      const itemsCount = Array.isArray(ticket.products)
        ? ticket.products.reduce((sum, item) => sum + toNumber(item.quantity), 0)
        : 0;
      totals.tickets += 1;
      totals.items += itemsCount;
      totals.subtotal += toNumber(ticket.subtotal);
      totals.tax += toNumber(ticket.tax);
      totals.tip += toNumber(ticket.tip);
      totals.total += toNumber(ticket.total);
      totals.cash += toNumber(payments.cash);
      totals.card += toNumber(payments.card);
      totals.change += toNumber(payments.change);
      totals.paid += toNumber(payments.paid);
      return {
        id: ticket._id?.toString?.() ?? String(ticket._id),
        orderContext: ticket.orderContext,
        tableNumber: ticket.tableNumber ?? null,
        customerName: ticket.customerName ?? null,
        createdBy: ticket.createdBy ?? null,
        subtotal: toNumber(ticket.subtotal),
        tax: toNumber(ticket.tax),
        tip: toNumber(ticket.tip),
        total: toNumber(ticket.total),
        payments: {
          cash: toNumber(payments.cash),
          card: toNumber(payments.card),
          change: toNumber(payments.change),
          paid: toNumber(payments.paid),
        },
        itemsCount,
        createdAt: ticket.createdAt ? new Date(ticket.createdAt).toISOString() : null,
      };
    });

    return NextResponse.json({
      range: { from: fromDate.toISOString(), to: toDate.toISOString() },
      totals,
      tickets: normalized,
    });
  } catch (error) {
    console.error("GET /api/cash-close error", error);
    return NextResponse.json(
      { error: "Error al obtener el corte de caja" },
      { status: 500 }
    );
  }
}
