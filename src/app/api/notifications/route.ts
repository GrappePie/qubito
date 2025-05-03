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
