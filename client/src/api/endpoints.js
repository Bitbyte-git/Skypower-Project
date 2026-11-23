/**
 * Centralized API Endpoint Registry
 * Maps ERP functional domains to their corresponding API route paths.
 */
export const ENDPOINTS = {
  // Authentication & Session
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    ME: '/auth/me'
  },

  // 10-Department Workflow & Approvals
  WORKFLOW: {
    LIST: '/project-workflows',
    BY_ID: (id) => `/project-workflows/${id}`,
    DEPT_ACTION: (id) => `/project-workflows/${id}/department-action`,
    FORWARD: (id) => `/project-workflows/${id}/manager-forward`,
    RESUBMIT: (id) => `/project-workflows/${id}/sales-resubmit`,
    SUBMIT_MANAGER: (id) => `/project-workflows/${id}/submit-manager`
  },

  // Enquiry & CRM
  ENQUIRY: {
    LIST: '/workflow/enquiries',
    BY_ID: (id) => `/workflow/enquiry/${id}`,
    CLIENT: '/workflow/client',
    DRAFT: '/workflow/draft',
    OFFERING_REVISION: '/workflow/offering-revision',
    OFFERING_SEND: '/workflow/offering-send'
  },

  // Reports & Analytics
  REPORTS: {
    ANALYTICS: '/dashboard/reports',
    ADMIN_KPI: '/dashboard/admin'
  },

  // Module 2: Order Management & Customer POs
  ORDERS: {
    DASHBOARD_STATS: '/orders/dashboard-stats',
    LIST: '/orders',
    BY_ID: (id) => `/orders/${id}`,
    FROM_QUOTATION: '/orders/from-quotation',
    REGISTER_PO: (id) => `/orders/${id}/register-po`,
    VERIFY_PO: (id) => `/orders/${id}/verify-po`,
    CONFIRM: (id) => `/orders/${id}/confirm`,
    HOLD: (id) => `/orders/${id}/hold`,
    RESUME: (id) => `/orders/${id}/resume`,
    REVISION: (id) => `/orders/${id}/revision`,
    CANCEL: (id) => `/orders/${id}/cancel`,
    OA_PDF: (id) => `/orders/${id}/acknowledgement-pdf`,
    SEED: '/orders/seed-samples'
  },

  // Module 3: Advance Payment & Payment Management
  PAYMENTS: {
    DASHBOARD_STATS: '/payments/dashboard-stats',
    RECEIPTS: '/payments/receipts',
    RECEIPT_PDF: (id) => `/payments/receipts/${id}/pdf`,
    CANCEL_RECEIPT: (id) => `/payments/receipts/${id}/cancel`,
    PENDING: '/payments/pending',
    REPORTS: '/payments/reports',
    FOLLOWUPS: '/payments/followups',
    ORDER_SUMMARY: (orderId) => `/payments/orders/${orderId}`,
    ORDER_TERMS: (orderId) => `/payments/orders/${orderId}/terms`,
    RECORD_PAYMENT: (orderId) => `/payments/orders/${orderId}/record`,
    RECORD: '/payments/record',
    SEED: '/payments/seed-samples'
  }
};

