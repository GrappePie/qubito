import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import ItemModel from '@/models/Item';

// GET para obtener todos los productos
export async function GET() {
    try {
        await connectToDatabase();
        const items = await ItemModel.find({});
        return NextResponse.json(items);
    } catch (error) {
        return NextResponse.json({ error: 'Error al obtener los productos' }, { status: 500 });
    }
}

// POST para crear un nuevo producto
export async function POST(req: Request) {
    try {
        await connectToDatabase();
        const body = await req.json();
        // El formulario envía una categoría como string, la guardamos en un array
        const itemData = { ...body, categories: [body.category || 'General'] };
        delete itemData.category;
        const newItem = new ItemModel(itemData);
        await newItem.save();
        return NextResponse.json(newItem, { status: 201 });
    } catch (error) {
         return NextResponse.json({ error: 'Error al crear el producto' }, { status: 500 });
    }
}

