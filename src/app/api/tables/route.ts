import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { requireAuth } from '@/lib/apiAuth';
import RestaurantTableModel, { RestaurantTable } from '@/models/RestaurantTable';
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

async function ensureDefaultTables(tenantId: string, quantity: number) {
  const existing = await RestaurantTableModel.countDocuments({ tenantId });
  if (existing > 0) return;

  const safeQuantity = Number.isInteger(quantity) && quantity > 0 ? Math.min(quantity, 200) : 10;
  await RestaurantTableModel.insertMany(
    Array.from({ length: safeQuantity }, (_, index) => {
      const number = index + 1;
      return {
        tenantId,
        tableId: String(number),
        name: `Mesa ${number}`,
        sortOrder: number,
        isActive: true,
        legacyNumber: number,
      };
    })
  );
}

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const auth = await requireAuth(req, 'tables.manage');
    if (!auth.ok) return auth.res;

    const tenantId = auth.ctx.account.tenantId;
    const includeInactive = new URL(req.url).searchParams.get('includeInactive') === '1';
    await ensureDefaultTables(tenantId, auth.ctx.account.settings?.tableQuantity ?? 10);

    const filter = includeInactive ? { tenantId } : { tenantId, isActive: true };
    const tables = await RestaurantTableModel.find(filter).sort({ sortOrder: 1, legacyNumber: 1 }).lean();
    return NextResponse.json({ tables: tables.map((table) => serializeTable(table)) });
  } catch (error) {
    console.error('GET /api/tables error', error);
    return NextResponse.json({ error: 'Error al obtener mesas' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const auth = await requireAuth(req, 'tables.configure');
    if (!auth.ok) return auth.res;

    const tenantId = auth.ctx.account.tenantId;
    await ensureDefaultTables(tenantId, auth.ctx.account.settings?.tableQuantity ?? 10);

    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    const rawName = typeof body?.name === 'string' ? body.name : '';
    const name = rawName.trim().slice(0, 60);
    if (!name) {
      return NextResponse.json({ error: 'name_required' }, { status: 400 });
    }

    const last = await RestaurantTableModel.findOne({ tenantId }).sort({ sortOrder: -1 }).lean();
    const table = await RestaurantTableModel.create({
      tenantId,
      tableId: randomUUID(),
      name,
      sortOrder: (last?.sortOrder ?? 0) + 1,
      isActive: true,
      legacyNumber: null,
    });

    return NextResponse.json({ table: serializeTable(table) }, { status: 201 });
  } catch (error) {
    console.error('POST /api/tables error', error);
    return NextResponse.json({ error: 'Error al crear mesa' }, { status: 500 });
  }
}
