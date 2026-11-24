import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import {
  Package,
  Layers,
  FileCheck2,
  CreditCard,
  Clock,
  ArrowRight,
  Download,
  AlertCircle,
  Building2,
  Calendar,
  Phone,
  Mail,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  FileText
} from 'lucide-react';

export const CustomerDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/portal/dashboard');
      if (res.success) {
        setData(res);
      } else {
        setError(res.message || 'Failed to load customer dashboard.');
      }
    } catch (err) {
      setError(err.message || 'Error fetching customer dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-500 font-semibold">Loading your customer portal workspace...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex items-center space-x-3">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const client = data?.client || {};
  const recentOrders = data?.recentOrders || [];
  const recentDocuments = data?.recentDocuments || [];
  const recentPayments = data?.recentPayments || [];

  return (
    <div className="space-y-8 pb-16">
      {/* 1. Welcome & Project Header */}
      <div
        className="rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #062B59 0%, #0B4A8F 55%, #0878C9 100%)' }}
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/15 text-white backdrop-blur-xs border border-white/20">
                Client Code: {client.clientCode || 'SP-CL-ACTIVE'}
              </span>
              <span className="text-xs text-sky-200">
                {client.location || 'Works Delivery'}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              {client.companyName || 'Valued Customer'}
            </h1>
            <p className="text-xs md:text-sm text-slate-200 max-w-2xl">
              Welcome to your dedicated Sky Power project tracking console. Review order milestones, technical drawing approvals, production updates, and commercial statements.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/portal/orders"
              className="px-4 py-2.5 bg-white text-slate-900 rounded-xl text-xs font-extrabold shadow-md hover:bg-slate-100 transition-all flex items-center space-x-1.5"
            >
              <Package className="w-4 h-4 text-blue-700" />
              <span>Track All Orders</span>
            </Link>
            <Link
              to="/portal/documents"
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold border border-white/25 transition-all flex items-center space-x-1.5"
            >
              <FileCheck2 className="w-4 h-4 text-sky-300" />
              <span>Approved Drawings</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Grid (5 KPI Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Total Orders */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Orders</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono">{kpis.totalOrders || 0}</p>
          <span className="text-[11px] text-slate-500 font-medium">Lifetime Purchase Orders</span>
        </div>

        {/* In Production */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">In Production</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-700 font-mono">{kpis.inProductionOrders || 0}</p>
          <span className="text-[11px] text-slate-500 font-medium">Drawing / Assembly / Testing</span>
        </div>

        {/* Completed */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Completed</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-700 font-mono">{kpis.completedOrders || 0}</p>
          <span className="text-[11px] text-slate-500 font-medium">Dispatched &amp; Delivered</span>
        </div>

        {/* Approved Drawings */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wider">Approved Drawings</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-purple-700 font-mono">{kpis.approvedDrawings || 0}</p>
          <span className="text-[11px] text-slate-500 font-medium">Cleared for Manufacturing</span>
        </div>

        {/* Balance Payment */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pending Balance</span>
            <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono">
            ₹ {Number(kpis.pendingBalance || 0).toLocaleString('en-IN')}
          </p>
          <span className="text-[11px] text-emerald-600 font-bold">
            ₹ {Number(kpis.totalPaid || 0).toLocaleString('en-IN')} Received
          </span>
        </div>
      </div>

      {/* 3. Main Dashboard 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Active Orders Progress */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center">
                  <Package className="w-5 h-5 text-blue-600 mr-2" />
                  Active Switchgear Orders
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Real-time status and delivery schedules.</p>
              </div>
              <Link
                to="/portal/orders"
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center"
              >
                View All ({kpis.totalOrders}) <ChevronRight className="w-4 h-4 ml-0.5" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {recentOrders.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-xs">
                  No active orders recorded for your account.
                </div>
              ) : (
                recentOrders.map((order) => (
                  <div
                    key={order._id}
                    onClick={() => navigate(`/portal/orders/${order._id}`)}
                    className="p-6 hover:bg-slate-50/80 cursor-pointer transition-colors space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-sm font-bold text-blue-700">{order.orderNumber}</span>
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                            {order.status}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 mt-1">{order.projectTitle}</h4>
                        <p className="text-xs text-slate-500 font-medium">
                          {order.productName} • Qty: {order.quantity}
                        </p>
                      </div>

                      <div className="text-right text-xs">
                        <span className="text-slate-400 block text-[11px]">Expected Delivery</span>
                        <span className="font-bold text-slate-800 flex items-center justify-end">
                          <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                          {order.expectedDeliveryDate
                            ? new Date(order.expectedDeliveryDate).toLocaleDateString('en-IN')
                            : 'Confirmed upon drawing approval'}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700">Stage: {order.workflowStage}</span>
                        <span className="font-bold text-blue-700 font-mono">{order.completionPercentage}%</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-600 h-full rounded-full transition-all"
                          style={{ width: `${order.completionPercentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Technical Documents Card */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center">
                <FileCheck2 className="w-5 h-5 text-purple-600 mr-2" />
                Latest Approved Technical Drawings
              </h3>
              <Link to="/portal/documents" className="text-xs font-bold text-blue-600 hover:underline">
                All Documents →
              </Link>
            </div>

            <div className="space-y-3">
              {recentDocuments.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">
                  Drawings currently under preparation by design engineers. Approved copies will appear here.
                </p>
              ) : (
                recentDocuments.map((doc) => (
                  <div
                    key={doc._id}
                    className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-blue-700">{doc.drawingNumber}</span>
                        <span className="font-mono text-[10px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-700">
                          {doc.currentRevision}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                          {doc.status}
                        </span>
                      </div>
                      <p className="font-bold text-slate-800 mt-1">{doc.drawingTitle}</p>
                    </div>

                    {doc.fileUrl ? (
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-white hover:bg-blue-50 text-blue-700 border border-slate-200 rounded-xl font-bold flex items-center space-x-1"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </a>
                    ) : (
                      <span className="text-slate-400 text-[11px] italic">Drafting</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Payments & Project Manager Support */}
        <div className="space-y-6">
          {/* Payment Summary */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 space-y-4">
            <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center">
              <CreditCard className="w-5 h-5 text-emerald-600 mr-2" />
              Financial &amp; Invoicing
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
                <span className="text-slate-500 font-medium">Total Contract Value:</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  ₹ {Number(kpis.totalOrderValue || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl flex items-center justify-between text-emerald-900">
                <span className="font-medium">Total Received &amp; Cleared:</span>
                <span className="font-mono font-bold text-sm">
                  ₹ {Number(kpis.totalPaid || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
                <span className="text-slate-500 font-medium">Pending Balance Due:</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  ₹ {Number(kpis.pendingBalance || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <Link
              to="/portal/payments"
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors flex items-center justify-center space-x-1"
            >
              <span>View Verified Receipts ({recentPayments.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Project Support & Works Contact */}
          <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-lg space-y-4 text-xs">
            <div className="flex items-center space-x-2 text-sky-400 font-bold">
              <ShieldCheck className="w-5 h-5" />
              <span className="text-sm">Assigned Project Support</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Have technical questions regarding your switchgear panel specifications or need to request a factory inspection schedule?
            </p>

            <div className="space-y-2.5 pt-2 border-t border-slate-800">
              <div className="flex items-center space-x-2 text-slate-300">
                <Phone className="w-4 h-4 text-sky-400" />
                <span>Executive Desk: +91 98401 98401</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-300">
                <Mail className="w-4 h-4 text-sky-400" />
                <span>support@skypower.co.in</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-300">
                <Building2 className="w-4 h-4 text-sky-400" />
                <span>SIDCO Industrial Estate, Salem, TN</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
