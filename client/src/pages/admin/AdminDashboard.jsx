import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { StatusBadge } from '../../components/StatusBadge';
import {
  Users,
  FileSpreadsheet,
  Clock,
  CheckCircle2,
  RotateCcw,
  XCircle,
  FileText,
  IndianRupee,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Zap,
  Settings
} from 'lucide-react';

export const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminDashboard = async () => {
      try {
        const res = await api.get('/dashboard/admin');
        if (res.success) {
          setData(res);
        }
      } catch (err) {
        console.error('Failed to load admin dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-3 border-[#1E5BB8] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const m = data?.metrics || {};

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl font-extrabold text-[#1E3A5F] tracking-tight">Executive Control</h1>
            <span className="text-xs font-bold text-[#EE6F2D] bg-[#FFF5EE] border border-[#FCDCC9] px-2.5 py-0.5 rounded-full">
              Clearance Gate
            </span>
          </div>
          <p className="text-sm font-medium text-slate-500 mt-0.5">Enquiry governance, approvals &amp; commercial quotation control</p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            to="/admin/approvals/pending"
            className="inline-flex items-center px-4 py-2.5 btn-accent text-white text-sm font-bold rounded-lg shadow-sm cursor-pointer"
          >
            <Clock className="w-4 h-4 mr-2" />
            Pending Approvals ({m.pendingApprovals || 0})
          </Link>
          <Link
            to="/admin/settings"
            className="inline-flex items-center px-4 py-2.5 border border-slate-300 text-sm font-semibold rounded-lg bg-white text-slate-700 hover:border-[#1E5BB8] hover:text-[#1E5BB8] transition-all duration-200 shadow-2xs hover:-translate-y-0.5 cursor-pointer"
          >
            <Settings className="w-4 h-4 mr-1.5 text-slate-500" />
            Settings
          </Link>
        </div>
      </div>

      {/* Financial Pipeline Overview with Sleek Hover Effects */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-[#0A101D] to-[#1E3A5F] text-white p-6 rounded-2xl shadow-md hover-lift transition-all cursor-pointer group">
          <div className="flex items-center justify-between text-slate-300 mb-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Total Pipeline Value</span>
            <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-[#EE6F2D]">
              <IndianRupee className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold tracking-tight text-white font-mono">
            ₹ {Number(m.totalPipelineValue || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-xs font-medium text-slate-300 mt-2.5 flex items-center">
            <TrendingUp className="w-4 h-4 mr-1.5 text-emerald-400" />
            <span>Active Switchgear Enquiries</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-950 to-emerald-900 text-white p-6 rounded-2xl shadow-md hover-lift transition-all cursor-pointer group">
          <div className="flex items-center justify-between text-emerald-300 mb-2.5">
            <span className="text-xs font-bold uppercase tracking-wider">Confirmed Orders Won</span>
            <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-emerald-300">
              <Zap className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold tracking-tight text-white font-mono">
            ₹ {Number(m.totalWonValue || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-xs font-medium text-emerald-200 mt-2.5">
            <span>{m.wonEnquiries || 0} Orders Handed Over to R&amp;D</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#174A96] to-[#1E5BB8] text-white p-6 rounded-2xl shadow-md hover-lift transition-all cursor-pointer group">
          <div className="flex items-center justify-between text-blue-200 mb-2.5">
            <span className="text-xs font-bold uppercase tracking-wider">Quotation Coverage</span>
            <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-white">
              <FileText className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold tracking-tight text-white font-mono">
            {m.totalQuotations || 0} Offers
          </div>
          <div className="text-xs font-medium text-blue-100 mt-2.5">
            <span>Admin-Approved Commercial Tenders</span>
          </div>
        </div>
      </div>

      {/* Approval Lifecycle Pipeline Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <Link
          to="/admin/approvals/pending"
          className="bg-white p-4 rounded-xl border border-amber-200/80 shadow-xs hover-lift flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between text-amber-700 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Pending Review</span>
            <Clock className="w-4 h-4 text-amber-500 group-hover:rotate-45 transition-transform" />
          </div>
          <div className="text-2xl font-black text-amber-800 font-mono">
            {m.pendingApprovals || 0}
          </div>
          <div className="text-[10px] text-amber-600 mt-1">Requires your clearance →</div>
        </Link>

        <Link
          to="/admin/enquiries/approved"
          className="bg-white p-4 rounded-xl border border-emerald-200/80 shadow-xs hover-lift flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between text-emerald-700 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Approved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-emerald-800 font-mono">
            {m.approvedEnquiries || 0}
          </div>
          <div className="text-[10px] text-emerald-600 mt-1">Quotation eligible →</div>
        </Link>

        <Link
          to="/admin/enquiries/returned"
          className="bg-white p-4 rounded-xl border border-[#FCDCC9] shadow-xs hover-lift-orange flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between text-[#D65A1A] mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Returned</span>
            <RotateCcw className="w-4 h-4 text-[#EE6F2D] group-hover:-rotate-90 transition-transform" />
          </div>
          <div className="text-2xl font-black text-[#D65A1A] font-mono">
            {m.returnedEnquiries || 0}
          </div>
          <div className="text-[10px] text-[#EE6F2D] mt-1">With sales for correction →</div>
        </Link>

        <Link
          to="/admin/enquiries/rejected"
          className="bg-white p-4 rounded-xl border border-rose-200/80 shadow-xs hover-lift flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between text-rose-700 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Rejected</span>
            <XCircle className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-rose-800 font-mono">
            {m.rejectedEnquiries || 0}
          </div>
          <div className="text-[10px] text-rose-600 mt-1">Declined requisitions →</div>
        </Link>
      </div>

      {/* Urgent Pending Approvals Queue */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden hover-lift transition-all">
        <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#EE6F2D] animate-pulse" />
              <h2 className="text-base font-extrabold text-[#1E3A5F]">Immediate Action Clearance Queue</h2>
              <span className="text-xs font-bold text-[#EE6F2D] bg-[#FFF5EE] px-2.5 py-0.5 rounded-full border border-[#FCDCC9]">
                {m.pendingApprovals || 0} Pending
              </span>
            </div>
            <p className="text-xs font-medium text-slate-500 mt-1">
              Switchgear project enquiries awaiting administrative gate review
            </p>
          </div>
          <Link
            to="/admin/approvals/pending"
            className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold text-[#1E5BB8] hover:bg-[#F0F5FD] border border-[#D0E1F9] transition-all self-start sm:self-auto shadow-2xs cursor-pointer"
          >
            <span>Review Full Queue ({m.pendingApprovals || 0})</span>
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
                <th className="py-4 px-5">Sales Officer</th>
                <th className="py-4 px-5 text-right">Gate Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {(data?.urgentPending || []).length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-sm">
                    No enquiries pending administrative clearance. All gates clear!
                  </td>
                </tr>
              ) : (
                data.urgentPending.map((enq) => (
                  <tr
                    key={enq._id}
                    className="hover:bg-[#F0F5FD]/60 transition-colors duration-150 group cursor-pointer"
                  >
                    <td className="py-4 px-5 font-mono font-black text-sm text-[#1E5BB8]">
                      <Link to={`/enquiries/${enq._id}`} className="hover:underline">
                        {enq.ern}
                      </Link>
                    </td>
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
                    <td className="py-4 px-5 max-w-xs">
                      <div className="font-extrabold text-slate-800 text-sm truncate">
                        {enq.project?.projectName || 'Project Not Named'}
                      </div>
                      <div className="text-xs text-slate-500 truncate mt-0.5">
                        {enq.project?.projectScope || enq.project?.projectLocation || 'HT/LT Engineering Supply'}
                      </div>
                    </td>
                    <td className="py-4 px-5 font-mono font-black text-base text-[#1E3A5F]">
                      ₹ {Number(enq.expectedProjectValue || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-4 px-5 text-slate-700 text-xs font-semibold">
                      {enq.assignedSalesEngineer?.name || enq.salesPersonId?.name || 'Sales Officer'}
                    </td>
                    <td className="py-4 px-5 text-right">
                      <Link
                        to={`/enquiries/${enq._id}`}
                        className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-black btn-accent text-white shadow-md transition-all duration-200"
                      >
                        <span>Review &amp; Clear Gate</span>
                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
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
