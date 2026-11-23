import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import {
  FileSpreadsheet,
  Search,
  Filter,
  Download,
  Calendar,
  Building2,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Upload,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  ArrowUpDown,
  Layers,
  Sparkles
} from 'lucide-react';

export const CustomerPurchaseOrdersList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isPOTeam = user?.role === 'PO_TEAM';
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [verificationFilter, setVerificationFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest' | 'pendingFirst' | 'valueHigh'

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/orders');
      if (res.success) {
        setOrders(res.orders || []);
      }
    } catch (err) {
      console.error('Failed to load POs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Recency helper: calculates if order is from today, yesterday, or how many days ago
  const getRecencyLabel = (dateStr) => {
    if (!dateStr) return { label: '—', isNew: false };
    const d = new Date(dateStr);
    const diffMs = Date.now() - d.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 24) return { label: 'Today (New)', isNew: true };
    if (diffDays === 1) return { label: 'Yesterday', isNew: true };
    if (diffDays < 7) return { label: `${diffDays} days ago`, isNew: true };
    if (diffDays < 30) return { label: `${Math.floor(diffDays / 7)}w ago`, isNew: false };
    return { label: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), isNew: false };
  };

  // Status categorization helpers - single source of truth
  const isOrderVerified = (o) => Boolean(o.verification?.isVerified || o.status === 'Verified' || o.status === 'Order Confirmed');
  const isOrderOnHold = (o) => Boolean(o.status === 'On Hold' || o.currentHold?.isOnHold);
  // An order is pending verification if it has not been verified yet
  const isOrderPending = (o) => !isOrderVerified(o);

  // KPI Calculations
  const pendingCount = orders.filter(isOrderPending).length;
  const verifiedCount = orders.filter(isOrderVerified).length;
  const onHoldCount = orders.filter(isOrderOnHold).length;
  const totalCount = orders.length;

  const filtered = orders
    .filter((o) => {
      const po = o.customerPO || {};
      const q = (searchQuery || '').toLowerCase().trim();
      const cust = (o.customerName || o.clientName || o.clientId?.companyName || '').toLowerCase();
      const custCode = (o.customerCode || o.clientCode || o.clientId?.clientCode || '').toLowerCase();

      const matchesSearch =
        !q ||
        po.poNumber?.toLowerCase().includes(q) ||
        o.orderNumber?.toLowerCase().includes(q) ||
        cust.includes(q) ||
        custCode.includes(q) ||
        o.projectTitle?.toLowerCase().includes(q) ||
        o.quotationNumber?.toLowerCase().includes(q) ||
        o.ern?.toLowerCase().includes(q);

      if (verificationFilter === 'PENDING') return matchesSearch && isOrderPending(o);
      if (verificationFilter === 'VERIFIED') return matchesSearch && isOrderVerified(o);
      if (verificationFilter === 'ON_HOLD') return matchesSearch && isOrderOnHold(o);
      return matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') {
        const dateA = new Date(a.createdAt || a.orderDate || 0);
        const dateB = new Date(b.createdAt || b.orderDate || 0);
        return dateB - dateA;
      }
      if (sortBy === 'oldest') {
        const dateA = new Date(a.createdAt || a.orderDate || 0);
        const dateB = new Date(b.createdAt || b.orderDate || 0);
        return dateA - dateB;
      }
      if (sortBy === 'pendingFirst') {
        const pendingA = isOrderPending(a) ? 0 : 1;
        const pendingB = isOrderPending(b) ? 0 : 1;
        return pendingA - pendingB;
      }
      if (sortBy === 'valueHigh') {
        const valA = a.customerPO?.poValue || a.pricing?.totalOrderValue || 0;
        const valB = b.customerPO?.poValue || b.pricing?.totalOrderValue || 0;
        return valB - valA;
      }
      return 0;
    });

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-400">Order Management</span>
            <span className="text-xs text-slate-300">•</span>
            <span className="text-xs font-semibold text-blue-600">Customer Purchase Orders</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
            Customer Purchase Orders (PO) Register
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Registry of all client purchase orders, commercial terms, uploaded documents, and technical verification statuses.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 shrink-0">
          <button
            type="button"
            onClick={fetchOrders}
            className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition-colors shadow-2xs"
            title="Refresh POs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <Link
            to="/orders"
            className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-all hover:shadow-lg"
            style={{ background: 'linear-gradient(90deg, #062B59 0%, #0878C9 100%)' }}
          >
            View Sales Orders
          </Link>
        </div>
      </div>

      {/* Top Actionable KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Action Needed: Pending Verification */}
        <button
          type="button"
          onClick={() => setVerificationFilter(verificationFilter === 'PENDING' ? 'ALL' : 'PENDING')}
          className={`p-4 rounded-2xl text-left transition-all border cursor-pointer ${
            verificationFilter === 'PENDING'
              ? 'ring-2 ring-amber-500 shadow-md bg-white border-amber-500'
              : 'bg-white hover:bg-amber-50/40 border-slate-200/90 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-800">
              Pending Verification
            </span>
            <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-black">
              !
            </span>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-slate-900 font-mono">{pendingCount}</span>
            <span className="text-xs text-amber-700 font-bold">
              {pendingCount === 1 ? 'Action Needed' : 'Actions Needed'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Awaiting PO comparison checklist</p>
        </button>

        {/* Card 2: Verified & Cleared */}
        <button
          type="button"
          onClick={() => setVerificationFilter(verificationFilter === 'VERIFIED' ? 'ALL' : 'VERIFIED')}
          className={`p-4 rounded-2xl text-left transition-all border cursor-pointer ${
            verificationFilter === 'VERIFIED'
              ? 'ring-2 ring-emerald-600 shadow-md bg-white border-emerald-600'
              : 'bg-white hover:bg-emerald-50/30 border-slate-200/90 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800">
              Verified &amp; Cleared
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-slate-900 font-mono">{verifiedCount}</span>
            <span className="text-xs text-emerald-700 font-bold">Confirmed</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Approved for plant execution</p>
        </button>

        {/* Card 3: Orders On Hold */}
        <button
          type="button"
          onClick={() => setVerificationFilter(verificationFilter === 'ON_HOLD' ? 'ALL' : 'ON_HOLD')}
          className={`p-4 rounded-2xl text-left transition-all border cursor-pointer ${
            verificationFilter === 'ON_HOLD'
              ? 'ring-2 ring-purple-600 shadow-md bg-white border-purple-600'
              : 'bg-white hover:bg-purple-50/30 border-slate-200/90 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-purple-800">
              Orders On Hold
            </span>
            <Clock className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-slate-900 font-mono">{onHoldCount}</span>
            <span className="text-xs text-purple-700 font-bold">Site / Scope Hold</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Pending customer civil handover</p>
        </button>

        {/* Card 4: Total Customer POs */}
        <button
          type="button"
          onClick={() => setVerificationFilter('ALL')}
          className={`p-4 rounded-2xl text-left transition-all border cursor-pointer ${
            verificationFilter === 'ALL'
              ? 'ring-2 ring-slate-800 shadow-md bg-white border-slate-800'
              : 'bg-white hover:bg-slate-50 border-slate-200/90 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-700">
              Total Customer POs
            </span>
            <Layers className="w-4 h-4 text-slate-600" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-slate-900 font-mono">{totalCount}</span>
            <span className="text-xs text-slate-500 font-semibold">Registered POs</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Click to view all purchase orders</p>
        </button>
      </div>

      {/* Action Needed Alert Banner */}
      {pendingCount > 0 && (
        <div className="p-4 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 border border-amber-300 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#EE6F2D] text-white flex items-center justify-center shrink-0 shadow-md">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-black uppercase tracking-wider text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-md">
                  {pendingCount} {pendingCount === 1 ? 'Customer PO Awaiting Verification' : 'Customer POs Awaiting Verification'}
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs font-semibold text-slate-600">Immediate Action Required</span>
              </div>
              <p className="text-xs text-slate-700 font-medium mt-1">
                Customer purchase orders must be verified against submitted quotations (switchgear ratings, line items, delivery dates, and tax terms). Click <strong>Verify &amp; Confirm</strong> on any pending order below to complete comparison.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Sort Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Order No, PO No, Customer, Project..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50/70 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900 font-medium"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Filter */}
          <div className="flex items-center space-x-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={verificationFilter}
              onChange={(e) => setVerificationFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-medium focus:outline-hidden"
            >
              <option value="ALL">All Statuses ({totalCount})</option>
              <option value="PENDING">Pending Verification ({pendingCount})</option>
              <option value="VERIFIED">Verified &amp; Cleared ({verifiedCount})</option>
              <option value="ON_HOLD">On Hold ({onHoldCount})</option>
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center space-x-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-medium focus:outline-hidden"
            >
              <option value="newest">Sort: Newest Orders First</option>
              <option value="oldest">Sort: Oldest Orders First</option>
              <option value="pendingFirst">Sort: Action Needed First</option>
              <option value="valueHigh">Sort: Highest Order Value</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4 whitespace-nowrap min-w-[180px]">Order &amp; PO Reference</th>
                <th className="py-3 px-4 min-w-[210px]">Customer / Buyer</th>
                <th className="py-3 px-4 min-w-[190px]">Project Title</th>
                <th className="py-3 px-4 whitespace-nowrap min-w-[140px]">PO Date &amp; Recency</th>
                <th className="py-3 px-4 text-right whitespace-nowrap min-w-[130px]">{isPOTeam ? 'Technical Scope' : 'PO Value'}</th>
                <th className="py-3 px-4 text-center whitespace-nowrap min-w-[140px]">Verification Status</th>
                <th className="py-3 px-4 text-center whitespace-nowrap min-w-[160px]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-slate-400">
                    <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading purchase orders...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-slate-400">
                    <div className="max-w-md mx-auto space-y-2">
                      <p className="font-semibold text-slate-700">No customer purchase orders match your filter criteria.</p>
                      <p className="text-xs text-slate-400">Try clearing the search query or changing your status filter.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setVerificationFilter('ALL');
                        }}
                        className="mt-2 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                      >
                        Reset Filters &amp; Show All Orders
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((order) => {
                  const po = order.customerPO || {};
                  const isVerified = isOrderVerified(order);
                  const isOnHold = isOrderOnHold(order);
                  const isPending = isOrderPending(order);

                  // Customer Name mapping: checks order.customerName, order.clientName, and order.clientId.companyName
                  const customerName =
                    order.customerName || order.clientName || order.clientId?.companyName || 'Larsen & Toubro Ltd';
                  const customerCode =
                    order.customerCode || order.clientCode || order.clientId?.clientCode || order.clientId?.clientId || '';
                  const customerLocation = order.clientId?.clientLocation || '';

                  // Recency calculation
                  const recency = getRecencyLabel(order.createdAt || order.orderDate || po.poDate);

                  return (
                    <tr
                      key={order._id}
                      className={`transition-colors group cursor-pointer border-b border-slate-100 ${
                        isPending
                          ? 'bg-amber-50/25 hover:bg-amber-50/50'
                          : isOnHold
                          ? 'bg-purple-50/20 hover:bg-purple-50/40'
                          : 'hover:bg-slate-50/80'
                      }`}
                      onClick={() => navigate(`/orders/${order._id}${isPending ? '?tab=verification' : ''}`)}
                    >
                      {/* Col 1: Order & PO Identifiers */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-mono font-black text-blue-700 text-xs">
                            {order.orderNumber}
                          </span>
                          {recency.isNew && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 animate-pulse">
                              NEW
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-1.5 mt-0.5">
                          <span className="font-mono font-bold text-slate-800 text-[11px]">
                            {po.poNumber || 'PO Not Assigned'}
                          </span>
                          {po.poRevision > 0 && (
                            <span className="px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 text-[9px] font-bold">
                              Rev {po.poRevision}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono block">
                          Quote: {order.quotationNumber || '—'}
                        </span>
                      </td>

                      {/* Col 2: Customer / Buyer (Guaranteed Populated) */}
                      <td className="py-3.5 px-4">
                        {isPOTeam ? (
                          <>
                            <div className="font-mono font-bold text-slate-900 text-xs">
                              {customerCode || 'Protected Client ID'}
                            </div>
                            <div className="text-[10px] text-amber-700 font-semibold flex items-center gap-1 mt-0.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                              Data Shield Active
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="font-bold text-slate-900 text-xs line-clamp-1">
                              {customerName}
                            </div>
                            <div className="text-[11px] text-slate-500 font-medium">
                              {customerCode} {customerLocation && `• ${customerLocation}`}
                            </div>
                          </>
                        )}
                      </td>

                      {/* Col 3: Project Title */}
                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        <div className="line-clamp-1">{order.projectTitle}</div>
                        <span className="text-[10px] text-slate-400 block font-normal">
                          Switchgear Requisition
                        </span>
                      </td>

                      {/* Col 4: PO Date & Recency */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-medium text-slate-800 block text-xs">
                          {po.poDate ? new Date(po.poDate).toLocaleDateString('en-IN') : '—'}
                        </span>
                        <span
                          className={`inline-block text-[10px] font-bold px-1.5 py-0.2 rounded mt-0.5 ${
                            recency.isNew
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {recency.label}
                        </span>
                      </td>

                      {/* Col 5: PO Value */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                        {isPOTeam ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            Technical Scope
                          </span>
                        ) : (
                          <>
                            <span className="text-xs">
                              ₹{(po.poValue || order.pricing?.totalOrderValue || 0).toLocaleString('en-IN')}
                            </span>
                            <span className="text-[10px] text-slate-400 block font-normal">
                              Incl. 18% GST
                            </span>
                          </>
                        )}
                      </td>

                      {/* Col 6: Verification Status & Urgency */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {isPending ? (
                          <div className="flex flex-col items-center gap-1">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-50 text-amber-900 border border-amber-300 shadow-2xs">
                              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse mr-1.5" />
                              Action Needed
                            </span>
                            {isOnHold && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                                <Clock className="w-2.5 h-2.5 mr-1 text-purple-600" />
                                Site Hold
                              </span>
                            )}
                          </div>
                        ) : isOnHold ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
                            <Clock className="w-3 h-3 mr-1 text-purple-600" /> On Hold
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" /> Verified &amp; Cleared
                          </span>
                        )}
                      </td>

                      {/* Col 7: Action Button */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <Link
                          to={`/orders/${order._id}${isPending ? '?tab=verification' : ''}`}
                          className={`whitespace-nowrap inline-flex items-center justify-center px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                            isPending
                              ? 'text-white hover:shadow-md'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
                          }`}
                          style={
                            isPending
                              ? { background: 'linear-gradient(90deg, #062B59 0%, #0878C9 100%)' }
                              : undefined
                          }
                          title={isPending ? 'Open comparison checklist to verify PO' : 'View full Sales Order details'}
                        >
                          <ShieldCheck className={`w-3.5 h-3.5 mr-1.5 ${isPending ? 'text-blue-200' : 'text-slate-600'}`} />
                          <span>{isPending ? 'Verify & Confirm' : 'View Order →'}</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
