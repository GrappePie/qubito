import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Product } from '@/models/Product';
import AdjustmentHistory from '@/models/AdjustmentHistory';

export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();
        const { productId, newStock, reason } = await req.json();

        if (!productId || newStock === undefined || newStock < 0) {
            return NextResponse.json({ error: 'Faltan parámetros o son inválidos' }, { status: 400 });
        }

        // Obtener el producto actual para registrar el stock anterior
        const product = await Product.findById(productId);
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
            date: new Date()
        });

        const updatedProduct = await Product.findByIdAndUpdate(
            productId,
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
