import { Router } from 'express';
import { getAuditLogs } from '../controllers/auditLogController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth, requireAdmin);

router.get('/', getAuditLogs);

export default router;

