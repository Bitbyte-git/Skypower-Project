import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import {
  CreditCard,
  CheckCircle2,
  Calendar,
  Building2,
  Download,
  AlertCircle,
  TrendingUp,
  Receipt
} from 'lucide-react';

export const CustomerPayments = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setLoading(true);
        const res = await api.get('/portal/payments');
        if (res.success) {
          setData(res);
        }
      } catch (err) {
        console.error('Failed to fetch payment details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, []);

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs text-slate-500 font-medium">Loading commercial statement...</p>
      </div>
    );
  }

  const summary = data?.summary || {};
  const payments = data?.payments || [];

  return (
    <div className="space-y-6 pb-20">
      {/* 1. Header */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center">
              <CreditCard className="w-6 h-6 text-emerald-600 mr-2" />
              Commercial &amp; Payment Statement
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified accounts department receipts, advance payments, and commercial balance tracking.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-500">
            Total Receipts: <strong className="text-slate-900">{summary.totalReceipts || 0}</strong>
          </span>
        </div>
      </div>

      {/* 2. KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Contract Value</span>
          <p className="text-2xl font-black text-slate-900 font-mono">
            ₹ {Number(summary.totalOrderValue || 0).toLocaleString('en-IN')}
          </p>
          <span className="text-xs text-slate-500">All Confirmed Switchgear Orders</span>
        </div>

        <div className="bg-emerald-50/60 p-6 rounded-3xl border border-emerald-200/90 shadow-xs space-y-2">
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">Total Received &amp; Cleared</span>
          <p className="text-2xl font-black text-emerald-900 font-mono">
            ₹ {Number(summary.totalPaid || 0).toLocaleString('en-IN')}
          </p>
          <span className="text-xs text-emerald-700 font-medium">Verified by Accounts Team</span>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Outstanding Balance</span>
          <p className="text-2xl font-black text-slate-900 font-mono">
            ₹ {Number(summary.pendingBalance || 0).toLocaleString('en-IN')}
          </p>
          <span className="text-xs text-slate-500">Payable as per commercial terms</span>
        </div>
      </div>

      {/* 3. Payment Receipts Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center">
            <Receipt className="w-5 h-5 text-blue-600 mr-2" />
            Official Payment Receipts History
          </h3>
          <span className="text-xs text-slate-400">All cleared bank credits</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="py-3.5 px-4">Receipt No</th>
                <th className="py-3.5 px-4">Order Ref</th>
                <th className="py-3.5 px-4">Payment Date</th>
                <th className="py-3.5 px-4">Payment Mode &amp; Bank</th>
                <th className="py-3.5 px-4">Transaction / UTR Reference</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Amount Cleared</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No payment receipts logged yet. Advance payments cleared by accounts will be recorded here.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-700">{p.receiptNumber}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{p.orderNumber}</td>
                    <td className="py-3.5 px-4 text-slate-700">
                      {new Date(p.receiptDate).toLocaleDateString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-slate-800 font-medium">
                      {p.paymentMode} {p.bankName ? `(${p.bankName})` : ''}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">{p.transactionReference || '—'}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                        <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" /> Cleared
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-black text-emerald-700 text-sm">
                      ₹ {Number(p.amount || 0).toLocaleString('en-IN')}
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
