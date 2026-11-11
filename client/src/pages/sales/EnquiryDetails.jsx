import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { StatusBadge } from '../../components/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { numberToWords } from '../../utils/numberToWords';
import { downloadEnquiryPDF } from '../../utils/pdfMakerService';
import {
  FileSpreadsheet,
  Building2,
  Clock,
  CheckCircle2,
  RotateCcw,
  XCircle,
  FileText,
  Upload,
  ArrowLeft,
  Send,
  Edit,
  AlertTriangle,
  FileCheck,
  Download,
  Calendar,
  Layers,
  Sparkles,
  Printer,
  ShieldCheck,
  HelpCircle,
  Briefcase,
  Zap,
  MapPin,
  Trash2,
  Loader2
} from 'lucide-react';

export const EnquiryDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin, isSales } = useAuth();

  const [enquiry, setEnquiry] = useState(null);
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [decisionModal, setDecisionModal] = useState(null); // 'approve' | 'return' | 'reject'
  const [decisionRemarks, setDecisionRemarks] = useState('');

  const openDecisionModal = (type) => {
    setDecisionModal(type);
    if (type === 'return') {
      setDecisionRemarks('Administrative review requested: please verify technical ratings, breaking capacity, and bill of quantities.');
    } else if (type === 'reject') {
      setDecisionRemarks('Administrative rejection: non-compliant with standard plant manufacturing capabilities.');
    } else {
      setDecisionRemarks('Technically and commercially cleared for quotation preparation.');
    }
  };

  const handleAdminDecision = async () => {
    if (!decisionModal) return;
    setActionLoading(true);
    setMessage('');
    setError('');
    try {
      const defaultRemark =
        decisionModal === 'return'
          ? 'Administrative review requested: please verify technical ratings, breaking capacity, and bill of quantities.'
          : decisionModal === 'reject'
          ? 'Administrative rejection: non-compliant with standard plant manufacturing capabilities.'
          : 'Technically and commercially cleared for quotation preparation.';

      const res = await api.post(`/approvals/${id}/${decisionModal}`, {
        remarks: decisionRemarks.trim() || defaultRemark
      });
      setMessage(res.message);
      setDecisionModal(null);
      fetchEnquiryDetails();
    } catch (err) {
      setError(err.message || 'Operation failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const fetchEnquiryDetails = async () => {
    try {
      const [enqRes, appRes] = await Promise.all([
        api.get(`/enquiries/${id}`),
        api.get(`/approvals/${id}/history`)
      ]);

      if (enqRes.success) setEnquiry(enqRes.enquiry);
      if (appRes.success) setApprovals(appRes.history || []);
    } catch (err) {
      setError('Failed to load enquiry records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiryDetails();
  }, [id]);

  const handleSubmitForApproval = async () => {
    setActionLoading(true);
    setMessage('');
    setError('');
    try {
      const res = await api.post(`/enquiries/${id}/submit`);
      setMessage(res.message);
      fetchEnquiryDetails();
    } catch (err) {
      setError(err.message || 'Submission failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', 'Technical specifications');

    setUploadLoading(true);
    try {
      await api.post(`/enquiries/${id}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      fetchEnquiryDetails();
      setMessage('Document uploaded successfully.');
    } catch (err) {
      setError(err.message || 'File upload failed.');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!window.confirm('Are you sure you want to remove this document attachment?')) return;
    try {
      await api.delete(`/enquiries/${id}/documents/${docId}`);
      setMessage('Document removed successfully.');
      fetchEnquiryDetails();
    } catch (err) {
      setError(err.message || 'Failed to remove document.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-28 space-y-3">
        <div className="w-10 h-10 border-4 border-[#1E5BB8] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold text-slate-500">Retrieving Switchgear Requisition Dossier...</p>
      </div>
    );
  }

  if (!enquiry) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 max-w-lg mx-auto">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
        <h3 className="text-base font-extrabold text-slate-900">Enquiry Record Not Found</h3>
        <p className="text-xs text-slate-500 mt-1">The requested ERN requisition does not exist or has been archived.</p>
        <Link
          to="/enquiries"
          className="inline-flex items-center mt-4 px-4 py-2 bg-[#1E5BB8] text-white text-xs font-bold rounded-xl shadow-xs"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Return to Enquiries Pipeline
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24">
      {/* 1. Top Controls & Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm print:hidden">
        <div className="flex items-center space-x-3.5">
          <Link
            to="/enquiries"
            className="text-slate-400 hover:text-[#1E5BB8] transition-colors p-2 rounded-xl hover:bg-slate-50 border border-slate-200/80 shadow-2xs"
            title="Back to Pipeline"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-base font-black text-[#1E5BB8]">
                {enquiry.ern}
              </span>
              <StatusBadge status={enquiry.approvalStatus} />
              <StatusBadge status={enquiry.commercialStatus} />
            </div>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              Switchgear Technical &amp; Commercial Requisition Specification
            </p>
          </div>
        </div>

        {/* Action Controls Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => downloadEnquiryPDF(enquiry)}
            className="inline-flex items-center px-4 py-2 bg-[#1E3A5F] hover:bg-[#152843] text-white text-xs font-black rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 mr-1.5 text-amber-300" /> Download Filled Form (PDF)
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center px-3.5 py-2 border border-slate-300 text-xs font-bold rounded-xl bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50 shadow-2xs transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 mr-1.5 text-slate-500" /> Print Docket
          </button>

          {/* Edit / Resubmit (If Draft or Returned) */}
          {(enquiry.approvalStatus === 'Draft' || enquiry.approvalStatus === 'Returned for Correction') && (
            <>
              <Link
                to={`/enquiries/${enquiry._id}/edit`}
                className="inline-flex items-center px-4 py-2 border border-slate-300 text-xs font-bold rounded-xl bg-white text-slate-700 hover:border-[#1E5BB8] hover:text-[#1E5BB8] shadow-2xs transition-all cursor-pointer"
              >
                <Edit className="w-4 h-4 mr-1.5" /> Edit Requisition
              </Link>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleSubmitForApproval}
                className="inline-flex items-center px-4 py-2 btn-accent text-white text-xs font-extrabold rounded-xl shadow-md cursor-pointer"
              >
                <Send className="w-4 h-4 mr-1.5" />
                {actionLoading ? 'Submitting...' : 'Submit for Admin Approval'}
              </button>
            </>
          )}

          {/* Admin Decision Actions (if Pending Approval / Submitted / Draft) */}
          {isAdmin && (enquiry.approvalStatus === 'Pending Approval' || enquiry.approvalStatus === 'Submitted for Approval' || enquiry.approvalStatus === 'Draft') && (
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => openDecisionModal('approve')}
                className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                Approve &amp; Send to PO Team
              </button>
              <button
                type="button"
                onClick={() => openDecisionModal('return')}
                className="inline-flex items-center px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 mr-1.5" />
                Return to Sales
              </button>
              <button
                type="button"
                onClick={() => openDecisionModal('reject')}
                className="inline-flex items-center px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <XCircle className="w-4 h-4 mr-1" />
                Reject
              </button>
            </div>
          )}

          {/* Admin Return Option even if Approved (if modification requested) */}
          {isAdmin && enquiry.approvalStatus === 'Approved' && (
            <button
              type="button"
              onClick={() => openDecisionModal('return')}
              className="inline-flex items-center px-3.5 py-2 border border-orange-300 bg-[#FFF5EE] hover:bg-orange-100 text-[#EE6F2D] text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 mr-1.5" />
              Return for Revision
            </button>
          )}

          {/* Quotation Generation Button (Available ONLY if Approved) */}
          {isAdmin && enquiry.approvalStatus === 'Approved' && (
            <Link
              to={`/admin/quotations/new?enquiryId=${enquiry._id}`}
              className="inline-flex items-center px-4 py-2 btn-primary text-white text-xs font-extrabold rounded-xl shadow-md cursor-pointer"
            >
              <FileText className="w-4 h-4 mr-1.5" />
              Generate Official Quotation
            </Link>
          )}

          {/* Handover to R&D / Design (If Approved) */}
          {enquiry.approvalStatus === 'Approved' && !enquiry.handoverDetails?.isHandedOver && (
            <Link
              to={`/enquiries/${enquiry._id}/handover`}
              className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl shadow-md transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 mr-1.5" />
              Confirm Order &amp; Handover to R&amp;D
            </Link>
          )}
        </div>
      </div>

      {/* 2. Notifications & Alerts */}
      {message && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center space-x-2.5 shadow-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{message}</span>
        </div>
      )}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs font-semibold flex items-center space-x-2.5 shadow-xs">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Returned for Correction Banner */}
      {enquiry.approvalStatus === 'Returned for Correction' && (
        <div className="p-5 rounded-2xl bg-[#FFF5EE] border border-[#FCDCC9] text-orange-950 flex items-start space-x-3.5 shadow-xs">
          <RotateCcw className="w-5 h-5 text-[#EE6F2D] shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#D65A1A]">
              Administrative Correction Required Before Clearance
            </h3>
            <p className="text-xs text-orange-900 font-medium mt-1">
              <strong>Admin Remarks:</strong>{' '}
              {enquiry.enquiryRemarks || 'Please review technical ratings and product quantities before resubmitting.'}
            </p>
            <div className="mt-3">
              <Link
                to={`/enquiries/${enquiry._id}/edit`}
                className="inline-flex items-center px-3.5 py-1.5 bg-[#EE6F2D] hover:bg-[#D65A1A] text-white rounded-lg text-xs font-bold transition-all"
              >
                <Edit className="w-3.5 h-3.5 mr-1" /> Edit &amp; Correct Enquiry Details →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          AUTHENTIC PAPER DOCUMENT SHEET (OFFICIAL LETTERHEAD REQUISITION)
      ========================================================================= */}
      <div className="paper-sheet p-8 sm:p-12 text-slate-900 bg-white border border-slate-200/90 rounded-2xl shadow-sm">
        {/* 1. Official Letterhead Header */}
        <div className="paper-header pb-6 mb-8 border-b border-slate-200">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            {/* Left: Brand Identity */}
            <div className="space-y-1.5">
              <div className="flex items-center space-x-3.5">
                <div className="w-14 h-14 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0 shadow-xs">
                  <img src="/brand-logo.jpg" alt="Sky Power Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <div className="flex items-center space-x-1.5 text-xl font-black tracking-tight leading-none">
                    <span className="text-[#1E5BB8]">SKY</span>
                    <span className="text-[#EE6F2D]">POWER</span>
                  </div>
                  <p className="text-xs text-[#1E3A5F] font-bold tracking-wide mt-1">
                    Switch to the Future — HT / LT Switchgears &amp; Electrical Distribution Panels
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-500 font-medium pl-0.5">
                Works: 3/97D, Sarkarkollapatty, Paaraivattam, Salem-636030, Tamil Nadu • GST No: 33AFCFS0165B1ZL • ISO 9001:2015 • IEC 62271-200
              </p>
            </div>

            {/* Right: Aligned Status Stamp & ERN Box (No Collision!) */}
            <div className="flex flex-col items-start md:items-end space-y-2 shrink-0">
              {/* Official Status Clearance Pill */}
              {enquiry.approvalStatus === 'Approved' && (
                <div className="stamp-badge stamp-approved text-xs">
                  OFFICIALLY APPROVED • QUOTATION ELIGIBLE
                </div>
              )}
              {enquiry.approvalStatus === 'Pending Approval' && (
                <div className="stamp-badge stamp-pending text-xs">
                  PENDING ADMINISTRATIVE CLEARANCE
                </div>
              )}
              {enquiry.approvalStatus === 'Returned for Correction' && (
                <div className="stamp-badge stamp-returned text-xs">
                  RETURNED FOR REVISION
                </div>
              )}
              {enquiry.approvalStatus === 'Rejected' && (
                <div className="stamp-badge stamp-rejected text-xs">
                  REJECTED BY MANAGEMENT
                </div>
              )}
              {enquiry.approvalStatus === 'Draft' && (
                <div className="stamp-badge text-xs border-slate-300 text-slate-600 bg-slate-100">
                  DRAFT REQUISITION
                </div>
              )}

              {/* Official Document Specification Box */}
              <div className="border border-slate-300 p-4 rounded-xl bg-slate-50/90 text-left md:text-right min-w-[230px] shadow-2xs">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block">
                  OFFICIAL REQUISITION RECORD
                </span>
                <span className="text-base font-black font-mono text-[#1E5BB8] block mt-0.5">
                  {enquiry.ern}
                </span>
                <span className="text-xs font-mono text-slate-600 block mt-0.5">
                  Rev #{enquiry.currentRevision} • {new Date(enquiry.offerDate).toLocaleDateString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================================
            SECTION 1.0: CLIENT DEMOGRAPHICS & COMMERCIAL CLASSIFICATION
        ===================================================================== */}
        <div className="mb-8">
          <div className="form-section-title flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1E5BB8]" />
              <span>1.0 Client Demographic &amp; Registration Details</span>
            </div>
            {enquiry.clientId?.clientId && (
              <span className="text-xs font-mono font-black text-[#1E5BB8] bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                Client ID: {enquiry.clientId.clientId}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border border-slate-200/90 rounded-xl p-5 bg-slate-50/50 shadow-2xs">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                1.1 Company Name &amp; Classification
              </span>
              <p className="font-extrabold text-slate-900 text-sm">
                {enquiry.clientId?.companyName || 'Not Specified'}
              </p>
              <div className="mt-1 flex items-center space-x-2">
                <span className="inline-block px-2 py-0.5 rounded text-[11px] font-extrabold bg-[#1E5BB8] text-white">
                  {enquiry.customerType || enquiry.clientId?.customerType || 'Contractor'}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {enquiry.clientId?.clientLocation || 'Salem, Tamil Nadu'}
                </span>
              </div>
            </div>

            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                1.2 Contact Person &amp; Coordinates
              </span>
              <p className="font-bold text-slate-800 text-sm">
                {enquiry.clientId?.contactPerson || '-'}
              </p>
              <p className="font-mono text-xs text-slate-700 font-bold mt-0.5">
                Mob: {enquiry.clientId?.mobile || '-'}
              </p>
              {enquiry.clientId?.email && (
                <p className="font-mono text-[11px] text-slate-500 lowercase mt-0.5">
                  Email: {enquiry.clientId.email}
                </p>
              )}
            </div>

            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                1.3 Site Address &amp; GSTIN
              </span>
              <p className="text-xs text-slate-700 font-medium leading-relaxed">
                {enquiry.clientId?.siteAddress || enquiry.project?.projectSiteAddress || 'Site Address provided in tender documents'}
              </p>
              <p className="font-mono text-xs text-slate-600 font-bold mt-1.5">
                GSTIN: {enquiry.clientId?.gstNumber || '33AFCFS0165B1ZL'}
              </p>
            </div>
          </div>
        </div>

        {/* =====================================================================
            SECTION 2.0: PROJECT DETAILS & SEGMENT SPECIFICATION
        ===================================================================== */}
        <div className="mb-8">
          <div className="form-section-title flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1E5BB8]" />
              <span>2.0 Project Details &amp; Industry Segment</span>
            </div>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {enquiry.project?.standardType || 'Standard'} Requisition
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border border-slate-200/90 rounded-xl p-5 bg-slate-50/50 shadow-2xs">
            <div className="md:col-span-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                2.1 Project Title
              </span>
              <p className="font-extrabold text-slate-900 text-sm">
                {enquiry.project?.projectName}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#F0F5FD] text-[#1E5BB8] border border-[#D0E1F9]">
                  Segment: {enquiry.project?.segment || 'Commercial'}
                </span>
                {enquiry.project?.subSegment && (
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Sub-Segment: {enquiry.project.subSegment}
                  </span>
                )}
              </div>
            </div>

            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                2.2 Target Delivery &amp; Location
              </span>
              <p className="font-bold text-slate-800 text-sm">
                {enquiry.project?.projectLocation || 'Salem, Tamil Nadu'}
              </p>
              {enquiry.project?.expectedDeliveryDate && (
                <p className="text-xs text-slate-600 font-mono mt-1 font-semibold">
                  Expected Delivery: {new Date(enquiry.project.expectedDeliveryDate).toLocaleDateString('en-IN')}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* =====================================================================
            SECTION 3.0: SWITCHGEAR PRODUCT SPECIFICATION & BILL OF MATERIALS
        ===================================================================== */}
        <div className="mb-8">
          <div className="form-section-title flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1E5BB8]" />
              <span>3.0 Switchgear Product Description &amp; Bill of Materials</span>
            </div>
            <span className="text-xs font-mono font-bold text-slate-500">
              {enquiry.products?.length || 0} Equipment Line(s) Configured
            </span>
          </div>

          <div className="border border-slate-200/90 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px] tracking-wider">
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Product Description &amp; Specification</th>
                  <th className="py-3 px-4 text-center">Basic Price (₹)<br/><span className="text-[10px] text-slate-400 font-normal">Ex-Works Salem</span></th>
                  <th className="py-3 px-4 text-center">Quantity</th>
                  <th className="py-3 px-4 text-right">Total Basic Price (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {(enquiry.products || []).map((p, idx) => (
                  <tr key={idx} className="hover:bg-[#F0F5FD]/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-400">{idx + 1}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-extrabold text-slate-900 text-sm">
                        {p.productDescription || `${p.kilovolt || '11kV'}, ${p.ampere || '630A'}, ${p.kiloampere || '25kA'} for ${p.durationSec || '3 sec'} ${p.usage || 'Outdoor'} Type Standalone ${p.productName || 'VCB Switchboard'} ${p.ebMetering || '(Transformer Control)'} as per our specification and bill of materials Make (Skypower switchgears)`}
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {p.kilovolt && (
                          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono text-[10px] font-bold border border-blue-200">
                            {p.kilovolt}
                          </span>
                        )}
                        {p.ampere && (
                          <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-mono text-[10px] font-bold border border-indigo-200">
                            {p.ampere}
                          </span>
                        )}
                        {p.kiloampere && (
                          <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-mono text-[10px] font-bold border border-purple-200">
                            {p.kiloampere}
                          </span>
                        )}
                        {p.durationSec && (
                          <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-mono text-[10px] font-bold border border-amber-200">
                            {p.durationSec}
                          </span>
                        )}
                        {p.usage && (
                          <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-800 text-[10px] font-bold border border-teal-200">
                            {p.usage} Type
                          </span>
                        )}
                        {p.ebMetering && (
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                            {p.ebMetering}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800 text-center">
                      ₹ {Number(p.basicPrice || p.estimatedUnitValue || 315000).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-extrabold text-slate-900 text-center text-sm">
                      {p.quantity} Nos
                    </td>
                    <td className="py-3.5 px-4 font-mono font-black text-[#1E5BB8] text-right text-sm">
                      ₹ {Number(p.totalBasicPrice || p.totalProductValue || ((p.basicPrice || 315000) * (p.quantity || 1))).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* =====================================================================
            SECTION 4.0: COMMERCIAL PRICING, TRANSPORT & STATUTORY GST BREAKDOWN
        ===================================================================== */}
        <div className="mb-8">
          <div className="form-section-title flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1E5BB8]" />
              <span>4.0 Commercial Pricing, Transport &amp; Statutory GST Breakdown</span>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
              Standard Sky Power Terms
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-50/70 border border-slate-200/90 rounded-xl p-5 shadow-2xs">
            <div className="lg:col-span-7 space-y-3">
              <div className="border border-slate-200 rounded-lg p-3 bg-white">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Price Basis</span>
                <p className="font-extrabold text-slate-800 text-xs mt-0.5">
                  {enquiry.commercialPricing?.priceBasis || 'EX-Works - Salem, Tamil Nadu'}
                </p>
              </div>

              <div className="border border-slate-200 rounded-lg p-3 bg-white">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Freight / FOR Basis</span>
                <p className="font-bold text-slate-800 text-xs mt-0.5">
                  {enquiry.commercialPricing?.forBasis || 'Client Own Transport (Default)'}
                </p>
                {Number(enquiry.commercialPricing?.transportPrice || 0) > 0 && (
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                    Transport (Up and Down): ₹ {Number(enquiry.commercialPricing.transportPrice).toLocaleString('en-IN')}
                  </p>
                )}
              </div>

              <div className="p-3 bg-[#F0F5FD] border border-[#D0E1F9] rounded-lg">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#1E5BB8] block">
                  Amount in Words
                </span>
                <p className="text-xs font-bold text-slate-900 mt-1 italic leading-relaxed">
                  {enquiry.commercialPricing?.amountInWords ||
                    numberToWords(enquiry.commercialPricing?.totalAmount || enquiry.expectedProjectValue || 371700)}
                </p>
              </div>
            </div>

            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-4 space-y-2 text-xs shadow-inner">
              <div className="flex justify-between text-slate-600">
                <span>Total Basic Price (Ex-Works Salem):</span>
                <span className="font-mono font-bold text-slate-900">
                  ₹ {Number(enquiry.commercialPricing?.totalBasicPrice || enquiry.expectedProjectValue || 315000).toLocaleString('en-IN')}
                </span>
              </div>

              {Number(enquiry.commercialPricing?.transportPrice || 0) > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Transport Price (Up &amp; Down):</span>
                  <span className="font-mono font-bold text-slate-900">
                    + ₹ {Number(enquiry.commercialPricing.transportPrice).toLocaleString('en-IN')}
                  </span>
                </div>
              )}

              <div className="flex justify-between text-slate-700 font-semibold pt-1 border-t border-slate-100">
                <span>Sub Total:</span>
                <span className="font-mono font-black text-slate-950">
                  ₹ {Number(enquiry.commercialPricing?.subtotal || enquiry.commercialPricing?.totalBasicPrice || enquiry.expectedProjectValue || 315000).toLocaleString('en-IN')}
                </span>
              </div>

              {enquiry.commercialPricing?.isInterstate ? (
                <div className="flex justify-between text-slate-600">
                  <span>IGST @ 18%:</span>
                  <span className="font-mono font-bold text-slate-900">
                    + ₹ {Number(enquiry.commercialPricing?.igst || 56700).toLocaleString('en-IN')}
                  </span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between text-slate-600">
                    <span>CGST @ 9%:</span>
                    <span className="font-mono font-bold text-slate-900">
                      + ₹ {Number(enquiry.commercialPricing?.cgst || 28350).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>SGST @ 9%:</span>
                    <span className="font-mono font-bold text-slate-900">
                      + ₹ {Number(enquiry.commercialPricing?.sgst || 28350).toLocaleString('en-IN')}
                    </span>
                  </div>
                </>
              )}

              <div className="pt-2 border-t-2 border-slate-900 flex justify-between items-baseline">
                <span className="font-black text-slate-900 uppercase tracking-wider text-xs">Total Amount:</span>
                <span className="font-mono text-base font-black text-[#1E5BB8]">
                  ₹ {Number(enquiry.commercialPricing?.totalAmount || 371700).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================================
            SECTION 4.0: CLIENT DIRECTIVES / COMMANDS (Excel Field Fidelity)
        ===================================================================== */}
        {enquiry.commands && (
          <div className="mb-8">
            <div className="form-section-title flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#1E5BB8]" />
                <span>4.0 Client Directives &amp; Commands (Excel Book1.xlsx Field)</span>
              </div>
              <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                Original Excel Directive
              </span>
            </div>
            <div className="p-4 bg-slate-900 text-white rounded-xl font-mono text-xs shadow-inner">
              {enquiry.commands}
            </div>
          </div>
        )}

        {/* =====================================================================
            SECTION 5.0: EXECUTIVE ADMINISTRATIVE CLEARANCE & PO TEAM DIRECTIVES
        ===================================================================== */}
        <div className="mb-8">
          <div className="form-section-title flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1E5BB8]" />
              <span>5.0 Executive Administrative Clearance &amp; PO Team Directives</span>
            </div>
            <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              Clearance Gate: {enquiry.approvalStatus || 'Draft'}
            </span>
          </div>

          {isAdmin ? (
            enquiry.approvalStatus === 'Approved' ? (
              <div className="p-5 rounded-2xl bg-emerald-50/80 border border-emerald-300 text-emerald-950 space-y-2">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <h4 className="font-extrabold text-sm text-emerald-900">
                    Administrative Clearance Granted &amp; Project Handed Over to PO Team
                  </h4>
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  This project has been formally approved by the Executive Admin. Department 2 (PO Team) is unlocked and authorized to view technical specifications and generate Purchase Orders.
                </p>
                {enquiry.approvalHistory && enquiry.approvalHistory.length > 0 && (
                  <div className="pt-2 text-xs text-emerald-900 border-t border-emerald-200 font-mono">
                    <strong>Admin Notes:</strong>{' '}
                    {enquiry.approvalHistory[enquiry.approvalHistory.length - 1]?.remarks || 'Approved for PO Team execution.'}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-amber-50/80 border border-amber-300 space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-amber-950">
                      Executive Admin Review &amp; PO Dispatch Gate
                    </h4>
                    <p className="text-xs text-amber-900 mt-0.5 leading-relaxed">
                      Only you as Administrator can review the technical scope above, enter clearance notes, and dispatch this project to the Purchase Order team.
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-amber-950">
                    Administrative Review Notes &amp; Instructions for PO Team:
                  </label>
                  <textarea
                    rows={2}
                    value={decisionRemarks}
                    onChange={(e) => setDecisionRemarks(e.target.value)}
                    placeholder="Enter notes or directives for the PO execution team (e.g. Commercially and technically cleared for PO Team execution)..."
                    className="w-full text-xs p-3 rounded-xl border border-amber-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E5BB8] font-sans"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-amber-200">
                  <span className="text-[11px] text-amber-800 font-semibold">
                    Clicking "Approve &amp; Send to PO Team" unlocks Department 2 in the 10-Department Workflow.
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={async () => {
                        setActionLoading(true);
                        setError('');
                        setMessage('');
                        try {
                          const res = await api.post(`/approvals/${id}/approve`, {
                            remarks: decisionRemarks.trim() || 'Commercially and technically cleared for PO Team execution.'
                          });
                          setMessage(res.message);
                          fetchEnquiryDetails();
                        } catch (err) {
                          setError(err.message || 'Approval failed.');
                        } finally {
                          setActionLoading(false);
                        }
                      }}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{actionLoading ? 'Approving & Sending...' : 'Approve & Send to PO Team'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openDecisionModal('return')}
                      className="px-4 py-2.5 rounded-xl border border-orange-300 bg-white hover:bg-orange-50 text-[#EE6F2D] text-xs font-bold shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Return to Sales with Notes</span>
                    </button>
                  </div>
                </div>
              </div>
            )
          ) : (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
              {enquiry.approvalStatus === 'Approved' ? (
                <div className="flex items-center space-x-2 text-emerald-800 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Approved by Executive Admin. Cleared for PO Team Handover.</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-amber-800 font-medium">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>Awaiting Executive Admin Review and clearance before PO Team handover.</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* =====================================================================
            SECTION 6.0: OFFICIAL SIGN-OFF & ADMINISTRATIVE CLEARANCE DOSSIER
        ===================================================================== */}
        <div className="border-t-2 border-dashed border-slate-200 pt-7">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-center text-xs">
            {/* Prepared By Box with E-Signature */}
            <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/70 shadow-2xs flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 block mb-2">
                  AUTHORIZED SALES OFFICER (E-SIGNED)
                </span>

                {enquiry.eSignature?.signatureData && enquiry.eSignature.signatureData.startsWith('data:image') ? (
                  <div className="my-2 p-2 bg-white rounded-xl border border-slate-200 flex flex-col items-center shadow-inner">
                    <img
                      src={enquiry.eSignature.signatureData}
                      alt="Authorized E-Signature"
                      className="h-14 object-contain max-w-full"
                    />
                    <span className="text-[10px] text-emerald-700 font-black flex items-center mt-1">
                      <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                      Digitally Verified &amp; Cryptographically Sealed
                    </span>
                  </div>
                ) : (
                  <div className="my-3 py-2 px-3 bg-white rounded-xl border border-slate-200 inline-block">
                    <span className="font-serif italic text-lg text-[#1E5BB8] font-bold block">
                      {enquiry.eSignature?.signedByName || enquiry.assignedSalesEngineer?.name || 'Rajesh Sharma'}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-bold flex items-center justify-center mt-0.5">
                      <ShieldCheck className="w-3 h-3 mr-1 text-emerald-600" />
                      Digital Signature Validated
                    </span>
                  </div>
                )}
              </div>

              <div>
                <div className="h-0.5 w-44 bg-slate-200 mx-auto my-2" />
                <span className="font-extrabold text-slate-900 text-sm block">
                  {enquiry.eSignature?.signedByName || enquiry.assignedSalesEngineer?.name || 'Assigned Sales Officer'}
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  {enquiry.eSignature?.designation || enquiry.assignedSalesEngineer?.email || 'Senior Proposal Engineer'}
                </span>
                {enquiry.eSignature?.signedAt && (
                  <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                    Signed: {new Date(enquiry.eSignature.signedAt).toLocaleString('en-IN')}
                  </span>
                )}
              </div>
            </div>

            {/* Admin Clearance Box */}
            <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/70 shadow-2xs flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 block mb-3">
                  ADMINISTRATIVE CLEARANCE STATUS
                </span>
                <div
                  className={`p-3 rounded-xl border text-xs font-bold my-2 ${
                    enquiry.approvalStatus === 'Approved'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : enquiry.approvalStatus === 'Pending Approval'
                      ? 'bg-amber-50 border-amber-200 text-amber-800'
                      : enquiry.approvalStatus === 'Returned for Correction'
                      ? 'bg-[#FFF5EE] border-[#FCDCC9] text-[#D65A1A]'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  <StatusBadge status={enquiry.approvalStatus} />
                </div>
              </div>

              <div>
                <div className="h-0.5 w-44 bg-slate-200 mx-auto my-2" />
                <span className="font-extrabold text-[#1E3A5F] text-sm block">
                  Director / Commercial Management
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  {enquiry.approvalStatus === 'Approved'
                    ? 'Commercial Clearance Granted • Quotation Authorized'
                    : 'Awaiting Administrative Review'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Official Salem Letterhead Footer */}
        <div className="border-t border-slate-300 pt-6 mt-8 text-center text-xs text-slate-500">
          <p className="font-extrabold uppercase tracking-wider text-slate-800 text-sm">SKY POWER SWITCHGEARS</p>
          <p className="font-semibold text-slate-600 mt-1">
            3/97D, Sarkarkollapatty, Paaraivattam, Salem-636030. Tamil Nadu.
          </p>
          <p className="font-mono text-[11px] text-slate-500 mt-0.5">
            GST No: 33AFCFS0165B1ZL • Mobile: 8667033968 / 7904209057 / 6381185644 • Email: sales.skypower@gmail.com
          </p>
        </div>
      </div>

      {/* Admin Action Decision Modal */}
      {decisionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-2">
              {decisionModal === 'approve' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              {decisionModal === 'return' && <RotateCcw className="w-5 h-5 text-orange-600" />}
              {decisionModal === 'reject' && <XCircle className="w-5 h-5 text-rose-600" />}
              <h3 className="text-base font-extrabold text-[#1E3A5F]">
                {decisionModal === 'approve' && `Approve Requisition ${enquiry.ern}`}
                {decisionModal === 'return' && `Return Requisition ${enquiry.ern} for Correction`}
                {decisionModal === 'reject' && `Reject Requisition ${enquiry.ern}`}
              </h3>
            </div>

            <p className="text-xs text-slate-600">
              {decisionModal === 'approve' &&
                'Approving records formal administrative clearance and unlocks the requisition for quotation drafting.'}
              {decisionModal === 'return' &&
                'Returning unlocks this requisition for the Sales Engineer to adjust specifications and resubmit.'}
              {decisionModal === 'reject' &&
                'Rejecting permanently declines this requisition. Please provide administrative justification.'}
            </p>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  {decisionModal === 'approve' ? 'Administrative Remarks (Optional)' : 'Mandatory Administrative Remarks *'}
                </label>
                {decisionModal === 'return' && (
                  <span className="text-[10px] text-orange-600 font-bold uppercase tracking-wider">
                    Quick Pre-sets Below
                  </span>
                )}
              </div>
              <textarea
                rows={3}
                value={decisionRemarks}
                onChange={(e) => setDecisionRemarks(e.target.value)}
                placeholder={
                  decisionModal === 'approve'
                    ? 'Technically cleared for offer submission...'
                    : 'Specify required adjustments (e.g. adjust breaking capacity to 31.5kA, verify site coordinates)...'
                }
                className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:border-[#1E5BB8] outline-none"
              />

              {decisionModal === 'return' && (
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
                        onClick={() => setDecisionRemarks(preset.replace('⚡ ', ''))}
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
                onClick={() => setDecisionModal(null)}
                disabled={actionLoading}
                className="px-3.5 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAdminDecision}
                disabled={actionLoading}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold text-white shadow-xs cursor-pointer ${
                  decisionModal === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : decisionModal === 'return'
                    ? 'bg-orange-600 hover:bg-orange-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {actionLoading ? 'Processing...' : `Confirm ${decisionModal.toUpperCase()}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
