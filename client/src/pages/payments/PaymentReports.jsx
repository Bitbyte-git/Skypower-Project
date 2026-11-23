import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Building2,
  RefreshCw,
  PieChart,
  TrendingUp,
  CreditCard,
  Receipt
} from 'lucide-react';

export const PaymentReports = () => {
  const [reportsData, setReportsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('byCustomer'); // byCustomer, byOrder, byMode, summary
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await api.get('/payments/reports', { params });
      if (res.success) {
        setReportsData(res);
      }
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [startDate, endDate]);

  const handleExportCSV = () => {
    if (!reportsData) return;

    let headers = [];
    let rows = [];
    let reportTitle = '';

    if (activeTab === 'byCustomer') {
      reportTitle = 'Payments_By_Customer';
      headers = ['Customer Name', 'Total Collected (INR)', 'Transactions Count'];
      rows = (reportsData.byCustomer || []).map((c) => [
        `"${c.customer}"`,
        `"${c.totalReceived}"`,
        `"${c.transactionCount}"`
      ]);
    } else if (activeTab === 'byOrder') {
      reportTitle = 'Payments_By_Sales_Order';
      headers = ['Sales Order No', 'Customer Name', 'Total Collected (INR)', 'Transactions'];
      rows = (reportsData.byOrder || []).map((o) => [
        `"${o.orderNumber}"`,
        `"${o.customer}"`,
        `"${o.amountReceived}"`,
        `"${o.transactions}"`
      ]);
    } else if (activeTab === 'byMode') {
      reportTitle = 'Payments_By_Payment_Mode';
      headers = ['Payment Mode', 'Total Inflow (INR)', 'Count'];
      rows = (reportsData.byPaymentMode || []).map((m) => [
        `"${m.mode}"`,
        `"${m.amount}"`,
        `"${m.count}"`
      ]);
    } else {
      reportTitle = 'Receivables_Account_Summary';
      headers = ['Financial Parameter', 'Amount (INR)'];
      const s = reportsData.termsSummary || {};
      rows = [
        ['"Total Active Contract Receivable"', `"${s.totalReceivable || 0}"`],
        ['"Total Collected Till Date"', `"${s.totalCollected || 0}"`],
        ['"Total Net Outstanding Receivable"', `"${s.totalOutstanding || 0}"`]
      ];
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SkyPower_${reportTitle}_${new Date().toISOString().slice(0, 10)}.csv`);
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
            <span className="text-xs font-semibold text-emerald-600">Financial Intelligence</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
            Payment & Collections Reports
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit-grade reporting across customer collections, payment modes, outstanding balances, and contract realization.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 shrink-0">
          <button
            type="button"
            onClick={fetchReports}
            className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 shadow-2xs"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-md transition-all"
          >
            <Download className="w-4 h-4 mr-1.5" /> Export Report (CSV)
          </button>
        </div>
      </div>

      {/* Date Filter & Tab Switcher */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('byCustomer')}
            className={`px-3.5 py-2 rounded-xl font-bold transition-colors ${
              activeTab === 'byCustomer' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            By Customer
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('byOrder')}
            className={`px-3.5 py-2 rounded-xl font-bold transition-colors ${
              activeTab === 'byOrder' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            By Sales Order
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('byMode')}
            className={`px-3.5 py-2 rounded-xl font-bold transition-colors ${
              activeTab === 'byMode' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            By Payment Mode
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('summary')}
            className={`px-3.5 py-2 rounded-xl font-bold transition-colors ${
              activeTab === 'summary' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Receivables Balance Sheet
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-slate-400 font-medium">Filter Period:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700"
          />
          <span className="text-slate-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700"
          />
        </div>
      </div>

      {/* Reports Display Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Compiling financial report...
          </div>
        ) : !reportsData ? (
          <div className="py-16 text-center text-slate-400">No report data found.</div>
        ) : (
          <div className="p-5">
            {/* TAB: BY CUSTOMER */}
            {activeTab === 'byCustomer' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Collections Realized by Customer / Legal Entity
                  </h3>
                  <span className="text-xs font-mono font-bold text-emerald-700">
                    Total: ₹{(reportsData.totalReceived || 0).toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                        <th className="py-2.5 px-4">#</th>
                        <th className="py-2.5 px-4">Customer / Buyer</th>
                        <th className="py-2.5 px-4 text-center">Receipts Count</th>
                        <th className="py-2.5 px-4 text-right">Total Remittance (INR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(reportsData.byCustomer || []).map((c, i) => (
                        <tr key={i} className="hover:bg-slate-50/60">
                          <td className="py-3 px-4 font-mono text-slate-400">{i + 1}</td>
                          <td className="py-3 px-4 font-bold text-slate-900">{c.customer}</td>
                          <td className="py-3 px-4 text-center font-mono">{c.transactionCount}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                            ₹{(c.totalReceived || 0).toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB: BY ORDER */}
            {activeTab === 'byOrder' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Collections Realized by Sales Order
                  </h3>
                  <span className="text-xs font-mono font-bold text-emerald-700">
                    Total: ₹{(reportsData.totalReceived || 0).toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                        <th className="py-2.5 px-4">#</th>
                        <th className="py-2.5 px-4">Sales Order No</th>
                        <th className="py-2.5 px-4">Customer Name</th>
                        <th className="py-2.5 px-4 text-center">Receipts</th>
                        <th className="py-2.5 px-4 text-right">Amount Received (INR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(reportsData.byOrder || []).map((o, i) => (
                        <tr key={i} className="hover:bg-slate-50/60">
                          <td className="py-3 px-4 font-mono text-slate-400">{i + 1}</td>
                          <td className="py-3 px-4 font-mono font-bold text-blue-700">{o.orderNumber}</td>
                          <td className="py-3 px-4 font-semibold text-slate-800">{o.customer}</td>
                          <td className="py-3 px-4 text-center font-mono">{o.transactions}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                            ₹{(o.amountReceived || 0).toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB: BY MODE */}
            {activeTab === 'byMode' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Banking Channel & Settlement Mode Analysis
                  </h3>
                  <span className="text-xs font-mono font-bold text-slate-500">
                    {reportsData.transactionCount} Total Clearances
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {(reportsData.byPaymentMode || []).map((m, i) => (
                    <div key={i} className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/90 shadow-2xs space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">{m.mode}</span>
                      <span className="text-lg font-black font-mono text-slate-900 block">
                        ₹{(m.amount || 0).toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        {m.count} Transactions ({Math.round(((m.amount || 0) / (reportsData.totalReceived || 1)) * 100)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: BALANCE SHEET SUMMARY */}
            {activeTab === 'summary' && (
              <div className="space-y-6 max-w-xl mx-auto py-4">
                <h3 className="text-sm font-bold text-slate-900 text-center uppercase tracking-wider">
                  Contract Receivables & Cashflow Balance Sheet
                </h3>

                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 text-xs">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                    <span className="text-slate-600 font-medium">Total Orders Monitored</span>
                    <span className="font-mono font-bold text-slate-900">{reportsData.termsSummary?.totalOrdersCount || 0} Contracts</span>
                  </div>

                  <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                    <span className="text-slate-600 font-medium">Total Contract Receivable</span>
                    <span className="font-mono text-sm font-bold text-slate-900">
                      ₹{(reportsData.termsSummary?.totalReceivable || 0).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="flex justify-between items-center border-b border-slate-200 pb-3 text-emerald-800">
                    <span className="font-medium">Total Realized & Collected</span>
                    <span className="font-mono text-sm font-black text-emerald-700">
                      ₹{(reportsData.termsSummary?.totalCollected || 0).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-2 text-rose-800">
                    <span className="font-bold text-sm">Net Outstanding Balance Due</span>
                    <span className="font-mono text-base font-black text-rose-700">
                      ₹{(reportsData.termsSummary?.totalOutstanding || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
