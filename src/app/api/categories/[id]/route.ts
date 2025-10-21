import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import CategoryModel from '@/models/Category';
import { getTenantIdFromRequest } from '@/lib/tenant';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();
    const tenant = getTenantIdFromRequest(req);
    const update: Record<string, unknown> = {};
    if (typeof body.name === 'string') update.name = body.name.trim();
    if (typeof body.description === 'string') update.description = body.description.trim();
    if (typeof body.imageUrl === 'string') update.imageUrl = body.imageUrl.trim();
    if (typeof body.parentCategoryId === 'string' || body.parentCategoryId === null) update.parentCategoryId = body.parentCategoryId;
    if (typeof body.isActive === 'boolean') update.isActive = body.isActive;

    const doc = await CategoryModel.findOneAndUpdate({ _id: id, owner: tenant }, update, { new: true });
    if (!doc) return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 404 });
    return NextResponse.json(doc);
  } catch {
    return NextResponse.json({ error: 'Error al actualizar la categoría' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const tenant = getTenantIdFromRequest(req);
    const doc = await CategoryModel.findOneAndUpdate({ _id: id, owner: tenant }, { isActive: false }, { new: true });
    if (!doc) return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Error al eliminar la categoría' }, { status: 500 });
  }
}

