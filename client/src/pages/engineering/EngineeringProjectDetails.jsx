import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import {
  FolderGit2,
  Cpu,
  Layers,
  FileCheck2,
  Clock,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Calendar,
  Building2,
  ArrowLeft,
  Plus,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  FileText,
  Send,
  MessageSquare,
  ShieldCheck,
  Search,
  Upload,
  Download,
  Eye,
  SlidersHorizontal,
  Edit3,
  X,
  Check,
  FileSpreadsheet
} from 'lucide-react';

export const EngineeringProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [drawings, setDrawings] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [clarifications, setClarifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  // Modals state
  const [showDrawingModal, setShowDrawingModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [showClarificationModal, setShowClarificationModal] = useState(false);
  const [showEditSpecsModal, setShowEditSpecsModal] = useState(false);
  const [selectedDrawing, setSelectedDrawing] = useState(null);

  // Form states
  const [newDrawing, setNewDrawing] = useState({ drawingTitle: '', drawingType: 'GA', panelNumber: 'Panel 01', technicalNotes: '' });
  const [uploadFile, setUploadFile] = useState(null);
  const [reviewData, setReviewData] = useState({ result: 'Approved', comments: '', reworkNotes: '', checklist: [] });
  const [revisionData, setRevisionData] = useState({ revisionNumber: '', description: '', changeReason: '' });
  const [approvalData, setApprovalData] = useState({ status: 'Approved', approvedBy: '', comments: '' });
  const [submissionData, setSubmissionData] = useState({ drawingIds: [], submissionType: 'INITIAL_SUBMISSION', revision: 'Rev 0', submissionRemarks: '', emailReference: '' });
  const [clarificationData, setClarificationData] = useState({ clarificationType: 'ELECTRICAL', subject: '', question: '', priority: 'MEDIUM' });
  const [specsData, setSpecsData] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const fetchProjectDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get(`/engineering/projects/${id}`);
      if (res.success) {
        setProject(res.project);
        setDrawings(res.drawings || []);
        setSubmissions(res.submissions || []);
        setClarifications(res.clarifications || []);
        setSpecsData(res.project.technicalSpecs || {});
      } else {
        setError(res.message || 'Failed to load project.');
      }
    } catch (err) {
      setError(err.message || 'Error fetching engineering project details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectDetails();
  }, [id]);

  // Handle Add Drawing
  const handleAddDrawing = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await api.post('/engineering/drawings', {
        projectId: project._id,
        ...newDrawing
      });
      if (res.success) {
        setShowDrawingModal(false);
        setNewDrawing({ drawingTitle: '', drawingType: 'GA', panelNumber: 'Panel 01', technicalNotes: '' });
        await fetchProjectDetails();
      }
    } catch (err) {
      alert('Failed to add drawing: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Upload Drawing File
  const handleUploadFile = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      alert('Please select a CAD / PDF file.');
      return;
    }
    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('file', uploadFile);

      const res = await api.post(`/engineering/drawings/${selectedDrawing._id}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.success) {
        setShowUploadModal(false);
        setUploadFile(null);
        await fetchProjectDetails();
      }
    } catch (err) {
      alert('Upload failed: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Internal Review Submit
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await api.post(`/engineering/drawings/${selectedDrawing._id}/review`, reviewData);
      if (res.success) {
        setShowReviewModal(false);
        await fetchProjectDetails();
      }
    } catch (err) {
      alert('Failed to record review: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Create Revision
  const handleRevisionSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('revisionNumber', revisionData.revisionNumber);
      formData.append('description', revisionData.description);
      formData.append('changeReason', revisionData.changeReason);
      if (uploadFile) {
        formData.append('file', uploadFile);
      }

      const res = await api.post(`/engineering/drawings/${selectedDrawing._id}/revision`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.success) {
        setShowRevisionModal(false);
        setUploadFile(null);
        await fetchProjectDetails();
      }
    } catch (err) {
      alert('Failed to create revision: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Record Customer Approval
  const handleApprovalSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('status', approvalData.status);
      formData.append('approvedBy', approvalData.approvedBy || 'Customer Authority');
      formData.append('comments', approvalData.comments);
      if (uploadFile) {
        formData.append('file', uploadFile);
      }

      const res = await api.post(`/engineering/drawings/${selectedDrawing._id}/customer-approval`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.success) {
        setShowApprovalModal(false);
        setUploadFile(null);
        await fetchProjectDetails();
      }
    } catch (err) {
      alert('Failed to record approval: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Create Submission Package
  const handleCreateSubmission = async (e) => {
    e.preventDefault();
    if (submissionData.drawingIds.length === 0) {
      alert('Please select at least one drawing for submission.');
      return;
    }
    try {
      setSubmitting(true);
      const res = await api.post('/engineering/submissions', {
        projectId: project._id,
        ...submissionData
      });
      if (res.success) {
        setShowSubmissionModal(false);
        setSubmissionData({ drawingIds: [], submissionType: 'INITIAL_SUBMISSION', revision: 'Rev 0', submissionRemarks: '', emailReference: '' });
        await fetchProjectDetails();
      }
    } catch (err) {
      alert('Failed to create submission: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Raise Clarification
  const handleCreateClarification = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await api.post('/engineering/clarifications', {
        projectId: project._id,
        ...clarificationData
      });
      if (res.success) {
        setShowClarificationModal(false);
        setClarificationData({ clarificationType: 'ELECTRICAL', subject: '', question: '', priority: 'MEDIUM' });
        await fetchProjectDetails();
      }
    } catch (err) {
      alert('Failed to raise clarification: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Save Specs
  const handleSaveSpecs = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await api.put(`/engineering/projects/${project._id}/specs`, {
        technicalSpecs: specsData,
        changeReason: 'Technical specification refinement'
      });
      if (res.success) {
        setShowEditSpecsModal(false);
        await fetchProjectDetails();
      }
    } catch (err) {
      alert('Failed to save specs: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-500">Loading Engineering Workspace...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
        <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <p className="text-sm font-bold text-slate-800">{error || 'Engineering Project not found.'}</p>
        <Link to="/engineering/projects" className="text-xs text-blue-600 underline mt-2 inline-block">
          Return to Projects Register
        </Link>
      </div>
    );
  }

  const stats = project.stats || {};
  const specs = project.technicalSpecs || {};

  return (
    <div className="space-y-6 pb-24">
      {/* 1. Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-start space-x-3.5">
            <Link
              to="/engineering/projects"
              className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500 mt-1"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xl font-black text-slate-900 tracking-tight">
                  {project.projectNumber}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
                  {project.status}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                  Priority: {project.priority}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Project: <strong className="text-slate-800 font-semibold">{project.projectName}</strong> • Customer: <strong className="text-slate-800 font-semibold">{project.customerName}</strong> ({project.orderNumber})
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={fetchProjectDetails}
              className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setShowDrawingModal(true)}
              className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add Drawing
            </button>

            <button
              type="button"
              onClick={() => setShowSubmissionModal(true)}
              className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
              style={{ background: 'linear-gradient(90deg, #062B59 0%, #0878C9 100%)' }}
            >
              <Send className="w-4 h-4 mr-1.5" />
              New Customer Submission
            </button>
          </div>
        </div>

        {/* Metric Badges Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 pt-4 text-xs">
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Start Date</span>
            <span className="font-bold text-slate-800">
              {project.startDate ? new Date(project.startDate).toLocaleDateString('en-IN') : '—'}
            </span>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Target Date</span>
            <span className="font-bold text-blue-700">
              {project.targetDate ? new Date(project.targetDate).toLocaleDateString('en-IN') : '—'}
            </span>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Total Drawings</span>
            <span className="font-bold font-mono text-slate-800">{stats.totalDrawings || drawings.length}</span>
          </div>
          <div className="p-2.5 bg-purple-50/50 rounded-xl border border-purple-100">
            <span className="text-[10px] text-purple-700 block uppercase font-bold">Under Review</span>
            <span className="font-bold font-mono text-purple-900">
              {drawings.filter((d) => d.status === 'Internal Review').length}
            </span>
          </div>
          <div className="p-2.5 bg-blue-50/50 rounded-xl border border-blue-100">
            <span className="text-[10px] text-blue-700 block uppercase font-bold">Submitted</span>
            <span className="font-bold font-mono text-blue-900">
              {drawings.filter((d) => d.status === 'Submitted' || d.status === 'Under Customer Review').length}
            </span>
          </div>
          <div className="p-2.5 bg-emerald-50/50 rounded-xl border border-emerald-100">
            <span className="text-[10px] text-emerald-700 block uppercase font-bold">Approved</span>
            <span className="font-bold font-mono text-emerald-900">
              {drawings.filter((d) => d.status === 'Approved').length}
            </span>
          </div>
          <div className="p-2.5 bg-rose-50/50 rounded-xl border border-rose-100">
            <span className="text-[10px] text-rose-700 block uppercase font-bold">Revision Req</span>
            <span className="font-bold font-mono text-rose-900">
              {drawings.filter((d) => d.status === 'Revision Required').length}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="flex items-center space-x-1 border-b border-slate-200 overflow-x-auto pb-px">
        {[
          { key: 'overview', label: '1. Overview', icon: FolderGit2 },
          { key: 'specs', label: '2. Technical Specifications', icon: Cpu },
          { key: 'drawings', label: `3. Drawings (${drawings.length})`, icon: Layers },
          { key: 'submissions', label: `4. Customer Submissions (${submissions.length})`, icon: Send },
          { key: 'clarifications', label: `5. Clarifications (${clarifications.length})`, icon: MessageSquare },
          { key: 'documents', label: '6. Documents', icon: FileText },
          { key: 'timeline', label: '7. Activity Timeline', icon: Clock }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center space-x-2 py-3 px-4 border-b-2 font-bold text-xs whitespace-nowrap transition-colors cursor-pointer ${
                isActive
                  ? 'border-blue-600 text-blue-700 bg-blue-50/50 rounded-t-xl'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center">
                <Cpu className="w-4 h-4 text-blue-600 mr-2" />
                Switchgear System &amp; Scope Summary
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Equipment Type</span>
                  <span className="font-bold text-slate-800">{specs.equipmentType || 'HT Switchboard'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Voltage Rating</span>
                  <span className="font-bold text-slate-800">{specs.voltageRating || '11 kV'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Current Rating</span>
                  <span className="font-bold text-slate-800">{specs.currentRating || '630 A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Breaking Capacity</span>
                  <span className="font-bold text-slate-800">{specs.shortCircuitRating || '26.3 kA'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Busbar Material</span>
                  <span className="font-bold text-slate-800">{specs.busbarMaterial || 'Electrolytic Copper'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Cable Entry</span>
                  <span className="font-bold text-slate-800">{specs.cableEntry || 'Bottom Cable Entry'}</span>
                </div>
              </div>
            </div>

            {/* Quick Drawings Progress Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center">
                  <Layers className="w-4 h-4 text-blue-600 mr-2" />
                  Drawing Preparation &amp; Clearance Pipeline
                </h3>
                <button
                  onClick={() => setActiveTab('drawings')}
                  className="text-xs text-blue-600 hover:underline font-bold"
                >
                  Manage All Drawings →
                </button>
              </div>

              <div className="space-y-3">
                {drawings.slice(0, 5).map((d) => (
                  <div key={d._id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl text-xs">
                    <div>
                      <span className="font-mono font-bold text-blue-700">{d.drawingNumber}</span>
                      <p className="font-medium text-slate-800 mt-0.5">{d.drawingTitle}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white border border-slate-200">
                        {d.currentRevision}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                        {d.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Engineer Assignment & Project Info Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4 text-xs">
              <h3 className="font-bold text-slate-900 text-sm">Engineering Ownership</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-slate-400 text-[11px] block">Assigned Design Engineer</span>
                  <span className="font-bold text-slate-800 text-sm">{project.assignedEngineerName || 'Senior Electrical Engineer'}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Engineering Team</span>
                  <span className="font-medium text-slate-700">{project.engineeringTeam || 'Switchgear Design Dept'}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Sales Order Reference</span>
                  <Link to={`/orders/${project.salesOrderId?._id || project.salesOrderId}`} className="font-mono text-blue-600 font-bold hover:underline">
                    {project.orderNumber}
                  </Link>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Customer PO Ref</span>
                  <span className="font-mono text-slate-800 font-semibold">{project.customerPO || 'Direct Purchase Order'}</span>
                </div>
              </div>
            </div>

            {/* Downstream Manufacturing Handover Readiness */}
            <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-200 shadow-xs space-y-3 text-xs">
              <div className="flex items-center space-x-2 text-emerald-800 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Next Manufacturing Handover</span>
              </div>
              <p className="text-slate-600 text-[11px]">
                Upon 100% customer drawing approval and CT/PT specification clearance, this engineering project will automatically release data to:
              </p>
              <ul className="space-y-1.5 text-[11px] font-semibold text-slate-700 list-disc list-inside">
                <li>Bill of Materials (BOM) Finalization</li>
                <li>Copper Busbar &amp; Sheet Metal Procurement</li>
                <li>Stage 5: CT/PT Procurement &amp; Inward Testing</li>
                <li>Stage 6: Laser Fabrication &amp; Enclosure Assembly</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 4. TAB 2: TECHNICAL SPECIFICATIONS */}
      {activeTab === 'specs' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Technical Specifications &amp; Design Criteria</h3>
                <p className="text-xs text-slate-500">Comprehensive electrical parameters, CT/PT ratios, and protection relay coordination.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowEditSpecsModal(true)}
                className="inline-flex items-center px-3.5 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 mr-1.5" />
                Edit Specifications
              </button>
            </div>

            {/* Section A: Switchgear Core */}
            <div>
              <h4 className="text-xs font-black uppercase text-blue-900 tracking-wider mb-3 bg-blue-50/70 p-2 rounded-lg">
                1. Switchgear &amp; Panel Ratings
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div><span className="text-slate-400 block">Equipment</span><span className="font-bold text-slate-800">{specs.equipmentType}</span></div>
                <div><span className="text-slate-400 block">Switchgear Type</span><span className="font-bold text-slate-800">{specs.switchgearType}</span></div>
                <div><span className="text-slate-400 block">System Voltage</span><span className="font-bold text-slate-800">{specs.voltageRating}</span></div>
                <div><span className="text-slate-400 block">Rated Current</span><span className="font-bold text-slate-800">{specs.currentRating}</span></div>
                <div><span className="text-slate-400 block">Short Circuit Rating</span><span className="font-bold text-slate-800">{specs.shortCircuitRating} for {specs.shortCircuitDuration}</span></div>
                <div><span className="text-slate-400 block">Enclosure Location</span><span className="font-bold text-slate-800">{specs.indoorOutdoor}</span></div>
                <div><span className="text-slate-400 block">Number of Panels</span><span className="font-bold text-slate-800">{specs.panelCount} Panel(s)</span></div>
                <div><span className="text-slate-400 block">Panel Construction</span><span className="font-bold text-slate-800">{specs.panelType}</span></div>
              </div>
            </div>

            {/* Section B: CT & PT Details */}
            <div>
              <h4 className="text-xs font-black uppercase text-purple-900 tracking-wider mb-3 bg-purple-50/70 p-2 rounded-lg flex items-center justify-between">
                <span>2. Current Transformer (CT) &amp; Potential Transformer (PT) Parameters</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-purple-800">
                  CT Status: {specs.ctApprovalStatus || 'Draft'}
                </span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div><span className="text-slate-400 block">CT Type</span><span className="font-bold text-slate-800">{specs.ctType}</span></div>
                <div><span className="text-slate-400 block">CT Ratio</span><span className="font-bold font-mono text-purple-900">{specs.ctRatio}</span></div>
                <div><span className="text-slate-400 block">CT Accuracy &amp; Burden</span><span className="font-bold text-slate-800">{specs.accuracy}, {specs.burden}</span></div>
                <div><span className="text-slate-400 block">Core Details</span><span className="font-bold text-slate-800">{specs.coreClass}</span></div>
                <div><span className="text-slate-400 block">PT Type</span><span className="font-bold text-slate-800">{specs.ptType}</span></div>
                <div><span className="text-slate-400 block">PT Voltage Ratio</span><span className="font-bold font-mono text-purple-900">{specs.ptRatio}</span></div>
                <div><span className="text-slate-400 block">PT Burden &amp; Accuracy</span><span className="font-bold text-slate-800">{specs.ptBurden}, {specs.ptAccuracy}</span></div>
                <div><span className="text-slate-400 block">CT/PT Approved Makes</span><span className="font-bold text-slate-800">{specs.ctMake}</span></div>
              </div>
            </div>

            {/* Section C: Protection & Metering */}
            <div>
              <h4 className="text-xs font-black uppercase text-emerald-900 tracking-wider mb-3 bg-emerald-50/70 p-2 rounded-lg">
                3. Protection Relay &amp; Digital Metering
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div><span className="text-slate-400 block">Relay Model</span><span className="font-bold text-slate-800">{specs.relayModel}</span></div>
                <div><span className="text-slate-400 block">Relay Make</span><span className="font-bold text-slate-800">{specs.relayMake}</span></div>
                <div><span className="text-slate-400 block">Protection Functions</span><span className="font-bold text-slate-800">{specs.protectionFunctions}</span></div>
                <div><span className="text-slate-400 block">Communication</span><span className="font-bold text-slate-800">{specs.communicationProtocol}</span></div>
                <div><span className="text-slate-400 block">Digital MFM</span><span className="font-bold text-slate-800">{specs.meterModel}</span></div>
                <div><span className="text-slate-400 block">Meter Parameters</span><span className="font-bold text-slate-800">{specs.meteringRequirements}</span></div>
                <div><span className="text-slate-400 block">Auxiliary Voltage</span><span className="font-bold text-slate-800">{specs.controlVoltage}</span></div>
                <div><span className="text-slate-400 block">Anti-Condensation Heater</span><span className="font-bold text-slate-800">{specs.spaceHeaterAndThermostat}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. TAB 3: DRAWINGS */}
      {activeTab === 'drawings' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">Project Drawing Register ({drawings.length})</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDrawingModal(true)}
                className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add New Drawing
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <th className="py-3 px-4 whitespace-nowrap min-w-[160px]">Drawing No</th>
                    <th className="py-3 px-4 whitespace-nowrap min-w-[240px]">Drawing Title</th>
                    <th className="py-3 px-4 text-center whitespace-nowrap">Type</th>
                    <th className="py-3 px-4 whitespace-nowrap min-w-[140px]">Panel</th>
                    <th className="py-3 px-4 text-center whitespace-nowrap">Rev</th>
                    <th className="py-3 px-4 text-center whitespace-nowrap min-w-[150px]">Status</th>
                    <th className="py-3 px-4 text-center whitespace-nowrap">File</th>
                    <th className="py-3 px-4 text-right whitespace-nowrap min-w-[220px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {drawings.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-400">
                        No drawings found in register.
                      </td>
                    </tr>
                  ) : (
                    drawings.map((d) => (
                      <tr key={d._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-blue-700 whitespace-nowrap">{d.drawingNumber}</td>
                        <td className="py-3.5 px-4 font-medium text-slate-800 whitespace-nowrap">{d.drawingTitle}</td>
                        <td className="py-3.5 px-4 text-center text-slate-600 font-mono text-[11px] whitespace-nowrap">{d.drawingType}</td>
                        <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">{d.panelNumber}</td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <span className="font-mono font-bold text-slate-800 px-2 py-0.5 bg-slate-100 rounded-md border border-slate-200">
                            {d.currentRevision}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap border shadow-2xs ${
                            d.status === 'Approved'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : d.status === 'Submitted'
                              ? 'bg-blue-50 text-blue-800 border-blue-300'
                              : d.status === 'Internal Review'
                              ? 'bg-purple-50 text-purple-800 border-purple-300'
                              : d.status === 'Revision Required'
                              ? 'bg-rose-50 text-rose-800 border-rose-300'
                              : 'bg-amber-50 text-amber-800 border-amber-300'
                          }`}>
                            {d.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {d.fileUrl ? (
                            <a
                              href={d.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 hover:underline font-bold inline-flex items-center text-xs whitespace-nowrap px-2.5 py-1 rounded-lg bg-blue-50/80 border border-blue-200"
                            >
                              <Download className="w-3.5 h-3.5 mr-1" /> PDF / DWG
                            </a>
                          ) : (
                            <span className="text-slate-400 italic text-[11px] whitespace-nowrap">No file</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => { setSelectedDrawing(d); setShowUploadModal(true); }}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold cursor-pointer"
                              title="Upload CAD / PDF file"
                            >
                              <Upload className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => { setSelectedDrawing(d); setShowReviewModal(true); }}
                              className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-bold cursor-pointer"
                              title="Internal Quality Review"
                            >
                              Review
                            </button>
                            <button
                              onClick={() => { setSelectedDrawing(d); setShowRevisionModal(true); }}
                              className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-xs font-bold cursor-pointer"
                              title="Create New Revision"
                            >
                              Revise
                            </button>
                            <button
                              onClick={() => { setSelectedDrawing(d); setShowApprovalModal(true); }}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold cursor-pointer"
                              title="Customer Approval Stamp"
                            >
                              Approve
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 6. TAB 4: CUSTOMER SUBMISSIONS */}
      {activeTab === 'submissions' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Customer Drawing Submissions ({submissions.length})</h3>
                <p className="text-xs text-slate-500">Official transmittal packages sent to client authority for approval.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowSubmissionModal(true)}
                className="inline-flex items-center px-3.5 py-1.5 rounded-xl text-xs font-bold text-white cursor-pointer"
                style={{ background: 'linear-gradient(90deg, #062B59 0%, #0878C9 100%)' }}
              >
                <Send className="w-3.5 h-3.5 mr-1" />
                Create Submission Package
              </button>
            </div>

            <div className="p-4 divide-y divide-slate-100">
              {submissions.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No submission packages issued yet. Select ready drawings to generate a formal customer package.
                </div>
              ) : (
                submissions.map((sub) => (
                  <div key={sub._id} className="py-4 first:pt-0 last:pb-0 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-blue-700 text-sm">{sub.submissionNumber}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">{sub.revision}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">{sub.status}</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 font-medium">{sub.submissionRemarks}</p>
                      </div>
                      <div className="text-right text-xs">
                        <span className="text-slate-400 block text-[11px]">Submitted Date</span>
                        <span className="font-bold text-slate-800">{new Date(sub.submissionDate).toLocaleDateString('en-IN')}</span>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl">
                      <span className="text-[11px] font-bold text-slate-600 block mb-1.5">Bundled Drawings in Transmittal ({sub.drawings?.length || 0}):</span>
                      <div className="flex flex-wrap gap-2">
                        {sub.drawings?.map((item, idx) => (
                          <span key={idx} className="px-2 py-1 rounded-md bg-white border border-slate-200 text-xs font-mono font-medium text-slate-800">
                            {item.drawingNumber} ({item.revision})
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 7. TAB 5: TECHNICAL CLARIFICATIONS */}
      {activeTab === 'clarifications' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Technical Clarifications &amp; Queries ({clarifications.length})</h3>
                <p className="text-xs text-slate-500">Log customer and internal electrical/mechanical engineering questions.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowClarificationModal(true)}
                className="inline-flex items-center px-3.5 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Raise Clarification
              </button>
            </div>

            <div className="p-4 space-y-3">
              {clarifications.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No technical clarifications logged for this project.
                </div>
              ) : (
                clarifications.map((c) => (
                  <div key={c._id} className="p-4 border border-slate-200 rounded-xl space-y-2 hover:border-slate-300 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-blue-700 text-xs">{c.clarificationNumber}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">{c.clarificationType}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">{c.priority}</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                        {c.status}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 text-xs">{c.subject}</h4>
                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg">{c.question}</p>

                    {c.internalResponse && (
                      <div className="text-xs bg-purple-50/60 p-2.5 rounded-lg border border-purple-100">
                        <strong className="text-purple-900 block text-[11px]">Engineering Response:</strong>
                        <p className="text-slate-700 mt-0.5">{c.internalResponse}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 8. TAB 6: DOCUMENTS */}
      {activeTab === 'documents' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm">Project Technical Document Archive</h3>
            <span className="text-xs text-slate-400">PDF, DWG, DXF, Datasheets</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {drawings.filter((d) => d.fileUrl).map((d) => (
              <div key={d._id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <div className="truncate mr-2">
                  <span className="font-mono font-bold text-blue-700 block">{d.drawingNumber}</span>
                  <p className="text-slate-800 font-medium truncate">{d.drawingTitle}</p>
                  <span className="text-[10px] text-slate-400">{d.currentRevision} • {d.fileType}</span>
                </div>
                <a
                  href={d.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 bg-white hover:bg-blue-50 text-blue-600 rounded-lg border border-slate-200 transition-colors shrink-0"
                  title="Download / View"
                >
                  <Download className="w-4 h-4" />
                </a>
              </div>
            ))}
            {drawings.filter((d) => d.fileUrl).length === 0 && (
              <div className="col-span-3 py-10 text-center text-slate-400 text-xs">
                No uploaded drawing files in repository. Use "Add Drawing" or "Upload File" in the Drawings tab.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 9. TAB 7: TIMELINE */}
      {activeTab === 'timeline' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">Project Activity Audit Trail</h3>
          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {project.timeline?.map((evt, idx) => (
              <div key={idx} className="relative">
                <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-blue-600 ring-4 ring-white" />
                <div className="text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900">{evt.event}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(evt.timestamp).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <p className="text-slate-600 mt-0.5">{evt.notes}</p>
                  <span className="text-[10px] text-slate-400 block mt-0.5">By {evt.userName} ({evt.role})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: ADD DRAWING */}
      {showDrawingModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Add Drawing to Register</h3>
              <button onClick={() => setShowDrawingModal(false)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <form onSubmit={handleAddDrawing} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Drawing Title *</label>
                <input
                  type="text"
                  required
                  value={newDrawing.drawingTitle}
                  onChange={(e) => setNewDrawing({ ...newDrawing, drawingTitle: e.target.value })}
                  placeholder="e.g. Incomer GA Drawing with VCB Drawout"
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Drawing Type</label>
                  <select
                    value={newDrawing.drawingType}
                    onChange={(e) => setNewDrawing({ ...newDrawing, drawingType: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                  >
                    <option value="GA">General Arrangement (GA)</option>
                    <option value="SLD">Single Line Diagram (SLD)</option>
                    <option value="SCHEMATIC">Schematic Diagram</option>
                    <option value="CONTROL_WIRING">Control Wiring</option>
                    <option value="PROTECTION">Protection Circuit</option>
                    <option value="CT_CONNECTION">CT Connection</option>
                    <option value="PT_CONNECTION">PT Connection</option>
                    <option value="METERING">Metering Diagram</option>
                    <option value="PANEL_LAYOUT">Panel Layout</option>
                    <option value="BUSBAR">Busbar Arrangement</option>
                    <option value="FOUNDATION">Foundation Details</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Panel Identifier</label>
                  <input
                    type="text"
                    value={newDrawing.panelNumber}
                    onChange={(e) => setNewDrawing({ ...newDrawing, panelNumber: e.target.value })}
                    placeholder="Panel 01"
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Technical Notes</label>
                <textarea
                  rows={2}
                  value={newDrawing.technicalNotes}
                  onChange={(e) => setNewDrawing({ ...newDrawing, technicalNotes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowDrawingModal(false)} className="px-3 py-1.5 border rounded-lg">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-1.5 bg-blue-600 text-white font-bold rounded-lg">Add Drawing</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: UPLOAD FILE */}
      {showUploadModal && selectedDrawing && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Upload Drawing: {selectedDrawing.drawingNumber}</h3>
              <button onClick={() => setShowUploadModal(false)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <form onSubmit={handleUploadFile} className="space-y-4 text-xs">
              <div className="p-4 border-2 border-dashed border-slate-300 rounded-xl text-center space-y-2">
                <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-slate-600 font-medium">Select PDF, DWG, DXF, or PNG drawing file</p>
                <input
                  type="file"
                  required
                  accept=".pdf,.dwg,.dxf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx"
                  onChange={(e) => setUploadFile(e.target.files[0])}
                  className="text-xs"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowUploadModal(false)} className="px-3 py-1.5 border rounded-lg">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-1.5 bg-blue-600 text-white font-bold rounded-lg">
                  {submitting ? 'Uploading...' : 'Upload & Mark for Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: INTERNAL REVIEW */}
      {showReviewModal && selectedDrawing && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Internal Review: {selectedDrawing.drawingNumber}</h3>
              <button onClick={() => setShowReviewModal(false)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <form onSubmit={handleReviewSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Review Decision</label>
                <select
                  value={reviewData.result}
                  onChange={(e) => setReviewData({ ...reviewData, result: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                >
                  <option value="Approved">Approved (Clear for Customer Submission)</option>
                  <option value="Rework Required">Rework Required (Return to Design Engineer)</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Review Comments / Rework Instructions</label>
                <textarea
                  rows={3}
                  value={reviewData.comments}
                  onChange={(e) => setReviewData({ ...reviewData, comments: e.target.value, reworkNotes: e.target.value })}
                  placeholder="e.g. Verified 11kV clearances, CT ratio 200-100/5-5A confirmed, breaker auxiliary contacts checked."
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowReviewModal(false)} className="px-3 py-1.5 border rounded-lg">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-1.5 bg-purple-600 text-white font-bold rounded-lg">Save Review</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: CREATE REVISION */}
      {showRevisionModal && selectedDrawing && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Create Revision: {selectedDrawing.drawingNumber}</h3>
              <button onClick={() => setShowRevisionModal(false)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <form onSubmit={handleRevisionSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">New Revision Tag</label>
                <input
                  type="text"
                  placeholder="e.g. Rev A or Rev B"
                  value={revisionData.revisionNumber}
                  onChange={(e) => setRevisionData({ ...revisionData, revisionNumber: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Change Reason</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Customer requested CT ratio change to 400/5A"
                  value={revisionData.changeReason}
                  onChange={(e) => setRevisionData({ ...revisionData, changeReason: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Upload Revised Drawing (Optional)</label>
                <input
                  type="file"
                  onChange={(e) => setUploadFile(e.target.files[0])}
                  className="text-xs"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowRevisionModal(false)} className="px-3 py-1.5 border rounded-lg">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-1.5 bg-amber-600 text-white font-bold rounded-lg">Create Revision</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: RECORD CUSTOMER APPROVAL */}
      {showApprovalModal && selectedDrawing && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Customer Approval: {selectedDrawing.drawingNumber}</h3>
              <button onClick={() => setShowApprovalModal(false)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <form onSubmit={handleApprovalSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Customer Decision</label>
                <select
                  value={approvalData.status}
                  onChange={(e) => setApprovalData({ ...approvalData, status: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl font-bold"
                >
                  <option value="Approved">Approved (Clear for Production)</option>
                  <option value="Approved with Comments">Approved with Comments</option>
                  <option value="Revision Required">Revision Required (Customer Redlines)</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Customer Approver Name</label>
                <input
                  type="text"
                  placeholder="e.g. Chief Electrical Engineer / Inspection Authority"
                  value={approvalData.approvedBy}
                  onChange={(e) => setApprovalData({ ...approvalData, approvedBy: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Customer Approval Comments</label>
                <textarea
                  rows={2}
                  value={approvalData.comments}
                  onChange={(e) => setApprovalData({ ...approvalData, comments: e.target.value })}
                  placeholder="e.g. Approved for fabrication. Proceed with busbar assembly."
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Upload Stamped / Signed Approval PDF</label>
                <input
                  type="file"
                  onChange={(e) => setUploadFile(e.target.files[0])}
                  className="text-xs"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowApprovalModal(false)} className="px-3 py-1.5 border rounded-lg">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-1.5 bg-emerald-600 text-white font-bold rounded-lg">Save Approval</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: CREATE SUBMISSION PACKAGE */}
      {showSubmissionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Issue Customer Drawing Submission</h3>
              <button onClick={() => setShowSubmissionModal(false)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreateSubmission} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Drawings to Include *</label>
                <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-1.5 bg-slate-50">
                  {drawings.map((d) => (
                    <label key={d._id} className="flex items-center space-x-2 cursor-pointer hover:bg-white p-1 rounded">
                      <input
                        type="checkbox"
                        checked={submissionData.drawingIds.includes(d._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSubmissionData({ ...submissionData, drawingIds: [...submissionData.drawingIds, d._id] });
                          } else {
                            setSubmissionData({ ...submissionData, drawingIds: submissionData.drawingIds.filter((id) => id !== d._id) });
                          }
                        }}
                      />
                      <span className="font-mono font-bold text-blue-700">{d.drawingNumber}</span>
                      <span className="text-slate-700 truncate">{d.drawingTitle} ({d.currentRevision})</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Submission Type</label>
                  <select
                    value={submissionData.submissionType}
                    onChange={(e) => setSubmissionData({ ...submissionData, submissionType: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                  >
                    <option value="INITIAL_SUBMISSION">Initial Submission (Rev 0)</option>
                    <option value="REVISED_SUBMISSION">Revised Submission</option>
                    <option value="FINAL_APPROVAL_SET">Final Approval Set</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email / Transmittal Ref</label>
                  <input
                    type="text"
                    placeholder="e.g. SKY/ENG/2026/042"
                    value={submissionData.emailReference}
                    onChange={(e) => setSubmissionData({ ...submissionData, emailReference: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Transmittal Remarks</label>
                <textarea
                  rows={2}
                  value={submissionData.submissionRemarks}
                  onChange={(e) => setSubmissionData({ ...submissionData, submissionRemarks: e.target.value })}
                  placeholder="Official transmittal notes for customer review..."
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowSubmissionModal(false)} className="px-3 py-1.5 border rounded-lg">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-1.5 bg-blue-600 text-white font-bold rounded-lg">Send Package</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 7: RAISE CLARIFICATION */}
      {showClarificationModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Raise Technical Clarification</h3>
              <button onClick={() => setShowClarificationModal(false)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreateClarification} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Discipline / Type</label>
                  <select
                    value={clarificationData.clarificationType}
                    onChange={(e) => setClarificationData({ ...clarificationData, clarificationType: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                  >
                    <option value="ELECTRICAL">Electrical Ratings</option>
                    <option value="MECHANICAL">Mechanical / Dimensions</option>
                    <option value="CT_PT">CT / PT Parameters</option>
                    <option value="PROTECTION">Protection Relay</option>
                    <option value="METERING">Metering</option>
                    <option value="DRAWING">Drawing Discrepancy</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Priority</label>
                  <select
                    value={clarificationData.priority}
                    onChange={(e) => setClarificationData({ ...clarificationData, priority: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                  >
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Subject *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Confirmation of Metering CT secondary current (1A vs 5A)"
                  value={clarificationData.subject}
                  onChange={(e) => setClarificationData({ ...clarificationData, subject: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Technical Question *</label>
                <textarea
                  rows={3}
                  required
                  value={clarificationData.question}
                  onChange={(e) => setClarificationData({ ...clarificationData, question: e.target.value })}
                  placeholder="State the technical discrepancy or confirmation required from customer..."
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowClarificationModal(false)} className="px-3 py-1.5 border rounded-lg">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-1.5 bg-blue-600 text-white font-bold rounded-lg">Raise Query</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 8: EDIT SPECS */}
      {showEditSpecsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Edit Technical Specifications</h3>
              <button onClick={() => setShowEditSpecsModal(false)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <form onSubmit={handleSaveSpecs} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">CT Ratio</label>
                  <input
                    type="text"
                    value={specsData.ctRatio || ''}
                    onChange={(e) => setSpecsData({ ...specsData, ctRatio: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">CT Approval Status</label>
                  <select
                    value={specsData.ctApprovalStatus || 'Draft'}
                    onChange={(e) => setSpecsData({ ...specsData, ctApprovalStatus: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Submitted">Submitted</option>
                    <option value="Clarification Required">Clarification Required</option>
                    <option value="Approved">Approved</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">PT Voltage Ratio</label>
                  <input
                    type="text"
                    value={specsData.ptRatio || ''}
                    onChange={(e) => setSpecsData({ ...specsData, ptRatio: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Relay Model</label>
                  <input
                    type="text"
                    value={specsData.relayModel || ''}
                    onChange={(e) => setSpecsData({ ...specsData, relayModel: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowEditSpecsModal(false)} className="px-3 py-1.5 border rounded-lg">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-1.5 bg-blue-600 text-white font-bold rounded-lg">Save Specs</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
