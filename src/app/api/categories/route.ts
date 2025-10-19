import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import CategoryModel from '@/models/Category';

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

// GET /api/categories -> lista categorías activas por nombre asc
export async function GET() {
  try {
    await connectToDatabase();
    const categories = await CategoryModel.find({ isActive: { $ne: false } }).sort({ name: 1 }).lean();
    return NextResponse.json(categories);
  } catch {
    return NextResponse.json({ error: 'Error al obtener categorías' }, { status: 500 });
  }
}

// POST /api/categories -> crea una categoría, evitando nombres duplicados (case-insensitive)
export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const name: string = (body?.name ?? '').trim();
    if (!name) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 });

    const existing = await CategoryModel.findOne({ name: { $regex: `^${name}$`, $options: 'i' } });
    if (existing) return NextResponse.json(existing, { status: 200 });

    const nowId = slugify(name) || 'categoria';
    const doc = new CategoryModel({
      categoryId: `${nowId}-${Date.now()}`,
      name,
      description: body?.description?.trim() || 'Sin descripción',
      imageUrl: body?.imageUrl?.trim() || 'https://placehold.co/96x96/e2e8f0/475569?text=CAT',
      parentCategoryId: body?.parentCategoryId ?? null,
      isActive: true,
      products: [],
    });
    await doc.save();
    return NextResponse.json(doc, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Error al crear la categoría' }, { status: 500 });
  }
}
