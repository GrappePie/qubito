import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Product } from '@/models/Product';

export async function GET() {
    await connectToDatabase();
    const products = await Product.find().lean();
    return NextResponse.json(products);
}

