import React, { useState, useEffect } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import api from '../../api/client';
import { StatusBadge } from '../../components/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import {
  FileSpreadsheet,
  Search,
  Plus,
  Filter,
  ArrowRight,
  ArrowUpRight,
  FileText,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles
} from 'lucide-react';

export const EnquiriesList = ({ presetStatus = '' }) => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { isAdmin } = useAuth();
  const isGlobalView = searchParams.get('view') === 'all';

  // Determine active status filter from preset prop, pathname, or query param
  let resolvedStatus = presetStatus;
  let pageTitle = 'Enquiries Pipeline';
  let pageSubtitle = 'Switchgear project requisitions & approval lifecycle';
  let isDedicatedQueue = false;
  let badgeTheme = 'bg-[#F0F5FD] text-[#1E5BB8] border-[#D0E1F9]';

  if (
    location.pathname.includes('/admin/enquiries/approved') ||
    presetStatus === 'Approved' ||
    searchParams.get('status') === 'approved'
  ) {
    resolvedStatus = 'Approved';
    pageTitle = 'Approved Enquiries Master';
    pageSubtitle = 'Authorized switchgear project requisitions eligible for official commercial quotation';
    isDedicatedQueue = true;
    badgeTheme = 'bg-emerald-50 text-emerald-800 border-emerald-300';
  } else if (
    location.pathname.includes('/admin/enquiries/returned') ||
    presetStatus === 'Returned for Correction' ||
    searchParams.get('status') === 'returned'
  ) {
    resolvedStatus = 'Returned for Correction';
    pageTitle = 'Returned Enquiries for Revision';
    pageSubtitle = 'Requisitions returned to Sales Engineers for technical or commercial revision';
    isDedicatedQueue = true;
    badgeTheme = 'bg-[#FFF5EE] text-[#EE6F2D] border-[#FCDCC9]';
  } else if (
    location.pathname.includes('/admin/enquiries/rejected') ||
    presetStatus === 'Rejected' ||
    searchParams.get('status') === 'rejected'
  ) {
    resolvedStatus = 'Rejected';
    pageTitle = 'Rejected Enquiries Archive';
    pageSubtitle = 'Declined switchgear requisitions archived from active pipeline';
    isDedicatedQueue = true;
    badgeTheme = 'bg-rose-50 text-rose-800 border-rose-300';
  } else if (
    location.search.includes('status=pending') ||
    searchParams.get('status') === 'pending'
  ) {
    resolvedStatus = 'Pending Approval';
    pageTitle = 'Pending Approval Gate Queue';
    pageSubtitle = 'Requisitions awaiting administrative clearance decision';
    isDedicatedQueue = true;
    badgeTheme = 'bg-amber-50 text-amber-800 border-amber-300';
  } else if (isGlobalView || isAdmin) {
    pageTitle = 'All Project Enquiries';
    pageSubtitle = 'Global switchgear requisitions repository across all plant divisions';
  }

  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(resolvedStatus);
  const [commercialFilter, setCommercialFilter] = useState('');

  // Re-synchronize filter whenever route changes
  useEffect(() => {
    setStatusFilter(resolvedStatus);
  }, [location.pathname, location.search, presetStatus]);

  const fetchEnquiries = async () => {
    setLoading(true);
    try {
      const activeApprovalStatus = isDedicatedQueue ? resolvedStatus : (statusFilter === 'all' ? '' : statusFilter);
      const params = {
        search,
        approvalStatus: activeApprovalStatus,
        commercialStatus: commercialFilter,
        view: isGlobalView || isAdmin ? 'all' : 'my'
      };
      const res = await api.get('/enquiries', { params });
      if (res.success) {
        let items = res.enquiries || [];
        // Strict client-side guarantee: If on dedicated queue or status filtered, strictly enforce status match!
        if (activeApprovalStatus) {
          items = items.filter((e) => e.approvalStatus === activeApprovalStatus);
        }
        setEnquiries(items);
      }
    } catch (err) {
      console.error('Failed to load enquiries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchEnquiries();
    }, 200);
    return () => clearTimeout(timeout);
  }, [search, statusFilter, commercialFilter, isGlobalView, location.pathname, resolvedStatus]);

  const displayedEnquiries = enquiries.filter((enq) => {
    if (isDedicatedQueue && resolvedStatus) {
      return enq.approvalStatus === resolvedStatus;
    }
    if (statusFilter && statusFilter !== 'all') {
      return enq.approvalStatus === statusFilter;
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      {/* 1. Header with Dynamic Title, Count Badge and Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-black text-[#1E3A5F] tracking-tight">{pageTitle}</h1>
            <span
              className={`text-xs font-mono font-bold px-3 py-0.5 rounded-full border shadow-2xs ${badgeTheme}`}
            >
              {displayedEnquiries.length} {isDedicatedQueue ? resolvedStatus : 'Records'}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">{pageSubtitle}</p>
        </div>

        <Link
          to="/enquiries/new"
          className="inline-flex items-center px-4 py-2.5 btn-accent text-white text-xs font-black rounded-xl shadow-md self-start sm:self-auto cursor-pointer transition-all hover:scale-105"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          New Enquiry Requisition
        </Link>
      </div>

      {/* 2. Quick Queue Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/80 pb-3">
        <Link
          to={isAdmin ? '/enquiries?view=all' : '/enquiries'}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs ${
            !isDedicatedQueue && !statusFilter
              ? 'bg-[#1E5BB8] text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          All Requisitions
        </Link>
        <Link
          to="/enquiries?status=pending"
          className={`inline-flex items-center px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs ${
            resolvedStatus === 'Pending Approval'
              ? 'bg-amber-500 text-white shadow-sm'
              : 'bg-white text-amber-800 hover:bg-amber-50 border border-amber-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5 mr-1.5" />
          Pending Approvals
        </Link>
        <Link
          to={isAdmin ? '/admin/enquiries/returned' : '/enquiries?status=returned'}
          className={`inline-flex items-center px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs ${
            resolvedStatus === 'Returned for Correction'
              ? 'bg-[#EE6F2D] text-white shadow-sm'
              : 'bg-white text-orange-800 hover:bg-orange-50 border border-orange-200'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
          Returned for Revision
        </Link>
        <Link
          to={isAdmin ? '/admin/enquiries/approved' : '/enquiries?status=approved'}
          className={`inline-flex items-center px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs ${
            resolvedStatus === 'Approved'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white text-emerald-800 hover:bg-emerald-50 border border-emerald-200'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
          Approved Enquiries
        </Link>
        <Link
          to={isAdmin ? '/admin/enquiries/rejected' : '/enquiries?status=rejected'}
          className={`inline-flex items-center px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs ${
            resolvedStatus === 'Rejected'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'bg-white text-rose-800 hover:bg-rose-50 border border-rose-200'
          }`}
        >
          <XCircle className="w-3.5 h-3.5 mr-1.5" />
          Rejected
        </Link>
      </div>

      {/* 3. Filter / Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ERN (e.g. ERN-2026-0001), client legal name, project site..."
            className="w-full pl-10 pr-4 py-2.5 text-xs font-medium border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1E5BB8]/15 focus:border-[#1E5BB8] outline-none transition-all shadow-2xs"
          />
        </div>

        {/* Status Dropdown (Locked if on dedicated status page) */}
        {!isDedicatedQueue ? (
          <div className="w-full sm:w-52">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full py-2.5 px-3.5 text-xs font-bold border border-slate-300 rounded-xl bg-white text-slate-700 focus:ring-2 focus:ring-[#1E5BB8]/15 focus:border-[#1E5BB8] outline-none transition-all shadow-2xs cursor-pointer"
            >
              <option value="">All Approval Stages</option>
              <option value="Draft">Draft</option>
              <option value="Pending Approval">Pending Approval</option>
              <option value="Approved">Approved</option>
              <option value="Returned for Correction">Returned for Correction</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        ) : (
          <div className="w-full sm:w-56 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 flex items-center justify-between">
            <span className="text-slate-400 font-semibold">Queue:</span>
            <span className="text-[#1E5BB8] font-extrabold">{resolvedStatus}</span>
          </div>
        )}

        {/* Commercial Filter */}
        <div className="w-full sm:w-52">
          <select
            value={commercialFilter}
            onChange={(e) => setCommercialFilter(e.target.value)}
            className="w-full py-2.5 px-3.5 text-xs font-bold border border-slate-300 rounded-xl bg-white text-slate-700 focus:ring-2 focus:ring-[#1E5BB8]/15 focus:border-[#1E5BB8] outline-none transition-all shadow-2xs cursor-pointer"
          >
            <option value="">All Commercial States</option>
            <option value="In Progress">In Progress</option>
            <option value="Won">Won (Order Confirmed)</option>
            <option value="Lost">Lost</option>
          </select>
        </div>
      </div>

      {/* 3. Master Enquiries Table with Precision Alignment */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden hover-lift transition-all">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-bold uppercase text-xs tracking-wider">
                <th className="py-4 px-5 whitespace-nowrap">ERN Docket</th>
                <th className="py-4 px-5 whitespace-nowrap">Offer Date</th>
                <th className="py-4 px-5 min-w-[210px]">Client / Buyer Entity</th>
                <th className="py-4 px-5 min-w-[250px]">Substation Project Scope</th>
                <th className="py-4 px-5 whitespace-nowrap">Estimated Value</th>
                <th className="py-4 px-5 whitespace-nowrap">Admin Approval Gate</th>
                <th className="py-4 px-5 whitespace-nowrap">Commercial Status</th>
                <th className="py-4 px-5 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">
                    <div className="w-8 h-8 border-3 border-[#1E5BB8] border-t-transparent rounded-full animate-spin mx-auto mb-2.5" />
                    <span className="text-xs font-bold">Filtering Switchgear Requisitions...</span>
                  </td>
                </tr>
              ) : displayedEnquiries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">
                    <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-600">
                      No enquiries found matching "{resolvedStatus || 'the current filter'}".
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      New enquiries submitted will appear here once processed.
                    </p>
                  </td>
                </tr>
              ) : (
                displayedEnquiries.map((enq) => (
                  <tr
                    key={enq._id}
                    className="hover:bg-[#F0F5FD]/60 transition-colors duration-150 group cursor-pointer"
                  >
                    {/* 1. ERN Docket (Unbroken Monospace) */}
                    <td className="py-4 px-5 whitespace-nowrap">
                      <Link
                        to={`/enquiries/${enq._id}`}
                        className="font-mono font-black text-sm text-[#1E5BB8] hover:underline block"
                      >
                        {enq.ern}
                      </Link>
                    </td>

                    {/* 2. Offer Date */}
                    <td className="py-4 px-5 whitespace-nowrap text-slate-500 font-mono text-xs">
                      {new Date(enq.offerDate || enq.createdAt).toLocaleDateString('en-IN')}
                    </td>

                    {/* 3. Client / Buyer Entity (Clean 2-line stacking) */}
                    <td className="py-4 px-5 min-w-[210px]">
                      <div className="font-extrabold text-slate-900 text-sm">
                        {enq.clientId?.companyName || 'Not Specified'}
                      </div>
                      <div className="text-xs text-slate-500 font-medium mt-0.5 flex flex-wrap items-center gap-1.5">
                        <span>{enq.clientId?.clientLocation || '-'}</span>
                        {(enq.customerType || enq.clientId?.customerType) && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span className="text-[#1E5BB8] font-bold">
                              {enq.customerType || enq.clientId?.customerType}
                            </span>
                          </>
                        )}
                      </div>
                    </td>

                    {/* 4. Substation Project Scope */}
                    <td className="py-4 px-5 min-w-[250px] max-w-sm">
                      <div className="font-extrabold text-slate-800 text-sm truncate">
                        {enq.project?.projectName || 'Project Not Named'}
                      </div>
                      <div className="text-xs text-slate-500 truncate mt-0.5">
                        {enq.project?.projectScope || enq.project?.projectLocation || 'Turnkey Engineering Supply'}
                      </div>
                    </td>

                    {/* 5. Estimated Valuation (One Clean Line) */}
                    <td className="py-4 px-5 whitespace-nowrap font-mono font-black text-base" style={{ color: '#102B50' }}>
                      <span className="inline-block whitespace-nowrap">
                        ₹ {Number(enq.expectedProjectValue || 0).toLocaleString('en-IN')}
                      </span>
                    </td>

                    {/* 6. Admin Approval Gate Badge */}
                    <td className="py-4 px-5 whitespace-nowrap">
                      <StatusBadge status={enq.approvalStatus} />
                    </td>

                    {/* 7. Commercial Status Badge */}
                    <td className="py-4 px-5 whitespace-nowrap">
                      <StatusBadge status={enq.commercialStatus} />
                    </td>

                    {/* 8. Action Buttons (Aligned Horizontally, No Vertical Stacking) */}
                    <td className="py-4 px-5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-2">
                        {/* If Admin and Approved -> Provide Direct Generate Quotation button */}
                        {isAdmin && enq.approvalStatus === 'Approved' && (
                          <Link
                            to={`/admin/quotations/new?enquiryId=${enq._id}`}
                            className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-black btn-primary text-white shadow-xs hover:scale-105 transition-all"
                          >
                            <FileText className="w-3.5 h-3.5 mr-1" />
                            Generate Quote
                          </Link>
                        )}

                        {/* Inspect Docket */}
                        <Link
                          to={`/enquiries/${enq._id}`}
                          className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-[#F0F5FD] hover:bg-[#1E5BB8] text-[#1E5BB8] hover:text-white border border-[#D0E1F9] hover:border-[#1E5BB8] shadow-2xs transition-all duration-200"
                        >
                          <span>Inspect Docket</span>
                          <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                        </Link>

                        {/* Edit for Returned Enquiries */}
                        {enq.approvalStatus === 'Returned for Correction' && (
                          <Link
                            to={`/enquiries/${enq._id}/edit`}
                            className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-[#FFF5EE] hover:bg-[#EE6F2D] text-[#EE6F2D] hover:text-white border border-[#FCDCC9] hover:border-[#EE6F2D] shadow-2xs transition-all duration-200"
                          >
                            <RotateCcw className="w-3.5 h-3.5 mr-1" />
                            Correct &amp; Resubmit
                          </Link>
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
    </div>
  );
};
