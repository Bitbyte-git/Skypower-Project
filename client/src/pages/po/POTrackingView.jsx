import React, { useState, useEffect } from 'react';
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
  Filter
} from 'lucide-react';

export const POTrackingView = () => {
  const { user } = useAuth();
  const isPOTeam = user?.role === 'PO_TEAM';

  const [pos, setPos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedPO, setSelectedPO] = useState(null);
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

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Submitted to PO Team':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold" style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>Submitted</span>;
      case 'Under Technical Review':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold" style={{ background: '#FFFBEB', color: '#B45309', border: '1px solid #FDE68A' }}>Under Review</span>;
      case 'BOM Generation':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold" style={{ background: '#F5F3FF', color: '#7C3AED', border: '1px solid #DDD6FE' }}>BOM In-Progress</span>;
      case 'Engineering Cleared':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold" style={{ background: '#F0FDF4', color: '#166534', border: '1px solid #BBF7D0' }}>Engineering Cleared</span>;
      case 'Production Handover':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold" style={{ background: '#EEF2FF', color: '#4338CA', border: '1px solid #C7D2FE' }}>In Production</span>;
      case 'Completed':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold" style={{ background: '#F0FDF4', color: '#14532D', border: '1px solid #86EFAC' }}>Completed</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ background: '#F8FAFC', color: '#526783' }}>{status}</span>;
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
            {isPOTeam
              ? 'Role-Restricted View: Client personal identity and commercial negotiations are protected.'
              : 'End-to-end tracking of approved offerings handed over to PO and Production teams.'}
          </p>
        </div>

        {/* Security Badge */}
        <div className="flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-2xs" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#166534' }}>
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Restricted Data Shield Active</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3" style={{ background: '#FFFFFF', border: '1px solid #DCE7F3', boxShadow: '0 2px 8px rgba(6,43,89,0.05)' }}>
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by PO ID, Client ID, or Project..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl"
            style={{ border: '1px solid #DCE7F3', background: '#F8FBFF' }}
            onFocus={e => { e.currentTarget.style.borderColor = '#0878C9'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(8,120,201,0.12)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = '#DCE7F3'; e.currentTarget.style.boxShadow = 'none'; }}
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg font-medium"
            style={{ border: '1px solid #DCE7F3', background: '#F8FBFF', color: '#102B50' }}
          >
            <option value="">All Statuses</option>
            <option value="Submitted to PO Team">Submitted</option>
            <option value="Under Technical Review">Under Review</option>
            <option value="BOM Generation">BOM Generation</option>
            <option value="Engineering Cleared">Engineering Cleared</option>
            <option value="Production Handover">Production Handover</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      {/* PO Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: '#FFFFFF', border: '1px solid #DCE7F3', boxShadow: '0 3px 8px rgba(15,55,100,0.05), 0 10px 24px rgba(15,55,100,0.07)' }}>
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs font-medium">
            <div className="w-8 h-8 border-3 border-[#EE6F2D] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading Purchase Orders...
          </div>
        ) : pos.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs font-medium">
            No purchase order records match your criteria. Finalize an approved offering to send to the PO Team.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="erp-table-header border-b" style={{ borderColor: '#DCE7F3' }}>
                  <th className="py-3 px-4 whitespace-nowrap">PO ID</th>
                  <th className="py-3 px-4 whitespace-nowrap">Client ID</th>
                  <th className="py-3 px-4 min-w-[200px]">Project Title</th>
                  <th className="py-3 px-3 text-center whitespace-nowrap">Offering Ver.</th>
                  <th className="py-3 px-3 text-center whitespace-nowrap">Products</th>
                  {!isPOTeam && <th className="py-3 px-4 text-right whitespace-nowrap">Approved Value (₹)</th>}
                  <th className="py-3 px-3 text-center whitespace-nowrap">Processing Status</th>
                  <th className="py-3 px-4 text-center whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {pos.map((po) => (
                  <tr key={po._id} className="erp-table-row transition-colors border-b" style={{ borderColor: '#EAF0F7' }}>
                    <td className="py-3 px-4 font-mono font-black text-[#D95B1B]">
                      {po.poId}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-[#1E5BB8]">
                      {po.clientId}
                    </td>
                    <td className="py-3 px-4 text-slate-900 font-semibold max-w-xs truncate">
                      {po.projectTitle}
                      <span className="block text-[10px] text-slate-400 font-normal">
                        {po.segment} • {po.subSegment}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-purple-700">
                      {po.offeringVersionId}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-slate-700">
                      {po.products?.length || 0}
                    </td>
                    {!isPOTeam && (
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-800 whitespace-nowrap">
                        <span className="inline-block whitespace-nowrap">
                          ₹ {Number(po.finalApprovedAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                    )}
                    <td className="py-3 px-3 text-center">
                      {getStatusBadge(po.status)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPO(po);
                          setNewStatus(po.status);
                        }}
                        className="px-3 py-1.5 rounded-lg font-semibold text-[13px] flex items-center space-x-1.5 mx-auto cursor-pointer transition-all"
                        style={{ background: '#EAF5FF', color: '#0878C9', border: '1px solid #BAE0F7' }}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ============================================================
          INSPECTION & STATUS UPDATE MODAL
          ============================================================ */}
      {selectedPO && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Cpu className="w-5 h-5 text-[#EE6F2D]" />
                <div>
                  <h3 className="text-sm font-extrabold text-[#0A1E3F]">
                    Technical Requisition: {selectedPO.poId}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Client ID: {selectedPO.clientId} • Ver: {selectedPO.offeringVersionId}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedPO(null)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* PII Protection Banner */}
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-emerald-900 flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Confidentiality Enforced:</strong> Client company name, contact phone, and commercial prices are restricted to the Sales Department.
              </span>
            </div>

            {/* Product Specifications Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                Approved Product Specifications
              </h4>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold">
                    <tr>
                      <th className="py-2 px-3">#</th>
                      <th className="py-2 px-3">Product Description</th>
                      <th className="py-2 px-3 text-center">kV</th>
                      <th className="py-2 px-3 text-center">Amp</th>
                      <th className="py-2 px-3 text-center">kA</th>
                      <th className="py-2 px-3 text-center">Duration</th>
                      <th className="py-2 px-3 text-center">Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedPO.products?.map((p, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-bold text-slate-400">{idx + 1}</td>
                        <td className="py-2 px-3 font-semibold text-slate-800">
                          {p.productDescription || p.productName}
                          <span className="block text-[10px] text-slate-400 font-normal">
                            {p.usage} • {p.ebMetering}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center font-mono">{p.kilovolt}</td>
                        <td className="py-2 px-3 text-center font-mono">{p.ampere}</td>
                        <td className="py-2 px-3 text-center font-mono">{p.kiloampere}</td>
                        <td className="py-2 px-3 text-center font-mono">{p.durationSec}</td>
                        <td className="py-2 px-3 text-center font-mono font-bold text-slate-900">{p.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Status Update Form */}
            <form onSubmit={handleUpdateStatus} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="flex items-center space-x-2 text-xs font-black uppercase tracking-wider text-slate-700">
                <RefreshCw className="w-3.5 h-3.5 text-[#EE6F2D]" />
                <span>Update Execution Status</span>
              </div>

              {message && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-semibold">
                  {message}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Production Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="Submitted to PO Team">Submitted to PO Team</option>
                    <option value="Under Technical Review">Under Technical Review</option>
                    <option value="BOM Generation">BOM Generation</option>
                    <option value="Engineering Cleared">Engineering Cleared</option>
                    <option value="Production Handover">Production Handover</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Engineering Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. BOM verified against single-line diagram"
                    value={statusNotes}
                    onChange={(e) => setStatusNotes(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={updatingStatus}
                  className="px-4 py-2 bg-[#1E5BB8] hover:bg-[#174A96] text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {updatingStatus ? 'Updating...' : 'Update Status'}
                </button>
              </div>
            </form>

            {/* Timeline */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">Handover Timeline</h4>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {(selectedPO.timeline || []).map((t, idx) => (
                  <div key={idx} className="p-2 bg-slate-50 rounded-lg border border-slate-200 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800">{t.status}</span>
                      {t.notes && <p className="text-[11px] text-slate-500">{t.notes}</p>}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(t.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

