import mongoose from 'mongoose';

export const connectDB = async () => {
  const primaryUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/support_desk';
  try {
    const conn = await mongoose.connect(primaryUri, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`[Database Warning] Could not connect to primary MongoDB (${primaryUri}): ${error.message}`);
    
    // In development/testing, fallback to MongoMemoryServer for instant zero-config runtime
    if (process.env.NODE_ENV !== 'production') {
      try {
        console.log('[Database] Initializing in-memory MongoDB fallback...');
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        const mongod = await MongoMemoryServer.create();
        const memUri = mongod.getUri();
        const conn = await mongoose.connect(memUri);
        console.log(`[Database] In-memory MongoDB Connected: ${conn.connection.host} (${memUri})`);
        return;
      } catch (memErr) {
        console.error(`[Database Error] Failed to start in-memory MongoDB: ${memErr.message}`);
      }
    }

    process.exit(1);
  }
};
