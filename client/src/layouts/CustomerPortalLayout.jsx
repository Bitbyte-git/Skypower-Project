import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Package,
  FileCheck2,
  CreditCard,
  Bell,
  User,
  LogOut,
  Building2,
  Phone,
  Mail,
  ShieldCheck,
  ChevronDown,
  Menu,
  X,
  ExternalLink
} from 'lucide-react';

export const CustomerPortalLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [userDropdown, setUserDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/customer/login');
  };

  const navItems = [
    { to: '/portal/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/portal/orders', label: 'My Orders', icon: Package },
    { to: '/portal/documents', label: 'Drawings & Docs', icon: FileCheck2 },
    { to: '/portal/payments', label: 'Payments', icon: CreditCard },
    { to: '/portal/notifications', label: 'Updates', icon: Bell }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* 1. Portal Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        {/* Top announcement / support ribbon */}
        <div className="bg-[#062B59] text-white text-[11px] py-1.5 px-4 sm:px-8 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-slate-200">Sky Power Switchgears — Authorized Customer Portal</span>
          </div>
          <div className="hidden sm:flex items-center space-x-4 text-slate-300">
            <span className="flex items-center">
              <Phone className="w-3 h-3 mr-1 text-sky-400" /> Helpline: +91 98401 98401
            </span>
            <span className="flex items-center">
              <Mail className="w-3 h-3 mr-1 text-sky-400" /> support@skypower.co.in
            </span>
          </div>
        </div>

        {/* Main Navigation Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-4">
            <Link to="/portal/dashboard" className="flex items-center space-x-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-base shadow-sm"
                style={{ background: 'linear-gradient(135deg, #062B59 0%, #0878C9 100%)' }}
              >
                SP
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-black text-lg tracking-tight text-slate-900">SKY POWER</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                    Customer Portal
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">Switchgear Manufacturing &amp; Project Tracking</p>
              </div>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-extrabold shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Customer Profile & Actions */}
          <div className="flex items-center space-x-3">
            {/* Customer Company Badge */}
            <div className="hidden lg:flex flex-col text-right">
              <span className="text-xs font-bold text-slate-900 truncate max-w-[200px]">
                {user?.companyName || user?.name || 'Valued Customer'}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Verified Client Account</span>
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserDropdown(!userDropdown)}
                className="flex items-center space-x-2 p-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center">
                  {(user?.name || 'C').charAt(0).toUpperCase()}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {userDropdown && (
                <div
                  onMouseLeave={() => setUserDropdown(false)}
                  className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 text-xs space-y-1"
                >
                  <div className="px-3 py-2 border-b border-slate-100 mb-1">
                    <p className="font-bold text-slate-900 truncate">{user?.name}</p>
                    <p className="text-[11px] text-slate-500 font-mono truncate">{user?.email}</p>
                    <p className="text-[10px] text-blue-600 font-semibold mt-0.5 truncate">{user?.companyName}</p>
                  </div>

                  <Link
                    to="/portal/profile"
                    onClick={() => setUserDropdown(false)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 font-medium transition-colors"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    <span>Company &amp; Contact Profile</span>
                  </Link>

                  <Link
                    to="/portal/notifications"
                    onClick={() => setUserDropdown(false)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 font-medium transition-colors"
                  >
                    <Bell className="w-4 h-4 text-slate-400" />
                    <span>Order Notifications</span>
                  </Link>

                  <div className="border-t border-slate-100 pt-1">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-bold transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      <span>Log Out from Portal</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Hamburger Menu */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center space-x-2 px-3 py-2.5 rounded-xl text-xs font-bold ${
                      isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
            <div className="border-t border-slate-100 pt-2">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center space-x-2 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* 2. Main Body Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* 3. Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-800">Sky Power Switchgears Private Limited</span>
            <span>•</span>
            <span>Switch to the Future</span>
          </div>
          <div className="flex items-center space-x-4 text-[11px]">
            <span>Works: SIDCO Industrial Estate, Salem, Tamil Nadu</span>
            <span>•</span>
            <Link to="/customer/login" className="text-blue-600 hover:underline">
              Customer Portal Login
            </Link>
            <span>•</span>
            <Link to="/login" className="text-slate-400 hover:underline">
              Employee ERP Login
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
