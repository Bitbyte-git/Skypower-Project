import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import {
  Package,
  Search,
  Filter,
  Calendar,
  MapPin,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const CustomerOrdersList = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/portal/orders', {
        params: { status: statusFilter, search }
      });
      if (res.success) {
        setOrders(res.orders || []);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrders();
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="space-y-6 pb-20">
      {/* 1. Header & Filters */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center">
              <Package className="w-6 h-6 text-blue-600 mr-2" />
              My Switchgear Orders
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Track manufacturing lifecycle, engineering milestones, and delivery commitments.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-500">
              Showing: <strong className="text-slate-900">{orders.length} Order(s)</strong>
            </span>
          </div>
        </div>

        {/* Search & Filter Pills */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Order Number or Project Title..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { key: 'ALL', label: 'All Orders' },
              { key: 'IN_PROGRESS', label: 'In Production' },
              { key: 'COMPLETED', label: 'Completed' },
              { key: 'PENDING', label: 'Pending Verification' }
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === tab.key
                    ? 'bg-[#062B59] text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Orders Cards List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-medium">Fetching order records...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-16 text-center space-y-3">
            <Package className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No Orders Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No orders matched your current search criteria. If you recently confirmed a purchase order, please contact your sales executive.
            </p>
          </div>
        ) : (
          orders.map((order) => (
            <div
              key={order._id}
              className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 hover:shadow-md transition-all space-y-4"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-base font-black text-blue-700">{order.orderNumber}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                      {order.status}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      Ordered on {new Date(order.orderDate).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight">{order.projectTitle}</h3>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs">
                  <div className="text-right">
                    <span className="text-slate-400 text-[11px] block">Contract Value</span>
                    <span className="font-mono font-black text-slate-900 text-sm">
                      ₹ {Number(order.totalAmount || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 text-[11px] block">Cleared Payments</span>
                    <span className="font-mono font-bold text-emerald-600 text-sm">
                      ₹ {Number(order.paidAmount || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <Link
                    to={`/portal/orders/${order._id}`}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center space-x-1.5"
                  >
                    <span>View Order Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Equipment Scope & Delivery Ribbon */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl text-xs border border-slate-100">
                <div>
                  <span className="text-slate-400 text-[11px] block">Switchgear Scope:</span>
                  <p className="font-bold text-slate-800 truncate">
                    {order.products?.[0]?.productDescription || order.products?.[0]?.productName || 'VCB Panel Lineup'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Expected Dispatch / Delivery:</span>
                  <p className="font-bold text-slate-800 flex items-center">
                    <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    {order.expectedDeliveryDate
                      ? new Date(order.expectedDeliveryDate).toLocaleDateString('en-IN')
                      : 'Scheduled upon drawing clearance'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Delivery Location:</span>
                  <p className="font-medium text-slate-700 truncate flex items-center">
                    <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0" />
                    {order.siteAddress || 'Site Delivery, Works Tamil Nadu'}
                  </p>
                </div>
              </div>

              {/* Workflow Timeline Progress Bar */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">
                    Current Milestone: <span className="text-blue-700">{order.workflowStage}</span>
                  </span>
                  <span className="font-bold text-slate-600 font-mono">{order.completionPercentage}% Complete</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
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
  );
};
