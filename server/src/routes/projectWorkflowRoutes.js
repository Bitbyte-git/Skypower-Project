import { Router } from 'express';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import { USER_ROLES } from '../constants/roles.js';
import { upload } from '../middleware/upload.js';
import {
  getDepartments,
  getProjectWorkflows,
  getProjectWorkflowById,
  submitForManagerReview,
  managerForward,
  departmentAction,
  salesResubmit,
  getDashboardStats,
  updateAdvancePayment,
  updateDrawingOADetails,
  uploadWorkflowDrawingPdf
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

// 3. Department Action: Accept or Reject (General Manager, Admin, Accountant for Stage 3, Design Engineer for Stage 4 submission)
router.post(
  '/:id/department-action',
  requireAuth,
  requireRoles([USER_ROLES.MANAGER, USER_ROLES.ADMIN, USER_ROLES.ACCOUNTANT, USER_ROLES.DESIGN_ENGINEER]),
  departmentAction
);

// 4. Sales & Marketing: Resubmit for Manager Review after Rework
router.post(
  '/:id/sales-resubmit',
  requireAuth,
  requireRoles([USER_ROLES.SALES, USER_ROLES.ADMIN]),
  salesResubmit
);

// 5. Advance Payment Update
router.put(
  '/:id/advance-payment',
  requireAuth,
  requireRoles([USER_ROLES.MANAGER, USER_ROLES.ADMIN, USER_ROLES.SALES, USER_ROLES.ACCOUNTANT]),
  updateAdvancePayment
);

// 6. Drawing / Order Acknowledgement Update
router.put(
  '/:id/drawing-oa',
  requireAuth,
  requireRoles([USER_ROLES.MANAGER, USER_ROLES.ADMIN, USER_ROLES.SALES, USER_ROLES.PO_TEAM, USER_ROLES.DESIGN_ENGINEER]),
  updateDrawingOADetails
);

// 7. Upload Drawing PDF for Stage 4 (Drawing / OA)
router.post(
  '/:id/upload-drawing',
  requireAuth,
  upload.single('drawingPdf'),
  uploadWorkflowDrawingPdf
);

export default router;

