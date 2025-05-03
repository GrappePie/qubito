import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Product } from '@/models/Product';
import { parse } from 'csv-parse/sync';

export async function POST(req: Request) {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = file.name.split('.').pop();
    let items = [];

    if (ext === 'csv') {
        const csvText = buffer.toString('utf-8');
        items = parse(csvText, {
            columns: true,
            skip_empty_lines: true,
        });
    } else if (ext === 'json') {
        const jsonText = buffer.toString('utf-8');
        items = JSON.parse(jsonText);
    }

    await connectToDatabase();
    await Product.insertMany(items);

    return NextResponse.json({ status: 'ok', inserted: items.length });
}
