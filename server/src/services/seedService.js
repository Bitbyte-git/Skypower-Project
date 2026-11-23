import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { SystemSetting } from '../models/SystemSetting.js';
import { Client } from '../models/Client.js';
import { Enquiry } from '../models/Enquiry.js';
import { Department } from '../models/Department.js';
import { ProjectWorkflow } from '../models/ProjectWorkflow.js';
import { DepartmentApproval } from '../models/DepartmentApproval.js';
import { WorkflowHistory } from '../models/WorkflowHistory.js';
import { InventoryItem, INVENTORY_CATEGORIES } from '../models/InventoryItem.js';
import { StockTransaction, TRANSACTION_TYPES } from '../models/StockTransaction.js';
import { SalesOrder } from '../models/SalesOrder.js';
import { PurchaseOrder } from '../models/PurchaseOrder.js';
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
  // Sync sequence 3 name to 'Advance Payment' across approvals
  await DepartmentApproval.updateMany(
    { departmentSequence: 3 },
    { departmentName: 'Advance Payment' }
  );
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
  PO: new mongoose.Types.ObjectId('000000000000000000000003'),
  ACCOUNTANT: new mongoose.Types.ObjectId('000000000000000000000004'),
  STOCK_ADMIN: new mongoose.Types.ObjectId('000000000000000000000005'),
  DESIGN_ENGINEER: new mongoose.Types.ObjectId('000000000000000000000006')
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
    } else if (poUser.role !== USER_ROLES.PO_TEAM) {
      poUser.role = USER_ROLES.PO_TEAM;
      await poUser.save();
    }

    // 3.2 Ensure Accountant User exists
    let accountantUser = await User.findOne({ email: 'accountant@skypower.co.in' });
    if (!accountantUser) {
      accountantUser = await User.create({
        _id: SEED_USER_IDS.ACCOUNTANT,
        name: 'Ananya Roy (Accounts & Finance Head)',
        email: 'accountant@skypower.co.in',
        password: 'Accountant@123',
        role: USER_ROLES.ACCOUNTANT,
        phone: '9840198401',
        department: 'Finance & Statutory Accounts'
      });
      console.log('[Seed] Sky Power Accountant user created: accountant@skypower.co.in / Accountant@123');
    } else if (accountantUser.role !== USER_ROLES.ACCOUNTANT) {
      accountantUser.role = USER_ROLES.ACCOUNTANT;
      await accountantUser.save();
    }
    // 3.3 Ensure Stock Admin User exists
    let stockAdminUser = await User.findOne({ email: 'stockadmin@skypower.co.in' });
    if (!stockAdminUser) {
      stockAdminUser = await User.create({
        _id: SEED_USER_IDS.STOCK_ADMIN,
        name: 'Karthik Raja (Stores & Stock Admin)',
        email: 'stockadmin@skypower.co.in',
        password: 'Stock@123',
        role: USER_ROLES.STOCK_ADMIN,
        phone: '9840398403',
        department: 'Central Stores & Inventory Management'
      });
      console.log('[Seed] Sky Power Stock Admin created: stockadmin@skypower.co.in / Stock@123');
    } else if (stockAdminUser.role !== USER_ROLES.STOCK_ADMIN) {
      stockAdminUser.role = USER_ROLES.STOCK_ADMIN;
      await stockAdminUser.save();
    }

    // 3.4 Ensure Design Engineer exists
    let engineerUser = await User.findOne({ email: 'engineer@skypower.co.in' });
    if (!engineerUser) {
      engineerUser = await User.create({
        _id: SEED_USER_IDS.DESIGN_ENGINEER,
        name: 'Praveen Kumar (Lead Design Engineer)',
        email: 'engineer@skypower.co.in',
        password: 'Engineer@123',
        role: USER_ROLES.DESIGN_ENGINEER,
        phone: '9840498404',
        department: 'Electrical Switchgear Design & Engineering'
      });
      console.log('[Seed] Sky Power Design Engineer created: engineer@skypower.co.in / Engineer@123');
    } else if (engineerUser.role !== USER_ROLES.DESIGN_ENGINEER) {
      engineerUser.role = USER_ROLES.DESIGN_ENGINEER;
      await engineerUser.save();
    }

    // 3.4 Seed initial switchgear stock items if table is empty
    await seedDefaultStockIfEmpty();

    // 4. Auto-synchronize any projects created by Sales to ensure visibility in Admin
    await syncPendingEnquiries();

    // 5. Auto-synchronize all approved enquiries & POs to Sales Orders
    await syncAllEnquiriesToSalesOrders();
    console.log('[Seed] Database is clean and synced for Admin & PO Team workflows.');
  } catch (err) {
    console.error('[Seed] Error during seeding:', err.message);
  }
};

export const seedDefaultStockIfEmpty = async () => {
  try {
    const existingCount = await InventoryItem.countDocuments();
    if (existingCount > 0) return;

    const sampleItems = [
      {
        itemCode: 'SP-CB-001',
        itemName: 'MCB – 32A (1P)',
        category: 'Circuit Breaker',
        subcategory: 'Single Pole Miniature Circuit Breaker',
        specification: '32A, 10kA Breaking Capacity, C-Curve, 240V AC, IS/IEC 60898-1',
        brand: 'Schneider Electric / L&T',
        imageUrl: '/products/mcb.svg',
        uom: 'Nos',
        currentStock: 560,
        minReorderLevel: 50,
        unitCost: 320,
        rackLocation: 'Rack B1 - Bin 04',
        supplier: 'L&T Electrical & Automation'
      },
      {
        itemCode: 'SP-CON-002',
        itemName: 'Contactor – 40A',
        category: 'Contactor',
        subcategory: '3-Pole Power Contactor with 1NO+1NC',
        specification: '40A AC-3 Duty, 18.5kW, 230V AC Coil, 50Hz, IEC 60947-4-1',
        brand: 'Schneider Electric (TeSys Deca)',
        imageUrl: '/products/contactor.svg',
        uom: 'Nos',
        currentStock: 84,
        minReorderLevel: 100,
        unitCost: 1850,
        rackLocation: 'Rack B2 - Bin 11',
        supplier: 'Schneider Electric India'
      },
      {
        itemCode: 'SP-MCCB-003',
        itemName: 'MCCB – 100A',
        category: 'MCCB',
        subcategory: '3-Pole Molded Case Circuit Breaker',
        specification: '100A Normal, 36kA Breaking Capacity at 415V AC, Thermal Magnetic Trip',
        brand: 'L&T Switchgear (dsine)',
        imageUrl: '/products/mccb.svg',
        uom: 'Nos',
        currentStock: 32,
        minReorderLevel: 50,
        unitCost: 4800,
        rackLocation: 'Bay 3 - Rack M1',
        supplier: 'Larsen & Toubro Ltd'
      },
      {
        itemCode: 'SP-PNL-004',
        itemName: 'Control Panel – 4 Way',
        category: 'Panel',
        subcategory: 'Wall Mount Industrial Distribution Enclosure',
        specification: 'IP65 Rated CRCA Sheet 1.6mm, 4-Way Feeder with R/Y/B Indicators & Digital Voltmeter',
        brand: 'Sky Power Enclosures',
        imageUrl: '/products/panel.svg',
        uom: 'Nos',
        currentStock: 0,
        minReorderLevel: 10,
        unitCost: 14500,
        rackLocation: 'Fabrication Yard F-02',
        supplier: 'Sky Power Switchgears Internal'
      },
      {
        itemCode: 'SP-CAB-005',
        itemName: 'Power Cable – 4 Sq.mm',
        category: 'Cable',
        subcategory: '4-Core Flexible Copper Power Cable',
        specification: '4 Core x 4 sq.mm 1100V Grade FRLS PVC Insulated Copper Conductor, IS 694',
        brand: 'Polycab / Havells',
        imageUrl: '/products/cable.svg',
        uom: 'Meter',
        currentStock: 2150,
        minReorderLevel: 500,
        unitCost: 95,
        rackLocation: 'Cable Drums Yard C-01',
        supplier: 'Polycab India Ltd'
      },
      {
        itemCode: 'STK-PT-11KV-01',
        itemName: 'Potential Transformer 11kV / 110V 3-Phase',
        category: INVENTORY_CATEGORIES.CT_PT,
        subcategory: 'Cast Resin Voltage Transformer',
        specification: '11000V / √3 to 110V / √3, 50VA, Class 0.5, 50Hz',
        brand: 'Pragati Electricals',
        uom: 'SETS',
        currentStock: 6,
        minReorderLevel: 2,
        unitCost: 22000,
        rackLocation: 'Bay 2 - Rack A4',
        supplier: 'Pragati Electricals Pvt Ltd'
      },
      {
        itemCode: 'STK-RELAY-OCEF-01',
        itemName: 'Numerical Overcurrent & Earth Fault Relay',
        category: INVENTORY_CATEGORIES.RELAYS,
        subcategory: 'Microprocessor Protection Relay',
        specification: '3 O/C + 1 E/F, IEC 60255, RS485 Modbus Communication, 24-240V AC/DC',
        brand: 'Schneider Electric (MiCOM P111)',
        uom: 'NOS',
        currentStock: 8,
        minReorderLevel: 3,
        unitCost: 34000,
        rackLocation: 'Relay Store - Bin C1',
        supplier: 'Schneider Electric India'
      },
      {
        itemCode: 'STK-RELAY-MTRIP-01',
        itemName: 'High Speed Master Trip Relay (Lockout 86)',
        category: INVENTORY_CATEGORIES.RELAYS,
        subcategory: 'Auxiliary Protection Relay',
        specification: 'Electromechanical Hand Reset, 24/110V DC, 4 C/O Contacts',
        brand: 'ABB / Alstom',
        uom: 'NOS',
        currentStock: 14,
        minReorderLevel: 5,
        unitCost: 6500,
        rackLocation: 'Relay Store - Bin C3',
        supplier: 'ABB India Ltd'
      },
      {
        itemCode: 'STK-VCB-11KV-630A',
        itemName: '11kV Vacuum Circuit Breaker 630A 25kA',
        category: INVENTORY_CATEGORIES.SWITCHGEAR_BREAKER,
        subcategory: 'Indoor Withdrawable VCB Truck',
        specification: '12kV Max, 630A Rated Normal Current, 25kA 3-Sec Breaking, Motorised Spring 230V AC',
        brand: 'L&T Switchgear',
        uom: 'NOS',
        currentStock: 4,
        minReorderLevel: 2,
        unitCost: 185000,
        rackLocation: 'Heavy Breaker Bay H1',
        supplier: 'Larsen & Toubro Ltd'
      },
      {
        itemCode: 'STK-BUSBAR-CU-50X10',
        itemName: 'Electrolytic Tough Pitch Copper Busbar 50x10mm',
        category: INVENTORY_CATEGORIES.BUSBAR_COPPER,
        subcategory: 'ETP High Conductivity Copper',
        specification: '50mm x 10mm Flat Busbar, 99.9% Pure Copper, IS 613',
        brand: 'Sterlite / Hindalco',
        uom: 'KGS',
        currentStock: 450,
        minReorderLevel: 100,
        unitCost: 890,
        rackLocation: 'Copper Store - Rack Cu-1',
        supplier: 'Metals & Alloys Corporation'
      },
      {
        itemCode: 'STK-CRCA-SHEET-2MM',
        itemName: 'CRCA Mild Steel Sheet 2.0mm Thick',
        category: INVENTORY_CATEGORIES.FABRICATION,
        subcategory: 'Enclosure Body Fabrication Sheet',
        specification: '2500 x 1250 x 2.0mm CRCA Sheet, Grade D, IS 513',
        brand: 'JSW / Tata Steel',
        uom: 'SHEETS',
        currentStock: 65,
        minReorderLevel: 20,
        unitCost: 3200,
        rackLocation: 'Sheet Metal Yard SM-1',
        supplier: 'Steel Authority Distributors'
      },
      {
        itemCode: 'STK-METER-MFM-01',
        itemName: 'Digital Multi-Function Energy Meter (Class 0.5s)',
        category: INVENTORY_CATEGORIES.METERS_INSTRUMENTS,
        subcategory: 'Panel Flush Mount Meter 96x96',
        specification: 'V, I, Hz, PF, kW, kVA, kWh, Class 0.5S Accuracy, RS485 RTU Modbus',
        brand: 'Schneider Electric / Conzerv',
        uom: 'NOS',
        currentStock: 16,
        minReorderLevel: 5,
        unitCost: 8200,
        rackLocation: 'Instrument Store Bin M2',
        supplier: 'Schneider Electric India'
      }
    ];

    const inserted = await InventoryItem.insertMany(sampleItems);
    console.log(`[Seed] Initialized ${inserted.length} default switchgear inventory items.`);
  } catch (err) {
    console.error('[Seed] Error seeding default stock:', err.message);
  }
};

export const syncPendingEnquiries = async () => {
  try {
    // 1. Find any enquiries currently marked 'Draft' that have products or a project name from sales
    const draftEnquiries = await Enquiry.find({
      approvalStatus: APPROVAL_STATUSES.DRAFT,
      $or: [
        { 'products.0': { $exists: true } },
        { 'project.projectName': { $exists: true, $ne: '' } },
        { expectedProjectValue: { $gt: 0 } },
        { 'commercialPricing.totalAmount': { $gt: 0 } }
      ]
    });

    for (const enq of draftEnquiries) {
      enq.approvalStatus = APPROVAL_STATUSES.PENDING_APPROVAL;
      if (!enq.expectedProjectValue && enq.commercialPricing?.totalAmount) {
        enq.expectedProjectValue = enq.commercialPricing.totalAmount;
      }
      await enq.save();
      try {
        await initializeProjectWorkflow(enq);
      } catch (eWf) {}
    }

    // 2. Ensure all enquiries have expectedProjectValue populated and have ProjectWorkflow
    const allEnquiries = await Enquiry.find();
    for (const enq of allEnquiries) {
      let needsSave = false;
      if ((!enq.expectedProjectValue || enq.expectedProjectValue === 0) && enq.commercialPricing?.totalAmount) {
        enq.expectedProjectValue = enq.commercialPricing.totalAmount;
        needsSave = true;
      }
      if (needsSave) {
        await enq.save();
      }
      try {
        await initializeProjectWorkflow(enq);
      } catch (eWf) {}
    }
  } catch (err) {
    console.error('[Sync] Error syncing pending enquiries:', err.message);
  }
};

export const syncAllEnquiriesToSalesOrders = async () => {
  try {
    const enquiries = await Enquiry.find().populate('clientId');
    const existingOrders = await SalesOrder.find();
    const existingErns = new Set(existingOrders.map((o) => o.ern).filter(Boolean));

    let maxSeq = 0;
    existingOrders.forEach((s) => {
      const m = s.orderNumber?.match(/SP-ORD-\d{4}-(\d+)/);
      if (m) {
        const num = parseInt(m[1], 10);
        if (num > maxSeq) maxSeq = num;
      }
    });

    const currentYear = new Date().getFullYear();

    for (const enq of enquiries) {
      if (existingErns.has(enq.ern)) continue;

      maxSeq++;
      const orderNumber = `SP-ORD-${currentYear}-${String(maxSeq).padStart(4, '0')}`;
      const client = enq.clientId || {};
      const po = (await PurchaseOrder.findOne({ ern: enq.ern })) || {};

      const customerName = client.companyName || enq.customerName || 'Customer Industrial Enterprise';
      const customerCode = client.clientId || enq.customerCode || 'SP-CL-APPROVED';
      const projectTitle = enq.project?.projectName || po.projectTitle || 'HT Switchgear Substation';
      const rawVal = po.finalApprovedAmount || enq.commercialPricing?.totalAmount || enq.expectedProjectValue || 1850000;
      const finalVal = Number(rawVal);
      const subTotal = Math.round(finalVal / 1.18);
      const taxTotal = finalVal - subTotal;

      const isCompleted = po.status === 'Completed' || enq.approvalStatus === 'Approved';
      const isReturned = enq.approvalStatus === 'Returned for Correction';

      let orderStatus = 'Under Verification';
      if (enq.ern === 'ERN-2026-0008') {
        orderStatus = 'Order Confirmed';
      } else if (isReturned) {
        orderStatus = 'On Hold';
      } else if (isCompleted) {
        orderStatus = po.status === 'Completed' ? 'Verified' : 'Under Verification';
      }

      const isVerified = orderStatus === 'Order Confirmed' || orderStatus === 'Verified';
      const poNumber = po.poId || `PO/${enq.ern.replace('ERN-', '')}/2026`;
      const poDate = po.createdAt || enq.createdAt || new Date();

      const orderProducts = (enq.products && enq.products.length > 0)
        ? enq.products.map((p) => ({
            productName: p.productName || '11kV HT Switchboard',
            productDescription: p.productDescription || `${p.kilovolt || '11kV'} ${p.ampere || '630A'} Indoor Switchboard`,
            quantity: p.quantity || 1,
            unit: 'Nos',
            unitPrice: p.unitPrice || Math.round(subTotal / (p.quantity || 1)),
            totalPrice: p.totalPrice || subTotal
          }))
        : [
            {
              productName: '11kV HT Switchboard',
              productDescription: 'Indoor VCB Switchgear Panel Assembly',
              quantity: 1,
              unit: 'Nos',
              unitPrice: subTotal,
              totalPrice: subTotal
            }
          ];

      const checklist = [
        {
          parameter: 'Customer Name & Legal Entity',
          quotationValue: customerName,
          poValue: customerName,
          isMatch: true,
          status: 'Match',
          remarks: 'Customer entity confirmed with PO header.'
        },
        {
          parameter: 'Total Order Value (₹)',
          quotationValue: `₹ ${finalVal.toLocaleString('en-IN')}`,
          poValue: `₹ ${finalVal.toLocaleString('en-IN')}`,
          isMatch: true,
          status: 'Match',
          remarks: 'Total commercial order value matches submitted offer.'
        },
        {
          parameter: 'Scope of Supply & Ratings',
          quotationValue: projectTitle,
          poValue: projectTitle,
          status: 'Match',
          remarks: 'Technical scope & specifications approved.'
        },
        {
          parameter: 'Delivery Schedule / Commitment',
          quotationValue: '10 to 12 weeks',
          poValue: '10 to 12 weeks',
          status: 'Match',
          remarks: 'Agreed manufacturing and testing dispatch window.'
        },
        {
          parameter: 'Payment Terms & Milestones',
          quotationValue: '30% Advance, 70% against PI',
          poValue: '30% Advance, 70% against PI',
          status: 'Match',
          remarks: 'Commercial payment milestones acceptable.'
        },
        {
          parameter: 'Warranty & Guarantee Period',
          quotationValue: '18 months from dispatch',
          poValue: '18 months from dispatch',
          status: 'Match',
          remarks: 'Standard OEM switchgear warranty terms accepted.'
        }
      ];

      const formatAddr = (addr) => {
        if (!addr) return 'Works / Delivery Site, Tamil Nadu';
        if (typeof addr === 'string') return addr;
        return [addr.street, addr.city, addr.state, addr.postalCode, addr.country].filter(Boolean).join(', ') || 'Works / Delivery Site, Tamil Nadu';
      };

      await SalesOrder.create({
        orderNumber,
        orderDate: poDate,
        quotationNumber: `QT-${currentYear}-${enq.ern.replace('ERN-2026-', '')}-R0`,
        quotationVersion: 1,
        enquiryId: enq._id,
        ern: enq.ern,
        clientId: client._id || new mongoose.Types.ObjectId(),
        customerName,
        customerCode,
        projectTitle,
        endUser: client.endUser || enq.project?.endUser || 'Direct Industrial Supply',
        billingAddress: formatAddr(client.billingAddress || client.siteAddress),
        siteAddress: formatAddr(client.siteAddress || client.billingAddress),
        gstNumber: client.gstNumber || '33AAACL1234E1Z1',
        contactPerson: client.contactPerson || 'Commercial Desk',
        contactEmail: client.email || '',
        contactPhone: client.mobile || '',
        status: orderStatus,
        customerPO: {
          poNumber,
          poDate,
          poReceivedDate: poDate,
          poValue: finalVal,
          poCurrency: 'INR',
          poRevision: 1,
          expectedDeliveryDate: new Date(Date.now() + 60 * 24 * 3600 * 1000),
          paymentTerms: '30% Advance, 70% against PI',
          deliveryTerms: '10 to 12 weeks',
          warrantyTerms: '18 months from dispatch',
          customerRemarks: 'Production clearance upon advance payment confirmation.'
        },
        products: orderProducts,
        pricing: {
          subTotal,
          discountTotal: 0,
          taxRatePercent: 18,
          taxTotal,
          freightAndInsurance: 0,
          totalOrderValue: finalVal
        },
        commercialTerms: {
          priceBasis: 'Ex-works Salem Manufacturing Facility',
          paymentTerms: '30% Advance, 70% against PI',
          deliveryTerms: '10 to 12 weeks',
          warrantyTerms: '18 months from dispatch'
        },
        verification: {
          isVerified,
          status: isVerified ? 'Verified' : 'Pending',
          checklist,
          mismatchCount: 0
        },
        timeline: [
          {
            event: 'Sales Order Initiated',
            status: orderStatus,
            notes: `Created from Requisition ${enq.ern}. Order reference: ${orderNumber}.`,
            timestamp: poDate
          }
        ],
        createdAt: poDate,
        updatedAt: new Date()
      });
    }
    console.log('[Sync] All enquiries and customer POs synchronized into Sales Orders.');
  } catch (err) {
    console.error('[Sync] Error syncing enquiries to sales orders:', err.message);
  }
};
