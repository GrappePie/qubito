import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Product } from '@/models/Product';

export async function POST(req: NextRequest) {
    await connectToDatabase();
    const body = await req.json();
    const { name, quantity, minThreshold, unit } = body;
    if (!name || quantity == null || minThreshold == null || !unit) {
        return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
    const product = await Product.create({ name, quantity, minThreshold, unit });
    return NextResponse.json(product);
}

