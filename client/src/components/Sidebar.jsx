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
  X
} from 'lucide-react';
import factoryBuildingImg from '../assets/sky-power-building.png';

export const Sidebar = ({ isOpen = false, onClose = () => {} }) => {
  const { user, isAdmin, isManager, isPOTeam } = useAuth();
  const location = useLocation();

  const getDashboardPath = () => {
    if (isAdmin) return '/admin/dashboard';
    if (isManager) return '/manager/dashboard';
    if (isPOTeam) return '/po/tracking';
    return '/sales/dashboard';
  };

  const navItems = [
    { name: isManager ? 'Manager Console' : isPOTeam ? 'PO Tracking Portal' : 'Dashboard', path: getDashboardPath(), icon: LayoutDashboard },
    {
      name: '10-Dept Workflow',
      path: '/departments/workflow',
      icon: Factory,
      badge: 'DEPT'
    },
    {
      name: 'Enquiry & CRM',
      path: '/workflow',
      icon: FileSpreadsheet,
      badge: 'New'
    },
    { name: 'Projects', path: '/enquiries', icon: FolderGit2 },
    { name: 'Product Master', path: isAdmin ? '/admin/settings' : '/enquiries', icon: Cpu },
    { name: 'Production', path: '/po/tracking', icon: Factory },
    { name: 'Quality Control', path: '/po/tracking', icon: ShieldCheck },
    { name: 'Dispatch & Delivery', path: '/po/tracking', icon: Truck },
    { name: 'Accounts & Finance', path: '/quotations', icon: CreditCard },
    { name: 'Reports & Analytics', path: '/reports', icon: BarChart3 },
    { name: 'System Setup', path: isAdmin ? '/admin/settings' : '/profile', icon: Settings }
  ];

  const checkIsActive = (itemPath) => {
    if (itemPath === '/departments/workflow') {
      return location.pathname.startsWith('/departments/workflow');
    }
    if (itemPath === '/workflow') {
      return (
        location.pathname.startsWith('/workflow') ||
        location.pathname.startsWith('/enquiries/new')
      );
    }
    if (itemPath === '/reports') {
      return location.pathname.startsWith('/reports') || location.pathname.startsWith('/admin/reports');
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
    <aside
      style={{
        background: 'linear-gradient(180deg, #031D40 0%, #062B59 55%, #0A4076 100%)'
      }}
      className={`fixed inset-y-0 left-0 z-50 w-64 flex flex-col shrink-0 select-none shadow-2xl transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Brand Header */}
      <div
        className="p-4 flex items-center justify-between border-b"
        style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.15)' }}
      >
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-xl bg-white p-1 flex items-center justify-center shrink-0 shadow-lg">
            <img
              src="/brand-logo.jpg"
              alt="Sky Power"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="flex items-center text-base font-black tracking-wide">
              <span style={{ color: '#60A5FA' }}>SKY</span>
              <span style={{ color: '#FF7A18' }} className="ml-1">POWER</span>
            </div>
            <p className="text-[11px] font-semibold tracking-tight" style={{ color: '#8BB8E0' }}>
              Switch to the Future
            </p>
          </div>
        </div>

        {/* Mobile Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          title="Close Navigation"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav List */}
      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto no-scrollbar">
        <div className="px-3 pb-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: '#4A7FAD' }}>
          Enterprise ERP Modules
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = checkIsActive(item.path);

          return (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={onClose}
              className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? 'text-white shadow-lg'
                  : 'hover:bg-white/9'
              }`}
              style={
                isActive
                  ? {
                      background: 'linear-gradient(90deg, #FF8A20 0%, #FF6A0A 100%)',
                      boxShadow: '0 4px 14px rgba(255, 122, 24, 0.35)',
                      color: '#FFFFFF'
                    }
                  : { color: '#C8DDEF' }
              }
            >
              <div className="flex items-center space-x-3">
                <Icon
                  className="w-4.5 h-4.5 shrink-0 transition-colors duration-200"
                  style={
                    isActive
                      ? { color: '#FFFFFF' }
                      : { color: '#7FB3D4' }
                  }
                  size={17}
                />
                <span className="text-[13px]">{item.name}</span>
              </div>

              {item.badge && (
                <span
                  className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
                  style={
                    isActive
                      ? { background: 'rgba(255,255,255,0.25)', color: '#FFFFFF' }
                      : { background: 'rgba(255,122,24,0.18)', color: '#FF9A48', border: '1px solid rgba(255,122,24,0.3)' }
                  }
                >
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* SKY POWER Factory Building at Bottom — 100% Seamless on Sidebar Background */}
      <div className="shrink-0 w-full px-2 pb-1 mt-auto">
        <img
          src={factoryBuildingImg}
          alt="SKY POWER Switchgears Factory Building"
          className="w-full h-auto object-contain block select-none pointer-events-none"
          style={{
            filter: 'drop-shadow(0 10px 18px rgba(0, 0, 0, 0.45))'
          }}
        />
      </div>
    </aside>
  );
};
