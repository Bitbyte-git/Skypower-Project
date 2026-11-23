import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import {
  Layers,
  Search,
  Filter,
  Plus,
  RefreshCw,
  Download,
  Upload,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock,
  RotateCcw,
  FileText
} from 'lucide-react';

export const DrawingRegisterList = () => {
  const navigate = useNavigate();
  const [drawings, setDrawings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchDrawings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/engineering/drawings', {
        params: {
          drawingType: typeFilter,
          status: statusFilter,
          search: searchQuery
        }
      });
      if (res.success) {
        setDrawings(res.drawings || []);
      }
    } catch (err) {
      console.error('Failed to load drawing register:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrawings();
  }, [typeFilter, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDrawings();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
        return 'bg-emerald-50 text-emerald-800 border-emerald-300';
      case 'Submitted':
      case 'Under Customer Review':
        return 'bg-blue-50 text-blue-800 border-blue-300';
      case 'Internal Review':
        return 'bg-purple-50 text-purple-800 border-purple-300';
      case 'Revision Required':
      case 'Rejected':
        return 'bg-rose-50 text-rose-800 border-rose-300';
      case 'Ready for Submission':
        return 'bg-sky-50 text-sky-800 border-sky-300';
      default:
        return 'bg-amber-50 text-amber-800 border-amber-300';
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              Drawing Repository
            </span>
            <span className="text-xs font-semibold text-slate-500">
              Centralized Electrical Switchgear CAD / PDF Register
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Centralized Drawing Register
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            General Arrangement (GA), Single Line Diagrams (SLD), Control Schematics, Protection &amp; Metering Secondary Drawings.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchDrawings}
          className="p-2.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 cursor-pointer self-start md:self-auto"
          title="Refresh drawing register"
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
            placeholder="Search by Drawing No, Drawing Title, Project Number, Panel..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:bg-white focus:border-blue-500 font-medium"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-hidden"
          >
            <option value="ALL">All Drawing Types</option>
            <option value="GA">General Arrangement (GA)</option>
            <option value="SLD">Single Line Diagram (SLD)</option>
            <option value="SCHEMATIC">Schematic Diagram</option>
            <option value="CONTROL_WIRING">Control Wiring</option>
            <option value="PROTECTION">Protection Circuit</option>
            <option value="CT_CONNECTION">CT Connection</option>
            <option value="PT_CONNECTION">PT Connection</option>
            <option value="METERING">Metering Diagram</option>
            <option value="PANEL_LAYOUT">Panel Layout</option>
            <option value="FOUNDATION">Foundation Details</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-hidden"
          >
            <option value="ALL">All Statuses</option>
            <option value="In Preparation">In Preparation</option>
            <option value="Internal Review">Internal Review</option>
            <option value="Ready for Submission">Ready for Submission</option>
            <option value="Submitted">Submitted</option>
            <option value="Revision Required">Revision Required</option>
            <option value="Approved">Approved</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Drawing No</th>
                <th className="py-3 px-4">Drawing Title</th>
                <th className="py-3 px-4">Project Ref</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Panel</th>
                <th className="py-3 px-4 text-center">Rev</th>
                <th className="py-3 px-4">Engineer</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">CAD / PDF</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading drawings...
                  </td>
                </tr>
              ) : drawings.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-14 text-center text-slate-400">
                    No drawings match your search or filter.
                  </td>
                </tr>
              ) : (
                drawings.map((d) => (
                  <tr key={d._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-700">{d.drawingNumber}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-800 max-w-[220px] truncate">{d.drawingTitle}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-600 text-[11px]">
                      <Link to={`/engineering/projects/${d.projectId}`} className="text-blue-600 hover:underline">
                        {d.projectNumber}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">{d.drawingType}</td>
                    <td className="py-3.5 px-4 text-slate-600">{d.panelNumber}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-mono font-bold text-slate-800 px-1.5 py-0.5 bg-slate-100 rounded">
                        {d.currentRevision}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{d.assignedEngineerName}</td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(d.status)}`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {d.fileUrl ? (
                        <a
                          href={d.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg inline-flex items-center text-[11px] font-bold transition-colors"
                        >
                          <Download className="w-3 h-3 mr-1" /> File
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
