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
    for (const { id, qty } of items) {
        const product = await Product.findById(id);
        if (!product) continue;
        if (qty <= 0) continue;
        product.quantity += qty;
        await product.save();
        updates.push({ id, newQuantity: product.quantity });
    }
    return NextResponse.json({ success: true, updates });
}

