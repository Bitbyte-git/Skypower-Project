import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import {
  FileCheck2,
  Search,
  RefreshCw,
  Download,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock,
  RotateCcw,
  FileText
} from 'lucide-react';

export const CustomerApprovalsList = () => {
  const navigate = useNavigate();
  const [drawings, setDrawings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [approvalFilter, setApprovalFilter] = useState('ALL');

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const res = await api.get('/engineering/drawings');
      if (res.success) {
        // Filter drawings that are in customer approval phase or approved
        let list = (res.drawings || []).filter(
          (d) => d.status === 'Submitted' || d.status === 'Under Customer Review' || d.status === 'Approved' || d.status === 'Revision Required'
        );
        if (approvalFilter !== 'ALL') {
          list = list.filter((d) => d.customerApproval?.status === approvalFilter || d.status === approvalFilter);
        }
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          list = list.filter((d) =>
            d.drawingNumber?.toLowerCase().includes(q) ||
            d.drawingTitle?.toLowerCase().includes(q) ||
            d.projectNumber?.toLowerCase().includes(q)
          );
        }
        setDrawings(list);
      }
    } catch (err) {
      console.error('Failed to load customer approvals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, [approvalFilter, searchQuery]);

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Customer Clearance
            </span>
            <span className="text-xs font-semibold text-slate-500">
              Customer Drawing Approval &amp; Redline Status Register
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Customer Drawing Approvals
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor client approval responses, stamped drawing receipts, and revision requests prior to manufacturing clearance.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchApprovals}
          className="p-2.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 cursor-pointer self-start md:self-auto"
          title="Refresh approval records"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Drawing No, Project No, Title..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:bg-white focus:border-blue-500 font-medium"
          />
        </div>

        <select
          value={approvalFilter}
          onChange={(e) => setApprovalFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-hidden"
        >
          <option value="ALL">All Approval Statuses</option>
          <option value="Approved">Approved</option>
          <option value="Approved with Comments">Approved with Comments</option>
          <option value="Under Review">Under Customer Review</option>
          <option value="Revision Required">Revision Required</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Drawing No</th>
                <th className="py-3 px-4">Drawing Title</th>
                <th className="py-3 px-4">Project Ref</th>
                <th className="py-3 px-4 text-center">Rev</th>
                <th className="py-3 px-4">Customer Decision</th>
                <th className="py-3 px-4">Approval Date</th>
                <th className="py-3 px-4">Approved By</th>
                <th className="py-3 px-4 text-center">Stamped File</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading approval tracking data...
                  </td>
                </tr>
              ) : drawings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-14 text-center text-slate-400">
                    No drawings currently in customer approval phase matching filter.
                  </td>
                </tr>
              ) : (
                drawings.map((d) => (
                  <tr key={d._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-700">{d.drawingNumber}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-800 max-w-[220px] truncate">{d.drawingTitle}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-600 font-semibold">{d.projectNumber}</td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800">{d.currentRevision}</td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        d.status === 'Approved'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : d.status === 'Revision Required'
                          ? 'bg-rose-50 text-rose-800 border-rose-300'
                          : 'bg-blue-50 text-blue-800 border-blue-300'
                      }`}>
                        {d.customerApproval?.status || d.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {d.customerApprovalDate ? new Date(d.customerApprovalDate).toLocaleDateString('en-IN') : 'Awaiting'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      {d.customerApproval?.approvedBy || 'Customer Authority'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {d.customerApproval?.approvalDocumentUrl ? (
                        <a
                          href={d.customerApproval.approvalDocumentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg inline-flex items-center text-[11px] font-bold"
                        >
                          <FileText className="w-3 h-3 mr-1" /> Stamped PDF
                        </a>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/engineering/projects/${d.projectId}?tab=drawings`}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors inline-flex items-center"
                      >
                        Workspace <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
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
