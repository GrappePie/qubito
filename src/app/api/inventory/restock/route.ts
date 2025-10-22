import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import ItemModel from '@/models/Item';
import { getTenantIdFromRequest } from '@/lib/tenant';

export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();
        const tenant = getTenantIdFromRequest(req);
        const { items } = await req.json();
        if (!Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ error: 'No items provided' }, { status: 400 });
        }
        const updates: Array<{ id: string; newStock: number }> = [];
        for (const entry of items) {
            const id = entry?.id;
            const qty = Number(entry?.qty);
            if (typeof id !== 'string' || !Number.isFinite(qty) || qty <= 0) continue;
            const doc = await ItemModel.findOne({ _id: id, owner: tenant }).lean();
            if (!doc) continue;
            const newStock = (doc.stock ?? 0) + qty;
            await ItemModel.updateOne({ _id: id, owner: tenant }, { $set: { stock: newStock } });
            updates.push({ id, newStock });
        }
        return NextResponse.json({ success: true, updates });
    } catch (e) {
        console.error('POST /api/inventory/restock error', e);
        return NextResponse.json({ error: 'Error al reabastecer' }, { status: 500 });
    }
}

