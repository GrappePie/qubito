import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import CategoryModel from '@/models/Category';
import { getTenantIdFromRequest } from '@/lib/tenant';
import { requireAuth } from '@/lib/apiAuth';

const isValidObjectId = (val: string) => /^[0-9a-fA-F]{24}$/.test(val);

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const auth = await requireAuth(req, 'categories.manage');
    if (!auth.ok) return auth.res;

    const { id } = await params;
    if (!id || !isValidObjectId(id)) {
      return NextResponse.json({ error: 'id_invalido' }, { status: 400 });
    }
    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    const tenant = auth.ctx.account.tenantId || getTenantIdFromRequest(req);
    const update: Record<string, unknown> = {};
    if (typeof body.name === 'string') update.name = body.name.trim();
    if (typeof body.description === 'string') update.description = body.description.trim();
    if (typeof body.imageUrl === 'string') update.imageUrl = body.imageUrl.trim();
    if (typeof body.parentCategoryId === 'string' || body.parentCategoryId === null) {
      update.parentCategoryId = body.parentCategoryId;
    }
    if (typeof body.isActive === 'boolean') update.isActive = body.isActive;

    const doc = await CategoryModel.findOneAndUpdate({ _id: id, owner: tenant }, update, { new: true });
    if (!doc) return NextResponse.json({ error: 'Categoria no encontrada' }, { status: 404 });
    return NextResponse.json(doc);
  } catch (error) {
    console.error('PUT /api/categories/[id] error', error);
    return NextResponse.json({ error: 'Error al actualizar la categoria' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const auth = await requireAuth(req, 'categories.manage');
    if (!auth.ok) return auth.res;

    const { id } = await params;
    if (!id || !isValidObjectId(id)) {
      return NextResponse.json({ error: 'id_invalido' }, { status: 400 });
    }
    const tenant = auth.ctx.account.tenantId || getTenantIdFromRequest(req);
    const doc = await CategoryModel.findOneAndUpdate(
      { _id: id, owner: tenant },
      { isActive: false },
      { new: true }
    );
    if (!doc) return NextResponse.json({ error: 'Categoria no encontrada' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/categories/[id] error', error);
    return NextResponse.json({ error: 'Error al eliminar la categoria' }, { status: 500 });
  }
}

