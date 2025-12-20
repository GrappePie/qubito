import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import ItemModel from '@/models/Item';
import AdjustmentHistory from '@/models/AdjustmentHistory';
import { getTenantIdFromRequest } from '@/lib/tenant';
import { requireAuth } from '@/lib/apiAuth';

export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();
        const auth = await requireAuth(req, 'inventory.manage');
        if (!auth.ok) return auth.res;
        const { productId, newStock, reason } = await req.json();
        const tenant = auth.ctx.account.tenantId || getTenantIdFromRequest(req);

        if (!productId || newStock === undefined || newStock < 0) {
            return NextResponse.json({ error: 'Faltan parámetros o son inválidos' }, { status: 400 });
        }

        // Obtener el producto (Item) actual del tenant para registrar el stock anterior
        const product = await ItemModel.findOne({ _id: productId, owner: tenant });
        if (!product) {
            return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
        }
        const previousStock = product.stock;

        // Guardar el ajuste en el historial
        await AdjustmentHistory.create({
            productId,
            previousStock,
            newStock,
            reason,
            date: new Date(),
            tenantId: tenant,
        });

        const updatedProduct = await ItemModel.findOneAndUpdate(
            { _id: productId, owner: tenant },
            { $set: { stock: newStock } },
            { new: true }
        );

        if (!updatedProduct) {
            return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
        }

        return NextResponse.json({ success: true, product: updatedProduct });
    } catch (error) {
        console.error('Error al ajustar el inventario:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
