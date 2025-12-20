import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import ItemModel from '@/models/Item';
import { getTenantIdFromRequest } from '@/lib/tenant';
import { requireAuth } from '@/lib/apiAuth';

export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();
        const auth = await requireAuth(req, 'inventory.manage');
        if (!auth.ok) return auth.res;
        const tenant = auth.ctx.account.tenantId || getTenantIdFromRequest(req);
        const { items } = await req.json();

        if (!Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ error: 'No items provided' }, { status: 400 });
        }

        // Obtener todos los IDs y cargar productos del tenant en una sola consulta
        const ids: string[] = items.map((i: { id: string; qty: number }) => i.id);
        const docs = await ItemModel.find({ _id: { $in: ids }, owner: tenant });
        const map = new Map<string, typeof docs[number]>();
        for (const doc of docs) {
            map.set(String(doc._id), doc);
        }

        // Validar stock suficiente
        const insufficient: { id: string; name: string; available: number; requested: number }[] = [];
        for (const { id, qty } of items) {
            const product = map.get(id);
            if (!product || (product.stock ?? 0) < qty) {
                insufficient.push({
                    id,
                    name: product ? (product.name as string) : 'Producto no encontrado',
                    available: product ? (product.stock ?? 0) : 0,
                    requested: qty,
                });
            }
        }

        if (insufficient.length > 0) {
            return NextResponse.json({ error: 'Stock insuficiente', insufficient }, { status: 400 });
        }

        // Actualizar cantidades en memoria y guardar en lote
        const toSave: Array<typeof docs[number]> = [];
        const updates: { id: string; newStock: number }[] = [];
        for (const { id, qty } of items) {
            const product = map.get(id)!;
            product.stock = (product.stock ?? 0) - qty;
            toSave.push(product);
            updates.push({ id, newStock: product.stock as number });
        }

        await ItemModel.bulkSave(toSave);
        return NextResponse.json({ success: true, updates });
    } catch (e) {
        console.error('POST /api/inventory/sell error', e);
        return NextResponse.json({ error: 'Error al descontar stock' }, { status: 500 });
    }
}
