import { Router } from 'express';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import clientRoutes from './clientRoutes.js';
import enquiryRoutes from './enquiryRoutes.js';
import approvalRoutes from './approvalRoutes.js';
import quotationRoutes from './quotationRoutes.js';
import followupRoutes from './followupRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import settingRoutes from './settingRoutes.js';
import auditLogRoutes from './auditLogRoutes.js';
import workflowRoutes from './workflowRoutes.js';
import projectWorkflowRoutes from './projectWorkflowRoutes.js';
import inventoryRoutes from './inventoryRoutes.js';
import salesOrderRoutes from './salesOrderRoutes.js';
import paymentRoutes from './paymentRoutes.js';
import engineeringRoutes from './engineeringRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/clients', clientRoutes);
router.use('/enquiries', enquiryRoutes);
router.use('/approvals', approvalRoutes);
router.use('/quotations', quotationRoutes);
router.use('/followups', followupRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/settings', settingRoutes);
router.use('/audit-logs', auditLogRoutes);
router.use('/workflow', workflowRoutes);
router.use('/project-workflows', projectWorkflowRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/orders', salesOrderRoutes);
router.use('/payments', paymentRoutes);
router.use('/engineering', engineeringRoutes);

export default router;
