import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import AdjustmentHistory from '@/models/AdjustmentHistory';
import { getTenantIdFromRequest } from '@/lib/tenant';
import { requireAuth } from '@/lib/apiAuth';

export async function GET(req: NextRequest) {
    try {
        await connectToDatabase();
        const auth = await requireAuth(req, 'inventory.manage');
        if (!auth.ok) return auth.res;
        const tenant = auth.ctx.account.tenantId || getTenantIdFromRequest(req);
        const { searchParams } = new URL(req.url);
        const productId = searchParams.get('productId');
        const filter: Record<string, unknown> = { tenantId: tenant };
        if (productId) filter.productId = productId;
        const history = await AdjustmentHistory.find(filter).sort({ date: -1 }).lean();
        return NextResponse.json({ success: true, history });
    } catch (error) {
        console.error('Error al obtener el historial de ajustes:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
