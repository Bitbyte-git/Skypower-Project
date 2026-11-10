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
  }
};

