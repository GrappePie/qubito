import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Notification } from '@/models/Notification';
import ItemModel from '@/models/Item';
import { getTenantIdFromRequest } from '@/lib/tenant';

const DEFAULT_LOW_STOCK_THRESHOLD = 5;

export async function GET(req: NextRequest) {
    await connectToDatabase();
    const tenant = getTenantIdFromRequest(req);

    // Items with stock lower or equal than lowStock (or default threshold)
    const lowStockProducts = await ItemModel.find({ owner: tenant, $expr: { $lte: ["$stock", { $ifNull: ["$lowStock", DEFAULT_LOW_STOCK_THRESHOLD] }] } }).lean();

    const notifications = await Notification.find({ tenantId: tenant, trigger: 'low_stock', enabled: true });

    const logs: string[] = [];
    for (const notif of notifications) {
        for (const product of lowStockProducts) {
            logs.push(`Se enviaría notificación (${notif.type}) a ${notif.address} por bajo stock de ${product.name} (stock: ${product.stock})`);
        }
    }

    return NextResponse.json({ logs, lowStockProducts, notifications });
}
