import mongoose from 'mongoose';
import { ENV } from './env.js';

let mongodInstance = null;

export const connectDB = async () => {
  try {
    // First try connecting to configured URI with short timeout
    const conn = await mongoose.connect(ENV.MONGODB_URI, {
      serverSelectionTimeoutMS: 2500
    });
    console.log(`[Database] Connected to MongoDB at: ${conn.connection.host}:${conn.connection.port}/${conn.connection.name}`);
    return conn;
  } catch (primaryErr) {
    console.warn(`[Database] Could not connect to primary MongoDB (${ENV.MONGODB_URI}): ${primaryErr.message}`);
    console.log('[Database] Initiating embedded MongoDB Memory Server for seamless local execution...');
    
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      mongodInstance = await MongoMemoryServer.create();
      const inMemoryUri = mongodInstance.getUri();
      const conn = await mongoose.connect(inMemoryUri);
      console.log(`[Database] In-Memory MongoDB running successfully at ${inMemoryUri}`);
      return conn;
    } catch (fallbackErr) {
      console.error('[Database] Failed to launch embedded MongoMemoryServer:', fallbackErr.message);
      throw fallbackErr;
    }
  }
};

export const disconnectDB = async () => {
  await mongoose.disconnect();
  if (mongodInstance) {
    await mongodInstance.stop();
  }
};

