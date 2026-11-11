import { Client } from '../models/Client.js';
import { Enquiry } from '../models/Enquiry.js';
import { PurchaseOrder } from '../models/PurchaseOrder.js';
import { ProjectWorkflow } from '../models/ProjectWorkflow.js';
import { DepartmentApproval } from '../models/DepartmentApproval.js';
import { generateNextClientID, generateNextERN, generateNextPOID } from '../services/counterService.js';
import { logActivity } from '../services/auditService.js';
import { USER_ROLES } from '../constants/roles.js';
import { initializeProjectWorkflow, syncPendingEnquiries } from '../services/seedService.js';
import { APPROVAL_STATUSES, DEPARTMENT_APPROVAL_STATUSES, PROJECT_WORKFLOW_STATUSES } from '../constants/statuses.js';

/**
 * Step 1: Validate or Register Client
 * Generates SP-CL-YYYY-XXXX once for new client.
 * For existing client, returns existing Client ID without regeneration.
 */
export const registerOrSelectClient = async (req, res, next) => {
  try {
    const { isNewClient, clientId, name, clientName, companyName, customerType, contactPerson, mobile, email, siteAddress } = req.body;

    // Existing Client selection
    if (!isNewClient && clientId) {
      const existingClient = await Client.findOne({
        $or: [{ _id: clientId.match(/^[0-9a-fA-F]{24}$/) ? clientId : null }, { clientId: clientId.trim() }]
      });

      if (!existingClient) {
        return res.status(404).json({
          success: false,
          message: 'Selected client not found in system.'
        });
      }

      // Ensure client has a formatted clientId
      if (!existingClient.clientId) {
        existingClient.clientId = await generateNextClientID();
        await existingClient.save();
      }

      return res.status(200).json({
        success: true,
        message: 'Existing client selected successfully.',
        client: existingClient
      });
    }

    // New Client Registration
    if (!companyName || !customerType || !contactPerson || !mobile) {
      return res.status(400).json({
        success: false,
        message: 'Company Name, Customer Type, Contact Person, and Contact Number are mandatory.'
      });
    }

    // Validate mobile (exactly 10 digits)
    if (!/^[0-9]{10}$/.test(String(mobile).trim())) {
      return res.status(400).json({
        success: false,
        message: 'Contact Number must be exactly 10 digits.'
      });
    }

    // Check duplicate by company name
    const duplicateCompany = await Client.findOne({
      companyName: { $regex: new RegExp(`^${companyName.trim()}$`, 'i') }
    });
    if (duplicateCompany) {
      return res.status(409).json({
        success: false,
        message: `Client with company name '${companyName.trim()}' already exists (Client ID: ${duplicateCompany.clientId || 'Registered'}). Please select from existing clients.`
      });
    }

    // Check duplicate by mobile
    const duplicateMobile = await Client.findOne({ mobile: mobile.trim() });
    if (duplicateMobile) {
      return res.status(409).json({
        success: false,
        message: `Contact number '${mobile}' is already registered under '${duplicateMobile.companyName}' (Client ID: ${duplicateMobile.clientId || 'Registered'}).`
      });
    }

    // Generate unique Client ID: SP-CL-YYYY-XXXX
    const newGeneratedClientId = await generateNextClientID();
    const resolvedName = (name || clientName || companyName || '').trim();

    const createdClient = await Client.create({
      clientId: newGeneratedClientId,
      name: resolvedName,
      clientName: resolvedName,
      companyName: companyName.trim(),
      customerType: customerType.trim(),
      contactPerson: contactPerson.trim(),
      mobile: mobile.trim(),
      email: email ? email.trim().toLowerCase() : '',
      siteAddress: siteAddress ? siteAddress.trim() : '',
      clientLocation: siteAddress ? siteAddress.trim().slice(0, 100) : 'Tamil Nadu',
      createdBy: req.user._id
    });

    await logActivity({
      userId: req.user._id,
      userRole: req.user.role,
      action: 'CLIENT_CREATED',
      entityType: 'Client',
      entityId: createdClient._id,
      details: { clientId: newGeneratedClientId, companyName: createdClient.companyName },
      req
    });

    return res.status(201).json({
      success: true,
      message: 'Client registered successfully.',
      client: createdClient
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Fast search for existing clients
 */
export const searchExistingClients = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length === 0) {
      const recentClients = await Client.find({})
        .sort({ createdAt: -1 })
        .limit(10)
        .select('clientId name clientName companyName customerType contactPerson mobile email siteAddress');
      return res.status(200).json({ success: true, clients: recentClients });
    }

    const searchRegex = new RegExp(q.trim(), 'i');
    const matched = await Client.find({
      $or: [
        { clientId: searchRegex },
        { name: searchRegex },
        { clientName: searchRegex },
        { companyName: searchRegex },
        { contactPerson: searchRegex },
        { mobile: searchRegex }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .select('clientId name clientName companyName customerType contactPerson mobile email siteAddress');

    return res.status(200).json({
      success: true,
      clients: matched
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Save / Update Multi-Step Enquiry Workflow Draft (Steps 1 to 4)
 */
export const saveWorkflowDraft = async (req, res, next) => {
  try {
    const { enquiryId, clientId, clientData, project, products, commercialPricing, step } = req.body;

    let client = null;
    if (clientId) {
      client = await Client.findById(clientId);
    } else if (clientData?.companyName) {
      client = await Client.findOne({ companyName: clientData.companyName });
    }

    if (!client && !enquiryId) {
      return res.status(400).json({
        success: false,
        message: 'Client must be registered or selected before creating enquiry draft.'
      });
    }

    // Ensure client has custom clientId
    if (client && !client.clientId) {
      client.clientId = await generateNextClientID();
      await client.save();
    }

    const clientCustomId = client?.clientId || clientData?.clientId || 'SP-CL-2026-0001';

    // Format products
    const formattedProducts = (products || []).map((p) => {
      const basicPrice = p.basicPrice !== undefined && !isNaN(Number(p.basicPrice)) ? Number(p.basicPrice) : 315000;
      const quantity = Math.max(1, Number(p.quantity) || 1);
      const totalBasicPrice = basicPrice * quantity;
      return {
        ...p,
        basicPrice,
        quantity,
        totalBasicPrice,
        totalProductValue: totalBasicPrice
      };
    });

    // If existing enquiry, update
    if (enquiryId) {
      const enquiry = await Enquiry.findById(enquiryId);
      if (!enquiry) {
        return res.status(404).json({ success: false, message: 'Enquiry draft not found.' });
      }

      if (project) enquiry.project = { ...enquiry.project, ...project };
      if (products && products.length > 0) enquiry.products = formattedProducts;
      if (commercialPricing) {
        enquiry.commercialPricing = { ...enquiry.commercialPricing, ...commercialPricing };
        enquiry.expectedProjectValue = commercialPricing.totalAmount || enquiry.expectedProjectValue || 0;
      }
      if (clientCustomId) enquiry.clientCustomId = clientCustomId;

      // Automatically transition to Pending Approval when products and pricing are configured
      if ((step >= 4 || (enquiry.products && enquiry.products.length > 0)) && enquiry.approvalStatus === 'Draft') {
        enquiry.approvalStatus = 'Pending Approval';
      }

      // Update current revision snapshot
      if (enquiry.offeringRevisions && enquiry.offeringRevisions.length > 0) {
        const latestIdx = enquiry.offeringRevisions.length - 1;
        enquiry.offeringRevisions[latestIdx].productsSnapshot = enquiry.products;
        enquiry.offeringRevisions[latestIdx].pricingSnapshot = enquiry.commercialPricing;
        enquiry.offeringRevisions[latestIdx].totalAmount = enquiry.commercialPricing?.totalAmount || 0;
      }

      await enquiry.save();

      // Ensure 10-Dept ProjectWorkflow is initialized and synced
      try {
        await initializeProjectWorkflow(enquiry, req.user);
      } catch (eWf) {}

      return res.status(200).json({
        success: true,
        message: 'Enquiry workflow draft updated successfully.',
        enquiry
      });
    }

    // Create new enquiry
    const ern = await generateNextERN();
    const initialVersion = 'OFR-001';
    const initialTotalAmount = commercialPricing?.totalAmount || 613600;

    const newEnquiry = await Enquiry.create({
      ern,
      clientId: client._id,
      clientCustomId,
      customerType: client.customerType || 'Contractor',
      offerDate: new Date(),
      expectedProjectValue: initialTotalAmount,
      project: project || {
        standardType: 'Standard',
        projectName: '11kV VCB Switchboard for Project',
        segment: 'Renewable',
        subSegment: 'Wind'
      },
      products: formattedProducts.length > 0 ? formattedProducts : [
        {
          productName: 'VCB Switchboard',
          kilovolt: '11 kV',
          ampere: '630 A',
          kiloampere: '26.3 kA',
          durationSec: 'For 3 Sec',
          usage: 'Indoor',
          ebMetering: 'Transformer Control',
          quantity: 1,
          basicPrice: 50000,
          totalBasicPrice: 50000,
          productDescription: '11kV, 630A, 26.3 kA, 3 Sec, Indoor VCB Switchboard (Transformer Control)'
        }
      ],
      commercialPricing: commercialPricing || {
        priceBasis: 'Ex-Works: Salem, Tamil Nadu',
        transportPrice: 20000,
        forBasis: 'Client Own Transport (Default)',
        subTotal: 50000,
        gstType: 'INTRA_STATE',
        cgstRate: 9,
        sgstRate: 9,
        igstRate: 18,
        cgstAmount: 4500,
        sgstAmount: 4500,
        igstAmount: 0,
        totalTaxAmount: 9000,
        totalAmount: 59000,
        amountInWords: 'Fifty Nine Thousand Rupees Only.'
      },
      assignedSalesEngineer: req.user._id,
      approvalStatus: step >= 4 || formattedProducts.length > 0 ? 'Pending Approval' : 'Draft',
      currentOfferingVersion: initialVersion,
      offeringRevisions: [
        {
          versionId: initialVersion,
          versionNumber: 1,
          createdAt: new Date(),
          createdBy: req.user._id,
          totalAmount: initialTotalAmount,
          status: 'Draft',
          productsSnapshot: formattedProducts,
          pricingSnapshot: commercialPricing,
          changeSummary: 'Initial Offering Draft Created'
        }
      ]
    });

    // Auto-initialize 10-Dept ProjectWorkflow
    try {
      await initializeProjectWorkflow(newEnquiry, req.user);
    } catch (eWf) {}

    await logActivity({
      userId: req.user._id,
      userRole: req.user.role,
      action: 'WORKFLOW_OFFERING_DRAFT_CREATED',
      entityType: 'Enquiry',
      entityId: newEnquiry._id,
      ern: newEnquiry.ern,
      details: { ern: newEnquiry.ern, clientCustomId, version: initialVersion },
      req
    });

    return res.status(201).json({
      success: true,
      message: `Enquiry workflow created with ERN: ${ern}`,
      enquiry: newEnquiry
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get Enquiry Workflow by ID with Client & Revisions
 */
export const getWorkflowEnquiry = async (req, res, next) => {
  try {
    const { id } = req.params;
    const enquiry = await Enquiry.findById(id).populate('clientId').populate('assignedSalesEngineer', 'name email role');

    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found.' });
    }

    return res.status(200).json({
      success: true,
      enquiry
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Step 5: Create Offering Revision (OFR-002, OFR-003, etc.)
 * NEVER generates a new Client ID! Preserves previous versions.
 */
export const createOfferingRevision = async (req, res, next) => {
  try {
    const { enquiryId, changeSummary, revisedProducts, revisedPricing } = req.body;

    let enquiry = null;
    if (enquiryId) {
      try {
        enquiry = await Enquiry.findById(enquiryId);
      } catch (e) {
        enquiry = null;
      }
    }
    if (!enquiry) {
      enquiry = await Enquiry.findOne().sort({ createdAt: -1 });
    }
    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found.' });
    }

    const currentRevisions = enquiry.offeringRevisions || [];
    const nextVerNumber = currentRevisions.length + 1;
    const nextVerId = `OFR-${String(nextVerNumber).padStart(3, '0')}`;

    // Mark previous current revision as superseded or preserved
    if (currentRevisions.length > 0) {
      const lastRev = currentRevisions[currentRevisions.length - 1];
      if (lastRev.status === 'Draft' || lastRev.status === 'Current') {
        lastRev.status = 'Superseded';
      }
    }

    // Apply updated products & pricing if provided
    if (revisedProducts && revisedProducts.length > 0) {
      enquiry.products = revisedProducts.map((p) => {
        const basicPrice = p.basicPrice !== undefined && !isNaN(Number(p.basicPrice)) ? Number(p.basicPrice) : 315000;
        const quantity = Math.max(1, Number(p.quantity) || 1);
        return {
          ...p,
          basicPrice,
          quantity,
          totalBasicPrice: basicPrice * quantity
        };
      });
    }

    if (revisedPricing) {
      enquiry.commercialPricing = {
        ...enquiry.commercialPricing,
        ...revisedPricing
      };
    }

    const newRevisionRecord = {
      versionId: nextVerId,
      versionNumber: nextVerNumber,
      createdAt: new Date(),
      createdBy: req.user._id,
      totalAmount: enquiry.commercialPricing?.totalAmount || 0,
      status: 'Draft',
      productsSnapshot: enquiry.products,
      pricingSnapshot: enquiry.commercialPricing,
      changeSummary: changeSummary || `Revision ${nextVerId} created`
    };

    enquiry.offeringRevisions.push(newRevisionRecord);
    enquiry.currentOfferingVersion = nextVerId;
    enquiry.currentRevision = nextVerNumber;
    await enquiry.save();

    await logActivity({
      userId: req.user._id,
      userRole: req.user.role,
      action: 'OFFERING_REVISION_CREATED',
      entityType: 'Enquiry',
      entityId: enquiry._id,
      ern: enquiry.ern,
      details: { versionId: nextVerId, clientCustomId: enquiry.clientCustomId },
      req
    });

    return res.status(201).json({
      success: true,
      message: `Offering revision ${nextVerId} created successfully.`,
      currentVersionId: nextVerId,
      revisions: enquiry.offeringRevisions,
      enquiry
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Step 5: Send / Re-Send Offering to Client
 */
export const sendOfferingToClient = async (req, res, next) => {
  try {
    const { enquiryId, versionId } = req.body;
    let enquiry = null;
    if (enquiryId) {
      try {
        enquiry = await Enquiry.findById(enquiryId);
      } catch (e) {
        enquiry = null;
      }
    }
    if (!enquiry) {
      enquiry = await Enquiry.findOne().sort({ createdAt: -1 });
    }
    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found.' });
    }

    const targetVersion = versionId || enquiry.currentOfferingVersion;
    const rev = (enquiry.offeringRevisions || []).find((r) => r.versionId === targetVersion);
    if (rev) {
      rev.status = 'Sent';
    }

    enquiry.approvalStatus = 'Sent to Client';
    await enquiry.save();

    await logActivity({
      userId: req.user._id,
      userRole: req.user.role,
      action: 'OFFERING_SENT_TO_CLIENT',
      entityType: 'Enquiry',
      entityId: enquiry._id,
      ern: enquiry.ern,
      details: { versionId: targetVersion, clientCustomId: enquiry.clientCustomId },
      req
    });

    return res.status(200).json({
      success: true,
      message: `Offering ${targetVersion} marked as Sent to client.`,
      enquiry
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Helper to ensure a unique PurchaseOrder record exists for an approved enquiry.
 * Strictly respects Client ID privacy (strips name and address).
 */
export const createOrGetPOForEnquiry = async (enquiry, user = null, remarks = '') => {
  if (!enquiry) return null;

  // Check if PO already exists for this enquiry to prevent duplicates
  let existingPO = await PurchaseOrder.findOne({ enquiryId: enquiry._id });
  if (existingPO) return existingPO;

  // Generate unique PO ID: PO-YYYY-XXXX (e.g. PO-2026-0089)
  const poId = await generateNextPOID();
  const clientCustomId = enquiry.clientCustomId || enquiry.clientId?.clientId || 'SP-CL-2026-0001';
  const projectId = enquiry.project?.projectId || `PRJ-${enquiry.ern ? enquiry.ern.replace(/^ERN-/, '') : '2026-0001'}`;
  const versionToFinalize = enquiry.currentOfferingVersion || 'OFR-001';

  // Map technical specifications snapshot for PO team
  const poProducts = (enquiry.products || []).map((p) => ({
    productName: p.productName || 'VCB Switchboard',
    kilovolt: p.kilovolt || '11 kV',
    ampere: p.ampere || '630 A',
    kiloampere: p.kiloampere || '26.3 kA',
    durationSec: p.durationSec || 'For 3 Sec',
    usage: p.usage || 'Indoor',
    ebMetering: p.ebMetering || 'Transformer Control',
    quantity: p.quantity || 1,
    productDescription: p.productDescription || `${p.kilovolt || '11 kV'}, ${p.ampere || '630 A'}, ${p.kiloampere || '26.3 kA'}, ${p.durationSec || 'For 3 Sec'}, ${p.usage || 'Indoor'} ${p.productName || 'Switchboard'} (${p.ebMetering || 'Transformer Control'})`,
    technicalSpecifications: p.technicalSpecifications || ''
  }));

  const finalApprovedAmount = enquiry.commercialPricing?.totalAmount || enquiry.expectedProjectValue || 0;
  const submittedBy = user?._id || enquiry.assignedSalesEngineer || '6aec628cce913c1739474f50';

  const po = await PurchaseOrder.create({
    poId,
    enquiryId: enquiry._id,
    ern: enquiry.ern,
    clientId: clientCustomId, // Strictly Client ID only
    projectId,
    projectTitle: enquiry.project?.projectName || 'HT Switchgear Project',
    segment: enquiry.project?.segment || 'Renewable',
    subSegment: enquiry.project?.subSegment || 'Wind',
    offeringVersionId: versionToFinalize,
    products: poProducts,
    finalApprovedAmount,
    status: 'Submitted to PO Team',
    submittedBy,
    submittedAt: new Date(),
    timeline: [
      {
        status: 'Submitted to PO Team',
        notes: remarks || `Offering ${versionToFinalize} approved by Admin and handed over to PO Team.`,
        updatedBy: submittedBy,
        updatedAt: new Date()
      }
    ]
  });

  // Update enquiry record
  enquiry.approvalStatus = 'Approved';
  enquiry.poDetails = {
    poId: po.poId,
    poObjectId: po._id,
    submittedAt: po.submittedAt,
    submittedBy
  };

  const rev = (enquiry.offeringRevisions || []).find((r) => r.versionId === versionToFinalize);
  if (rev) {
    rev.status = 'Approved';
  }

  await enquiry.save();
  return po;
};

/**
 * Step 6: Finalize Approved Offering & Send to PO Team
 * Generates unique PO ID (PO-YYYY-XXXX).
 * Creates PurchaseOrder record using technical snapshot.
 */
export const finalizeAndSendToPO = async (req, res, next) => {
  try {
    const { enquiryId, offeringVersionId } = req.body;

    let enquiry = null;
    if (enquiryId) {
      try {
        enquiry = await Enquiry.findById(enquiryId).populate('clientId');
      } catch (e) {
        enquiry = null;
      }
    }
    if (!enquiry) {
      enquiry = await Enquiry.findOne().sort({ createdAt: -1 }).populate('clientId');
    }
    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found.' });
    }

    // STRICT ISO CLEARANCE GATE: Only Admin-Approved projects can be handed over to PO Team
    if (enquiry.approvalStatus !== 'Approved') {
      return res.status(403).json({
        success: false,
        message: `Administrative Approval Required: Project ${enquiry.ern} is currently in '${enquiry.approvalStatus}' status. Executive Admin must approve this project before it can be handed over to the PO Team.`
      });
    }

    const versionToFinalize = offeringVersionId || enquiry.currentOfferingVersion;
    const po = await createOrGetPOForEnquiry(enquiry, req.user);

    await logActivity({
      userId: req.user._id,
      userRole: req.user.role,
      action: 'OFFERING_FINALIZED_SENT_TO_PO',
      entityType: 'PurchaseOrder',
      entityId: po._id,
      ern: enquiry.ern,
      details: { poId: po.poId, clientId: po.clientId, versionId: versionToFinalize },
      req
    });

    return res.status(201).json({
      success: true,
      message: 'Offering Successfully Submitted to PO Team',
      poId: po.poId,
      clientId: po.clientId,
      offeringVersionId: versionToFinalize,
      submittedAt: po.submittedAt,
      po
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PO Tracking List & Details
 * PO Team Restriction: Strips client personal information (companyName, contact, phone, email, address).
 */
export const getPOTrackingList = async (req, res, next) => {
  try {
    const isPOTeam = req.user.role === USER_ROLES.PO_TEAM;
    const { search, status, page = 1, limit = 50 } = req.query;

    // Auto-sync: Ensure every Admin-approved enquiry has a corresponding PurchaseOrder record
    try {
      const approvedEnqs = await Enquiry.find({ approvalStatus: 'Approved' }).populate('clientId');
      for (const enq of approvedEnqs) {
        const hasPO = await PurchaseOrder.findOne({ enquiryId: enq._id });
        if (!hasPO) {
          await createOrGetPOForEnquiry(enq, null, 'Auto-synced for PO execution');
        }
      }
    } catch (eSync) {
      console.error('[PO Tracking Sync] Error:', eSync.message);
    }

    const query = {};
    if (status) query.status = status;

    // PO Team can strictly only see projects whose commercial requisition was Approved by Admin
    if (isPOTeam) {
      const approvedEnquiries = await Enquiry.find({ approvalStatus: 'Approved' }).select('_id');
      const approvedEnquiryIds = approvedEnquiries.map((e) => e._id);
      query.enquiryId = { $in: approvedEnquiryIds };
    }

    if (search) {
      query.$or = [
        { poId: { $regex: search, $options: 'i' } },
        { clientId: { $regex: search, $options: 'i' } },
        { projectTitle: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await PurchaseOrder.countDocuments(query);
    const pos = await PurchaseOrder.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('submittedBy', 'name');

    // If PO Team, return strictly restricted fields
    const safePOs = pos.map((po) => {
      const base = {
        _id: po._id,
        poId: po.poId,
        clientId: po.clientId, // Client ID only
        projectId: po.projectId,
        projectTitle: po.projectTitle,
        segment: po.segment,
        subSegment: po.subSegment,
        offeringVersionId: po.offeringVersionId,
        products: po.products,
        status: po.status,
        submittedAt: po.submittedAt,
        timeline: po.timeline
      };

      // Sales & Admin can also see financial value
      if (!isPOTeam) {
        base.finalApprovedAmount = po.finalApprovedAmount;
        base.ern = po.ern;
      }

      return base;
    });

    return res.status(200).json({
      success: true,
      total,
      pos: safePOs
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Update PO Execution Status (PO Team or Admin)
 */
export const updatePOStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const po = await PurchaseOrder.findById(id);
    if (!po) {
      return res.status(404).json({ success: false, message: 'Purchase Order not found.' });
    }

    po.status = status || po.status;
    po.timeline.push({
      status: po.status,
      notes: notes || `Status updated to ${po.status}`,
      updatedBy: req.user._id,
      updatedAt: new Date()
    });

    await po.save();

    await logActivity({
      userId: req.user._id,
      userRole: req.user.role,
      action: 'PO_STATUS_UPDATED',
      entityType: 'PurchaseOrder',
      entityId: po._id,
      details: { poId: po.poId, newStatus: po.status },
      req
    });

    return res.status(200).json({
      success: true,
      message: `Purchase Order ${po.poId} status updated to '${po.status}'.`,
      po
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Submit Workflow Enquiry for Admin Approval
 */
export const submitWorkflowForApproval = async (req, res, next) => {
  try {
    const { enquiryId } = req.body;
    const enquiry = await Enquiry.findById(enquiryId);
    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found.' });
    }

    const prev = enquiry.approvalStatus;
    enquiry.approvalStatus = APPROVAL_STATUSES.PENDING_APPROVAL;
    if (!enquiry.expectedProjectValue && enquiry.commercialPricing?.totalAmount) {
      enquiry.expectedProjectValue = enquiry.commercialPricing.totalAmount;
    }
    await enquiry.save();

    try {
      await initializeProjectWorkflow(enquiry, req.user);
    } catch (e) {}

    await logActivity({
      userId: req.user._id,
      userRole: req.user.role,
      action: prev === APPROVAL_STATUSES.RETURNED_FOR_CORRECTION ? 'ENQUIRY_RESUBMITTED' : 'ENQUIRY_SUBMITTED',
      entityType: 'Enquiry',
      entityId: enquiry._id,
      ern: enquiry.ern,
      details: { previousStatus: prev, newStatus: APPROVAL_STATUSES.PENDING_APPROVAL },
      req
    });

    return res.status(200).json({
      success: true,
      message: `Project ${enquiry.ern} successfully submitted for Executive Admin Approval.`,
      enquiry
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Approve Workflow Enquiry directly as Admin
 */
export const approveWorkflowAsAdmin = async (req, res, next) => {
  try {
    if (req.user.role !== USER_ROLES.ADMIN) {
      return res.status(403).json({ success: false, message: 'Access denied: Executive Admin clearance required.' });
    }

    const { enquiryId, remarks } = req.body;
    const enquiry = await Enquiry.findById(enquiryId).populate('clientId');
    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found.' });
    }

    const prev = enquiry.approvalStatus;
    enquiry.approvalStatus = APPROVAL_STATUSES.APPROVED;
    await enquiry.save();

    // Advance 10-Dept Workflow to PO_TEAM
    try {
      let wf = await ProjectWorkflow.findOne({ enquiryId: enquiry._id });
      if (!wf) wf = await initializeProjectWorkflow(enquiry, req.user);
      if (wf) {
        await DepartmentApproval.findOneAndUpdate(
          { workflowId: wf._id, departmentSequence: 1 },
          {
            status: DEPARTMENT_APPROVAL_STATUSES.ACCEPTED,
            actionAt: new Date(),
            actionBy: req.user._id,
            actionByName: req.user.name,
            actionByRole: req.user.role,
            remarks: remarks || 'Approved by Executive Admin'
          }
        );
        await DepartmentApproval.findOneAndUpdate(
          { workflowId: wf._id, departmentSequence: 2 },
          { status: DEPARTMENT_APPROVAL_STATUSES.PENDING }
        );
        wf.currentDepartmentSequence = 2;
        wf.currentDepartmentCode = 'PO_TEAM';
        wf.overallStatus = PROJECT_WORKFLOW_STATUSES.PENDING_PO_APPROVAL;
        await wf.save();
      }

      // Generate or sync PurchaseOrder record for PO Team
      await createOrGetPOForEnquiry(enquiry, req.user, remarks);
    } catch (e) {
      console.error('Error auto-creating PO on Admin approve in workflowController:', e);
    }

    await logActivity({
      userId: req.user._id,
      userRole: req.user.role,
      action: 'ENQUIRY_APPROVED',
      entityType: 'Enquiry',
      entityId: enquiry._id,
      ern: enquiry.ern,
      details: { previousStatus: prev, newStatus: APPROVAL_STATUSES.APPROVED, remarks },
      req
    });

    return res.status(200).json({
      success: true,
      message: `Project ${enquiry.ern} successfully approved by Executive Admin. Cleared for PO Team handover.`,
      enquiry
    });
  } catch (err) {
    next(err);
  }
};

