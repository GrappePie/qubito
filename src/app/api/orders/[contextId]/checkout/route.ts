import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import OrderModel, { OrderItem } from "@/models/Order";
import TicketModel from "@/models/Ticket";

function toNumber(value: unknown, fallback = 0): number {
  const num = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(num) ? Number(num) : fallback;
}

function sanitizeItems(raw: unknown, fallback: OrderItem[] = []): OrderItem[] {
  if (!Array.isArray(raw)) return fallback;
  const normalized: OrderItem[] = [];
  for (const entry of raw) {
    if (typeof entry !== "object" || entry === null) continue;
    const record = entry as Record<string, unknown>;
    const productId = typeof record.productId === "string" ? record.productId : typeof record.id === "string" ? record.id : null;
    const name = typeof record.name === "string" ? record.name.trim() : "";
    const quantity = toNumber(record.quantity);
    const price = toNumber(record.price);
    if (!productId || !name || quantity <= 0 || price < 0) continue;
    const stockValue = toNumber(record.stock, NaN);
    normalized.push({
      productId,
      name,
      quantity,
      price,
      image: typeof record.image === "string" ? record.image : undefined,
      sku: typeof record.sku === "string" ? record.sku : undefined,
      stock: Number.isFinite(stockValue) ? stockValue : undefined,
    });
  }
  return normalized.length ? normalized : fallback;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ contextId: string }> }) {
  try {
    await connectToDatabase();
    const { contextId } = await params;
    const body = await req.json();

    const existingOrder = await OrderModel.findOne({ contextId, status: "pending" });
    if (!existingOrder && !Array.isArray(body?.items)) {
      return NextResponse.json({ error: "No encontramos una orden pendiente para finalizar" }, { status: 404 });
    }

    const mode = (existingOrder?.mode ?? (body?.mode === "table" ? "table" : "quick")) as "table" | "quick";
    const tableNumber = mode === "table" ? existingOrder?.tableNumber ?? toNumber(body?.tableNumber, NaN) : null;
    if (mode === "table" && (!Number.isInteger(tableNumber) || tableNumber! <= 0)) {
      return NextResponse.json({ error: "Número de mesa inválido" }, { status: 400 });
    }

    const items = sanitizeItems(body?.items, existingOrder?.items ?? []);
    if (items.length === 0) {
      return NextResponse.json({ error: "No hay productos para registrar la venta" }, { status: 400 });
    }

    const amounts = body?.amounts ?? {};
    const summary = body?.summary ?? {};

    const subtotal = toNumber(amounts?.subtotal, existingOrder?.subtotal ?? 0);
    const tax = toNumber(amounts?.tax, existingOrder?.tax ?? 0);
    const totalBase = toNumber(amounts?.total, existingOrder?.total ?? 0);
    const tip = toNumber(summary?.tip, 0);
    const totalDue = toNumber(summary?.totalDue, totalBase + tip);
    const paid = toNumber(summary?.paid, 0);
    const cash = toNumber(summary?.cash, 0);
    const card = toNumber(summary?.card, 0);
    const change = toNumber(summary?.change, 0);
    const splitCount = Math.max(1, Math.trunc(toNumber(summary?.splitCount, 1)));
    const customerName = typeof summary?.customerName === "string" && summary.customerName.trim() ? summary.customerName.trim() : existingOrder?.customerName;

    if (paid < totalDue) {
      return NextResponse.json({ error: "El pago registrado no cubre el total de la venta" }, { status: 400 });
    }

    const ticket = await TicketModel.create({
      orderContext: mode,
      tableNumber: mode === "table" ? tableNumber : undefined,
      customerName,
      subtotal,
      tax,
      tip,
      total: totalDue,
      payments: {
        cash,
        card,
        change,
        paid,
      },
      splitCount: splitCount > 1 ? splitCount : undefined,
      products: items.map((item) => ({
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.price,
        total: item.price * item.quantity,
        sku: item.sku,
      })),
    });

    await OrderModel.findOneAndDelete({ contextId });

    return NextResponse.json(ticket);
  } catch (error) {
    console.error("POST /api/orders/[contextId]/checkout", error);
    return NextResponse.json({ error: "Error al finalizar la venta" }, { status: 500 });
  }
}
