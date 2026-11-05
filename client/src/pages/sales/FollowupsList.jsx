import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/client';
import {
  CalendarClock,
  Phone,
  Mail,
  Video,
  Users,
  MapPin,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle
} from 'lucide-react';

export const FollowupsList = () => {
  const [searchParams] = useSearchParams();
  const initialFilter = searchParams.get('filter') || 'all';

  const [followups, setFollowups] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [filter, setFilter] = useState(initialFilter);
  const [loading, setLoading] = useState(true);

  // New Followup Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    enquiryId: '',
    type: 'Phone Call',
    followupDate: new Date().toISOString().split('T')[0],
    discussionNotes: '',
    clientResponse: '',
    nextFollowupDate: '',
    status: 'Pending'
  });
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  const fetchFollowups = async () => {
    setLoading(true);
    try {
      const res = await api.get('/followups', { params: { filter } });
      if (res.success) setFollowups(res.followups || []);
    } catch (err) {
      console.error('Failed to load follow-ups:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowups();
  }, [filter]);

  useEffect(() => {
    const fetchEnquiries = async () => {
      try {
        const res = await api.get('/enquiries?limit=100');
        if (res.success) setEnquiries(res.enquiries || []);
      } catch (e) {}
    };
    fetchEnquiries();
  }, []);

  const handleCreateFollowup = async (e) => {
    e.preventDefault();
    setModalError('');

    if (!formData.enquiryId) {
      setModalError('Please select an enquiry.');
      return;
    }
    if (!formData.discussionNotes.trim()) {
      setModalError('Discussion notes are mandatory.');
      return;
    }

    setModalLoading(true);
    try {
      await api.post('/followups', formData);
      setShowAddModal(false);
      setFormData({
        enquiryId: '',
        type: 'Phone Call',
        followupDate: new Date().toISOString().split('T')[0],
        discussionNotes: '',
        clientResponse: '',
        nextFollowupDate: '',
        status: 'Pending'
      });
      fetchFollowups();
    } catch (err) {
      setModalError(err.message || 'Failed to log follow-up.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleStatusToggle = async (id, currentStatus) => {
    const newStatus = currentStatus === 'Completed' ? 'Pending' : 'Completed';
    try {
      await api.put(`/followups/${id}`, { status: newStatus });
      fetchFollowups();
    } catch (err) {
      alert('Failed to update status.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl font-bold text-[#1E3A5F] tracking-tight">Client Follow-ups</h1>
          <p className="text-xs text-slate-500 mt-0.5">Interaction logs, client calls &amp; meeting progression</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center px-3.5 py-2 btn-accent text-white text-xs font-bold rounded-lg shadow-sm self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Log Follow-up
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1 border-b border-slate-200">
        {[
          { label: 'All', val: 'all' },
          { label: 'Today', val: 'today' },
          { label: 'Upcoming', val: 'upcoming' },
          { label: 'Overdue', val: 'overdue' },
          { label: 'Completed', val: 'completed' }
        ].map((tab) => (
          <button
            key={tab.val}
            onClick={() => setFilter(tab.val)}
            className={`py-2 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              filter === tab.val
                ? 'border-[#1E5BB8] text-[#1E5BB8] font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Follow-up Cards / List */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-400">
            <div className="w-6 h-6 border-2 border-[#1E5BB8] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading follow-up records...
          </div>
        ) : followups.length === 0 ? (
          <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-400">
            No follow-ups recorded in this category.
          </div>
        ) : (
          followups.map((f) => (
            <div
              key={f._id}
              className={`p-4 rounded-xl border bg-white shadow-xs hover-lift transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                f.status === 'Completed' ? 'border-slate-200 opacity-80' : 'border-slate-200/90'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-xs text-[#1E5BB8]">{f.ern}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {f.type}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      f.status === 'Completed'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {f.status}
                  </span>
                </div>
                <h3 className="text-xs font-bold text-[#1E3A5F]">{f.clientId?.companyName || 'Valued Client'}</h3>
                <p className="text-xs text-slate-700 font-medium">
                  <strong>Notes:</strong> {f.discussionNotes}
                </p>
                {f.clientResponse && (
                  <p className="text-xs text-slate-500 italic">
                    <strong>Client Feedback:</strong> {f.clientResponse}
                  </p>
                )}
              </div>

              <div className="flex items-center space-x-4 self-end md:self-center">
                <div className="text-right text-xs">
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Scheduled Date</span>
                  <span className="font-bold text-slate-800">
                    {new Date(f.followupDate).toLocaleDateString('en-IN')}
                  </span>
                  {f.nextFollowupDate && (
                    <span className="text-[10px] text-blue-600 block">
                      Next: {new Date(f.nextFollowupDate).toLocaleDateString('en-IN')}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleStatusToggle(f._id, f.status)}
                  className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${
                    f.status === 'Completed'
                      ? 'border border-slate-300 text-slate-600 hover:bg-slate-50'
                      : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs'
                  }`}
                >
                  {f.status === 'Completed' ? 'Reopen' : 'Mark Completed'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateFollowup}
            className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4"
          >
            <h3 className="text-base font-bold text-slate-900">Log Client Follow-up Activity</h3>

            {modalError && (
              <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {modalError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Link to Enquiry (ERN) *
              </label>
              <select
                value={formData.enquiryId}
                onChange={(e) => setFormData({ ...formData, enquiryId: e.target.value })}
                className="w-full p-2 text-xs border border-slate-300 rounded bg-white outline-none"
              >
                <option value="">-- Select Active Enquiry --</option>
                {enquiries.map((enq) => (
                  <option key={enq._id} value={enq._id}>
                    {enq.ern} - {enq.clientId?.companyName || '-'} ({enq.project?.projectName})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Interaction Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full p-2 text-xs border border-slate-300 rounded bg-white outline-none"
                >
                  <option value="Phone Call">Phone Call</option>
                  <option value="Email">Email Communication</option>
                  <option value="Online Meeting">Online Virtual Meeting</option>
                  <option value="Direct Meeting">Direct In-person Meeting</option>
                  <option value="Site Visit">Site / Plant Inspection</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Interaction Date</label>
                <input
                  type="date"
                  value={formData.followupDate}
                  onChange={(e) => setFormData({ ...formData, followupDate: e.target.value })}
                  className="w-full p-2 text-xs border border-slate-300 rounded outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Discussion Notes *</label>
              <textarea
                rows={2}
                value={formData.discussionNotes}
                onChange={(e) => setFormData({ ...formData, discussionNotes: e.target.value })}
                placeholder="Key technical/commercial topics discussed..."
                className="w-full p-2 text-xs border border-slate-300 rounded outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Client Feedback / Response</label>
              <input
                type="text"
                value={formData.clientResponse}
                onChange={(e) => setFormData({ ...formData, clientResponse: e.target.value })}
                placeholder="e.g. Budget approved, awaiting formal drawing approval..."
                className="w-full p-2 text-xs border border-slate-300 rounded outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Next Follow-up Date</label>
              <input
                type="date"
                value={formData.nextFollowupDate}
                onChange={(e) => setFormData({ ...formData, nextFollowupDate: e.target.value })}
                className="w-full p-2 text-xs border border-slate-300 rounded outline-none"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1.5 border border-slate-300 rounded text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={modalLoading}
                className="px-4 py-1.5 bg-[#1D4ED8] hover:bg-blue-800 text-white rounded text-xs font-bold"
              >
                {modalLoading ? 'Saving...' : 'Save Follow-up'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

