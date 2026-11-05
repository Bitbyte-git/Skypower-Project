export const APPROVAL_STATUSES = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted for Approval',
  PENDING_APPROVAL: 'Pending Approval',
  RETURNED_FOR_CORRECTION: 'Returned for Correction',
  RESUBMITTED: 'Resubmitted',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  SENT_TO_CLIENT: 'Sent to Client',
  SENT: 'Sent'
};

export const COMMERCIAL_STATUSES = {
  IN_PROGRESS: 'In Progress',
  WON: 'Won',
  LOST: 'Lost'
};

export const ENQUIRY_TYPES = {
  BUDGETARY: 'Budgetary',
  FIRM: 'Firm'
};

export const QUOTATION_STATUSES = {
  DRAFT: 'Draft',
  ISSUED: 'Issued',
  ACCEPTED: 'Accepted',
  REVISED: 'Revised',
  SUPERSEDED: 'Superseded',
  REJECTED: 'Rejected'
};

export const FOLLOWUP_TYPES = {
  PHONE_CALL: 'Phone Call',
  EMAIL: 'Email',
  ONLINE_MEETING: 'Online Meeting',
  DIRECT_MEETING: 'Direct Meeting',
  SITE_VISIT: 'Site Visit'
};

export const FOLLOWUP_STATUSES = {
  PENDING: 'Pending',
  COMPLETED: 'Completed',
  RESCHEDULED: 'Rescheduled',
  CANCELLED: 'Cancelled'
};

export const PROJECT_WORKFLOW_STATUSES = {
  DRAFT: 'Draft',
  PENDING_MANAGER_REVIEW: 'Pending Manager Review',
  PENDING_PO_APPROVAL: 'Pending PO Approval',
  UNDER_DEPARTMENT_REVIEW: 'Under Department Review',
  RETURNED_FOR_CORRECTION: 'Returned for Sales & Marketing Review',
  COMPLETED: 'Completed'
};

export const DEPARTMENT_APPROVAL_STATUSES = {
  WAITING: 'Waiting',
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected'
};

export const DEPARTMENTS_LIST = [
  { sequence: 1, code: 'SALES', name: 'Sales & Marketing', canViewClientDetails: true },
  { sequence: 2, code: 'PO_TEAM', name: 'Purchase Order (PO) Team', canViewClientDetails: false },
  { sequence: 3, code: 'ACCOUNTANT', name: 'Accountant', canViewClientDetails: true },
  { sequence: 4, code: 'DRAWING', name: 'Drawing / Order Acknowledgement', canViewClientDetails: false },
  { sequence: 5, code: 'CT_PT', name: 'CT & PT', canViewClientDetails: false },
  { sequence: 6, code: 'FABRICATION', name: 'Fabrication', canViewClientDetails: false },
  { sequence: 7, code: 'METERING_DOOR', name: 'Metering Door', canViewClientDetails: false },
  { sequence: 8, code: 'TESTING', name: 'Testing', canViewClientDetails: false },
  { sequence: 9, code: 'DELIVERY', name: 'Delivery', canViewClientDetails: true },
  { sequence: 10, code: 'INSTALLATION', name: 'Installation', canViewClientDetails: true }
];
