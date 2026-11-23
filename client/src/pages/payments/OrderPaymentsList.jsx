import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import {
  CreditCard,
  Search,
  Filter,
  ArrowUpDown,
  Building2,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Receipt,
  FileSpreadsheet,
  ChevronRight,
  Plus
} from 'lucide-react';

export const OrderPaymentsList = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [termsMap, setTermsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchOrdersAndTerms = async () => {
    try {
      setLoading(true);
      const [ordersRes, pendingRes] = await Promise.all([
        api.get('/orders'),
        api.get('/payments/pending')
      ]);

      if (ordersRes.success) {
        setOrders(ordersRes.orders || []);
      }

      // Map pending details by orderId
      if (pendingRes.success && pendingRes.pendingPayments) {
        const map = {};
        pendingRes.pendingPayments.forEach((p) => {
          map[p.orderId] = p;
        });
        setTermsMap(map);
      }
    } catch (err) {
      console.error('Failed to load order payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrdersAndTerms();
  }, []);

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

  const filteredOrders = orders.filter((o) => {
    const term = termsMap[o._id] || {};
    const effectiveStatus = term.paymentStatus || 'Advance Pending';

    const matchSearch =
      searchQuery === '' ||
      o.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerPO?.poNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.projectTitle?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchStatus = statusFilter === 'ALL' || effectiveStatus === statusFilter;

    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-400">Payment Management</span>
            <span className="text-xs text-slate-300">•</span>
            <span className="text-xs font-semibold text-blue-600">Order-Based Payment Accounts</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
            Order Payments Register
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage advance collections, milestone billing schedules, payment terms, and outstanding balances per confirmed sales order.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 shrink-0">
          <button
            type="button"
            onClick={fetchOrdersAndTerms}
            className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 shadow-2xs transition-colors"
            title="Refresh Orders"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <Link
            to="/payments/dashboard"
            className="px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            Payment Dashboard
          </Link>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Order No, Customer, PO No, Project..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-medium focus:outline-hidden w-full sm:w-auto"
          >
            <option value="ALL">All Payment Statuses</option>
            <option value="Advance Pending">Advance Pending</option>
            <option value="Partially Paid">Partially Paid</option>
            <option value="Advance Received">Advance Received</option>
            <option value="Payment Pending">Payment Pending</option>
            <option value="Overdue">Overdue</option>
            <option value="Fully Paid">Fully Paid</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Sales Order No</th>
                <th className="py-3 px-4">Customer / Buyer</th>
                <th className="py-3 px-4">Customer PO</th>
                <th className="py-3 px-4 text-right">Order Value</th>
                <th className="py-3 px-4 text-right">Advance Req.</th>
                <th className="py-3 px-4 text-right">Total Received</th>
                <th className="py-3 px-4 text-right">Pending Balance</th>
                <th className="py-3 px-4">Payment Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="w-7 h-7 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading payment records...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No orders matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const term = termsMap[order._id] || {};
                  const totalVal = order.pricing?.totalOrderValue || 0;
                  const advReq = term.advanceAmountRequired || Math.round(totalVal * 0.3);
                  const totalRcvd = term.totalReceived || 0;
                  const pendingBal = term.pendingAmount !== undefined ? term.pendingAmount : Math.max(0, totalVal - totalRcvd);
                  const status = term.paymentStatus || (totalRcvd >= totalVal ? 'Fully Paid' : totalRcvd > 0 ? 'Partially Paid' : 'Advance Pending');

                  return (
                    <tr
                      key={order._id}
                      onClick={() => navigate(`/payments/orders/${order._id}`)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                        {order.orderNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 truncate max-w-[170px]">
                          {order.clientName || order.customerName}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[170px]">
                          {order.projectTitle}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-800">
                        {order.customerPO?.poNumber || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                        ₹{totalVal.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-700">
                        ₹{advReq.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700">
                        ₹{totalRcvd.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-700">
                        ₹{pendingBal.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(status)}`}>
                          {status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <Link
                          to={`/payments/orders/${order._id}`}
                          className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-colors inline-flex items-center"
                        >
                          Manage Payments <ChevronRight className="w-3.5 h-3.5 ml-1" />
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
