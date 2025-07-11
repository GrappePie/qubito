import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Notification } from '@/models/Notification';
import { Product } from '@/models/Product';

const LOW_STOCK_THRESHOLD = 5;

export async function GET() {
    await connectToDatabase();

    const lowStockProducts = await Product.find({ stock: { $lt: LOW_STOCK_THRESHOLD } });

    const notifications = await Notification.find({ trigger: 'low_stock', enabled: true });

    const logs: string[] = [];
    for (const notif of notifications) {
        for (const product of lowStockProducts) {
            logs.push(`Se enviaría notificación (${notif.type}) a ${notif.address} por bajo stock de ${product.name} (stock: ${product.stock})`);
        }
    }

    return NextResponse.json({ logs, lowStockProducts, notifications });
}
