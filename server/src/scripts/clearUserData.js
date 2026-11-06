import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
dotenv.config({ path: path.join(__dirname, '../../.env') });

import { Client } from '../models/Client.js';
import { Enquiry } from '../models/Enquiry.js';
import { ProjectWorkflow } from '../models/ProjectWorkflow.js';
import { DepartmentApproval } from '../models/DepartmentApproval.js';
import { WorkflowHistory } from '../models/WorkflowHistory.js';
import { Quotation } from '../models/Quotation.js';
import { Followup } from '../models/Followup.js';
import { Approval } from '../models/Approval.js';
import { PurchaseOrder } from '../models/PurchaseOrder.js';
import { AuditLog } from '../models/AuditLog.js';
import { Counter } from '../models/Counter.js';
import { User } from '../models/User.js';
import { Department } from '../models/Department.js';
import { SystemSetting } from '../models/SystemSetting.js';

async function clearData() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set in .env');
    process.exit(1);
  }

  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('Connected successfully.\n');

    console.log('--- CURRENT DOCUMENT COUNTS BEFORE PURGE ---');
    console.log('Clients:', await Client.countDocuments());
    console.log('Enquiries:', await Enquiry.countDocuments());
    console.log('ProjectWorkflows:', await ProjectWorkflow.countDocuments());
    console.log('DepartmentApprovals:', await DepartmentApproval.countDocuments());
    console.log('WorkflowHistories:', await WorkflowHistory.countDocuments());
    console.log('Quotations:', await Quotation.countDocuments());
    console.log('Followups:', await Followup.countDocuments());
    console.log('Approvals:', await Approval.countDocuments());
    console.log('PurchaseOrders:', await PurchaseOrder.countDocuments());
    console.log('AuditLogs:', await AuditLog.countDocuments());
    console.log('Counters:', await Counter.countDocuments());
    console.log('Users (PRESERVED):', await User.countDocuments());
    console.log('Departments (PRESERVED):', await Department.countDocuments());
    console.log('SystemSettings (PRESERVED):', await SystemSetting.countDocuments());
    console.log('--------------------------------------------\n');

    console.log('Purging user client data and project data...');
    const [
      clientsRes,
      enquiriesRes,
      workflowsRes,
      deptApprovalsRes,
      workflowHistRes,
      quotationsRes,
      followupsRes,
      approvalsRes,
      posRes,
      auditLogsRes,
      countersRes
    ] = await Promise.all([
      Client.deleteMany({}),
      Enquiry.deleteMany({}),
      ProjectWorkflow.deleteMany({}),
      DepartmentApproval.deleteMany({}),
      WorkflowHistory.deleteMany({}),
      Quotation.deleteMany({}),
      Followup.deleteMany({}),
      Approval.deleteMany({}),
      PurchaseOrder.deleteMany({}),
      AuditLog.deleteMany({}),
      Counter.deleteMany({})
    ]);

    console.log('\n--- DELETION SUMMARY ---');
    console.log(`Deleted Clients: ${clientsRes.deletedCount}`);
    console.log(`Deleted Enquiries: ${enquiriesRes.deletedCount}`);
    console.log(`Deleted ProjectWorkflows: ${workflowsRes.deletedCount}`);
    console.log(`Deleted DepartmentApprovals: ${deptApprovalsRes.deletedCount}`);
    console.log(`Deleted WorkflowHistories: ${workflowHistRes.deletedCount}`);
    console.log(`Deleted Quotations: ${quotationsRes.deletedCount}`);
    console.log(`Deleted Followups: ${followupsRes.deletedCount}`);
    console.log(`Deleted Approvals: ${approvalsRes.deletedCount}`);
    console.log(`Deleted PurchaseOrders: ${posRes.deletedCount}`);
    console.log(`Deleted AuditLogs: ${auditLogsRes.deletedCount}`);
    console.log(`Reset Counters: ${countersRes.deletedCount}`);
    console.log('------------------------\n');

    console.log('--- REMAINING SYSTEM DATA (PRESERVED) ---');
    const users = await User.find({}, 'name email role');
    console.log('Active Users:');
    users.forEach(u => console.log(` - [${u.role}] ${u.name} (${u.email})`));
    const depts = await Department.countDocuments();
    console.log(`Departments Count: ${depts}`);
    const settings = await SystemSetting.countDocuments();
    console.log(`SystemSettings Count: ${settings}`);
    console.log('-----------------------------------------\n');

    console.log('Data purge completed successfully. The system is clean and ready for user data.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error during data purge:', err);
    process.exit(1);
  }
}

clearData();

