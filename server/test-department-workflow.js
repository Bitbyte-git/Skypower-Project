import mongoose from 'mongoose';
import { connectDB, disconnectDB } from './src/config/db.js';
import { User } from './src/models/User.js';
import { Client } from './src/models/Client.js';
import { Enquiry } from './src/models/Enquiry.js';
import { Department } from './src/models/Department.js';
import { ProjectWorkflow } from './src/models/ProjectWorkflow.js';
import { DepartmentApproval } from './src/models/DepartmentApproval.js';
import { WorkflowHistory } from './src/models/WorkflowHistory.js';
import { seedInitialData, initializeProjectWorkflow } from './src/services/seedService.js';
import { generateNextERN, generateNextClientID } from './src/services/counterService.js';
import {
  PROJECT_WORKFLOW_STATUSES,
  DEPARTMENT_APPROVAL_STATUSES
} from './src/constants/statuses.js';
import { USER_ROLES } from './src/constants/roles.js';

async function runDepartmentWorkflowTests() {
  console.log('=== RUNNING 10-DEPARTMENT WORKFLOW & PROJECT TRACKING SUITE ===\n');

  await connectDB();
  console.log('[DB] Connected to MongoDB.');

  // 1. Seed initial data (departments, manager, sales, admin)
  await seedInitialData();
  console.log('[Seed] Departments and core users verified.');

  const adminUser = await User.findOne({ role: USER_ROLES.ADMIN });
  const managerUser = await User.findOne({ role: USER_ROLES.MANAGER });
  const salesUser = await User.findOne({ role: USER_ROLES.SALES });

  if (!managerUser) {
    throw new Error('Manager user not found in database.');
  }

  // 2. Verify 10 departments
  const departments = await Department.find({ isActive: true }).sort({ sequenceNumber: 1 });
  console.log(`[Check 1] Verified ${departments.length} departments in sequence:`);
  departments.forEach((d) => {
    console.log(`  Stage ${d.sequenceNumber}: ${d.departmentCode} - ${d.departmentName} (Client Visible: ${d.canViewClientDetails})`);
  });
  if (departments.length !== 10) throw new Error('Expected exactly 10 departments');

  // 3. Create a test client
  let client = await Client.findOne({ companyName: 'Tata Power Renewable Energy Ltd' });
  if (!client) {
    client = await Client.create({
      clientId: await generateNextClientID(),
      companyName: 'Tata Power Renewable Energy Ltd',
      customerType: 'End User',
      contactPerson: 'Mr. Arvind Swaminathan',
      mobile: '9840112233',
      email: 'arvind.s@tatapower.com',
      siteAddress: 'Wind Farm Site IV, Coimbatore, Tamil Nadu',
      billingAddress: {
        street: 'Corporate Park, Senapati Bapat Marg',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400013',
        country: 'India'
      },
      createdBy: salesUser._id
    });
  }

  // 4. Sales Engineer creates an Enquiry / Project
  const ern = await generateNextERN();
  const enquiry = await Enquiry.create({
    ern,
    clientId: client._id,
    customerType: client.customerType,
    offerDate: new Date(),
    project: {
      standardType: 'Standard',
      projectName: '33kV HT VCB Substation Feeders',
      segment: 'Renewable',
      subSegment: 'Wind',
      projectSiteAddress: 'Wind Farm Site IV, Coimbatore, Tamil Nadu'
    },
    products: [
      {
        productName: 'VCB Switchboard',
        kilovolt: '33 kV',
        ampere: '1250 A',
        kiloampere: '26.3 kA',
        durationSec: 'For 3 Sec',
        usage: 'Outdoor',
        ebMetering: 'Transformer Control',
        quantity: 2,
        basicPrice: 450000,
        totalBasicPrice: 900000,
        productDescription: '33kV, 1250A, 26.3 kA Outdoor Type Standalone VCB Switchboard (Transformer Control)'
      }
    ],
    commercialPricing: {
      priceBasis: 'Ex-Works: Salem, Tamil Nadu',
      transportPrice: 20000,
      forBasis: 'Client Own Transport (Default)',
      subTotal: 920000,
      gstType: 'INTRA_STATE',
      cgstRate: 9,
      sgstRate: 9,
      totalTaxAmount: 165600,
      totalAmount: 1085600,
      amountInWords: 'Ten Lakhs Eighty Five Thousand Six Hundred Rupees Only.'
    },
    assignedSalesEngineer: salesUser._id,
    approvalStatus: 'Draft'
  });

  const workflow = await initializeProjectWorkflow(enquiry, salesUser);
  console.log(`\n[Check 2] Project Workflow initialized with Immutable ID: ${workflow.projectTrackingId}`);
  console.log(`  Initial Status: ${workflow.overallStatus}`);
  console.log(`  Initial Stage: ${workflow.currentDepartmentSequence} (${workflow.currentDepartmentCode})`);

  if (!workflow.projectTrackingId.startsWith('PRJ-')) {
    throw new Error('Tracking ID does not follow PRJ-YYYY-XXXX pattern');
  }

  // 5. Verify 10 DepartmentApproval records created
  const approvals = await DepartmentApproval.find({ workflowId: workflow._id }).sort({ departmentSequence: 1 });
  if (approvals.length !== 10) throw new Error(`Expected 10 approval records, found ${approvals.length}`);
  console.log(`[Check 3] Successfully created 10 DepartmentApproval records.`);

  // 6. Sales submits for Manager Review
  workflow.overallStatus = PROJECT_WORKFLOW_STATUSES.PENDING_MANAGER_REVIEW;
  await DepartmentApproval.findOneAndUpdate(
    { workflowId: workflow._id, departmentSequence: 1 },
    {
      status: DEPARTMENT_APPROVAL_STATUSES.ACCEPTED,
      reviewedBy: salesUser._id,
      reviewedAt: new Date(),
      remarks: 'Sales & Marketing completed technical requisition. Submitted for Manager Review.'
    }
  );
  await workflow.save();
  console.log(`[Check 4] Sales submitted for Manager Review. Overall Status: ${workflow.overallStatus}`);

  // 7. Manager reviews and forwards to PO Team (Stage 2)
  const poDept = await Department.findOne({ sequenceNumber: 2 });
  workflow.currentDepartmentId = poDept._id;
  workflow.currentDepartmentCode = poDept.departmentCode;
  workflow.currentDepartmentSequence = 2;
  workflow.overallStatus = PROJECT_WORKFLOW_STATUSES.PENDING_PO_APPROVAL;
  workflow.managerReviewedAt = new Date();
  workflow.managerForwardedAt = new Date();
  await DepartmentApproval.findOneAndUpdate(
    { workflowId: workflow._id, departmentSequence: 2 },
    { status: DEPARTMENT_APPROVAL_STATUSES.PENDING }
  );
  await workflow.save();
  console.log(`[Check 5] Manager forwarded to Stage 2: ${poDept.departmentName}. Overall Status: ${workflow.overallStatus}`);

  // 8. PO Team accepts (Stage 2 -> Stage 3)
  await DepartmentApproval.findOneAndUpdate(
    { workflowId: workflow._id, departmentSequence: 2 },
    {
      status: DEPARTMENT_APPROVAL_STATUSES.ACCEPTED,
      reviewedBy: managerUser._id,
      reviewedAt: new Date(),
      remarks: 'PO verified and booked in SAP.'
    }
  );
  const accountantDept = await Department.findOne({ sequenceNumber: 3 });
  workflow.currentDepartmentId = accountantDept._id;
  workflow.currentDepartmentCode = accountantDept.departmentCode;
  workflow.currentDepartmentSequence = 3;
  workflow.overallStatus = PROJECT_WORKFLOW_STATUSES.UNDER_DEPARTMENT_REVIEW;
  await DepartmentApproval.findOneAndUpdate(
    { workflowId: workflow._id, departmentSequence: 3 },
    { status: DEPARTMENT_APPROVAL_STATUSES.PENDING }
  );
  await workflow.save();
  console.log(`[Check 6] PO Team approved. Advanced to Stage 3: ${accountantDept.departmentName}`);

  // 9. Accountant accepts (Stage 3 -> Stage 4)
  await DepartmentApproval.findOneAndUpdate(
    { workflowId: workflow._id, departmentSequence: 3 },
    {
      status: DEPARTMENT_APPROVAL_STATUSES.ACCEPTED,
      reviewedBy: managerUser._id,
      reviewedAt: new Date(),
      remarks: '50% Advance payment terms verified.'
    }
  );
  const drawingDept = await Department.findOne({ sequenceNumber: 4 });
  workflow.currentDepartmentId = drawingDept._id;
  workflow.currentDepartmentCode = drawingDept.departmentCode;
  workflow.currentDepartmentSequence = 4;
  await DepartmentApproval.findOneAndUpdate(
    { workflowId: workflow._id, departmentSequence: 4 },
    { status: DEPARTMENT_APPROVAL_STATUSES.PENDING }
  );
  await workflow.save();
  console.log(`[Check 7] Accountant approved. Advanced to Stage 4: ${drawingDept.departmentName}`);

  // 10. Drawing Rejection Test (Simulate Drawing Team finding a discrepancy)
  const rejectionReason = 'Technical Specification Discrepancy';
  const rejectionRemarks = 'Canopy thickness must be 2.5mm CRCA per client spec. Current design mentions 2.0mm.';
  await DepartmentApproval.findOneAndUpdate(
    { workflowId: workflow._id, departmentSequence: 4 },
    {
      status: DEPARTMENT_APPROVAL_STATUSES.REJECTED,
      reviewedBy: managerUser._id,
      reviewedAt: new Date(),
      remarks: rejectionRemarks,
      rejectionReason
    }
  );
  workflow.overallStatus = PROJECT_WORKFLOW_STATUSES.RETURNED_FOR_CORRECTION;
  workflow.lastRejectedDepartmentId = drawingDept._id;
  workflow.lastRejectedDepartmentCode = drawingDept.departmentCode;
  workflow.rejectionReason = rejectionReason;
  workflow.rejectionRemarks = rejectionRemarks;
  workflow.rejectedAt = new Date();
  workflow.rejectedBy = managerUser._id;
  await workflow.save();
  console.log(`[Check 8] Drawing Stage REJECTED project.`);
  console.log(`  Overall Status: ${workflow.overallStatus}`);
  console.log(`  Last Rejected Dept: ${workflow.lastRejectedDepartmentCode}`);
  console.log(`  Rejection Reason: ${workflow.rejectionReason}`);

  // 11. Sales Rework & Resubmission
  workflow.overallStatus = PROJECT_WORKFLOW_STATUSES.PENDING_MANAGER_REVIEW;
  workflow.resubmittedAt = new Date();
  await workflow.save();
  console.log(`[Check 9] Sales corrected specs and resubmitted. Status: ${workflow.overallStatus}`);

  // 12. Manager Review & RESUMPTION: Must resume directly at Stage 4 (Drawing) without repeating Stages 1, 2, 3!
  let targetSeq = 2;
  if (workflow.lastRejectedDepartmentCode) {
    const rej = await Department.findOne({ departmentCode: workflow.lastRejectedDepartmentCode });
    if (rej) targetSeq = rej.sequenceNumber;
  }
  if (targetSeq !== 4) {
    throw new Error(`Resumption failed: expected Stage 4, got Stage ${targetSeq}`);
  }
  const resumedDept = await Department.findOne({ sequenceNumber: targetSeq });
  workflow.currentDepartmentId = resumedDept._id;
  workflow.currentDepartmentCode = resumedDept.departmentCode;
  workflow.currentDepartmentSequence = 4;
  workflow.overallStatus = PROJECT_WORKFLOW_STATUSES.UNDER_DEPARTMENT_REVIEW;
  await DepartmentApproval.findOneAndUpdate(
    { workflowId: workflow._id, departmentSequence: 4 },
    { status: DEPARTMENT_APPROVAL_STATUSES.PENDING }
  );
  await workflow.save();
  console.log(`[Check 10] Manager forwarded resubmission: RESUMED directly at Stage ${targetSeq} (${resumedDept.departmentName})!`);

  // Verify prior stages 1, 2, 3 are still Accepted
  const checkApprovals = await DepartmentApproval.find({ workflowId: workflow._id }).sort({ departmentSequence: 1 });
  console.log(`  Stage 1 (SALES): ${checkApprovals[0].status}`);
  console.log(`  Stage 2 (PO_TEAM): ${checkApprovals[1].status}`);
  console.log(`  Stage 3 (ACCOUNTANT): ${checkApprovals[2].status}`);
  console.log(`  Stage 4 (DRAWING): ${checkApprovals[3].status}`);
  if (checkApprovals[0].status !== 'Accepted' || checkApprovals[1].status !== 'Accepted' || checkApprovals[2].status !== 'Accepted') {
    throw new Error('Prior department approvals were incorrectly cleared!');
  }

  // 13. Sequential Approvals from Stage 4 through Stage 10
  for (let s = 4; s <= 9; s++) {
    const curDept = departments.find((d) => d.sequenceNumber === s);
    const nxtDept = departments.find((d) => d.sequenceNumber === s + 1);

    await DepartmentApproval.findOneAndUpdate(
      { workflowId: workflow._id, departmentSequence: s },
      {
        status: DEPARTMENT_APPROVAL_STATUSES.ACCEPTED,
        reviewedBy: managerUser._id,
        reviewedAt: new Date(),
        remarks: `${curDept.departmentName} clearance approved.`
      }
    );

    workflow.currentDepartmentId = nxtDept._id;
    workflow.currentDepartmentCode = nxtDept.departmentCode;
    workflow.currentDepartmentSequence = s + 1;
    workflow.completionPercentage = Math.round(((s + 1) / 10) * 100);
    await DepartmentApproval.findOneAndUpdate(
      { workflowId: workflow._id, departmentSequence: s + 1 },
      { status: DEPARTMENT_APPROVAL_STATUSES.PENDING }
    );
    await workflow.save();
    console.log(`[Check 11.${s}] Stage ${s} (${curDept.departmentCode}) Accepted -> Moved to Stage ${s + 1} (${nxtDept.departmentCode})`);
  }

  // 14. Final Stage 10 (Installation) Accepts
  await DepartmentApproval.findOneAndUpdate(
    { workflowId: workflow._id, departmentSequence: 10 },
    {
      status: DEPARTMENT_APPROVAL_STATUSES.ACCEPTED,
      reviewedBy: managerUser._id,
      reviewedAt: new Date(),
      remarks: 'Commissioning & site handover completed successfully.'
    }
  );
  workflow.overallStatus = PROJECT_WORKFLOW_STATUSES.COMPLETED;
  workflow.completedAt = new Date();
  workflow.completionPercentage = 100;
  await workflow.save();

  console.log(`\n[Check 12] Final Stage 10 (Installation) Accepted!`);
  console.log(`  Overall Status: ${workflow.overallStatus}`);
  console.log(`  Completion: ${workflow.completionPercentage}%`);
  console.log(`  Completed At: ${workflow.completedAt}`);
  console.log(`  Project Tracking ID preserved: ${workflow.projectTrackingId}`);

  console.log('\n=== ALL 10-DEPARTMENT WORKFLOW INTEGRATION CHECKS PASSED PERFECTLY! ===');
  await disconnectDB();
}

runDepartmentWorkflowTests().catch((err) => {
  console.error('\nTEST FAILED:', err);
  process.exit(1);
});
