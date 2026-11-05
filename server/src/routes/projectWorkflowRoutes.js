import { Router } from 'express';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import { USER_ROLES } from '../constants/roles.js';
import {
  getDepartments,
  getProjectWorkflows,
  getProjectWorkflowById,
  submitForManagerReview,
  managerForward,
  departmentAction,
  salesResubmit,
  getDashboardStats
} from '../controllers/projectWorkflowController.js';

const router = Router();

// Master Departments List
router.get('/departments', requireAuth, getDepartments);

// Dashboard Statistics
router.get('/stats', requireAuth, getDashboardStats);

// List Project Workflows (with filters & backend client masking)
router.get('/', requireAuth, getProjectWorkflows);

// Single Project Workflow by ID / Tracking ID / Enquiry ID
router.get('/:id', requireAuth, getProjectWorkflowById);

// 1. Sales & Marketing: Submit for Manager Review
router.post(
  '/:id/submit-manager',
  requireAuth,
  requireRoles([USER_ROLES.SALES, USER_ROLES.ADMIN]),
  submitForManagerReview
);

// 2. Manager: Forward project to PO or Resume at Rejected Department
router.post(
  '/:id/manager-forward',
  requireAuth,
  requireRoles([USER_ROLES.MANAGER, USER_ROLES.ADMIN]),
  managerForward
);

// 3. Department Action: Accept or Reject (Only General Manager and Admin can approve/reject)
router.post(
  '/:id/department-action',
  requireAuth,
  requireRoles([USER_ROLES.MANAGER, USER_ROLES.ADMIN]),
  departmentAction
);

// 4. Sales & Marketing: Resubmit for Manager Review after Rework
router.post(
  '/:id/sales-resubmit',
  requireAuth,
  requireRoles([USER_ROLES.SALES, USER_ROLES.ADMIN]),
  salesResubmit
);

export default router;

