import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import ItemModel from '@/models/Item';
import { getTenantIdFromRequest } from '@/lib/tenant';

function normalizeCats(cats: unknown): string[] {
  const arr = Array.isArray(cats) ? cats : [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const c of arr) {
    if (typeof c !== 'string') continue;
    const trimmed = c.trim();
    const key = trimmed.toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out;
}

// GET para obtener todos los productos
export async function GET(req: NextRequest) {
    try {
        await connectToDatabase();
        // Scope by tenant owner
        const tenant = getTenantIdFromRequest(req);
        const items = await ItemModel.find({ owner: tenant });
        return NextResponse.json(items);
    } catch {
        return NextResponse.json({ error: 'Error al obtener los productos' }, { status: 500 });
    }
}

// POST para crear un nuevo producto
export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();
        const body = await req.json();
        const tenant = getTenantIdFromRequest(req);
        type Incoming = { category?: unknown; categories?: unknown } & Record<string, unknown>;
        const { category, categories, ...rest } = (body ?? {}) as Incoming;
        const normalized = normalizeCats(categories);
        const categoryFallback = typeof category === 'string' && category.trim() ? [category.trim()] : [];
        const finalCats = normalized.length > 0 ? normalized : (categoryFallback.length ? categoryFallback : ['General']);

        // Force owner to current tenant
        const itemData: Record<string, unknown> = { ...rest, owner: tenant, categories: finalCats };
        const newItem = new ItemModel(itemData);
        await newItem.save();
        return NextResponse.json(newItem, { status: 201 });
    } catch {
         return NextResponse.json({ error: 'Error al crear el producto' }, { status: 500 });
    }
}
