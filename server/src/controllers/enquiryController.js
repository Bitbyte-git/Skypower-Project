import { Enquiry } from '../models/Enquiry.js';
import { Client } from '../models/Client.js';
import { generateNextERN } from '../services/counterService.js';
import { APPROVAL_STATUSES, COMMERCIAL_STATUSES } from '../constants/statuses.js';
import { USER_ROLES } from '../constants/roles.js';
import { logActivity } from '../services/auditService.js';
import { initializeProjectWorkflow } from '../services/seedService.js';

export const createEnquiry = async (req, res, next) => {
  try {
    const ern = await generateNextERN();

    // Verify client exists
    const client = await Client.findById(req.body.clientId);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Selected client does not exist.'
      });
    }

    // Compute expectedProjectValue from products if not explicitly passed
    let calculatedTotal = 0;
    const products = (req.body.products || []).map((p) => {
      const lineTotal = Number(p.totalProductValue) || (Number(p.quantity) * Number(p.estimatedUnitValue)) || 0;
      calculatedTotal += lineTotal;
      return {
        ...p,
        totalProductValue: lineTotal
      };
    });

    const expectedProjectValue = Number(req.body.expectedProjectValue) > 0
      ? Number(req.body.expectedProjectValue)
      : calculatedTotal;

    const enquiry = await Enquiry.create({
      ...req.body,
      ern,
      products,
      expectedProjectValue,
      customerType: req.body.customerType || client.customerType,
      assignedSalesEngineer: req.user._id,
      approvalStatus: APPROVAL_STATUSES.DRAFT,
      commercialStatus: COMMERCIAL_STATUSES.IN_PROGRESS,
      currentRevision: 1
    });

    const workflow = await initializeProjectWorkflow(enquiry, req.user);

    await logActivity({
      userId: req.user._id,
      userRole: req.user.role,
      action: 'ENQUIRY_DRAFT_CREATED',
      entityType: 'Enquiry',
      entityId: enquiry._id,
      ern: enquiry.ern,
      details: { ern: enquiry.ern, expectedProjectValue, projectTrackingId: workflow?.projectTrackingId },
      req
    });

    return res.status(201).json({
      success: true,
      message: `Enquiry draft created successfully with ERN: ${ern}`,
      enquiry,
      projectWorkflow: workflow
    });
  } catch (err) {
    next(err);
  }
};

export const getEnquiries = async (req, res, next) => {
  try {
    const {
      search,
      approvalStatus,
      commercialStatus,
      enquiryType,
      clientId,
      page = 1,
      limit = 50
    } = req.query;

    const query = {};

    // Role-based visibility: Sales sees own enquiries by default unless Admin
    if (req.user.role === USER_ROLES.SALES && req.query.view !== 'all') {
      query.assignedSalesEngineer = req.user._id;
    }

    if (search) {
      query.$or = [
        { ern: { $regex: search, $options: 'i' } },
        { 'project.projectName': { $regex: search, $options: 'i' } },
        { 'project.projectLocation': { $regex: search, $options: 'i' } },
        { commands: { $regex: search, $options: 'i' } }
      ];
    }

    if (approvalStatus) query.approvalStatus = approvalStatus;
    if (commercialStatus) query.commercialStatus = commercialStatus;
    if (enquiryType) query.enquiryType = enquiryType;
    if (clientId) query.clientId = clientId;

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Enquiry.countDocuments(query);
    const enquiries = await Enquiry.find(query)
      .populate('clientId', 'companyName clientLocation contactPerson mobile customerType')
      .populate('assignedSalesEngineer', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    return res.status(200).json({
      success: true,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      enquiries
    });
  } catch (err) {
    next(err);
  }
};

export const getEnquiryById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const enquiry = await Enquiry.findById(id)
      .populate('clientId')
      .populate('assignedSalesEngineer', 'name email phone department')
      .populate('revisionHistory.modifiedBy', 'name role')
      .populate('handoverDetails.handedOverBy', 'name role');

    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: 'Enquiry not found.'
      });
    }

    return res.status(200).json({
      success: true,
      enquiry
    });
  } catch (err) {
    next(err);
  }
};

export const updateEnquiry = async (req, res, next) => {
  try {
    const { id } = req.params;
    const enquiry = await Enquiry.findById(id);

    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: 'Enquiry not found.'
      });
    }

    // Business restriction: Once approved, cannot be modified directly by Sales
    if (
      req.user.role === USER_ROLES.SALES &&
      enquiry.approvalStatus !== APPROVAL_STATUSES.DRAFT &&
      enquiry.approvalStatus !== APPROVAL_STATUSES.RETURNED_FOR_CORRECTION
    ) {
      return res.status(403).json({
        success: false,
        message: `Enquiries in '${enquiry.approvalStatus}' status cannot be edited. Only Draft or Returned enquiries are editable.`
      });
    }

    // Save revision snapshot before applying modifications
    enquiry.revisionHistory.push({
      revisionNumber: enquiry.currentRevision,
      modifiedAt: new Date(),
      modifiedBy: req.user._id,
      snapshot: enquiry.toObject(),
      changeSummary: req.body.changeSummary || 'Enquiry specifications updated'
    });

    enquiry.currentRevision += 1;

    // Recalculate line totals if products provided
    if (req.body.products) {
      let total = 0;
      req.body.products = req.body.products.map((p) => {
        const lineTotal = Number(p.totalProductValue) || (Number(p.quantity) * Number(p.estimatedUnitValue)) || 0;
        total += lineTotal;
        return { ...p, totalProductValue: lineTotal };
      });
      if (!req.body.expectedProjectValue || req.body.expectedProjectValue === 0) {
        req.body.expectedProjectValue = total;
      }
    }

    Object.assign(enquiry, req.body);
    await enquiry.save();

    await logActivity({
      userId: req.user._id,
      userRole: req.user.role,
      action: 'ENQUIRY_UPDATED',
      entityType: 'Enquiry',
      entityId: enquiry._id,
      ern: enquiry.ern,
      details: { revision: enquiry.currentRevision },
      req
    });

    return res.status(200).json({
      success: true,
      message: 'Enquiry updated successfully.',
      enquiry
    });
  } catch (err) {
    next(err);
  }
};

export const submitForApproval = async (req, res, next) => {
  try {
    const { id } = req.params;
    const enquiry = await Enquiry.findById(id);

    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: 'Enquiry not found.'
      });
    }

    if (
      enquiry.approvalStatus !== APPROVAL_STATUSES.DRAFT &&
      enquiry.approvalStatus !== APPROVAL_STATUSES.RETURNED_FOR_CORRECTION
    ) {
      return res.status(400).json({
        success: false,
        message: `Only Draft or Returned enquiries can be submitted for approval (Current status: ${enquiry.approvalStatus}).`
      });
    }

    const previousStatus = enquiry.approvalStatus;
    enquiry.approvalStatus = APPROVAL_STATUSES.PENDING_APPROVAL;
    await enquiry.save();

    await logActivity({
      userId: req.user._id,
      userRole: req.user.role,
      action: previousStatus === APPROVAL_STATUSES.RETURNED_FOR_CORRECTION ? 'ENQUIRY_RESUBMITTED' : 'ENQUIRY_SUBMITTED',
      entityType: 'Enquiry',
      entityId: enquiry._id,
      ern: enquiry.ern,
      details: { previousStatus, newStatus: APPROVAL_STATUSES.PENDING_APPROVAL },
      req
    });

    return res.status(200).json({
      success: true,
      message: `Enquiry ${enquiry.ern} has been successfully submitted for Admin approval.`,
      enquiry
    });
  } catch (err) {
    next(err);
  }
};

export const uploadEnquiryDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const enquiry = await Enquiry.findById(id);

    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: 'Enquiry not found.'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file was uploaded.'
      });
    }

    const docEntry = {
      fileName: req.file.filename,
      originalName: req.file.originalname,
      filePath: `/uploads/${req.file.filename}`,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      documentType: req.body.documentType || 'Supporting Document',
      version: enquiry.currentRevision,
      uploadedBy: req.user._id,
      uploadDate: new Date()
    };

    enquiry.documents.push(docEntry);
    await enquiry.save();

    await logActivity({
      userId: req.user._id,
      userRole: req.user.role,
      action: 'DOCUMENT_UPLOADED',
      entityType: 'Enquiry',
      entityId: enquiry._id,
      ern: enquiry.ern,
      details: { fileName: req.file.originalname, fileSize: req.file.size },
      req
    });

    return res.status(200).json({
      success: true,
      message: 'Document uploaded successfully.',
      document: docEntry
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete an uploaded document from an enquiry
 */
export const deleteEnquiryDocument = async (req, res, next) => {
  try {
    const { id, docId } = req.params;
    const enquiry = await Enquiry.findById(id);

    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: 'Enquiry not found.'
      });
    }

    const docIndex = (enquiry.documents || []).findIndex(
      (d) => d._id?.toString() === docId || d.fileName === docId
    );

    if (docIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Document attachment not found.'
      });
    }

    const removedDoc = enquiry.documents.splice(docIndex, 1)[0];
    await enquiry.save();

    return res.status(200).json({
      success: true,
      message: `Document '${removedDoc.originalName || 'file'}' removed successfully.`,
      documents: enquiry.documents
    });
  } catch (err) {
    next(err);
  }
};

export const handoverToRD = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { handoverNotes, poReference, poDate, poValue, poDocumentUrl } = req.body;

    const enquiry = await Enquiry.findById(id);
    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: 'Enquiry not found.'
      });
    }

    if (enquiry.approvalStatus !== APPROVAL_STATUSES.APPROVED) {
      return res.status(400).json({
        success: false,
        message: 'Only approved enquiries can be handed over to R&D / Design.'
      });
    }

    enquiry.handoverDetails = {
      isHandedOver: true,
      handedOverAt: new Date(),
      handedOverBy: req.user._id,
      targetDepartment: 'R&D / Design',
      handoverNotes: handoverNotes || 'Order confirmed. Technical drawings and manufacturing clearance required.',
      poReference,
      poDate: poDate ? new Date(poDate) : new Date(),
      poValue: Number(poValue) || enquiry.expectedProjectValue,
      poDocumentUrl
    };

    enquiry.commercialStatus = COMMERCIAL_STATUSES.WON;
    await enquiry.save();

    await logActivity({
      userId: req.user._id,
      userRole: req.user.role,
      action: 'ENQUIRY_HANDOVER_TO_RD',
      entityType: 'Enquiry',
      entityId: enquiry._id,
      ern: enquiry.ern,
      details: { poReference, poValue },
      req
    });

    return res.status(200).json({
      success: true,
      message: `Enquiry ${enquiry.ern} successfully handed over to R&D / Design with Order Confirmation.`,
      enquiry
    });
  } catch (err) {
    next(err);
  }
};

