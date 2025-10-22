import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import ItemModel from '@/models/Item';
import { parse } from 'csv-parse/sync';
import { getTenantIdFromRequest } from '@/lib/tenant';

type RawRow = Record<string, unknown>;

function toStringVal(v: unknown, d = ''): string {
    return typeof v === 'string' ? v : v == null ? d : String(v);
}
function toNumberVal(v: unknown, d = 0): number {
    const n = typeof v === 'string' ? Number(v) : (v as number);
    return Number.isFinite(n) ? Number(n) : d;
}
function getStr(row: RawRow, ...keys: string[]): string {
    for (const k of keys) {
        const val = row[k];
        if (val != null && String(val).trim() !== '') return toStringVal(val);
    }
    return '';
}
function getNum(row: RawRow, ...keys: string[]): number {
    for (const k of keys) {
        const val = row[k];
        const n = toNumberVal(val, NaN);
        if (Number.isFinite(n)) return n;
    }
    return 0;
}

export async function POST(req: NextRequest) {
    try {
        const tenant = getTenantIdFromRequest(req);
        const formData = await req.formData();
        const file = formData.get('file') as File | null;
        if (!file) return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 });

        const buffer = Buffer.from(await file.arrayBuffer());
        const ext = (file.name.split('.').pop() || '').toLowerCase();
        let rows: RawRow[] = [];
        if (ext === 'csv') {
            rows = parse(buffer.toString('utf-8'), { columns: true, skip_empty_lines: true }) as RawRow[];
        } else if (ext === 'json') {
            rows = JSON.parse(buffer.toString('utf-8')) as RawRow[];
        } else {
            return NextResponse.json({ error: 'Formato no soportado' }, { status: 400 });
        }

        await connectToDatabase();
        for (const r of rows) {
            const name = toStringVal(r.name).trim();
            if (!name) continue;
            const payload = {
                name,
                sku: toStringVal(r.sku, name).slice(0, 64),
                price: toNumberVal(r.price, 0),
                cost: toNumberVal(r.cost, 0),
                stock: getNum(r, 'stock', 'quantity'),
                lowStock: getNum(r, 'lowStock', 'minThreshold'),
                categories: Array.isArray(r.categories)
                    ? (r.categories as unknown[]).map((c) => toStringVal(c)).filter(Boolean)
                    : [toStringVal(r.category, 'General') || 'General'],
                imageUrl: toStringVal(r.imageUrl, 'https://placehold.co/300x200/e2e8f0/475569?text=Item'),
                barCode: getStr(r, 'barCode', 'barcode') || String(Date.now()),
                owner: tenant,
                description: toStringVal(r.description, 'Sin descripción'),
                supplier: toStringVal(r.supplier, 'Sin proveedor'),
                isAvailableForSale: true,
                variants: [],
            } as Record<string, unknown>;

            // Upsert by tenant+sku to avoid duplicates
            await ItemModel.updateOne(
                { owner: tenant, sku: payload.sku as string },
                { $set: payload },
                { upsert: true }
            );
        }

        return NextResponse.json({ status: 'ok', processed: rows.length });
    } catch (e) {
        console.error('POST /api/inventory/upload error', e);
        return NextResponse.json({ error: 'Error al importar inventario' }, { status: 500 });
    }
}
