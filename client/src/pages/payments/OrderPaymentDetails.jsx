import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import {
  CreditCard,
  Building2,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Download,
  Printer,
  ArrowLeft,
  Receipt,
  FileSpreadsheet,
  Layers,
  Plus,
  RefreshCw,
  X,
  Upload,
  Ban,
  Check,
  Edit3,
  DollarSign
} from 'lucide-react';

export const OrderPaymentDetails = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedPaymentForCancel, setSelectedPaymentForCancel] = useState(null);

  // Record Payment Form State
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState('RTGS');
  const [transactionReference, setTransactionReference] = useState('');
  const [bankName, setBankName] = useState('HDFC Bank');
  const [utrNumber, setUtrNumber] = useState('');
  const [chequeNumber, setChequeNumber] = useState('');
  const [chequeDate, setChequeDate] = useState('');
  const [milestoneName, setMilestoneName] = useState('Advance');
  const [paymentRemarks, setPaymentRemarks] = useState('');
  const [paymentAttachment, setPaymentAttachment] = useState(null);
  const [recording, setRecording] = useState(false);

  // Configure Terms Form State
  const [termsType, setTermsType] = useState('Percentage');
  const [termsDescription, setTermsDescription] = useState('');
  const [advancePercentage, setAdvancePercentage] = useState(30);
  const [milestonesList, setMilestonesList] = useState([]);
  const [savingTerms, setSavingTerms] = useState(false);

  // Cancel Payment State
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get(`/payments/orders/${orderId}`);
      if (res.success) {
        setData(res);
        const t = res.terms || {};
        setTermsType(t.termsType || 'Percentage');
        setTermsDescription(t.termsDescription || '');
        setAdvancePercentage(t.advancePercentage || 30);
        setMilestonesList(
          t.milestones && t.milestones.length > 0
            ? t.milestones.map((m) => ({
                milestoneName: m.milestoneName,
                percentage: m.percentage,
                amount: m.amount,
                dueDate: m.dueDate ? new Date(m.dueDate).toISOString().split('T')[0] : '',
                trigger: m.trigger,
                remarks: m.remarks
              }))
            : []
        );

        // Pre-fill payment amount with pending advance or pending balance
        if (t.advancePending > 0) {
          setPaymentAmount(t.advancePending);
          setMilestoneName('Advance');
        } else if (t.pendingAmount > 0) {
          setPaymentAmount(t.pendingAmount);
          setMilestoneName('Balance Before Dispatch');
        }
      } else {
        setError(res.message || 'Failed to load order payment details.');
      }
    } catch (err) {
      setError(err.message || 'Error fetching payment data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [orderId]);

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!paymentAmount || Number(paymentAmount) <= 0) {
      alert('Please enter a valid payment amount greater than zero.');
      return;
    }
    if (!transactionReference.trim()) {
      alert('Please provide a Transaction Reference / UTR Number.');
      return;
    }

    try {
      setRecording(true);
      const payload = {
        orderId,
        amount: Number(paymentAmount),
        paymentDate,
        paymentMode,
        transactionReference: transactionReference.trim(),
        bankName: bankName.trim(),
        utrNumber: utrNumber ? utrNumber.trim() : transactionReference.trim(),
        chequeNumber: chequeNumber ? chequeNumber.trim() : undefined,
        chequeDate: chequeDate || undefined,
        milestoneName,
        remarks: paymentRemarks,
        attachmentUrl: paymentAttachment ? `/uploads/${paymentAttachment.name}` : ''
      };

      const res = await api.post(`/payments/orders/${orderId}/record`, payload);
      if (res.success) {
        setShowRecordModal(false);
        setPaymentRemarks('');
        setTransactionReference('');
        await fetchSummary();
        alert(`Payment of ₹${Number(paymentAmount).toLocaleString('en-IN')} recorded! Receipt #${res.payment?.receiptNumber} generated.`);
      }
    } catch (err) {
      alert(err.message || 'Failed to record payment.');
    } finally {
      setRecording(false);
    }
  };

  const handleSaveTerms = async (e) => {
    e.preventDefault();

    if (termsType === 'Percentage') {
      const sum = milestonesList.reduce((acc, m) => acc + (Number(m.percentage) || 0), 0);
      if (Math.round(sum) !== 100) {
        alert(`Total percentage must equal exactly 100%. Current total: ${sum}%.`);
        return;
      }
    }

    try {
      setSavingTerms(true);
      const res = await api.post(`/payments/orders/${orderId}/terms`, {
        termsType,
        termsDescription,
        advancePercentage: Number(advancePercentage),
        milestones: milestonesList
      });

      if (res.success) {
        setShowTermsModal(false);
        await fetchSummary();
        alert('Payment terms & milestone schedule updated.');
      }
    } catch (err) {
      alert(err.message || 'Failed to update terms.');
    } finally {
      setSavingTerms(false);
    }
  };

  const handleCancelPayment = async () => {
    if (!cancelReason.trim()) {
      alert('Please provide a reason for cancelling this payment receipt.');
      return;
    }
    try {
      setCancelling(true);
      const res = await api.post(`/payments/receipts/${selectedPaymentForCancel._id}/cancel`, {
        reason: cancelReason
      });
      if (res.success) {
        setShowCancelModal(false);
        setSelectedPaymentForCancel(null);
        setCancelReason('');
        await fetchSummary();
        alert('Payment cancelled and financial balances updated.');
      }
    } catch (err) {
      alert(err.message || 'Failed to cancel payment.');
    } finally {
      setCancelling(false);
    }
  };

  const addMilestoneRow = () => {
    setMilestonesList([
      ...milestonesList,
      {
        milestoneName: 'New Milestone',
        percentage: 0,
        amount: 0,
        dueDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
        trigger: 'Before dispatch',
        remarks: ''
      }
    ]);
  };

  const removeMilestoneRow = (idx) => {
    setMilestonesList(milestonesList.filter((_, i) => i !== idx));
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-500">Loading Order Payment Account...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
        <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <p className="text-sm font-bold text-slate-800">{error || 'Order payment data not found.'}</p>
        <Link to="/payments/orders" className="text-xs text-blue-600 underline mt-2 inline-block">
          Return to Order Payments List
        </Link>
      </div>
    );
  }

  const { order, terms, transactions = [] } = data;

  return (
    <div className="space-y-6 pb-24">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-start space-x-3.5">
            <Link
              to="/payments/orders"
              className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500 mt-1"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xl font-black text-slate-900 tracking-tight">
                  {order.orderNumber}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getStatusBadge(terms.paymentStatus)}`}>
                  {terms.paymentStatus}
                </span>
                {order.customerPONumber && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-700">
                    PO: {order.customerPONumber}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Customer: <strong className="text-slate-800">{order.customerName}</strong> • Project:{' '}
                <strong className="text-slate-800">{order.projectTitle}</strong>
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-right">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Order Value</span>
              <span className="font-mono text-sm font-black text-slate-900">
                ₹{(terms.totalOrderValue || 0).toLocaleString('en-IN')}
              </span>
            </div>

            <div className="px-3.5 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-right">
              <span className="text-[10px] text-emerald-700 font-bold block uppercase">Total Received</span>
              <span className="font-mono text-sm font-black text-emerald-900">
                ₹{(terms.totalReceived || 0).toLocaleString('en-IN')}
              </span>
            </div>

            <div className="px-3.5 py-1.5 bg-rose-50 border border-rose-200 rounded-xl text-right">
              <span className="text-[10px] text-rose-700 font-bold block uppercase">Pending Balance</span>
              <span className="font-mono text-sm font-black text-rose-900">
                ₹{(terms.pendingAmount || 0).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="pt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Link
              to={`/orders/${order._id}`}
              className="inline-flex items-center px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-blue-600" /> View Sales Order
            </Link>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              type="button"
              onClick={() => setShowTermsModal(true)}
              className="inline-flex items-center px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-colors shadow-2xs"
            >
              <Edit3 className="w-3.5 h-3.5 mr-1.5 text-slate-500" /> Configure Payment Milestones
            </button>

            {terms.pendingAmount > 0 && (
              <button
                type="button"
                onClick={() => setShowRecordModal(true)}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-md transition-all"
              >
                <Plus className="w-4 h-4 mr-1.5" /> Record Customer Payment
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Financial Account Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Order Value</span>
          <span className="font-mono text-base font-black text-slate-900 block mt-1">
            ₹{(terms.totalOrderValue || 0).toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5 block">100% Contract Value</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Advance Required</span>
          <span className="font-mono text-base font-black text-blue-900 block mt-1">
            ₹{(terms.advanceAmountRequired || 0).toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-blue-600 font-semibold mt-0.5 block">{terms.advancePercentage}% Advance Gate</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Advance Received</span>
          <span className="font-mono text-base font-black text-emerald-700 block mt-1">
            ₹{(terms.advanceReceived || 0).toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 block">Stage 3 Cleared</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Pending Advance</span>
          <span className="font-mono text-base font-black text-amber-700 block mt-1">
            ₹{(terms.advancePending || 0).toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-amber-600 font-semibold mt-0.5 block">Drawing Clearance Gate</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Total Received</span>
          <span className="font-mono text-base font-black text-emerald-800 block mt-1">
            ₹{(terms.totalReceived || 0).toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
            {terms.totalOrderValue > 0 ? Math.round((terms.totalReceived / terms.totalOrderValue) * 100) : 0}% Realized
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Remaining Balance</span>
          <span className="font-mono text-base font-black text-rose-700 block mt-1">
            ₹{(terms.pendingAmount || 0).toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-rose-600 font-semibold mt-0.5 block">Receivable</span>
        </div>
      </div>

      {/* Section 1: Payment Milestones Schedule */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center">
              <Layers className="w-3.5 h-3.5 mr-1.5 text-blue-600" /> Payment Terms & Milestone Schedule
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Terms: <strong className="text-slate-800">{terms.termsDescription}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowTermsModal(true)}
            className="text-xs font-bold text-blue-600 hover:text-blue-700"
          >
            Edit Schedule
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="py-2.5 px-4">Milestone Name</th>
                <th className="py-2.5 px-4 text-center">Percentage</th>
                <th className="py-2.5 px-4 text-right">Expected Amount</th>
                <th className="py-2.5 px-4">Due Date</th>
                <th className="py-2.5 px-4">Trigger / Condition</th>
                <th className="py-2.5 px-4 text-right">Amount Received</th>
                <th className="py-2.5 px-4 text-right">Pending Amount</th>
                <th className="py-2.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {terms.milestones?.map((m, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 font-bold text-slate-900">{m.milestoneName}</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-slate-700">{m.percentage}%</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                    ₹{(m.amount || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {m.dueDate ? new Date(m.dueDate).toLocaleDateString('en-IN') : '—'}
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-medium">{m.trigger}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                    ₹{(m.amountReceived || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-rose-700">
                    ₹{(m.pendingAmount || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        m.status === 'Paid'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : m.status === 'Overdue'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : m.status === 'Partially Paid'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {m.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: Payment Receipts History */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center">
              <Receipt className="w-3.5 h-3.5 mr-1.5 text-emerald-600" /> Recorded Payment Transactions & Receipts
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Official transaction log with real-time receipt generation and PDF download
            </p>
          </div>
          {terms.pendingAmount > 0 && (
            <button
              type="button"
              onClick={() => setShowRecordModal(true)}
              className="inline-flex items-center px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Payment
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="py-2.5 px-4">Receipt Number</th>
                <th className="py-2.5 px-4">Payment Date</th>
                <th className="py-2.5 px-4 text-right">Amount Received</th>
                <th className="py-2.5 px-4">Mode</th>
                <th className="py-2.5 px-4">Transaction Ref / UTR</th>
                <th className="py-2.5 px-4">Milestone</th>
                <th className="py-2.5 px-4">Remaining Balance</th>
                <th className="py-2.5 px-4 text-center">Status</th>
                <th className="py-2.5 px-4 text-center">Receipt & Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400">
                    No payment transactions recorded for this order yet.
                  </td>
                </tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t._id} className={t.status === 'Cancelled' ? 'bg-slate-50/70 opacity-60' : 'hover:bg-slate-50/60'}>
                    <td className="py-3 px-4 font-mono font-bold text-blue-700">
                      {t.receiptNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {new Date(t.paymentDate).toLocaleDateString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                      ₹{(t.amount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px]">
                        {t.paymentMode}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">
                      {t.transactionReference || t.utrNumber || '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-800 font-medium">
                      {t.milestoneName || 'Advance'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-800">
                      ₹{(t.remainingOutstandingAmount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          t.status === 'Cleared'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : t.status === 'Cancelled'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <a
                          href={`/api/payments/receipts/${t._id}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded text-[11px] font-bold"
                          title="Download Receipt PDF"
                        >
                          <Download className="w-3 h-3 mr-1" /> PDF
                        </a>

                        {t.status === 'Cleared' && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPaymentForCancel(t);
                              setShowCancelModal(true);
                            }}
                            className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded"
                            title="Cancel Receipt"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 3: Payment Audit Trail */}
      {terms.auditTrail && terms.auditTrail.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center">
            <Clock className="w-3.5 h-3.5 mr-1.5 text-blue-600" /> Financial Audit History
          </h3>
          <div className="space-y-3">
            {terms.auditTrail.map((entry, i) => (
              <div key={i} className="p-3 bg-slate-50/60 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-900 block">{entry.action}</span>
                  <span className="text-[11px] text-slate-500">{entry.remarks}</span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block">
                    {new Date(entry.timestamp).toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-700">{entry.userName}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: RECORD PAYMENT */}
      {showRecordModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Record Customer Payment</h3>
                  <p className="text-xs text-slate-500">Order: {order.orderNumber}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRecordModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Amount Received (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold text-slate-900"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Max: ₹{terms.pendingAmount.toLocaleString('en-IN')}
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Payment Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Mode</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                  >
                    <option value="RTGS">RTGS</option>
                    <option value="NEFT">NEFT</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="IMPS">IMPS</option>
                    <option value="UPI">UPI</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Cash">Cash</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Transaction Ref / UTR <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={transactionReference}
                    onChange={(e) => setTransactionReference(e.target.value)}
                    placeholder="e.g. HDFCR9823482749"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g. HDFC Bank, SBI"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Milestone Tag</label>
                  <select
                    value={milestoneName}
                    onChange={(e) => setMilestoneName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                  >
                    <option value="Advance">Advance Payment (PO)</option>
                    {terms.milestones?.map((m, i) => (
                      <option key={i} value={m.milestoneName}>
                        {m.milestoneName}
                      </option>
                    ))}
                    <option value="Final Settlement">Final Settlement</option>
                  </select>
                </div>
              </div>

              {paymentMode === 'Cheque' && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Cheque Number</label>
                    <input
                      type="text"
                      value={chequeNumber}
                      onChange={(e) => setChequeNumber(e.target.value)}
                      placeholder="e.g. 004812"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Cheque Date</label>
                    <input
                      type="date"
                      value={chequeDate}
                      onChange={(e) => setChequeDate(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Payment Remarks / Notes</label>
                <textarea
                  rows={2}
                  value={paymentRemarks}
                  onChange={(e) => setPaymentRemarks(e.target.value)}
                  placeholder="Credited against proforma invoice / advance milestone..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRecordModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={recording}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md disabled:opacity-50"
                >
                  {recording ? 'Processing...' : 'Confirm & Issue Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIGURE PAYMENT TERMS & MILESTONES */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Configure Payment Milestones & Terms</h3>
                  <p className="text-xs text-slate-500">Order Value: ₹{(terms.totalOrderValue || 0).toLocaleString('en-IN')}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTerms} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Terms Description</label>
                  <input
                    type="text"
                    value={termsDescription}
                    onChange={(e) => setTermsDescription(e.target.value)}
                    placeholder="e.g. 50% Advance + 50% Before Dispatch"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Advance Gate Percentage (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={advancePercentage}
                    onChange={(e) => setAdvancePercentage(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold"
                  />
                </div>
              </div>

              {/* Milestones dynamic list */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700">Milestone Schedule Rows</label>
                  <button
                    type="button"
                    onClick={addMilestoneRow}
                    className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Milestone
                  </button>
                </div>

                <div className="space-y-2">
                  {milestonesList.map((m, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-4">
                        <input
                          type="text"
                          required
                          value={m.milestoneName}
                          onChange={(e) => {
                            const updated = [...milestonesList];
                            updated[idx].milestoneName = e.target.value;
                            setMilestonesList(updated);
                          }}
                          placeholder="Milestone Name"
                          className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          required
                          value={m.percentage}
                          onChange={(e) => {
                            const updated = [...milestonesList];
                            updated[idx].percentage = e.target.value;
                            setMilestonesList(updated);
                          }}
                          placeholder="%"
                          className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold text-center"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="date"
                          required
                          value={m.dueDate}
                          onChange={(e) => {
                            const updated = [...milestonesList];
                            updated[idx].dueDate = e.target.value;
                            setMilestonesList(updated);
                          }}
                          className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs"
                        />
                      </div>
                      <div className="col-span-2">
                        <select
                          value={m.trigger}
                          onChange={(e) => {
                            const updated = [...milestonesList];
                            updated[idx].trigger = e.target.value;
                            setMilestonesList(updated);
                          }}
                          className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-[11px] bg-white"
                        >
                          <option value="Order confirmation">Order confirmation</option>
                          <option value="Drawing approval">Drawing approval</option>
                          <option value="Production completion">Production completion</option>
                          <option value="Before dispatch">Before dispatch</option>
                        </select>
                      </div>
                      <div className="col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => removeMilestoneRow(idx)}
                          className="p-1 text-rose-500 hover:text-rose-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTermsModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingTerms}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md"
                >
                  {savingTerms ? 'Saving...' : 'Save Milestone Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CANCEL RECEIPT */}
      {showCancelModal && selectedPaymentForCancel && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center space-x-2.5 text-rose-600">
              <Ban className="w-6 h-6" />
              <div>
                <h3 className="text-base font-bold text-slate-900">Cancel Payment Receipt</h3>
                <p className="text-xs text-slate-500">Receipt #{selectedPaymentForCancel.receiptNumber}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Cancelling this receipt will deduct ₹{selectedPaymentForCancel.amount?.toLocaleString('en-IN')} from the order's realized total and restore the outstanding balance. The transaction remains in the historical audit log.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Cancellation Reason <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Bank chargeback, duplicate payment entry, incorrect account credit..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
              />
            </div>

            <div className="pt-2 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Close
              </button>
              <button
                type="button"
                disabled={cancelling}
                onClick={handleCancelPayment}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-md"
              >
                {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
