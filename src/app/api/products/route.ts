import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import ItemModel from '@/models/Item';

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
export async function GET() {
    try {
        await connectToDatabase();
        const items = await ItemModel.find({});
        return NextResponse.json(items);
    } catch {
        return NextResponse.json({ error: 'Error al obtener los productos' }, { status: 500 });
    }
}

// POST para crear un nuevo producto
export async function POST(req: Request) {
    try {
        await connectToDatabase();
        const body = await req.json();
        type Incoming = { category?: unknown; categories?: unknown } & Record<string, unknown>;
        const { category, categories, ...rest } = (body ?? {}) as Incoming;
        const normalized = normalizeCats(categories);
        const categoryFallback = typeof category === 'string' && category.trim() ? [category.trim()] : [];
        const finalCats = normalized.length > 0 ? normalized : (categoryFallback.length ? categoryFallback : ['General']);

        const itemData: Record<string, unknown> = { ...rest, categories: finalCats };
        const newItem = new ItemModel(itemData);
        await newItem.save();
        return NextResponse.json(newItem, { status: 201 });
    } catch {
         return NextResponse.json({ error: 'Error al crear el producto' }, { status: 500 });
    }
}
