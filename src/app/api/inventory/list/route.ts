import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import ItemModel from '@/models/Item';
import { NextRequest } from 'next/server';
import { getTenantIdFromRequest } from '@/lib/tenant';
import { requireAuth } from '@/lib/apiAuth';

export async function GET(req: NextRequest) {
    await connectToDatabase();
    const auth = await requireAuth(req, 'inventory.manage');
    if (!auth.ok) return auth.res;
    const tenant = auth.ctx.account.tenantId || getTenantIdFromRequest(req);
    const products = await ItemModel.find({ owner: tenant }).lean();
    return NextResponse.json(products);
}
