import { Router } from 'express';
import {
  getPendingApprovals,
  approveEnquiry,
  returnEnquiry,
  rejectEnquiry,
  getEnquiryApprovalHistory
} from '../controllers/approvalController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  approvalActionSchema,
  returnActionSchema,
  rejectActionSchema
} from '../validators/approvalValidators.js';

const router = Router();

router.use(requireAuth);

// Approval history can be viewed by Sales and Admin
router.get('/:id/history', getEnquiryApprovalHistory);

// Admin-only approval gates
router.get('/pending', requireAdmin, getPendingApprovals);
router.post('/:id/approve', requireAdmin, validate(approvalActionSchema), approveEnquiry);
router.post('/:id/return', requireAdmin, validate(returnActionSchema), returnEnquiry);
router.post('/:id/reject', requireAdmin, validate(rejectActionSchema), rejectEnquiry);

export default router;

