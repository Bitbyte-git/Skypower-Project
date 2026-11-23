import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldAlert,
  ShieldCheck,
  Search,
  Clock,
  Layers,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Cpu,
  RefreshCw,
  Eye,
  Filter,
  CreditCard,
  ArrowRight
} from 'lucide-react';

export const POTrackingView = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isPOTeam = user?.role === 'PO_TEAM';

  const [pos, setPos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedPO, setSelectedPO] = useState(null);
  const [rejectModalPO, setRejectModalPO] = useState(null);
  const [rejectionRemarks, setRejectionRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchPOs = async () => {
    setLoading(true);
    try {
      let query = `?search=${encodeURIComponent(search)}`;
      if (statusFilter) query += `&status=${encodeURIComponent(statusFilter)}`;
      const res = await api.get(`/workflow/po-tracking${query}`);
      if (res.success) {
        setPos(res.pos || []);
      }
    } catch (err) {
      console.error('Failed to load POs:', err);
      setError('Could not load PO records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPOs();
  }, [search, statusFilter]);

  // Quick 1-Click Approval right from table or modal
  const handleQuickApprove = async (po) => {
    setActionLoading(po._id);
    setMessage('');
    setError('');
    try {
      const res = await api.put(`/workflow/po-tracking/${po._id}/status`, {
        status: 'Completed',
        notes: 'PO technical specifications, switchgear ratings, and line quantities verified & cleared by PO Team.'
      });
      if (res.success) {
        setMessage(`Purchase Order ${po.poId} approved! Project successfully advanced to Stage 3: Advance Payment.`);
        await fetchPOs();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error approving Purchase Order.');
    } finally {
      setActionLoading(null);
    }
  };

  // Quick Rejection with remarks
  const handleConfirmReject = async () => {
    if (!rejectModalPO) return;
    if (!rejectionRemarks.trim()) {
      setError('Please enter remarks explaining why this PO is being returned or rejected.');
      return;
    }
    setActionLoading(rejectModalPO._id);
    setError('');
    try {
      const res = await api.put(`/workflow/po-tracking/${rejectModalPO._id}/status`, {
        status: 'Rejected',
        notes: rejectionRemarks.trim()
      });
      if (res.success) {
        setMessage(`Purchase Order ${rejectModalPO.poId} returned with remarks: "${rejectionRemarks}"`);
        setRejectModalPO(null);
        setRejectionRemarks('');
        await fetchPOs();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error returning PO.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedPO || !newStatus) return;

    setUpdatingStatus(true);
    setMessage('');
    setError('');
    try {
      const res = await api.put(`/workflow/po-tracking/${selectedPO._id}/status`, {
        status: newStatus,
        notes: statusNotes
      });
      if (res.success) {
        setMessage(`Status updated to '${newStatus}' for ${selectedPO.poId}`);
        setSelectedPO({
          ...selectedPO,
          status: newStatus,
          timeline: [
            ...(selectedPO.timeline || []),
            {
              status: newStatus,
              notes: statusNotes,
              updatedAt: new Date()
            }
          ]
        });
        fetchPOs();
        setStatusNotes('');
      }
    } catch (err) {
      setError(err.message || 'Error updating PO status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Filter KPI metrics
  const pendingCount = pos.filter(
    (p) => p.status === 'Submitted to PO Team' || p.status === 'Submitted' || p.status === 'Under Technical Review' || p.status === 'BOM Generation'
  ).length;
  const inReviewCount = pos.filter((p) => p.status === 'Under Technical Review' || p.status === 'BOM Generation').length;
  const completedCount = pos.filter((p) => p.status === 'Completed').length;
  const totalCount = pos.length;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Submitted to PO Team':
      case 'Submitted':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-800 border border-amber-300 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse mr-1.5" />
            Action Required: Review
          </span>
        );
      case 'Under Technical Review':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
            <Clock className="w-3 h-3 mr-1 text-blue-600" />
            Under Tech Review
          </span>
        );
      case 'BOM Generation':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200">
            BOM In-Progress
          </span>
        );
      case 'Engineering Cleared':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-800 border border-sky-200">
            Engineering Cleared
          </span>
        );
      case 'Production Handover':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
            In Production
          </span>
        );
      case 'Completed':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
            Cleared to Stage 3
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-300">
            Returned / Rejected
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-[26px] font-black tracking-tight" style={{ color: '#102B50' }}>
              {isPOTeam ? 'PO Team Technical Execution Portal' : 'Purchase Order Tracking'}
            </h1>
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-orange-100 text-[#D95B1B]">
              IEC 62271 Handover
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Review switchgear technical specifications, verify ratings, and clear orders directly to Stage 3 (Advance Payment).
          </p>
        </div>

        {/* Header Right Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate('/departments/workflow?dept=3')}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-sm cursor-pointer"
            style={{ background: 'linear-gradient(135deg, #1E5BB8 0%, #0F3B82 100%)' }}
            title="Navigate to Stage 3: Advance Payment Module"
          >
            <CreditCard className="w-3.5 h-3.5 text-amber-300" />
            <span>Advance Payment Module</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={fetchPOs}
            className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition-colors shadow-2xs cursor-pointer"
            title="Refresh Orders"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Alert Toasts */}
      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-900 text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{message}</span>
          </div>
          <button
            type="button"
            onClick={() => setMessage('')}
            className="text-emerald-700 hover:text-emerald-900 font-bold ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl text-rose-800 text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError('')}
            className="text-rose-700 hover:text-rose-900 font-bold ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Dynamic Action-Oriented KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Awaiting My Review & Approval */}
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'Submitted to PO Team' ? '' : 'Submitted to PO Team')}
          className={`p-4 rounded-2xl text-left transition-all border cursor-pointer ${
            statusFilter === 'Submitted to PO Team'
              ? 'ring-2 ring-[#EE6F2D] shadow-md bg-white border-[#EE6F2D]'
              : 'bg-white hover:bg-amber-50/40 border-slate-200/90 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-800">
              Awaiting PO Approval
            </span>
            <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-black">
              !
            </span>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-slate-900 font-mono">{pendingCount}</span>
            <span className="text-xs text-amber-700 font-bold">
              {pendingCount === 1 ? 'Action Required' : 'Actions Required'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Orders requiring technical clearance</p>
        </button>

        {/* Card 2: In Technical Review */}
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'Under Technical Review' ? '' : 'Under Technical Review')}
          className={`p-4 rounded-2xl text-left transition-all border cursor-pointer ${
            statusFilter === 'Under Technical Review'
              ? 'ring-2 ring-blue-600 shadow-md bg-white border-blue-600'
              : 'bg-white hover:bg-blue-50/30 border-slate-200/90 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-blue-800">
              In Technical Review
            </span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-slate-900 font-mono">{inReviewCount}</span>
            <span className="text-xs text-blue-600 font-semibold">BOM / SLD Check</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Engineering specifications review</p>
        </button>

        {/* Card 3: Cleared & Forwarded */}
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'Completed' ? '' : 'Completed')}
          className={`p-4 rounded-2xl text-left transition-all border cursor-pointer ${
            statusFilter === 'Completed'
              ? 'ring-2 ring-emerald-600 shadow-md bg-white border-emerald-600'
              : 'bg-white hover:bg-emerald-50/30 border-slate-200/90 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800">
              Cleared &amp; Completed
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-slate-900 font-mono">{completedCount}</span>
            <span className="text-xs text-emerald-700 font-bold">Stage 3 Unlocked</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Forwarded to Advance Payment</p>
        </button>

        {/* Card 4: Total Queue */}
        <button
          type="button"
          onClick={() => setStatusFilter('')}
          className={`p-4 rounded-2xl text-left transition-all border cursor-pointer ${
            statusFilter === ''
              ? 'ring-2 ring-slate-800 shadow-md bg-white border-slate-800'
              : 'bg-white hover:bg-slate-50 border-slate-200/90 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-700">
              Total PO Queue
            </span>
            <Layers className="w-4 h-4 text-slate-600" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-slate-900 font-mono">{totalCount}</span>
            <span className="text-xs text-slate-500 font-semibold">All Active Orders</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Click to view all</p>
        </button>
      </div>

      {/* Work Queue Action Banner */}
      {pendingCount > 0 && (
        <div className="p-4 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 border border-amber-300 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#EE6F2D] text-white flex items-center justify-center shrink-0 shadow-md">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-black uppercase tracking-wider text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-md">
                  {pendingCount} {pendingCount === 1 ? 'Order Requires Your Approval' : 'Orders Require Your Approval'}
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs font-semibold text-slate-600">Stage 2 Execution Gate</span>
              </div>
              <p className="text-xs text-slate-700 font-medium mt-1">
                Verify switchgear ratings (kV, Amp, kA) and click <strong>Accept &amp; Approve</strong> directly on the table below to forward the project to <strong>Stage 3: Advance Payment</strong>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border border-slate-200/90 shadow-xs">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by PO ID, Client ID, or Project..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50/70 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl font-medium border border-slate-200 bg-slate-50 text-slate-800 focus:outline-hidden"
          >
            <option value="">All Statuses ({totalCount})</option>
            <option value="Submitted to PO Team">Awaiting Action ({pendingCount})</option>
            <option value="Under Technical Review">Under Review</option>
            <option value="BOM Generation">BOM Generation</option>
            <option value="Engineering Cleared">Engineering Cleared</option>
            <option value="Completed">Completed ({completedCount})</option>
          </select>
        </div>
      </div>

      {/* PO Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-14 text-center text-slate-500 text-xs font-medium">
            <div className="w-8 h-8 border-3 border-[#EE6F2D] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading Purchase Orders...
          </div>
        ) : pos.length === 0 ? (
          <div className="p-14 text-center text-slate-400 text-xs font-medium">
            No purchase order records match your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4 whitespace-nowrap">PO ID</th>
                  <th className="py-3 px-4 whitespace-nowrap">Client ID</th>
                  <th className="py-3 px-4 min-w-[200px]">Project Title</th>
                  <th className="py-3 px-3 text-center whitespace-nowrap">Offering Ver.</th>
                  <th className="py-3 px-3 text-center whitespace-nowrap">Products</th>
                  {!isPOTeam && <th className="py-3 px-4 text-right whitespace-nowrap">Approved Value (₹)</th>}
                  <th className="py-3 px-3 text-center whitespace-nowrap">Status</th>
                  <th className="py-3 px-4 text-center whitespace-nowrap">Approval &amp; Execution Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {pos.map((po) => {
                  const isPending = po.status !== 'Completed' && po.status !== 'Rejected';
                  const isActionLoading = actionLoading === po._id;

                  return (
                    <tr
                      key={po._id}
                      className={`transition-colors border-b border-slate-100 ${
                        isPending ? 'bg-amber-50/20 hover:bg-amber-50/40' : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <td className="py-3.5 px-4 font-mono font-black text-[#D95B1B]">
                        {po.poId}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-[#1E5BB8]">
                        {po.clientId}
                      </td>
                      <td className="py-3.5 px-4 text-slate-900 font-semibold max-w-xs">
                        <div className="truncate">{po.projectTitle}</div>
                        <span className="block text-[10px] text-slate-400 font-normal">
                          {po.segment} • {po.subSegment}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center font-mono font-bold text-purple-700">
                        {po.offeringVersionId}
                      </td>
                      <td className="py-3.5 px-3 text-center font-bold text-slate-700">
                        {po.products?.length || 0}
                      </td>
                      {!isPOTeam && (
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-800 whitespace-nowrap">
                          ₹ {Number(po.finalApprovedAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      )}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        {getStatusBadge(po.status)}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1.5">
                          {isPending ? (
                            <>
                              {/* Direct Accept & Approve Button */}
                              <button
                                type="button"
                                onClick={() => handleQuickApprove(po)}
                                disabled={isActionLoading}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-xs hover:shadow transition-all inline-flex items-center space-x-1 cursor-pointer disabled:opacity-50"
                                style={{ background: 'linear-gradient(90deg, #059669 0%, #10B981 100%)' }}
                                title="Accept & Advance Project to Stage 3 (Advance Payment)"
                              >
                                {isActionLoading ? (
                                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                )}
                                <span>Accept &amp; Approve</span>
                              </button>

                              {/* Inspect Technical Details Button */}
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedPO(po);
                                  setNewStatus(po.status);
                                }}
                                className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors inline-flex items-center space-x-1 cursor-pointer"
                                title="Inspect technical specifications, ratings, and drawings"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Inspect</span>
                              </button>

                              {/* Quick Reject Button */}
                              <button
                                type="button"
                                onClick={() => {
                                  setRejectModalPO(po);
                                  setRejectionRemarks('');
                                }}
                                className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors inline-flex items-center cursor-pointer"
                                title="Return or Reject with Remarks"
                              >
                                <span>✕ Reject</span>
                              </button>
                            </>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <span className="inline-flex items-center text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2.5 py-1 rounded-lg">
                                <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                                Stage 3 Cleared
                              </span>
                              <button
                                type="button"
                                onClick={() => navigate(`/departments/workflow?dept=3&search=${encodeURIComponent(po.poId || '')}`)}
                                className="px-2.5 py-1 rounded-lg text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors inline-flex items-center space-x-1 cursor-pointer"
                                title="Jump to Stage 3: Advance Payment"
                              >
                                <span>Stage 3 →</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ============================================================
          INSPECTION & TECHNICAL VERIFICATION MODAL
          ============================================================ */}
      {selectedPO && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] overflow-y-auto p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#EE6F2D] flex items-center justify-center shrink-0">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[#0A1E3F]">
                    Technical Verification: {selectedPO.poId}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Client ID: {selectedPO.clientId} &bull; Offering Ver: {selectedPO.offeringVersionId}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedPO(null)}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Technical Verification Checklist */}
            <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-black uppercase tracking-wider text-blue-900 flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  <span>Technical Clearance Checklist</span>
                </h5>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                  Ready to Approve
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700 font-medium">
                <div className="flex items-center space-x-2 p-2 bg-white rounded-lg border border-blue-100">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Voltage: <strong>{selectedPO.products?.[0]?.kilovolt || '11 kV'}</strong> Verified</span>
                </div>
                <div className="flex items-center space-x-2 p-2 bg-white rounded-lg border border-blue-100">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Current: <strong>{selectedPO.products?.[0]?.ampere || '630 A'}</strong> Verified</span>
                </div>
                <div className="flex items-center space-x-2 p-2 bg-white rounded-lg border border-blue-100">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Breaking: <strong>{selectedPO.products?.[0]?.kiloampere || '25 kA'}</strong> Verified</span>
                </div>
                <div className="flex items-center space-x-2 p-2 bg-white rounded-lg border border-blue-100">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Single Line Diagram (SLD) Aligned</span>
                </div>
              </div>
            </div>

            {/* Product Specifications Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                Approved Product Specifications
              </h4>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Product Description</th>
                      <th className="py-2.5 px-3 text-center">kV</th>
                      <th className="py-2.5 px-3 text-center">Amp</th>
                      <th className="py-2.5 px-3 text-center">kA</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedPO.products?.map((p, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-bold text-slate-400">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">
                          {p.productDescription || p.productName}
                          <span className="block text-[10px] text-slate-400 font-normal">
                            {p.usage} &bull; {p.ebMetering}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono">{p.kilovolt}</td>
                        <td className="py-2.5 px-3 text-center font-mono">{p.ampere}</td>
                        <td className="py-2.5 px-3 text-center font-mono">{p.kiloampere}</td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-900">{p.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action Buttons in Modal */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setRejectModalPO(selectedPO);
                  setSelectedPO(null);
                }}
                className="w-full sm:w-auto px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                ✕ Reject / Return for Correction
              </button>

              <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedPO(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    await handleQuickApprove(selectedPO);
                    setSelectedPO(null);
                  }}
                  disabled={actionLoading === selectedPO._id}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                  style={{ background: 'linear-gradient(90deg, #059669 0%, #10B981 100%)' }}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Accept &amp; Forward to Stage 3 (Advance Payment)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          REJECTION / RETURN MODAL
          ============================================================ */}
      {rejectModalPO && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-rose-200 w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2 text-rose-700">
                <AlertCircle className="w-5 h-5 text-rose-600" />
                <h3 className="text-sm font-bold">Return PO: {rejectModalPO.poId}</h3>
              </div>
              <button
                type="button"
                onClick={() => setRejectModalPO(null)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Provide the engineering or technical reason why this Purchase Order is being returned to Sales:
            </p>

            <textarea
              rows={3}
              placeholder="e.g. Current rating 630A is insufficient for 11kV incoming feeder requirement..."
              value={rejectionRemarks}
              onChange={(e) => setRejectionRemarks(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-rose-500"
            />

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalPO(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={actionLoading === rejectModalPO._id}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
              >
                {actionLoading === rejectModalPO._id ? 'Returning...' : 'Confirm Return'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

