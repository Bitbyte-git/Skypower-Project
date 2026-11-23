import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/StatusBadge';
import {
  Compass,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  PauseCircle,
  Truck,
  Layers,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  Building2,
  Calendar,
  FileText,
  FileSpreadsheet,
  ArrowUpRight,
  Info,
  Check,
  ChevronRight,
  Filter
} from 'lucide-react';

export const OrderTrackingView = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isPOTeam = user?.role === 'PO_TEAM';
  const [orders, setOrders] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'enquiries'

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ordersRes, enquiriesRes] = await Promise.all([
        api.get('/orders').catch(() => ({ success: false, orders: [] })),
        api.get('/enquiries', { params: { limit: 100, view: 'all' } }).catch(() => ({ success: false, enquiries: [] }))
      ]);

      if (ordersRes.success) {
        setOrders(ordersRes.orders || []);
      }
      if (enquiriesRes.success) {
        setEnquiries(enquiriesRes.enquiries || []);
      }
    } catch (err) {
      console.error('Failed to fetch tracking data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const q = searchQuery.toLowerCase().trim();

  // Filter Sales Orders (checks orderNumber, PO, ERN, Quotation, Client, Project)
  const filteredOrders = orders.filter((o) => {
    if (!q) return true;
    return (
      o.orderNumber?.toLowerCase().includes(q) ||
      o.customerPO?.poNumber?.toLowerCase().includes(q) ||
      o.ern?.toLowerCase().includes(q) ||
      o.quotationNumber?.toLowerCase().includes(q) ||
      o.clientName?.toLowerCase().includes(q) ||
      o.projectTitle?.toLowerCase().includes(q) ||
      o.endUser?.toLowerCase().includes(q) ||
      o.customerCode?.toLowerCase().includes(q)
    );
  });

  // Filter Enquiry Requisitions (checks ERN, Project, Client, Status)
  const filteredEnquiries = enquiries.filter((e) => {
    if (!q) return true;
    return (
      e.ern?.toLowerCase().includes(q) ||
      e.project?.projectName?.toLowerCase().includes(q) ||
      e.project?.projectScope?.toLowerCase().includes(q) ||
      e.clientId?.companyName?.toLowerCase().includes(q) ||
      e.clientName?.toLowerCase().includes(q) ||
      e.approvalStatus?.toLowerCase().includes(q) ||
      e.commercialStatus?.toLowerCase().includes(q)
    );
  });

  const getStagePill = (order) => {
    if (order.status === 'Completed') {
      return { label: 'Dispatched & Delivered', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    }
    if (order.status === 'Order Confirmed') {
      return { label: 'Manufacturing & Engineering Active', color: 'bg-blue-50 text-blue-700 border-blue-200' };
    }
    if (order.status === 'On Hold') {
      return { label: 'Order Execution On Hold', color: 'bg-purple-50 text-purple-700 border-purple-200' };
    }
    if (order.status === 'Verified') {
      return { label: 'Technical Clearance Complete', color: 'bg-sky-50 text-sky-700 border-sky-200' };
    }
    return { label: 'PO Review & Verification', color: 'bg-amber-50 text-amber-700 border-amber-200' };
  };

  const getEnquiryStepInfo = (enq) => {
    const isApproved = enq.approvalStatus === 'Approved';
    const isReturned = enq.approvalStatus === 'Returned for Correction' || enq.approvalStatus === 'Returned for Sales & Marketing Review';
    const isPending = enq.approvalStatus === 'Pending Approval' || enq.approvalStatus === 'Submitted for Approval' || enq.approvalStatus === 'Submitted to Admin';

    if (isApproved) {
      return {
        stepNumber: 3,
        stepName: 'Stage 3: Approved / Ready for Commercial Offer',
        badge: 'bg-emerald-50 text-emerald-800 border-emerald-300',
        desc: 'Requisition cleared administrative approval. Commercial quotation can now be issued or PO converted.'
      };
    }
    if (isReturned) {
      return {
        stepNumber: 1,
        stepName: 'Returned for Specification Rework',
        badge: 'bg-orange-50 text-[#EE6F2D] border-orange-300',
        desc: 'Returned by engineering or admin. Requisition requires specification updates before resubmission.'
      };
    }
    if (isPending) {
      return {
        stepNumber: 2,
        stepName: 'Stage 2: Pending Admin Approval Gate',
        badge: 'bg-amber-50 text-amber-800 border-amber-300',
        desc: 'Awaiting executive admin clearance review before commercial quotation or purchase order confirmation.'
      };
    }
    return {
      stepNumber: 1,
      stepName: 'Stage 1: Requisition in Preparation (Draft)',
      badge: 'bg-slate-50 text-slate-700 border-slate-300',
      desc: 'Enquiry requisition currently being drafted by Sales & Commercial Engineering.'
    };
  };

  return (
    <div className="space-y-6 pb-20">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-400">Order Management</span>
            <span className="text-xs text-slate-300">•</span>
            <span className="text-xs font-semibold text-blue-600">Lifecycle Tracking</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
            Order Lifecycle & Execution Tracking
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor end-to-end switchgear progress from initial enquiry, admin clearance, customer PO verification to manufacturing and dispatch.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={fetchData}
            className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 shadow-2xs cursor-pointer"
            title="Refresh Tracking Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <Link
            to="/orders/dashboard"
            className="px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            Order Dashboard
          </Link>
        </div>
      </div>

      {/* 2. Search & Lifecycle Category Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Navigation Tabs between Confirmed Orders and Enquiry Pipeline */}
        <div className="flex items-center bg-white p-1 rounded-2xl border border-slate-200/90 shadow-2xs text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center space-x-2 ${
              activeTab === 'orders'
                ? 'bg-[#102B50] text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Customer Sales Orders</span>
            <span className={`px-2 py-0.2 rounded-full text-[11px] font-mono ${activeTab === 'orders' ? 'bg-blue-800 text-white' : 'bg-slate-100 text-slate-600'}`}>
              {orders.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('enquiries')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center space-x-2 ${
              activeTab === 'enquiries'
                ? 'bg-[#0878C9] text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Enquiries & Requisitions Pipeline</span>
            <span className={`px-2 py-0.2 rounded-full text-[11px] font-mono ${activeTab === 'enquiries' ? 'bg-blue-900 text-white' : 'bg-slate-100 text-slate-600'}`}>
              {enquiries.length}
            </span>
          </button>
        </div>

        {/* Global Search across Orders, POs, ERNs, Clients, and Projects */}
        <div className="bg-white p-2 rounded-2xl border border-slate-200/90 shadow-xs w-full md:max-w-md">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ERN (e.g. ERN-2026-0008), Order, PO, Project..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>
        </div>
      </div>

      {/* 3. Helpful Smart Bridge: If user searched ERN while on 'orders' tab and no sales order exists yet */}
      {searchQuery.trim() !== '' && activeTab === 'orders' && filteredOrders.length === 0 && filteredEnquiries.length > 0 && (
        <div className="bg-amber-50/80 border-2 border-amber-300 rounded-2xl p-5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-amber-200">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-amber-600" />
              <h3 className="text-sm font-black text-amber-900 uppercase tracking-wide">
                Requisition in Pipeline Found ({filteredEnquiries.length})
              </h3>
            </div>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 border border-amber-300">
              Not Yet Converted to Customer Order
            </span>
          </div>

          <p className="text-xs text-amber-800 leading-relaxed">
            You searched for <strong>"{searchQuery}"</strong>. This record is currently an <strong>Enquiry Requisition</strong> in the Sales & Approval pipeline. It will enter the Customer Order Execution tracking once administrative approval is granted and the customer purchase order is confirmed.
          </p>

          <div className="space-y-2 pt-1">
            {filteredEnquiries.map((enq) => {
              const step = getEnquiryStepInfo(enq);
              return (
                <div
                  key={enq._id}
                  className="bg-white rounded-xl p-4 border border-amber-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 flex-wrap">
                      <span className="font-mono text-sm font-black text-[#0878C9]">
                        {enq.ern}
                      </span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="font-bold text-slate-900 text-xs">
                        {enq.clientId?.companyName || enq.clientName || 'Client'}
                      </span>
                      <span className={`text-[11px] font-bold px-2 py-0.2 rounded-full border ${step.badge}`}>
                        {enq.approvalStatus || 'Draft'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600">
                      Project: <strong className="text-slate-800">{enq.project?.projectName || 'Switchboard Project'}</strong>
                      {enq.expectedProjectValue ? ` • Est. Value: ₹${Number(enq.expectedProjectValue).toLocaleString('en-IN')}` : ''}
                    </p>

                    <p className="text-[11px] text-amber-700 italic">
                      {step.desc}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <Link
                      to={`/projects/tracking/${enq.ern}`}
                      className="px-3.5 py-2 bg-[#0878C9] hover:bg-[#065b99] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-1"
                    >
                      <span>Track Project Timeline</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>

                    <Link
                      to={`/enquiries/${enq._id}`}
                      className="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                    >
                      View Docket
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. TAB 1: CONFIRMED CUSTOMER SALES ORDERS */}
      {activeTab === 'orders' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loading ? (
            <div className="col-span-2 py-16 text-center text-slate-400">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading order tracking data...
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="col-span-2 py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 space-y-3">
              <Compass className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="font-bold text-slate-700">No customer sales orders found matching "{searchQuery}".</p>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Customer Sales Orders are generated once an accepted commercial quotation is converted with a valid purchase order.
              </p>
              {filteredEnquiries.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab('enquiries')}
                  className="px-4 py-2 bg-[#EAF5FF] text-[#0878C9] border border-[#C5DFF5] hover:bg-[#D5EBFD] rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  View in Enquiries Pipeline ({filteredEnquiries.length} Found) →
                </button>
              )}
            </div>
          ) : (
            filteredOrders.map((order) => {
              const stage = getStagePill(order);
              const po = order.customerPO || {};

              return (
                <div
                  key={order._id}
                  onClick={() => navigate(`/orders/${order._id}`)}
                  className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow cursor-pointer space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-base font-black text-blue-700">
                          {order.orderNumber}
                        </span>
                        {order.ern && (
                          <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.2 rounded">
                            {order.ern}
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-bold text-slate-900 block mt-0.5">
                        {isPOTeam ? (order.customerCode || 'Protected Client ID') : order.clientName}
                      </span>
                      <span className="text-xs text-slate-500 block">
                        Project: {order.projectTitle}
                      </span>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${stage.color}`}>
                      {stage.label}
                    </span>
                  </div>

                  {/* Progress Indicators */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-[11px] font-bold text-slate-500">
                      <span>PO Received</span>
                      <span>Verified</span>
                      <span>Confirmed</span>
                      <span>Dispatched</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 h-2">
                      <div className="bg-emerald-500 rounded-full" />
                      <div className={`rounded-full ${order.verification?.isVerified || order.status === 'Order Confirmed' ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                      <div className={`rounded-full ${order.status === 'Order Confirmed' || order.status === 'Completed' ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                      <div className={`rounded-full ${order.status === 'Completed' ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>
                      PO: <strong className="font-mono text-slate-800">{po.poNumber || '—'}</strong>
                    </span>
                    <span>
                      Delivery:{' '}
                      <strong className="text-slate-800">
                        {order.deliveryCommitment?.expectedDeliveryDate
                          ? new Date(order.deliveryCommitment.expectedDeliveryDate).toLocaleDateString('en-IN')
                          : po.expectedDeliveryDate
                          ? new Date(po.expectedDeliveryDate).toLocaleDateString('en-IN')
                          : 'TBD'}
                      </strong>
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 5. TAB 2: ENQUIRIES & REQUISITION PIPELINE TRACKING */}
      {activeTab === 'enquiries' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loading ? (
            <div className="col-span-2 py-16 text-center text-slate-400">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading enquiries pipeline data...
            </div>
          ) : filteredEnquiries.length === 0 ? (
            <div className="col-span-2 py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 space-y-2">
              <Compass className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="font-bold text-slate-700">No enquiries found matching "{searchQuery}".</p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-xs text-blue-600 underline font-semibold cursor-pointer"
              >
                Clear Search Filter
              </button>
            </div>
          ) : (
            filteredEnquiries.map((enq) => {
              const step = getEnquiryStepInfo(enq);
              const isApproved = enq.approvalStatus === 'Approved';
              const isPending = enq.approvalStatus === 'Pending Approval' || enq.approvalStatus === 'Submitted for Approval' || enq.approvalStatus === 'Submitted to Admin';

              return (
                <div
                  key={enq._id}
                  className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-base font-black text-[#0878C9]">
                          {enq.ern}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          {new Date(enq.offerDate || enq.createdAt).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-slate-900 block mt-0.5">
                        {enq.clientId?.companyName || enq.clientName || 'Client Entity'}
                      </span>
                      <span className="text-xs text-slate-500 block">
                        Project: {enq.project?.projectName || 'Switchgear Engineering Project'}
                      </span>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${step.badge}`}>
                      {enq.approvalStatus || 'Draft'}
                    </span>
                  </div>

                  {/* 4-Stage Requisition Progress Indicators */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-[10px] font-bold text-slate-500">
                      <span>1. Requisition</span>
                      <span>2. Approval Gate</span>
                      <span>3. Quote / Offer</span>
                      <span>4. Customer PO</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 h-2">
                      <div className="bg-blue-600 rounded-full" />
                      <div className={`rounded-full ${isApproved ? 'bg-emerald-500' : isPending ? 'bg-amber-500 animate-pulse' : 'bg-slate-200'}`} />
                      <div className={`rounded-full ${isApproved ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                      <div className="bg-slate-200 rounded-full" />
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    {step.desc}
                  </p>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-slate-800">
                      ₹{Number(enq.expectedProjectValue || 0).toLocaleString('en-IN')}
                    </span>

                    <div className="flex items-center space-x-2">
                      <Link
                        to={`/projects/tracking/${enq.ern}`}
                        className="inline-flex items-center px-3 py-1.5 bg-[#0878C9] hover:bg-[#065b99] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                      >
                        <span>Track Timeline</span>
                        <ChevronRight className="w-3 h-3 ml-0.5" />
                      </Link>

                      <Link
                        to={`/enquiries/${enq._id}`}
                        className="inline-flex items-center px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                      >
                        <span>Docket</span>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
