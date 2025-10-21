import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import CategoryModel from '@/models/Category';
import { getTenantIdFromRequest } from '@/lib/tenant';

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

// GET /api/categories -> list active categories for current tenant
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const tenant = getTenantIdFromRequest(req);
    const categories = await CategoryModel.find({ owner: tenant, isActive: { $ne: false } })
      .sort({ name: 1 })
      .lean();
    return NextResponse.json(categories);
  } catch {
    return NextResponse.json({ error: 'Error al obtener categorías' }, { status: 500 });
  }
}

// POST /api/categories -> create category for current tenant, avoiding name duplicates (case-insensitive)
export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const tenant = getTenantIdFromRequest(req);
    const name: string = (body?.name ?? '').trim();
    if (!name) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 });

    const existing = await CategoryModel.findOne({ owner: tenant, name: { $regex: `^${name}$`, $options: 'i' } });
    if (existing) return NextResponse.json(existing, { status: 200 });

    const nowId = slugify(name) || 'categoria';
    const doc = new CategoryModel({
      categoryId: `${nowId}-${Date.now()}`,
      name,
      description: (body?.description ?? 'Sin descripción').toString().trim(),
      imageUrl: (body?.imageUrl ?? 'https://placehold.co/96x96/e2e8f0/475569?text=CAT').toString().trim(),
      parentCategoryId: body?.parentCategoryId ?? null,
      isActive: true,
      products: [],
      owner: tenant,
    });
    await doc.save();
    return NextResponse.json(doc, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Error al crear la categoría' }, { status: 500 });
  }
}

