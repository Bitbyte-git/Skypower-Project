import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertTriangle,
  CircleDot,
  FileText,
  User,
  Calendar,
  Shield,
  Layers,
  ChevronRight,
  ExternalLink,
  Download
} from 'lucide-react';
import { downloadEnquiryPDF } from '../../utils/pdfMakerService';

export const ProjectTrackingTimeline = () => {
  const { trackingId } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin, isManager, isSales } = useAuth();

  const [workflow, setWorkflow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchWorkflow();
  }, [trackingId]);

  const fetchWorkflow = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/project-workflows/${trackingId}`);
      if (res.success && res.workflow) {
        setWorkflow(res.workflow);
      } else {
        setError(res.message || 'Unable to load project tracking record');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error loading workflow');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
        <div className="w-10 h-10 border-4 border-[#1E5BB8] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-600">Loading Department Tracking Timeline...</p>
      </div>
    );
  }

  if (error || !workflow) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center text-xs font-bold text-slate-600 hover:text-slate-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
        </button>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-800">
          <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2" />
          <h3 className="text-base font-bold">Project Workflow Not Found</h3>
          <p className="text-xs text-red-700 mt-1">{error || 'No workflow matching this tracking ID was found.'}</p>
        </div>
      </div>
    );
  }

  const enquiry = workflow.enquiryId || {};
  const client = enquiry.clientId || {};
  const approvals = workflow.approvals || [];
  const history = workflow.history || [];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Accepted':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" /> Accepted
          </span>
        );
      case 'Pending':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-300 animate-pulse">
            <Clock className="w-3 h-3 mr-1 text-blue-600" /> Pending Review
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <AlertTriangle className="w-3 h-3 mr-1 text-rose-600" /> Rejected / Rework
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-300">
            <CircleDot className="w-3 h-3 mr-1 text-slate-400" /> Waiting
          </span>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/departments/workflow')}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-black px-2 py-0.5 rounded bg-blue-600 text-white tracking-wider">
                TRACKING ID
              </span>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                {workflow.projectTrackingId}
              </h1>
              {workflow.overallStatus === 'Completed' && (
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-600 text-white">
                  COMPLETED
                </span>
              )}
            </div>
            <p className="text-xs font-medium text-slate-500 mt-1">
              ERN: <span className="font-bold text-slate-800">{enquiry.ern || 'N/A'}</span> &bull; Current Stage:{' '}
              <span className="font-bold text-blue-700">
                Stage {workflow.currentDepartmentSequence} of 10 ({workflow.currentDepartmentCode})
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 self-end sm:self-auto">
          {/* Quotation PDF: Only downloadable if client details are accessible */}
          {enquiry && client.companyName && (
            <button
              onClick={() => downloadEnquiryPDF(enquiry)}
              className="inline-flex items-center px-3.5 py-2 text-xs font-bold rounded-lg bg-slate-800 hover:bg-slate-900 text-white shadow-sm transition-all"
            >
              <Download className="w-4 h-4 mr-1.5" /> Download Quotation PDF
            </button>
          )}
        </div>
      </div>

      {/* Progress Metric Header */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-xl p-5 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-300">
              Department Approval Progress
            </span>
            <h2 className="text-lg font-black text-white mt-0.5">
              {workflow.completionPercentage}% Workflow Completed
            </h2>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-300 font-medium">Overall Status:</span>
            <div className="text-sm font-black text-orange-400 mt-0.5">
              {workflow.overallStatus}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-700/60 h-3 rounded-full overflow-hidden p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              workflow.overallStatus === 'Completed'
                ? 'bg-emerald-500'
                : workflow.overallStatus.includes('Returned')
                ? 'bg-rose-500'
                : 'bg-gradient-to-r from-blue-500 to-indigo-400'
            }`}
            style={{ width: `${Math.max(5, workflow.completionPercentage)}%` }}
          />
        </div>
      </div>

      {/* Rejection Alert Banner if applicable */}
      {workflow.overallStatus === 'Returned for Sales & Marketing Review' && (
        <div className="bg-rose-50 border-2 border-rose-300 rounded-xl p-4 md:p-5 flex items-start space-x-3.5 text-rose-900">
          <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-rose-900">
                Action Required: Project Returned for Sales & Marketing Rework
              </h3>
              <span className="text-[11px] font-bold text-rose-700">
                Rejected Department: {workflow.lastRejectedDepartmentCode || 'Production'}
              </span>
            </div>
            <p className="mt-1 text-rose-800">
              <strong>Reason:</strong> {workflow.rejectionReason || 'Specifications need amendment.'}
            </p>
            <p className="mt-1 text-rose-700">
              <strong>Remarks:</strong> {workflow.rejectionRemarks || 'Please review technical specs.'}
            </p>
          </div>
        </div>
      )}

      {/* Grid: Project Specifications + 10-Stage Visual Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Project & Technical Details */}
        <div className="space-y-6">
          {/* Project Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center">
              <Layers className="w-4 h-4 text-blue-600 mr-2" /> Project Specifications
            </h3>

            <div className="space-y-2.5 text-xs">
              <div>
                <span className="text-slate-400 font-medium">Project Title:</span>
                <p className="font-bold text-slate-800">
                  {enquiry.project?.projectName || 'HT Switchgear Engineering & Supply'}
                </p>
              </div>

              <div>
                <span className="text-slate-400 font-medium">Segment:</span>
                <p className="font-bold text-slate-800">
                  {enquiry.project?.segment || 'Renewable / Industry'}
                </p>
              </div>

              <div>
                <span className="text-slate-400 font-medium">Standard Type:</span>
                <span className="ml-1 inline-block font-semibold px-2 py-0.5 bg-slate-100 rounded text-slate-700">
                  {enquiry.project?.standardType || 'Standard'}
                </span>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Client Card (Respects Backend Data Masking) */}
            <div>
              <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Client Identification</span>
                {client.companyName === '*** CONFIDENTIAL CLIENT ***' && (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                    Restricted
                  </span>
                )}
              </h4>

              <div className="bg-slate-50 rounded-lg p-3 space-y-1.5 text-xs">
                <p className="font-bold text-slate-900">{client.companyName || 'N/A'}</p>
                <p className="text-slate-600">
                  Contact: <span className="font-medium text-slate-800">{client.contactPerson || 'Protected'}</span>
                </p>
                <p className="text-slate-600">
                  Phone: <span className="font-medium text-slate-800">{client.mobile || 'Protected'}</span>
                </p>
                <p className="text-slate-600">
                  Site: <span className="font-medium text-slate-800">{client.siteAddress || 'Salem Site'}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Products Summary Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Line Items ({enquiry.products?.length || 0})
            </h3>
            <div className="space-y-3">
              {(enquiry.products || []).map((p, idx) => (
                <div key={idx} className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{p.productName || 'VCB Switchboard'}</span>
                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded font-bold text-[10px]">
                      Qty: {p.quantity || 1}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    {p.productDescription || '11kV, 630A, 25kA Outdoor Standalone VCB'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 2 Columns: 10-Stage Sequential Department Timeline */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 md:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  10-Department Sequential Workflow
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sequential progress from Sales & Marketing through Final Installation
                </p>
              </div>
              <span className="text-xs font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                Current: Stage {workflow.currentDepartmentSequence}
              </span>
            </div>

            {/* Vertical 10-Step Timeline */}
            <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {approvals.map((app, index) => {
                const isCurrent = app.departmentSequence === workflow.currentDepartmentSequence;
                const isAccepted = app.status === 'Accepted';
                const isRejected = app.status === 'Rejected';
                const isPending = app.status === 'Pending';

                let iconBg = 'bg-slate-200 text-slate-500';
                if (isAccepted) iconBg = 'bg-emerald-500 text-white ring-4 ring-emerald-100';
                else if (isRejected) iconBg = 'bg-rose-500 text-white ring-4 ring-rose-100';
                else if (isPending) iconBg = 'bg-blue-600 text-white ring-4 ring-blue-100 animate-bounce';

                return (
                  <div key={app._id || index} className="relative flex items-start group">
                    {/* Step Icon */}
                    <div
                      className={`absolute -left-6 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-transform ${iconBg}`}
                    >
                      {isAccepted ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : isRejected ? (
                        <AlertTriangle className="w-3.5 h-3.5" />
                      ) : (
                        <span>{app.departmentSequence}</span>
                      )}
                    </div>

                    {/* Step Content Box */}
                    <div
                      className={`ml-4 flex-1 rounded-xl p-4 border transition-all ${
                        isCurrent
                          ? 'border-blue-400 bg-blue-50/40 shadow-sm'
                          : isRejected
                          ? 'border-rose-300 bg-rose-50/30'
                          : isAccepted
                          ? 'border-emerald-200 bg-emerald-50/20'
                          : 'border-slate-100 bg-white hover:border-slate-200'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-black text-slate-400">
                              STAGE {app.departmentSequence}
                            </span>
                            <h4 className="text-sm font-bold text-slate-900">
                              {app.departmentName}
                            </h4>
                          </div>
                          <span className="text-[11px] font-semibold text-slate-500">
                            Code: {app.departmentCode}
                          </span>
                        </div>
                        <div>{getStatusBadge(app.status)}</div>
                      </div>

                      {/* Review details */}
                      {(app.reviewedAt || app.remarks || app.rejectionReason) && (
                        <div className="mt-3 pt-2.5 border-t border-slate-200/60 text-xs space-y-1">
                          {app.reviewedBy && (
                            <div className="flex items-center text-slate-500 text-[11px]">
                              <User className="w-3 h-3 mr-1" />
                              <span>
                                Reviewed by:{' '}
                                <strong className="text-slate-700">
                                  {app.reviewedBy.name || 'Department Officer'}
                                </strong>
                              </span>
                            </div>
                          )}

                          {app.reviewedAt && (
                            <div className="flex items-center text-slate-400 text-[11px]">
                              <Calendar className="w-3 h-3 mr-1" />
                              <span>{new Date(app.reviewedAt).toLocaleString('en-IN')}</span>
                            </div>
                          )}

                          {app.remarks && (
                            <p className="text-slate-700 font-medium text-[11px] mt-1 bg-white/70 p-2 rounded border border-slate-100">
                              &ldquo;{app.remarks}&rdquo;
                            </p>
                          )}

                          {app.rejectionReason && (
                            <div className="mt-1 p-2 rounded bg-rose-100/70 border border-rose-200 text-rose-900 text-[11px]">
                              <strong>Rejection Reason:</strong> {app.rejectionReason}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chronological Audit Log */}
          {history.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-4">
                Approval Audit Trail ({history.length} Events)
              </h3>
              <div className="space-y-3">
                {history.map((h, i) => (
                  <div key={h._id || i} className="p-3 rounded-lg border border-slate-100 bg-slate-50 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">
                        {h.departmentName} &bull; <span className="text-blue-700">{h.action}</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {new Date(h.createdAt).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px]">{h.remarks}</p>
                    <p className="text-[10px] text-slate-400">
                      By: {h.actionByName || 'System'} ({h.actionByRole || 'USER'})
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

