import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import {
  Send,
  Search,
  RefreshCw,
  ChevronRight,
  ExternalLink,
  Calendar,
  Building2,
  CheckCircle2,
  Clock,
  Layers,
  FileText
} from 'lucide-react';

export const DrawingSubmissionsList = () => {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/engineering/submissions', {
        params: {
          status: statusFilter,
          search: searchQuery
        }
      });
      if (res.success) {
        setSubmissions(res.submissions || []);
      }
    } catch (err) {
      console.error('Failed to load drawing submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSubmissions();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              Transmittal Dispatch
            </span>
            <span className="text-xs font-semibold text-slate-500">
              Customer Drawing Submissions &amp; Packages
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Customer Drawing Submissions
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track official drawing transmittal sets issued to client electrical authorities, target response dates, and approval turnaround.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchSubmissions}
          className="p-2.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 cursor-pointer self-start md:self-auto"
          title="Refresh list"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
        </button>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Submission No</th>
                <th className="py-3 px-4">Project Ref</th>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4 text-center">Drawings</th>
                <th className="py-3 px-4">Sent Date</th>
                <th className="py-3 px-4">Target Response</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Workspace</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading submissions...
                  </td>
                </tr>
              ) : submissions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-14 text-center text-slate-400">
                    No drawing submission packages found.
                  </td>
                </tr>
              ) : (
                submissions.map((sub) => (
                  <tr key={sub._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-700">{sub.submissionNumber}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-700 font-semibold">{sub.projectNumber}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{sub.customerName}</td>
                    <td className="py-3.5 px-4 text-slate-600">{sub.submissionType}</td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-blue-800">
                      {sub.drawings?.length || 0} Dwgs
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {sub.submissionDate ? new Date(sub.submissionDate).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {sub.expectedCustomerResponseDate ? new Date(sub.expectedCustomerResponseDate).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                        {sub.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/engineering/projects/${sub.projectId}?tab=submissions`}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors inline-flex items-center"
                      >
                        Package Details <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
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
