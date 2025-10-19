import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import CategoryModel from '@/models/Category';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();
    const update: Record<string, unknown> = {};
    if (typeof body.name === 'string') update.name = body.name.trim();
    if (typeof body.description === 'string') update.description = body.description.trim();
    if (typeof body.imageUrl === 'string') update.imageUrl = body.imageUrl.trim();
    if (typeof body.parentCategoryId === 'string' || body.parentCategoryId === null) update.parentCategoryId = body.parentCategoryId;
    if (typeof body.isActive === 'boolean') update.isActive = body.isActive;

    const doc = await CategoryModel.findByIdAndUpdate(id, update, { new: true });
    if (!doc) return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 404 });
    return NextResponse.json(doc);
  } catch {
    return NextResponse.json({ error: 'Error al actualizar la categoría' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const doc = await CategoryModel.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!doc) return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Error al eliminar la categoría' }, { status: 500 });
  }
}
