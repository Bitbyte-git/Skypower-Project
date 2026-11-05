import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert } from 'lucide-react';

export const ProtectedRoute = ({ allowedRoles }) => {
  const { user, token, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-4 border-[#1E5BB8] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Verifying ERP Authorization...</p>
        </div>
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const returnUrl =
      user.role === 'ADMIN'
        ? '/admin/dashboard'
        : user.role === 'PO_TEAM'
        ? '/po/tracking'
        : '/sales/dashboard';

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md w-full bg-white border border-rose-200 rounded-lg p-6 shadow-sm text-center">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-1">Access Restricted</h2>
          <p className="text-xs text-slate-600 mb-4">
            Your assigned role (<strong className="text-slate-800">{user.role}</strong>) does not have authorization to view this administrative ERP screen.
          </p>
          <a
            href={returnUrl}
            className="inline-block px-4 py-2 bg-[#1E5BB8] hover:bg-[#174A96] text-white rounded text-xs font-semibold"
          >
            Return to Authorized Dashboard
          </a>
        </div>
      </div>
    );
  }

  return <Outlet />;
};
