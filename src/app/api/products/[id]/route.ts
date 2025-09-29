import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import ItemModel from '@/models/Item';

// PUT para actualizar un producto existente
export async function PUT(req: Request, { params }: { params: { id: string } }) {
    try {
        await connectToDatabase();
        const { id } = params;
        const body = await req.json();
        // El formulario envía una categoría como string, la guardamos en un array
        const updateData = { ...body, categories: [body.category || 'General'] };
        delete updateData.category;
        const updatedItem = await ItemModel.findByIdAndUpdate(id, updateData, { new: true });
        if (!updatedItem) {
            return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
        }
        return NextResponse.json(updatedItem);
    } catch (error) {
        return NextResponse.json({ error: 'Error al actualizar el producto' }, { status: 500 });
    }
}

// DELETE para eliminar un producto
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        await connectToDatabase();
        const { id } = params;
        const deletedItem = await ItemModel.findByIdAndDelete(id);
        if (!deletedItem) {
            return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
        }
        return NextResponse.json({ message: 'Producto eliminado exitosamente' });
    } catch (error) {
        return NextResponse.json({ error: 'Error al eliminar el producto' }, { status: 500 });
    }
}

