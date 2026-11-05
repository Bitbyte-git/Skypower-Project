import mongoose from 'mongoose';
import dns from 'dns';
import { ENV } from './env.js';

let mongodInstance = null;

export const connectDB = async () => {
  try {
    const isCloudURI =
      ENV.MONGODB_URI.startsWith('mongodb+srv://') ||
      (!ENV.MONGODB_URI.includes('127.0.0.1') && !ENV.MONGODB_URI.includes('localhost'));

    // Enable Google/Cloudflare DNS fallback for Node.js SRV record lookup on Windows
    if (isCloudURI && ENV.MONGODB_URI.startsWith('mongodb+srv://')) {
      try {
        dns.setServers(['8.8.8.8', '1.1.1.1']);
      } catch (dnsErr) {
        // ignore if not supported in environment
      }
    }

    // Cloud connection timeout: 15s for DNS & TLS handshake; 3s for local fallback
    const serverSelectionTimeoutMS = isCloudURI ? 15000 : 3000;

    const conn = await mongoose.connect(ENV.MONGODB_URI, {
      serverSelectionTimeoutMS
    });

    console.log(`[Database] Connected successfully to MongoDB: ${conn.connection.host}/${conn.connection.name}`);
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

