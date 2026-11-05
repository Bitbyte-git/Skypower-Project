import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  FileSpreadsheet,
  FolderGit2,
  Cpu,
  Factory,
  ShieldCheck,
  Truck,
  CreditCard,
  BarChart3,
  Settings,
  Sparkles,
  ClipboardList
} from 'lucide-react';
import heroImg from '../assets/hero.png';

export const Sidebar = () => {
  const { user, isAdmin } = useAuth();
  const location = useLocation();
  const isPOTeam = user?.role === 'PO_TEAM';

  const navItems = isPOTeam
    ? [
        { name: 'PO Tracking', path: '/po/tracking', icon: ClipboardList, badge: 'ACTIVE' },
        { name: 'Production Queue', path: '/po/tracking?filter=production', icon: Factory },
        { name: 'Quality Handover', path: '/po/tracking?filter=qc', icon: ShieldCheck }
      ]
    : [
        { name: 'Dashboard', path: isAdmin ? '/admin/dashboard' : '/sales/dashboard', icon: LayoutDashboard },
        {
          name: 'Enquiry & CRM',
          path: '/workflow',
          icon: FileSpreadsheet,
          badge: '6-STEP'
        },
        { name: 'Projects', path: '/enquiries', icon: FolderGit2 },
        { name: 'Product Master', path: isAdmin ? '/admin/settings' : '/enquiries', icon: Cpu },
        { name: 'Production', path: '/po/tracking', icon: Factory },
        { name: 'Quality Control', path: '/po/tracking', icon: ShieldCheck },
        { name: 'Dispatch & Delivery', path: '/po/tracking', icon: Truck },
        { name: 'Accounts & Finance', path: '/quotations', icon: CreditCard },
        { name: 'Reports & Analytics', path: isAdmin ? '/admin/reports' : '/followups', icon: BarChart3 },
        { name: 'System Setup', path: isAdmin ? '/admin/settings' : '/profile', icon: Settings }
      ];

  const checkIsActive = (itemPath) => {
    if (itemPath === '/workflow') {
      return (
        location.pathname.startsWith('/workflow') ||
        location.pathname.startsWith('/enquiries/new')
      );
    }
    if (itemPath === '/enquiries') {
      return (
        location.pathname === '/enquiries' &&
        !location.pathname.includes('/new') &&
        !location.pathname.includes('/workflow')
      );
    }
    return location.pathname === itemPath;
  };

  return (
    <aside className="w-64 bg-[#0A101D] text-slate-300 flex flex-col shrink-0 min-h-screen border-r border-slate-800/70 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800/80 bg-[#070C16] flex items-center space-x-3">
        <div className="w-11 h-11 rounded-lg bg-white p-1 flex items-center justify-center shrink-0 shadow-md">
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
          <p className="text-[11px] text-slate-400 font-semibold tracking-tight">
            Switch to the Future
          </p>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          Enterprise ERP Modules
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = checkIsActive(item.path);

          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={`group flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-[#EE6F2D] to-[#D95B1B] text-white shadow-md shadow-orange-500/20 translate-x-1'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60 hover:translate-x-0.5'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors duration-200 ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                <span className="text-xs">{item.name}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-white text-[#D95B1B]'
                      : 'bg-[#EE6F2D]/20 text-[#EE6F2D] border border-[#EE6F2D]/40'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Factory Artwork Card at Bottom */}
      <div className="p-3 border-t border-slate-800/80 bg-[#070C16]">
        <div className="relative rounded-lg overflow-hidden border border-slate-700/60 group shadow-md">
          <img
            src={heroImg}
            alt="Sky Power Switchgears Salem Works"
            className="w-full h-16 object-cover brightness-75 group-hover:brightness-90 transition-all duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex flex-col justify-end p-2 text-white">
            <span className="text-[10px] font-black tracking-tight text-white leading-tight">
              SKY POWER SWITCHGEARS
            </span>
            <span className="text-[9px] text-slate-300 font-medium">
              Salem Works, Tamil Nadu
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};
