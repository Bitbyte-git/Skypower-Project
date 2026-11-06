import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Send,
  Eye,
  Building2,
  Layers,
  ArrowRight,
  TrendingUp,
  Download,
  ShieldCheck
} from 'lucide-react';
import { downloadEnquiryPDF } from '../../utils/pdfMakerService';

export const ManagerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [stats, setStats] = useState(null);
  const [pendingReviewProjects, setPendingReviewProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [forwardingId, setForwardingId] = useState(null);
  const [forwardSuccess, setForwardSuccess] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, pendingRes] = await Promise.all([
        api.get('/project-workflows/stats'),
        api.get('/project-workflows', {
          params: { status: 'Pending Manager Review' }
        })
      ]);

      if (statsRes.success) {
        setStats(statsRes.stats);
      }
      if (pendingRes.success) {
        setPendingReviewProjects(pendingRes.workflows || []);
      }
    } catch (err) {
      console.error('Error fetching manager dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleForwardToPO = async (workflow) => {
    try {
      setForwardingId(workflow._id);
      setForwardSuccess('');
      const res = await api.post(`/project-workflows/${workflow._id}/manager-forward`, {
        remarks: 'Manager reviewed client details and forwarded project to department workflow.'
      });
      if (res.success) {
        setForwardSuccess(`Project ${workflow.projectTrackingId} forwarded successfully!`);
        fetchDashboardData();
        setTimeout(() => setForwardSuccess(''), 5000);
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Forwarding failed');
    } finally {
      setForwardingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Welcome Banner */}
      <div
        className="text-white rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4"
        style={{ background: 'linear-gradient(135deg, #031D40 0%, #062B59 55%, #0A4076 100%)' }}
      >
        <div>
          <div className="flex items-center space-x-2">
            <span
              className="text-[10px] font-black uppercase tracking-wider text-white px-2 py-0.5 rounded"
              style={{ background: '#FF7A18' }}
            >
              OPERATIONS & REVIEW
            </span>
            <span className="text-xs font-medium" style={{ color: '#8BB8E0' }}>Sky Power Switchgears</span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1">General Manager Review Console</h1>
          <p className="text-xs mt-1 max-w-2xl leading-relaxed" style={{ color: '#C8DDEF' }}>
            Welcome back, <strong>{user?.name || 'General Manager'}</strong>. Review projects submitted by Sales & Marketing, verify commercial specifications, and forward to the PO team to initiate department workflow.
          </p>
        </div>

        <button
          onClick={() => navigate('/departments/workflow')}
          className="inline-flex items-center px-4 py-2.5 rounded-xl btn-accent text-white text-xs font-bold shadow-md transition-all self-start md:self-auto cursor-pointer"
        >
          <span>All 10 Department Workflows</span>
          <ArrowRight className="w-4 h-4 ml-1.5" />
        </button>
      </div>

      {forwardSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center justify-between">
          <span>{forwardSuccess}</span>
          <button onClick={() => setForwardSuccess('')} className="text-emerald-600 font-black cursor-pointer">
            &times;
          </button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div
          className="bg-white rounded-2xl p-4 shadow-xs hover-lift"
          style={{ border: '1px solid #DCE7F3', boxShadow: '0 3px 8px rgba(15, 55, 100, 0.05)' }}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider block" style={{ color: '#8495AB' }}>
            Total Projects
          </span>
          <div className="text-2xl font-black mt-1 font-mono" style={{ color: '#102B50' }}>
            {stats?.totalProjects ?? 0}
          </div>
          <span className="text-[10px] font-medium mt-1 block" style={{ color: '#526783' }}>
            Registered tracking IDs
          </span>
        </div>

        <div
          className="rounded-2xl p-4 shadow-xs hover-lift"
          style={{ background: '#EAF5FF', border: '1px solid #C5DFF5' }}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider block" style={{ color: '#0878C9' }}>
            Pending Your Review
          </span>
          <div className="text-2xl font-black mt-1 font-mono" style={{ color: '#062B59' }}>
            {stats?.pendingManagerReview ?? 0}
          </div>
          <span className="text-[10px] font-medium mt-1 block" style={{ color: '#0878C9' }}>
            Ready to forward to PO
          </span>
        </div>

        <div
          className="rounded-2xl p-4 shadow-xs hover-lift"
          style={{ background: '#EEF2FF', border: '1px solid #C7D2FE' }}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider block text-indigo-700">
            In Dept Review
          </span>
          <div className="text-2xl font-black text-indigo-900 mt-1 font-mono">
            {stats?.underDepartmentReview ?? 0}
          </div>
          <span className="text-[10px] text-indigo-600 font-medium mt-1 block">
            Production & Testing queue
          </span>
        </div>

        <div
          className="rounded-2xl p-4 shadow-xs hover-lift"
          style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider block text-rose-700">
            Returned / Rework
          </span>
          <div className="text-2xl font-black text-rose-900 mt-1 font-mono">
            {stats?.returnedForSalesReview ?? 0}
          </div>
          <span className="text-[10px] text-rose-600 font-medium mt-1 block">
            Sent back to Sales
          </span>
        </div>

        <div
          className="rounded-2xl p-4 shadow-xs hover-lift"
          style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider block text-emerald-700">
            Completed Projects
          </span>
          <div className="text-2xl font-black text-emerald-900 mt-1 font-mono">
            {stats?.completedCount ?? 0}
          </div>
          <span className="text-[10px] text-emerald-600 font-medium mt-1 block">
            Installation finalized
          </span>
        </div>
      </div>

      {/* Pending Manager Review Queue Table */}
      <div
        className="bg-white rounded-2xl overflow-hidden shadow-xs hover-lift transition-all"
        style={{
          border: '1px solid #DCE7F3',
          boxShadow: '0 3px 8px rgba(15, 55, 100, 0.05), 0 10px 24px rgba(15, 55, 100, 0.07)'
        }}
      >
        <div className="p-4 md:p-5 border-b flex items-center justify-between" style={{ borderColor: '#EAF0F7' }}>
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider flex items-center" style={{ color: '#102B50' }}>
              <Clock className="w-4 h-4 mr-2" style={{ color: '#0878C9' }} /> Projects Pending Manager Review &amp; Forwarding ({pendingReviewProjects.length})
            </h3>
            <p className="text-xs mt-0.5" style={{ color: '#526783' }}>
              Review project specifications and forward to Purchase Order (PO) team to begin execution
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs" style={{ color: '#8495AB' }}>Loading pending reviews...</div>
        ) : pendingReviewProjects.length === 0 ? (
          <div className="p-8 text-center text-xs">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="font-bold text-slate-700">All Submitted Projects Have Been Reviewed!</p>
            <p className="mt-0.5" style={{ color: '#8495AB' }}>
              New submissions from Sales &amp; Marketing will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b font-bold uppercase text-[11px] tracking-wider" style={{ background: '#EDF4FC', color: '#17365D', borderColor: '#DCE7F3' }}>
                  <th className="py-3.5 px-4">Tracking ID &amp; ERN</th>
                  <th className="py-3.5 px-4">Project &amp; Line Items</th>
                  <th className="py-3.5 px-4">Client Company</th>
                  <th className="py-3.5 px-4">Resubmission Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingReviewProjects.map((w) => {
                  const enq = w.enquiryId || {};
                  const client = enq.clientId || {};
                  const isReworkResubmitted = !!(w.lastRejectedDepartmentCode || w.resubmittedAt);

                  return (
                    <tr key={w._id} className="hover:bg-[#F3F8FE] transition-colors">
                      <td className="py-3 px-4 align-top">
                        <span className="font-black text-slate-900 block font-mono">{w.projectTrackingId}</span>
                        <span className="text-[11px] font-bold block font-mono" style={{ color: '#0878C9' }}>ERN: {enq.ern || 'N/A'}</span>
                      </td>

                      <td className="py-3 px-4 align-top max-w-xs">
                        <p className="font-bold text-slate-800 line-clamp-1">
                          {enq.project?.projectName || 'HT Switchgear Engineering & Supply'}
                        </p>
                        <p className="text-[11px] text-slate-500 line-clamp-1">
                          {enq.products?.[0]?.productDescription || '11kV, 630A Outdoor VCB'}
                        </p>
                      </td>

                      <td className="py-3 px-4 align-top">
                        <p className="font-bold text-slate-900">{client.companyName || 'N/A'}</p>
                        <p className="text-[11px] text-slate-500">{client.contactPerson || ''}</p>
                      </td>

                      <td className="py-3 px-4 align-top">
                        {isReworkResubmitted ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            Rework Resubmission &bull; Will Resume at {w.lastRejectedDepartmentCode}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: '#EAF5FF', color: '#0878C9', border: '1px solid #C5DFF5' }}>
                            New Project Initial Submission
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 align-top text-right space-x-2">
                        <button
                          onClick={() => downloadEnquiryPDF(enq)}
                          className="px-2.5 py-1.5 rounded-lg border hover:bg-slate-100 text-slate-700 text-[11px] font-bold cursor-pointer"
                          style={{ borderColor: '#DCE7F3' }}
                          title="Download Quotation PDF"
                        >
                          PDF
                        </button>

                        <button
                          onClick={() => navigate(`/projects/tracking/${w.projectTrackingId}`)}
                          className="px-2.5 py-1.5 rounded-lg border text-[11px] font-bold cursor-pointer transition-all hover:bg-[#EAF5FF]"
                          style={{ borderColor: '#C5DFF5', color: '#0878C9' }}
                        >
                          Timeline
                        </button>

                        <button
                          onClick={() => handleForwardToPO(w)}
                          disabled={forwardingId === w._id}
                          className="px-3 py-1.5 rounded-lg text-white text-[11px] font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                          style={{ background: 'linear-gradient(135deg, #0878C9 0%, #062B59 100%)' }}
                        >
                          {forwardingId === w._id
                            ? 'Forwarding...'
                            : isReworkResubmitted
                            ? `Forward & Resume at ${w.lastRejectedDepartmentCode}`
                            : 'Forward to PO Team'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 10 Departments Quick Status Overview Grid */}
      <div
        className="bg-white rounded-2xl p-5 shadow-xs space-y-4"
        style={{ border: '1px solid #DCE7F3', boxShadow: '0 3px 8px rgba(15, 55, 100, 0.05)' }}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider" style={{ color: '#102B50' }}>
            All 10 Department Workflows &amp; Active Queues
          </h3>
          <span className="text-[11px] font-medium" style={{ color: '#8495AB' }}>
            Click any department to inspect its queue
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { seq: 1, code: 'SALES', name: '1. Sales & Marketing' },
            { seq: 2, code: 'PO_TEAM', name: '2. PO Team' },
            { seq: 3, code: 'ACCOUNTANT', name: '3. Accountant' },
            { seq: 4, code: 'DRAWING', name: '4. Drawing / OA' },
            { seq: 5, code: 'CT_PT', name: '5. CT & PT' },
            { seq: 6, code: 'FABRICATION', name: '6. Fabrication' },
            { seq: 7, code: 'METERING_DOOR', name: '7. Metering Door' },
            { seq: 8, code: 'TESTING', name: '8. Testing' },
            { seq: 9, code: 'DELIVERY', name: '9. Delivery' },
            { seq: 10, code: 'INSTALLATION', name: '10. Installation' }
          ].map((d) => {
            const count = stats?.departmentPending?.[d.code]?.count || 0;
            return (
              <button
                key={d.code}
                onClick={() => navigate(`/departments/workflow?dept=${d.seq}`)}
                className="p-3 rounded-xl border hover:bg-[#F3F8FE] transition-all text-left group cursor-pointer"
                style={{ borderColor: '#DCE7F3' }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 group-hover:text-[#0878C9]">
                    {d.name}
                  </span>
                  <span
                    className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                      count > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {count}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
