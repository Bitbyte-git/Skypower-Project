import { Client } from '../models/Client.js';
import { Enquiry } from '../models/Enquiry.js';
import { PurchaseOrder } from '../models/PurchaseOrder.js';
import { generateNextClientID, generateNextERN, generateNextPOID } from '../services/counterService.js';
import { logActivity } from '../services/auditService.js';
import { USER_ROLES } from '../constants/roles.js';
import { initializeProjectWorkflow } from '../services/seedService.js';

/**
 * Step 1: Validate or Register Client
 * Generates SP-CL-YYYY-XXXX once for new client.
 * For existing client, returns existing Client ID without regeneration.
 */
export const registerOrSelectClient = async (req, res, next) => {
  try {
    const { isNewClient, clientId, companyName, customerType, contactPerson, mobile, email, siteAddress } = req.body;

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

    const createdClient = await Client.create({
      clientId: newGeneratedClientId,
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
        .select('clientId companyName customerType contactPerson mobile email siteAddress');
      return res.status(200).json({ success: true, clients: recentClients });
    }

    const searchRegex = new RegExp(q.trim(), 'i');
    const matched = await Client.find({
      $or: [
        { clientId: searchRegex },
        { companyName: searchRegex },
        { contactPerson: searchRegex },
        { mobile: searchRegex }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .select('clientId companyName customerType contactPerson mobile email siteAddress');

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
      const basicPrice = Number(p.basicPrice) || 315000;
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
      if (commercialPricing) enquiry.commercialPricing = { ...enquiry.commercialPricing, ...commercialPricing };
      if (clientCustomId) enquiry.clientCustomId = clientCustomId;

      // Update current revision snapshot
      if (enquiry.offeringRevisions && enquiry.offeringRevisions.length > 0) {
        const latestIdx = enquiry.offeringRevisions.length - 1;
        enquiry.offeringRevisions[latestIdx].productsSnapshot = enquiry.products;
        enquiry.offeringRevisions[latestIdx].pricingSnapshot = enquiry.commercialPricing;
        enquiry.offeringRevisions[latestIdx].totalAmount = enquiry.commercialPricing?.totalAmount || 0;
      }

      await enquiry.save();

      return res.status(200).json({
        success: true,
        message: 'Enquiry workflow draft updated successfully.',
        enquiry
      });
    }

    // Create new enquiry
    const ern = await generateNextERN();
    const initialVersion = 'OFR-001';

    const newEnquiry = await Enquiry.create({
      ern,
      clientId: client._id,
      clientCustomId,
      customerType: client.customerType || 'Contractor',
      offerDate: new Date(),
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
          basicPrice: 500000,
          totalBasicPrice: 500000,
          productDescription: '11kV, 630A, 26.3 kA, 3 Sec, Indoor VCB Switchboard (Transformer Control)'
        }
      ],
      commercialPricing: commercialPricing || {
        priceBasis: 'Ex-Works: Salem, Tamil Nadu',
        transportPrice: 20000,
        forBasis: 'Client Own Transport (Default)',
        subTotal: 520000,
        gstType: 'INTRA_STATE',
        cgstRate: 9,
        sgstRate: 9,
        igstRate: 18,
        cgstAmount: 46800,
        sgstAmount: 46800,
        igstAmount: 0,
        totalTaxAmount: 93600,
        totalAmount: 613600,
        amountInWords: 'Six Lakhs Thirteen Thousand Six Hundred Rupees Only.'
      },
      assignedSalesEngineer: req.user._id,
      approvalStatus: 'Draft',
      currentOfferingVersion: initialVersion,
      offeringRevisions: [
        {
          versionId: initialVersion,
          versionNumber: 1,
          createdAt: new Date(),
          createdBy: req.user._id,
          totalAmount: commercialPricing?.totalAmount || 613600,
          status: 'Draft',
          productsSnapshot: formattedProducts,
          pricingSnapshot: commercialPricing,
          changeSummary: 'Initial Offering Draft Created'
        }
      ]
    });

    const workflow = await initializeProjectWorkflow(newEnquiry, req.user);

    await logActivity({
      userId: req.user._id,
      userRole: req.user.role,
      action: 'WORKFLOW_OFFERING_DRAFT_CREATED',
      entityType: 'Enquiry',
      entityId: newEnquiry._id,
      ern: newEnquiry.ern,
      details: { ern: newEnquiry.ern, clientCustomId, version: initialVersion, projectTrackingId: workflow?.projectTrackingId },
      req
    });

    return res.status(201).json({
      success: true,
      message: `Enquiry workflow created with ERN: ${ern}`,
      enquiry: newEnquiry,
      projectWorkflow: workflow
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

    const enquiry = await Enquiry.findById(enquiryId);
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
      enquiry.products = revisedProducts.map((p) => ({
        ...p,
        basicPrice: Number(p.basicPrice) || 315000,
        quantity: Math.max(1, Number(p.quantity) || 1),
        totalBasicPrice: (Number(p.basicPrice) || 315000) * Math.max(1, Number(p.quantity) || 1)
      }));
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
    const enquiry = await Enquiry.findById(enquiryId);
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
 * Step 6: Finalize Approved Offering & Send to PO Team
 * Generates unique PO ID (PO-YYYY-XXXX).
 * Creates PurchaseOrder record using technical snapshot.
 */
export const finalizeAndSendToPO = async (req, res, next) => {
  try {
    const { enquiryId, offeringVersionId } = req.body;

    const enquiry = await Enquiry.findById(enquiryId).populate('clientId');
    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found.' });
    }

    // Check if PO already exists for this enquiry to prevent duplicates
    const existingPO = await PurchaseOrder.findOne({ enquiryId: enquiry._id });
    if (existingPO) {
      return res.status(200).json({
        success: true,
        message: 'Offering has already been submitted to PO Team.',
        po: existingPO,
        poId: existingPO.poId,
        clientId: existingPO.clientId,
        offeringVersionId: existingPO.offeringVersionId
      });
    }

    const versionToFinalize = offeringVersionId || enquiry.currentOfferingVersion;

    // Generate unique PO ID: PO-YYYY-XXXX (e.g. PO-2026-0089)
    const poId = await generateNextPOID();
    const clientCustomId = enquiry.clientCustomId || enquiry.clientId?.clientId || 'SP-CL-2026-0001';
    const projectId = enquiry.project?.projectId || `PRJ-${enquiry.ern.replace(/^ERN-/, '')}`;

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
      productDescription: p.productDescription || `${p.kilovolt}, ${p.ampere}, ${p.kiloampere}, ${p.durationSec}, ${p.usage} ${p.productName} (${p.ebMetering})`,
      technicalSpecifications: p.technicalSpecifications || ''
    }));

    const finalApprovedAmount = enquiry.commercialPricing?.totalAmount || 0;

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
      submittedBy: req.user._id,
      submittedAt: new Date(),
      timeline: [
        {
          status: 'Submitted to PO Team',
          notes: `Offering ${versionToFinalize} approved and submitted for production handover.`,
          updatedBy: req.user._id,
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
      submittedBy: req.user._id
    };

    // Mark finalized revision status
    const rev = (enquiry.offeringRevisions || []).find((r) => r.versionId === versionToFinalize);
    if (rev) {
      rev.status = 'Approved';
    }

    await enquiry.save();

    await logActivity({
      userId: req.user._id,
      userRole: req.user.role,
      action: 'OFFERING_FINALIZED_SENT_TO_PO',
      entityType: 'PurchaseOrder',
      entityId: po._id,
      ern: enquiry.ern,
      details: { poId: po.poId, clientId: clientCustomId, versionId: versionToFinalize },
      req
    });

    return res.status(201).json({
      success: true,
      message: 'Offering Successfully Submitted to PO Team',
      poId: po.poId,
      clientId: clientCustomId,
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

    const query = {};
    if (status) query.status = status;
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

