import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Product } from '@/models/Product';

export async function POST(req: NextRequest) {
    await connectToDatabase();
    const { items } = await req.json();

    if (!Array.isArray(items) || items.length === 0) {
        return NextResponse.json({ error: 'No items provided' }, { status: 400 });
    }

    // Obtener todos los IDs y cargar productos en una sola consulta
    const ids: string[] = items.map((i: { id: string; qty: number }) => i.id);
    const docs = await Product.find({ _id: { $in: ids } });
    const map = new Map<string, typeof docs[number]>();
    for (const doc of docs) {
        map.set(String(doc._id), doc);
    }

    // Validar stock suficiente
    const insufficient: { id: string; name: string; available: number; requested: number }[] = [];
    for (const { id, qty } of items) {
        const product = map.get(id);
        if (!product || (product.quantity ?? 0) < qty) {
            insufficient.push({
                id,
                name: product ? (product.name as string) : 'Producto no encontrado',
                available: product ? (product.quantity ?? 0) : 0,
                requested: qty,
            });
        }
    }

    if (insufficient.length > 0) {
        return NextResponse.json({ error: 'Stock insuficiente', insufficient }, { status: 400 });
    }

    // Actualizar cantidades en memoria y guardar en lote
    const toSave: Array<typeof docs[number]> = [];
    const updates: { id: string; newQuantity: number }[] = [];
    for (const { id, qty } of items) {
        const product = map.get(id)!;
        product.quantity = (product.quantity ?? 0) - qty;
        toSave.push(product);
        updates.push({ id, newQuantity: product.quantity as number });
    }

    await Product.bulkSave(toSave);
    return NextResponse.json({ success: true, updates });
}
