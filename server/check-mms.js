import { MongoMemoryServer } from 'mongodb-memory-server';

async function check() {
  try {
    console.log('Testing MongoMemoryServer...');
    const server = await MongoMemoryServer.create();
    console.log('Created! URI:', server.getUri());
    await server.stop();
  } catch (err) {
    console.error('Error in MMS:', err.message);
  }
}

check();

