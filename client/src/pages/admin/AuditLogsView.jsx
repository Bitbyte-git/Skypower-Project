import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { ShieldAlert, Search, Filter } from 'lucide-react';

export const AuditLogsView = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchErn, setSearchErn] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/audit-logs', {
        params: { ern: searchErn, action: actionFilter }
      });
      if (res.success) setLogs(res.logs || []);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchLogs();
    }, 250);
    return () => clearTimeout(timeout);
  }, [searchErn, actionFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Security & Transaction Audit Trail</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-900 text-white uppercase tracking-wider">
              IMMUTABLE
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Cryptographic-style audit records of every client registration, approval transition, quotation issue, and login.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchErn}
            onChange={(e) => setSearchErn(e.target.value)}
            placeholder="Search by ERN (e.g. ERN-2026-0001)..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-600 outline-none"
          />
        </div>

        <div className="w-full sm:w-64">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full py-1.5 px-3 text-xs border border-slate-300 rounded bg-white text-slate-700 outline-none"
          >
            <option value="">All Security Actions</option>
            <option value="USER_LOGIN">USER_LOGIN</option>
            <option value="CLIENT_CREATED">CLIENT_CREATED</option>
            <option value="ENQUIRY_DRAFT_CREATED">ENQUIRY_DRAFT_CREATED</option>
            <option value="ENQUIRY_SUBMITTED">ENQUIRY_SUBMITTED</option>
            <option value="ENQUIRY_APPROVED">ENQUIRY_APPROVED</option>
            <option value="ENQUIRY_RETURNED">ENQUIRY_RETURNED</option>
            <option value="ENQUIRY_REJECTED">ENQUIRY_REJECTED</option>
            <option value="QUOTATION_GENERATED">QUOTATION_GENERATED</option>
            <option value="QUOTATION_REVISED">QUOTATION_REVISED</option>
            <option value="ENQUIRY_HANDOVER_TO_RD">ENQUIRY_HANDOVER_TO_RD</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Officer & Role</th>
                <th className="py-3 px-4">Action Event</th>
                <th className="py-3 px-4">Entity Type</th>
                <th className="py-3 px-4">Linked ERN</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4">Audit Payload Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Fetching immutable audit logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No audit records matching query.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                      {new Date(log.createdAt).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{log.userId?.name || 'System'}</div>
                      <div className="text-[10px] text-slate-400">{log.userRole}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">{log.entityType}</td>
                    <td className="py-3 px-4 font-mono font-bold text-blue-700">{log.ern || '-'}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{log.ipAddress || '127.0.0.1'}</td>
                    <td className="py-3 px-4 max-w-xs font-mono text-[10px] text-slate-600 truncate">
                      {JSON.stringify(log.details || {})}
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

