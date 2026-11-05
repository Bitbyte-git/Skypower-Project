import mongoose from 'mongoose';
import dns from 'dns';
import { ENV } from './src/config/env.js';
import { connectDB, disconnectDB } from './src/config/db.js';
import { User } from './src/models/User.js';
import { Client } from './src/models/Client.js';
import { Enquiry } from './src/models/Enquiry.js';
import { Department } from './src/models/Department.js';
import { ProjectWorkflow } from './src/models/ProjectWorkflow.js';
import { DepartmentApproval } from './src/models/DepartmentApproval.js';
import { WorkflowHistory } from './src/models/WorkflowHistory.js';
import { generateNextERN, generateNextClientID, generateNextProjectTrackingID } from './src/services/counterService.js';
import { numberToWords } from './src/utils/numberToWords.js';
import {
  PROJECT_WORKFLOW_STATUSES,
  DEPARTMENT_APPROVAL_STATUSES
} from './src/constants/statuses.js';
import { USER_ROLES } from './src/constants/roles.js';

async function seedFiveDummyEntries() {
  console.log('=== SEEDING 5 DUMMY ENTRIES FOR SALES & MARKETING TEAM ===\n');

  await connectDB();

  const salesUser = await User.findOne({ role: USER_ROLES.SALES });
  const managerUser = await User.findOne({ role: USER_ROLES.MANAGER });
  const adminUser = await User.findOne({ role: USER_ROLES.ADMIN });

  if (!salesUser) throw new Error('Sales user not found in database.');

  const departments = await Department.find({ isActive: true }).sort({ sequenceNumber: 1 });
  if (departments.length !== 10) throw new Error('10 departments not found.');

  // Clean existing dummy enquiries to keep fresh idempotent state
  const dummyNames = [
    '11kV Outdoor Standalone Switchboard for Sivili Site',
    '33kV Substation Intake VCB Kiosks (2 Feeder System)',
    '22kV Inverter Duty Transformer Control Switchboards',
    '11kV Captive Power Plant Feeder Switchboard (Chemical Proof)',
    '11kV Campus Indoor Substation Switchboard'
  ];
  const oldEnqs = await Enquiry.find({ 'project.projectName': { $in: dummyNames } });
  const oldEnqIds = oldEnqs.map(e => e._id);
  const oldWorkflows = await ProjectWorkflow.find({ enquiryId: { $in: oldEnqIds } });
  const oldWorkflowIds = oldWorkflows.map(w => w._id);
  await DepartmentApproval.deleteMany({ workflowId: { $in: oldWorkflowIds } });
  await WorkflowHistory.deleteMany({ workflowId: { $in: oldWorkflowIds } });
  await ProjectWorkflow.deleteMany({ _id: { $in: oldWorkflowIds } });
  await Enquiry.deleteMany({ _id: { $in: oldEnqIds } });

  const dummyData = [
    {
      // ENTRY 1: DRAFT (New Enquiry in Sales)
      client: {
        companyName: 'Sivili Engineering Construction',
        customerType: 'Contractor',
        contactPerson: 'Mr. Sivakumar V',
        mobile: '9840291823',
        email: 'sivili.engg@gmail.com',
        siteAddress: '3/45, SIPCOT Industrial Park, Kancheepuram-631552, Tamil Nadu.',
        billingAddress: {
          street: '12 Gandhi Road',
          city: 'Kancheepuram',
          state: 'Tamil Nadu',
          postalCode: '631501',
          country: 'India'
        }
      },
      project: {
        standardType: 'Standard',
        projectName: '11kV Outdoor Standalone Switchboard for Sivili Site',
        segment: 'Commercial',
        subSegment: 'Building',
        projectSiteAddress: '3/45, SIPCOT Industrial Park, Kancheepuram, Tamil Nadu.'
      },
      products: [
        {
          productName: 'VCB Switchboard',
          kilovolt: '11 kV',
          ampere: '630 A',
          kiloampere: '25 kA',
          durationSec: 'For 3 Sec',
          usage: 'Outdoor',
          ebMetering: 'Transformer Control',
          quantity: 1,
          basicPrice: 315000,
          totalBasicPrice: 315000,
          productDescription: '11kV, 630A, 25kA for 3 Sec Outdoor Type Standalone VCB Switchboard (Transformer Control) as per our specification and bill of materials Make(Skypower switchgears)'
        }
      ],
      transportPrice: 0,
      initialStatus: PROJECT_WORKFLOW_STATUSES.DRAFT,
      stageSequence: 1
    },
    {
      // ENTRY 2: PENDING MANAGER REVIEW (Submitted by Sales)
      client: {
        companyName: 'Suzlon Wind Energy Ltd',
        customerType: 'End User',
        contactPerson: 'Mr. Karthikeyan R (Lead Electrical)',
        mobile: '9789012345',
        email: 'karthik.r@suzlon.com',
        siteAddress: 'Wind Farm Site 12, Kayathar Substation, Tirunelveli-627852, Tamil Nadu.',
        billingAddress: {
          street: 'One Earth, Hadapsar',
          city: 'Pune',
          state: 'Maharashtra',
          postalCode: '411028',
          country: 'India'
        }
      },
      project: {
        standardType: 'Standard',
        projectName: '33kV Substation Intake VCB Kiosks (2 Feeder System)',
        segment: 'Renewable',
        subSegment: 'Wind',
        projectSiteAddress: 'Wind Farm Site 12, Kayathar, Tirunelveli, Tamil Nadu.'
      },
      products: [
        {
          productName: 'VCB Switchboard',
          kilovolt: '33 kV',
          ampere: '1250 A',
          kiloampere: '26.3 kA',
          durationSec: 'For 3 Sec',
          usage: 'Outdoor',
          ebMetering: 'Point of supply',
          quantity: 2,
          basicPrice: 480000,
          totalBasicPrice: 960000,
          productDescription: '33kV, 1250A, 26.3 kA for 3 Sec Outdoor Type Standalone VCB Switchboard (Point of supply) as per our specification and bill of materials Make(Skypower switchgears)'
        }
      ],
      transportPrice: 20000,
      initialStatus: PROJECT_WORKFLOW_STATUSES.PENDING_MANAGER_REVIEW,
      stageSequence: 1
    },
    {
      // ENTRY 3: UNDER DEPARTMENT REVIEW (Manager Forwarded to PO / Drawing)
      client: {
        companyName: 'Adani Green Energy Solar Park',
        customerType: 'End User',
        contactPerson: 'Mr. Rajesh Nambiar (Project Manager)',
        mobile: '9820011223',
        email: 'r.nambiar@adani.com',
        siteAddress: '50MW Kamuthi Solar Facility, Ramanathapuram District, Tamil Nadu.',
        billingAddress: {
          street: 'Adani Corporate House, Shantigram',
          city: 'Ahmedabad',
          state: 'Gujarat',
          postalCode: '382421',
          country: 'India'
        }
      },
      project: {
        standardType: 'Standard',
        projectName: '22kV Inverter Duty Transformer Control Switchboards',
        segment: 'Renewable',
        subSegment: 'Solar',
        projectSiteAddress: 'Kamuthi Solar Facility, Ramanathapuram, Tamil Nadu.'
      },
      products: [
        {
          productName: 'VCB Switchboard',
          kilovolt: '22 kV',
          ampere: '800 A',
          kiloampere: '26.3 kA',
          durationSec: 'For 3 Sec',
          usage: 'Outdoor',
          ebMetering: 'Transformer Control',
          quantity: 3,
          basicPrice: 420000,
          totalBasicPrice: 1260000,
          productDescription: '22kV, 800A, 26.3 kA for 3 Sec Outdoor Type Standalone VCB Switchboard (Transformer Control) as per our specification and bill of materials Make(Skypower switchgears)'
        }
      ],
      transportPrice: 20000,
      initialStatus: PROJECT_WORKFLOW_STATUSES.UNDER_DEPARTMENT_REVIEW,
      stageSequence: 4 // At Drawing Stage
    },
    {
      // ENTRY 4: RETURNED FOR SALES & MARKETING REVIEW (Rework Required / Rejected)
      client: {
        companyName: 'Chemplast Sanmar Chemical Complex',
        customerType: 'End User',
        contactPerson: 'Mr. S. Sundaram (Chief Engineer)',
        mobile: '9444056789',
        email: 's.sundaram@sanmargroup.com',
        siteAddress: 'Plant III Complex, Mettur Dam, Salem District-636402, Tamil Nadu.',
        billingAddress: {
          street: '9 Cathedral Road',
          city: 'Chennai',
          state: 'Tamil Nadu',
          postalCode: '600086',
          country: 'India'
        }
      },
      project: {
        standardType: 'Non Standard',
        projectName: '11kV Captive Power Plant Feeder Switchboard (Chemical Proof)',
        segment: 'Industry',
        subSegment: 'Chemical',
        projectSiteAddress: 'Plant III Complex, Mettur Dam, Salem, Tamil Nadu.'
      },
      products: [
        {
          productName: 'VCB Switchboard',
          kilovolt: '11 kV',
          ampere: '1250 A',
          kiloampere: '26.3 kA',
          durationSec: 'For 3 Sec',
          usage: 'Indoor',
          ebMetering: 'EB Metering',
          quantity: 2,
          basicPrice: 385000,
          totalBasicPrice: 770000,
          productDescription: '11kV, 1250A, 26.3 kA for 3 Sec Indoor Type Standalone VCB Switchboard (EB Metering) as per our specification and bill of materials Make(Skypower switchgears)'
        }
      ],
      transportPrice: 0,
      initialStatus: PROJECT_WORKFLOW_STATUSES.RETURNED_FOR_CORRECTION,
      stageSequence: 6, // Rejected by Fabrication / Drawing
      rejectionReason: 'Technical Specification Discrepancy',
      rejectionRemarks: 'Chemical plant atmosphere requires minimum 3.0mm CRCA sheet enclosure with epoxy anti-corrosive powder coating. Please revise client enclosure specification.'
    },
    {
      // ENTRY 5: COMPLETED (All 10 Departments Approved & Commissioned)
      client: {
        companyName: 'PSG College of Technology & Infrastructure',
        customerType: 'End User',
        contactPerson: 'Dr. G. Senthilvel (Estate Electrical Dept)',
        mobile: '9894012345',
        email: 'senthil.ee@psgtech.edu',
        siteAddress: 'Campus Substation #2, Avinashi Road, Peelamedu, Coimbatore-641004, Tamil Nadu.',
        billingAddress: {
          street: 'Post Box No. 1611, Peelamedu',
          city: 'Coimbatore',
          state: 'Tamil Nadu',
          postalCode: '641004',
          country: 'India'
        }
      },
      project: {
        standardType: 'Standard',
        projectName: '11kV Campus Indoor Substation Switchboard',
        segment: 'Commercial',
        subSegment: 'Colleges',
        projectSiteAddress: 'Campus Substation #2, Avinashi Road, Peelamedu, Coimbatore, Tamil Nadu.'
      },
      products: [
        {
          productName: 'VCB Switchboard',
          kilovolt: '11 kV',
          ampere: '630 A',
          kiloampere: '25 kA',
          durationSec: 'For 1 Sec',
          usage: 'Indoor',
          ebMetering: 'Transformer Control',
          quantity: 1,
          basicPrice: 325000,
          totalBasicPrice: 325000,
          productDescription: '11kV, 630A, 25kA for 1 Sec Indoor Type Standalone VCB Switchboard (Transformer Control) as per our specification and bill of materials Make(Skypower switchgears)'
        }
      ],
      transportPrice: 0,
      initialStatus: PROJECT_WORKFLOW_STATUSES.COMPLETED,
      stageSequence: 10
    }
  ];

  for (let i = 0; i < dummyData.length; i++) {
    const d = dummyData[i];

    // 1. Create or Find Client
    let client = await Client.findOne({ companyName: d.client.companyName });
    if (!client) {
      client = await Client.create({
        clientId: await generateNextClientID(),
        ...d.client,
        createdBy: salesUser._id
      });
    }

    // 2. Calculate Commercials
    const subTotalBasic = d.products.reduce((acc, p) => acc + p.totalBasicPrice, 0);
    const subTotal = subTotalBasic + (d.transportPrice || 0);
    const cgst = Math.round(subTotal * 0.09);
    const sgst = Math.round(subTotal * 0.09);
    const totalGst = cgst + sgst;
    const grandTotal = subTotal + totalGst;
    const words = numberToWords(grandTotal);

    // 3. Create Enquiry
    const ern = await generateNextERN();
    const enquiry = await Enquiry.create({
      ern,
      clientId: client._id,
      clientCustomId: client.clientId,
      customerType: client.customerType,
      offerDate: new Date(Date.now() - (dummyData.length - i) * 24 * 60 * 60 * 1000),
      project: d.project,
      products: d.products,
      commercialPricing: {
        priceBasis: 'Ex-Works: Salem, Tamil Nadu',
        transportPrice: d.transportPrice,
        transportOption: d.transportPrice > 0 ? 'salem_transport' : 'client_transport',
        forBasis: d.transportPrice > 0 ? 'Transport Arranged by Sky Power' : 'Client Own Transport (Default)',
        subTotal,
        gstType: 'INTRA_STATE',
        cgstRate: 9,
        sgstRate: 9,
        igstRate: 18,
        cgstAmount: cgst,
        sgstAmount: sgst,
        igstAmount: 0,
        totalTaxAmount: totalGst,
        totalAmount: grandTotal,
        amountInWords: words
      },
      assignedSalesEngineer: salesUser._id,
      approvalStatus: d.initialStatus === PROJECT_WORKFLOW_STATUSES.DRAFT ? 'Draft' : 'Approved',
      commercialStatus: d.initialStatus === PROJECT_WORKFLOW_STATUSES.COMPLETED ? 'Won' : 'In Progress',
      currentOfferingVersion: 'OFR-001'
    });

    // 4. Create ProjectWorkflow with PRJ-YYYY-XXXX
    const trackingId = await generateNextProjectTrackingID();
    const targetDept = departments.find((dept) => dept.sequenceNumber === d.stageSequence) || departments[0];

    const workflow = await ProjectWorkflow.create({
      projectTrackingId: trackingId,
      enquiryId: enquiry._id,
      currentDepartmentId: targetDept._id,
      currentDepartmentCode: targetDept.departmentCode,
      currentDepartmentSequence: d.stageSequence,
      overallStatus: d.initialStatus,
      completionPercentage: d.initialStatus === PROJECT_WORKFLOW_STATUSES.COMPLETED ? 100 : Math.round((d.stageSequence / 10) * 100),
      completedAt: d.initialStatus === PROJECT_WORKFLOW_STATUSES.COMPLETED ? new Date() : null,
      lastRejectedDepartmentId: d.rejectionReason ? targetDept._id : null,
      lastRejectedDepartmentCode: d.rejectionReason ? targetDept.departmentCode : null,
      rejectionReason: d.rejectionReason || null,
      rejectionRemarks: d.rejectionRemarks || null,
      rejectedAt: d.rejectionReason ? new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) : null,
      rejectedBy: d.rejectionReason ? managerUser._id : null
    });

    // 5. Create 10 DepartmentApproval records
    for (const dept of departments) {
      let status = DEPARTMENT_APPROVAL_STATUSES.WAITING;
      let remarks = '';
      let reviewedAt = null;
      let reviewedBy = null;

      if (d.initialStatus === PROJECT_WORKFLOW_STATUSES.COMPLETED) {
        status = DEPARTMENT_APPROVAL_STATUSES.ACCEPTED;
        remarks = `${dept.departmentName} clearance certified and approved.`;
        reviewedAt = new Date();
        reviewedBy = managerUser._id;
      } else if (d.rejectionReason && dept.sequenceNumber === d.stageSequence) {
        status = DEPARTMENT_APPROVAL_STATUSES.REJECTED;
        remarks = d.rejectionRemarks;
        reviewedAt = new Date();
        reviewedBy = managerUser._id;
      } else if (dept.sequenceNumber < d.stageSequence) {
        status = DEPARTMENT_APPROVAL_STATUSES.ACCEPTED;
        remarks = `${dept.departmentName} verified.`;
        reviewedAt = new Date();
        reviewedBy = salesUser._id;
      } else if (dept.sequenceNumber === d.stageSequence) {
        status = DEPARTMENT_APPROVAL_STATUSES.PENDING;
      }

      await DepartmentApproval.create({
        workflowId: workflow._id,
        enquiryId: enquiry._id,
        projectTrackingId: trackingId,
        departmentId: dept._id,
        departmentCode: dept.departmentCode,
        departmentName: dept.departmentName,
        departmentSequence: dept.sequenceNumber,
        status,
        remarks,
        rejectionReason: status === DEPARTMENT_APPROVAL_STATUSES.REJECTED ? d.rejectionReason : '',
        reviewedBy,
        reviewedAt
      });
    }

    // 6. Log Initial History
    await WorkflowHistory.create({
      workflowId: workflow._id,
      enquiryId: enquiry._id,
      projectTrackingId: trackingId,
      departmentCode: 'SALES',
      departmentName: 'Sales & Marketing',
      action: 'Submitted',
      actionBy: salesUser._id,
      actionByName: salesUser.name,
      actionByRole: salesUser.role,
      previousStatus: 'None',
      newStatus: d.initialStatus,
      remarks: `Sales requisition generated for ${client.companyName}.`
    });

    console.log(`[Created #${i + 1}] ${trackingId} | ERN: ${ern}`);
    console.log(`  Client: ${client.companyName} (${client.customerType})`);
    console.log(`  Project: ${enquiry.project.projectName}`);
    console.log(`  Value: Rs. ${grandTotal.toLocaleString('en-IN')} (${words})`);
    console.log(`  Status: ${d.initialStatus} | Stage: ${d.stageSequence} (${targetDept.departmentCode})\n`);
  }

  console.log('=== ALL 5 DUMMY ENTRIES CREATED SUCCESSFULLY IN CLOUD MONGODB! ===');
  await disconnectDB();
}

seedFiveDummyEntries().catch((err) => {
  console.error('\nFAILED TO SEED DUMMY ENTRIES:', err);
  process.exit(1);
});
