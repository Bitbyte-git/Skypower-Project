import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MainLayout } from '../layouts/MainLayout';
import { ProtectedRoute } from './ProtectedRoute';

// Pages
import { Login } from '../pages/auth/Login';
import { SalesDashboard } from '../pages/sales/SalesDashboard';
import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { ClientsList } from '../pages/sales/ClientsList';
import { ClientForm } from '../pages/sales/ClientForm';
import { ClientProfile } from '../pages/sales/ClientProfile';
import { EnquiryForm } from '../pages/sales/EnquiryForm';
import { EnquiriesList } from '../pages/sales/EnquiriesList';
import { EnquiryDetails } from '../pages/sales/EnquiryDetails';
import { PendingApprovals } from '../pages/admin/PendingApprovals';
import { QuotationBuilder } from '../pages/admin/QuotationBuilder';
import { QuotationsList } from '../pages/sales/QuotationsList';
import { QuotationDetails } from '../pages/admin/QuotationDetails';
import { FollowupsList } from '../pages/sales/FollowupsList';
import { HandoverForm } from '../pages/sales/HandoverForm';
import { UserManagement } from '../pages/admin/UserManagement';
import { MasterSettings } from '../pages/admin/MasterSettings';
import { AuditLogsView } from '../pages/admin/AuditLogsView';
import { ReportsAnalytics } from '../pages/admin/ReportsAnalytics';
import { Profile } from '../pages/shared/Profile';

// 6-Step Multi-Page Workflow Wizard & PO Tracking Portal
import { WorkflowWizard } from '../pages/workflow/WorkflowWizard';
import { POTrackingView } from '../pages/po/POTrackingView';
import { DepartmentWorkflowView } from '../pages/workflow/DepartmentWorkflowView';
import { ProjectTrackingTimeline } from '../pages/workflow/ProjectTrackingTimeline';
import { ManagerDashboard } from '../pages/manager/ManagerDashboard';
import { InventoryManagement } from '../pages/inventory/InventoryManagement';

// Module 2: Order Management & Customer Purchase Orders
import { OrderDashboard } from '../pages/orders/OrderDashboard';
import { SalesOrdersList } from '../pages/orders/SalesOrdersList';
import { CustomerPurchaseOrdersList } from '../pages/orders/CustomerPurchaseOrdersList';
import { SalesOrderDetails } from '../pages/orders/SalesOrderDetails';
import { OrderTrackingView } from '../pages/orders/OrderTrackingView';

// Module 3: Advance Payment & Payment Management
import { PaymentDashboard } from '../pages/payments/PaymentDashboard';
import { OrderPaymentsList } from '../pages/payments/OrderPaymentsList';
import { OrderPaymentDetails } from '../pages/payments/OrderPaymentDetails';
import { PaymentReceiptsList } from '../pages/payments/PaymentReceiptsList';
import { PendingPaymentsList } from '../pages/payments/PendingPaymentsList';
import { PaymentReports } from '../pages/payments/PaymentReports';

// Module 4: Engineering & Drawing Approval Management
import { EngineeringDashboard } from '../pages/engineering/EngineeringDashboard';
import { EngineeringProjectsList } from '../pages/engineering/EngineeringProjectsList';
import { EngineeringProjectDetails } from '../pages/engineering/EngineeringProjectDetails';
import { DrawingRegisterList } from '../pages/engineering/DrawingRegisterList';
import { DrawingSubmissionsList } from '../pages/engineering/DrawingSubmissionsList';
import { CustomerApprovalsList } from '../pages/engineering/CustomerApprovalsList';
import { TechnicalClarificationsList } from '../pages/engineering/TechnicalClarificationsList';

// Customer Portal Layout & Pages
import { CustomerPortalLayout } from '../layouts/CustomerPortalLayout';
import { CustomerLogin } from '../pages/portal/CustomerLogin';
import { CustomerActivation } from '../pages/portal/CustomerActivation';
import { CustomerDashboard } from '../pages/portal/CustomerDashboard';
import { CustomerOrdersList } from '../pages/portal/CustomerOrdersList';
import { CustomerOrderDetails } from '../pages/portal/CustomerOrderDetails';
import { CustomerDocuments } from '../pages/portal/CustomerDocuments';
import { CustomerPayments } from '../pages/portal/CustomerPayments';
import { CustomerProfile } from '../pages/portal/CustomerProfile';
import { CustomerNotifications } from '../pages/portal/CustomerNotifications';

export const AppRoutes = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-[#1E5BB8] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const getHomeRoute = () => {
    if (user?.role === 'CUSTOMER') return '/portal/dashboard';
    if (user?.role === 'ADMIN') return '/admin/dashboard';
    if (user?.role === 'MANAGER') return '/manager/dashboard';
    if (user?.role === 'PO_TEAM') return '/po/tracking';
    if (user?.role === 'ACCOUNTANT') return '/departments/workflow?dept=3';
    if (user?.role === 'STOCK_ADMIN') return '/inventory';
    if (user?.role === 'DESIGN_ENGINEER' || user?.role === 'ENGINEERING_MANAGER' || user?.role === 'ENGINEERING_REVIEWER') return '/engineering/dashboard';
    return '/sales/dashboard';
  };

  return (
    <Routes>
      {/* Public Route */}
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to={getHomeRoute()} replace />
          ) : (
            <Login />
          )
        }
      />

      {/* Public Customer Portal Routes */}
      <Route
        path="/customer/login"
        element={
          isAuthenticated && user?.role === 'CUSTOMER' ? (
            <Navigate to="/portal/dashboard" replace />
          ) : isAuthenticated ? (
            <Navigate to={getHomeRoute()} replace />
          ) : (
            <CustomerLogin />
          )
        }
      />
      <Route path="/portal/login" element={<Navigate to="/customer/login" replace />} />
      <Route path="/customer/activate" element={<CustomerActivation />} />

      {/* Customer Portal Protected Routes Layout (ROLE: CUSTOMER ONLY) */}
      <Route element={<ProtectedRoute allowedRoles={['CUSTOMER']} />}>
        <Route element={<CustomerPortalLayout />}>
          <Route path="/portal" element={<Navigate to="/portal/dashboard" replace />} />
          <Route path="/portal/dashboard" element={<CustomerDashboard />} />
          <Route path="/portal/orders" element={<CustomerOrdersList />} />
          <Route path="/portal/orders/:id" element={<CustomerOrderDetails />} />
          <Route path="/portal/documents" element={<CustomerDocuments />} />
          <Route path="/portal/payments" element={<CustomerPayments />} />
          <Route path="/portal/profile" element={<CustomerProfile />} />
          <Route path="/portal/notifications" element={<CustomerNotifications />} />
        </Route>
      </Route>

      {/* Protected Routes Layout */}
      <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'SALES', 'PO_TEAM', 'ACCOUNTANT', 'STOCK_ADMIN', 'DESIGN_ENGINEER', 'ENGINEERING_MANAGER', 'ENGINEERING_REVIEWER']} />}>
        <Route element={<MainLayout />}>
          {/* Default Root Redirect */}
          <Route path="/" element={<Navigate to={getHomeRoute()} replace />} />

          {/* Shared Profile */}
          <Route path="/profile" element={<Profile />} />

          {/* Central Stores & Inventory Management */}
          <Route path="/inventory" element={<InventoryManagement />} />
          <Route path="/product-master" element={<Navigate to="/inventory" replace />} />
          <Route path="/stock-admin" element={<Navigate to="/inventory" replace />} />
          <Route path="/stores" element={<Navigate to="/inventory" replace />} />

          {/* Department Workflow & Tracking Views (Accessible to all authorized roles) */}
          <Route path="/departments/workflow" element={<DepartmentWorkflowView />} />
          <Route path="/advance-payment" element={<Navigate to="/departments/workflow?dept=3" replace />} />
          <Route path="/accounts" element={<Navigate to="/departments/workflow?dept=3" replace />} />
          <Route path="/drawing" element={<Navigate to="/departments/workflow?dept=4" replace />} />
          <Route path="/drawing-oa" element={<Navigate to="/departments/workflow?dept=4" replace />} />
          <Route path="/projects/tracking/:trackingId" element={<ProjectTrackingTimeline />} />
          <Route path="/reports" element={<ReportsAnalytics />} />

          {/* PO Team & Execution Tracking Portal */}
          <Route path="/po/tracking" element={<POTrackingView />} />

          {/* Module 2: Customer Order Management & PO Verification */}
          <Route path="/orders" element={<SalesOrdersList />} />
          <Route path="/orders/dashboard" element={<OrderDashboard />} />
          <Route path="/orders/purchase-orders" element={<CustomerPurchaseOrdersList />} />
          <Route path="/orders/tracking" element={<OrderTrackingView />} />
          <Route path="/orders/:id" element={<SalesOrderDetails />} />

          {/* Module 4: Engineering & Drawing Approval Management */}
          <Route path="/engineering/dashboard" element={<EngineeringDashboard />} />
          <Route path="/engineering/projects" element={<EngineeringProjectsList />} />
          <Route path="/engineering/projects/:id" element={<EngineeringProjectDetails />} />
          <Route path="/engineering/drawings" element={<DrawingRegisterList />} />
          <Route path="/engineering/submissions" element={<DrawingSubmissionsList />} />
          <Route path="/engineering/approvals" element={<CustomerApprovalsList />} />
          <Route path="/engineering/clarifications" element={<TechnicalClarificationsList />} />

          {/* Module 3: Advance Payment & Financial Operations (Restricted from PO Team & Technical Stores) */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'ACCOUNTANT', 'SALES']} />}>
            <Route path="/payments/dashboard" element={<PaymentDashboard />} />
            <Route path="/payments/orders" element={<OrderPaymentsList />} />
            <Route path="/payments/orders/:orderId" element={<OrderPaymentDetails />} />
            <Route path="/payments/receipts" element={<PaymentReceiptsList />} />
            <Route path="/payments/pending" element={<PendingPaymentsList />} />
            <Route path="/payments/reports" element={<PaymentReports />} />
          </Route>

          {/* Manager Operations */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']} />}>
            <Route path="/manager/dashboard" element={<ManagerDashboard />} />
          </Route>

          {/* Universal Workflow Access & Auto-Routing based on User Role */}
          <Route
            path="/workflow"
            element={
              user?.role === 'PO_TEAM' ? (
                <Navigate to="/departments/workflow?dept=2" replace />
              ) : user?.role === 'STOCK_ADMIN' ? (
                <Navigate to="/inventory" replace />
              ) : (
                <WorkflowWizard />
              )
            }
          />

          {/* 6-Step Multi-Page Client Enquiry -> Offering -> PO Team Workflow */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'SALES', 'ACCOUNTANT']} />}>
            <Route path="/enquiries/new" element={<WorkflowWizard />} />
            <Route path="/enquiries/:id/workflow" element={<WorkflowWizard />} />

            {/* Sales Operations */}
            <Route path="/sales/dashboard" element={<SalesDashboard />} />
            <Route path="/clients" element={<ClientsList />} />
            <Route path="/clients/new" element={<ClientForm />} />
            <Route path="/clients/:id" element={<ClientProfile />} />
            <Route path="/clients/:id/edit" element={<ClientForm />} />

            <Route path="/enquiries" element={<EnquiriesList />} />
            <Route path="/enquiries/:id" element={<EnquiryDetails />} />
            <Route path="/enquiries/:id/edit" element={<WorkflowWizard />} />
            <Route path="/enquiries/:id/handover" element={<HandoverForm />} />

            <Route path="/followups" element={<FollowupsList />} />
            <Route path="/quotations" element={<QuotationsList />} />
            <Route path="/quotations/:id" element={<QuotationDetails />} />
          </Route>

          {/* Admin Protected Operations */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/approvals/pending" element={<PendingApprovals />} />
            <Route path="/admin/enquiries/approved" element={<EnquiriesList key="admin-approved" presetStatus="Approved" />} />
            <Route path="/admin/enquiries/returned" element={<EnquiriesList key="admin-returned" presetStatus="Returned for Correction" />} />
            <Route path="/admin/enquiries/rejected" element={<EnquiriesList key="admin-rejected" presetStatus="Rejected" />} />
            <Route path="/admin/quotations/new" element={<QuotationBuilder />} />
            <Route path="/admin/users" element={<UserManagement />} />
            <Route path="/admin/settings" element={<MasterSettings />} />
            <Route path="/admin/audit-logs" element={<AuditLogsView />} />
            <Route path="/admin/reports" element={<ReportsAnalytics />} />
          </Route>
        </Route>
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};
