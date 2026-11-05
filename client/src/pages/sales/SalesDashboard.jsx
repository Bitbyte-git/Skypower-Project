import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { StatusBadge } from '../../components/StatusBadge';
import {
  FileSpreadsheet,
  Clock,
  CheckCircle2,
  RotateCcw,
  Trophy,
  FilePlus2,
  CalendarClock,
  ArrowRight,
  TrendingUp,
  FileText,
  UserPlus,
  ArrowUpRight,
  Zap,
  Building2
} from 'lucide-react';

export const SalesDashboard = () => {
  const [data, setData] = useState(null);
  const [returnedWorkflows, setReturnedWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resubmittingId, setResubmittingId] = useState(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const [salesRes, returnedRes] = await Promise.all([
        api.get('/dashboard/sales'),
        api.get('/project-workflows', {
          params: { status: 'Returned for Sales & Marketing Review' }
        }).catch(() => ({ success: false, workflows: [] }))
      ]);

      if (salesRes.success) {
        setData(salesRes);
      }
      if (returnedRes.success) {
        setReturnedWorkflows(returnedRes.workflows || []);
      }
    } catch (err) {
      console.error('Failed to load sales dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResubmit = async (workflow) => {
    const remarks = prompt(
      `Enter rework notes for ${workflow.projectTrackingId} (e.g. "Specifications corrected per department remarks"):`,
      'Rework verified and updated per department comments.'
    );
    if (!remarks) return;

    try {
      setResubmittingId(workflow._id);
      const res = await api.post(`/project-workflows/${workflow._id}/sales-resubmit`, {
        remarks
      });
      if (res.success) {
        alert(`Project ${workflow.projectTrackingId} resubmitted for Manager Review!`);
        fetchDashboard();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Resubmit failed');
    } finally {
      setResubmittingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-28 space-y-3">
        <div className="w-10 h-10 border-4 border-[#1E5BB8] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold text-slate-500">Loading Sales Operations Intelligence...</p>
      </div>
    );
  }

  const m = data?.metrics || {};

  return (
    <div className="space-y-7 max-w-7xl mx-auto pb-20">
      {/* 1. Header with Minimal Punchy Text */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl font-black text-[#1E3A5F] tracking-tight">Sales Operations</h1>
            <span className="text-xs font-bold text-[#1E5BB8] bg-[#F0F5FD] border border-[#D0E1F9] px-3 py-0.5 rounded-full">
              Live Pipeline
            </span>
          </div>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Switchgear enquiry pipeline, approval clearances, and customer orders
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            to="/clients/new"
            className="inline-flex items-center px-4 py-2.5 border border-slate-300 text-xs font-bold rounded-xl bg-white text-slate-700 hover:border-[#1E5BB8] hover:text-[#1E5BB8] transition-all shadow-2xs hover:-translate-y-0.5 cursor-pointer"
          >
            <UserPlus className="w-4 h-4 mr-2 text-slate-500" />
            New Client Master
          </Link>
          <Link
            to="/enquiries/new"
            className="inline-flex items-center px-4 py-2.5 btn-accent text-white text-xs font-black rounded-xl shadow-md cursor-pointer"
          >
            <FilePlus2 className="w-4 h-4 mr-2" />
            New Enquiry Requisition
          </Link>
        </div>
      </div>

      {/* 2. KPI Cards Grid with Interactive Hover-Lift */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Enquiries */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover-lift cursor-pointer group relative overflow-hidden">
          <div className="w-1.5 h-full bg-[#1E5BB8] absolute left-0 top-0" />
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-600">My Enquiries</span>
            <FileSpreadsheet className="w-4 h-4 text-slate-400 group-hover:text-[#1E5BB8] transition-colors" />
          </div>
          <div className="text-3xl font-black text-slate-900 group-hover:text-[#1E5BB8] transition-colors font-mono">
            {m.myEnquiries || 0}
          </div>
          <div className="text-xs font-semibold text-slate-400 mt-1.5">Total created</div>
        </div>

        {/* Drafts */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover-lift cursor-pointer group relative overflow-hidden">
          <div className="w-1.5 h-full bg-slate-400 absolute left-0 top-0" />
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-600">Drafts</span>
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400 group-hover:bg-slate-600 transition-colors" />
          </div>
          <div className="text-3xl font-black text-slate-800 font-mono">
            {m.drafts || 0}
          </div>
          <div className="text-xs font-semibold text-slate-400 mt-1.5">In progress</div>
        </div>

        {/* Pending Approval */}
        <div className="bg-white p-5 rounded-2xl border border-amber-300 shadow-xs hover-lift cursor-pointer group relative overflow-hidden">
          <div className="w-1.5 h-full bg-amber-500 absolute left-0 top-0" />
          <div className="flex items-center justify-between text-amber-700 mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-amber-800">Pending Gate</span>
            <Clock className="w-4 h-4 text-amber-600 group-hover:rotate-45 transition-transform" />
          </div>
          <div className="text-3xl font-black text-amber-800 font-mono">
            {m.pending || 0}
          </div>
          <div className="text-xs font-bold text-amber-700 mt-1.5">Admin review</div>
        </div>

        {/* Approved */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-300 shadow-xs hover-lift cursor-pointer group relative overflow-hidden">
          <div className="w-1.5 h-full bg-emerald-600 absolute left-0 top-0" />
          <div className="flex items-center justify-between text-emerald-700 mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-800">Approved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-3xl font-black text-emerald-800 font-mono">
            {m.approved || 0}
          </div>
          <div className="text-xs font-bold text-emerald-700 mt-1.5">Ready for quote</div>
        </div>

        {/* Returned */}
        <div className="bg-white p-5 rounded-2xl border border-[#FCDCC9] shadow-xs hover-lift-orange cursor-pointer group relative overflow-hidden">
          <div className="w-1.5 h-full bg-[#EE6F2D] absolute left-0 top-0" />
          <div className="flex items-center justify-between text-[#D65A1A] mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-[#EE6F2D]">Returned</span>
            <RotateCcw className="w-4 h-4 text-[#EE6F2D] group-hover:-rotate-90 transition-transform" />
          </div>
          <div className="text-3xl font-black text-[#D65A1A] font-mono">
            {m.returned || 0}
          </div>
          <div className="text-xs font-bold text-[#EE6F2D] mt-1.5">Needs action</div>
        </div>

        {/* Orders Won */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs hover-lift cursor-pointer group relative overflow-hidden">
          <div className="w-1.5 h-full bg-emerald-700 absolute left-0 top-0" />
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-800">Orders Won</span>
            <Trophy className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-3xl font-black text-emerald-800 font-mono">
            {m.won || 0}
          </div>
          <div className="text-xs font-bold text-emerald-700 mt-1.5">To production</div>
        </div>
      </div>

      {/* 3. Quick Action Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/followups?filter=today"
          className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover-lift flex items-center justify-between group transition-all"
        >
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#F0F5FD] text-[#1E5BB8] flex items-center justify-center group-hover:bg-[#1E5BB8] group-hover:text-white transition-colors duration-200 shadow-2xs">
              <CalendarClock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold">Today's Schedule</p>
              <h3 className="text-base font-extrabold text-[#1E3A5F] mt-0.5">
                {m.todayFollowups || 0} Follow-ups Due
              </h3>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#1E5BB8] group-hover:translate-x-1 transition-all" />
        </Link>

        <Link
          to="/followups?filter=upcoming"
          className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover-lift flex items-center justify-between group transition-all"
        >
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors duration-200 shadow-2xs">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold">Upcoming Pipeline</p>
              <h3 className="text-base font-extrabold text-[#1E3A5F] mt-0.5">
                {m.upcomingFollowups || 0} Scheduled
              </h3>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
        </Link>

        <Link
          to="/quotations"
          className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover-lift flex items-center justify-between group transition-all"
        >
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#FFF5EE] text-[#EE6F2D] flex items-center justify-center group-hover:bg-[#EE6F2D] group-hover:text-white transition-colors duration-200 shadow-2xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold">Commercial Offers</p>
              <h3 className="text-base font-extrabold text-[#1E3A5F] mt-0.5">
                {m.quotations || 0} Issued Offers
              </h3>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#EE6F2D] group-hover:translate-x-1 transition-all" />
        </Link>
      </div>

      {/* 3.5 RETURNED PROJECTS / REWORK REQUIRED */}
      {returnedWorkflows.length > 0 && (
        <div className="bg-rose-50/80 border-2 border-rose-300 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-rose-200">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-rose-600 animate-ping" />
              <h2 className="text-sm font-black text-rose-900 uppercase tracking-wider">
                Returned Projects / Rework Required ({returnedWorkflows.length})
              </h2>
            </div>
            <span className="text-[11px] font-bold text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full border border-rose-300">
              Action Required: Correct Specifications & Resubmit
            </span>
          </div>

          <div className="space-y-3">
            {returnedWorkflows.map((rw) => {
              const enq = rw.enquiryId || {};
              const client = enq.clientId || {};

              return (
                <div
                  key={rw._id}
                  className="bg-white rounded-xl p-4 border border-rose-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-black text-slate-900 px-2 py-0.5 rounded bg-slate-100">
                        {rw.projectTrackingId}
                      </span>
                      <span className="text-xs font-bold text-blue-700">ERN: {enq.ern}</span>
                      <span className="text-[11px] font-bold text-rose-700 px-2 py-0.5 rounded bg-rose-50 border border-rose-200">
                        Rejected by: {rw.lastRejectedDepartmentCode || 'Department'}
                      </span>
                    </div>

                    <p className="text-xs font-bold text-slate-800">
                      {client.companyName} &bull; {enq.project?.projectName}
                    </p>

                    <div className="text-xs text-rose-900 bg-rose-50 p-2 rounded-lg border border-rose-100 mt-1">
                      <p>
                        <strong>Reason:</strong> {rw.rejectionReason}
                      </p>
                      <p className="mt-0.5">
                        <strong>Remarks:</strong> {rw.rejectionRemarks}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 self-end md:self-auto shrink-0">
                    <Link
                      to={`/projects/tracking/${rw.projectTrackingId}`}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50"
                    >
                      View Timeline
                    </Link>

                    <Link
                      to={`/enquiries/${enq._id}/edit`}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold"
                    >
                      Edit Requisition
                    </Link>

                    <button
                      onClick={() => handleResubmit(rw)}
                      disabled={resubmittingId === rw._id}
                      className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors"
                    >
                      {resubmittingId === rw._id ? 'Resubmitting...' : 'Resubmit for Review'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. MASTER RECENT ENQUIRIES SECTION (High-Density Engineering UI) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden hover-lift transition-all">
        <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1E5BB8]" />
              <h2 className="text-base font-extrabold text-[#1E3A5F]">Recent Project Enquiries</h2>
              <span className="text-xs font-bold text-[#1E5BB8] bg-[#F0F5FD] px-2.5 py-0.5 rounded-full border border-[#D0E1F9]">
                {data?.recentEnquiries?.length || 0} Recent
              </span>
            </div>
            <p className="text-xs font-medium text-slate-500 mt-1">
              Active switchgear requisitions in your marketing &amp; sales pipeline
            </p>
          </div>
          <Link
            to="/enquiries"
            className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold text-[#1E5BB8] hover:bg-[#F0F5FD] border border-[#D0E1F9] transition-all self-start sm:self-auto shadow-2xs cursor-pointer"
          >
            <span>View All Enquiries</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-bold uppercase text-xs tracking-wider">
                <th className="py-4 px-5">ERN Docket</th>
                <th className="py-4 px-5">Client / Buyer Entity</th>
                <th className="py-4 px-5">Substation Project Scope</th>
                <th className="py-4 px-5">Estimated Value</th>
                <th className="py-4 px-5">Admin Approval Gate</th>
                <th className="py-4 px-5">Commercial Status</th>
                <th className="py-4 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {(data?.recentEnquiries || []).length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-sm">
                    No enquiries recorded yet. Click "New Enquiry Requisition" to begin.
                  </td>
                </tr>
              ) : (
                data.recentEnquiries.map((enq) => (
                  <tr
                    key={enq._id}
                    className="hover:bg-[#F0F5FD]/60 transition-colors duration-150 group cursor-pointer"
                  >
                    {/* ERN Docket */}
                    <td className="py-4 px-5">
                      <Link
                        to={`/enquiries/${enq._id}`}
                        className="font-mono font-black text-sm text-[#1E5BB8] hover:underline flex items-center space-x-1.5"
                      >
                        <span>{enq.ern}</span>
                      </Link>
                      <span className="text-[11px] font-mono text-slate-400 block mt-0.5">
                        {new Date(enq.offerDate || enq.createdAt).toLocaleDateString('en-IN')}
                      </span>
                    </td>

                    {/* Client Legal Entity */}
                    <td className="py-4 px-5">
                      <div className="font-bold text-slate-900 text-sm">
                        {enq.clientId?.companyName || 'Not Specified'}
                      </div>
                      <div className="text-xs text-slate-500 font-medium mt-0.5 flex items-center space-x-1.5">
                        <span>{enq.clientId?.clientLocation || '-'}</span>
                        {(enq.customerType || enq.clientId?.customerType) && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span className="text-[#1E5BB8] font-semibold">
                              {enq.customerType || enq.clientId?.customerType}
                            </span>
                          </>
                        )}
                      </div>
                    </td>

                    {/* Substation Project */}
                    <td className="py-4 px-5 max-w-xs">
                      <div className="font-extrabold text-slate-800 text-sm truncate">
                        {enq.project?.projectName || 'Project Not Named'}
                      </div>
                      <div className="text-xs text-slate-500 truncate mt-0.5">
                        {enq.project?.projectScope || enq.project?.projectLocation || 'HT/LT Engineering Supply'}
                      </div>
                    </td>

                    {/* Estimated Value */}
                    <td className="py-4 px-5 font-mono font-black text-base text-[#1E3A5F]">
                      ₹ {Number(enq.expectedProjectValue || 0).toLocaleString('en-IN')}
                    </td>

                    {/* Admin Approval Gate */}
                    <td className="py-4 px-5">
                      <StatusBadge status={enquiryApprovalLabel(enq.approvalStatus)} />
                    </td>

                    {/* Commercial Status */}
                    <td className="py-4 px-5">
                      <StatusBadge status={enq.commercialStatus} />
                    </td>

                    {/* Action Button */}
                    <td className="py-4 px-5 text-right">
                      <Link
                        to={`/enquiries/${enq._id}`}
                        className="inline-flex items-center px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#F0F5FD] hover:bg-[#1E5BB8] text-[#1E5BB8] hover:text-white border border-[#D0E1F9] hover:border-[#1E5BB8] shadow-2xs transition-all duration-200 group-hover:shadow-xs"
                      >
                        <span>View Docket</span>
                        <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                      </Link>
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

const enquiryApprovalLabel = (status) => {
  return status || 'Draft';
};
