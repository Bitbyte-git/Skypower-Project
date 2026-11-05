import { Router } from 'express';
import {
  registerOrSelectClient,
  searchExistingClients,
  saveWorkflowDraft,
  getWorkflowEnquiry,
  createOfferingRevision,
  sendOfferingToClient,
  finalizeAndSendToPO,
  getPOTrackingList,
  updatePOStatus
} from '../controllers/workflowController.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import { USER_ROLES } from '../constants/roles.js';

const router = Router();

router.use(requireAuth);

// Client operations for Step 1
router.post('/client', requireRoles([USER_ROLES.SALES, USER_ROLES.ADMIN]), registerOrSelectClient);
router.get('/clients/search', requireRoles([USER_ROLES.SALES, USER_ROLES.ADMIN]), searchExistingClients);

// Workflow Enquiry Drafts (Steps 1 to 4)
router.post('/draft', requireRoles([USER_ROLES.SALES, USER_ROLES.ADMIN]), saveWorkflowDraft);
router.get('/enquiry/:id', requireRoles([USER_ROLES.SALES, USER_ROLES.ADMIN]), getWorkflowEnquiry);

// Step 5: Offering Management & Revisions
router.post('/offering-revision', requireRoles([USER_ROLES.SALES, USER_ROLES.ADMIN]), createOfferingRevision);
router.post('/offering-send', requireRoles([USER_ROLES.SALES, USER_ROLES.ADMIN]), sendOfferingToClient);

// Step 6: Finalize & PO Handover
router.post('/finalize-to-po', requireRoles([USER_ROLES.SALES, USER_ROLES.ADMIN]), finalizeAndSendToPO);

// PO Team Tracking (Sales, Admin & PO_TEAM)
router.get('/po-tracking', requireRoles([USER_ROLES.SALES, USER_ROLES.ADMIN, USER_ROLES.PO_TEAM]), getPOTrackingList);
router.put('/po-tracking/:id/status', requireRoles([USER_ROLES.PO_TEAM, USER_ROLES.ADMIN]), updatePOStatus);

export default router;

