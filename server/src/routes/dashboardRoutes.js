import { Router } from 'express';
import { getSalesDashboard, getAdminDashboard } from '../controllers/dashboardController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/sales', getSalesDashboard);
router.get('/admin', requireAdmin, getAdminDashboard);

export default router;

