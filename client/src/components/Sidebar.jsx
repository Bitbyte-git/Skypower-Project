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
  FileText,
  Boxes,
  BarChart3,
  Settings,
  X,
  ShoppingCart,
  FileCheck2,
  Compass,
  Receipt,
  Clock,
  Send,
  MessageSquare,
  Layers
} from 'lucide-react';
import factoryBuildingImg from '../assets/sky-power-building.png';

export const Sidebar = ({ isOpen = false, onClose = () => {} }) => {
  const { user, isAdmin, isManager, isPOTeam, isAccountant, isStockAdmin, isDesignEngineer } = useAuth();
  const location = useLocation();

  const getDashboardPath = () => {
    if (isAdmin) return '/admin/dashboard';
    if (isManager) return '/manager/dashboard';
    if (isPOTeam) return '/po/tracking';
    if (isAccountant || user?.role === 'ACCOUNTANT') return '/departments/workflow?dept=3';
    if (isStockAdmin || user?.role === 'STOCK_ADMIN') return '/inventory';
    if (isDesignEngineer || user?.role === 'DESIGN_ENGINEER' || user?.role === 'ENGINEERING_MANAGER' || user?.role === 'ENGINEERING_REVIEWER') return '/engineering/dashboard';
    return '/sales/dashboard';
  };

  const navItems = [
    {
      name: isManager
        ? 'Manager Console'
        : isPOTeam
        ? 'PO Tracking Portal'
        : isAccountant || user?.role === 'ACCOUNTANT'
        ? 'Advance Payment Queue'
        : isStockAdmin || user?.role === 'STOCK_ADMIN'
        ? 'Inventory & Stores'
        : isDesignEngineer || user?.role === 'DESIGN_ENGINEER' || user?.role === 'ENGINEERING_MANAGER'
        ? 'Engineering Console'
        : 'Dashboard',
      path: getDashboardPath(),
      icon: isAccountant || user?.role === 'ACCOUNTANT' ? CreditCard : (isStockAdmin || user?.role === 'STOCK_ADMIN' ? Boxes : (isDesignEngineer || user?.role === 'DESIGN_ENGINEER' || user?.role === 'ENGINEERING_MANAGER' ? Cpu : LayoutDashboard))
    },
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
    {
      name: 'Order Dashboard',
      path: '/orders/dashboard',
      icon: ShoppingCart,
      badge: 'Mod 2'
    },
    {
      name: 'Sales Orders',
      path: '/orders',
      icon: FileSpreadsheet
    },
    {
      name: 'Customer POs',
      path: '/orders/purchase-orders',
      icon: FileCheck2
    },
    {
      name: 'Order Tracking',
      path: '/orders/tracking',
      icon: Compass
    },
    {
      name: 'Payment Dashboard',
      path: '/payments/dashboard',
      icon: CreditCard,
      badge: 'Mod 3'
    },
    {
      name: 'Order Payments',
      path: '/payments/orders',
      icon: FileSpreadsheet
    },
    {
      name: 'Payment Receipts',
      path: '/payments/receipts',
      icon: Receipt
    },
    {
      name: 'Pending Payments',
      path: '/payments/pending',
      icon: Clock
    },
    {
      name: 'Payment Reports',
      path: '/payments/reports',
      icon: BarChart3
    },
    // Module 4: Engineering & Drawing Approval Management
    {
      name: 'Engineering Dashboard',
      path: '/engineering/dashboard',
      icon: Cpu,
      badge: 'Mod 4'
    },
    {
      name: 'Engineering Projects',
      path: '/engineering/projects',
      icon: FolderGit2
    },
    {
      name: 'Drawing Register',
      path: '/engineering/drawings',
      icon: Layers
    },
    {
      name: 'Drawing Submission',
      path: '/engineering/submissions',
      icon: Send
    },
    {
      name: 'Customer Approvals',
      path: '/engineering/approvals',
      icon: FileCheck2
    },
    {
      name: 'Technical Clarifications',
      path: '/engineering/clarifications',
      icon: MessageSquare
    },
    { name: 'Projects', path: '/enquiries', icon: FolderGit2 },
    { name: 'Inventory & Stock', path: '/inventory', icon: Boxes, badge: 'Stock' },
    { name: 'Product Master', path: '/inventory', icon: Cpu },
    { name: 'Production', path: '/po/tracking', icon: Factory },
    { name: 'Quality Control', path: '/po/tracking', icon: ShieldCheck },
    { name: 'Dispatch & Delivery', path: '/po/tracking', icon: Truck },
    { name: 'Advance Payment', path: '/departments/workflow?dept=3', icon: CreditCard, badge: 'Stage 3' },
    { name: 'Drawing & OA', path: '/departments/workflow?dept=4', icon: FileText, badge: 'Stage 4' },
    { name: 'Reports & Analytics', path: '/reports', icon: BarChart3 },
    { name: 'System Setup', path: isAdmin ? '/admin/settings' : '/profile', icon: Settings }
  ];

  const checkIsActive = (itemPath) => {
    if (itemPath === '/departments/workflow?dept=3') {
      return location.pathname.startsWith('/departments/workflow') && location.search.includes('dept=3');
    }
    if (itemPath === '/departments/workflow?dept=4') {
      return location.pathname.startsWith('/departments/workflow') && location.search.includes('dept=4');
    }
    if (itemPath === '/inventory') {
      return location.pathname.startsWith('/inventory') || location.pathname.startsWith('/stock-admin');
    }
    if (itemPath === '/departments/workflow') {
      return location.pathname.startsWith('/departments/workflow') && !location.search.includes('dept=3') && !location.search.includes('dept=4');
    }
    if (itemPath === '/workflow') {
      return (
        location.pathname.startsWith('/workflow') ||
        location.pathname.startsWith('/enquiries/new')
      );
    }
    if (itemPath === '/orders/dashboard') {
      return location.pathname === '/orders/dashboard';
    }
    if (itemPath === '/orders') {
      return (
        location.pathname === '/orders' ||
        (location.pathname.startsWith('/orders/') &&
          !location.pathname.startsWith('/orders/dashboard') &&
          !location.pathname.startsWith('/orders/purchase-orders') &&
          !location.pathname.startsWith('/orders/tracking'))
      );
    }
    if (itemPath === '/orders/purchase-orders') {
      return location.pathname.startsWith('/orders/purchase-orders');
    }
    if (itemPath === '/orders/tracking') {
      return location.pathname.startsWith('/orders/tracking');
    }
    if (itemPath === '/payments/dashboard') {
      return location.pathname === '/payments/dashboard';
    }
    if (itemPath === '/payments/orders') {
      return location.pathname.startsWith('/payments/orders');
    }
    if (itemPath === '/payments/receipts') {
      return location.pathname.startsWith('/payments/receipts');
    }
    if (itemPath === '/payments/pending') {
      return location.pathname.startsWith('/payments/pending');
    }
    if (itemPath === '/payments/reports') {
      return location.pathname.startsWith('/payments/reports');
    }
    if (itemPath === '/engineering/dashboard') {
      return location.pathname === '/engineering/dashboard';
    }
    if (itemPath === '/engineering/projects') {
      return location.pathname.startsWith('/engineering/projects');
    }
    if (itemPath === '/engineering/drawings') {
      return location.pathname.startsWith('/engineering/drawings');
    }
    if (itemPath === '/engineering/submissions') {
      return location.pathname.startsWith('/engineering/submissions');
    }
    if (itemPath === '/engineering/approvals') {
      return location.pathname.startsWith('/engineering/approvals');
    }
    if (itemPath === '/engineering/clarifications') {
      return location.pathname.startsWith('/engineering/clarifications');
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
      className={`fixed inset-y-0 left-0 z-50 w-64 flex flex-col shrink-0 select-none shadow-2xl transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 print:hidden ${
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

        {navItems
          .filter((item) => {
            // STRICT: PO Team cannot see anything related to payments or financial operations
            if (isPOTeam) {
              const isPayment =
                item.path.startsWith('/payments') ||
                item.name.toLowerCase().includes('payment');
              if (isPayment) return false;
            }
            return true;
          })
          .map((item) => {
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
