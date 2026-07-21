import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { requireAuth } from '@/lib/apiAuth';
import OrderModel from '@/models/Order';
import RestaurantTableModel from '@/models/RestaurantTable';
import type { RestaurantTable } from '@/models/RestaurantTable';
import type { WithId } from '@/types/common';

function serializeTable(doc: WithId<RestaurantTable>) {
  return {
    id: doc._id.toString(),
    tableId: doc.tableId,
    name: doc.name,
    sortOrder: doc.sortOrder,
    isActive: doc.isActive,
    legacyNumber: doc.legacyNumber ?? null,
  };
}

async function hasPendingOrder(tenantId: string, tableId: string, legacyNumber?: number | null) {
  const legacyFilters =
    typeof legacyNumber === 'number'
      ? [{ tableNumber: legacyNumber }, { contextId: `mesa-${legacyNumber}` }]
      : [];
  return Boolean(
    await OrderModel.exists({
      tenantId,
      status: 'pending',
      $or: [{ tableId }, { contextId: `mesa-${tableId}` }, ...legacyFilters],
    })
  );
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ tableId: string }> }
) {
  try {
    await connectToDatabase();
    const auth = await requireAuth(req, 'tables.configure');
    if (!auth.ok) return auth.res;

    const { tableId } = await params;
    const tenantId = auth.ctx.account.tenantId;
    const table = await RestaurantTableModel.findOne({ tenantId, tableId });
    if (!table) return NextResponse.json({ error: 'not_found' }, { status: 404 });

    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    const updates: Partial<RestaurantTable> = {};
    if (typeof body?.name === 'string') {
      const name = body.name.trim().slice(0, 60);
      if (!name) return NextResponse.json({ error: 'name_required' }, { status: 400 });
      updates.name = name;
    }
    if (typeof body?.sortOrder === 'number' && Number.isFinite(body.sortOrder)) {
      updates.sortOrder = Math.max(1, Math.trunc(body.sortOrder));
    }
    if (typeof body?.isActive === 'boolean') {
      if (!body.isActive && await hasPendingOrder(tenantId, table.tableId, table.legacyNumber)) {
        return NextResponse.json({ error: 'table_has_pending_order' }, { status: 409 });
      }
      updates.isActive = body.isActive;
    }

    const updated = await RestaurantTableModel.findOneAndUpdate(
      { tenantId, tableId },
      updates,
      { new: true }
    );
    if (!updated) return NextResponse.json({ error: 'not_found' }, { status: 404 });

    return NextResponse.json({ table: serializeTable(updated) });
  } catch (error) {
    console.error('PATCH /api/tables/[tableId] error', error);
    return NextResponse.json({ error: 'Error al actualizar mesa' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ tableId: string }> }
) {
  try {
    await connectToDatabase();
    const auth = await requireAuth(req, 'tables.configure');
    if (!auth.ok) return auth.res;

    const { tableId } = await params;
    const tenantId = auth.ctx.account.tenantId;
    const table = await RestaurantTableModel.findOne({ tenantId, tableId });
    if (!table) return NextResponse.json({ error: 'not_found' }, { status: 404 });

    if (await hasPendingOrder(tenantId, table.tableId, table.legacyNumber)) {
      return NextResponse.json({ error: 'table_has_pending_order' }, { status: 409 });
    }

    table.isActive = false;
    await table.save();
    return NextResponse.json({ table: serializeTable(table) });
  } catch (error) {
    console.error('DELETE /api/tables/[tableId] error', error);
    return NextResponse.json({ error: 'Error al desactivar mesa' }, { status: 500 });
  }
}
