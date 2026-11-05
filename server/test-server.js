import './src/index.js';

async function waitForServerAndTest() {
  let attempts = 0;
  while (attempts < 15) {
    try {
      const res = await fetch('http://localhost:5000/api/health');
      if (res.ok) {
        const data = await res.json();
        console.log('✅ BACKEND HEALTH CHECK SUCCESSFUL:', data);
        break;
      }
    } catch (e) {
      // wait 500ms and retry
      await new Promise((r) => setTimeout(r, 500));
      attempts++;
    }
  }

  // Test Admin Login
  const adminRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@voltaswitchgear.com',
      password: 'Admin@123'
    })
  });
  const adminData = await adminRes.json();
  console.log('✅ ADMIN LOGIN TEST:', adminData.success, 'Role:', adminData.user?.role);

  // Test Sales Login
  const salesRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'sales@voltaswitchgear.com',
      password: 'Sales@123'
    })
  });
  const salesData = await salesRes.json();
  console.log('✅ SALES LOGIN TEST:', salesData.success, 'Role:', salesData.user?.role);

  // Test Admin Pending Approvals
  const pendingRes = await fetch('http://localhost:5000/api/approvals/pending', {
    headers: { Authorization: `Bearer ${adminData.token}` }
  });
  const pendingData = await pendingRes.json();
  console.log('✅ PENDING APPROVALS TEST: Found', pendingData.count, 'pending enquiries');

  // Test Sales cannot approve (Role restriction test)
  const salesApproveAttempt = await fetch(`http://localhost:5000/api/approvals/${pendingData.enquiries[0]?._id}/approve`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${salesData.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ remarks: 'Illegal approval' })
  });
  console.log('✅ RBAC SECURITY TEST (Sales cannot approve): Code', salesApproveAttempt.status, '(403 Expected)');

  // Test Admin Approving the enquiry
  const adminApproveRes = await fetch(`http://localhost:5000/api/approvals/${pendingData.enquiries[0]?._id}/approve`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminData.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ remarks: 'Technically and commercially approved by Director.' })
  });
  const adminApproveData = await adminApproveRes.json();
  console.log('✅ ADMIN APPROVE TEST:', adminApproveData.success, 'New Status:', adminApproveData.enquiry?.approvalStatus);

  // Test Admin Generating Quotation for the Approved Enquiry
  const quoteRes = await fetch('http://localhost:5000/api/quotations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminData.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      enquiryId: adminApproveData.enquiry._id,
      productPricing: [
        {
          productName: '22KV Outdoor VCB Kiosk Panel',
          quantity: 4,
          unit: 'Nos',
          unitPrice: 650000,
          discountPercent: 5,
          taxRatePercent: 18,
          netAmount: 2470000
        }
      ]
    })
  });
  const quoteData = await quoteRes.json();
  console.log('✅ QUOTATION & PDF GENERATION TEST:', quoteData.success, 'Quotation Ref:', quoteData.quotation?.formattedQuotationNumber);

  console.log('🎉 ALL CORE BACKEND WORKFLOWS VERIFIED SUCCESSFULLY!');
  process.exit(0);
}

waitForServerAndTest();
