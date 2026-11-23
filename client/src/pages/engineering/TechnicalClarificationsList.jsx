import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import {
  MessageSquare,
  Search,
  RefreshCw,
  Plus,
  ChevronRight,
  ExternalLink,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  X
} from 'lucide-react';

export const TechnicalClarificationsList = () => {
  const navigate = useNavigate();
  const [clarifications, setClarifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Answer modal
  const [activeClarification, setActiveClarification] = useState(null);
  const [internalResponse, setInternalResponse] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchClarifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/engineering/clarifications', {
        params: {
          clarificationType: typeFilter,
          status: statusFilter,
          search: searchQuery
        }
      });
      if (res.success) {
        setClarifications(res.clarifications || []);
      }
    } catch (err) {
      console.error('Failed to load technical clarifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClarifications();
  }, [typeFilter, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchClarifications();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleResolve = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await api.put(`/engineering/clarifications/${activeClarification._id}`, {
        internalResponse,
        status: 'Resolved'
      });
      if (res.success) {
        setActiveClarification(null);
        setInternalResponse('');
        await fetchClarifications();
      }
    } catch (err) {
      alert('Failed to resolve clarification: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
              Technical RFI &amp; Query Board
            </span>
            <span className="text-xs font-semibold text-slate-500">
              Technical Clarifications Management
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Technical Clarifications Register
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Resolve switchgear engineering questions, CT/PT ratio discrepancies, protection coordination queries, and site cabling constraints.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchClarifications}
          className="p-2.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 cursor-pointer self-start md:self-auto"
          title="Refresh queries"
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
            placeholder="Search by Clarification No, Subject, Project No, Question..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:bg-white focus:border-blue-500 font-medium"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-hidden"
          >
            <option value="ALL">All Disciplines</option>
            <option value="ELECTRICAL">Electrical Ratings</option>
            <option value="MECHANICAL">Mechanical / Dimensions</option>
            <option value="CT_PT">CT / PT Parameters</option>
            <option value="PROTECTION">Protection Relay</option>
            <option value="METERING">Metering</option>
            <option value="DRAWING">Drawing Discrepancy</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-hidden"
          >
            <option value="ALL">All Statuses</option>
            <option value="Open">Open</option>
            <option value="Sent to Customer">Sent to Customer</option>
            <option value="Awaiting Customer Response">Awaiting Customer Response</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Main List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading technical clarifications...
          </div>
        ) : clarifications.length === 0 ? (
          <div className="py-14 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 text-xs">
            No technical clarifications logged matching filter.
          </div>
        ) : (
          clarifications.map((c) => (
            <div key={c._id} className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-blue-700 text-sm">{c.clarificationNumber}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">{c.clarificationType}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">{c.priority}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                    {c.status}
                  </span>
                </div>
                <div className="text-right text-xs">
                  <span className="text-slate-400 block text-[11px]">Due Date</span>
                  <span className="font-bold text-slate-800">{c.dueDate ? new Date(c.dueDate).toLocaleDateString('en-IN') : 'Standard'}</span>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 text-sm">{c.subject}</h3>
                <p className="text-xs text-slate-600 mt-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {c.question}
                </p>
              </div>

              {c.internalResponse && (
                <div className="text-xs bg-purple-50/60 p-3 rounded-xl border border-purple-100">
                  <strong className="text-purple-900 block text-[11px]">Engineering Response:</strong>
                  <p className="text-slate-700 mt-0.5">{c.internalResponse}</p>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <span className="text-slate-500">
                  Project: <strong className="text-slate-800 font-mono">{c.projectNumber}</strong> • Assigned: <strong className="text-slate-800">{c.assignedEngineerName}</strong>
                </span>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => { setActiveClarification(c); setInternalResponse(c.internalResponse || ''); }}
                    className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-bold transition-colors cursor-pointer"
                  >
                    Respond &amp; Resolve
                  </button>
                  <Link
                    to={`/engineering/projects/${c.projectId}?tab=clarifications`}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold transition-colors inline-flex items-center"
                  >
                    View Project <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Answer Modal */}
      {activeClarification && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Respond to Clarification: {activeClarification.clarificationNumber}</h3>
              <button onClick={() => setActiveClarification(null)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <form onSubmit={handleResolve} className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl">
                <span className="text-[11px] font-bold text-slate-600 block mb-1">Subject: {activeClarification.subject}</span>
                <p className="text-slate-700 italic">{activeClarification.question}</p>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Engineering Resolution &amp; Response *</label>
                <textarea
                  rows={4}
                  required
                  value={internalResponse}
                  onChange={(e) => setInternalResponse(e.target.value)}
                  placeholder="Record formal technical response and design clearance details..."
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setActiveClarification(null)} className="px-3 py-1.5 border rounded-lg">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-1.5 bg-blue-600 text-white font-bold rounded-lg">
                  {submitting ? 'Saving...' : 'Save & Mark Resolved'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
