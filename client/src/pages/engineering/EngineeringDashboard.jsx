import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import {
  Cpu,
  Layers,
  FileCheck2,
  Clock,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Calendar,
  Building2,
  ArrowRight,
  Plus,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  FileText,
  Send,
  MessageSquare,
  ShieldCheck,
  Search,
  SlidersHorizontal,
  FolderGit2
} from 'lucide-react';

export const EngineeringDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState('');
  const [activePendingTab, setActivePendingTab] = useState('internalReviews');

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/engineering/dashboard/stats');
      if (res.success) {
        setStats(res);
      } else {
        setError(res.message || 'Failed to load engineering dashboard.');
      }
    } catch (err) {
      setError(err.message || 'Error fetching engineering statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleSeedSamples = async () => {
    try {
      setSeeding(true);
      const res = await api.post('/engineering/seed-samples');
      if (res.success) {
        await fetchStats();
      }
    } catch (err) {
      alert('Could not seed engineering samples: ' + err.message);
    } finally {
      setSeeding(false);
    }
  };

  const kpis = stats?.kpis || {
    totalProjects: 0,
    drawingsUnderPreparation: 0,
    internalReviewPending: 0,
    customerSubmissionPending: 0,
    customerApprovalPending: 0,
    revisionRequired: 0,
    approvedDrawings: 0,
    delayedProjects: 0
  };

  const drawingSummary = stats?.drawingStatusSummary || {};
  const projectOverview = stats?.projectOverview || [];
  const pending = stats?.pendingActivities || {
    internalReviews: [],
    customerApprovals: [],
    revisionRequests: [],
    pendingClarifications: [],
    upcomingDeadlines: []
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Fully Approved':
      case 'Completed':
        return 'bg-emerald-50 text-emerald-800 border-emerald-300';
      case 'Customer Review':
      case 'Submitted':
        return 'bg-blue-50 text-blue-800 border-blue-300';
      case 'Internal Review':
        return 'bg-purple-50 text-purple-800 border-purple-300';
      case 'Revision In Progress':
      case 'Revision Required':
        return 'bg-rose-50 text-rose-800 border-rose-300';
      case 'Drawing Preparation':
      case 'Engineering In Progress':
        return 'bg-amber-50 text-amber-800 border-amber-300';
      case 'Partially Approved':
        return 'bg-sky-50 text-sky-800 border-sky-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* 1. Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              Module 04
            </span>
            <span className="text-xs font-semibold text-slate-500">
              Technical Documentation &amp; Drawing Approvals
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Engineering &amp; Drawing Approval Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Switchgear electrical schematic design, internal quality reviews, customer drawing submissions, and revision management.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={fetchStats}
            disabled={loading}
            className="p-2.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition-colors"
            title="Refresh statistics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          {kpis.totalProjects === 0 && (
            <button
              type="button"
              disabled={seeding}
              onClick={handleSeedSamples}
              className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition-colors"
            >
              <Cpu className="w-4 h-4 mr-1.5" />
              {seeding ? 'Seeding...' : 'Seed Sample Projects'}
            </button>
          )}

          <Link
            to="/engineering/projects"
            className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-all hover:shadow-lg"
            style={{ background: 'linear-gradient(90deg, #062B59 0%, #0878C9 100%)' }}
          >
            <FolderGit2 className="w-4 h-4 mr-1.5" />
            View All Projects
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            <span>{error}</span>
          </div>
          <button onClick={fetchStats} className="underline font-bold">Retry</button>
        </div>
      )}

      {/* 2. 8 Dynamic KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {/* Total Projects */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Projects</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <FolderGit2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-black text-slate-900 font-mono">{kpis.totalProjects}</span>
            <span className="text-[9px] text-blue-600 font-bold">Active</span>
          </div>
        </div>

        {/* Drawings Under Prep */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Under Prep</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Cpu className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-black text-amber-950 font-mono">{kpis.drawingsUnderPreparation}</span>
            <span className="text-[9px] text-amber-600 font-bold">Drafting</span>
          </div>
        </div>

        {/* Internal Review Pending */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Internal Rev</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-black text-purple-950 font-mono">{kpis.internalReviewPending}</span>
            <span className="text-[9px] text-purple-600 font-bold">Review</span>
          </div>
        </div>

        {/* Customer Submission Pending */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Sub Pending</span>
            <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <Send className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-black text-sky-950 font-mono">{kpis.customerSubmissionPending}</span>
            <span className="text-[9px] text-sky-600 font-bold">Ready</span>
          </div>
        </div>

        {/* Customer Approval Pending */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Cust Review</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-black text-indigo-950 font-mono">{kpis.customerApprovalPending}</span>
            <span className="text-[9px] text-indigo-600 font-bold">Submitted</span>
          </div>
        </div>

        {/* Revision Required */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Revision Req</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <RotateCcw className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-black text-rose-950 font-mono">{kpis.revisionRequired}</span>
            <span className="text-[9px] text-rose-600 font-bold">Rework</span>
          </div>
        </div>

        {/* Approved Drawings */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Approved</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-black text-emerald-950 font-mono">{kpis.approvedDrawings}</span>
            <span className="text-[9px] text-emerald-600 font-bold">Cleared</span>
          </div>
        </div>

        {/* Delayed Projects */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Delayed</span>
            <div className="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-black text-red-950 font-mono">{kpis.delayedProjects}</span>
            <span className="text-[9px] text-red-600 font-bold">Overdue</span>
          </div>
        </div>
      </div>

      {/* 3. Drawing Status Summary Pills */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Drawing Pipeline Status Summary
            </h2>
          </div>
          <Link
            to="/engineering/drawings"
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center"
          >
            Open Centralized Drawing Register <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-600">Not Started</span>
            <span className="font-mono font-bold text-xs text-slate-900 bg-white px-2 py-0.5 rounded-md shadow-2xs">
              {drawingSummary.notStarted || 0}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-amber-800">In Preparation</span>
            <span className="font-mono font-bold text-xs text-amber-900 bg-white px-2 py-0.5 rounded-md shadow-2xs">
              {drawingSummary.inPreparation || 0}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-purple-50/60 border border-purple-200 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-purple-800">Internal Review</span>
            <span className="font-mono font-bold text-xs text-purple-900 bg-white px-2 py-0.5 rounded-md shadow-2xs">
              {drawingSummary.internalReview || 0}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-sky-50/60 border border-sky-200 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-sky-800">Ready to Submit</span>
            <span className="font-mono font-bold text-xs text-sky-900 bg-white px-2 py-0.5 rounded-md shadow-2xs">
              {drawingSummary.readyForSubmission || 0}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-50/60 border border-blue-200 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-blue-800">Submitted to Cust</span>
            <span className="font-mono font-bold text-xs text-blue-900 bg-white px-2 py-0.5 rounded-md shadow-2xs">
              {drawingSummary.submitted || 0}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-rose-50/60 border border-rose-200 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-rose-800">Revision Req</span>
            <span className="font-mono font-bold text-xs text-rose-900 bg-white px-2 py-0.5 rounded-md shadow-2xs">
              {drawingSummary.revisionRequired || 0}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-emerald-800">Approved</span>
            <span className="font-mono font-bold text-xs text-emerald-900 bg-white px-2 py-0.5 rounded-md shadow-2xs">
              {drawingSummary.approved || 0}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Main Two-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Engineering Project Overview */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center space-x-2">
              <FolderGit2 className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">Engineering Projects Overview</h2>
            </div>
            <Link
              to="/engineering/projects"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center"
            >
              View Full Table <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <th className="py-2.5 px-3">Project No</th>
                  <th className="py-2.5 px-3">Order / Customer</th>
                  <th className="py-2.5 px-3">Assigned Engineer</th>
                  <th className="py-2.5 px-3">Drawing Progress</th>
                  <th className="py-2.5 px-3">Approval Progress</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {projectOverview.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No engineering projects found. Click "Create Engineering Project" to get started.
                    </td>
                  </tr>
                ) : (
                  projectOverview.map((p) => (
                    <tr
                      key={p._id}
                      onClick={() => navigate(`/engineering/projects/${p._id}`)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-3 font-mono font-bold text-blue-700">
                        {p.projectNumber}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 truncate max-w-[170px]">
                          {p.projectName}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[170px]">
                          {p.customerName} ({p.orderNumber})
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-700">
                        <span className="font-medium">{p.assignedEngineerName}</span>
                      </td>
                      <td className="py-3 px-3 min-w-[130px]">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 mb-1">
                          <span>{p.drawingProgress}%</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {p.approvedDrawings + p.submittedDrawings}/{p.totalDrawings} Dwgs
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-blue-600 h-full rounded-full transition-all"
                            style={{ width: `${p.drawingProgress}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-3 px-3 min-w-[130px]">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 mb-1">
                          <span>{p.approvalProgress}%</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {p.approvedDrawings}/{p.totalDrawings} Appr
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full transition-all"
                            style={{ width: `${p.approvalProgress}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColor(p.status)}`}>
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Pending Activities & Action Required */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-sm font-bold text-slate-900">Pending Activities &amp; Alerts</h2>
            <div className="flex items-center space-x-1.5 mt-2 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setActivePendingTab('internalReviews')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors whitespace-nowrap cursor-pointer ${
                  activePendingTab === 'internalReviews'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Internal Reviews ({pending.internalReviews.length})
              </button>
              <button
                type="button"
                onClick={() => setActivePendingTab('customerApprovals')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors whitespace-nowrap cursor-pointer ${
                  activePendingTab === 'customerApprovals'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Customer Appr ({pending.customerApprovals.length})
              </button>
              <button
                type="button"
                onClick={() => setActivePendingTab('revisions')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors whitespace-nowrap cursor-pointer ${
                  activePendingTab === 'revisions'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Rework ({pending.revisionRequests.length})
              </button>
            </div>
          </div>

          <div className="p-4 flex-1 space-y-3">
            {activePendingTab === 'internalReviews' && (
              pending.internalReviews.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  No drawings pending internal review.
                </div>
              ) : (
                pending.internalReviews.map((item) => (
                  <div
                    key={item._id}
                    className="p-3 bg-purple-50/30 border border-purple-100 rounded-xl space-y-1 hover:bg-purple-50/60 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-purple-900">{item.drawingNumber}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{item.projectNumber}</span>
                    </div>
                    <p className="text-xs font-medium text-slate-800 truncate">{item.drawingTitle}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                      <span>Engineer: {item.assignedEngineerName}</span>
                      <Link
                        to={`/engineering/drawings`}
                        className="text-purple-700 font-bold hover:underline"
                      >
                        Review Now →
                      </Link>
                    </div>
                  </div>
                ))
              )
            )}

            {activePendingTab === 'customerApprovals' && (
              pending.customerApprovals.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  <CheckCircle2 className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                  No drawings awaiting customer response.
                </div>
              ) : (
                pending.customerApprovals.map((item) => (
                  <div
                    key={item._id}
                    className="p-3 bg-blue-50/30 border border-blue-100 rounded-xl space-y-1 hover:bg-blue-50/60 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-blue-900">{item.drawingNumber}</span>
                      <span className="text-[10px] text-blue-700 font-bold px-1.5 py-0.2 bg-blue-100 rounded">
                        {item.currentRevision}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-800 truncate">{item.drawingTitle}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                      <span>Submitted: {item.customerSubmissionDate ? new Date(item.customerSubmissionDate).toLocaleDateString('en-IN') : 'Recent'}</span>
                      <Link
                        to="/engineering/approvals"
                        className="text-blue-700 font-bold hover:underline"
                      >
                        Track Status →
                      </Link>
                    </div>
                  </div>
                ))
              )
            )}

            {activePendingTab === 'revisions' && (
              pending.revisionRequests.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  No drawings flagged for revision rework.
                </div>
              ) : (
                pending.revisionRequests.map((item) => (
                  <div
                    key={item._id}
                    className="p-3 bg-rose-50/30 border border-rose-100 rounded-xl space-y-1 hover:bg-rose-50/60 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-rose-900">{item.drawingNumber}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{item.projectNumber}</span>
                    </div>
                    <p className="text-xs font-medium text-slate-800 truncate">{item.drawingTitle}</p>
                    <p className="text-[11px] text-rose-700 italic line-clamp-1">{item.comments}</p>
                  </div>
                ))
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
