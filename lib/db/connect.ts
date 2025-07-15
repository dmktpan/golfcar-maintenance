import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

// การตรวจสอบ MONGODB_URI นอกฟังก์ชัน connectDB ยังคงมีความสำคัญ
// เพื่อให้แน่ใจว่าแอปจะ terminate ตั้งแต่เนิ่นๆ หากไม่มี URI
if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env'
  );
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents creating new connections every time hot reload occurs.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    // เพิ่มการตรวจสอบ MONGODB_URI ที่นี่อีกครั้ง เพื่อให้ TypeScript รู้ว่ามันเป็น string แน่นอน
    // (แม้ว่าจริงๆแล้ว มันก็ควรจะเป็น string อยู่แล้วจากการตรวจสอบด้านบน)
    if (typeof MONGODB_URI !== 'string' || MONGODB_URI.length === 0) {
      throw new Error('MONGODB_URI is invalid or not defined at connection time.');
    }

    const opts = {
      bufferCommands: false,
    };

    // ตอนนี้ TypeScript จะรู้ว่า MONGODB_URI เป็น string แล้ว
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
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