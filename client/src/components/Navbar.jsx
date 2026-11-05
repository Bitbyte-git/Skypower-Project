import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LogOut,
  Bell,
  Calendar,
  HelpCircle,
  Activity,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isPOTeam = user?.role === 'PO_TEAM';
  const isWorkflow = location.pathname.startsWith('/workflow') || location.pathname.startsWith('/enquiries/new');

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Determine user display title
  let roleTitle = 'Sales Executive';
  let deptTitle = 'Sales & Marketing Team';
  let userName = user?.name || 'Rajesh Sharma';

  if (isPOTeam) {
    roleTitle = 'PO Team Lead';
    deptTitle = 'PO & Execution Team';
    userName = user?.name || 'Suresh Kumar';
  } else if (isAdmin && location.pathname.startsWith('/admin')) {
    roleTitle = 'System Administrator';
    deptTitle = 'Executive Director';
  } else {
    // In Sales & Marketing workspace: strictly show Sales Executive / Sales Engineer
    roleTitle = 'Sr. Sales Engineer';
    deptTitle = 'Sales & Marketing Team';
  }

  const initials = userName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'SE';

  return (
    <header className="h-16 bg-white border-b border-slate-200/90 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 select-none shadow-2xs">
      {/* Left: Branding & Sub-title */}
      <div className="flex items-center space-x-3 min-w-0">
        <div className="flex flex-col">
          <div className="flex items-center space-x-2">
            <span className="text-base font-black text-[#0A1E3F] tracking-tight">
              Sky Power Switchgears – Manufacturing ERP
            </span>
          </div>
          <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-slate-500 truncate">
            <span className="text-[#EE6F2D] font-bold">Enquiry to PO Workflow</span>
            <span>|</span>
            <span className="hidden lg:inline text-slate-600">
              Client Register → Project &amp; Products → Pricing &amp; Offering → Offering Revision → Send to PO Team
            </span>
          </div>
        </div>
      </div>

      {/* Right: Operational Controls & User Badge */}
      <div className="flex items-center space-x-3 shrink-0">
        {/* Utility icons */}
        <div className="hidden sm:flex items-center space-x-1.5 text-slate-400">
          <button
            type="button"
            className="p-1.5 rounded-full hover:bg-slate-100 hover:text-slate-600 transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
          </button>
          <button
            type="button"
            className="p-1.5 rounded-full hover:bg-slate-100 hover:text-slate-600 transition-colors"
            title="Calendar"
          >
            <Calendar className="w-4 h-4" />
          </button>
          <button
            type="button"
            className="p-1.5 rounded-full hover:bg-slate-100 hover:text-slate-600 transition-colors"
            title="Help"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>

        <div className="h-6 w-px bg-slate-200 hidden sm:block" />

        {/* User Identity Profile Card */}
        <div
          onClick={() => navigate('/profile')}
          className="flex items-center space-x-2.5 p-1 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
          title="User Profile"
        >
          <div className="w-9 h-9 rounded-full bg-[#1E5BB8] text-white flex items-center justify-center font-black text-xs shadow-xs">
            {initials}
          </div>

          <div className="hidden md:flex flex-col text-left">
            <span className="text-xs font-extrabold text-[#0A1E3F] leading-tight">
              {userName}
            </span>
            <span className="text-[10px] font-medium text-slate-500 leading-tight">
              {deptTitle} • {roleTitle}
            </span>
          </div>
        </div>

        {/* Sign Out */}
        <button
          onClick={handleLogout}
          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
