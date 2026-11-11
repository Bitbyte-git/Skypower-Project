import { Enquiry } from '../models/Enquiry.js';
import { Approval } from '../models/Approval.js';
import { ProjectWorkflow } from '../models/ProjectWorkflow.js';
import { DepartmentApproval } from '../models/DepartmentApproval.js';
import {
  APPROVAL_STATUSES,
  PROJECT_WORKFLOW_STATUSES,
  DEPARTMENT_APPROVAL_STATUSES
} from '../constants/statuses.js';
import { logActivity } from '../services/auditService.js';
import { initializeProjectWorkflow, syncPendingEnquiries } from '../services/seedService.js';
import { createOrGetPOForEnquiry } from './workflowController.js';

export const getPendingApprovals = async (req, res, next) => {
  try {
    // 1. Auto-synchronize pending enquiries from sales
    await syncPendingEnquiries();

    // 2. Query all enquiries awaiting administrative clearance
    const pendingQuery = {
      $or: [
        { approvalStatus: { $in: [APPROVAL_STATUSES.PENDING_APPROVAL, APPROVAL_STATUSES.SUBMITTED, 'Submitted to Admin'] } },
        { approvalStatus: APPROVAL_STATUSES.DRAFT, 'products.0': { $exists: true } },
        { approvalStatus: APPROVAL_STATUSES.DRAFT, 'project.projectName': { $exists: true, $ne: '' } }
      ]
    };

    const pendingEnquiries = await Enquiry.find(pendingQuery)
      .populate('clientId', 'companyName clientLocation contactPerson mobile customerType')
      .populate('assignedSalesEngineer', 'name email phone')
      .sort({ updatedAt: -1 });

    const formatted = pendingEnquiries.map((e) => {
      const obj = e.toObject ? e.toObject() : { ...e };
      if (!obj.expectedProjectValue && obj.commercialPricing?.totalAmount) {
        obj.expectedProjectValue = obj.commercialPricing.totalAmount;
      }
      return obj;
    });

    return res.status(200).json({
      success: true,
      count: formatted.length,
      enquiries: formatted
    });
  } catch (err) {
    next(err);
  }
};

export const approveEnquiry = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;

    const enquiry = await Enquiry.findById(id).populate('clientId');
    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: 'Enquiry not found.'
      });
    }

    if (
      enquiry.approvalStatus !== APPROVAL_STATUSES.PENDING_APPROVAL &&
      enquiry.approvalStatus !== APPROVAL_STATUSES.SUBMITTED &&
      enquiry.approvalStatus !== 'Submitted to Admin' &&
      enquiry.approvalStatus !== APPROVAL_STATUSES.DRAFT
    ) {
      return res.status(400).json({
        success: false,
        message: `Only enquiries in 'Pending Approval' or 'Draft' status can be approved (Current: ${enquiry.approvalStatus}).`
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
      adminRemarks: remarks || 'Approved for Quotation preparation and PO Handover.',
      previousStatus,
      newStatus: APPROVAL_STATUSES.APPROVED
    });

    // Advance 10-Dept Workflow to PO_TEAM (Department 2)
    try {
      let wf = await ProjectWorkflow.findOne({ enquiryId: enquiry._id });
      if (!wf) {
        wf = await initializeProjectWorkflow(enquiry, req.user);
      }
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
    } catch (errWf) {
      console.error('Error syncing ProjectWorkflow & PO on Admin approve:', errWf);
    }

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
      message: `Enquiry ${enquiry.ern} has been approved. It is now eligible for quotation generation and PO Team handover.`,
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
      enquiry.approvalStatus !== APPROVAL_STATUSES.SUBMITTED &&
      enquiry.approvalStatus !== 'Draft' &&
      enquiry.approvalStatus !== APPROVAL_STATUSES.APPROVED
    ) {
      return res.status(400).json({
        success: false,
        message: `Only enquiries awaiting approval or approved can be returned for correction (Current: ${enquiry.approvalStatus}).`
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

