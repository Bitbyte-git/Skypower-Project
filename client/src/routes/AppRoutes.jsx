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
    if (user?.role === 'ADMIN') return '/admin/dashboard';
    if (user?.role === 'MANAGER') return '/manager/dashboard';
    if (user?.role === 'PO_TEAM') return '/po/tracking';
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

      {/* Protected Routes Layout */}
      <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'SALES', 'PO_TEAM']} />}>
        <Route element={<MainLayout />}>
          {/* Default Root Redirect */}
          <Route path="/" element={<Navigate to={getHomeRoute()} replace />} />

          {/* Shared Profile */}
          <Route path="/profile" element={<Profile />} />

          {/* Department Workflow & Tracking Views (Accessible to all authorized roles) */}
          <Route path="/departments/workflow" element={<DepartmentWorkflowView />} />
          <Route path="/projects/tracking/:trackingId" element={<ProjectTrackingTimeline />} />
          <Route path="/reports" element={<ReportsAnalytics />} />

          {/* PO Team & Execution Tracking Portal */}
          <Route path="/po/tracking" element={<POTrackingView />} />

          {/* Manager Operations */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']} />}>
            <Route path="/manager/dashboard" element={<ManagerDashboard />} />
          </Route>

          {/* 6-Step Multi-Page Client Enquiry -> Offering -> PO Team Workflow */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'SALES']} />}>
            <Route path="/workflow" element={<WorkflowWizard />} />
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
