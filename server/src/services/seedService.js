import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { SystemSetting } from '../models/SystemSetting.js';
import { Client } from '../models/Client.js';
import { Enquiry } from '../models/Enquiry.js';
import { Department } from '../models/Department.js';
import { ProjectWorkflow } from '../models/ProjectWorkflow.js';
import { DepartmentApproval } from '../models/DepartmentApproval.js';
import { WorkflowHistory } from '../models/WorkflowHistory.js';
import { USER_ROLES } from '../constants/roles.js';
import {
  APPROVAL_STATUSES,
  COMMERCIAL_STATUSES,
  ENQUIRY_TYPES,
  DEPARTMENTS_LIST,
  PROJECT_WORKFLOW_STATUSES,
  DEPARTMENT_APPROVAL_STATUSES
} from '../constants/statuses.js';
import { generateNextERN, generateNextClientID, generateNextProjectTrackingID } from './counterService.js';

export const seedDepartments = async () => {
  for (const dept of DEPARTMENTS_LIST) {
    await Department.findOneAndUpdate(
      { departmentCode: dept.code },
      {
        departmentCode: dept.code,
        departmentName: dept.name,
        sequenceNumber: dept.sequence,
        canViewClientDetails: dept.canViewClientDetails,
        isActive: true
      },
      { upsert: true, new: true }
    );
  }
};

export const initializeProjectWorkflow = async (enquiry, creatorUser = null) => {
  let existing = await ProjectWorkflow.findOne({ enquiryId: enquiry._id });
  if (existing) return existing;

  const departments = await Department.find({ isActive: true }).sort({ sequenceNumber: 1 });
  const projectTrackingId = await generateNextProjectTrackingID();

  const workflow = await ProjectWorkflow.create({
    projectTrackingId,
    enquiryId: enquiry._id,
    currentDepartmentId: departments[0]._id,
    currentDepartmentCode: departments[0].departmentCode,
    currentDepartmentSequence: 1,
    overallStatus: PROJECT_WORKFLOW_STATUSES.DRAFT,
    completionPercentage: 10
  });

  // Create 10 department approval records
  for (const dept of departments) {
    await DepartmentApproval.create({
      workflowId: workflow._id,
      enquiryId: enquiry._id,
      projectTrackingId,
      departmentId: dept._id,
      departmentCode: dept.departmentCode,
      departmentName: dept.departmentName,
      departmentSequence: dept.sequenceNumber,
      status: dept.sequenceNumber === 1 ? DEPARTMENT_APPROVAL_STATUSES.PENDING : DEPARTMENT_APPROVAL_STATUSES.WAITING
    });
  }

  if (creatorUser) {
    await WorkflowHistory.create({
      workflowId: workflow._id,
      enquiryId: enquiry._id,
      projectTrackingId,
      departmentCode: 'SALES',
      departmentName: 'Sales & Marketing',
      action: 'Submitted',
      actionBy: creatorUser._id || creatorUser,
      actionByName: creatorUser.name || 'Sales Engineer',
      actionByRole: creatorUser.role || 'SALES',
      previousStatus: 'None',
      newStatus: PROJECT_WORKFLOW_STATUSES.DRAFT,
      remarks: 'Project requisition initiated in Sales & Marketing.'
    });
  }

  return workflow;
};

export const SEED_USER_IDS = {
  ADMIN: new mongoose.Types.ObjectId('000000000000000000000001'),
  SALES: new mongoose.Types.ObjectId('000000000000000000000002'),
  PO: new mongoose.Types.ObjectId('000000000000000000000003')
};

export const seedInitialData = async () => {
  try {
    // 0. Ensure master departments exist
    await seedDepartments();

    // 1. Ensure System Settings exist
    let settings = await SystemSetting.findOne({ key: 'master_config' });
    if (!settings) {
      settings = await SystemSetting.create({ key: 'master_config' });
    } else {
      settings.companyProfile.name = 'SKY POWER';
      settings.companyProfile.tagline = 'Switch to the Future — HT/LT Switchgear & Panel Engineering';
      settings.companyProfile.email = 'sales@skypower.co.in';
      settings.companyProfile.website = 'www.skypower.co.in';
      await settings.save();
    }

    // 2. Ensure Admin User exists
    let admin = await User.findOne({ email: 'admin@skypower.co.in' });
    if (!admin) {
      admin = await User.findOne({ email: 'admin@voltaswitchgear.com' });
    }
    if (!admin) {
      admin = await User.create({
        _id: SEED_USER_IDS.ADMIN,
        name: 'Executive Director (Admin)',
        email: 'admin@skypower.co.in',
        password: 'Admin@123',
        role: USER_ROLES.ADMIN,
        phone: '9876543210',
        department: 'Corporate Commercial & Operations'
      });
      console.log('[Seed] Sky Power Admin user created: admin@skypower.co.in / Admin@123');
    }

    // 2.1 Ensure Manager User exists
    let manager = await User.findOne({ email: 'manager@skypower.co.in' });
    if (!manager) {
      manager = await User.create({
        name: 'V. Ramanathan (General Manager - Operations)',
        email: 'manager@skypower.co.in',
        password: 'Manager@123',
        role: USER_ROLES.MANAGER,
        phone: '9840298402',
        department: 'Operations & Engineering Management'
      });
      console.log('[Seed] Sky Power Manager user created: manager@skypower.co.in / Manager@123');
    }

    // 3. Ensure Sales Engineer exists
    let salesUser = await User.findOne({ email: 'sales@skypower.co.in' });
    if (!salesUser) {
      salesUser = await User.findOne({ email: 'sales@voltaswitchgear.com' });
    }
    if (!salesUser) {
      salesUser = await User.create({
        _id: SEED_USER_IDS.SALES,
        name: 'Rajesh Sharma (Sr. Sales Engineer)',
        email: 'sales@skypower.co.in',
        password: 'Sales@123',
        role: USER_ROLES.SALES,
        phone: '9822012345',
        department: 'Marketing & Commercial Engineering'
      });
      console.log('[Seed] Sky Power Sales user created: sales@skypower.co.in / Sales@123');
    }

    // 3.1 Ensure PO Team Lead exists
    let poUser = await User.findOne({ email: 'po@skypower.co.in' });
    if (!poUser) {
      poUser = await User.create({
        _id: SEED_USER_IDS.PO,
        name: 'Suresh Kumar (PO Team Lead)',
        email: 'po@skypower.co.in',
        password: 'Po@123',
        role: USER_ROLES.PO_TEAM,
        phone: '9840984098',
        department: 'Purchase Order & Execution'
      });
      console.log('[Seed] Sky Power PO Team user created: po@skypower.co.in / Po@123');
    }
    // 4. Sample clients and enquiries seeding is removed so user can add real data directly
    console.log('[Seed] Database is clean and ready for real client and project data entry.');
  } catch (err) {
    console.error('[Seed] Error during seeding:', err.message);
  }
};
