import { Router } from 'express';
import {
  getSalesDashboard,
  getAdminDashboard,
  getReportsAnalytics,
  getNotifications
} from '../controllers/dashboardController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/sales', getSalesDashboard);
router.get('/admin', getReportsAnalytics);
router.get('/reports', getReportsAnalytics);
router.get('/notifications', getNotifications);

export default router;

