// lib/db/connect.ts
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env'
  );
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    // วิธีแก้ไขที่ 1: ใช้ Type Assertion (ง่ายที่สุด)
    // cached.promise = mongoose.connect(MONGODB_URI as string, opts).then((mongoose) => {
    //   return mongoose;
    // });

    // วิธีแก้ไขที่ 2 (แนะนำ): ตรวจสอบซ้ำอีกครั้งเพื่อให้ TypeScript แน่ใจ
    // การตรวจสอบนี้จริง ๆ แล้วควรจะเพียงพอแล้วใน TypeScript เวอร์ชันใหม่ ๆ
    // แต่ถ้ายังฟ้อง Type Error อยู่ ให้ใช้ Type Assertion ใน Option 1
    cached.promise = mongoose.connect(MONGODB_URI as string, opts).then((mongoose) => {
      return mongoose;
    });
  }
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;