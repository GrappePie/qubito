import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import ItemModel from '@/models/Item';
import { NextRequest } from 'next/server';
import { getTenantIdFromRequest } from '@/lib/tenant';

export async function GET(req: NextRequest) {
    await connectToDatabase();
    const tenant = getTenantIdFromRequest(req);
    const products = await ItemModel.find({ owner: tenant }).lean();
    return NextResponse.json(products);
}

