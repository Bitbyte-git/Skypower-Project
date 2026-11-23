import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import {
  Receipt,
  Search,
  Filter,
  Download,
  Calendar,
  Building2,
  RefreshCw,
  FileSpreadsheet,
  Printer,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

export const PaymentReceiptsList = () => {
  const navigate = useNavigate();
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentModeFilter, setPaymentModeFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchQuery) params.search = searchQuery;
      if (paymentModeFilter && paymentModeFilter !== 'ALL') params.paymentMode = paymentModeFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await api.get('/payments/receipts', { params });
      if (res.success) {
        setReceipts(res.receipts || []);
      }
    } catch (err) {
      console.error('Failed to load receipts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, [paymentModeFilter, startDate, endDate]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchReceipts();
  };

  const handleExportCSV = () => {
    if (receipts.length === 0) {
      alert('No receipts to export.');
      return;
    }

    const headers = [
      'Receipt Number',
      'Payment Date',
      'Customer Name',
      'Sales Order No',
      'Customer PO No',
      'Payment Mode',
      'Transaction Ref / UTR',
      'Bank Name',
      'Amount Received (INR)',
      'Remaining Balance (INR)',
      'Status',
      'Received By'
    ];

    const rows = receipts.map((r) => [
      `"${r.receiptNumber || ''}"`,
      `"${r.paymentDate ? new Date(r.paymentDate).toLocaleDateString('en-IN') : ''}"`,
      `"${r.customerName || ''}"`,
      `"${r.orderNumber || ''}"`,
      `"${r.customerPONumber || ''}"`,
      `"${r.paymentMode || ''}"`,
      `"${r.transactionReference || r.utrNumber || ''}"`,
      `"${r.bankName || ''}"`,
      `"${r.amount || 0}"`,
      `"${r.remainingOutstandingAmount || 0}"`,
      `"${r.status || ''}"`,
      `"${r.receivedByName || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SkyPower_Payment_Receipts_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-400">Payment Management</span>
            <span className="text-xs text-slate-300">•</span>
            <span className="text-xs font-semibold text-blue-600">Financial Vouchers</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
            Payment Receipts Register
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit register of all customer payment receipts, transaction proofs, bank settlements, and issued PDF receipts.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 shrink-0">
          <button
            type="button"
            onClick={fetchReceipts}
            className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 shadow-2xs"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-colors shadow-2xs"
          >
            <Download className="w-4 h-4 mr-1.5 text-slate-500" /> Export CSV
          </button>

          <Link
            to="/payments/orders"
            className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-all hover:shadow-lg"
            style={{ background: 'linear-gradient(90deg, #0A4076 0%, #0878C9 100%)' }}
          >
            Record Payment on Order
          </Link>
        </div>
      </div>

      {/* Filter Toolbar */}
      <form onSubmit={handleSearchSubmit} className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Receipt No, Order, Customer, UTR..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-400 font-medium">Mode:</span>
            <select
              value={paymentModeFilter}
              onChange={(e) => setPaymentModeFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-semibold text-slate-700"
            >
              <option value="ALL">All Modes</option>
              <option value="RTGS">RTGS</option>
              <option value="NEFT">NEFT</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="IMPS">IMPS</option>
              <option value="UPI">UPI</option>
              <option value="Cheque">Cheque</option>
              <option value="Cash">Cash</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-slate-400 font-medium">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-slate-700"
            />
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-slate-400 font-medium">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-slate-700"
            />
          </div>

          <button
            type="submit"
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold"
          >
            Filter
          </button>
        </div>
      </form>

      {/* Receipts Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Receipt Number</th>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Sales Order No</th>
                <th className="py-3 px-4">Payment Date</th>
                <th className="py-3 px-4">Mode</th>
                <th className="py-3 px-4 text-right">Amount Received</th>
                <th className="py-3 px-4">Transaction Ref / UTR</th>
                <th className="py-3 px-4">Received By</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Receipt PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <div className="w-7 h-7 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading receipts...
                  </td>
                </tr>
              ) : receipts.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    No payment receipts found matching your criteria.
                  </td>
                </tr>
              ) : (
                receipts.map((r) => (
                  <tr
                    key={r._id}
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    onClick={() => navigate(`/payments/orders/${r.orderId}`)}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                      {r.receiptNumber}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 max-w-[170px] truncate">
                      {r.customerName}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-700">
                      {r.orderNumber}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {new Date(r.paymentDate).toLocaleDateString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px]">
                        {r.paymentMode}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700">
                      ₹{(r.amount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-700 truncate max-w-[140px]">
                      {r.transactionReference || r.utrNumber || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {r.receivedByName || 'Accounts'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          r.status === 'Cleared'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : r.status === 'Cancelled'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center space-x-1.5">
                        <a
                          href={`/api/payments/receipts/${r._id}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold"
                          title="Download Official Receipt PDF"
                        >
                          <Download className="w-3.5 h-3.5 mr-1" /> PDF
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
