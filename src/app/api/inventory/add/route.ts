import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import ItemModel from '@/models/Item';
import { getTenantIdFromRequest } from '@/lib/tenant';

// Creates a minimal Item scoped to the tenant. Accepts flexible fields and fills defaults.
export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();
        const tenant = getTenantIdFromRequest(req);
        const body = await req.json().catch(() => ({}));
        const name: string = (body?.name ?? '').toString().trim();
        if (!name) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 });

        const stock = Number.isFinite(Number(body?.stock)) ? Number(body.stock) : (
            Number.isFinite(Number(body?.quantity)) ? Number(body.quantity) : 0
        );
        const lowStock = Number.isFinite(Number(body?.lowStock)) ? Number(body.lowStock) : (
            Number.isFinite(Number(body?.minThreshold)) ? Number(body.minThreshold) : 0
        );
        const category = typeof body?.category === 'string' && body.category.trim() ? body.category.trim() : 'General';
        const categories = Array.isArray(body?.categories) && body.categories.length ? body.categories : [category];

        const doc = await ItemModel.create({
            name,
            sku: (body?.sku ?? name).toString().slice(0, 32),
            price: Number.isFinite(Number(body?.price)) ? Number(body.price) : 0,
            cost: Number.isFinite(Number(body?.cost)) ? Number(body.cost) : 0,
            stock,
            lowStock,
            categories,
            imageUrl: (body?.imageUrl ?? 'https://placehold.co/300x200/e2e8f0/475569?text=Item').toString(),
            barCode: (body?.barCode ?? Date.now().toString()).toString(),
            owner: tenant,
            description: (body?.description ?? 'Sin descripción').toString(),
            supplier: (body?.supplier ?? 'Sin proveedor').toString(),
            isAvailableForSale: true,
            variants: Array.isArray(body?.variants) ? body.variants : [],
        });
        return NextResponse.json(doc, { status: 201 });
    } catch (e) {
        console.error('POST /api/inventory/add error', e);
        return NextResponse.json({ error: 'Error al crear producto de inventario' }, { status: 500 });
    }
}

