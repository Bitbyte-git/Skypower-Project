import { Router } from 'express';
import { requireAuth, requireCustomer, requireSalesOrAdmin } from '../middleware/auth.js';
import {
  customerLogin,
  customerForgotPassword,
  customerResetPassword,
  customerActivateAccount,
  getCustomerDashboard,
  getCustomerOrders,
  getCustomerOrderById,
  getCustomerDocuments,
  getCustomerPayments,
  getCustomerProfile,
  updateCustomerProfile,
  changeCustomerPassword,
  getCustomerNotifications,
  enableCustomerPortalAccess,
  toggleCustomerPortalAccess
} from '../controllers/portalController.js';

const router = Router();

// ==========================================
// 1. PUBLIC CUSTOMER AUTHENTICATION ROUTES
// ==========================================
router.post('/auth/login', customerLogin);
router.post('/login', customerLogin);
router.post('/auth/forgot-password', customerForgotPassword);
router.post('/forgot-password', customerForgotPassword);
router.post('/auth/reset-password', customerResetPassword);
router.post('/reset-password', customerResetPassword);
router.post('/auth/activate', customerActivateAccount);
router.post('/activate', customerActivateAccount);

// ==========================================
// 2. PROTECTED CUSTOMER PORTAL DATA ROUTES
//    STRICT SECURITY: requireAuth + requireCustomer
// ==========================================
router.get('/dashboard', requireAuth, requireCustomer, getCustomerDashboard);
router.get('/orders', requireAuth, requireCustomer, getCustomerOrders);
router.get('/orders/:id', requireAuth, requireCustomer, getCustomerOrderById);
router.get('/documents', requireAuth, requireCustomer, getCustomerDocuments);
router.get('/payments', requireAuth, requireCustomer, getCustomerPayments);
router.get('/profile', requireAuth, requireCustomer, getCustomerProfile);
router.put('/profile', requireAuth, requireCustomer, updateCustomerProfile);
router.put('/change-password', requireAuth, requireCustomer, changeCustomerPassword);
router.get('/notifications', requireAuth, requireCustomer, getCustomerNotifications);

// ==========================================
// 3. INTERNAL ERP: CLIENT PORTAL ACCESS MANAGEMENT
//    STRICT SECURITY: requireAuth + requireSalesOrAdmin
// ==========================================
router.post('/clients/:id/portal-access', requireAuth, requireSalesOrAdmin, enableCustomerPortalAccess);
router.post('/clients/:id/portal-access/toggle', requireAuth, requireSalesOrAdmin, toggleCustomerPortalAccess);

export default router;
