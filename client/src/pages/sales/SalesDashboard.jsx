import React, { useState, useEffect, useRef } from 'react';
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
  Building2,
  Search,
  Filter,
  X,
  ExternalLink,
  ChevronRight,
  Briefcase
} from 'lucide-react';

export const SalesDashboard = () => {
  const [data, setData] = useState(null);
  const [returnedWorkflows, setReturnedWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resubmittingId, setResubmittingId] = useState(null);

  // Interactive filtering states for detail table
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'DRAFT' | 'PENDING' | 'APPROVED' | 'RETURNED' | 'WON'
  const [searchQuery, setSearchQuery] = useState('');
  const tableRef = useRef(null);

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

  const handleCardClick = (filterKey) => {
    setActiveFilter(filterKey);
    // Smooth scroll to the detail table
    if (tableRef.current) {
      tableRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
  const allEnquiries = data?.enquiries || data?.recentEnquiries || [];

  // Filter enquiries matching active KPI card and search query
  const filteredEnquiries = allEnquiries.filter((enq) => {
    // 1. Status Filter
    if (activeFilter === 'DRAFT') {
      if (enq.approvalStatus !== 'Draft') return false;
    } else if (activeFilter === 'PENDING') {
      if (
        enq.approvalStatus !== 'Pending Approval' &&
        enq.approvalStatus !== 'Submitted for Approval' &&
        enq.approvalStatus !== 'Submitted to Admin'
      ) {
        return false;
      }
    } else if (activeFilter === 'APPROVED') {
      if (enq.approvalStatus !== 'Approved') return false;
    } else if (activeFilter === 'RETURNED') {
      if (
        enq.approvalStatus !== 'Returned for Correction' &&
        enq.approvalStatus !== 'Returned for Sales & Marketing Review'
      ) {
        return false;
      }
    } else if (activeFilter === 'WON') {
      if (enq.commercialStatus !== 'Won') return false;
    }

    // 2. Text Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const ernMatch = enq.ern?.toLowerCase().includes(q);
      const clientMatch = enq.clientId?.companyName?.toLowerCase().includes(q);
      const projectMatch = enq.project?.projectName?.toLowerCase().includes(q);
      const scopeMatch = (enq.project?.projectScope || enq.project?.projectLocation || '')?.toLowerCase().includes(q);
      const contactMatch = enq.clientId?.contactPerson?.toLowerCase().includes(q);
      return ernMatch || clientMatch || projectMatch || scopeMatch || contactMatch;
    }

    return true;
  });

  // Dynamic filter title and description
  const getFilterInfo = () => {
    switch (activeFilter) {
      case 'PENDING':
        return {
          title: 'Pending Approval Gate Enquiries',
          subtitle: 'Switchgear requisitions currently awaiting executive administrative approval decision',
          badgeText: `${filteredEnquiries.length} Awaiting Approval`,
          badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
          masterUrl: '/enquiries?status=pending'
        };
      case 'APPROVED':
        return {
          title: 'Approved Enquiries Master',
          subtitle: 'Authorized switchgear requisitions eligible for commercial quotation and customer purchase order',
          badgeText: `${filteredEnquiries.length} Ready for Quote`,
          badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          masterUrl: '/enquiries?status=approved'
        };
      case 'RETURNED':
        return {
          title: 'Returned Enquiries (Needs Revision)',
          subtitle: 'Requisitions returned by technical departments or admin requiring specification correction',
          badgeText: `${filteredEnquiries.length} Needs Action`,
          badgeClass: 'bg-orange-100 text-[#EE6F2D] border-orange-300',
          masterUrl: '/enquiries?status=returned'
        };
      case 'DRAFT':
        return {
          title: 'Draft Requisitions',
          subtitle: 'Incomplete switchgear requisitions currently in preparation by sales team',
          badgeText: `${filteredEnquiries.length} In Progress`,
          badgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
          masterUrl: '/enquiries?status=draft'
        };
      case 'WON':
        return {
          title: 'Orders Won & Converted',
          subtitle: 'Commercial offers successfully converted into live production orders',
          badgeText: `${filteredEnquiries.length} Won Orders`,
          badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          masterUrl: '/enquiries?status=won'
        };
      default:
        return {
          title: 'All Project Enquiries',
          subtitle: 'Active switchgear requisitions repository in your marketing & sales pipeline',
          badgeText: `${filteredEnquiries.length} Requisitions`,
          badgeClass: 'bg-[#EAF5FF] text-[#0878C9] border-[#C5DFF5]',
          masterUrl: '/enquiries'
        };
    }
  };

  const filterInfo = getFilterInfo();

  return (
    <div className="space-y-7 max-w-7xl mx-auto pb-20">
      {/* 1. Header with Minimal Punchy Text */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-[26px] font-black tracking-tight" style={{ color: '#102B50' }}>Sales Operations</h1>
            <span className="text-xs font-bold bg-[#EAF5FF] border px-3 py-0.5 rounded-full" style={{ color: '#0878C9', borderColor: '#C5DFF5' }}>
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
            className="inline-flex items-center px-4 py-2.5 border text-xs font-bold rounded-xl bg-white hover:-translate-y-0.5 transition-all shadow-2xs cursor-pointer"
            style={{ borderColor: '#DCE7F3', color: '#062B59' }}
          >
            <UserPlus className="w-4 h-4 mr-2 text-slate-500" />
            New Client Master
          </Link>
          <Link
            to="/enquiries/new"
            className="inline-flex items-center px-4 py-2.5 btn-accent text-white text-xs font-black rounded-xl shadow-md cursor-pointer hover:-translate-y-0.5 transition-all"
          >
            <FilePlus2 className="w-4 h-4 mr-2" />
            New Enquiry Requisition
          </Link>
        </div>
      </div>

      {/* 2. Interactive KPI Cards Grid - Clickable filters that dynamically update detailed table */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
            <span>Pipeline Status Breakdown</span>
            <span className="text-[11px] font-normal lowercase text-slate-400">(click card to view accurate detail list)</span>
          </p>
          {activeFilter !== 'ALL' && (
            <button
              onClick={() => handleCardClick('ALL')}
              className="text-xs font-bold text-[#0878C9] hover:underline flex items-center space-x-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Show All Enquiries ({m.myEnquiries || 0})</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Total Enquiries */}
          <div
            onClick={() => handleCardClick('ALL')}
            role="button"
            tabIndex={0}
            className={`p-5 rounded-2xl hover-lift cursor-pointer group relative overflow-hidden transition-all duration-200 ${
              activeFilter === 'ALL'
                ? 'bg-blue-50/50 ring-2 ring-[#0878C9] border-[#0878C9] shadow-md'
                : 'bg-white hover:border-[#0878C9]'
            }`}
            style={{ border: activeFilter === 'ALL' ? '2px solid #0878C9' : '1px solid #DCE7F3', boxShadow: '0 3px 8px rgba(15,55,100,0.05)' }}
          >
            <div className="w-1.5 h-full absolute left-0 top-0" style={{ background: '#0878C9' }} />
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700">My Enquiries</span>
              <FileSpreadsheet className={`w-4 h-4 ${activeFilter === 'ALL' ? 'text-[#0878C9]' : 'text-slate-400 group-hover:text-[#0878C9]'} transition-colors`} />
            </div>
            <div className="text-3xl font-black text-slate-900 font-mono">
              {m.myEnquiries || 0}
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-xs font-semibold text-slate-400">Total created</span>
              {activeFilter === 'ALL' && (
                <span className="text-[10px] font-extrabold text-[#0878C9] bg-white px-1.5 py-0.5 rounded shadow-2xs border border-blue-200">
                  Active
                </span>
              )}
            </div>
          </div>

          {/* Drafts */}
          <div
            onClick={() => handleCardClick('DRAFT')}
            role="button"
            tabIndex={0}
            className={`p-5 rounded-2xl hover-lift cursor-pointer group relative overflow-hidden transition-all duration-200 ${
              activeFilter === 'DRAFT'
                ? 'bg-slate-100 ring-2 ring-slate-500 border-slate-500 shadow-md'
                : 'bg-white hover:border-slate-400'
            }`}
            style={{ border: activeFilter === 'DRAFT' ? '2px solid #64748B' : '1px solid #DCE7F3', boxShadow: '0 3px 8px rgba(15,55,100,0.05)' }}
          >
            <div className="w-1.5 h-full bg-slate-400 absolute left-0 top-0" />
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700">Drafts</span>
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400 group-hover:bg-slate-600 transition-colors" />
            </div>
            <div className="text-3xl font-black text-slate-800 font-mono">
              {m.drafts || 0}
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-xs font-semibold text-slate-400">In progress</span>
              {activeFilter === 'DRAFT' && (
                <span className="text-[10px] font-extrabold text-slate-700 bg-white px-1.5 py-0.5 rounded shadow-2xs border border-slate-300">
                  Active
                </span>
              )}
            </div>
          </div>

          {/* Pending Approval */}
          <div
            onClick={() => handleCardClick('PENDING')}
            role="button"
            tabIndex={0}
            className={`p-5 rounded-2xl hover-lift cursor-pointer group relative overflow-hidden transition-all duration-200 ${
              activeFilter === 'PENDING'
                ? 'bg-amber-50 ring-2 ring-amber-500 border-amber-500 shadow-md'
                : 'bg-white border-amber-300 hover:border-amber-500'
            }`}
            style={{ border: activeFilter === 'PENDING' ? '2px solid #F59E0B' : '1px solid #FCD34D', boxShadow: '0 3px 8px rgba(15,55,100,0.05)' }}
          >
            <div className="w-1.5 h-full bg-amber-500 absolute left-0 top-0" />
            <div className="flex items-center justify-between text-amber-700 mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-amber-800">Pending Gate</span>
              <Clock className="w-4 h-4 text-amber-600 group-hover:rotate-45 transition-transform" />
            </div>
            <div className="text-3xl font-black text-amber-800 font-mono">
              {m.pending || 0}
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-xs font-bold text-amber-700">Admin review</span>
              {activeFilter === 'PENDING' ? (
                <span className="text-[10px] font-extrabold text-amber-800 bg-white px-1.5 py-0.5 rounded shadow-2xs border border-amber-300">
                  Active
                </span>
              ) : (
                <span className="text-[10px] font-bold text-amber-600 bg-amber-100/60 px-1.5 py-0.2 rounded">
                  View
                </span>
              )}
            </div>
          </div>

          {/* Approved */}
          <div
            onClick={() => handleCardClick('APPROVED')}
            role="button"
            tabIndex={0}
            className={`p-5 rounded-2xl hover-lift cursor-pointer group relative overflow-hidden transition-all duration-200 ${
              activeFilter === 'APPROVED'
                ? 'bg-emerald-50 ring-2 ring-emerald-500 border-emerald-500 shadow-md'
                : 'bg-white border-emerald-300 hover:border-emerald-500'
            }`}
            style={{ border: activeFilter === 'APPROVED' ? '2px solid #10B981' : '1px solid #6EE7B7', boxShadow: '0 3px 8px rgba(15,55,100,0.05)' }}
          >
            <div className="w-1.5 h-full bg-emerald-600 absolute left-0 top-0" />
            <div className="flex items-center justify-between text-emerald-700 mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-800">Approved</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-3xl font-black text-emerald-800 font-mono">
              {m.approved || 0}
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-xs font-bold text-emerald-700">Ready for quote</span>
              {activeFilter === 'APPROVED' ? (
                <span className="text-[10px] font-extrabold text-emerald-800 bg-white px-1.5 py-0.5 rounded shadow-2xs border border-emerald-300">
                  Active
                </span>
              ) : (
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100/60 px-1.5 py-0.2 rounded">
                  View
                </span>
              )}
            </div>
          </div>

          {/* Returned */}
          <div
            onClick={() => handleCardClick('RETURNED')}
            role="button"
            tabIndex={0}
            className={`p-5 rounded-2xl hover-lift-orange cursor-pointer group relative overflow-hidden transition-all duration-200 ${
              activeFilter === 'RETURNED'
                ? 'bg-orange-50 ring-2 ring-[#EE6F2D] border-[#EE6F2D] shadow-md'
                : 'bg-white border-[#FFD4A8] hover:border-[#EE6F2D]'
            }`}
            style={{ border: activeFilter === 'RETURNED' ? '2px solid #EE6F2D' : '1px solid #FFD4A8', boxShadow: '0 3px 8px rgba(15,55,100,0.05)' }}
          >
            <div className="w-1.5 h-full bg-[#EE6F2D] absolute left-0 top-0" />
            <div className="flex items-center justify-between text-[#D65A1A] mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-[#EE6F2D]">Returned</span>
              <RotateCcw className="w-4 h-4 text-[#EE6F2D] group-hover:-rotate-90 transition-transform" />
            </div>
            <div className="text-3xl font-black text-[#D65A1A] font-mono">
              {m.returned || 0}
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-xs font-bold text-[#EE6F2D]">Needs action</span>
              {activeFilter === 'RETURNED' ? (
                <span className="text-[10px] font-extrabold text-[#D65A1A] bg-white px-1.5 py-0.5 rounded shadow-2xs border border-[#FFD4A8]">
                  Active
                </span>
              ) : (
                <span className="text-[10px] font-bold text-[#EE6F2D] bg-orange-100/60 px-1.5 py-0.2 rounded">
                  View
                </span>
              )}
            </div>
          </div>

          {/* Orders Won */}
          <div
            onClick={() => handleCardClick('WON')}
            role="button"
            tabIndex={0}
            className={`p-5 rounded-2xl hover-lift cursor-pointer group relative overflow-hidden transition-all duration-200 ${
              activeFilter === 'WON'
                ? 'bg-emerald-50 ring-2 ring-emerald-700 border-emerald-700 shadow-md'
                : 'bg-white border-emerald-200 hover:border-emerald-600'
            }`}
            style={{ border: activeFilter === 'WON' ? '2px solid #047857' : '1px solid #A7F3D0', boxShadow: '0 3px 8px rgba(15,55,100,0.05)' }}
          >
            <div className="w-1.5 h-full bg-emerald-700 absolute left-0 top-0" />
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-800">Orders Won</span>
              <Trophy className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-3xl font-black text-emerald-800 font-mono">
              {m.won || 0}
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-xs font-bold text-emerald-700">To production</span>
              {activeFilter === 'WON' && (
                <span className="text-[10px] font-extrabold text-emerald-800 bg-white px-1.5 py-0.5 rounded shadow-2xs border border-emerald-300">
                  Active
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Quick Action Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/followups?filter=today"
          className="bg-white p-5 rounded-2xl hover-lift flex items-center justify-between group transition-all"
          style={{ border: '1px solid #DCE7F3', boxShadow: '0 2px 4px rgba(15,55,100,0.04)' }}
        >
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#EAF5FF] text-[#0878C9] flex items-center justify-center group-hover:bg-[#0878C9] group-hover:text-white transition-colors duration-200 shadow-2xs">
              <CalendarClock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold">Today's Schedule</p>
              <h3 className="text-base font-extrabold mt-0.5" style={{ color: '#102B50' }}>
                {m.todayFollowups || 0} Follow-ups Due
              </h3>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#0878C9] group-hover:translate-x-1 transition-all" />
        </Link>

        <Link
          to="/followups?filter=upcoming"
          className="bg-white p-5 rounded-2xl hover-lift flex items-center justify-between group transition-all"
          style={{ border: '1px solid #DCE7F3', boxShadow: '0 2px 4px rgba(15,55,100,0.04)' }}
        >
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors duration-200 shadow-2xs">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold">Upcoming Pipeline</p>
              <h3 className="text-base font-extrabold mt-0.5" style={{ color: '#102B50' }}>
                {m.upcomingFollowups || 0} Scheduled
              </h3>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
        </Link>

        <Link
          to="/quotations"
          className="bg-white p-5 rounded-2xl hover-lift flex items-center justify-between group transition-all"
          style={{ border: '1px solid #DCE7F3', boxShadow: '0 2px 4px rgba(15,55,100,0.04)' }}
        >
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#FFF5EE] text-[#EE6F2D] flex items-center justify-center group-hover:bg-[#EE6F2D] group-hover:text-white transition-colors duration-200 shadow-2xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold">Commercial Offers</p>
              <h3 className="text-base font-extrabold mt-0.5" style={{ color: '#102B50' }}>
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

      {/* 4. MASTER DETAILED ENQUIRIES SECTION (High-Density Engineering UI) */}
      <div
        ref={tableRef}
        className="bg-white border rounded-2xl shadow-sm overflow-hidden transition-all"
        style={{ border: '1px solid #DCE7F3' }}
      >
        {/* Section Header with Dynamic Title, Filter Pills, and Search */}
        <div className="p-6 border-b border-slate-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{
                    background:
                      activeFilter === 'PENDING'
                        ? '#F59E0B'
                        : activeFilter === 'APPROVED'
                        ? '#10B981'
                        : activeFilter === 'RETURNED'
                        ? '#EE6F2D'
                        : '#0878C9'
                  }}
                />
                <h2 className="text-lg font-extrabold" style={{ color: '#102B50' }}>
                  {filterInfo.title}
                </h2>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border shadow-2xs ${filterInfo.badgeClass}`}>
                  {filterInfo.badgeText}
                </span>
              </div>
              <p className="text-xs font-medium text-slate-500 mt-1">
                {filterInfo.subtitle}
              </p>
            </div>

            <div className="flex items-center space-x-2.5 self-start sm:self-auto">
              <Link
                to={filterInfo.masterUrl}
                className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-bold bg-[#EAF5FF] hover:bg-[#D5EBFD] transition-all shadow-2xs cursor-pointer"
                style={{ color: '#0878C9', border: '1px solid #C5DFF5' }}
              >
                <span>Open in Master Table</span>
                <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
              </Link>
            </div>
          </div>

          {/* Filter Pills and Search Bar Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
            {/* Filter Pills */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs">
              <button
                onClick={() => setActiveFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeFilter === 'ALL'
                    ? 'bg-[#102B50] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All ({m.myEnquiries || 0})
              </button>

              <button
                onClick={() => setActiveFilter('PENDING')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer flex items-center space-x-1 ${
                  activeFilter === 'PENDING'
                    ? 'bg-amber-500 text-white shadow-2xs'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                <span>Pending Gate</span>
                <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-black ${activeFilter === 'PENDING' ? 'bg-amber-700 text-white' : 'bg-amber-200 text-amber-900'}`}>
                  {m.pending || 0}
                </span>
              </button>

              <button
                onClick={() => setActiveFilter('APPROVED')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer flex items-center space-x-1 ${
                  activeFilter === 'APPROVED'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                <span>Approved</span>
                <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-black ${activeFilter === 'APPROVED' ? 'bg-emerald-800 text-white' : 'bg-emerald-200 text-emerald-900'}`}>
                  {m.approved || 0}
                </span>
              </button>

              <button
                onClick={() => setActiveFilter('RETURNED')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer flex items-center space-x-1 ${
                  activeFilter === 'RETURNED'
                    ? 'bg-[#EE6F2D] text-white shadow-2xs'
                    : 'bg-orange-50 text-[#EE6F2D] hover:bg-orange-100 border border-orange-200'
                }`}
              >
                <span>Returned</span>
                <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-black ${activeFilter === 'RETURNED' ? 'bg-orange-800 text-white' : 'bg-orange-200 text-orange-900'}`}>
                  {m.returned || 0}
                </span>
              </button>

              <button
                onClick={() => setActiveFilter('DRAFT')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer flex items-center space-x-1 ${
                  activeFilter === 'DRAFT'
                    ? 'bg-slate-700 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>Drafts</span>
                <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-black ${activeFilter === 'DRAFT' ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-800'}`}>
                  {m.drafts || 0}
                </span>
              </button>

              <button
                onClick={() => setActiveFilter('WON')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer flex items-center space-x-1 ${
                  activeFilter === 'WON'
                    ? 'bg-emerald-800 text-white shadow-2xs'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                <span>Won</span>
                <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-black ${activeFilter === 'WON' ? 'bg-emerald-950 text-white' : 'bg-emerald-200 text-emerald-900'}`}>
                  {m.won || 0}
                </span>
              </button>
            </div>

            {/* Instant Search Bar */}
            <div className="relative min-w-[260px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by ERN, client, project..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0878C9] focus:border-transparent transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Detailed Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b font-bold uppercase text-xs tracking-wider" style={{ background: '#EDF4FC', borderColor: '#DCE7F3', color: '#17365D' }}>
                <th className="py-4 px-5 whitespace-nowrap">ERN Docket</th>
                <th className="py-4 px-5 min-w-[220px]">Client / Buyer Entity</th>
                <th className="py-4 px-5 min-w-[230px]">Substation Project Scope</th>
                <th className="py-4 px-5 whitespace-nowrap">Estimated Value</th>
                <th className="py-4 px-5 whitespace-nowrap">Admin Approval Gate</th>
                <th className="py-4 px-5 whitespace-nowrap">Commercial Status</th>
                <th className="py-4 px-5 text-right whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredEnquiries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400 text-sm">
                    <div className="max-w-sm mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                        <Filter className="w-6 h-6" />
                      </div>
                      <p className="font-bold text-slate-700">
                        No enquiries found matching {activeFilter !== 'ALL' ? `"${activeFilter}"` : ''} {searchQuery ? `"${searchQuery}"` : ''}
                      </p>
                      <p className="text-xs text-slate-400">
                        Try clearing search terms or selecting "All" to view your complete switchgear requisitions.
                      </p>
                      <button
                        onClick={() => {
                          setActiveFilter('ALL');
                          setSearchQuery('');
                        }}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-[#EAF5FF] text-[#0878C9] border border-[#C5DFF5] hover:bg-[#D5EBFD] transition-colors cursor-pointer"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEnquiries.map((enq) => {
                  const isApproved = enq.approvalStatus === 'Approved';
                  const isPending =
                    enq.approvalStatus === 'Pending Approval' ||
                    enq.approvalStatus === 'Submitted for Approval' ||
                    enq.approvalStatus === 'Submitted to Admin';
                  const isReturned =
                    enq.approvalStatus === 'Returned for Correction' ||
                    enq.approvalStatus === 'Returned for Sales & Marketing Review';

                  return (
                    <tr
                      key={enq._id}
                      className="hover:bg-[#F3F8FE] transition-colors duration-150 group cursor-pointer"
                    >
                      {/* ERN Docket */}
                      <td className="py-4 px-5">
                        <Link
                          to={`/enquiries/${enq._id}`}
                          className="font-mono font-black text-sm text-[#0878C9] hover:underline flex items-center space-x-1.5"
                        >
                          <span>{enq.ern}</span>
                        </Link>
                        <div className="flex items-center space-x-1.5 mt-0.5">
                          <span className="text-[11px] font-mono text-slate-400">
                            {new Date(enq.offerDate || enq.createdAt).toLocaleDateString('en-IN')}
                          </span>
                          {enq.enquiryType && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                              {enq.enquiryType}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Client Legal Entity */}
                      <td className="py-4 px-5">
                        <div className="font-bold text-slate-900 text-sm">
                          {enq.clientId?.companyName || 'Not Specified'}
                        </div>
                        <div className="text-xs text-slate-500 font-medium mt-0.5 flex items-center space-x-1.5 flex-wrap">
                          <span>{enq.clientId?.clientLocation || '-'}</span>
                          {(enq.customerType || enq.clientId?.customerType) && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className="text-[#0878C9] font-semibold">
                                {enq.customerType || enq.clientId?.customerType}
                              </span>
                            </>
                          )}
                          {enq.clientId?.contactPerson && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className="text-slate-400">
                                {enq.clientId.contactPerson}
                              </span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Substation Project Scope */}
                      <td className="py-4 px-5 max-w-xs">
                        <div className="font-extrabold text-slate-800 text-sm truncate">
                          {enq.project?.projectName || 'Project Not Named'}
                        </div>
                        <div className="text-xs text-slate-500 truncate mt-0.5">
                          {enq.project?.projectScope || enq.project?.projectLocation || 'HT/LT Engineering Supply'}
                        </div>
                      </td>

                      {/* Estimated Contract Value */}
                      <td className="py-4 px-5 font-mono font-black text-base whitespace-nowrap" style={{ color: '#102B50' }}>
                        <span className="inline-block whitespace-nowrap">
                          ₹ {Number(enq.expectedProjectValue || 0).toLocaleString('en-IN')}
                        </span>
                      </td>

                      {/* Admin Approval Gate */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        <StatusBadge status={enq.approvalStatus || 'Draft'} />
                      </td>

                      {/* Commercial Status */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        <StatusBadge status={enq.commercialStatus || 'In Progress'} />
                      </td>

                      {/* Contextual Action Button */}
                      <td className="py-4 px-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-2">
                          <Link
                            to={`/enquiries/${enq._id}`}
                            className="inline-flex items-center px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-2xs transition-all duration-200 group-hover:shadow-xs"
                            style={{ background: '#EAF5FF', color: '#0878C9', border: '1px solid #C5DFF5' }}
                          >
                            <span>View Docket</span>
                            <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                          </Link>

                          {isApproved && (
                            <Link
                              to={`/admin/quotations/new?enquiryId=${enq._id}`}
                              className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-colors"
                              title="Prepare Commercial Quotation for Approved Enquiry"
                            >
                              <span>Quote</span>
                              <ChevronRight className="w-3 h-3 ml-0.5" />
                            </Link>
                          )}

                          {isReturned && (
                            <Link
                              to={`/enquiries/${enq._id}/edit`}
                              className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-[#EE6F2D] hover:bg-[#d55e20] text-white shadow-2xs transition-colors"
                              title="Edit and Resubmit Returned Requisition"
                            >
                              <span>Edit</span>
                              <ChevronRight className="w-3 h-3 ml-0.5" />
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer with summary information */}
        <div className="px-6 py-4 bg-slate-50/70 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div>
            Showing <strong className="text-slate-800">{filteredEnquiries.length}</strong> of{' '}
            <strong className="text-slate-800">{allEnquiries.length}</strong> recorded enquiries
            {activeFilter !== 'ALL' && (
              <span className="ml-1 text-slate-400">
                (Filtered by {filterInfo.title})
              </span>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <span className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Approved: {m.approved || 0}</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Pending Gate: {m.pending || 0}</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-[#EE6F2D]" />
              <span>Returned: {m.returned || 0}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
