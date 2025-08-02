import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Product } from '@/models/Product';

export async function POST(req: NextRequest) {
    await connectToDatabase();
    const { items } = await req.json();
    if (!Array.isArray(items) || items.length === 0) {
        return NextResponse.json({ error: 'No items provided' }, { status: 400 });
    }
    const updates = [];
    const bulkOperations = [];
    for (const { id, qty } of items) {
        if (qty <= 0) continue;
        const product = await Product.findById(id);
        if (!product) continue;
        const newQuantity = product.quantity + qty;
        bulkOperations.push({
            updateOne: {
                filter: { _id: id },
                update: { $set: { quantity: newQuantity } }
            }
        });
        updates.push({ id, newQuantity });
    }
    if (bulkOperations.length > 0) {
        await Product.bulkWrite(bulkOperations);
    }
    return NextResponse.json({ success: true, updates });
}

