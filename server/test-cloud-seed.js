import mongoose from 'mongoose';
import dns from 'dns';
import { ENV } from './src/config/env.js';
import { connectDB } from './src/config/db.js';
import { seedInitialData } from './src/services/seedService.js';
import { Department } from './src/models/Department.js';
import { User } from './src/models/User.js';
import { Client } from './src/models/Client.js';
import { Enquiry } from './src/models/Enquiry.js';
import { ProjectWorkflow } from './src/models/ProjectWorkflow.js';

async function verifyAndSeed() {
  console.log('=== VERIFYING CLOUD MONGODB ATLAS CONNECTION ===\n');
  console.log(`Target URI: ${ENV.MONGODB_URI.replace(/:[^:]*@/, ':****@')}`);

  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
    const conn = await mongoose.connect(ENV.MONGODB_URI, {
      serverSelectionTimeoutMS: 15000
    });

    console.log('\n[SUCCESS] Successfully connected to MongoDB Atlas!');
    console.log(`  Host: ${conn.connection.host}`);
    console.log(`  Database Name: ${conn.connection.name}`);
    console.log(`  Connection State: ${conn.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED'}`);

    // Ping admin database
    const admin = conn.connection.db.admin();
    const pingResult = await admin.ping();
    console.log('  Atlas Ping:', pingResult);

    console.log('\n=== SEEDING INITIAL ENTERPRISE DATA ===');
    await seedInitialData();

    // Verify seeded collections
    const [deptCount, userCount, clientCount, enqCount, workflowCount] = await Promise.all([
      Department.countDocuments(),
      User.countDocuments(),
      Client.countDocuments(),
      Enquiry.countDocuments(),
      ProjectWorkflow.countDocuments()
    ]);

    console.log('\n[DATABASE STATUS]');
    console.log(`  Departments: ${deptCount} (10 Workflow Stages)`);
    console.log(`  Users: ${userCount} (Admin, Manager, Sales)`);
    console.log(`  Clients: ${clientCount}`);
    console.log(`  Enquiries: ${enqCount}`);
    console.log(`  Project Workflows: ${workflowCount}`);

    console.log('\n[DEFAULT CREDENTIALS (ONLY 3 ROLES)]');
    console.log('  1. Sales & Marketing: sales@skypower.co.in   / Sales@123');
    console.log('  2. General Manager:   manager@skypower.co.in / Manager@123');
    console.log('  3. Executive Admin:   admin@skypower.co.in   / Admin@123');

    console.log('\n=== SEEDING TO CLOUD COMPLETED SUCCESSFULLY! ===');
  } catch (err) {
    console.error('\n[CONNECTION ERROR] Failed to connect or seed cloud database:');
    console.error(err.message);
    if (err.message.includes('bad auth') || err.message.includes('Authentication failed')) {
      console.error('Note: Authentication failed. Please verify the Atlas database username and password.');
    } else if (err.message.includes('whitelist') || err.message.includes('connection refused') || err.message.includes('getaddrinfo')) {
      console.error('Note: IP Whitelist issue or network barrier. Ensure "0.0.0.0/0" is added to MongoDB Atlas Network Access.');
    }
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

verifyAndSeed();
