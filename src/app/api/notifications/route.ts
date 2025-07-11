import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Notification } from '@/models/Notification';

export async function GET() {
    await connectToDatabase();
    const notifications = await Notification.find();
    return NextResponse.json(notifications);
}

export async function POST(req: Request) {
    const data = await req.json();
    await connectToDatabase();
    const newNotification = await Notification.create(data);
    return NextResponse.json(newNotification);
}

export async function PUT(req: Request) {
    const url = new URL(req.url || '', 'http://localhost');
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    const data = await req.json();
    await connectToDatabase();
    const updated = await Notification.findByIdAndUpdate(id, data, { new: true });
    if (!updated) return NextResponse.json({ error: 'No encontrada' }, { status: 404 });
    return NextResponse.json(updated);
}

export async function DELETE(req: Request) {
    const url = new URL(req.url || '', 'http://localhost');
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    await connectToDatabase();
    const deleted = await Notification.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ error: 'No encontrada' }, { status: 404 });
    return NextResponse.json({ success: true });
}
