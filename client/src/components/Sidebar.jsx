import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  FilePlus2,
  Users,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  RotateCcw,
  XCircle,
  FileText,
  CalendarClock,
  UserCog,
  BarChart3,
  Settings,
  ShieldAlert,
  Briefcase
} from 'lucide-react';

export const Sidebar = () => {
  const { isAdmin } = useAuth();
  const location = useLocation();

  const salesNavItems = [
    {
      section: 'Workflows',
      items: [
        { name: 'Dashboard', path: '/sales/dashboard', icon: LayoutDashboard },
        { name: 'New Enquiry', path: '/enquiries/new', icon: FilePlus2 },
        { name: 'Register Client', path: '/clients/new', icon: Users },
        { name: 'Clients Master', path: '/clients', icon: Briefcase },
      ]
    },
    {
      section: 'Lifecycle',
      items: [
        { name: 'My Enquiries', path: '/enquiries', icon: FileSpreadsheet },
        { name: 'Pending Approvals', path: '/enquiries?status=pending', icon: Clock },
        { name: 'Returned Enquiries', path: '/enquiries?status=returned', icon: RotateCcw, badge: 'REVISION' },
        { name: 'Approved Enquiries', path: '/enquiries?status=approved', icon: CheckCircle2 },
        { name: 'Follow-ups', path: '/followups', icon: CalendarClock },
        { name: 'Quotations', path: '/quotations', icon: FileText }
      ]
    }
  ];

  const adminNavItems = [
    {
      section: 'Approvals & Gate',
      items: [
        { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'Pending Approvals', path: '/admin/approvals/pending', icon: Clock, badge: 'GATE' },
        { name: 'Approved', path: '/admin/enquiries/approved', icon: CheckCircle2 },
        { name: 'Returned', path: '/admin/enquiries/returned', icon: RotateCcw },
        { name: 'Rejected', path: '/admin/enquiries/rejected', icon: XCircle },
      ]
    },
    {
      section: 'Operations',
      items: [
        { name: 'All Enquiries', path: '/enquiries?view=all', icon: FileSpreadsheet },
        { name: 'Clients Master', path: '/clients', icon: Users },
        { name: 'Quotations', path: '/quotations', icon: FileText },
        { name: 'Follow-ups', path: '/followups', icon: CalendarClock },
      ]
    },
    {
      section: 'Administration',
      items: [
        { name: 'User Management', path: '/admin/users', icon: UserCog },
        { name: 'Reports & Analytics', path: '/admin/reports', icon: BarChart3 },
        { name: 'Master Settings', path: '/admin/settings', icon: Settings },
        { name: 'Audit Logs', path: '/admin/audit-logs', icon: ShieldAlert }
      ]
    }
  ];

  const sections = isAdmin ? adminNavItems : salesNavItems;

  const checkIsActive = (targetPath) => {
    const currentFull = location.pathname + location.search;
    if (targetPath.includes('?')) {
      return currentFull === targetPath;
    }
    // If target has no query params, don't match if current URL has query params on /enquiries
    if (targetPath === '/enquiries') {
      return location.pathname === '/enquiries' && !location.search;
    }
    return location.pathname === targetPath;
  };

  return (
    <aside className="w-64 bg-[#0A101D] text-slate-300 flex flex-col shrink-0 min-h-screen border-r border-slate-800/70 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800/80 bg-[#070C16] flex items-center space-x-3">
        <div className="w-11 h-11 rounded-lg bg-white p-1 flex items-center justify-center shrink-0 shadow-md transition-transform duration-300 hover:scale-105">
          <img
            src="/brand-logo.jpg"
            alt="Sky Power"
            className="w-full h-full object-contain"
          />
        </div>
        <div>
          <div className="flex items-center text-base font-black tracking-wide">
            <span className="text-[#1E5BB8]">SKY</span>
            <span className="text-[#EE6F2D] ml-1">POWER</span>
          </div>
          <p className="text-xs text-slate-400 font-semibold tracking-tight">
            Switch to the Future
          </p>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
        {sections.map((sec, idx) => (
          <div key={idx} className="space-y-1">
            <div className="px-3 pb-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {sec.section}
            </div>
            {sec.items.map((item) => {
              const Icon = item.icon;
              const isActive = checkIsActive(item.path);

              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  className={`group flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-[#1E5BB8] to-[#174A96] text-white shadow-md shadow-[#1E5BB8]/25 translate-x-1 font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60 hover:translate-x-0.5'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors duration-200 ${
                        isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                      }`}
                    />
                    <span className="text-sm">{item.name}</span>
                  </div>

                  {item.badge && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#EE6F2D] text-white shadow-xs">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer Minimal Status */}
      <div className="p-3.5 border-t border-slate-800/80 bg-[#070C16] text-xs font-medium text-slate-400 flex items-center justify-between">
        <span className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="font-semibold text-slate-300">v2.8 Live</span>
        </span>
        <span className="font-mono text-slate-400 font-semibold">IEC 62271</span>
      </div>
    </aside>
  );
};
