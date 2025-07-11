import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) throw new Error('MONGODB_URI is not defined');

interface MongooseGlobalCache {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
}

declare global {
    var mongoose: MongooseGlobalCache | undefined;
}

const cached: MongooseGlobalCache = globalThis.mongoose || { conn: null, promise: null };
export async function connectToDatabase() {
    if (cached.conn) return cached.conn;

    if (!cached.promise) {
        cached.promise = mongoose.connect(MONGODB_URI, {
            dbName: 'inventoryApp',
        }).then(conn => conn);
    }

    cached.conn = await cached.promise;
    (global as unknown as { mongoose?: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } }).mongoose = cached;
    return cached.conn;
}
