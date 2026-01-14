import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import ItemModel from '@/models/Item';
import { getTenantIdFromRequest } from '@/lib/tenant';
import { requireAuth } from '@/lib/apiAuth';

const isValidObjectId = (val: string) => /^[0-9a-fA-F]{24}$/.test(val);

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

// PUT para actualizar un producto existente
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectToDatabase();
        const auth = await requireAuth(req, 'products.manage');
        if (!auth.ok) return auth.res;

        const { id } = await params;
        if (!id || !isValidObjectId(id)) {
            return NextResponse.json({ error: 'id_invalido' }, { status: 400 });
        }
        const body = await req.json().catch(() => ({} as Record<string, unknown>));
        const tenant = auth.ctx.account.tenantId || getTenantIdFromRequest(req);
        type Incoming = { category?: unknown; categories?: unknown } & Record<string, unknown>;
        const { category, categories, owner: _ignoredOwner, ...rest } = (body ?? {}) as Incoming;
        const normalized = normalizeCats(categories);
        const categoryFallback = typeof category === 'string' && category.trim() ? [category.trim()] : [];
        const finalCats = normalized.length > 0 ? normalized : (categoryFallback.length ? categoryFallback : ['General']);

        const updateData: Record<string, unknown> = { ...rest, categories: finalCats };
        const updatedItem = await ItemModel.findOneAndUpdate({ _id: id, owner: tenant }, updateData, { new: true });
        if (!updatedItem) {
            return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
        }
        return NextResponse.json(updatedItem);
    } catch (error) {
        console.error('PUT /api/products/[id] error', error);
        return NextResponse.json({ error: 'Error al actualizar el producto' }, { status: 500 });
    }
}

// DELETE para eliminar un producto
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectToDatabase();
        const auth = await requireAuth(req, 'products.manage');
        if (!auth.ok) return auth.res;

        const { id } = await params;
        if (!id || !isValidObjectId(id)) {
            return NextResponse.json({ error: 'id_invalido' }, { status: 400 });
        }
        const tenant = auth.ctx.account.tenantId || getTenantIdFromRequest(req);
        const deletedItem = await ItemModel.findOneAndDelete({ _id: id, owner: tenant });
        if (!deletedItem) {
            return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
        }
        return NextResponse.json({ message: 'Producto eliminado exitosamente' });
    } catch (error) {
        console.error('DELETE /api/products/[id] error', error);
        return NextResponse.json({ error: 'Error al eliminar el producto' }, { status: 500 });
    }
}
