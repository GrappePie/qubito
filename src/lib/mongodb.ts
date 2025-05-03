import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) throw new Error('MONGODB_URI is not defined');

let cached = (global as any).mongoose || { conn: null, promise: null };

export async function connectToDatabase() {
    if (cached.conn) return cached.conn;

    if (!cached.promise) {
        cached.promise = mongoose.connect(MONGODB_URI, {
            dbName: 'inventoryApp',
        }).then(conn => conn);
    }

    cached.conn = await cached.promise;
    (global as any).mongoose = cached;
    return cached.conn;
}
