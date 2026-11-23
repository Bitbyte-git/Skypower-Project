import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import {
  ShoppingCart,
  Search,
  Filter,
  Download,
  Calendar,
  Building2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  PauseCircle,
  FileText,
  ChevronRight,
  ExternalLink,
  RefreshCw,
  Plus,
  ArrowUpDown,
  FileSpreadsheet,
  X
} from 'lucide-react';

export const SalesOrdersList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isPOTeam = user?.role === 'PO_TEAM';
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pipelineEnquiries, setPipelineEnquiries] = useState([]);
  const [convertingEnquiryId, setConvertingEnquiryId] = useState(null);
  const [conversionSuccess, setConversionSuccess] = useState('');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchOrdersAndEnquiries = async (queryText = searchQuery) => {
    try {
      setLoading(true);
      setError('');
      const trimmedQuery = (queryText || '').trim();
      const params = {
        limit: 100,
        sort: '-createdAt'
      };
      if (trimmedQuery) {
        params.search = trimmedQuery;
      }
      if (statusFilter !== 'ALL') {
        params.status = statusFilter;
      }

      const orderPromise = api.get('/orders', { params });
      const enquiryPromise = trimmedQuery
        ? api.get('/enquiries', { params: { search: trimmedQuery, view: 'all' } }).catch(() => null)
        : Promise.resolve(null);

      const [orderRes, enquiryRes] = await Promise.all([orderPromise, enquiryPromise]);

      if (orderRes && orderRes.success) {
        setOrders(orderRes.orders || []);
      } else {
        setError(orderRes?.message || 'Failed to load sales orders.');
      }

      if (enquiryRes && enquiryRes.success) {
        setPipelineEnquiries(enquiryRes.enquiries || []);
      } else {
        setPipelineEnquiries([]);
      }
    } catch (err) {
      setError(err.message || 'Error fetching orders.');
    } finally {
      setLoading(false);
    }
  };

  // Debounced live fetch when user types into the search bar or changes status
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrdersAndEnquiries(searchQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, statusFilter]);

  const handleConvertEnquiryToOrder = async (enquiry) => {
    try {
      setConvertingEnquiryId(enquiry._id);
      const company = enquiry.clientId?.companyName || enquiry.customerName || 'Customer';
      const payload = {
        enquiryId: enquiry._id,
        poNumber: `PO/CUST/${new Date().getFullYear()}/${enquiry.ern?.replace('ERN-', '') || '001'}`,
        poDate: new Date().toISOString().split('T')[0],
        poValue: enquiry.expectedProjectValue || 59000,
        expectedDeliveryDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        paymentTerms: '30% Advance, 70% Before Dispatch',
        deliveryTerms: 'Ex-Works Chennai',
        warrantyTerms: '18 Months from Dispatch / 12 Months from Commissioning',
        customerRemarks: `Direct conversion from pipeline enquiry ${enquiry.ern}`
      };

      const res = await api.post('/orders/from-enquiry', payload);
      if (res.success) {
        setConversionSuccess(`Sales Order ${res.order?.orderNumber || ''} created successfully for ${company}!`);
        await fetchOrdersAndEnquiries('');
        setSearchQuery('');
        setTimeout(() => setConversionSuccess(''), 7000);
      } else {
        alert(res.message || 'Failed to convert enquiry to order.');
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Error converting enquiry.');
    } finally {
      setConvertingEnquiryId(null);
    }
  };

  // Client-side instant filter & sort across all order parameters
  const filteredOrders = useMemo(() => {
    const q = (searchQuery || '').toLowerCase().trim();

    return orders.filter((o) => {
      // 1. Status Filter
      if (statusFilter !== 'ALL' && o.status !== statusFilter) {
        return false;
      }

      // 2. Search Query across all fields
      if (!q) return true;

      const matchOrderNo = o.orderNumber?.toLowerCase().includes(q);
      const matchPO = o.customerPO?.poNumber?.toLowerCase().includes(q);
      const matchCustomer = o.customerName?.toLowerCase().includes(q);
      const matchClient = o.clientName?.toLowerCase().includes(q);
      const matchCompany = o.clientId?.companyName?.toLowerCase().includes(q);
      const matchLocation = o.clientId?.clientLocation?.toLowerCase().includes(q);
      const matchCode = (o.customerCode || o.clientCode || o.clientId?.clientCode || o.clientId?.clientId)?.toLowerCase().includes(q);
      const matchProject = o.projectTitle?.toLowerCase().includes(q);
      const matchQuote = o.quotationNumber?.toLowerCase().includes(q);
      const matchERN = o.ern?.toLowerCase().includes(q);
      const matchEndUser = o.endUser?.toLowerCase().includes(q);
      const matchStatus = o.status?.toLowerCase().includes(q);
      const matchValue = String(o.pricing?.totalOrderValue || '').includes(q);
      const matchProduct = o.products?.some(
        (p) => p.productName?.toLowerCase().includes(q) || p.itemDescription?.toLowerCase().includes(q)
      );

      return (
        matchOrderNo ||
        matchPO ||
        matchCustomer ||
        matchClient ||
        matchCompany ||
        matchLocation ||
        matchCode ||
        matchProject ||
        matchQuote ||
        matchERN ||
        matchEndUser ||
        matchStatus ||
        matchValue ||
        matchProduct
      );
    }).sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (sortBy === 'orderValue') {
        valA = a.pricing?.totalOrderValue || 0;
        valB = b.pricing?.totalOrderValue || 0;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [orders, searchQuery, statusFilter, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1;
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(start, start + itemsPerPage);
  }, [filteredOrders, currentPage]);

  const handleExportCSV = () => {
    if (filteredOrders.length === 0) {
      alert('No orders to export.');
      return;
    }

    const headers = [
      'Order Number',
      'Customer PO Number',
      'Customer Name',
      'Project Title',
      'Quotation Number',
      'Order Date',
      'PO Date',
      'Order Value (INR)',
      'Expected Delivery',
      'Order Status',
      'Coordinator'
    ];

    const rows = filteredOrders.map((o) => [
      `"${o.orderNumber || ''}"`,
      `"${o.customerPO?.poNumber || ''}"`,
      `"${o.clientName || o.clientId?.companyName || ''}"`,
      `"${o.projectTitle || ''}"`,
      `"${o.quotationNumber || ''}"`,
      `"${o.orderDate ? new Date(o.orderDate).toLocaleDateString('en-IN') : ''}"`,
      `"${o.customerPO?.poDate ? new Date(o.customerPO.poDate).toLocaleDateString('en-IN') : ''}"`,
      `"${o.pricing?.totalOrderValue || 0}"`,
      `"${o.deliveryCommitment?.expectedDeliveryDate ? new Date(o.deliveryCommitment.expectedDeliveryDate).toLocaleDateString('en-IN') : ''}"`,
      `"${o.orderStatus || o.status || ''}"`,
      `"${o.orderCoordinatorName || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SkyPower_Sales_Orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-400">Order Management</span>
            <span className="text-xs text-slate-300">•</span>
            <span className="text-xs font-semibold text-blue-600">Sales Orders Register</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
            Sales Orders
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            View, track, verify, and confirm switchgear customer orders converted from accepted quotations.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 shrink-0">
          <button
            type="button"
            onClick={() => fetchOrdersAndEnquiries()}
            className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition-colors shadow-2xs"
            title="Refresh Orders"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-colors shadow-2xs"
          >
            <Download className="w-4 h-4 mr-1.5 text-slate-500" />
            Export CSV
          </button>

          <Link
            to="/quotations"
            className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-all hover:shadow-lg"
            style={{ background: 'linear-gradient(90deg, #062B59 0%, #0878C9 100%)' }}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Convert Quotation to Order
          </Link>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by Order No, PO No, Customer, Project, Quotation, ERN..."
            className="w-full pl-9 pr-8 py-2 bg-slate-50/70 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900 font-medium"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setCurrentPage(1);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center space-x-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-medium focus:outline-hidden"
            >
              <option value="ALL">All Statuses ({orders.length})</option>
              <option value="PO Received">PO Received</option>
              <option value="Under Verification">Under Verification</option>
              <option value="Clarification Required">Clarification Required</option>
              <option value="PO Revision Awaited">PO Revision Awaited</option>
              <option value="Verified">Verified</option>
              <option value="Order Confirmed">Order Confirmed</option>
              <option value="On Hold">On Hold</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-medium focus:outline-hidden"
            >
              <option value="createdAt">Date Created</option>
              <option value="orderValue">Order Value</option>
              <option value="orderNumber">Order Number</option>
            </select>
          </div>
        </div>
      </div>

      {conversionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-bold">{conversionSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setConversionSuccess('')}
            className="text-emerald-700 hover:text-emerald-900 font-bold ml-2 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => fetchOrdersAndEnquiries()} className="underline font-bold">Retry</button>
        </div>
      )}

      {/* Pipeline Enquiries Discovery Card when searching */}
      {searchQuery && pipelineEnquiries.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50/90 via-sky-50/70 to-indigo-50/80 border border-blue-200/90 rounded-2xl p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-blue-900 bg-blue-100/90 px-2 py-0.5 rounded-md">
                    Found in Enquiry Pipeline
                  </span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs font-semibold text-slate-600">
                    {pipelineEnquiries.length} {pipelineEnquiries.length === 1 ? 'requisition matches' : 'requisitions match'} "{searchQuery}"
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  This record is currently in your <strong>Enquiry Stage</strong> and has not yet been registered as a confirmed <strong>Customer Sales Order (SP-ORD)</strong>. You can convert it into a confirmed Sales Order immediately:
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {pipelineEnquiries.map((enq) => {
              const companyName = enq.clientId?.companyName || enq.customerName || 'Company';
              const project = enq.project?.projectName || 'Switchgear Project';
              const val = enq.expectedProjectValue || 0;
              const isConverting = convertingEnquiryId === enq._id;

              return (
                <div
                  key={enq._id}
                  className="bg-white/95 rounded-xl border border-blue-100 p-4 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-shadow"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-mono text-xs font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                        {enq.ern}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                        {enq.approvalStatus || 'Enquiry Stage'}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{companyName}</h4>
                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{project}</p>
                    <div className="mt-2 text-xs font-mono font-bold text-slate-800">
                      ₹{val.toLocaleString('en-IN')}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <Link
                      to={`/enquiries/${enq._id}`}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 inline-flex items-center"
                    >
                      View Enquiry Docket <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                    </Link>

                    <button
                      type="button"
                      disabled={isConverting}
                      onClick={() => handleConvertEnquiryToOrder(enq)}
                      className="inline-flex items-center px-3.5 py-1.5 rounded-lg text-xs font-bold text-white shadow-xs transition-all hover:shadow cursor-pointer disabled:opacity-50"
                      style={{ background: 'linear-gradient(90deg, #062B59 0%, #0878C9 100%)' }}
                    >
                      {isConverting ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5" />
                          Converting...
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5 mr-1" />
                          Convert to Sales Order
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Sales Order No</th>
                <th className="py-3 px-4">Customer PO No</th>
                <th className="py-3 px-4">Customer / Buyer</th>
                <th className="py-3 px-4">Project Title</th>
                <th className="py-3 px-4">Quotation Ref</th>
                <th className="py-3 px-4 text-right">{isPOTeam ? 'Technical Scope' : 'Order Value'}</th>
                <th className="py-3 px-4">Expected Delivery</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center">
                    <div className="w-7 h-7 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span className="text-slate-400">Loading orders...</span>
                  </td>
                </tr>
              ) : paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center px-4">
                    {pipelineEnquiries.length > 0 ? (
                      <div className="max-w-lg mx-auto bg-slate-50 border border-blue-200/80 rounded-2xl p-6 text-center shadow-xs">
                        <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto mb-3 shadow-md">
                          <FileText className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-slate-800 text-sm">
                          "{pipelineEnquiries[0]?.clientId?.companyName || searchQuery}" Found in Enquiry Pipeline
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                          Docket <strong className="font-mono text-blue-700">{pipelineEnquiries[0]?.ern}</strong> ({pipelineEnquiries[0]?.project?.projectName || 'Project'}) is in Enquiry / Requisition stage (Status: <span className="font-semibold text-amber-700">{pipelineEnquiries[0]?.approvalStatus}</span>).
                        </p>
                        <p className="text-xs text-slate-600 mt-2 font-medium">
                          A confirmed Customer Sales Order has not yet been registered for it. Would you like to register it as a Sales Order now?
                        </p>
                        <div className="mt-4 flex items-center justify-center gap-3">
                          <Link
                            to={`/enquiries/${pipelineEnquiries[0]?._id}`}
                            className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-colors shadow-2xs"
                          >
                            View Enquiry Docket
                          </Link>
                          <button
                            type="button"
                            disabled={convertingEnquiryId === pipelineEnquiries[0]?._id}
                            onClick={() => handleConvertEnquiryToOrder(pipelineEnquiries[0])}
                            className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
                            style={{ background: 'linear-gradient(90deg, #062B59 0%, #0878C9 100%)' }}
                          >
                            {convertingEnquiryId === pipelineEnquiries[0]?._id ? (
                              <>
                                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5" />
                                Registering Order...
                              </>
                            ) : (
                              <>
                                <Plus className="w-4 h-4 mr-1.5" />
                                Convert to Sales Order Now
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="font-bold text-slate-700">
                          No sales orders matching {searchQuery ? `"${searchQuery}"` : 'your filter criteria'}.
                        </p>
                        {searchQuery && (
                          <button
                            type="button"
                            onClick={() => {
                              setSearchQuery('');
                              setCurrentPage(1);
                            }}
                            className="mt-2 text-xs font-bold text-blue-600 underline cursor-pointer"
                          >
                            Clear Search & Show All Orders
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => (
                  <tr
                    key={order._id}
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    onClick={() => navigate(`/orders/${order._id}`)}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                      {order.orderNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-slate-800 block">
                        {order.customerPO?.poNumber || '—'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {order.customerPO?.poDate ? new Date(order.customerPO.poDate).toLocaleDateString('en-IN') : ''}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {isPOTeam ? (
                        <>
                          <div className="font-mono font-bold text-slate-900 text-xs">
                            {order.customerCode || order.clientCode || 'Protected Client ID'}
                          </div>
                          <div className="text-[10px] text-amber-700 font-semibold flex items-center gap-1 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            Data Shield Active
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="font-bold text-slate-900 truncate max-w-[170px]">
                            {order.customerName || order.clientName || order.clientId?.companyName || 'N/A'}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {order.customerCode || order.clientCode || order.clientId?.clientCode || order.clientId?.clientId || ''}
                          </div>
                        </>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700 max-w-[160px] truncate">
                      {order.projectTitle}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-slate-600 text-[11px]">
                        {order.quotationNumber || '—'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                      {isPOTeam ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                          Technical Spec
                        </span>
                      ) : (
                        `₹${(order.pricing?.totalOrderValue || 0).toLocaleString('en-IN')}`
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {order.deliveryCommitment?.expectedDeliveryDate
                        ? new Date(order.deliveryCommitment.expectedDeliveryDate).toLocaleDateString('en-IN')
                        : '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center space-x-1.5">
                        <Link
                          to={`/orders/${order._id}`}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-lg text-[11px] font-bold transition-colors"
                        >
                          View
                        </Link>
                        {!isPOTeam && order.confirmation?.orderAcknowledgementNumber && (
                          <a
                            href={`/api/orders/${order._id}/acknowledgement-pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors"
                            title="Download OA PDF"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 bg-slate-50/50">
          <span>
            Showing <strong>{filteredOrders.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</strong> to{' '}
            <strong>{Math.min(currentPage * itemsPerPage, filteredOrders.length)}</strong> of{' '}
            <strong>{filteredOrders.length}</strong> orders
          </span>

          <div className="flex items-center space-x-1">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 disabled:opacity-40 hover:bg-slate-50 font-semibold"
            >
              Previous
            </button>
            <span className="px-3 font-mono font-bold text-slate-800">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 disabled:opacity-40 hover:bg-slate-50 font-semibold"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
