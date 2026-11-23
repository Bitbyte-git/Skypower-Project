import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getPaymentDashboardStats,
  getOrderPaymentSummary,
  configurePaymentTerms,
  recordCustomerPayment,
  getPaymentReceipts,
  getReceiptPDF,
  cancelCustomerPayment,
  getPendingPayments,
  createPaymentFollowup,
  getPaymentFollowups,
  getPaymentReports,
  seedSamplePaymentsIfEmpty
} from '../controllers/paymentController.js';

const router = Router();

// Public / Token-capable PDF download
router.get('/receipts/:id/pdf', getReceiptPDF);

// Authenticated Routes
router.use(requireAuth);

// Dashboard Statistics & Overview
router.get('/dashboard-stats', getPaymentDashboardStats);

// Seed sample payment records
router.post('/seed-samples', seedSamplePaymentsIfEmpty);

// Payment Receipts Register
router.get('/receipts', getPaymentReceipts);
router.post('/receipts/:id/cancel', cancelCustomerPayment);

// Pending & Overdue Payments
router.get('/pending', getPendingPayments);

// Follow-up Tracking
router.get('/followups', getPaymentFollowups);
router.post('/followups', createPaymentFollowup);

// Financial Reports
router.get('/reports', getPaymentReports);

// Order-specific payment operations
router.get('/orders/:orderId', getOrderPaymentSummary);
router.post('/orders/:orderId/terms', configurePaymentTerms);
router.post('/orders/:orderId/record', recordCustomerPayment);
router.post('/record', recordCustomerPayment);

export default router;
