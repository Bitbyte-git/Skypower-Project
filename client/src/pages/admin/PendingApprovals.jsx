import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { StatusBadge } from '../../components/StatusBadge';
import {
  Clock,
  CheckCircle2,
  RotateCcw,
  XCircle,
  Building2,
  FileSpreadsheet,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  FileCheck
} from 'lucide-react';

export const PendingApprovals = () => {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  // Modal states for Return / Reject / Approve
  const [activeModal, setActiveModal] = useState(null); // 'approve' | 'return' | 'reject'
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await api.get('/approvals/pending');
      if (res.success) {
        setEnquiries(res.enquiries || []);
      }
    } catch (err) {
      console.error('Failed to load pending approvals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const openDecisionModal = (enquiry, type) => {
    setSelectedEnquiry(enquiry);
    setActiveModal(type);
    if (type === 'return') {
      setRemarks('Administrative review requested: please verify technical ratings, breaking capacity, and bill of quantities.');
    } else if (type === 'reject') {
      setRemarks('Administrative rejection: non-compliant with standard plant manufacturing capabilities.');
    } else {
      setRemarks('Technically and commercially cleared for quotation preparation.');
    }
    setError('');
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedEnquiry(null);
    setRemarks('');
    setError('');
  };

  const executeDecision = async () => {
    setError('');

    const defaultRemark =
      activeModal === 'return'
        ? 'Administrative review requested: please verify technical ratings, breaking capacity, and bill of quantities.'
        : activeModal === 'reject'
        ? 'Administrative rejection: non-compliant with standard plant manufacturing capabilities.'
        : 'Technically and commercially cleared for quotation preparation.';

    const finalRemarks = remarks.trim() || defaultRemark;

    setActionLoading(true);
    try {
      let endpoint = `/approvals/${selectedEnquiry._id}/${activeModal}`;
      const res = await api.post(endpoint, { remarks: finalRemarks });
      setSuccessMsg(res.message);
      closeModal();
      fetchPending();
    } catch (err) {
      setError(err.message || 'Operation failed.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Administrative Approval Clearance Gateway
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
              {enquiries.length} Awaiting Scrutiny
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Strict corporate gate: Quotations cannot be created until Admin grants technical and commercial approval.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Pending Items List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white p-12 rounded-lg border border-slate-200 text-center text-slate-400">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading pending queue...
          </div>
        ) : enquiries.length === 0 ? (
          <div className="bg-white p-12 rounded-lg border border-slate-200 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-900">All Submitted Enquiries Cleared</h3>
            <p className="text-xs text-slate-500 mt-1">There are no pending enquiries awaiting administrative review.</p>
          </div>
        ) : (
          enquiries.map((enq) => {
            const isExpanded = expandedId === enq._id;
            return (
              <div
                key={enq._id}
                className="bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden hover-lift transition-all"
              >
                {/* Header Summary Row */}
                <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-3">
                      <span className="font-mono font-bold text-sm text-[#1E5BB8]">{enq.ern}</span>
                      <StatusBadge status={enq.approvalStatus} />
                      <span className="text-[11px] font-semibold px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-slate-700">
                        {enq.enquiryType}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-[#1E3A5F]">{enq.project?.projectName}</h3>
                    <p className="text-xs text-slate-500">
                      Client: <strong>{enq.clientId?.companyName}</strong> ({enq.customerType}) • Location: {enq.project?.projectLocation}
                    </p>
                  </div>

                  <div className="flex items-center space-x-4 self-end md:self-center">
                    <div className="text-right">
                      <div className="text-[10px] uppercase font-semibold text-slate-400">Est. Value</div>
                      <div className="text-base font-black font-mono text-[#1E3A5F]">
                        ₹ {Number(enq.expectedProjectValue || 0).toLocaleString('en-IN')}
                      </div>
                    </div>

                    {/* Action Decision Buttons */}
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => openDecisionModal(enq, 'approve')}
                        className="inline-flex items-center px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all hover:-translate-y-0.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approve
                      </button>

                      <button
                        type="button"
                        onClick={() => openDecisionModal(enq, 'return')}
                        className="inline-flex items-center px-3 py-1.5 btn-accent text-white rounded-lg text-xs font-bold shadow-xs transition-all hover:-translate-y-0.5 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5 mr-1" /> Return
                      </button>

                      <button
                        type="button"
                        onClick={() => openDecisionModal(enq, 'reject')}
                        className="inline-flex items-center px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all hover:-translate-y-0.5 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                      </button>

                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : enq._id)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded border border-slate-200"
                        title={isExpanded ? 'Collapse' : 'Expand full details'}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Details Body */}
                {isExpanded && (
                  <div className="p-5 bg-slate-50/50 space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase">Sales Engineer</span>
                        <p className="font-semibold text-slate-800">
                          {enq.assignedSalesEngineer?.name} ({enq.assignedSalesEngineer?.email})
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase">Referred By</span>
                        <p className="font-semibold text-slate-800">{enq.referredBy || 'Direct Client'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase">Enquiry Source</span>
                        <p className="font-semibold text-slate-800">{enq.enquirySource || '-'}</p>
                      </div>
                    </div>

                    {enq.commands && (
                      <div className="p-3 bg-slate-900 text-white rounded font-mono text-[11px]">
                        <span className="text-blue-300 font-bold block mb-0.5">Commands & Directives:</span>
                        {enq.commands}
                      </div>
                    )}

                    {/* Products table */}
                    <div>
                      <h4 className="font-bold text-slate-900 mb-2 uppercase text-[11px]">
                        Equipment Line Items ({enq.products?.length || 0})
                      </h4>
                      <table className="w-full text-left border border-slate-200 rounded bg-white overflow-hidden">
                        <thead>
                          <tr className="bg-slate-100 text-[10px] font-bold text-slate-600 border-b border-slate-200 uppercase">
                            <th className="p-2.5">Item Name</th>
                            <th className="p-2.5">Rating & Specs</th>
                            <th className="p-2.5">Qty</th>
                            <th className="p-2.5">Est. Rate</th>
                            <th className="p-2.5 text-right">Line Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {enq.products?.map((p, idx) => (
                            <tr key={idx}>
                              <td className="p-2.5 font-bold text-slate-800">{p.productName}</td>
                              <td className="p-2.5 text-slate-600">
                                {[p.voltageRating, p.currentRating, p.breakingCapacity].filter(Boolean).join(' | ')}
                              </td>
                              <td className="p-2.5 font-bold">{p.quantity} {p.unit}</td>
                              <td className="p-2.5 font-mono">₹ {Number(p.estimatedUnitValue || 0).toLocaleString('en-IN')}</td>
                              <td className="p-2.5 font-mono font-bold text-right">
                                ₹ {Number(p.totalProductValue || 0).toLocaleString('en-IN')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Decision Modal */}
      {activeModal && selectedEnquiry && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-2">
              {activeModal === 'approve' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              {activeModal === 'return' && <RotateCcw className="w-5 h-5 text-orange-600" />}
              {activeModal === 'reject' && <XCircle className="w-5 h-5 text-rose-600" />}
              <h3 className="text-base font-bold text-slate-900">
                {activeModal === 'approve' && `Approve Enquiry ${selectedEnquiry.ern}`}
                {activeModal === 'return' && `Return Enquiry ${selectedEnquiry.ern} for Correction`}
                {activeModal === 'reject' && `Reject Enquiry ${selectedEnquiry.ern}`}
              </h3>
            </div>

            <p className="text-xs text-slate-600">
              {activeModal === 'approve' &&
                'Approving this enquiry records your Admin clearance and permits quotation generation.'}
              {activeModal === 'return' &&
                'Returning this enquiry unlocks it for editing by Sales. Please specify mandatory corrective remarks below.'}
              {activeModal === 'reject' &&
                'Rejecting this enquiry permanently stops quotation generation. Please enter a mandatory justification.'}
            </p>

            {error && (
              <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  {activeModal === 'approve' ? 'Administrative Remarks (Optional)' : 'Mandatory Administrative Remarks *'}
                </label>
                {activeModal === 'return' && (
                  <span className="text-[10px] text-orange-600 font-bold uppercase tracking-wider">
                    Quick Pre-sets Below
                  </span>
                )}
              </div>
              <textarea
                rows={3}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder={
                  activeModal === 'approve'
                    ? 'Technically cleared for offer submission...'
                    : 'Specify required adjustments (e.g. adjust breaking capacity to 31.5kA, verify site coordinates)...'
                }
                className="w-full p-2.5 text-xs border border-slate-300 rounded focus:border-blue-600 outline-none"
              />

              {activeModal === 'return' && (
                <div className="mt-2 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    1-Click Auto-Fill Return Remarks:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      '⚡ Verify 22kV / 33kV breaking capacity and busbar material.',
                      '⚡ Recalculate bill of quantities & estimated unit valuations.',
                      '⚡ Missing Single Line Diagram (SLD) & client project specs.',
                      '⚡ Confirm outdoor weatherproof canopy rating (IP55).'
                    ].map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setRemarks(preset.replace('⚡ ', ''))}
                        className="text-[10px] font-semibold px-2 py-1 bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-200 rounded-md transition-colors text-left"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={closeModal}
                disabled={actionLoading}
                className="px-3.5 py-1.5 border border-slate-300 rounded text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeDecision}
                disabled={actionLoading}
                className={`px-4 py-1.5 rounded text-xs font-bold text-white shadow-xs ${
                  activeModal === 'approve'
                    ? 'bg-emerald-700 hover:bg-emerald-800'
                    : activeModal === 'return'
                    ? 'bg-orange-600 hover:bg-orange-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {actionLoading ? 'Processing...' : `Confirm ${activeModal.toUpperCase()}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

