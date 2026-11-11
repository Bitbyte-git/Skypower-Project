import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkflow } from '../../../context/WorkflowContext';
import { useAuth } from '../../../context/AuthContext';
import { downloadEnquiryPDF } from '../../../utils/pdfMakerService';
import {
  CheckCircle2,
  ShieldCheck,
  Download,
  Edit,
  ArrowRight,
  ArrowLeft,
  FileCheck,
  Layers,
  Building2,
  Lock,
  ExternalLink,
  AlertCircle,
  Send,
  Clock
} from 'lucide-react';

export const Step6SendToPOTeam = () => {
  const navigate = useNavigate();
  const {
    enquiryId,
    ern,
    client,
    project,
    products,
    pricing,
    currentVersion,
    poData,
    approvalStatus,
    submitFinalizeToPO,
    submitForAdminApproval,
    approveAsAdmin,
    prevStep,
    goToStep,
    saving,
    error,
    setError
  } = useWorkflow();

  const { isAdmin } = useAuth();
  const [downloading, setDownloading] = useState(false);
  const [approvingAdmin, setApprovingAdmin] = useState(false);
  const [submittingApproval, setSubmittingApproval] = useState(false);
  const isSubmitted = Boolean(poData?.poId);
  const isApproved = approvalStatus === 'Approved';

  const handleAdminApproveNow = async () => {
    setApprovingAdmin(true);
    setError('');
    try {
      await approveAsAdmin('Cleared for PO Handover directly in Step 6');
    } catch (err) {
      // handled in context
    } finally {
      setApprovingAdmin(false);
    }
  };

  const handleRequestApproval = async () => {
    setSubmittingApproval(true);
    setError('');
    try {
      await submitForAdminApproval();
    } catch (err) {
      // handled in context
    } finally {
      setSubmittingApproval(false);
    }
  };

  const handleFinalize = async () => {
    try {
      await submitFinalizeToPO();
    } catch (err) {
      // error handled in context
    }
  };

  const handleDownloadFinalPDF = async () => {
    setDownloading(true);
    try {
      await downloadEnquiryPDF({
        ern: ern || 'ERN-2026-0001',
        clientCustomId: client.clientId || 'SP-CL-2026-0001',
        clientId: client,
        offerDate: new Date(),
        versionId: `${currentVersion} (Final)`,
        project,
        products,
        commercialPricing: pricing
      });
    } catch (err) {
      console.error('Final PDF download failed:', err);
      setError('Could not download final PDF: ' + (err.message || 'Error'));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200/90 overflow-hidden">
      {/* Card Header */}
      <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#FFF5EE] border border-[#FCDCC9] flex items-center justify-center text-[#EE6F2D]">
            <FileCheck className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-[#0A1E3F] tracking-tight">
              {isSubmitted ? 'Offering Sent to PO Team' : 'Finalize & Send to PO Team'}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Step 6: Handover approved offering snapshot to Purchase Order execution team
            </p>
          </div>
        </div>

        {isSubmitted && (
          <span className="text-xs font-mono font-black px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center space-x-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>PO Handover Complete</span>
          </span>
        )}
      </div>

      <div className="p-6 md:p-8 space-y-7 max-w-4xl mx-auto">
        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs font-medium flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isSubmitted ? (
          /* ============================================================
             STATE B: POST-SUBMISSION SUCCESS SCREEN
             ============================================================ */
          <div className="space-y-7 py-4 text-center">
            {/* Big Green Success Circle */}
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="w-20 h-20 rounded-full bg-emerald-100/90 border-4 border-emerald-200 flex items-center justify-center text-emerald-600 shadow-md animate-in zoom-in-75 duration-300">
                <CheckCircle2 className="w-12 h-12" />
              </div>

              <div>
                <h3 className="text-2xl font-black text-[#0A1E3F] tracking-tight">Offering Sent to PO Team</h3>
                <p className="text-xs text-slate-500 font-medium mt-1 max-w-md mx-auto">
                  The final offering has been submitted to the PO Team for PO creation and further processing.
                </p>
              </div>
            </div>

            {/* 3 Identity Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
              {/* PO ID Card */}
              <div className="p-4 rounded-xl border border-orange-200 bg-orange-50/40 space-y-1">
                <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">Generated PO ID</span>
                <p className="text-base font-mono font-black text-[#D95B1B]">{poData.poId || 'PO-2026-0089'}</p>
                <p className="text-[11px] text-slate-500">Unique Purchase Order Code</p>
              </div>

              {/* Client ID Card */}
              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 space-y-1">
                <span className="text-[10px] font-bold text-[#1E5BB8] uppercase tracking-wider">Client ID</span>
                <p className="text-base font-mono font-black text-[#1E5BB8]">{client.clientId || 'SP-CL-2026-0001'}</p>
                <p className="text-[11px] text-slate-500">Locked Client Identifier</p>
              </div>

              {/* Offering Version Card */}
              <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/40 space-y-1">
                <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">Offering Version</span>
                <p className="text-base font-mono font-black text-purple-900">{currentVersion} (Final)</p>
                <p className="text-[11px] text-slate-500">Approved Commercial Baseline</p>
              </div>
            </div>

            {/* Privacy & Technical Scope Notice */}
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-start space-x-3 text-left">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-emerald-950">Enterprise Access Security Policy</h4>
                <p className="text-xs text-emerald-900 leading-relaxed">
                  The PO Team can now view the product details using the <strong>PO ID</strong> and <strong>Client ID</strong>.{' '}
                  <span className="text-emerald-700 font-semibold">(Client name and address are not shared)</span>
                </p>
              </div>
            </div>

            {/* Post-Submission Action Buttons */}
            <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleDownloadFinalPDF}
                disabled={downloading}
                className="px-5 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>{downloading ? 'Downloading...' : 'Download Final PDF'}</span>
              </button>

              <button
                type="button"
                onClick={() => goToStep(5)}
                className="px-5 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5 text-slate-500" />
                <span>Edit (Create New Revision)</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/po/tracking')}
                className="px-6 py-2.5 rounded-lg bg-[#1E5BB8] hover:bg-[#174A96] text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                <span>View PO Tracking</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : !isApproved ? (
          /* ============================================================
             STATE A-1: ADMINISTRATIVE APPROVAL GATE LOCKED
             ============================================================ */
          <div className="space-y-6">
            <div className="p-5 rounded-xl bg-amber-50/90 border border-amber-300 space-y-4">
              <div className="flex items-start space-x-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0 mt-0.5">
                  <Lock className="w-5 h-5" />
                </div>
                <div className="space-y-1 text-left flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-amber-950 uppercase tracking-wide">
                      Administrative Approval Gate Locked
                    </h3>
                    <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-200/80 text-amber-900 border border-amber-300">
                      Status: {approvalStatus || 'Draft'}
                    </span>
                  </div>
                  <p className="text-xs text-amber-900 leading-relaxed">
                    This project requires <strong>Administrative Clearance</strong> before it can be handed over to the Purchase Order team. In accordance with enterprise governance, the PO Team cannot see, access, or process any project until Admin approval is formally granted.
                  </p>
                </div>
              </div>

              {/* Action Banner */}
              <div className="pt-3 border-t border-amber-200 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs font-semibold text-amber-800">
                  {isAdmin
                    ? '⚡ Administrator Access: You have clearance authority to approve this project right now.'
                    : approvalStatus === 'Submitted for Approval' || approvalStatus === 'Pending Approval'
                    ? '⏳ Project has been submitted to Admin. Awaiting clearance review.'
                    : '👉 Submit this enquiry to Admin for formal approval to unlock PO handover.'}
                </p>

                <div className="flex items-center space-x-2">
                  {isAdmin ? (
                    <button
                      type="button"
                      onClick={handleAdminApproveNow}
                      disabled={approvingAdmin}
                      className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{approvingAdmin ? 'Approving...' : 'Approve Project as Admin Now'}</span>
                    </button>
                  ) : approvalStatus === 'Submitted for Approval' || approvalStatus === 'Pending Approval' ? (
                    <div className="px-3.5 py-1.5 rounded-lg bg-amber-100 text-amber-800 text-xs font-bold border border-amber-300 flex items-center space-x-1.5">
                      <Clock className="w-3.5 h-3.5 animate-spin" />
                      <span>Pending Admin Review</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleRequestApproval}
                      disabled={submittingApproval}
                      className="px-4 py-2 rounded-lg bg-[#031D40] hover:bg-[#0A4076] text-white text-xs font-bold shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{submittingApproval ? 'Submitting...' : 'Submit to Admin for Approval'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Scope Summary Preview */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs divide-y divide-slate-100 text-xs">
              <div className="p-4 bg-slate-50 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Client Identifier</span>
                  <p className="text-sm font-mono font-black text-[#1E5BB8]">{client.clientId || 'SP-CL-2026-0001'}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Offering Version</span>
                  <p className="text-sm font-mono font-black text-purple-700">{currentVersion} (Pending Approval)</p>
                </div>
              </div>

              <div className="p-4 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Project Title</span>
                <p className="text-sm font-bold text-[#0A1E3F]">{project.projectName || '11kV VCB Switchboard'}</p>
                <p className="text-xs text-slate-500">
                  Segment: {project.segment} ({project.subSegment}) • Type: {project.standardType}
                </p>
              </div>

              {/* Products List Snapshot */}
              <div className="p-4 space-y-2.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Configured Technical Products ({products.length})
                </span>
                <div className="space-y-1.5">
                  {products.map((p, idx) => (
                    <div
                      key={p.id || idx}
                      className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between"
                    >
                      <div>
                        <span className="font-bold text-slate-800 text-xs">
                          {idx + 1}. {p.productDescription || p.productName}
                        </span>
                        <p className="text-[11px] font-mono text-slate-500">
                          {p.kilovolt} • {p.ampere} • {p.kiloampere} • {p.durationSec} • {p.usage}
                        </p>
                      </div>
                      <span className="font-mono font-bold text-slate-800 text-xs px-2.5 py-0.5 rounded-md bg-white border border-slate-200">
                        Qty: {p.quantity || 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Commercial Total */}
              <div className="p-4 bg-orange-50/50 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-[#EE6F2D] uppercase tracking-wider">Commercial Total</span>
                  <p className="text-xs font-semibold text-slate-600">Subject to Admin Approval</p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-mono font-black text-[#EE6F2D]">
                    ₹ {Number(pricing.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={prevStep}
                className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-sm font-bold hover:bg-slate-50 transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Step 5</span>
              </button>

              <button
                type="button"
                disabled={true}
                title="PO Handover locked until Admin approval is granted"
                className="px-7 py-3 rounded-lg bg-slate-300 text-slate-500 text-sm font-extrabold cursor-not-allowed flex items-center space-x-2"
              >
                <Lock className="w-4 h-4" />
                <span>PO HANDOVER LOCKED (APPROVAL REQUIRED)</span>
              </button>
            </div>
          </div>
        ) : (
          /* ============================================================
             STATE A-2: PRE-SUBMISSION CONFIRMATION SCREEN (APPROVED)
             ============================================================ */
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-300 flex items-start space-x-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-900 leading-relaxed">
                <strong>Administrative Clearance Granted:</strong> This project has been approved by Admin and is cleared for handover. Review the technical scope and final approved values below. Clicking finalize will generate the Purchase Order for the PO execution team.
              </div>
            </div>

            {/* Confirmation Summary Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs divide-y divide-slate-100 text-xs">
              <div className="p-4 bg-slate-50 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Client Identifier</span>
                  <p className="text-sm font-mono font-black text-[#1E5BB8]">{client.clientId || 'SP-CL-2026-0001'}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Offering Version</span>
                  <p className="text-sm font-mono font-black text-purple-700">{currentVersion} (Final Approved)</p>
                </div>
              </div>

              <div className="p-4 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Project Title</span>
                <p className="text-sm font-bold text-[#0A1E3F]">{project.projectName || '11kV VCB Switchboard'}</p>
                <p className="text-xs text-slate-500">
                  Segment: {project.segment} ({project.subSegment}) • Type: {project.standardType}
                </p>
              </div>

              {/* Products List Snapshot */}
              <div className="p-4 space-y-2.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Approved Technical Products ({products.length})
                </span>
                <div className="space-y-1.5">
                  {products.map((p, idx) => (
                    <div
                      key={p.id || idx}
                      className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between"
                    >
                      <div>
                        <span className="font-bold text-slate-800 text-xs">
                          {idx + 1}. {p.productDescription || p.productName}
                        </span>
                        <p className="text-[11px] font-mono text-slate-500">
                          {p.kilovolt} • {p.ampere} • {p.kiloampere} • {p.durationSec} • {p.usage}
                        </p>
                      </div>
                      <span className="font-mono font-bold text-slate-800 text-xs px-2.5 py-0.5 rounded-md bg-white border border-slate-200">
                        Qty: {p.quantity || 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Commercial Total */}
              <div className="p-4 bg-orange-50/50 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-[#EE6F2D] uppercase tracking-wider">Final Approved Amount</span>
                  <p className="text-xs font-semibold text-slate-600">Inclusive of transport &amp; applicable GST</p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-mono font-black text-[#EE6F2D]">
                    ₹ {Number(pricing.totalAmount || 1203600).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={prevStep}
                className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-sm font-bold hover:bg-slate-50 transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={handleFinalize}
                disabled={saving}
                className="px-7 py-3 rounded-lg bg-gradient-to-r from-[#EE6F2D] to-[#D95B1B] hover:from-[#E46220] hover:to-[#C65015] text-white text-sm font-extrabold shadow-lg shadow-orange-500/25 transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                <span>{saving ? 'Finalizing Handover...' : 'FINALIZE & SEND TO PO TEAM'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

