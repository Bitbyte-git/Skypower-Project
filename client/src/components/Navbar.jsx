import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import {
  LogOut,
  Bell,
  Calendar as CalendarIcon,
  HelpCircle,
  Menu,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  MapPin,
  ShieldAlert,
  FileText,
  Layers,
  ArrowRight,
  Check,
  X,
  Eye,
  Info
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export const Navbar = ({ onToggleSidebar = () => {} }) => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isPOTeam = user?.role === 'PO_TEAM';

  // Active Dropdown state: null | 'notifications' | 'calendar' | 'help'
  const [activeDropdown, setActiveDropdown] = useState(null);
  const dropdownRef = useRef(null);

  // Selected Notification for Detail Modal
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [notificationFilter, setNotificationFilter] = useState('all'); // 'all' | 'unread'
  const [markedAllToast, setMarkedAllToast] = useState(false);

  // Live real-time clock state
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Notifications dynamic state
  const [notifications, setNotifications] = useState([
    {
      id: 'enq_1',
      title: 'Enquiry SP-2026-0008 Submitted',
      description: 'Project & products submitted for commercial pricing review.',
      detail: 'Client enquiry SP-2026-0008 was submitted by Sales & Marketing. Product category: 11kV VCB Switchboard. Total pipeline value: ₹ 61,70,000.',
      time: '12m ago',
      unread: true,
      type: 'workflow',
      ern: 'SP-2026-0008',
      clientName: 'Tamil Nadu Electricity Board (TNEB)',
      value: 6170000,
      link: '/workflow'
    },
    {
      id: 'app_1',
      title: 'Stage 4 OA Approval Completed',
      description: 'Engineering drawings cleared for 11kV VCB Switchboard.',
      detail: 'Department 4 (Drawing / Order Acknowledgement) cleared technical layout and GA drawing specifications with zero remarks.',
      time: '45m ago',
      unread: true,
      type: 'success',
      ern: 'SP-2026-0005',
      clientName: 'L&T Heavy Engineering',
      value: 2850000,
      link: '/reports'
    },
    {
      id: 'po_1',
      title: 'PO Gate Action Pending',
      description: 'Commercial terms sign-off required for Salem Works order.',
      detail: 'Purchase Order Team review required for freight delivery basis (FOR Salem) and 18% GST tax regime clearance.',
      time: '2h ago',
      unread: true,
      type: 'warning',
      ern: 'SP-2026-0007',
      clientName: 'SIPCOT Industrial Estate Substation',
      value: 4900000,
      link: '/po-tracking'
    },
    {
      id: 'mat_1',
      title: 'Material Inventory Threshold',
      description: 'Vacuum Interrupter Bottles stock at reorder level.',
      detail: 'Component SKU VCB-BTL-11KV dropped below safety buffer count of 5 units. Reorder requisition generated for purchase approval.',
      time: '5h ago',
      unread: false,
      type: 'alert',
      ern: 'INV-2026-042',
      clientName: 'Internal Salem Works Store',
      value: 850000,
      link: '/dashboard'
    }
  ]);

  // Fetch real database notifications from backend
  const fetchDynamicNotifications = async () => {
    try {
      const res = await api.get('/dashboard/notifications');
      if (res && res.success && Array.isArray(res.notifications) && res.notifications.length > 0) {
        setNotifications(res.notifications);
      }
    } catch {
      // Keep initial realistic dynamic notifications on fallback
    }
  };

  useEffect(() => {
    fetchDynamicNotifications();
  }, []);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const markAllAsRead = (e) => {
    if (e) e.stopPropagation();
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    setMarkedAllToast(true);
    setTimeout(() => setMarkedAllToast(false), 2500);
  };

  const handleNotificationClick = (item, e) => {
    if (e) e.stopPropagation();
    // Mark as read in state
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, unread: false } : n))
    );
    // Open the detail modal
    setSelectedNotification(item);
  };

  // Calendar interactive state
  const [selectedPlant, setSelectedPlant] = useState('Salem Works (Unit 1)');

  // Close dropdown on click outside or Escape
  useEffect(() => {
    const handleClickOutside = (e) => {
      // Do not close if the detail modal is active
      if (selectedNotification) return;
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setActiveDropdown(null);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (selectedNotification) {
          setSelectedNotification(null);
        } else {
          setActiveDropdown(null);
        }
      }
    };

    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedNotification]);

  // Filtered notifications
  const displayedNotifications = notifications.filter((n) => {
    if (notificationFilter === 'unread') return n.unread;
    return true;
  });

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Determine user display title
  let roleTitle = 'Sales Executive';
  let userName = user?.name || 'Rajesh Sharma';

  if (isPOTeam) {
    roleTitle = 'PO Team Lead';
    userName = user?.name || 'Suresh Kumar';
  } else if (isAdmin && location.pathname.startsWith('/admin')) {
    roleTitle = 'System Administrator';
  } else {
    roleTitle = 'Sr. Sales Engineer';
  }

  const initials = userName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'RS';

  return (
    <header
      className="h-16 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 select-none relative"
      style={{
        background: 'linear-gradient(90deg, #FFFFFF 0%, #F4F9FF 100%)',
        borderBottom: '1px solid #DCE7F3',
        boxShadow: '0 2px 10px rgba(6, 43, 89, 0.05)'
      }}
    >
      {/* Left: Mobile Hamburger + App Title & Workflow Context */}
      <div className="flex items-center space-x-2.5 sm:space-x-3 flex-1 min-w-0 pr-4">
        {/* Mobile Hamburger Drawer Trigger */}
        <button
          type="button"
          onClick={onToggleSidebar}
          className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center text-[#062B59] hover:bg-[#EEF5FD] active:bg-[#DCE9FA] transition-colors cursor-pointer shrink-0"
          title="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col min-w-0">
          <div className="flex items-center space-x-2">
            <span
              className="text-[14px] sm:text-[15px] font-black tracking-tight truncate"
              style={{ color: '#062B59' }}
            >
              Sky Power Switchgears
            </span>
            <span
              className="hidden sm:inline text-xs font-semibold shrink-0"
              style={{ color: '#8495AB' }}
            >
              — Manufacturing ERP
            </span>
          </div>
          <div className="flex items-center space-x-1.5 text-[11px] font-medium mt-0.5 truncate">
            <span style={{ color: '#FF7A18' }} className="font-bold shrink-0">
              Enquiry to PO Workflow
            </span>
            <span style={{ color: '#DCE7F3' }} className="shrink-0 hidden md:inline">|</span>
            <span className="truncate hidden md:inline" style={{ color: '#526783' }}>
              Client Register → Project &amp; Products → Pricing &amp; Offering → Send to PO Team
            </span>
          </div>
        </div>
      </div>

      {/* Right: Dynamic Interactive Controls & RS Profile Avatar */}
      <div ref={dropdownRef} className="flex items-center space-x-1 sm:space-x-2 shrink-0 relative">
        {/* Utility Icon Buttons */}
        <div className="hidden sm:flex items-center space-x-1">
          {/* 1. NOTIFICATIONS BUTTON */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setActiveDropdown(activeDropdown === 'notifications' ? null : 'notifications')}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-150 cursor-pointer relative ${
                activeDropdown === 'notifications'
                  ? 'bg-[#EAF5FF] text-[#0878C9] ring-2 ring-[#0878C9]/20'
                  : 'text-slate-500 hover:text-[#062B59] hover:bg-[#EEF5FD]'
              }`}
              title="Notifications"
            >
              <Bell className="w-4.5 h-4.5" size={17} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#FF7A18] ring-2 ring-white animate-pulse" />
              )}
            </button>

            {/* Notifications Dropdown Panel */}
            {activeDropdown === 'notifications' && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-11 w-80 sm:w-96 bg-white rounded-2xl border shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
                style={{
                  borderColor: '#DFEAF6',
                  boxShadow: '0 10px 30px rgba(6, 43, 89, 0.12)'
                }}
              >
                {/* Panel Header */}
                <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: '#EAF0F7', background: '#F8FBFF' }}>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-[#102B50]">System Notifications</span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#FFF0E3] text-[#FF7A18] border border-[#FFD4A8]">
                        {unreadCount} New
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {markedAllToast ? (
                      <span className="text-[11px] font-bold text-emerald-600 flex items-center space-x-1">
                        <Check className="w-3 h-3" />
                        <span>All Read</span>
                      </span>
                    ) : unreadCount > 0 ? (
                      <button
                        type="button"
                        onClick={markAllAsRead}
                        className="text-[11px] font-bold text-[#0878C9] hover:text-[#062B59] cursor-pointer hover:underline"
                      >
                        Mark all read
                      </button>
                    ) : null}
                  </div>
                </div>

                {/* Filter Tabs */}
                <div className="px-3 pt-2 pb-1.5 flex items-center space-x-1.5 border-b border-slate-100 bg-slate-50/50 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setNotificationFilter('all')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      notificationFilter === 'all'
                        ? 'bg-white text-[#102B50] shadow-xs border border-slate-200'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    All ({notifications.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setNotificationFilter('unread')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      notificationFilter === 'unread'
                        ? 'bg-[#EAF5FF] text-[#0878C9] shadow-xs border border-[#C5DFF5]'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Unread ({unreadCount})
                  </button>
                </div>

                {/* Notifications List */}
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {displayedNotifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      No notifications in this filter
                    </div>
                  ) : (
                    displayedNotifications.map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        onClick={(e) => handleNotificationClick(item, e)}
                        className={`w-full text-left p-3.5 flex items-start space-x-3 cursor-pointer transition-all duration-150 group ${
                          item.unread
                            ? 'bg-[#F2F7FD]/90 hover:bg-[#EAF5FF]'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${
                            item.unread ? 'bg-[#FF7A18] ring-2 ring-orange-200' : 'bg-slate-300'
                          }`}
                        />
                        <div className="flex-1 min-w-0 pr-1">
                          <div className="flex items-center justify-between gap-1">
                            <h4 className="text-xs font-bold text-[#102B50] group-hover:text-[#0878C9] transition-colors truncate">
                              {item.title}
                            </h4>
                            <span className="text-[10px] text-slate-400 shrink-0 font-mono font-medium">
                              {item.time}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                        <Eye className="w-4 h-4 text-slate-400 group-hover:text-[#0878C9] opacity-40 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
                      </button>
                    ))
                  )}
                </div>

                {/* Panel Footer */}
                <div className="p-2.5 border-t text-center bg-slate-50/60" style={{ borderColor: '#EAF0F7' }}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveDropdown(null);
                      navigate('/workflow');
                    }}
                    className="text-xs font-bold text-[#0878C9] hover:text-[#062B59] inline-flex items-center space-x-1 cursor-pointer"
                  >
                    <span>Open Workflow Dashboard</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 2. CALENDAR BUTTON */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setActiveDropdown(activeDropdown === 'calendar' ? null : 'calendar')}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-150 cursor-pointer ${
                activeDropdown === 'calendar'
                  ? 'bg-[#EAF5FF] text-[#0878C9] ring-2 ring-[#0878C9]/20'
                  : 'text-slate-500 hover:text-[#062B59] hover:bg-[#EEF5FD]'
              }`}
              title="Manufacturing Calendar & Schedule"
            >
              <CalendarIcon className="w-4.5 h-4.5" size={17} />
            </button>

            {/* Calendar Dropdown Panel */}
            {activeDropdown === 'calendar' && (
              <div
                className="absolute right-0 top-11 w-80 sm:w-96 bg-white rounded-2xl border shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
                style={{
                  borderColor: '#DFEAF6',
                  boxShadow: '0 10px 30px rgba(6, 43, 89, 0.12)'
                }}
              >
                {/* Live Header: Date & Clock */}
                <div className="p-4 border-b bg-gradient-to-r from-[#031D40] to-[#0A4076] text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400">
                        Live Operations Calendar
                      </span>
                      <h3 className="text-sm font-bold mt-0.5">
                        {currentTime.toLocaleDateString('en-IN', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </h3>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono font-bold bg-white/10 px-2 py-1 rounded-lg border border-white/20">
                        {currentTime.toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Plant Location Switcher */}
                  <div className="mt-3 flex items-center space-x-1.5 bg-white/10 p-1 rounded-xl text-xs font-semibold backdrop-blur-xs">
                    <MapPin className="w-3.5 h-3.5 text-orange-400 shrink-0 ml-1" />
                    <select
                      value={selectedPlant}
                      onChange={(e) => setSelectedPlant(e.target.value)}
                      className="bg-transparent text-white text-xs outline-none cursor-pointer w-full"
                    >
                      <option value="Salem Works (Unit 1)" className="text-slate-900">
                        Salem Works (Unit 1 - Assembly &amp; Testing)
                      </option>
                      <option value="Coimbatore Substation (Unit 2)" className="text-slate-900">
                        Coimbatore Substation (Unit 2 - Fabrication)
                      </option>
                    </select>
                  </div>
                </div>

                {/* Operations Milestones */}
                <div className="p-4 space-y-2.5">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Plant Milestones &amp; Gates
                  </span>

                  <div className="space-y-2">
                    <div className="p-2.5 rounded-xl border border-blue-100 bg-[#F4F9FF] flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 rounded-full bg-[#0878C9]" />
                        <span className="font-semibold text-slate-800">Shift A (08:30 - 17:30)</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white text-[#0878C9] border border-blue-200">
                        Active Now
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl border border-emerald-100 bg-emerald-50/50 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="font-semibold text-slate-800">Stage 8 Dielectric Test</span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700">Tomorrow</span>
                    </div>

                    <div className="p-2.5 rounded-xl border border-amber-100 bg-amber-50/50 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        <span className="font-semibold text-slate-800">Dispatch: 22kV Kiosk Panel</span>
                      </div>
                      <span className="text-[10px] font-bold text-amber-700">10 Nov 2026</span>
                    </div>
                  </div>
                </div>

                {/* Action Footer */}
                <div className="p-2.5 border-t text-center bg-slate-50/60" style={{ borderColor: '#EAF0F7' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveDropdown(null);
                      navigate('/followups');
                    }}
                    className="text-xs font-bold text-[#0878C9] hover:text-[#062B59] inline-flex items-center space-x-1 cursor-pointer"
                  >
                    <span>View Scheduled Follow-ups</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 3. HELP & SUPPORT BUTTON */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setActiveDropdown(activeDropdown === 'help' ? null : 'help')}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-150 cursor-pointer ${
                activeDropdown === 'help'
                  ? 'bg-[#EAF5FF] text-[#0878C9] ring-2 ring-[#0878C9]/20'
                  : 'text-slate-500 hover:text-[#062B59] hover:bg-[#EEF5FD]'
              }`}
              title="ERP Knowledge & Help Center"
            >
              <HelpCircle className="w-4.5 h-4.5" size={17} />
            </button>

            {/* Help Dropdown Panel */}
            {activeDropdown === 'help' && (
              <div
                className="absolute right-0 top-11 w-80 sm:w-96 bg-white rounded-2xl border shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
                style={{
                  borderColor: '#DFEAF6',
                  boxShadow: '0 10px 30px rgba(6, 43, 89, 0.12)'
                }}
              >
                {/* Header */}
                <div className="p-4 border-b" style={{ borderColor: '#EAF0F7', background: '#F8FBFF' }}>
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#FF7A18' }} />
                    <h3 className="text-xs font-bold text-[#102B50]">
                      Sky Power ERP Knowledge &amp; Support
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Manufacturing workflow guides, commercial policies, and factory support
                  </p>
                </div>

                {/* Quick Topics */}
                <div className="p-3 space-y-2 max-h-80 overflow-y-auto">
                  <div
                    onClick={() => {
                      setActiveDropdown(null);
                      navigate('/workflow');
                    }}
                    className="p-2.5 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-[#F4F9FF] transition-all cursor-pointer"
                  >
                    <div className="flex items-center space-x-2">
                      <Layers className="w-4 h-4 text-[#0878C9]" />
                      <span className="text-xs font-bold text-[#102B50]">10-Department Workflow Rules</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                      Learn about the 10 sequential execution gates, manager approvals, and client data confidentiality.
                    </p>
                  </div>

                  <div
                    onClick={() => {
                      setActiveDropdown(null);
                      navigate('/product-master');
                    }}
                    className="p-2.5 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-[#F4F9FF] transition-all cursor-pointer"
                  >
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold text-[#102B50]">Product Master &amp; Standard Ratings</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                      Technical specifications for 11kV, 22kV, 33kV VCB switchboards and indoor/outdoor enclosures.
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-700">Factory IT Helpdesk</span>
                      <span className="text-[10px] font-bold text-[#0878C9]">Salem Unit</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Support desk extension: <strong className="text-slate-800">4022</strong> • Email: <code className="text-[10px] bg-slate-200 px-1 py-0.5 rounded">erp@skypowerswitchgears.com</code>
                    </p>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-2.5 border-t text-center bg-slate-50/60 flex items-center justify-between px-4 text-xs font-medium text-slate-500" style={{ borderColor: '#EAF0F7' }}>
                  <span>Press <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white border border-slate-200 rounded">Esc</kbd> to close</span>
                  <span className="text-[10px] font-bold text-slate-400">ERP v2.4</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Subtle Divider */}
        <div className="h-6 w-px mx-0.5 sm:mx-1 hidden sm:block" style={{ background: '#DCE7F3' }} />

        {/* Minimal User Profile Icon (Initials Only, e.g. RS) */}
        <button
          type="button"
          onClick={() => navigate('/profile')}
          className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-white cursor-pointer transition-all duration-200 hover:scale-105 shrink-0 focus:outline-hidden"
          style={{
            background: 'linear-gradient(135deg, #0878C9 0%, #062B59 100%)',
            boxShadow: '0 2px 8px rgba(8, 120, 201, 0.28)'
          }}
          title={`${userName} (${roleTitle}) • Click to view Profile`}
        >
          {initials}
        </button>

        {/* Minimal Sign Out Button */}
        <button
          type="button"
          onClick={handleLogout}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all duration-150 cursor-pointer"
          title="Sign Out"
        >
          <LogOut className="w-4.5 h-4.5" size={17} />
        </button>
      </div>

      {/* Notification Detail Modal */}
      {selectedNotification && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setSelectedNotification(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-lg w-full border shadow-2xl p-6 relative animate-in zoom-in-95 duration-150"
            style={{
              borderColor: '#DFEAF6',
              boxShadow: '0 20px 40px rgba(6, 43, 89, 0.2)'
            }}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-[#EAF5FF] text-[#0878C9] flex items-center justify-center shrink-0">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#102B50] leading-snug">
                    {selectedNotification.title}
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">
                    {selectedNotification.time}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedNotification(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="py-4 space-y-3.5 text-xs">
              {/* ERN & Client Strip */}
              {(selectedNotification.ern || selectedNotification.clientName) && (
                <div className="p-3 rounded-xl bg-[#F8FBFF] border border-[#DFEAF6] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Enquiry ERN
                    </span>
                    <span className="font-mono font-bold text-[#0878C9] text-sm">
                      {selectedNotification.ern || 'SP-2026-0008'}
                    </span>
                  </div>
                  {selectedNotification.clientName && (
                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Client Project
                      </span>
                      <span className="font-bold text-[#102B50]">
                        {selectedNotification.clientName}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Detail Paragraph */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Event Message
                </span>
                <p className="text-slate-700 text-xs leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {selectedNotification.detail || selectedNotification.description}
                </p>
              </div>

              {/* Status / Value metadata if available */}
              {selectedNotification.value && (
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-500 font-medium">Estimated Value:</span>
                  <span className="font-mono font-bold text-[#102B50]">
                    ₹ {Number(selectedNotification.value).toLocaleString('en-IN')}
                  </span>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-2.5">
              <button
                type="button"
                onClick={() => setSelectedNotification(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const targetLink = selectedNotification.link || '/workflow';
                  setSelectedNotification(null);
                  setActiveDropdown(null);
                  navigate(targetLink);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-md cursor-pointer inline-flex items-center space-x-1.5"
                style={{
                  background: 'linear-gradient(90deg, #FF8A20 0%, #FF6A0A 100%)'
                }}
              >
                <span>Open in Workflow</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
