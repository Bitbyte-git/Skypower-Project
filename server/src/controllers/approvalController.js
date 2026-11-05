import { Enquiry } from '../models/Enquiry.js';
import { Approval } from '../models/Approval.js';
import { APPROVAL_STATUSES } from '../constants/statuses.js';
import { logActivity } from '../services/auditService.js';

export const getPendingApprovals = async (req, res, next) => {
  try {
    const pendingEnquiries = await Enquiry.find({
      approvalStatus: APPROVAL_STATUSES.PENDING_APPROVAL
    })
      .populate('clientId', 'companyName clientLocation contactPerson mobile customerType')
      .populate('assignedSalesEngineer', 'name email phone')
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      count: pendingEnquiries.length,
      enquiries: pendingEnquiries
    });
  } catch (err) {
    next(err);
  }
};

export const approveEnquiry = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;

    const enquiry = await Enquiry.findById(id);
    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: 'Enquiry not found.'
      });
    }

    if (enquiry.approvalStatus !== APPROVAL_STATUSES.PENDING_APPROVAL) {
      return res.status(400).json({
        success: false,
        message: `Only enquiries in 'Pending Approval' status can be approved (Current: ${enquiry.approvalStatus}).`
      });
    }

    const previousStatus = enquiry.approvalStatus;
    enquiry.approvalStatus = APPROVAL_STATUSES.APPROVED;
    await enquiry.save();

    // Create immutable approval record
    const approvalRecord = await Approval.create({
      enquiryId: enquiry._id,
      ern: enquiry.ern,
      action: 'APPROVED',
      adminId: req.user._id,
      adminRemarks: remarks || 'Approved for Quotation preparation.',
      previousStatus,
      newStatus: APPROVAL_STATUSES.APPROVED
    });

    await logActivity({
      userId: req.user._id,
      userRole: req.user.role,
      action: 'ENQUIRY_APPROVED',
      entityType: 'Enquiry',
      entityId: enquiry._id,
      ern: enquiry.ern,
      details: { approvalRecordId: approvalRecord._id, remarks },
      req
    });

    return res.status(200).json({
      success: true,
      message: `Enquiry ${enquiry.ern} has been approved. It is now eligible for quotation generation.`,
      enquiry,
      approval: approvalRecord
    });
  } catch (err) {
    next(err);
  }
};

export const returnEnquiry = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;

    const effectiveRemarks =
      remarks && remarks.trim().length >= 3
        ? remarks.trim()
        : 'Administrative review requested: please verify technical parameters, ratings, and bill of quantities before resubmitting.';

    const enquiry = await Enquiry.findById(id);
    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: 'Enquiry not found.'
      });
    }

    if (
      enquiry.approvalStatus !== APPROVAL_STATUSES.PENDING_APPROVAL &&
      enquiry.approvalStatus !== APPROVAL_STATUSES.APPROVED
    ) {
      return res.status(400).json({
        success: false,
        message: `Only enquiries in 'Pending Approval' or 'Approved' status can be returned for correction (Current: ${enquiry.approvalStatus}).`
      });
    }

    const previousStatus = enquiry.approvalStatus;
    enquiry.approvalStatus = APPROVAL_STATUSES.RETURNED_FOR_CORRECTION;
    enquiry.enquiryRemarks = effectiveRemarks;
    await enquiry.save();

    const approvalRecord = await Approval.create({
      enquiryId: enquiry._id,
      ern: enquiry.ern,
      action: 'RETURNED',
      adminId: req.user._id,
      adminRemarks: effectiveRemarks,
      previousStatus,
      newStatus: APPROVAL_STATUSES.RETURNED_FOR_CORRECTION
    });

    await logActivity({
      userId: req.user._id,
      userRole: req.user.role,
      action: 'ENQUIRY_RETURNED',
      entityType: 'Enquiry',
      entityId: enquiry._id,
      ern: enquiry.ern,
      details: { remarks: effectiveRemarks },
      req
    });

    return res.status(200).json({
      success: true,
      message: `Enquiry ${enquiry.ern} returned for correction. Sales team has been notified.`,
      enquiry,
      approval: approvalRecord
    });
  } catch (err) {
    next(err);
  }
};

export const rejectEnquiry = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;

    const effectiveRemarks =
      remarks && remarks.trim().length >= 3
        ? remarks.trim()
        : 'Administrative rejection: commercial or technical non-compliance with plant production capabilities.';

    const enquiry = await Enquiry.findById(id);
    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: 'Enquiry not found.'
      });
    }

    const previousStatus = enquiry.approvalStatus;
    enquiry.approvalStatus = APPROVAL_STATUSES.REJECTED;
    enquiry.enquiryRemarks = effectiveRemarks;
    await enquiry.save();

    const approvalRecord = await Approval.create({
      enquiryId: enquiry._id,
      ern: enquiry.ern,
      action: 'REJECTED',
      adminId: req.user._id,
      adminRemarks: effectiveRemarks,
      previousStatus,
      newStatus: APPROVAL_STATUSES.REJECTED
    });

    await logActivity({
      userId: req.user._id,
      userRole: req.user.role,
      action: 'ENQUIRY_REJECTED',
      entityType: 'Enquiry',
      entityId: enquiry._id,
      ern: enquiry.ern,
      details: { remarks: effectiveRemarks },
      req
    });

    return res.status(200).json({
      success: true,
      message: `Enquiry ${enquiry.ern} has been rejected. Quotation generation is permanently locked.`,
      enquiry,
      approval: approvalRecord
    });
  } catch (err) {
    next(err);
  }
};

export const getEnquiryApprovalHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const approvals = await Approval.find({ enquiryId: id })
      .populate('adminId', 'name email role')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      history: approvals
    });
  } catch (err) {
    next(err);
  }
};

