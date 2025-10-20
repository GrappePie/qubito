import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import OrderModel, { OrderItem } from "@/models/Order";

function normalizeMode(value: unknown): "table" | "quick" {
  return value === "table" ? "table" : "quick";
}

function toNumber(value: unknown, fallback = 0): number {
  const num = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(num) ? Number(num) : fallback;
}

function normalizeItems(raw: unknown): OrderItem[] {
  if (!Array.isArray(raw)) return [];
  const items: OrderItem[] = [];
  for (const entry of raw) {
    if (typeof entry !== "object" || entry === null) continue;
    const record = entry as Record<string, unknown>;
    const maybeProductId =
      typeof record.productId === "string"
        ? record.productId
        : typeof record.id === "string"
          ? record.id
          : null;
    const name = typeof record.name === "string" ? record.name.trim() : "";
    const quantity = toNumber(record.quantity);
    const price = toNumber(record.price);
    if (!maybeProductId || !name || quantity <= 0 || price < 0) continue;
    const image = typeof record.image === "string" ? record.image : undefined;
    const sku = typeof record.sku === "string" ? record.sku : undefined;
    const stockValue = toNumber(record.stock, NaN);
    const stock = Number.isFinite(stockValue) ? stockValue : undefined;
    items.push({
      productId: maybeProductId as string,
      name,
      quantity,
      price,
      image,
      sku,
      stock,
    });
  }
  return items;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ contextId: string }> }) {
  try {
    await connectToDatabase();
    const { contextId } = await params;
    const order = await OrderModel.findOne({ contextId, status: "pending" }).lean();
    return NextResponse.json(order ?? null);
  } catch (error) {
    console.error("GET /api/orders/[contextId]", error);
    return NextResponse.json({ error: "Error al obtener la orden" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ contextId: string }> }) {
  try {
    await connectToDatabase();
    const { contextId } = await params;
    const body = await req.json();

    const items = normalizeItems(body?.items);
    if (items.length === 0) {
      return NextResponse.json({ error: "Necesitas al menos un producto para guardar la orden" }, { status: 400 });
    }

    const mode = normalizeMode(body?.mode);
    const tableNumber = mode === "table" ? toNumber(body?.tableNumber, NaN) : null;
    if (mode === "table" && (!Number.isInteger(tableNumber) || tableNumber! <= 0)) {
      return NextResponse.json({ error: "Número de mesa inválido" }, { status: 400 });
    }

    const subtotal = toNumber(body?.subtotal, 0);
    const tax = toNumber(body?.tax, 0);
    const total = toNumber(body?.total, 0);

    const updatePayload = {
      contextId,
      mode,
      tableNumber: mode === "table" ? tableNumber : null,
      status: "pending" as const,
      items,
      subtotal,
      tax,
      total,
      customerName: typeof body?.customerName === "string" ? body.customerName.trim() || undefined : undefined,
    };

    const updated = await OrderModel.findOneAndUpdate(
      { contextId },
      { $set: updatePayload },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ).lean();

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/orders/[contextId]", error);
    return NextResponse.json({ error: "Error al guardar la orden" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ contextId: string }> }) {
  try {
    await connectToDatabase();
    const { contextId } = await params;
    await OrderModel.findOneAndDelete({ contextId });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/orders/[contextId]", error);
    return NextResponse.json({ error: "Error al eliminar la orden" }, { status: 500 });
  }
}
