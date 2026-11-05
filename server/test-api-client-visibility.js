import mongoose from 'mongoose';
import { connectDB, disconnectDB } from './src/config/db.js';
import { User } from './src/models/User.js';
import { Client } from './src/models/Client.js';
import { Enquiry } from './src/models/Enquiry.js';
import { Department } from './src/models/Department.js';
import { ProjectWorkflow } from './src/models/ProjectWorkflow.js';
import { DepartmentApproval } from './src/models/DepartmentApproval.js';
import { seedInitialData, initializeProjectWorkflow } from './src/services/seedService.js';
import { generateNextERN, generateNextClientID } from './src/services/counterService.js';
import { USER_ROLES } from './src/constants/roles.js';

// Import controller functions directly to test request/response logic
import {
  getProjectWorkflows,
  departmentAction
} from './src/controllers/projectWorkflowController.js';

async function testApiDataVisibility() {
  console.log('=== TESTING API DATA VISIBILITY & REJECTION VALIDATION ===\n');

  await connectDB();
  await seedInitialData();

  const salesUser = await User.findOne({ role: USER_ROLES.SALES });
  const managerUser = await User.findOne({ role: USER_ROLES.MANAGER });

  // 1. Create a dummy client and enquiry
  let client = await Client.findOne({ companyName: 'Larsen & Toubro ECC Div' });
  if (!client) {
    client = await Client.create({
      clientId: await generateNextClientID(),
      companyName: 'Larsen & Toubro ECC Div',
      customerType: 'Contractor',
      contactPerson: 'K. Balasubramanian',
      mobile: '9840998877',
      email: 'bala.k@intecc.com',
      siteAddress: 'Substation Site, Salem, Tamil Nadu',
      createdBy: salesUser._id
    });
  }

  const ern = await generateNextERN();
  const enquiry = await Enquiry.create({
    ern,
    clientId: client._id,
    customerType: client.customerType,
    offerDate: new Date(),
    project: {
      standardType: 'Standard',
      projectName: '11kV VCB Switchboard for L&T',
      segment: 'Commercial'
    },
    products: [
      {
        productName: 'VCB Switchboard',
        kilovolt: '11 kV',
        ampere: '630 A',
        kiloampere: '25 kA',
        quantity: 1,
        basicPrice: 315000,
        totalBasicPrice: 315000
      }
    ],
    assignedSalesEngineer: salesUser._id,
    approvalStatus: 'Draft'
  });

  const workflow = await initializeProjectWorkflow(enquiry, salesUser);
  workflow.currentDepartmentCode = 'DRAWING';
  workflow.currentDepartmentSequence = 4;
  await workflow.save();

  // 2. Test Data Visibility for Production Department (e.g. PO_TEAM or DRAWING) when non-manager
  const mockReqProduction = {
    query: {},
    user: { role: 'OPERATOR' } // non-privileged role
  };
  let productionResponseData = null;
  const mockResProduction = {
    status: () => mockResProduction,
    json: (data) => {
      productionResponseData = data;
    }
  };

  await getProjectWorkflows(mockReqProduction, mockResProduction, (err) => {
    if (err) throw err;
  });

  const foundItem = productionResponseData.workflows.find(
    (w) => w.projectTrackingId === workflow.projectTrackingId
  );
  if (!foundItem) throw new Error('Workflow not found in query');

  console.log('[Check Visibility 1] Production Department Query:');
  console.log('  Company Name:', foundItem.enquiryId.clientId.companyName);
  console.log('  Contact Person:', foundItem.enquiryId.clientId.contactPerson);
  console.log('  Mobile:', foundItem.enquiryId.clientId.mobile);
  console.log('  Email:', foundItem.enquiryId.clientId.email);

  if (
    foundItem.enquiryId.clientId.companyName !== '*** CONFIDENTIAL CLIENT ***' ||
    foundItem.enquiryId.clientId.contactPerson !== '*** RESTRICTED ***' ||
    foundItem.enquiryId.clientId.mobile !== '**********'
  ) {
    throw new Error('Data confidentiality rule failed: Client details were exposed to production department!');
  }
  console.log('  -> CONFIDENTIALITY PASS: Client details successfully masked at backend level!\n');

  // 3. Test Data Visibility for Authorized Department (e.g. ACCOUNTANT or MANAGER)
  const mockReqManager = {
    query: { departmentCode: 'DRAWING' },
    user: { role: USER_ROLES.MANAGER } // Manager has global access
  };
  let managerResponseData = null;
  const mockResManager = {
    status: () => mockResManager,
    json: (data) => {
      managerResponseData = data;
    }
  };

  await getProjectWorkflows(mockReqManager, mockResManager, (err) => {
    if (err) throw err;
  });

  const managerItem = managerResponseData.workflows.find(
    (w) => w.projectTrackingId === workflow.projectTrackingId
  );
  console.log('[Check Visibility 2] Manager Query (Privileged):');
  console.log('  Company Name:', managerItem.enquiryId.clientId.companyName);
  console.log('  Contact Person:', managerItem.enquiryId.clientId.contactPerson);
  console.log('  Mobile:', managerItem.enquiryId.clientId.mobile);

  if (managerItem.enquiryId.clientId.companyName !== 'Larsen & Toubro ECC Div') {
    throw new Error('Manager was incorrectly restricted from viewing client details!');
  }
  console.log('  -> FULL ACCESS PASS: Manager can access complete client details!\n');

  // 4. Test Role Authorization: Sales role attempting department approval must return 403 Forbidden
  const mockReqSalesApproval = {
    params: { id: workflow._id.toString() },
    body: { action: 'ACCEPT', remarks: 'Sales attempting approval' },
    user: salesUser
  };
  let salesForbiddenError = null;
  const mockResSalesApproval = {
    status: (code) => {
      salesForbiddenError = { code };
      return mockResSalesApproval;
    },
    json: (data) => {
      salesForbiddenError.data = data;
    }
  };

  await departmentAction(mockReqSalesApproval, mockResSalesApproval, (err) => {
    if (err) throw err;
  });

  console.log('[Check Role Auth] Sales Role Department Approval Attempt:');
  console.log('  HTTP Code:', salesForbiddenError?.code);
  console.log('  Error Message:', salesForbiddenError?.data?.message);

  if (salesForbiddenError?.code !== 403 || !salesForbiddenError?.data?.message?.includes('Only General Manager and Admin')) {
    throw new Error('Authorization failed: Sales role was able to act on department approval!');
  }
  console.log('  -> ROLE PERMISSION PASS: Sales is restricted to viewing tracking status only!\n');

  // 5. Test Manager Rejection Validation: Empty reason/remarks must return 400 error
  const mockReqEmptyReject = {
    params: { id: workflow._id.toString() },
    body: { action: 'REJECT', remarks: '', rejectionReason: '' },
    user: managerUser
  };
  let rejectedError = null;
  const mockResEmptyReject = {
    status: (code) => {
      rejectedError = { code };
      return mockResEmptyReject;
    },
    json: (data) => {
      rejectedError.data = data;
    }
  };

  await departmentAction(mockReqEmptyReject, mockResEmptyReject, (err) => {
    if (err) throw err;
  });

  console.log('[Check Rejection Validation] Empty Rejection Attempt by Manager:');
  console.log('  HTTP Code:', rejectedError?.code);
  console.log('  Error Message:', rejectedError?.data?.message);

  if (rejectedError?.code !== 400 || !rejectedError?.data?.message?.includes('mandatory')) {
    throw new Error('Rejection validation failed: Empty rejection was permitted!');
  }
  console.log('  -> VALIDATION PASS: Mandatory rejection reason and remarks enforced!\n');

  console.log('=== ALL BACKEND SECURITY & VALIDATION TESTS PASSED! ===');
  await disconnectDB();
}

testApiDataVisibility().catch((err) => {
  console.error('\nTEST FAILED:', err);
  process.exit(1);
});
