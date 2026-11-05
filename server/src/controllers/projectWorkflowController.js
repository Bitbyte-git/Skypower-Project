import { ProjectWorkflow } from '../models/ProjectWorkflow.js';
import { Department } from '../models/Department.js';
import { DepartmentApproval } from '../models/DepartmentApproval.js';
import { WorkflowHistory } from '../models/WorkflowHistory.js';
import { Enquiry } from '../models/Enquiry.js';
import { Client } from '../models/Client.js';
import {
  PROJECT_WORKFLOW_STATUSES,
  DEPARTMENT_APPROVAL_STATUSES
} from '../constants/statuses.js';
import { USER_ROLES } from '../constants/roles.js';

// Departments permitted to view full client identity and contact information
// STRICT RULE: Only Sales & Marketing, Accountant, Delivery, and Installation visualize client details.
const CLIENT_VISIBLE_DEPARTMENTS = ['SALES', 'ACCOUNTANT', 'DELIVERY', 'INSTALLATION'];

/**
 * Sanitizes client data based strictly on requesting department.
 * Production departments (PO, Drawing, CT/PT, Fabrication, Metering Door, Testing)
 * only get technical specifications, ratings, line items, and tracking status.
 */
function sanitizeEnquiryClient(enquiry, departmentCode) {
  if (!enquiry) return null;
  const enqObj = enquiry.toObject ? enquiry.toObject() : { ...enquiry };

  const isClientVisibleDept = departmentCode && CLIENT_VISIBLE_DEPARTMENTS.includes(departmentCode.toUpperCase());

  // ONLY Sales & Marketing, Accountant, Delivery, and Installation can access client details
  if (isClientVisibleDept) {
    return enqObj;
  }

  // All other departments: completely strip client company, contact person, mobile, and email
  if (enqObj.clientId) {
    if (typeof enqObj.clientId === 'object') {
      enqObj.clientId = {
        _id: enqObj.clientId._id,
        clientId: enqObj.clientId.clientId || enqObj.clientCustomId,
        companyName: null,
        customerType: enqObj.clientId.customerType || enqObj.customerType || 'Contractor',
        contactPerson: null,
        mobile: null,
        email: null,
        siteAddress: enqObj.project?.projectSiteAddress || 'Site Delivery Location',
        billingAddress: null
      };
    } else {
      enqObj.clientId = null;
    }
  }

  if (enqObj.client) {
    enqObj.client = {
      clientId: enqObj.client.clientId || enqObj.clientCustomId,
      companyName: null,
      customerType: enqObj.client.customerType,
      contactPerson: null,
      mobile: null,
      email: null
    };
  }

  return enqObj;
}

/**
 * 1. Get all 10 master departments in sequence
 */
export const getDepartments = async (req, res, next) => {
  try {
    const departments = await Department.find({ isActive: true }).sort({ sequenceNumber: 1 });
    return res.status(200).json({
      success: true,
      departments
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 2. Get list of project workflows with filters and backend data visibility enforcement
 */
export const getProjectWorkflows = async (req, res, next) => {
  try {
    const { departmentCode, departmentSequence, status, search, page = 1, limit = 50 } = req.query;

    const query = {};

    // 1. Department-level filtering based on DepartmentApproval records
    if (departmentSequence || departmentCode) {
      let targetSeq = departmentSequence ? Number(departmentSequence) : null;

      if (!targetSeq && departmentCode) {
        const foundDept = await Department.findOne({ departmentCode: departmentCode.toUpperCase() });
        if (foundDept) targetSeq = foundDept.sequenceNumber;
      }

      if (targetSeq) {
        const approvalFilter = { departmentSequence: targetSeq };

        if (status && ['Pending', 'Accepted', 'Rejected'].includes(status)) {
          approvalFilter.status = status;
        } else if (status === 'ALL') {
          // All projects that have reached or passed through this department
          approvalFilter.status = { $in: ['Pending', 'Accepted', 'Rejected'] };
        }

        const matchingApprovals = await DepartmentApproval.find(approvalFilter).select('workflowId');
        const matchingWorkflowIds = matchingApprovals.map((a) => a.workflowId);
        query._id = { $in: matchingWorkflowIds };
      }
    }

    // 2. Overall Status filter (when requested specifically or outside department scope)
    if (status && Object.values(PROJECT_WORKFLOW_STATUSES).includes(status)) {
      query.overallStatus = status;
    }

    // 3. Search query filter
    if (search && search.trim()) {
      const s = search.trim();
      query.$or = [
        { projectTrackingId: new RegExp(s, 'i') }
      ];
    }

    const workflows = await ProjectWorkflow.find(query)
      .populate({
        path: 'enquiryId',
        populate: { path: 'clientId' }
      })
      .populate('currentDepartmentId')
      .populate('lastRejectedDepartmentId')
      .sort({ updatedAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const totalCount = await ProjectWorkflow.countDocuments(query);

    // Fetch department approvals for each workflow to attach approval matrix
    const workflowIds = workflows.map((w) => w._id);
    const allApprovals = await DepartmentApproval.find({ workflowId: { $in: workflowIds } }).sort({
      departmentSequence: 1
    });

    const approvalsByWorkflow = {};
    allApprovals.forEach((app) => {
      if (!approvalsByWorkflow[app.workflowId.toString()]) {
        approvalsByWorkflow[app.workflowId.toString()] = [];
      }
      approvalsByWorkflow[app.workflowId.toString()].push(app);
    });

    // Sanitize client details if viewing as production department and user is not Manager/Admin
    const sanitizedWorkflows = workflows.map((w) => {
      const wObj = w.toObject();
      wObj.approvals = approvalsByWorkflow[w._id.toString()] || [];

      // Determine active department code for data masking
      let activeDeptCode = departmentCode;
      if (!activeDeptCode && departmentSequence) {
        const dSeq = Number(departmentSequence);
        const map = {
          1: 'SALES',
          2: 'PO_TEAM',
          3: 'ACCOUNTANT',
          4: 'DRAWING',
          5: 'CT_PT',
          6: 'FABRICATION',
          7: 'METERING_DOOR',
          8: 'TESTING',
          9: 'DELIVERY',
          10: 'INSTALLATION'
        };
        activeDeptCode = map[dSeq];
      }
      if (!activeDeptCode) activeDeptCode = w.currentDepartmentCode;
      wObj.enquiryId = sanitizeEnquiryClient(wObj.enquiryId, activeDeptCode);

      return wObj;
    });

    // Priority sorting:
    // 1. Pending requests at the top (sequential by projectTrackingId)
    // 2. Accepted requests in the middle (sequential by projectTrackingId)
    // 3. Rejected requests at the bottom (sequential by projectTrackingId)
    const targetSeqNum = departmentSequence ? Number(departmentSequence) : null;
    if (targetSeqNum) {
      const statusRank = { Pending: 1, Accepted: 2, Rejected: 3, Waiting: 4 };
      sanitizedWorkflows.sort((a, b) => {
        const appA = (a.approvals || []).find((x) => x.departmentSequence === targetSeqNum);
        const appB = (b.approvals || []).find((x) => x.departmentSequence === targetSeqNum);
        const stA = appA?.status || (a.currentDepartmentSequence === targetSeqNum ? 'Pending' : 'Waiting');
        const stB = appB?.status || (b.currentDepartmentSequence === targetSeqNum ? 'Pending' : 'Waiting');

        const rankA = statusRank[stA] || 99;
        const rankB = statusRank[stB] || 99;

        if (rankA !== rankB) {
          return rankA - rankB;
        }

        const idA = a.projectTrackingId || '';
        const idB = b.projectTrackingId || '';
        return idA.localeCompare(idB, undefined, { numeric: true, sensitivity: 'base' });
      });
    }

    return res.status(200).json({
      success: true,
      totalCount,
      workflows: sanitizedWorkflows
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 3. Get single project workflow by ID, tracking ID, or enquiry ID
 */
export const getProjectWorkflowById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { viewDepartment } = req.query;

    let workflow = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      workflow = await ProjectWorkflow.findOne({
        $or: [{ _id: id }, { enquiryId: id }]
      })
        .populate({
          path: 'enquiryId',
          populate: { path: 'clientId' }
        })
        .populate('currentDepartmentId')
        .populate('lastRejectedDepartmentId');
    } else {
      workflow = await ProjectWorkflow.findOne({ projectTrackingId: id.trim() })
        .populate({
          path: 'enquiryId',
          populate: { path: 'clientId' }
        })
        .populate('currentDepartmentId')
        .populate('lastRejectedDepartmentId');
    }

    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Project workflow record not found.'
      });
    }

    const approvals = await DepartmentApproval.find({ workflowId: workflow._id })
      .populate('reviewedBy', 'name role email')
      .sort({ departmentSequence: 1 });

    const history = await WorkflowHistory.find({ workflowId: workflow._id })
      .populate('actionBy', 'name role email')
      .sort({ createdAt: -1 });

    const workflowObj = workflow.toObject();
    workflowObj.approvals = approvals;
    workflowObj.history = history;

    // Apply strict client data sanitization rule: Only Sales, Accountant, Delivery, Installation can view client
    const targetDeptCode = viewDepartment || workflow.currentDepartmentCode;
    workflowObj.enquiryId = sanitizeEnquiryClient(workflowObj.enquiryId, targetDeptCode);

    return res.status(200).json({
      success: true,
      workflow: workflowObj
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 4. Submit for Manager Review (Sales & Marketing Step 1)
 */
export const submitForManagerReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;

    const workflow = await ProjectWorkflow.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { projectTrackingId: id }]
    });

    if (!workflow) {
      return res.status(404).json({ success: false, message: 'Project workflow not found.' });
    }

    if (
      workflow.overallStatus !== PROJECT_WORKFLOW_STATUSES.DRAFT &&
      workflow.overallStatus !== PROJECT_WORKFLOW_STATUSES.RETURNED_FOR_CORRECTION
    ) {
      return res.status(400).json({
        success: false,
        message: `Project cannot be submitted from status '${workflow.overallStatus}'. Current status must be Draft or Returned for Review.`
      });
    }

    const previousStatus = workflow.overallStatus;
    workflow.overallStatus = PROJECT_WORKFLOW_STATUSES.PENDING_MANAGER_REVIEW;

    // Mark Sales & Marketing department approval as Accepted
    await DepartmentApproval.findOneAndUpdate(
      { workflowId: workflow._id, departmentSequence: 1 },
      {
        status: DEPARTMENT_APPROVAL_STATUSES.ACCEPTED,
        reviewedBy: req.user._id,
        reviewedAt: new Date(),
        remarks: remarks || 'Project draft verified and submitted for Manager Review.'
      }
    );

    await workflow.save();

    // Log history
    await WorkflowHistory.create({
      workflowId: workflow._id,
      enquiryId: workflow.enquiryId,
      projectTrackingId: workflow.projectTrackingId,
      departmentCode: 'SALES',
      departmentName: 'Sales & Marketing',
      action: 'Submitted',
      actionBy: req.user._id,
      actionByName: req.user.name,
      actionByRole: req.user.role,
      previousStatus,
      newStatus: PROJECT_WORKFLOW_STATUSES.PENDING_MANAGER_REVIEW,
      remarks: remarks || 'Submitted for Manager Review.'
    });

    return res.status(200).json({
      success: true,
      message: `Project ${workflow.projectTrackingId} successfully submitted for Manager Review.`,
      workflow
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 5. Manager Review & Forwarding
 * Forwards project to PO team (initial) OR resumes directly at the department that rejected it.
 */
export const managerForward = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;

    if (req.user.role !== USER_ROLES.MANAGER && req.user.role !== USER_ROLES.ADMIN) {
      return res.status(403).json({
        success: false,
        message: 'Only Managers and Admins can forward projects to department workflow.'
      });
    }

    const workflow = await ProjectWorkflow.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { projectTrackingId: id }]
    });

    if (!workflow) {
      return res.status(404).json({ success: false, message: 'Project workflow not found.' });
    }

    const previousStatus = workflow.overallStatus;
    let targetSequence = 2; // Default to PO Team (Sequence 2)
    let isResumption = false;

    // If project was previously rejected, RESUME directly at that department!
    if (workflow.lastRejectedDepartmentId || workflow.lastRejectedDepartmentCode) {
      const rejectedDept = await Department.findOne({
        $or: [
          { _id: workflow.lastRejectedDepartmentId },
          { departmentCode: workflow.lastRejectedDepartmentCode }
        ]
      });

      if (rejectedDept) {
        targetSequence = rejectedDept.sequenceNumber;
        isResumption = true;
      }
    }

    const targetDept = await Department.findOne({ sequenceNumber: targetSequence });
    if (!targetDept) {
      return res.status(500).json({ success: false, message: `Target department sequence ${targetSequence} not found.` });
    }

    // Update workflow
    workflow.currentDepartmentId = targetDept._id;
    workflow.currentDepartmentCode = targetDept.departmentCode;
    workflow.currentDepartmentSequence = targetDept.sequenceNumber;
    workflow.overallStatus =
      targetSequence === 2
        ? PROJECT_WORKFLOW_STATUSES.PENDING_PO_APPROVAL
        : PROJECT_WORKFLOW_STATUSES.UNDER_DEPARTMENT_REVIEW;
    workflow.managerReviewedAt = new Date();
    workflow.managerForwardedAt = new Date();
    workflow.completionPercentage = Math.round((targetSequence / 10) * 100);

    // Update department approval status to PENDING
    await DepartmentApproval.findOneAndUpdate(
      { workflowId: workflow._id, departmentSequence: targetSequence },
      {
        status: DEPARTMENT_APPROVAL_STATUSES.PENDING,
        reviewedBy: null,
        reviewedAt: null
      }
    );

    await workflow.save();

    // Log history
    await WorkflowHistory.create({
      workflowId: workflow._id,
      enquiryId: workflow.enquiryId,
      projectTrackingId: workflow.projectTrackingId,
      departmentCode: 'MANAGER',
      departmentName: 'Manager Review',
      action: 'Forwarded',
      actionBy: req.user._id,
      actionByName: req.user.name,
      actionByRole: req.user.role,
      previousStatus,
      newStatus: workflow.overallStatus,
      remarks: remarks || (isResumption
        ? `Manager verified rework and forwarded back to ${targetDept.departmentName} (Resumption at Stage ${targetSequence}).`
        : `Manager approved and forwarded project to ${targetDept.departmentName}.`)
    });

    return res.status(200).json({
      success: true,
      message: `Project forwarded to ${targetDept.departmentName} (Sequence ${targetSequence}).`,
      workflow
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 6. Department Action: ACCEPT or REJECT
 * Department 2 to 10 sequential approvals.
 * REJECT requires mandatory rejectionReason and remarks, returning project to Sales.
 * Resubmitted projects retain previous approvals and resume at rejected department.
 */
export const departmentAction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      action,
      departmentSequence,
      remarks,
      rejectionReason,
      responsibleDepartmentSequence,
      attachmentUrl
    } = req.body;

    // Only General Manager and Admin can approve or reject department stages
    if (req.user.role !== USER_ROLES.MANAGER && req.user.role !== USER_ROLES.ADMIN) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Only General Manager and Admin are authorized to approve or reject department workflow stages. Sales & Marketing can only view project tracking status.'
      });
    }

    if (!['ACCEPT', 'REJECT', 'REACCEPT'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Invalid action. Must be 'ACCEPT', 'REJECT', or 'REACCEPT'."
      });
    }

    const workflow = await ProjectWorkflow.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { projectTrackingId: id }]
    });

    if (!workflow) {
      return res.status(404).json({ success: false, message: 'Project workflow not found.' });
    }

    const currentSeq = departmentSequence ? Number(departmentSequence) : workflow.currentDepartmentSequence;
    const currentDept = await Department.findOne({ sequenceNumber: currentSeq });

    if (!currentDept) {
      return res.status(404).json({ success: false, message: `Department for sequence ${currentSeq} not found.` });
    }

    const previousStatus = workflow.overallStatus;

    if (action === 'ACCEPT' || action === 'REACCEPT') {
      if (action === 'REACCEPT' && (!remarks || !remarks.trim())) {
        return res.status(400).json({
          success: false,
          message: 'Re-assignment & resolution remarks are strictly mandatory when re-accepting a rejected project.'
        });
      }

      // 1. Mark current department approval as ACCEPTED
      await DepartmentApproval.findOneAndUpdate(
        { workflowId: workflow._id, departmentSequence: currentSeq },
        {
          status: DEPARTMENT_APPROVAL_STATUSES.ACCEPTED,
          reviewedBy: req.user._id,
          reviewedAt: new Date(),
          remarks: remarks || (action === 'REACCEPT' ? `${currentDept.departmentName} re-assignment & rework verified.` : `${currentDept.departmentName} approval verified.`),
          attachmentUrl: attachmentUrl || null
        }
      );

      // If re-accepting, clear earlier rejection state
      if (action === 'REACCEPT') {
        workflow.rejectionReason = null;
        workflow.rejectionRemarks = null;
        workflow.lastRejectedDepartmentId = null;
        workflow.lastRejectedDepartmentCode = null;
        workflow.rejectedAt = null;
        workflow.rejectedBy = null;
      }

      // If Installation (Sequence 10), complete the workflow!
      if (currentSeq === 10) {
        workflow.overallStatus = PROJECT_WORKFLOW_STATUSES.COMPLETED;
        workflow.completedAt = new Date();
        workflow.completionPercentage = 100;
        await workflow.save();

        await WorkflowHistory.create({
          workflowId: workflow._id,
          enquiryId: workflow.enquiryId,
          projectTrackingId: workflow.projectTrackingId,
          departmentCode: currentDept.departmentCode,
          departmentName: currentDept.departmentName,
          action: action === 'REACCEPT' ? 'Re-Accepted & Completed' : 'Completed',
          actionBy: req.user._id,
          actionByName: req.user.name,
          actionByRole: req.user.role,
          previousStatus,
          newStatus: PROJECT_WORKFLOW_STATUSES.COMPLETED,
          remarks: remarks || (action === 'REACCEPT' ? 'Re-assigned, re-accepted, and project workflow finished successfully.' : 'Final Installation completed. Project workflow finished successfully.')
        });

        return res.status(200).json({
          success: true,
          message: `Project ${workflow.projectTrackingId} successfully ${action === 'REACCEPT' ? 're-accepted and completed' : 'approved and completed'} by Installation team!`,
          workflow
        });
      }

      // Move to Next Department (currentSeq + 1)
      const nextSeq = currentSeq + 1;
      const nextDept = await Department.findOne({ sequenceNumber: nextSeq });

      if (nextDept) {
        workflow.currentDepartmentId = nextDept._id;
        workflow.currentDepartmentCode = nextDept.departmentCode;
        workflow.currentDepartmentSequence = nextSeq;
        workflow.overallStatus = PROJECT_WORKFLOW_STATUSES.UNDER_DEPARTMENT_REVIEW;
        workflow.completionPercentage = Math.round((nextSeq / 10) * 100);

        // Update next department approval status to PENDING
        await DepartmentApproval.findOneAndUpdate(
          { workflowId: workflow._id, departmentSequence: nextSeq },
          {
            status: DEPARTMENT_APPROVAL_STATUSES.PENDING
          }
        );
      }

      await workflow.save();

      // Log history
      await WorkflowHistory.create({
        workflowId: workflow._id,
        enquiryId: workflow.enquiryId,
        projectTrackingId: workflow.projectTrackingId,
        departmentCode: currentDept.departmentCode,
        departmentName: currentDept.departmentName,
        action: action === 'REACCEPT' ? 'Re-Accepted & Forwarded' : 'Accepted',
        actionBy: req.user._id,
        actionByName: req.user.name,
        actionByRole: req.user.role,
        previousStatus,
        newStatus: workflow.overallStatus,
        remarks: remarks || (action === 'REACCEPT'
          ? `Re-assigned with resolution remarks and re-accepted at ${currentDept.departmentName}. Moved forward to ${nextDept?.departmentName || 'next stage'}.`
          : `${currentDept.departmentName} stage approved and forwarded to next department.`)
      });

      return res.status(200).json({
        success: true,
        message: action === 'REACCEPT'
          ? `Project successfully re-assigned, re-accepted at ${currentDept.departmentName}, and forwarded to ${nextDept?.departmentName || 'next stage'}.`
          : `${currentDept.departmentName} approved. Project moved to ${nextDept?.departmentName || 'next stage'}.`,
        workflow
      });
    }

    if (action === 'REJECT') {
      // Rejection reason and remarks are strictly mandatory
      if (!rejectionReason || !rejectionReason.trim() || !remarks || !remarks.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Both Rejection Reason and Detailed Remarks are strictly mandatory when rejecting a project.'
        });
      }

      // Determine responsible/target department for correction (among all 10 departments)
      const respSeq = responsibleDepartmentSequence
        ? Number(responsibleDepartmentSequence)
        : currentSeq;
      const respDept = (await Department.findOne({ sequenceNumber: respSeq })) || currentDept;

      // Mark current department as REJECTED
      await DepartmentApproval.findOneAndUpdate(
        { workflowId: workflow._id, departmentSequence: currentSeq },
        {
          status: DEPARTMENT_APPROVAL_STATUSES.REJECTED,
          reviewedBy: req.user._id,
          reviewedAt: new Date(),
          remarks: remarks.trim(),
          rejectionReason: rejectionReason.trim(),
          attachmentUrl: attachmentUrl || null
        }
      );

      // Return project to Sales & Marketing with rejection details and responsible department
      workflow.overallStatus = PROJECT_WORKFLOW_STATUSES.RETURNED_FOR_CORRECTION;
      workflow.lastRejectedDepartmentId = respDept._id;
      workflow.lastRejectedDepartmentCode = respDept.departmentCode;
      workflow.rejectionReason = rejectionReason.trim();
      workflow.rejectionRemarks = remarks.trim();
      workflow.rejectedAt = new Date();
      workflow.rejectedBy = req.user._id;

      await workflow.save();

      // Log history
      await WorkflowHistory.create({
        workflowId: workflow._id,
        enquiryId: workflow.enquiryId,
        projectTrackingId: workflow.projectTrackingId,
        departmentCode: currentDept.departmentCode,
        departmentName: currentDept.departmentName,
        action: 'Rejected',
        actionBy: req.user._id,
        actionByName: req.user.name,
        actionByRole: req.user.role,
        previousStatus,
        newStatus: PROJECT_WORKFLOW_STATUSES.RETURNED_FOR_CORRECTION,
        rejectionReason: rejectionReason.trim(),
        remarks: `[Correction Stage: ${respDept.departmentName}] ${remarks.trim()}`
      });

      return res.status(200).json({
        success: true,
        message: `Project rejected by ${currentDept.departmentName} (Correction assigned to: ${respDept.departmentName}) and returned to Sales & Marketing.`,
        workflow
      });
    }
  } catch (err) {
    next(err);
  }
};

/**
 * 7. Sales & Marketing Resubmission after Rework
 */
export const salesResubmit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { remarks, updatedProjectData } = req.body;

    const workflow = await ProjectWorkflow.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { projectTrackingId: id }]
    });

    if (!workflow) {
      return res.status(404).json({ success: false, message: 'Project workflow not found.' });
    }

    if (workflow.overallStatus !== PROJECT_WORKFLOW_STATUSES.RETURNED_FOR_CORRECTION) {
      return res.status(400).json({
        success: false,
        message: `Only projects in '${PROJECT_WORKFLOW_STATUSES.RETURNED_FOR_CORRECTION}' status can be resubmitted.`
      });
    }

    // Optionally update enquiry details if rework changes were made
    if (updatedProjectData && workflow.enquiryId) {
      await Enquiry.findByIdAndUpdate(workflow.enquiryId, {
        $set: updatedProjectData
      });
    }

    const previousStatus = workflow.overallStatus;
    workflow.overallStatus = PROJECT_WORKFLOW_STATUSES.PENDING_MANAGER_REVIEW;
    workflow.resubmittedAt = new Date();
    await workflow.save();

    await WorkflowHistory.create({
      workflowId: workflow._id,
      enquiryId: workflow.enquiryId,
      projectTrackingId: workflow.projectTrackingId,
      departmentCode: 'SALES',
      departmentName: 'Sales & Marketing',
      action: 'Resubmitted',
      actionBy: req.user._id,
      actionByName: req.user.name,
      actionByRole: req.user.role,
      previousStatus,
      newStatus: PROJECT_WORKFLOW_STATUSES.PENDING_MANAGER_REVIEW,
      remarks: remarks || 'Rework completed by Sales & Marketing. Resubmitted for Manager Review.'
    });

    return res.status(200).json({
      success: true,
      message: `Project ${workflow.projectTrackingId} resubmitted for Manager Review.`,
      workflow
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 8. Dashboard Statistics
 */
export const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalProjects,
      draftCount,
      pendingManagerReview,
      underDepartmentReview,
      returnedForSalesReview,
      completedCount,
      departments
    ] = await Promise.all([
      ProjectWorkflow.countDocuments(),
      ProjectWorkflow.countDocuments({ overallStatus: PROJECT_WORKFLOW_STATUSES.DRAFT }),
      ProjectWorkflow.countDocuments({ overallStatus: PROJECT_WORKFLOW_STATUSES.PENDING_MANAGER_REVIEW }),
      ProjectWorkflow.countDocuments({
        overallStatus: {
          $in: [PROJECT_WORKFLOW_STATUSES.PENDING_PO_APPROVAL, PROJECT_WORKFLOW_STATUSES.UNDER_DEPARTMENT_REVIEW]
        }
      }),
      ProjectWorkflow.countDocuments({ overallStatus: PROJECT_WORKFLOW_STATUSES.RETURNED_FOR_CORRECTION }),
      ProjectWorkflow.countDocuments({ overallStatus: PROJECT_WORKFLOW_STATUSES.COMPLETED }),
      Department.find({ isActive: true }).sort({ sequenceNumber: 1 })
    ]);

    // Count pending per department
    const departmentPending = {};
    for (const d of departments) {
      const count = await DepartmentApproval.countDocuments({
        departmentSequence: d.sequenceNumber,
        status: DEPARTMENT_APPROVAL_STATUSES.PENDING
      });
      departmentPending[d.departmentCode] = {
        name: d.departmentName,
        sequence: d.sequenceNumber,
        count
      };
    }

    return res.status(200).json({
      success: true,
      stats: {
        totalProjects,
        draftCount,
        pendingManagerReview,
        underDepartmentReview,
        returnedForSalesReview,
        completedCount,
        departmentPending
      }
    });
  } catch (err) {
    next(err);
  }
};

