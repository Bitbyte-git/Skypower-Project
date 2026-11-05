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
        name: 'Rajesh Sharma (Sr. Sales Engineer)',
        email: 'sales@skypower.co.in',
        password: 'Sales@123',
        role: USER_ROLES.SALES,
        phone: '9822012345',
        department: 'Marketing & Commercial Engineering'
      });
      console.log('[Seed] Sky Power Sales user created: sales@skypower.co.in / Sales@123');
    }

    // Clean up any legacy PO Team login accounts (Only 3 roles: SALES, MANAGER, ADMIN)
    await User.deleteMany({ email: 'po@skypower.co.in' });

    // 4. Ensure initial clients exist
    const clientCount = await Client.countDocuments();
    if (clientCount === 0) {
      const sampleClient1 = await Client.create({
        clientId: await generateNextClientID(),
        companyName: 'Larsen & Toubro Ltd. (T&D Division)',
        clientLocation: 'Chennai, Tamil Nadu',
        contactPerson: 'S. Sundaram (Chief Electrical Engineer)',
        mobile: '9840198401',
        officePhone: '04422501000',
        email: 's.sundaram@lntpower.com',
        website: 'https://www.larsentoubro.com',
        customerType: 'EPC Contractor',
        billingAddress: {
          street: 'Mount Poonamallee Road, Manapakkam',
          city: 'Chennai',
          state: 'Tamil Nadu',
          postalCode: '600089',
          country: 'India'
        },
        gstNumber: '33AAACL0140P1ZX',
        createdBy: salesUser._id
      });

      const sampleClient2 = await Client.create({
        clientId: await generateNextClientID(),
        companyName: 'Tata Power Company Limited',
        clientLocation: 'Mumbai, Maharashtra',
        contactPerson: 'Vikram Joshi (Procurement Head)',
        mobile: '9820098200',
        officePhone: '02266658282',
        email: 'vjoshi@tatapower.com',
        website: 'https://www.tatapower.com',
        customerType: 'Private Power Producer / IPP',
        billingAddress: {
          street: 'Bombay House, 24 Homi Mody Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          postalCode: '400001',
          country: 'India'
        },
        gstNumber: '27AAACT2727Q1ZW',
        createdBy: salesUser._id
      });

      // Seed an initial enquiry based on Book1.xlsx sample
      const ern1 = await generateNextERN();
      await Enquiry.create({
        ern: ern1,
        offerDate: new Date(),
        clientId: sampleClient1._id,
        customerType: sampleClient1.customerType,
        project: {
          projectName: '220/33/22KV Main Receiving Substation (MRSS-3)',
          projectCategory: 'Transmission & Distribution Substation',
          projectLocation: 'Sri City SEZ, Andhra Pradesh',
          projectSiteAddress: 'Sector 4, Industrial Area, Sri City',
          expectedDeliveryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          projectDescription: 'Supply and installation of 22KV VCB Kiosks for plant power intake.',
          projectScope: 'Engineering, Manufacturing, Routine Testing and Supply at site as per IEC 62271-200.',
          specialRequirements: 'Seismic Zone III withstand, IP55 Outdoor Kiosk enclosure.',
          internalRemarks: 'High priority turnkey tender. Client requires urgent dispatch schedule.',
          referredBy: 'Tata Consulting Engineers'
        },
        products: [
          {
            productName: '22KV Outdoor VCB Kiosk Panel',
            productType: 'HT Switchgear',
            productDescription: '22KV 1250A 26.3kA / 3s Outdoor Vacuum Circuit Breaker Kiosk with motorized draw-out mechanism and numerical relay.',
            voltageRating: '22 kV',
            currentRating: '1250 A',
            breakingCapacity: '26.3 kA / 3s',
            equipmentConfiguration: 'Outdoor Kiosk with Weatherproof Canopy',
            quantity: 4,
            unit: 'Nos',
            estimatedUnitValue: 650000,
            totalProductValue: 2600000,
            technicalSpecifications: 'Busbar: High Conductivity EC Grade Copper; Degree of Protection: IP55; Dual core CT/PT class 0.2s / 5P10; IEC 61850 Protocol.'
          },
          {
            productName: '22KV Bus Coupler Panel',
            productType: 'HT Switchgear',
            productDescription: '22KV 1600A 26.3kA Outdoor Bus Coupler Panel with mechanical and electrical interlocking.',
            voltageRating: '22 kV',
            currentRating: '1600 A',
            breakingCapacity: '26.3 kA / 3s',
            equipmentConfiguration: 'Outdoor Kiosk',
            quantity: 1,
            unit: 'Nos',
            estimatedUnitValue: 800000,
            totalProductValue: 800000,
            technicalSpecifications: '1600A Busbar rating; Motorized breaker rack-in/out; Trip circuit supervision.'
          }
        ],
        enquiryType: ENQUIRY_TYPES.FIRM,
        referredBy: 'Tata Consulting Engineers',
        enquirySource: 'Tender Portal / E-Procurement',
        assignedSalesEngineer: salesUser._id,
        expectedProjectValue: 3400000,
        commands: 'Client demands Siemens SIPROTEC 5 numerical relay with IEC 61850 protocol support and dual trip coil supervision.',
        enquiryRemarks: 'Firm commercial offer to be submitted within 10 days.',
        approvalStatus: APPROVAL_STATUSES.PENDING_APPROVAL,
        commercialStatus: COMMERCIAL_STATUSES.IN_PROGRESS,
        currentRevision: 1
      });

      await initializeProjectWorkflow(sampleEnquiry1, salesUser);
      console.log(`[Seed] Seeded Sky Power switchgear enquiry with ERN: ${ern1}`);
    }

    // Ensure all existing enquiries have ProjectWorkflow initialized
    const existingEnquiries = await Enquiry.find({});
    for (const enq of existingEnquiries) {
      await initializeProjectWorkflow(enq, salesUser);
    }
  } catch (err) {
    console.error('[Seed] Error during seeding:', err.message);
  }
};
