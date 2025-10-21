import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Notification } from '@/models/Notification';
import { getTenantIdFromRequest } from '@/lib/tenant';

export async function GET(req: NextRequest) {
    await connectToDatabase();
    const tenant = getTenantIdFromRequest(req);
    const notifications = await Notification.find({ tenantId: tenant });
    return NextResponse.json(notifications);
}

export async function POST(req: NextRequest) {
    const data = await req.json();
    await connectToDatabase();
    const tenant = getTenantIdFromRequest(req);
    const newNotification = await Notification.create({ ...data, tenantId: tenant });
    return NextResponse.json(newNotification);
}

export async function PUT(req: NextRequest) {
    const url = new URL(req.url || '', 'http://localhost');
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    const data = await req.json();
    await connectToDatabase();
    const tenant = getTenantIdFromRequest(req);
    const updated = await Notification.findOneAndUpdate({ _id: id, tenantId: tenant }, data, { new: true });
    if (!updated) return NextResponse.json({ error: 'No encontrada' }, { status: 404 });
    return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
    const url = new URL(req.url || '', 'http://localhost');
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    await connectToDatabase();
    const tenant = getTenantIdFromRequest(req);
    const deleted = await Notification.findOneAndDelete({ _id: id, tenantId: tenant });
    if (!deleted) return NextResponse.json({ error: 'No encontrada' }, { status: 404 });
    return NextResponse.json({ success: true });
}
