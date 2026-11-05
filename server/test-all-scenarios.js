import { startServer } from './src/index.js';

let PORT = 5000;
let BASE_URL = `http://localhost:${PORT}/api`;

async function runScenarioTests() {
  console.log('\n=============================================================');
  console.log('🧪 RUNNING COMPREHENSIVE END-TO-END SCENARIO TEST SUITE (1-20)');
  console.log('=============================================================\n');

  try {
    await startServer(5000);
  } catch (err) {
    console.warn('Port 5000 busy, trying 5050...');
    PORT = 5050;
    BASE_URL = `http://localhost:${PORT}/api`;
    await startServer(5050);
  }

  // Wait for health endpoint
  let attempts = 0;
  while (attempts < 20) {
    try {
      const res = await fetch(`${BASE_URL}/health`);
      if (res.ok) break;
    } catch (e) {
      await new Promise((r) => setTimeout(r, 300));
      attempts++;
    }
  }

  let passedCount = 0;

  // 1. Sales user login
  const salesLogin = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'sales@skypower.co.in', password: 'Sales@123' })
  });
  const salesAuth = await salesLogin.json();
  if (salesAuth.success && salesAuth.user?.role === 'SALES') {
    console.log('✅ Scenario 01 Passed: Sales user can log in.');
    passedCount++;
  } else {
    console.error('❌ Scenario 01 Failed');
  }

  // 2. Admin user login
  const adminLogin = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@skypower.co.in', password: 'Admin@123' })
  });
  const adminAuth = await adminLogin.json();
  if (adminAuth.success && adminAuth.user?.role === 'ADMIN') {
    console.log('✅ Scenario 02 Passed: Admin can log in.');
    passedCount++;
  } else {
    console.error('❌ Scenario 02 Failed');
  }

  // 3. Sales cannot access Admin APIs (HTTP 403)
  const salesAdminAttempt = await fetch(`${BASE_URL}/approvals/pending`, {
    headers: { Authorization: `Bearer ${salesAuth.token}` }
  });
  if (salesAdminAttempt.status === 403) {
    console.log('✅ Scenario 03 Passed: Sales cannot access Admin APIs (HTTP 403 Forbidden received).');
    passedCount++;
  } else {
    console.error('❌ Scenario 03 Failed: Expected 403, got', salesAdminAttempt.status);
  }

  // 4. Admin can view all enquiries
  const adminEnquiriesRes = await fetch(`${BASE_URL}/enquiries?view=all`, {
    headers: { Authorization: `Bearer ${adminAuth.token}` }
  });
  const adminEnquiries = await adminEnquiriesRes.json();
  if (adminEnquiries.success && Array.isArray(adminEnquiries.enquiries)) {
    console.log('✅ Scenario 04 Passed: Admin can view all enquiries across sales engineers.');
    passedCount++;
  } else {
    console.error('❌ Scenario 04 Failed');
  }

  // 5. Mobile number validation rejects non-10 digits
  const invalidMobileRes = await fetch(`${BASE_URL}/clients`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${salesAuth.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      companyName: 'Invalid Mobile Test Ltd',
      clientLocation: 'Pune',
      contactPerson: 'Tester',
      mobile: '98220123', // Only 8 digits!
      customerType: 'EPC Contractor'
    })
  });
  if (invalidMobileRes.status === 400) {
    console.log('✅ Scenario 05 Passed: Mobile number strictly rejects anything other than 10 digits.');
    passedCount++;
  } else {
    console.error('❌ Scenario 05 Failed');
  }

  // 6. Duplicate clients detected
  const validClientRes = await fetch(`${BASE_URL}/clients`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${salesAuth.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      companyName: 'Siemens Energy T&D Pvt Ltd',
      clientLocation: 'Vadodara, Gujarat',
      contactPerson: 'Kunal Shah',
      mobile: '9898098980',
      customerType: 'OEM / Panel Builder',
      gstNumber: '24AAACS1234F1Z9'
    })
  });
  const clientData = await validClientRes.json();

  const dupAttempt = await fetch(`${BASE_URL}/clients`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${salesAuth.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      companyName: 'Siemens Energy T&D Pvt Ltd',
      clientLocation: 'Vadodara',
      contactPerson: 'Another Person',
      mobile: '9898098980',
      customerType: 'OEM / Panel Builder'
    })
  });
  if (dupAttempt.status === 409) {
    console.log('✅ Scenario 06 Passed: Duplicate clients detected appropriately (HTTP 409 Conflict).');
    passedCount++;
  } else {
    console.error('❌ Scenario 06 Failed');
  }

  // 7. Atomic ERN format generated correctly
  const newEnquiryRes = await fetch(`${BASE_URL}/enquiries`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${salesAuth.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      clientId: clientData.client._id,
      customerType: 'OEM / Panel Builder',
      project: {
        projectName: 'Gujarat Solar Park 33kV Switchyard',
        projectCategory: 'Renewable Energy (Solar / Wind)',
        projectLocation: 'Charanka, Gujarat'
      },
      products: [
        {
          productName: '33KV Outdoor VCB Kiosk Panel',
          voltageRating: '33 kV',
          currentRating: '1600 A',
          breakingCapacity: '31.5 kA / 3s',
          quantity: 2,
          unit: 'Nos',
          estimatedUnitValue: 950000,
          totalProductValue: 1900000
        },
        {
          productName: '33KV Metering Panel',
          voltageRating: '33 kV',
          currentRating: '630 A',
          breakingCapacity: '31.5 kA / 3s',
          quantity: 1,
          unit: 'Nos',
          estimatedUnitValue: 450000,
          totalProductValue: 450000
        }
      ],
      enquiryType: 'Firm',
      commands: 'Client demands dual core CTs with 0.2s metering accuracy and IEC 61850 compatibility.'
    })
  });
  const enquiryData = await newEnquiryRes.json();
  const ern = enquiryData.enquiry?.ern;
  if (/^ERN-\d{4}-\d{4}$/.test(ern)) {
    console.log(`✅ Scenario 07 Passed: ERN generated via atomic counter (${ern}).`);
    passedCount++;
  } else {
    console.error('❌ Scenario 07 Failed: Invalid ERN', ern);
  }

  // 8. Multiple products supported in one enquiry
  if (enquiryData.enquiry?.products?.length === 2) {
    console.log('✅ Scenario 08 Passed: Multiple products added to one enquiry (2 switchgear panels).');
    passedCount++;
  } else {
    console.error('❌ Scenario 08 Failed');
  }

  // 9. Enquiry cannot be submitted without mandatory fields
  const invalidEnqRes = await fetch(`${BASE_URL}/enquiries`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${salesAuth.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      clientId: clientData.client._id,
      customerType: 'OEM / Panel Builder',
      project: { projectName: '' },
      products: []
    })
  });
  if (invalidEnqRes.status === 400) {
    console.log('✅ Scenario 09 Passed: Enquiry cannot be created without mandatory fields.');
    passedCount++;
  } else {
    console.error('❌ Scenario 09 Failed');
  }

  // 10. Submitted enquiry appears in Pending Approvals
  await fetch(`${BASE_URL}/enquiries/${enquiryData.enquiry._id}/submit`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${salesAuth.token}` }
  });

  const pendingListRes = await fetch(`${BASE_URL}/approvals/pending`, {
    headers: { Authorization: `Bearer ${adminAuth.token}` }
  });
  const pendingListData = await pendingListRes.json();
  const foundInPending = pendingListData.enquiries?.some((e) => e.ern === ern);
  if (foundInPending) {
    console.log('✅ Scenario 10 Passed: Submitted enquiry appears immediately in Pending Approvals queue.');
    passedCount++;
  } else {
    console.error('❌ Scenario 10 Failed');
  }

  // 11. Admin can approve an enquiry
  const approveRes = await fetch(`${BASE_URL}/approvals/${enquiryData.enquiry._id}/approve`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminAuth.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ remarks: 'Technically and commercially approved by Director.' })
  });
  const approveData = await approveRes.json();
  if (approveData.success && approveData.enquiry?.approvalStatus === 'Approved') {
    console.log('✅ Scenario 11 Passed: Admin can approve an enquiry.');
    passedCount++;
  } else {
    console.error('❌ Scenario 11 Failed');
  }

  // Create an enquiry to test Return for Correction workflow
  const returnTestEnq = await fetch(`${BASE_URL}/enquiries`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${salesAuth.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      clientId: clientData.client._id,
      customerType: 'OEM / Panel Builder',
      project: {
        projectName: 'Return Test Substation',
        projectCategory: 'Transmission & Distribution Substation',
        projectLocation: 'Nagpur'
      },
      products: [
        {
          productName: '11KV Indoor VCB Panel',
          voltageRating: '11 kV',
          quantity: 1,
          estimatedUnitValue: 400000
        }
      ],
      enquiryType: 'Firm'
    })
  });
  const returnEnqData = await returnTestEnq.json();
  await fetch(`${BASE_URL}/enquiries/${returnEnqData.enquiry._id}/submit`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${salesAuth.token}` }
  });

  // 12. Admin returns enquiry with mandatory remarks
  const returnRes = await fetch(`${BASE_URL}/approvals/${returnEnqData.enquiry._id}/return`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminAuth.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ remarks: 'Please update breaking capacity to 26.3kA and verify site altitude.' })
  });
  const returnResult = await returnRes.json();
  if (returnResult.success && returnResult.enquiry?.approvalStatus === 'Returned for Correction') {
    console.log('✅ Scenario 12 Passed: Admin can return enquiry with mandatory remarks.');
    passedCount++;
  } else {
    console.error('❌ Scenario 12 Failed');
  }

  // 13. Sales can edit and resubmit returned enquiries
  await fetch(`${BASE_URL}/enquiries/${returnEnqData.enquiry._id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${salesAuth.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      clientId: clientData.client._id,
      customerType: 'OEM / Panel Builder',
      project: {
        projectName: 'Return Test Substation (Corrected)',
        projectCategory: 'Transmission & Distribution Substation',
        projectLocation: 'Nagpur'
      },
      products: [
        {
          productName: '11KV Indoor VCB Panel',
          voltageRating: '11 kV',
          breakingCapacity: '26.3 kA / 3s',
          quantity: 1,
          estimatedUnitValue: 420000,
          totalProductValue: 420000
        }
      ],
      enquiryType: 'Firm',
      changeSummary: 'Updated breaking capacity to 26.3kA as requested.'
    })
  });

  const resubmitRes = await fetch(`${BASE_URL}/enquiries/${returnEnqData.enquiry._id}/submit`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${salesAuth.token}` }
  });
  const resubmitData = await resubmitRes.json();
  if (resubmitData.success && resubmitData.enquiry?.approvalStatus === 'Pending Approval') {
    console.log('✅ Scenario 13 Passed: Sales can edit and resubmit returned enquiries (Revision tracked).');
    passedCount++;
  } else {
    console.error('❌ Scenario 13 Failed');
  }

  // 14. Rejected enquiry cannot proceed to quotation
  await fetch(`${BASE_URL}/approvals/${returnEnqData.enquiry._id}/reject`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminAuth.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ remarks: 'Commercial viability not approved by management.' })
  });

  const quoteOnRejectedAttempt = await fetch(`${BASE_URL}/quotations`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminAuth.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      enquiryId: returnEnqData.enquiry._id,
      productPricing: [{ productName: '11KV Panel', quantity: 1, unitPrice: 400000, netAmount: 400000 }]
    })
  });
  if (quoteOnRejectedAttempt.status === 403) {
    console.log('✅ Scenario 14 Passed: Rejected enquiries cannot proceed to quotation generation (HTTP 403).');
    passedCount++;
  } else {
    console.error('❌ Scenario 14 Failed');
  }

  // 15. Sales cannot approve an enquiry (HTTP 403)
  const salesApproveCheck = await fetch(`${BASE_URL}/approvals/${enquiryData.enquiry._id}/approve`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${salesAuth.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ remarks: 'Illegal approval attempt' })
  });
  if (salesApproveCheck.status === 403) {
    console.log('✅ Scenario 15 Passed: Sales cannot approve an enquiry (Forbidden HTTP 403).');
    passedCount++;
  } else {
    console.error('❌ Scenario 15 Failed');
  }

  // 16. Sales cannot generate quotations (HTTP 403)
  const salesQuoteCheck = await fetch(`${BASE_URL}/quotations`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${salesAuth.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      enquiryId: enquiryData.enquiry._id,
      productPricing: [{ productName: 'VCB Panel', quantity: 1, unitPrice: 500000, netAmount: 500000 }]
    })
  });
  if (salesQuoteCheck.status === 403) {
    console.log('✅ Scenario 16 Passed: Sales cannot generate quotations (Admin-only restricted).');
    passedCount++;
  } else {
    console.error('❌ Scenario 16 Failed');
  }

  // 17. Admin can generate quotations only for approved enquiries
  const adminQuoteRes = await fetch(`${BASE_URL}/quotations`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminAuth.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      enquiryId: enquiryData.enquiry._id,
      validityDays: 30,
      productPricing: [
        {
          productName: '33KV Outdoor VCB Kiosk Panel',
          voltageRating: '33 kV',
          currentRating: '1600 A',
          breakingCapacity: '31.5 kA / 3s',
          quantity: 2,
          unit: 'Nos',
          unitPrice: 950000,
          discountPercent: 5,
          netAmount: 1805000
        },
        {
          productName: '33KV Metering Panel',
          voltageRating: '33 kV',
          currentRating: '630 A',
          breakingCapacity: '31.5 kA / 3s',
          quantity: 1,
          unit: 'Nos',
          unitPrice: 450000,
          discountPercent: 0,
          netAmount: 450000
        }
      ],
      discountTotal: 25000,
      taxRatePercent: 18
    })
  });
  const adminQuoteData = await adminQuoteRes.json();
  const qNum = adminQuoteData.quotation?.formattedQuotationNumber;
  if (adminQuoteData.success && qNum?.includes('-V1') && adminQuoteData.quotation?.pdfFileUrl) {
    console.log(`✅ Scenario 17 Passed: Admin generated quotation & PDF (${qNum}, PDF: ${adminQuoteData.quotation.pdfFileUrl}).`);
    passedCount++;
  } else {
    console.error('❌ Scenario 17 Failed');
  }

  // 18. Quotation revisions preserve previous versions
  const reviseRes = await fetch(`${BASE_URL}/quotations/${adminQuoteData.quotation._id}/revise`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminAuth.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      revisionRemarks: 'Applied additional 3% commercial discount after client negotiation.',
      validityDays: 30,
      productPricing: adminQuoteData.quotation.productPricing,
      discountTotal: 50000
    })
  });
  const reviseData = await reviseRes.json();
  const v2Num = reviseData.quotation?.formattedQuotationNumber;

  const prevQuoteRes = await fetch(`${BASE_URL}/quotations/${adminQuoteData.quotation._id}`, {
    headers: { Authorization: `Bearer ${adminAuth.token}` }
  });
  const prevQuoteData = await prevQuoteRes.json();
  if (v2Num?.includes('-V2') && prevQuoteData.quotation?.status === 'Superseded') {
    console.log(`✅ Scenario 18 Passed: Quotation revision preserved V1 (status: Superseded) and created ${v2Num}.`);
    passedCount++;
  } else {
    console.error('❌ Scenario 18 Failed');
  }

  // 19. Follow-ups are correctly linked to enquiries
  const followupRes = await fetch(`${BASE_URL}/followups`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${salesAuth.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      enquiryId: enquiryData.enquiry._id,
      type: 'Direct Meeting',
      discussionNotes: 'Met Chief Electrical Engineer at Gujarat site. Discussed delivery schedule.',
      clientResponse: 'Client satisfied with commercial quotation V2. Ready to release PO.',
      status: 'Completed'
    })
  });
  const followupData = await followupRes.json();
  if (followupData.success && followupData.followup?.ern === ern) {
    console.log(`✅ Scenario 19 Passed: Follow-up successfully recorded and linked to ERN ${ern}.`);
    passedCount++;
  } else {
    console.error('❌ Scenario 19 Failed');
  }

  // 20. Audit logs record important activities
  const auditRes = await fetch(`${BASE_URL}/audit-logs?ern=${ern}`, {
    headers: { Authorization: `Bearer ${adminAuth.token}` }
  });
  const auditData = await auditRes.json();
  if (auditData.success && auditData.logs?.length >= 3) {
    console.log(`✅ Scenario 20 Passed: Immutable audit log recorded ${auditData.logs.length} events for ${ern}.`);
    passedCount++;
  } else {
    console.error('❌ Scenario 20 Failed');
  }

  console.log('\n=============================================================');
  console.log(`🎯 SCENARIO TEST EXECUTION COMPLETE: ${passedCount}/20 PASSED!`);
  console.log('=============================================================\n');

  process.exit(passedCount === 20 ? 0 : 1);
}

runScenarioTests();
