import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import {
  FolderGit2,
  Search,
  Filter,
  Plus,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Calendar,
  Building2,
  CheckCircle2,
  Clock,
  Layers,
  Cpu,
  ArrowUpDown,
  Sparkles,
  X
} from 'lucide-react';

export const EngineeringProjectsList = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  // Modal State for Project Creation
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [priority, setPriority] = useState('HIGH');
  const [targetDate, setTargetDate] = useState('');
  const [technicalRemarks, setTechnicalRemarks] = useState('');
  const [creating, setCreating] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await api.get('/engineering/projects', {
        params: {
          status: statusFilter,
          priority: priorityFilter,
          search: searchQuery
        }
      });
      if (res.success) {
        setProjects(res.projects || []);
      }
    } catch (err) {
      console.error('Failed to load engineering projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [statusFilter, priorityFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProjects();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const openCreateModal = async () => {
    setShowCreateModal(true);
    try {
      setModalLoading(true);
      const res = await api.get('/orders');
      if (res.success) {
        setOrders(res.orders || []);
        if (res.orders?.length > 0) {
          setSelectedOrderId(res.orders[0]._id);
        }
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setModalLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!selectedOrderId) {
      alert('Please select a valid Sales Order.');
      return;
    }

    try {
      setCreating(true);
      const res = await api.post('/engineering/projects/from-order', {
        salesOrderId: selectedOrderId,
        priority,
        targetDate,
        technicalRemarks
      });

      if (res.success) {
        setShowCreateModal(false);
        navigate(`/engineering/projects/${res.project._id}`);
      } else {
        alert(res.message || 'Failed to create engineering project.');
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Error creating project.');
    } finally {
      setCreating(false);
    }
  };

  const getStatusBadge = (status) => {
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

  const getPriorityBadge = (p) => {
    switch (p) {
      case 'URGENT':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'MEDIUM':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* 1. Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              Module 04 Register
            </span>
            <span className="text-xs font-semibold text-slate-500">
              Switchgear Projects &amp; Drawing Workspace
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Engineering Projects Register
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage technical documentation, electrical drawing preparation, customer submissions, and revision lifecycles.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            type="button"
            onClick={fetchProjects}
            className="p-2.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition-colors cursor-pointer"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-all hover:shadow-lg cursor-pointer"
            style={{ background: 'linear-gradient(90deg, #062B59 0%, #0878C9 100%)' }}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Create Engineering Project
          </button>
        </div>
      </div>

      {/* 2. Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Project Number, Order No, Customer, Project Name, Engineer..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:bg-white focus:border-blue-500 transition-all font-medium"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-hidden"
          >
            <option value="ALL">All Project Statuses</option>
            <option value="Engineering In Progress">Engineering In Progress</option>
            <option value="Drawing Preparation">Drawing Preparation</option>
            <option value="Internal Review">Internal Review</option>
            <option value="Customer Review">Customer Review</option>
            <option value="Revision In Progress">Revision In Progress</option>
            <option value="Partially Approved">Partially Approved</option>
            <option value="Fully Approved">Fully Approved</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-hidden"
          >
            <option value="ALL">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* 3. Main Projects Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Project Number</th>
                <th className="py-3 px-4">Sales Order No</th>
                <th className="py-3 px-4">Customer &amp; End User</th>
                <th className="py-3 px-4">Project Name</th>
                <th className="py-3 px-4">Assigned Engineer</th>
                <th className="py-3 px-4">Drawing Progress</th>
                <th className="py-3 px-4">Target Date</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4 text-center whitespace-nowrap min-w-[140px]">Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading engineering projects...
                  </td>
                </tr>
              ) : projects.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-14 text-center text-slate-400">
                    <div className="max-w-md mx-auto space-y-2">
                      <FolderGit2 className="w-10 h-10 text-slate-300 mx-auto" />
                      <p className="font-semibold text-slate-700">No engineering projects found matching your criteria.</p>
                      <p className="text-xs text-slate-400">Create an engineering project from a confirmed Sales Order to initiate technical drawing preparation.</p>
                      <button
                        type="button"
                        onClick={openCreateModal}
                        className="mt-2 px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors cursor-pointer"
                      >
                        + Create Engineering Project
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                projects.map((p) => {
                  const total = p.stats?.totalDrawings || 0;
                  const approved = p.stats?.approvedDrawings || 0;
                  const submitted = p.stats?.submittedDrawings || 0;
                  const drawingProgress = total > 0 ? Math.round(((p.stats?.completedDrawings || 0) / total) * 100) : 0;
                  const approvalProgress = total > 0 ? Math.round((approved / total) * 100) : 0;

                  return (
                    <tr
                      key={p._id}
                      onClick={() => navigate(`/engineering/projects/${p._id}`)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                        {p.projectNumber}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-700 font-semibold">
                        {p.orderNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 truncate max-w-[170px]">
                          {p.customerName}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {p.customerCode || 'Direct Client'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800 max-w-[180px] truncate">
                        {p.projectName}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        <span className="font-medium">{p.assignedEngineerName || 'Unassigned'}</span>
                      </td>
                      <td className="py-3.5 px-4 min-w-[140px]">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 mb-1">
                          <span>{drawingProgress}% complete</span>
                          <span className="text-[10px] text-emerald-700 font-bold">{approved}/{total} Appr</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden flex">
                          <div
                            className="bg-emerald-500 h-full transition-all"
                            style={{ width: `${approvalProgress}%` }}
                          />
                          <div
                            className="bg-blue-500 h-full transition-all"
                            style={{ width: `${Math.max(0, drawingProgress - approvalProgress)}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                        {p.targetDate ? new Date(p.targetDate).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${getPriorityBadge(p.priority)}`}>
                          {p.priority}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap border shadow-2xs ${getStatusBadge(p.status)}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <Link
                          to={`/engineering/projects/${p._id}`}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition-colors inline-flex items-center"
                        >
                          Workspace <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center space-x-2">
                <FolderGit2 className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">Create Engineering Project</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Confirmed Sales Order *
                </label>
                {modalLoading ? (
                  <div className="py-4 text-center text-xs text-slate-400">Loading orders...</div>
                ) : (
                  <select
                    value={selectedOrderId}
                    onChange={(e) => setSelectedOrderId(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs text-slate-800 bg-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    {orders.map((o) => (
                      <option key={o._id} value={o._id}>
                        {o.orderNumber} — {o.customerName || 'Customer'} — {o.projectTitle} ({o.status})
                      </option>
                    ))}
                  </select>
                )}
                <p className="text-[11px] text-slate-400 mt-1">
                  Technical switchgear specs, voltage, current, and breaker ratings will be automatically imported from this order.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Project Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 bg-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value="URGENT">Urgent (Customer Expedited)</option>
                    <option value="HIGH">High (Standard Production)</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Target Engineering Completion Date
                  </label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 bg-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Technical Remarks &amp; Engineering Scope Notes
                </label>
                <textarea
                  rows={3}
                  value={technicalRemarks}
                  onChange={(e) => setTechnicalRemarks(e.target.value)}
                  placeholder="e.g. Incomer 11kV 630A VCB with dual CT ratio 200-100/5-5A, MiCOM P122 protection relay, Schneider MFM..."
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {creating ? 'Creating Project & Drawing Register...' : 'Create Project →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
