import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getOrderDashboardStats,
  getAllOrders,
  getOrderById,
  createOrderFromQuotation,
  createOrderFromEnquiry,
  registerCustomerPO,
  verifyPO,
  confirmOrder,
  holdOrder,
  resumeOrder,
  submitPORevision,
  cancelOrder,
  getAcknowledgementPDF,
  seedSampleOrdersIfEmpty
} from '../controllers/salesOrderController.js';

const router = Router();

// Order acknowledgement PDF view / download - can be accessed with auth or token
router.get('/:id/acknowledgement-pdf', getAcknowledgementPDF);

// Authenticated order management endpoints
router.use(requireAuth);

// Order Dashboard Statistics
router.get('/dashboard-stats', getOrderDashboardStats);

// Seed sample orders if none exist
router.post('/seed-samples', seedSampleOrdersIfEmpty);

// Create Sales Order from Quotation ("Convert to Order")
router.post('/from-quotation', createOrderFromQuotation);
router.post('/from-quotation/:quotationId', createOrderFromQuotation);
router.post('/from-enquiry', createOrderFromEnquiry);

// Order Status & Lifecycle Workflows
router.post('/:id/register-po', registerCustomerPO);
router.post('/:id/verify-po', verifyPO);
router.post('/:id/confirm', confirmOrder);
router.post('/:id/hold', holdOrder);
router.post('/:id/resume', resumeOrder);
router.post('/:id/revision', submitPORevision);
router.post('/:id/cancel', cancelOrder);

// Order CRUD / Retrieval
router.get('/', getAllOrders);
router.get('/:id', getOrderById);

export default router;
