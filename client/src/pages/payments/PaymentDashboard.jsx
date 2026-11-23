import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import {
  CreditCard,
  IndianRupee,
  Clock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Receipt,
  FileSpreadsheet,
  Building2,
  Calendar,
  ArrowRight,
  RefreshCw,
  Sparkles,
  ChevronRight,
  Filter,
  DollarSign
} from 'lucide-react';

export const PaymentDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState('');

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/payments/dashboard-stats');
      if (res.success) {
        setStats(res);
      } else {
        setError(res.message || 'Failed to load payment statistics.');
      }
    } catch (err) {
      setError(err.message || 'Error fetching payment dashboard.');
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
      const res = await api.post('/payments/seed-samples?force=true');
      if (res.success) {
        await fetchDashboardStats();
      }
    } catch (err) {
      alert('Seeding failed: ' + err.message);
    } finally {
      setSeeding(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Fully Paid':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Advance Received':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Partially Paid':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Overdue':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Advance Pending':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-500">Loading Payment Management Dashboard...</p>
        </div>
      </div>
    );
  }

  const kpis = stats?.kpis || {
    totalOrderValue: 0,
    totalPaymentsReceived: 0,
    totalAdvanceReceived: 0,
    outstandingAmount: 0,
    paymentsPending: 0,
    overduePayments: 0
  };

  const summary = stats?.summary || {
    receivedThisMonth: 0,
    receivedThisYear: 0,
    pendingAdvance: 0,
    outstandingAmount: 0
  };

  const recentPayments = stats?.recentPayments || [];
  const pendingOrders = stats?.pendingOrders || [];
  const upcomingExpectations = stats?.upcomingExpectations || [];
  const monthlyTrends = stats?.monthlyTrends || [];

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
              Module 03
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-semibold text-slate-500">Accounts & Financial Operations</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
            Advance Payment & Financial Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor customer payments, advance collections, milestone billing schedules, outstanding receivables, and payment receipts.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 shrink-0">
          <button
            type="button"
            onClick={fetchDashboardStats}
            className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 shadow-2xs transition-colors"
            title="Refresh Stats"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {kpis.totalPaymentsReceived === 0 && (
            <button
              type="button"
              disabled={seeding}
              onClick={handleSeedSamples}
              className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              {seeding ? 'Generating...' : 'Seed Sample Payments'}
            </button>
          )}

          <Link
            to="/payments/receipts"
            className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-all hover:shadow-lg"
            style={{ background: 'linear-gradient(90deg, #0A4076 0%, #0878C9 100%)' }}
          >
            <Receipt className="w-4 h-4 mr-1.5" />
            Payment Receipts Register
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchDashboardStats} className="underline font-bold">Retry</button>
        </div>
      )}

      {/* 6 Primary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Total Order Value */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Total Order Value</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl font-black text-slate-900 font-mono">
              ₹{(kpis.totalOrderValue || 0).toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-blue-600 font-bold block mt-0.5">Active Contracts</span>
          </div>
        </div>

        {/* Total Payments Received */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Total Received</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl font-black text-emerald-950 font-mono">
              ₹{(kpis.totalPaymentsReceived || 0).toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">Cleared Funds</span>
          </div>
        </div>

        {/* Total Advance Received */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Advance Received</span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl font-black text-sky-950 font-mono">
              ₹{(kpis.totalAdvanceReceived || 0).toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-sky-600 font-bold block mt-0.5">Stage 3 Cleared</span>
          </div>
        </div>

        {/* Outstanding Amount */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Outstanding Balance</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl font-black text-rose-950 font-mono">
              ₹{(kpis.outstandingAmount || 0).toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-rose-600 font-bold block mt-0.5">Receivable</span>
          </div>
        </div>

        {/* Payments Pending */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Orders Pending</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl font-black text-amber-950 font-mono">{kpis.paymentsPending}</span>
            <span className="text-[10px] text-amber-600 font-bold block mt-0.5">Awaiting Payment</span>
          </div>
        </div>

        {/* Overdue Payments */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Overdue Payments</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl font-black text-purple-950 font-mono">{kpis.overduePayments}</span>
            <span className="text-[10px] text-purple-600 font-bold block mt-0.5">Past Due Date</span>
          </div>
        </div>
      </div>

      {/* Main Row: Recent Payments Table & Financial Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Payment Receipts */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center space-x-2">
              <Receipt className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">Recent Customer Payment Transactions</h2>
            </div>
            <Link
              to="/payments/receipts"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center"
            >
              All Receipts <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <th className="py-2.5 px-3">Receipt No</th>
                  <th className="py-2.5 px-3">Customer / Buyer</th>
                  <th className="py-2.5 px-3">Sales Order</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Mode</th>
                  <th className="py-2.5 px-3 text-right">Amount Received</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {recentPayments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No payment transactions recorded yet. Record an advance payment to get started.
                    </td>
                  </tr>
                ) : (
                  recentPayments.map((p) => (
                    <tr
                      key={p._id}
                      onClick={() => navigate(`/payments/orders/${p.orderId}`)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-3 font-mono font-bold text-blue-700">
                        {p.receiptNumber}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-900 max-w-[170px] truncate">
                        {p.customerName}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-700">
                        {p.orderNumber}
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {new Date(p.paymentDate).toLocaleDateString('en-IN')}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px]">
                          {p.paymentMode}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                        ₹{(p.amount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Financial Snapshot & Collection Velocity */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5">
            <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center justify-between">
              <span>Financial Collection Snapshot</span>
              <span className="text-[11px] font-mono text-emerald-600 font-bold">{new Date().getFullYear()}</span>
            </h2>

            <div className="space-y-3.5 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-500 block font-medium">Received This Month</span>
                  <span className="text-base font-black font-mono text-slate-900">
                    ₹{(summary.receivedThisMonth || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  ₹
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-500 block font-medium">Received This Financial Year</span>
                  <span className="text-base font-black font-mono text-slate-900">
                    ₹{(summary.receivedThisYear || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  FY
                </div>
              </div>

              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-amber-800 block font-bold">Pending Customer Advance</span>
                  <span className="text-base font-black font-mono text-amber-950">
                    ₹{(summary.pendingAdvance || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-amber-700 px-2 py-0.5 bg-amber-100 rounded-full">
                  Stage 3 Gate
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-[#062B59] to-[#0A4076] text-white shadow-md space-y-3">
            <h3 className="text-sm font-bold flex items-center">
              <CreditCard className="w-4 h-4 text-amber-400 mr-2" />
              Quick Financial Workflows
            </h3>
            <p className="text-xs text-blue-100">
              Select an active customer sales order to record advance payments or configure custom milestone percentages.
            </p>
            <div className="pt-1 flex flex-col gap-2">
              <Link
                to="/payments/orders"
                className="w-full py-2 px-3 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold text-center transition-colors"
              >
                View Order Payment Accounts →
              </Link>
              <Link
                to="/payments/pending"
                className="w-full py-2 px-3 bg-amber-500 hover:bg-amber-600 rounded-xl text-xs font-bold text-slate-950 text-center transition-colors"
              >
                Track Overdue & Pending Receivables
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Pending Orders & Monthly Collection Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Orders Needing Payment */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center">
              <Clock className="w-4 h-4 text-amber-500 mr-2" />
              Orders with Pending Balances
            </h2>
            <Link to="/payments/pending" className="text-xs font-bold text-blue-600 hover:underline">
              View All ({pendingOrders.length})
            </Link>
          </div>

          <div className="space-y-3">
            {pendingOrders.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">All active customer orders are fully paid.</p>
            ) : (
              pendingOrders.map((ord) => (
                <div
                  key={ord._id}
                  onClick={() => navigate(`/payments/orders/${ord.orderId}`)}
                  className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-100/80 cursor-pointer transition-colors flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-blue-700">{ord.orderNumber}</span>
                      <span className={`px-2 py-0.2 rounded-full text-[9px] font-bold border ${getStatusBadge(ord.paymentStatus)}`}>
                        {ord.paymentStatus}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-slate-900 block mt-0.5">{ord.customerName}</span>
                    <span className="text-[10px] text-slate-500">{ord.termsDescription}</span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block uppercase">Pending Balance</span>
                    <span className="text-xs font-black font-mono text-rose-700">
                      ₹{(ord.pendingAmount || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Monthly Collection Trends Bar Chart */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center">
              <TrendingUp className="w-4 h-4 text-indigo-600 mr-2" />
              Monthly Payment Collection Inflows ({new Date().getFullYear()})
            </h2>
            <span className="text-xs font-mono text-slate-400">Total: ₹{(kpis.totalPaymentsReceived || 0).toLocaleString('en-IN')}</span>
          </div>

          <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5 flex-1 items-end min-h-[140px] pt-4 pb-2">
            {monthlyTrends.map((t) => {
              const maxVal = Math.max(...monthlyTrends.map((m) => m.amount), 1);
              const heightPercent = Math.max(Math.round((t.amount / maxVal) * 100), 8);
              return (
                <div key={t.month} className="flex flex-col items-center h-full justify-end group relative">
                  <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[9px] px-2 py-1 rounded shadow-lg whitespace-nowrap z-20 pointer-events-none">
                    {t.month}: ₹{(t.amount / 100000).toFixed(1)}L ({t.transactionCount} payments)
                  </div>

                  <div
                    className="w-full bg-gradient-to-t from-emerald-700 to-teal-500 rounded-t-sm transition-all duration-300 group-hover:from-orange-500 group-hover:to-amber-400"
                    style={{ height: `${heightPercent}%` }}
                  />
                  <span className="text-[10px] font-bold text-slate-400 mt-1.5 group-hover:text-slate-700">{t.month}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Annual Total: <strong className="text-slate-900 font-mono">₹{(kpis.totalPaymentsReceived || 0).toLocaleString('en-IN')}</strong></span>
            <Link to="/payments/reports" className="text-blue-600 hover:underline font-bold">
              Detailed Reports →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
