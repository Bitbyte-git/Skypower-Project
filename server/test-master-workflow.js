import { startServer } from './src/index.js';

let PORT = 5025;
let BASE_URL = `http://localhost:${PORT}/api`;

async function runMasterAcceptanceTest() {
  console.log('\n================================================================================');
  console.log('🏭 SKY POWER SWITCHGEARS – MASTER MULTI-PAGE WORKFLOW ACCEPTANCE TEST');
  console.log('   Client Enquiry → Project → Multiple Products → Pricing → Revisions → PO Handover');
  console.log('================================================================================\n');

  try {
    await startServer(PORT);
  } catch (err) {
    console.warn(`Port ${PORT} in use, trying 5030...`);
    PORT = 5030;
    BASE_URL = `http://localhost:${PORT}/api`;
    await startServer(PORT);
  }

  // Poll health endpoint
  let healthy = false;
  for (let i = 0; i < 20; i++) {
    try {
      const h = await fetch(`${BASE_URL}/health`);
      if (h.ok) {
        healthy = true;
        break;
      }
    } catch (e) {
      await new Promise((r) => setTimeout(r, 250));
    }
  }

  if (!healthy) {
    throw new Error('Server health check failed');
  }

  let passed = 0;

  // 1. Sales User Login
  console.log('▶ STEP 0: Authenticating Sales Engineer...');
  const salesLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'sales@skypower.co.in', password: 'Sales@123' })
  });
  const salesAuth = await salesLoginRes.json();
  if (!salesAuth.success || salesAuth.user?.role !== 'SALES') {
    throw new Error('Sales authentication failed');
  }
  const salesToken = salesAuth.token;
  console.log('  ✅ Sales Engineer logged in successfully: Rajesh Sharma');
  passed++;

  // 2. STEP 1: Register New Client & verify unique Client ID SP-CL-YYYY-XXXX
  console.log('\n▶ STEP 1: Registering New Client (ABC Electricals Pvt. Ltd.)...');
  const uniqueName = `ABC Electricals Pvt. Ltd. [Test ${Date.now().toString().slice(-4)}]`;
  const uniqueMobile = `98765${Math.floor(10000 + Math.random() * 90000)}`;

  const clientRes = await fetch(`${BASE_URL}/workflow/client`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${salesToken}`
    },
    body: JSON.stringify({
      isNewClient: true,
      companyName: uniqueName,
      customerType: 'Contractor',
      contactPerson: 'Ramesh Kumar',
      mobile: uniqueMobile,
      email: 'ramesh@abcelectricals.com',
      siteAddress: 'SF No. 123/4, SIPCOT Phase - II, Salem, Tamil Nadu - 636005.'
    })
  });
  const clientData = await clientRes.json();
  const clientId = clientData.client?.clientId;

  if (clientData.success && clientId && /^SP-CL-\d{4}-\d{4}$/.test(clientId)) {
    console.log(`  ✅ Client registered successfully with unique Client ID: ${clientId}`);
    passed++;
  } else {
    throw new Error(`Client registration failed or invalid Client ID format: ${JSON.stringify(clientData)}`);
  }

  // 3. STEP 2 & 3 & 4: Create Project Details, Add 3 Different Products with different quantities
  console.log('\n▶ STEP 2, 3 & 4: Creating Project, Adding 3 Products, and Computing Pricing...');
  const project = {
    standardType: 'Standard',
    projectName: '11kV VCB Switchboard for Wind Farm',
    segment: 'Renewable',
    subSegment: 'Wind'
  };

  const product1 = {
    productName: 'VCB Switchboard',
    kilovolt: '11 kV',
    ampere: '630 A',
    kiloampere: '26.3 kA',
    durationSec: 'For 3 Sec',
    usage: 'Indoor',
    ebMetering: 'Transformer Control',
    quantity: 2,
    basicPrice: 500000,
    productDescription: '11kV, 630A, 26.3 kA, 3 Sec, Indoor VCB Switchboard (Transformer Control)'
  };

  const product2 = {
    productName: 'VCB Switchboard',
    kilovolt: '22 kV',
    ampere: '1250 A',
    kiloampere: '25 kA',
    durationSec: 'For 1 Sec',
    usage: 'Outdoor',
    ebMetering: 'Point of Supply',
    quantity: 1,
    basicPrice: 650000,
    productDescription: '22kV, 1250A, 25 kA, 1 Sec, Outdoor VCB Switchboard (Point of Supply)'
  };

  const product3 = {
    productName: 'VCB Switchboard',
    kilovolt: '33 kV',
    ampere: '800 A',
    kiloampere: '26.3 kA',
    durationSec: 'For 3 Sec',
    usage: 'Indoor',
    ebMetering: 'EB Metering',
    quantity: 3,
    basicPrice: 750000,
    productDescription: '33kV, 800A, 26.3 kA, 3 Sec, Indoor VCB Switchboard (EB Metering)'
  };

  const productsList = [product1, product2, product3];
  const totalBasic = (500000 * 2) + (650000 * 1) + (750000 * 3); // 10,00,000 + 6,50,000 + 22,50,000 = 39,00,000
  const transportPrice = 20000;
  const subTotal = totalBasic + transportPrice; // 39,20,000
  const cgst = Math.round(subTotal * 0.09); // 3,52,800
  const sgst = Math.round(subTotal * 0.09); // 3,52,800
  const totalAmount = subTotal + cgst + sgst; // 46,25,600

  const draftRes = await fetch(`${BASE_URL}/workflow/draft`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${salesToken}`
    },
    body: JSON.stringify({
      clientId: clientData.client._id,
      clientData: clientData.client,
      project,
      products: productsList,
      commercialPricing: {
        basicPrice: 500000,
        transportType: 'Up & Down',
        transportPrice,
        forBasis: 'Client Own Transport',
        gstType: 'INTRA_STATE',
        cgstRate: 9,
        sgstRate: 9,
        subTotal,
        cgstAmount: cgst,
        sgstAmount: sgst,
        totalTaxAmount: cgst + sgst,
        totalAmount,
        amountInWords: 'Rupees Forty Six Lakh Twenty Five Thousand Six Hundred Only.'
      }
    })
  });

  const draftData = await draftRes.json();
  const enquiryId = draftData.enquiry?._id;
  const ern = draftData.enquiry?.ern;

  if (draftData.success && enquiryId && draftData.enquiry?.currentOfferingVersion === 'OFR-001') {
    console.log(`  ✅ Offering OFR-001 created successfully (ERN: ${ern}, Total: ₹ ${totalAmount.toLocaleString('en-IN')})`);
    passed++;
  } else {
    throw new Error(`Failed to create initial offering draft: ${JSON.stringify(draftData)}`);
  }

  // 4. Verify OFR-001 details & Send to Client
  console.log('\n▶ STEP 5A: Sending OFR-001 to Client...');
  const sendRes = await fetch(`${BASE_URL}/workflow/offering-send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${salesToken}`
    },
    body: JSON.stringify({
      enquiryId,
      versionId: 'OFR-001'
    })
  });
  const sendData = await sendRes.json();
  if (sendData.success && sendData.enquiry?.approvalStatus === 'Sent to Client') {
    console.log('  ✅ OFR-001 marked as Sent to Client.');
    passed++;
  } else {
    throw new Error('Failed to send OFR-001');
  }

  // 5. Client requests price reduction -> Revise Offering to OFR-002
  console.log('\n▶ STEP 5B: Client requests price reduction → Creating Revision OFR-002...');
  const revisedPrice1 = 480000;
  const revisedProducts1 = productsList.map((p) => ({
    ...p,
    basicPrice: revisedPrice1,
    totalBasicPrice: revisedPrice1 * p.quantity
  }));
  const revisedTotal1 = (480000 * 2) + (480000 * 1) + (480000 * 3) + 20000;
  const revisedTotalWithTax1 = Math.round(revisedTotal1 * 1.18);

  const rev2Res = await fetch(`${BASE_URL}/workflow/offering-revision`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${salesToken}`
    },
    body: JSON.stringify({
      enquiryId,
      changeSummary: 'Applied 4% price reduction per client commercial negotiation.',
      revisedProducts: revisedProducts1,
      revisedPricing: {
        basicPrice: revisedPrice1,
        transportPrice: 20000,
        subTotal: revisedTotal1,
        totalAmount: revisedTotalWithTax1
      }
    })
  });

  const rev2Data = await rev2Res.json();
  if (rev2Data.success && rev2Data.currentVersionId === 'OFR-002') {
    console.log(`  ✅ OFR-002 revision created successfully (Current Version: ${rev2Data.currentVersionId}).`);
    passed++;
  } else {
    throw new Error(`Failed to create OFR-002: ${JSON.stringify(rev2Data)}`);
  }

  // 6. Verify Client ID remains unchanged & OFR-001 remains accessible
  console.log('\n▶ STEP 5C: Verifying Client ID permanence & Historical Revisions...');
  const checkEnquiryRes = await fetch(`${BASE_URL}/workflow/enquiry/${enquiryId}`, {
    headers: { Authorization: `Bearer ${salesToken}` }
  });
  const checkEnquiryData = await checkEnquiryRes.json();
  const eq = checkEnquiryData.enquiry;
  console.log('DEBUG eq.clientCustomId:', eq?.clientCustomId, 'vs clientId:', clientId, 'revisions count:', eq?.offeringRevisions?.length);

  if (eq.clientCustomId === clientId && eq.offeringRevisions?.length === 2) {
    const v1 = eq.offeringRevisions.find((r) => r.versionId === 'OFR-001');
    const v2 = eq.offeringRevisions.find((r) => r.versionId === 'OFR-002');
    if (v1 && v2) {
      console.log(`  ✅ Client ID permanently unchanged (${eq.clientCustomId}).`);
      console.log(`  ✅ OFR-001 (Status: ${v1.status}) and OFR-002 (Status: ${v2.status}) both preserved.`);
      passed++;
    } else {
      throw new Error('Historical revisions missing');
    }
  } else {
    throw new Error('Client ID changed or revisions count mismatch');
  }

  // 7. Client requests 1 additional product -> Create OFR-003
  console.log('\n▶ STEP 5D: Client requests 1 additional product → Creating Revision OFR-003...');
  const additionalProduct = {
    productName: 'VCB Switchboard',
    kilovolt: '11 kV',
    ampere: '1250 A',
    kiloampere: '25 kA',
    durationSec: 'For 3 Sec',
    usage: 'Indoor',
    ebMetering: 'Bus Coupler Panel',
    quantity: 1,
    basicPrice: 520000,
    productDescription: '11kV, 1250A, 25 kA, 3 Sec, Indoor VCB Switchboard (Bus Coupler Panel)'
  };
  const revisedProducts2 = [...revisedProducts1, additionalProduct];

  const rev3Res = await fetch(`${BASE_URL}/workflow/offering-revision`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${salesToken}`
    },
    body: JSON.stringify({
      enquiryId,
      changeSummary: 'Added 1 Bus Coupler Panel per client revised single line diagram.',
      revisedProducts: revisedProducts2,
      revisedPricing: {
        totalAmount: 3850000
      }
    })
  });
  const rev3Data = await rev3Res.json();
  if (rev3Data.success && rev3Data.currentVersionId === 'OFR-003') {
    console.log(`  ✅ OFR-003 created with 4 products total. Revisions count: ${rev3Data.revisions?.length}`);
    passed++;
  } else {
    throw new Error('Failed to create OFR-003');
  }

  // 8. Client Approves OFR-003 -> Finalize & Send to PO Team (STEP 6)
  console.log('\n▶ STEP 6: Finalizing Approved Offering & Handing over to PO Team...');
  const finalizeRes = await fetch(`${BASE_URL}/workflow/finalize-to-po`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${salesToken}`
    },
    body: JSON.stringify({
      enquiryId,
      offeringVersionId: 'OFR-003'
    })
  });

  const finalizeData = await finalizeRes.json();
  const generatedPOId = finalizeData.poId;

  if (finalizeData.success && generatedPOId && /^PO-\d{4}-\d{4}$/.test(generatedPOId)) {
    console.log(`  ✅ Successfully handed over to PO Team! Generated PO ID: ${generatedPOId}`);
    console.log(`     Client ID: ${finalizeData.clientId} | Version: ${finalizeData.offeringVersionId}`);
    passed++;
  } else {
    throw new Error(`PO handover failed: ${JSON.stringify(finalizeData)}`);
  }

  // 9. Login as PO Team & Verify Role Restrictions
  console.log('\n▶ STEP 7: Testing PO Team Login & Privacy Restrictions...');
  const poLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'po@skypower.co.in', password: 'Po@123' })
  });
  const poAuth = await poLoginRes.json();
  if (!poAuth.success || poAuth.user?.role !== 'PO_TEAM') {
    throw new Error('PO Team login failed');
  }
  const poToken = poAuth.token;
  console.log('  ✅ PO Team logged in successfully: Suresh Kumar (PO Execution Lead)');
  passed++;

  // 10. Fetch PO records as PO Team and verify client PII is stripped
  console.log('  ▶ Inspecting PO records as PO Team...');
  const poTrackingRes = await fetch(`${BASE_URL}/workflow/po-tracking`, {
    headers: { Authorization: `Bearer ${poToken}` }
  });
  const poTrackingData = await poTrackingRes.json();
  const targetPO = poTrackingData.pos?.find((p) => p.poId === generatedPOId);

  if (targetPO) {
    // Check accessible fields
    const hasPOId = Boolean(targetPO.poId);
    const hasClientId = Boolean(targetPO.clientId);
    const hasProjectTitle = Boolean(targetPO.projectTitle);
    const hasProducts = Array.isArray(targetPO.products) && targetPO.products.length === 4;

    // Check INACCESSIBLE fields (must NOT be exposed)
    const leaksCompanyName = targetPO.companyName !== undefined;
    const leaksContactPerson = targetPO.contactPerson !== undefined;
    const leaksMobile = targetPO.mobile !== undefined;
    const leaksEmail = targetPO.email !== undefined;
    const leaksSiteAddress = targetPO.siteAddress !== undefined;
    const leaksCommercialAmount = targetPO.finalApprovedAmount !== undefined;

    if (hasPOId && hasClientId && hasProjectTitle && hasProducts && !leaksCompanyName && !leaksContactPerson && !leaksMobile && !leaksEmail && !leaksSiteAddress && !leaksCommercialAmount) {
      console.log('  ✅ SECURITY PRIVACY RULE CONFIRMED: PO Team sees PO ID, Client ID, and Technical Products.');
      console.log('  ✅ Client personal identity (name, phone, email, address) and commercial discussions are completely protected.');
      passed++;
    } else {
      throw new Error(`Security breach or missing fields: ${JSON.stringify(targetPO)}`);
    }
  } else {
    throw new Error(`PO ${generatedPOId} not found in PO tracking`);
  }

  // 11. Update PO Status by PO Team
  console.log('\n▶ STEP 8: Testing PO Status Progression by PO Team...');
  const updateStatusRes = await fetch(`${BASE_URL}/workflow/po-tracking/${targetPO._id}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${poToken}`
    },
    body: JSON.stringify({
      status: 'Engineering Cleared',
      notes: 'Single-line diagram and BOM verified. Handed over to assembly shop.'
    })
  });
  const updateStatusData = await updateStatusRes.json();
  if (updateStatusData.success && updateStatusData.po?.status === 'Engineering Cleared') {
    console.log(`  ✅ Status updated to 'Engineering Cleared' with audit timeline note.`);
    passed++;
  } else {
    throw new Error('Failed to update PO status');
  }

  console.log('\n================================================================================');
  console.log(`🎉 ALL 10 MASTER ACCEPTANCE SCENARIOS PASSED SUCCESSFULLY! (${passed}/10)`);
  console.log('================================================================================\n');

  process.exit(0);
}

runMasterAcceptanceTest().catch((err) => {
  console.error('\n❌ TEST RUN FAILED:', err);
  process.exit(1);
});

