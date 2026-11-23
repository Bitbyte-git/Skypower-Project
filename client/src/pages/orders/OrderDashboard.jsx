import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import {
  ShoppingCart,
  Clock,
  CheckCircle2,
  AlertTriangle,
  PauseCircle,
  TrendingUp,
  FileText,
  Building2,
  Calendar,
  IndianRupee,
  ArrowRight,
  ShieldCheck,
  FileSpreadsheet,
  RefreshCw,
  Sparkles,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export const OrderDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isPOTeam = user?.role === 'PO_TEAM';
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState('');

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/orders/dashboard-stats');
      if (res.success) {
        setStats(res);
      } else {
        setError(res.message || 'Failed to load order statistics.');
      }
    } catch (err) {
      setError(err.message || 'Error fetching order dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const handleSeedSamples = async () => {
    try {
      setSeeding(true);
      const res = await api.post('/orders/seed-samples');
      if (res.success) {
        await fetchDashboardStats();
      }
    } catch (err) {
      alert('Could not seed orders: ' + err.message);
    } finally {
      setSeeding(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Order Confirmed':
      case 'Completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Verified':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Under Verification':
      case 'PO Received':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'On Hold':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Clarification Required':
      case 'PO Revision Awaited':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-500">Loading Order Management Dashboard...</p>
        </div>
      </div>
    );
  }

  const kpis = stats?.kpis || {
    totalOrders: 0,
    ordersReceived: 0,
    ordersPendingVerification: 0,
    confirmedOrders: 0,
    ordersOnHold: 0,
    ordersThisMonth: 0,
    totalOrderValue: 0
  };

  const statusCounts = stats?.statusCounts || {};
  const recentOrders = stats?.recentOrders || [];
  const pendingActions = stats?.pendingActions || {
    awaitingVerification: [],
    awaitingConfirmation: [],
    onHold: [],
    upcomingDeliveries: []
  };
  const monthlyTrends = stats?.monthlyTrends || [];

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
              Module 02
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-semibold text-slate-500">Commercial & Engineering Order Processing</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
            Customer Order Management Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time monitoring of customer purchase orders, technical verification, order confirmations, and delivery commitments.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 shrink-0">
          <button
            type="button"
            onClick={fetchDashboardStats}
            className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition-colors shadow-2xs"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {kpis.totalOrders === 0 && (
            <button
              type="button"
              disabled={seeding}
              onClick={handleSeedSamples}
              className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              {seeding ? 'Generating...' : 'Seed Sample Orders'}
            </button>
          )}

          <Link
            to="/orders"
            className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-all hover:shadow-lg"
            style={{ background: 'linear-gradient(90deg, #062B59 0%, #0878C9 100%)' }}
          >
            <ShoppingCart className="w-4 h-4 mr-1.5" />
            View All Sales Orders
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            <span>{error}</span>
          </div>
          <button onClick={fetchDashboardStats} className="underline font-bold">Retry</button>
        </div>
      )}

      {/* 6 Primary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Total Orders */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Total Orders</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 font-mono">{kpis.totalOrders}</span>
            <span className="text-[10px] text-blue-600 font-bold">All Time</span>
          </div>
        </div>

        {/* Orders Received */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">PO Received</span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-sky-950 font-mono">{kpis.ordersReceived}</span>
            <span className="text-[10px] text-sky-600 font-bold">New POs</span>
          </div>
        </div>

        {/* Orders Pending Verification */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Verification</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-950 font-mono">{kpis.ordersPendingVerification}</span>
            <span className="text-[10px] text-amber-600 font-bold">In Review</span>
          </div>
        </div>

        {/* Confirmed Orders */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Confirmed</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-950 font-mono">{kpis.confirmedOrders}</span>
            <span className="text-[10px] text-emerald-600 font-bold">OA Issued</span>
          </div>
        </div>

        {/* Orders On Hold */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">On Hold</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <PauseCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-purple-950 font-mono">{kpis.ordersOnHold}</span>
            <span className="text-[10px] text-purple-600 font-bold">Action Req.</span>
          </div>
        </div>

        {/* Orders This Month */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">This Month</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-indigo-950 font-mono">{kpis.ordersThisMonth}</span>
            <span className="text-[10px] text-indigo-600 font-bold">Current Mth</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Orders & Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Orders Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center space-x-2">
              <FileSpreadsheet className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">Recent Customer Sales Orders</h2>
            </div>
            <Link
              to="/orders"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center"
            >
              View Full Table <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <th className="py-2.5 px-3">Order No</th>
                  <th className="py-2.5 px-3">{isPOTeam ? 'Client ID / Scope' : 'Customer / Project'}</th>
                  <th className="py-2.5 px-3">Customer PO</th>
                  <th className="py-2.5 px-3 text-right">{isPOTeam ? 'Scope' : 'Order Value'}</th>
                  <th className="py-2.5 px-3">Delivery Date</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No customer orders found. Convert an accepted quotation to get started.
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((order) => (
                    <tr
                      key={order._id}
                      onClick={() => navigate(`/orders/${order._id}`)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-3 font-mono font-bold text-blue-700">
                        {order.orderNumber}
                      </td>
                      <td className="py-3 px-3">
                        {isPOTeam ? (
                          <>
                            <div className="font-mono font-bold text-slate-900 text-xs">
                              {order.customerCode || order.clientCode || 'Protected Client ID'}
                            </div>
                            <div className="text-[10px] text-amber-700 font-semibold">
                              Data Shield Active
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="font-bold text-slate-900 truncate max-w-[180px]">
                              {order.clientName || order.clientId?.companyName || 'N/A'}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
                              {order.projectTitle}
                            </div>
                          </>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-mono text-slate-800 font-semibold block">
                          {order.customerPO?.poNumber || '—'}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          {order.customerPO?.poDate ? new Date(order.customerPO.poDate).toLocaleDateString('en-IN') : ''}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        {isPOTeam ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            Technical Scope
                          </span>
                        ) : (
                          `₹${(order.pricing?.totalOrderValue || 0).toLocaleString('en-IN')}`
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {order.deliveryCommitment?.expectedDeliveryDate
                          ? new Date(order.deliveryCommitment.expectedDeliveryDate).toLocaleDateString('en-IN')
                          : '—'}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center text-[11px]">
                          Details <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Order Status Overview & Breakdown */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5">
            <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center justify-between">
              <span>Order Status Breakdown</span>
              <span className="text-xs font-mono text-slate-400">{kpis.totalOrders} Total</span>
            </h2>

            <div className="space-y-3">
              {Object.entries(statusCounts).map(([status, count]) => {
                const percentage = kpis.totalOrders > 0 ? Math.round((count / kpis.totalOrders) * 100) : 0;
                return (
                  <div key={status} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700">{status}</span>
                      <span className="font-mono font-bold text-slate-900">{count} ({percentage}%)</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          status.includes('Confirmed') || status.includes('Completed')
                            ? 'bg-emerald-500'
                            : status.includes('Hold')
                            ? 'bg-purple-500'
                            : status.includes('Verification')
                            ? 'bg-amber-500'
                            : status.includes('Cancelled')
                            ? 'bg-rose-500'
                            : 'bg-blue-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cumulative Financial Summary */}
          <div className="p-5 rounded-2xl text-white shadow-md relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #062B59 0%, #031D40 100%)' }}>
            <div className="relative z-10">
              <span className="text-[11px] font-bold text-blue-300 uppercase tracking-wider block">Cumulative Active Order Value</span>
              <div className="mt-1 flex items-baseline space-x-1">
                <span className="text-2xl font-black font-mono tracking-tight">
                  ₹{(kpis.totalOrderValue || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <p className="text-[11px] text-blue-200/80 mt-1">
                Across all active switchgear and automation projects under execution.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Actions & Monthly Trends Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Actions Cards */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center">
              <ShieldCheck className="w-4 h-4 text-amber-500 mr-2" />
              Pending Order Department Actions
            </h2>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              Requires Attention
            </span>
          </div>

          <div className="space-y-3">
            {/* Awaiting PO Verification */}
            <div className="p-3 rounded-xl border border-amber-100 bg-amber-50/40 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-amber-950 block">Customer POs Pending Verification</span>
                <span className="text-[11px] text-amber-700">Check technical parameters against submitted quotation</span>
              </div>
              <span className="font-mono font-black text-amber-800 text-sm px-2.5 py-1 bg-amber-100 rounded-lg">
                {pendingActions.awaitingVerification?.length || 0}
              </span>
            </div>

            {/* Awaiting Confirmation */}
            <div className="p-3 rounded-xl border border-blue-100 bg-blue-50/40 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-blue-950 block">Verified Orders Awaiting Final Confirmation</span>
                <span className="text-[11px] text-blue-700">Ready to issue Order Acknowledgement (OA)</span>
              </div>
              <span className="font-mono font-black text-blue-800 text-sm px-2.5 py-1 bg-blue-100 rounded-lg">
                {pendingActions.awaitingConfirmation?.length || 0}
              </span>
            </div>

            {/* On Hold */}
            <div className="p-3 rounded-xl border border-purple-100 bg-purple-50/40 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-purple-950 block">Orders Currently On Hold</span>
                <span className="text-[11px] text-purple-700">Blocked for technical or commercial clarification</span>
              </div>
              <span className="font-mono font-black text-purple-800 text-sm px-2.5 py-1 bg-purple-100 rounded-lg">
                {pendingActions.onHold?.length || 0}
              </span>
            </div>

            {/* Upcoming Deliveries */}
            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Upcoming Delivery Commitments (30 Days)</span>
                <span className="text-[11px] text-slate-500">Fabrication and testing deadlines</span>
              </div>
              <span className="font-mono font-black text-slate-800 text-sm px-2.5 py-1 bg-slate-200 rounded-lg">
                {pendingActions.upcomingDeliveries?.length || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Monthly Order Trends Table & Bar Metrics */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center">
              <TrendingUp className="w-4 h-4 text-indigo-600 mr-2" />
              Order Intake Trends ({new Date().getFullYear()})
            </h2>
            <span className="text-xs font-mono text-slate-400">Monthly Performance</span>
          </div>

          <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5 flex-1 items-end min-h-[140px] pt-4 pb-2">
            {monthlyTrends.map((t) => {
              const maxVal = Math.max(...monthlyTrends.map((m) => m.totalValue), 1);
              const heightPercent = Math.max(Math.round((t.totalValue / maxVal) * 100), 8);
              return (
                <div key={t.month} className="flex flex-col items-center h-full justify-end group relative">
                  {/* Tooltip on hover */}
                  <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[9px] px-2 py-1 rounded shadow-lg whitespace-nowrap z-20 pointer-events-none">
                    {t.month}: {t.orderCount} orders (₹{(t.totalValue / 100000).toFixed(1)}L)
                  </div>

                  <div
                    className="w-full bg-gradient-to-t from-blue-700 to-sky-500 rounded-t-sm transition-all duration-300 group-hover:from-orange-500 group-hover:to-amber-400"
                    style={{ height: `${heightPercent}%` }}
                  />
                  <span className="text-[10px] font-bold text-slate-400 mt-1.5 group-hover:text-slate-700">{t.month}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Orders This Year: <strong className="text-slate-900 font-mono">{kpis.totalOrders}</strong></span>
            <span>Annual Value: <strong className="text-slate-900 font-mono">₹{(kpis.totalOrderValue || 0).toLocaleString('en-IN')}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
