import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import {
  Clock,
  Search,
  Filter,
  AlertTriangle,
  Building2,
  Calendar,
  MessageSquare,
  PhoneCall,
  Mail,
  RefreshCw,
  ChevronRight,
  X,
  CheckCircle2,
  Phone,
  FileSpreadsheet
} from 'lucide-react';

export const PendingPaymentsList = () => {
  const navigate = useNavigate();
  const [pendingList, setPendingList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOverdueOnly, setFilterOverdueOnly] = useState(false);

  // Follow-up modal state
  const [showFollowupModal, setShowFollowupModal] = useState(false);
  const [selectedPendingOrder, setSelectedPendingOrder] = useState(null);
  const [followupMethod, setFollowupMethod] = useState('Phone');
  const [contactPerson, setContactPerson] = useState('');
  const [remarks, setRemarks] = useState('');
  const [customerResponse, setCustomerResponse] = useState('');
  const [nextFollowupDate, setNextFollowupDate] = useState('');
  const [savingFollowup, setSavingFollowup] = useState(false);

  const fetchPendingPayments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/payments/pending');
      if (res.success) {
        setPendingList(res.pendingPayments || []);
      }
    } catch (err) {
      console.error('Failed to load pending payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingPayments();
  }, []);

  const handleOpenFollowup = (item) => {
    setSelectedPendingOrder(item);
    setContactPerson('');
    setRemarks('');
    setCustomerResponse('');
    setNextFollowupDate(new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString().split('T')[0]);
    setShowFollowupModal(true);
  };

  const handleSaveFollowup = async (e) => {
    e.preventDefault();
    if (!remarks.trim()) {
      alert('Please enter follow-up remarks.');
      return;
    }

    try {
      setSavingFollowup(true);
      const res = await api.post('/payments/followups', {
        orderId: selectedPendingOrder.orderId,
        followupMethod,
        contactPerson: contactPerson.trim(),
        remarks: remarks.trim(),
        customerResponse: customerResponse.trim(),
        nextFollowupDate: nextFollowupDate || undefined
      });

      if (res.success) {
        setShowFollowupModal(false);
        alert('Follow-up logged successfully.');
        await fetchPendingPayments();
      }
    } catch (err) {
      alert(err.message || 'Failed to save follow-up.');
    } finally {
      setSavingFollowup(false);
    }
  };

  const filtered = pendingList.filter((item) => {
    const matchesSearch =
      searchQuery === '' ||
      item.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.customerPONumber?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesOverdue = !filterOverdueOnly || item.isOverdue;

    return matchesSearch && matchesOverdue;
  });

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-400">Payment Management</span>
            <span className="text-xs text-slate-300">•</span>
            <span className="text-xs font-semibold text-rose-600">Receivables & Recovery</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
            Pending & Overdue Payments
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track uncollected customer advances, past-due milestone commitments, and log commercial follow-up calls.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 shrink-0">
          <button
            type="button"
            onClick={fetchPendingPayments}
            className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 shadow-2xs"
            title="Refresh"
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
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search pending orders by Order No, Customer, PO..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900"
          />
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setFilterOverdueOnly(!filterOverdueOnly)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
              filterOverdueOnly
                ? 'bg-rose-50 text-rose-700 border-rose-300'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 inline mr-1 text-rose-500" />
            Show Overdue Only ({pendingList.filter((p) => p.isOverdue).length})
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Sales Order No</th>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4 text-right">Order Value</th>
                <th className="py-3 px-4 text-right">Received</th>
                <th className="py-3 px-4 text-right">Pending Receivable</th>
                <th className="py-3 px-4">Milestone Due Date</th>
                <th className="py-3 px-4 text-center">Days Pending</th>
                <th className="py-3 px-4">Payment Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="w-7 h-7 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading pending payments...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No pending payment obligations found.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr
                    key={item._id}
                    className={`transition-colors ${
                      item.isOverdue ? 'bg-rose-50/40 hover:bg-rose-50/70' : 'hover:bg-slate-50/60'
                    }`}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                      <Link to={`/payments/orders/${item.orderId}`} className="hover:underline">
                        {item.orderNumber}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 max-w-[170px] truncate">
                      {item.customerName}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                      ₹{(item.totalOrderValue || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700">
                      ₹{(item.totalReceived || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-700">
                      ₹{(item.pendingAmount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      {item.earliestDueDate
                        ? new Date(item.earliestDueDate).toLocaleDateString('en-IN')
                        : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {item.daysPending > 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          +{item.daysPending} Days
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Due soon</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          item.isOverdue
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {item.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          type="button"
                          onClick={() => handleOpenFollowup(item)}
                          className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-bold transition-colors inline-flex items-center"
                          title="Record Follow-up Call / Email"
                        >
                          <Phone className="w-3 h-3 mr-1" /> Follow-up
                        </button>
                        <Link
                          to={`/payments/orders/${item.orderId}`}
                          className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-colors"
                        >
                          Manage
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: RECORD PAYMENT FOLLOW-UP */}
      {showFollowupModal && selectedPendingOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Record Commercial Follow-up</h3>
                  <p className="text-xs text-slate-500">
                    Order: <strong className="text-slate-800">{selectedPendingOrder.orderNumber}</strong> • Pending: ₹{selectedPendingOrder.pendingAmount?.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowFollowupModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFollowup} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Follow-up Channel</label>
                  <select
                    value={followupMethod}
                    onChange={(e) => setFollowupMethod(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                  >
                    <option value="Phone">Phone Call</option>
                    <option value="Email">Email Reminder</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Meeting">In-Person Meeting</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Client Contact Person</label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="e.g. Accounts Manager / Mr. Suresh"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Follow-up Discussion & Remarks <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Details of reminder given regarding overdue advance milestone..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Customer Response / Commitment</label>
                <textarea
                  rows={2}
                  value={customerResponse}
                  onChange={(e) => setCustomerResponse(e.target.value)}
                  placeholder="e.g. Approved bill in verification, RTGS will be initiated on Friday..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Next Follow-up Due Date</label>
                <input
                  type="date"
                  value={nextFollowupDate}
                  onChange={(e) => setNextFollowupDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowFollowupModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingFollowup}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-md"
                >
                  {savingFollowup ? 'Saving...' : 'Save Follow-up Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
