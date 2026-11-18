import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import {
  Building2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Eye,
  FileText,
  Lock,
  Unlock,
  Send,
  RefreshCw,
  Search,
  Filter,
  Check,
  X,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  Download,
  CreditCard
} from 'lucide-react';
import { downloadEnquiryPDF } from '../../utils/pdfMakerService';

const DEPARTMENTS = [
  { sequence: 1, code: 'SALES', name: 'Sales & Marketing', canViewClient: true },
  { sequence: 2, code: 'PO_TEAM', name: 'PO Team', canViewClient: false },
  { sequence: 3, code: 'ACCOUNTANT', name: 'Advance Payment', canViewClient: true },
  { sequence: 4, code: 'DRAWING', name: 'Drawing / Order Acknowledgement', canViewClient: true },
  { sequence: 5, code: 'CT_PT', name: 'CT & PT', canViewClient: false },
  { sequence: 6, code: 'FABRICATION', name: 'Fabrication', canViewClient: false },
  { sequence: 7, code: 'METERING_DOOR', name: 'Metering Door', canViewClient: false },
  { sequence: 8, code: 'TESTING', name: 'Testing', canViewClient: false },
  { sequence: 9, code: 'DELIVERY', name: 'Delivery', canViewClient: true },
  { sequence: 10, code: 'INSTALLATION', name: 'Installation', canViewClient: true }
];

export const DepartmentWorkflowView = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAdmin, isManager, isSales, isAccountant } = useAuth();

  // Selected Department (default from URL or sequence 3 for Accountant, otherwise 2)
  const initialDeptSeq = Number(searchParams.get('dept')) || (user?.role === 'ACCOUNTANT' ? 3 : 2);
  const [selectedDeptSeq, setSelectedDeptSeq] = useState(initialDeptSeq);
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const tabsContainerRef = useRef(null);

  const scrollTabs = (direction) => {
    if (tabsContainerRef.current) {
      tabsContainerRef.current.scrollBy({
        left: direction === 'left' ? -260 : 260,
        behavior: 'smooth'
      });
    }
  };

  // Data states
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  // Modals
  const [actionModal, setActionModal] = useState({
    isOpen: false,
    type: 'ACCEPT', // 'ACCEPT' | 'REJECT' | 'FORWARD' | 'RESUBMIT'
    workflow: null,
    remarks: '',
    rejectionReason: '',
    responsibleDepartmentSequence: 1,
    submitting: false,
    validationError: ''
  });

  const activeDept = DEPARTMENTS.find((d) => d.sequence === selectedDeptSeq) || DEPARTMENTS[0];

  useEffect(() => {
    fetchWorkflows();
    fetchStats();
  }, [selectedDeptSeq, statusFilter]);

  // Close action modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && actionModal.isOpen && !actionModal.submitting) {
        closeActionModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [actionModal.isOpen, actionModal.submitting]);

  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        departmentSequence: selectedDeptSeq,
        departmentCode: activeDept.code
      };
      if (statusFilter !== 'ALL') {
        params.status = statusFilter;
      }
      const res = await api.get('/project-workflows', { params });
      if (res.success) {
        setWorkflows(res.workflows || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load project workflows');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/project-workflows/stats');
      if (res.success) {
        setStats(res.stats);
      }
    } catch (err) {
      // ignore
    }
  };

  const handleDepartmentChange = (seq) => {
    setSelectedDeptSeq(seq);
    setSearchParams({ dept: seq, status: statusFilter });
  };

  const openActionModal = (type, workflow) => {
    const enq = workflow?.enquiryId || {};
    const totalVal = Number(enq.commercialPricing?.totalAmount || enq.expectedProjectValue || 0);
    const existingAP = workflow?.advancePaymentDetails || enq.advancePaymentDetails || {};
    const defaultPct = existingAP.percentage || 50;
    const defaultAmt = existingAP.amount || (totalVal ? Math.round((totalVal * defaultPct) / 100) : 0);

    const existingDraw = workflow?.drawingOADetails || enq.drawingOADetails || {};
    const pid = workflow?.projectTrackingId || 'PRJ-2026-0001';
    const autoGANo = existingDraw.gaDrawingNumber || `GA-${pid}-R0`;
    const autoSLDNo = existingDraw.sldDrawingNumber || `SLD-${pid}`;
    const autoPINo = existingDraw.proformaInvoiceNumber || (enq.ern ? `PI-${enq.ern.replace(/^ERN-/, '')}` : `PI-${pid.replace(/^PRJ-/, '')}`);
    const autoOANo = existingDraw.orderAcknowledgementNumber || `OA-${pid.replace(/^PRJ-/, '')}`;
    const defaultCTRatio = existingDraw.ctRatioConfirmed || (enq.products?.[0]?.ampere ? `${enq.products[0].ampere.replace(/[^0-9]/g, '') || '630'}/5A, Class 0.5s, 15VA` : '200/5A, Class 0.5s, 15VA');
    const defaultDispatchDate = existingDraw.targetDispatchDate
      ? new Date(existingDraw.targetDispatchDate).toISOString().split('T')[0]
      : enq.project?.expectedDeliveryDate
      ? new Date(enq.project.expectedDeliveryDate).toISOString().split('T')[0]
      : '';

    const defaultRemarks =
      (selectedDeptSeq === 4 && (type === 'ACCEPT' || type === 'REACCEPT')
        ? 'GA Drawing, SLD, Proforma Invoice, and Order Acknowledgement verified and issued. CT ratio confirmed. Handed over to Stage 5: CT & PT.'
        : selectedDeptSeq === 3 && (type === 'ACCEPT' || type === 'REACCEPT')
        ? 'Advance payment received and verified. Cleared for Stage 4: Drawing / OA.'
        : selectedDeptSeq === 2 && type === 'ACCEPT'
        ? 'PO technical scope approved. Handed over to Stage 3: Advance Payment.'
        : existingAP.remarks || '');

    setActionModal({
      isOpen: true,
      type,
      workflow,
      remarks: defaultRemarks,
      rejectionReason: '',
      responsibleDepartmentSequence: selectedDeptSeq || 1,
      submitting: false,
      validationError: '',
      advancePaymentDetails: {
        amount: defaultAmt,
        percentage: defaultPct,
        paymentDate: existingAP.paymentDate
          ? new Date(existingAP.paymentDate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        paymentMode: existingAP.paymentMode || 'RTGS',
        referenceNumber: existingAP.referenceNumber || '',
        bankName: existingAP.bankName || 'HDFC Bank',
        status: existingAP.status || 'Received & Cleared'
      },
      drawingOADetails: {
        gaDrawingNumber: autoGANo,
        sldDrawingNumber: autoSLDNo,
        proformaInvoiceNumber: autoPINo,
        proformaInvoiceDate: existingDraw.proformaInvoiceDate
          ? new Date(existingDraw.proformaInvoiceDate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        orderAcknowledgementNumber: autoOANo,
        orderAcknowledgementDate: existingDraw.orderAcknowledgementDate
          ? new Date(existingDraw.orderAcknowledgementDate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        customerApprovalStatus: existingDraw.customerApprovalStatus || 'Approved with Code 1 (Clean)',
        ctRatioConfirmed: defaultCTRatio,
        targetDispatchDate: defaultDispatchDate,
        attachmentUrl: existingDraw.attachmentUrl || ''
      }
    });
  };

  const closeActionModal = () => {
    setActionModal({
      isOpen: false,
      type: 'ACCEPT',
      workflow: null,
      remarks: '',
      rejectionReason: '',
      responsibleDepartmentSequence: 1,
      submitting: false,
      validationError: '',
      advancePaymentDetails: {
        amount: 0,
        percentage: 50,
        paymentDate: '',
        paymentMode: 'RTGS',
        referenceNumber: '',
        bankName: '',
        status: 'Received & Cleared'
      },
      drawingOADetails: {
        gaDrawingNumber: '',
        sldDrawingNumber: '',
        proformaInvoiceNumber: '',
        proformaInvoiceDate: '',
        orderAcknowledgementNumber: '',
        orderAcknowledgementDate: '',
        customerApprovalStatus: 'Approved with Code 1 (Clean)',
        ctRatioConfirmed: '',
        targetDispatchDate: '',
        attachmentUrl: ''
      }
    });
  };

  const executeAction = async () => {
    const { type, workflow, remarks, rejectionReason, responsibleDepartmentSequence, advancePaymentDetails, drawingOADetails } = actionModal;
    if (!workflow) return;

    if (type === 'REJECT') {
      if (!rejectionReason.trim() || !remarks.trim()) {
        setActionModal((prev) => ({
          ...prev,
          validationError: 'Both Rejection Reason and Remarks are strictly mandatory.'
        }));
        return;
      }
    }

    if (type === 'REACCEPT') {
      if (!remarks.trim()) {
        setActionModal((prev) => ({
          ...prev,
          validationError: 'Re-assignment and resolution remarks are strictly mandatory.'
        }));
        return;
      }
    }

    try {
      setActionModal((prev) => ({ ...prev, submitting: true, validationError: '' }));

      if (type === 'ACCEPT' || type === 'REJECT' || type === 'REACCEPT') {
        const payload = {
          action: type,
          departmentSequence: selectedDeptSeq,
          remarks,
          rejectionReason,
          responsibleDepartmentSequence
        };

        // When accepting Stage 3 (Advance Payment), attach advancePaymentDetails
        if (selectedDeptSeq === 3 && (type === 'ACCEPT' || type === 'REACCEPT')) {
          payload.advancePaymentDetails = advancePaymentDetails;
        }

        // When accepting Stage 4 (Drawing / OA), attach drawingOADetails
        if (selectedDeptSeq === 4 && (type === 'ACCEPT' || type === 'REACCEPT')) {
          payload.drawingOADetails = drawingOADetails;
        }

        await api.post(`/project-workflows/${workflow._id}/department-action`, payload);
      } else if (type === 'FORWARD') {
        await api.post(`/project-workflows/${workflow._id}/manager-forward`, {
          remarks
        });
      } else if (type === 'RESUBMIT') {
        await api.post(`/project-workflows/${workflow._id}/sales-resubmit`, {
          remarks
        });
      } else if (type === 'SUBMIT_MANAGER') {
        await api.post(`/project-workflows/${workflow._id}/submit-manager`, {
          remarks
        });
      }

      closeActionModal();
      fetchWorkflows();
      fetchStats();
    } catch (err) {
      setActionModal((prev) => ({
        ...prev,
        submitting: false,
        validationError: err.response?.data?.message || err.message || 'Operation failed'
      }));
    }
  };

  // Helper to determine workflow approval status at the selected department
  const getWorkflowDeptStatus = (w, deptSeq) => {
    const currentApp = (w.approvals || []).find((a) => a.departmentSequence === deptSeq);
    if (currentApp?.status) {
      return currentApp.status; // 'Pending', 'Accepted', 'Rejected', 'Waiting'
    }
    if (w.currentDepartmentSequence === deptSeq) {
      return 'Pending';
    }
    return 'Waiting';
  };

  const statusPriority = {
    Pending: 1,
    Accepted: 2,
    Rejected: 3,
    Waiting: 4
  };

  // Filtered and sorted workflows:
  // 1. Pending requests at the top (sequential by Project Tracking ID)
  // 2. Accepted / Approved requests in the middle (sequential by Project Tracking ID)
  // 3. Rejected requests at the bottom (sequential by Project Tracking ID)
  const filteredWorkflows = workflows
    .filter((w) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      const trackingId = w.projectTrackingId?.toLowerCase() || '';
      const ern = w.enquiryId?.ern?.toLowerCase() || '';
      const projName = w.enquiryId?.project?.projectName?.toLowerCase() || '';
      const clientName = w.enquiryId?.clientId?.companyName?.toLowerCase() || '';
      return trackingId.includes(q) || ern.includes(q) || projName.includes(q) || clientName.includes(q);
    })
    .sort((a, b) => {
      const statusA = getWorkflowDeptStatus(a, selectedDeptSeq);
      const statusB = getWorkflowDeptStatus(b, selectedDeptSeq);

      const priorityA = statusPriority[statusA] || 99;
      const priorityB = statusPriority[statusB] || 99;

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      // Within the same status priority: sequentially based on project ID
      const idA = a.projectTrackingId || '';
      const idB = b.projectTrackingId || '';
      return idA.localeCompare(idB, undefined, { numeric: true, sensitivity: 'base' });
    });

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-black px-2 py-0.5 rounded bg-blue-600 text-white uppercase tracking-wider">
              10-DEPARTMENT WORKFLOW
            </span>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Department-Wise Project Tracking & Approval
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Standard Operating Procedure &bull; Sequential Department Approvals &bull; Controlled Data Access
          </p>
        </div>

        {/* Global Summary Stats */}
        {stats && (
          <div className="flex items-center space-x-3 text-xs">
            <div className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 font-bold">
              Total: {stats.totalProjects}
            </div>
            <div className="px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 font-bold">
              Review: {stats.pendingManagerReview}
            </div>
            <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 font-bold">
              Done: {stats.completedCount}
            </div>
          </div>
        )}
      </div>

      {/* 10 Department Navigation Tabs (Sequential 1 to 10) */}
      <div className="bg-white rounded-xl border border-slate-200 p-2 shadow-sm relative flex items-center">
        <button
          onClick={() => scrollTabs('left')}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 shrink-0 transition-colors mr-1"
          title="Scroll Left"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div
          ref={tabsContainerRef}
          className="flex items-center space-x-1.5 overflow-x-auto scroll-smooth py-1 px-1 flex-1 no-scrollbar"
          style={{ scrollbarWidth: 'thin' }}
        >
          {DEPARTMENTS.map((dept) => {
            const isSelected = dept.sequence === selectedDeptSeq;
            const pendingCount = stats?.departmentPending?.[dept.code]?.count || 0;

            return (
              <button
                key={dept.code}
                onClick={() => handleDepartmentChange(dept.sequence)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-bold transition-all shrink-0 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 ring-2 ring-blue-600/30'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                    isSelected ? 'bg-white text-blue-600' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {dept.sequence}
                </span>
                <span className="whitespace-nowrap">{dept.name}</span>

                {/* Client visibility badge icon */}
                {dept.canViewClient ? (
                  <Unlock
                    className={`w-3 h-3 ${isSelected ? 'text-blue-200' : 'text-emerald-500'}`}
                    title="Full Client Details Visible"
                  />
                ) : (
                  <Lock
                    className={`w-3 h-3 ${isSelected ? 'text-blue-200' : 'text-amber-500'}`}
                    title="Client Details Restricted / Masked"
                  />
                )}

                {/* Pending count badge */}
                {pendingCount > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                      isSelected ? 'bg-amber-400 text-slate-950' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {pendingCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => scrollTabs('right')}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 shrink-0 transition-colors ml-1"
          title="Scroll Right"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Department Notice Banner: Strict Client Data Visibility & Quotation Download Rule */}
      <div
        className={`rounded-xl p-3.5 border flex items-center justify-between text-xs font-medium ${
          activeDept.canViewClient
            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
            : 'bg-amber-50/80 border-amber-200 text-amber-900'
        }`}
      >
        <div className="flex items-center space-x-2.5">
          {activeDept.canViewClient ? (
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
          )}
          <span>
            {activeDept.canViewClient ? (
              <>
                <strong>Client & Commercial Quotation Access Authorized:</strong> Stage {activeDept.sequence} ({activeDept.name}) has full permission to view customer details and download official quotation PDFs.
              </>
            ) : (
              <>
                <strong>Technical Stage (No Client / Commercial Access):</strong> Client contact details and commercial quotation downloads are restricted for {activeDept.name}. Only engineering specifications are visualized.
              </>
            )}
          </span>
        </div>
        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-white/70 border border-current">
          Stage {activeDept.sequence} of 10
        </span>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-slate-500">Filter Queue:</span>
          {['ALL', 'Pending', 'Accepted', 'Rejected'].map((status) => (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status);
                setSearchParams({ dept: selectedDeptSeq, status });
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                statusFilter === status
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search Tracking ID, ERN, Project..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              title="Clear search filter"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Search Filter Active Notice */}
      {searchQuery && (
        <div className="bg-blue-50/80 border border-blue-200 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-blue-900">
          <span>
            Search Active: Filtering queue by <strong>"{searchQuery}"</strong> &bull; Showing{' '}
            <strong>{filteredWorkflows.length}</strong> of <strong>{workflows.length}</strong> total projects in {activeDept.name}
          </span>
          <button
            onClick={() => setSearchQuery('')}
            className="text-xs font-black text-blue-700 hover:text-blue-900 underline ml-2 cursor-pointer"
          >
            Clear Search Filter
          </button>
        </div>
      )}

      {/* Projects List / Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-semibold text-slate-500">Loading department queue...</p>
          </div>
        ) : filteredWorkflows.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-bold text-slate-600">No projects match the current filter</p>
            {searchQuery ? (
              <p className="text-slate-500 mt-1">
                No project matches "{searchQuery}".{' '}
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-blue-600 font-bold underline cursor-pointer"
                >
                  Clear search
                </button>{' '}
                to see all {workflows.length} projects in {activeDept.name}.
              </p>
            ) : (
              <p className="text-slate-400 mt-0.5">
                Projects will appear here when forwarded to {activeDept.name}.
              </p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Tracking ID & ERN</th>
                  <th className="py-3 px-4">Project & Line Items</th>
                  <th className="py-3 px-4">
                    {activeDept.canViewClient ? 'Client Information' : 'Technical Ratings & Enclosure'}
                  </th>
                  <th className="py-3 px-4">Stage & Status</th>
                  <th className="py-3 px-4 text-right">Workflow Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredWorkflows.map((w) => {
                  const enq = w.enquiryId || {};
                  const client = enq.clientId || {};
                  const isCurrentDept = w.currentDepartmentSequence === selectedDeptSeq;
                  const currentApp = (w.approvals || []).find(
                    (a) => a.departmentSequence === selectedDeptSeq
                  );
                  const isPending = currentApp?.status === 'Pending' || (isCurrentDept && w.overallStatus.includes('Review'));

                  return (
                    <tr key={w._id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Tracking ID & ERN */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="space-y-1">
                          <span className="font-black text-slate-900 tracking-tight text-xs block">
                            {w.projectTrackingId}
                          </span>
                          <span className="text-[11px] font-bold text-blue-600 block">
                            ERN: {enq.ern || 'N/A'}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            {new Date(w.createdAt).toLocaleDateString('en-IN')}
                          </span>
                        </div>
                      </td>

                      {/* Project & Line Items */}
                      <td className="py-3.5 px-4 align-top max-w-xs">
                        <div className="space-y-1">
                          <p className="font-bold text-slate-800 line-clamp-1">
                            {enq.project?.projectName || 'HT Switchgear Engineering & Supply'}
                          </p>
                          <p className="text-[11px] text-slate-500 line-clamp-2">
                            {enq.products?.[0]?.productDescription ||
                              '11kV, 630A, 25kA Outdoor Standalone VCB'}
                          </p>
                          <div className="flex items-center space-x-2">
                            <span className="inline-block text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                              {enq.project?.segment || 'Renewable'} &bull; Qty: {enq.products?.length || 1}
                            </span>
                            <span className="text-[11px] font-mono font-extrabold text-slate-900 bg-blue-50/80 text-blue-900 px-2 py-0.5 rounded border border-blue-200">
                              ₹ {Number(enq.commercialPricing?.totalAmount || enq.expectedProjectValue || 0).toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Client Info or Technical Scope based on activeDept.canViewClient */}
                      <td className="py-3.5 px-4 align-top max-w-xs">
                        {activeDept.canViewClient ? (
                          <div className="space-y-0.5">
                            <p className="font-bold text-slate-900">{client.companyName || 'N/A'}</p>
                            <p className="text-[11px] text-slate-600">
                              Contact: <span className="font-medium text-slate-800">{client.contactPerson || 'N/A'}</span>
                            </p>
                            <p className="text-[10px] text-slate-500">
                              Phone: <span className="font-medium text-slate-700">{client.mobile || 'N/A'}</span>
                            </p>
                            <p className="text-[10px] text-slate-400 line-clamp-1">
                              {client.siteAddress || 'Site Delivery Location'}
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="flex items-center space-x-1.5">
                              <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                                {enq.products?.[0]?.kilovolt || '11kV'}, {enq.products?.[0]?.ampere || '630A'}
                              </span>
                              <span className="font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                                {enq.products?.[0]?.kiloampere || '25kA'} ({enq.products?.[0]?.durationSec || '3s'})
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600">
                              Enclosure: <strong className="text-slate-800">{enq.products?.[0]?.usage || 'Outdoor'}</strong> &bull; {enq.products?.[0]?.ebMetering || 'Transformer Control'}
                            </p>
                            <div className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px] font-medium border border-slate-200">
                              <Lock className="w-2.5 h-2.5 mr-1 text-slate-400" />
                              <span>Client Details Hidden</span>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Stage & Status */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="space-y-1">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                              currentApp?.status === 'Accepted'
                                ? 'bg-emerald-100 text-emerald-800'
                                : currentApp?.status === 'Rejected'
                                ? 'bg-rose-100 text-rose-800'
                                : isCurrentDept
                                ? 'bg-blue-100 text-blue-800 animate-pulse'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {currentApp?.status || 'Waiting'}
                          </span>
                          <p className="text-[10px] text-slate-500 font-medium">
                            Stage: {w.currentDepartmentSequence}/10
                          </p>
                          <p className="text-[10px] font-bold text-slate-700">
                            {w.overallStatus}
                          </p>

                          {/* Stage 3 Advance Payment Badge */}
                          {(selectedDeptSeq === 3 || w.advancePaymentDetails?.amount > 0) && w.advancePaymentDetails?.amount > 0 && (
                            <div className="mt-1 p-1.5 bg-emerald-50 border border-emerald-200 rounded text-[10px] text-emerald-800 font-bold space-y-0.5">
                              <div className="flex items-center space-x-1">
                                <CreditCard className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span>Advance: ₹{Number(w.advancePaymentDetails.amount).toLocaleString('en-IN')}</span>
                              </div>
                              {w.advancePaymentDetails.paymentDate && (
                                <span className="text-[9px] text-slate-500 font-mono block">
                                  {new Date(w.advancePaymentDetails.paymentDate).toLocaleDateString('en-IN')} &bull; {w.advancePaymentDetails.paymentMode || 'RTGS'}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Stage 4 Drawing & OA Badge */}
                          {(selectedDeptSeq === 4 || w.drawingOADetails?.gaDrawingNumber) && w.drawingOADetails?.gaDrawingNumber && (
                            <div className="mt-1 p-1.5 bg-blue-50 border border-blue-200 rounded text-[10px] text-blue-900 font-bold space-y-0.5">
                              <div className="flex items-center space-x-1">
                                <FileText className="w-3 h-3 text-blue-600 shrink-0" />
                                <span>GA: {w.drawingOADetails.gaDrawingNumber}</span>
                              </div>
                              <span className="text-[9px] text-slate-600 font-mono block">
                                OA: {w.drawingOADetails.orderAcknowledgementNumber || 'Issued'} &bull; {w.drawingOADetails.customerApprovalStatus || 'Code 1'}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 align-top text-right">
                        <div className="flex flex-col items-end space-y-1.5">
                          {/* Timeline Link */}
                          <button
                            onClick={() => navigate(`/projects/tracking/${w.projectTrackingId}`)}
                            className="inline-flex items-center text-xs font-bold text-blue-600 hover:text-blue-800"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" /> View Timeline
                          </button>

                          {/* Quotation PDF Download: Strictly available only for the 4 departments permitted to view client details */}
                          {activeDept.canViewClient && (
                            <button
                              onClick={() => downloadEnquiryPDF(enq)}
                              className="inline-flex items-center text-[11px] font-semibold text-slate-600 hover:text-slate-900"
                            >
                              <Download className="w-3 h-3 mr-1" /> Quotation PDF
                            </button>
                          )}

                          {/* Department 2 to 10 Accept / Reject Buttons: General Manager, Admin, and Accountant (for Stage 3) */}
                          {(isAdmin || isManager || (isAccountant && selectedDeptSeq === 3)) && (
                            <div className="flex items-center space-x-1.5 pt-1">
                              {/* If project was REJECTED at this department: Show Re-assign & Re-Accept */}
                              {currentApp?.status === 'Rejected' && (
                                <button
                                  onClick={() => openActionModal('REACCEPT', w)}
                                  className="px-2.5 py-1 bg-gradient-to-r from-amber-600 to-emerald-600 hover:from-amber-700 hover:to-emerald-700 text-white rounded text-[11px] font-bold shadow-xs transition-all flex items-center space-x-1 cursor-pointer"
                                  title="Re-assign project with remarks and re-accept to move forward"
                                >
                                  <RefreshCw className="w-3 h-3 mr-1" />
                                  <span>Re-assign &amp; Re-Accept</span>
                                </button>
                              )}

                              {/* Normal Accept / Reject for Pending projects */}
                              {isCurrentDept && currentApp?.status !== 'Accepted' && currentApp?.status !== 'Rejected' && (
                                <>
                                  <button
                                    onClick={() => openActionModal('ACCEPT', w)}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold shadow-xs transition-colors cursor-pointer flex items-center space-x-1"
                                  >
                                    {selectedDeptSeq === 2 ? (
                                      <span>Approve PO &amp; Forward →</span>
                                    ) : selectedDeptSeq === 3 ? (
                                      <>
                                        <CreditCard className="w-3 h-3 mr-0.5" />
                                        <span>Clear Advance Payment</span>
                                      </>
                                    ) : selectedDeptSeq === 4 ? (
                                      <>
                                        <FileText className="w-3 h-3 mr-0.5" />
                                        <span>Approve Drawing &amp; OA →</span>
                                      </>
                                    ) : (
                                      <span>Accept</span>
                                    )}
                                  </button>
                                  <button
                                    onClick={() => openActionModal('REJECT', w)}
                                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] font-bold shadow-xs transition-colors cursor-pointer"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                            </div>
                          )}

                          {/* Sales & Marketing View Indicator */}
                          {!isAdmin && !isManager && !isAccountant && isCurrentDept && currentApp?.status !== 'Accepted' && (
                            <span className="text-[10px] text-slate-400 font-medium italic pt-1">
                              Tracking (Manager Action)
                            </span>
                          )}

                          {/* Manager Forward Button when project is submitted */}
                          {(isAdmin || isManager) && w.overallStatus === 'Pending Manager Review' && (
                            <button
                              onClick={() => openActionModal('FORWARD', w)}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-bold shadow-xs transition-colors"
                            >
                              Forward to PO
                            </button>
                          )}

                          {/* Sales Resubmit Button when project is returned */}
                          {(isAdmin || isSales) && w.overallStatus === 'Returned for Sales & Marketing Review' && (
                            <button
                              onClick={() => openActionModal('RESUBMIT', w)}
                              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[11px] font-bold shadow-xs transition-colors"
                            >
                              Resubmit for Review
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Action Dialog / Modal (Accept / Reject / Forward / Resubmit) */}
      {actionModal.isOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget && !actionModal.submitting) closeActionModal();
          }}
        >
          <div className="relative bg-white rounded-2xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-auto overflow-hidden">
            {/* Modal Header - Sticky */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white z-10">
              <div className="flex items-center space-x-2.5">
                {selectedDeptSeq === 3 && (actionModal.type === 'ACCEPT' || actionModal.type === 'REACCEPT') ? (
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold border border-emerald-100 shrink-0">
                    <CreditCard className="w-5 h-5 text-emerald-600" />
                  </div>
                ) : selectedDeptSeq === 4 && (actionModal.type === 'ACCEPT' || actionModal.type === 'REACCEPT') ? (
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold border border-blue-100 shrink-0">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                ) : null}
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900">
                    {actionModal.type === 'ACCEPT' &&
                      (selectedDeptSeq === 2
                        ? 'Stage 2: Approve PO & Forward to Stage 3'
                        : selectedDeptSeq === 3
                        ? 'Stage 3: Customer Advance Payment Clearance'
                        : selectedDeptSeq === 4
                        ? 'Stage 4: Drawing / Proforma Invoice / Order Acknowledgement Clearance'
                        : `Accept Stage: ${activeDept.name}`)}
                    {actionModal.type === 'REJECT' && `Reject & Return to Sales: ${activeDept.name}`}
                    {actionModal.type === 'REACCEPT' && `Re-assign & Re-Accept: ${activeDept.name}`}
                    {actionModal.type === 'FORWARD' && 'Manager Review & Forward'}
                    {actionModal.type === 'RESUBMIT' && 'Resubmit Project after Rework'}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {actionModal.workflow?.projectTrackingId} &bull; {actionModal.workflow?.enquiryId?.clientId?.companyName || 'Sky Power Client'}
                  </p>
                  {selectedDeptSeq === 3 && (actionModal.type === 'ACCEPT' || actionModal.type === 'REACCEPT') && (
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      <span className="text-[11px] font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        Total Project Value: <strong className="font-mono text-slate-900">₹ {Number(actionModal.workflow?.enquiryId?.commercialPricing?.totalAmount || actionModal.workflow?.enquiryId?.expectedProjectValue || 0).toLocaleString('en-IN')}</strong>
                      </span>
                      <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Standard 50%: <strong className="font-mono text-emerald-700">₹ {Math.round(Number(actionModal.workflow?.enquiryId?.commercialPricing?.totalAmount || actionModal.workflow?.enquiryId?.expectedProjectValue || 0) * 0.5).toLocaleString('en-IN')}</strong>
                      </span>
                    </div>
                  )}
                  {selectedDeptSeq === 4 && (actionModal.type === 'ACCEPT' || actionModal.type === 'REACCEPT') && (
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      <span className="text-[11px] font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        Scope: <strong className="text-slate-900">{actionModal.workflow?.enquiryId?.project?.projectName || 'Switchgear Engineering'}</strong>
                      </span>
                      <span className="text-[11px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        Rating: <strong className="font-mono text-blue-900">{actionModal.workflow?.enquiryId?.products?.[0]?.kilovolt || '11kV'}, {actionModal.workflow?.enquiryId?.products?.[0]?.ampere || '630A'}</strong>
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={closeActionModal}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                title="Close (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold block">Project Tracking ID</span>
                  <span className="font-mono font-bold text-slate-900 text-xs">{actionModal.workflow?.projectTrackingId}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold block">Active Department</span>
                  <span className="font-bold text-slate-800 text-xs">{activeDept.name} (Stage {selectedDeptSeq})</span>
                </div>
              </div>

              {/* Notice when approving Stage 2 (PO Team) */}
              {selectedDeptSeq === 2 && actionModal.type === 'ACCEPT' && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center space-x-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    Approving PO Team stage will complete the PO module and automatically forward this project to <strong>Stage 3: Advance Payment</strong>.
                  </span>
                </div>
              )}

              {/* Advance Payment Form when at Stage 3 */}
              {selectedDeptSeq === 3 && (actionModal.type === 'ACCEPT' || actionModal.type === 'REACCEPT') && (
                <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 space-y-3.5">
                  <div className="flex items-center justify-between border-b border-blue-200/80 pb-2">
                    <div className="flex items-center space-x-2 text-xs font-black text-[#1E5BB8]">
                      <CreditCard className="w-4 h-4 text-[#EE6F2D]" />
                      <span>Stage 3: Advance Payment Receipt Recording</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                      Standard Terms: 50% Advance
                    </span>
                  </div>

                  {/* Summary of Commercial Value */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-white p-2.5 rounded-lg border border-blue-100">
                    <div>
                      <span className="text-slate-400 font-medium block text-[10px]">Total Project Value:</span>
                      <span className="font-mono font-extrabold text-slate-900">
                        ₹ {Number(actionModal.workflow?.enquiryId?.commercialPricing?.totalAmount || actionModal.workflow?.enquiryId?.expectedProjectValue || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium block text-[10px]">Client / Buyer:</span>
                      <span className="font-bold text-slate-900 truncate block">
                        {actionModal.workflow?.enquiryId?.clientId?.companyName || 'Valued Client'}
                      </span>
                    </div>
                  </div>

                  {/* Quick percentage selector pills */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="font-bold text-slate-700">Advance Percentage (%)</label>
                      <div className="flex items-center space-x-1">
                        <span className="text-[10px] text-slate-400 font-semibold mr-1">Presets:</span>
                        {[20, 25, 30, 50, 100].map((pct) => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => {
                              const total = Number(actionModal.workflow?.enquiryId?.commercialPricing?.totalAmount || actionModal.workflow?.enquiryId?.expectedProjectValue || 0);
                              const amt = Math.round((total * pct) / 100);
                              setActionModal((prev) => ({
                                ...prev,
                                advancePaymentDetails: {
                                  ...prev.advancePaymentDetails,
                                  percentage: pct,
                                  amount: amt
                                }
                              }));
                            }}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                              (actionModal.advancePaymentDetails?.percentage || 50) === pct
                                ? 'bg-[#1E5BB8] text-white border-[#1E5BB8]'
                                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                            }`}
                          >
                            {pct}%
                          </button>
                        ))}
                      </div>
                    </div>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={actionModal.advancePaymentDetails?.percentage || 50}
                      onChange={(e) => {
                        const pct = Number(e.target.value) || 0;
                        const total = Number(actionModal.workflow?.enquiryId?.commercialPricing?.totalAmount || actionModal.workflow?.enquiryId?.expectedProjectValue || 0);
                        const amt = Math.round((total * pct) / 100);
                        setActionModal((prev) => ({
                          ...prev,
                          advancePaymentDetails: {
                            ...prev.advancePaymentDetails,
                            percentage: pct,
                            amount: amt
                          }
                        }));
                      }}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  {/* Advance Input Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-bold text-slate-700">
                          Advance Amount Received (₹) <span className="text-rose-600">*</span>
                        </label>
                        {actionModal.advancePaymentDetails?.percentage ? (
                          <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                            {actionModal.advancePaymentDetails.percentage}% of Total
                          </span>
                        ) : null}
                      </div>
                      <input
                        type="number"
                        min="0"
                        value={actionModal.advancePaymentDetails?.amount ?? ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          const amt = val === '' ? '' : Number(val);
                          const total = Number(actionModal.workflow?.enquiryId?.commercialPricing?.totalAmount || actionModal.workflow?.enquiryId?.expectedProjectValue || 0);
                          const calcPct = total > 0 && typeof amt === 'number' ? Math.min(100, Math.round((amt / total) * 100)) : actionModal.advancePaymentDetails?.percentage;
                          setActionModal((prev) => ({
                            ...prev,
                            advancePaymentDetails: {
                              ...prev.advancePaymentDetails,
                              amount: amt,
                              percentage: typeof amt === 'number' && total > 0 ? calcPct : prev.advancePaymentDetails?.percentage
                            }
                          }));
                        }}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-mono font-bold text-emerald-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                      {typeof actionModal.advancePaymentDetails?.amount === 'number' && actionModal.advancePaymentDetails.amount > 0 && (
                        <p className="text-[11px] text-emerald-800 font-bold mt-1">
                          ₹ {Number(actionModal.advancePaymentDetails.amount).toLocaleString('en-IN')}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Payment Received Date <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="date"
                        value={actionModal.advancePaymentDetails?.paymentDate || ''}
                        onChange={(e) => {
                          const dateVal = e.target.value;
                          setActionModal((prev) => ({
                            ...prev,
                            advancePaymentDetails: {
                              ...prev.advancePaymentDetails,
                              paymentDate: dateVal
                            }
                          }));
                        }}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Payment Mode
                      </label>
                      <select
                        value={actionModal.advancePaymentDetails?.paymentMode || 'RTGS'}
                        onChange={(e) => {
                          const mode = e.target.value;
                          setActionModal((prev) => ({
                            ...prev,
                            advancePaymentDetails: {
                              ...prev.advancePaymentDetails,
                              paymentMode: mode
                            }
                          }));
                        }}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="RTGS">RTGS</option>
                        <option value="NEFT">NEFT</option>
                        <option value="Bank Transfer">Bank Transfer / IMPS</option>
                        <option value="Cheque">Cheque</option>
                        <option value="Demand Draft">Demand Draft (DD)</option>
                        <option value="UPI">UPI</option>
                      </select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-bold text-slate-700">UTR / Ref No</label>
                        <button
                          type="button"
                          onClick={() => {
                            const mockRef = 'UTR' + Math.floor(1000000000 + Math.random() * 9000000000);
                            setActionModal((prev) => ({
                              ...prev,
                              advancePaymentDetails: {
                                ...prev.advancePaymentDetails,
                                referenceNumber: mockRef
                              }
                            }));
                          }}
                          className="text-[10px] text-blue-600 hover:text-blue-800 font-bold cursor-pointer"
                        >
                          + Auto UTR
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="e.g. UTRN9823482749"
                        value={actionModal.advancePaymentDetails?.referenceNumber || ''}
                        onChange={(e) => {
                          const ref = e.target.value;
                          setActionModal((prev) => ({
                            ...prev,
                            advancePaymentDetails: {
                              ...prev.advancePaymentDetails,
                              referenceNumber: ref
                            }
                          }));
                        }}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block font-bold text-slate-700 mb-1">
                        Bank Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. HDFC Bank, SBI, ICICI"
                        value={actionModal.advancePaymentDetails?.bankName || ''}
                        onChange={(e) => {
                          const bank = e.target.value;
                          setActionModal((prev) => ({
                            ...prev,
                            advancePaymentDetails: {
                              ...prev.advancePaymentDetails,
                              bankName: bank
                            }
                          }));
                        }}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Drawing & Order Acknowledgement Form when at Stage 4 */}
              {selectedDeptSeq === 4 && (actionModal.type === 'ACCEPT' || actionModal.type === 'REACCEPT') && (
                <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 space-y-3.5">
                  <div className="flex items-center justify-between border-b border-blue-200/80 pb-2">
                    <div className="flex items-center space-x-2 text-xs font-black text-[#1E5BB8]">
                      <FileText className="w-4 h-4 text-[#EE6F2D]" />
                      <span>Stage 4: Drawing / Proforma Invoice / Order Acknowledgement</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                      Step 4 &amp; 5 Technical Clearance
                    </span>
                  </div>

                  {/* Summary of Commercial & Scope info */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-white p-2.5 rounded-lg border border-blue-100 shadow-2xs">
                    <div>
                      <span className="text-slate-400 font-medium block text-[10px]">Client / Buyer:</span>
                      <span className="font-bold text-slate-900 truncate block">
                        {actionModal.workflow?.enquiryId?.clientId?.companyName || 'Valued Client'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium block text-[10px]">Project Scope:</span>
                      <span className="font-bold text-slate-900 truncate block">
                        {actionModal.workflow?.enquiryId?.project?.projectName || 'Switchgear Engineering'}
                      </span>
                    </div>
                  </div>

                  {/* Drawing Inputs Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* 1. GA Drawing No */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-bold text-slate-700">GA Drawing No &amp; Rev <span className="text-rose-600">*</span></label>
                        <button
                          type="button"
                          onClick={() => {
                            const pid = actionModal.workflow?.projectTrackingId || 'PRJ-2026-0001';
                            setActionModal((prev) => ({
                              ...prev,
                              drawingOADetails: { ...prev.drawingOADetails, gaDrawingNumber: `GA-${pid}-R0` }
                            }));
                          }}
                          className="text-[10px] text-blue-600 hover:text-blue-800 font-bold cursor-pointer"
                        >
                          + Auto GA
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="e.g. GA-DWG-2026-0042 Rev 0"
                        value={actionModal.drawingOADetails?.gaDrawingNumber || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setActionModal((prev) => ({
                            ...prev,
                            drawingOADetails: { ...prev.drawingOADetails, gaDrawingNumber: val }
                          }));
                        }}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    {/* 2. SLD Drawing No */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-bold text-slate-700">SLD / Schematic No</label>
                        <button
                          type="button"
                          onClick={() => {
                            const pid = actionModal.workflow?.projectTrackingId || 'PRJ-2026-0001';
                            setActionModal((prev) => ({
                              ...prev,
                              drawingOADetails: { ...prev.drawingOADetails, sldDrawingNumber: `SLD-${pid}` }
                            }));
                          }}
                          className="text-[10px] text-blue-600 hover:text-blue-800 font-bold cursor-pointer"
                        >
                          + Auto SLD
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="e.g. SLD-2026-0018"
                        value={actionModal.drawingOADetails?.sldDrawingNumber || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setActionModal((prev) => ({
                            ...prev,
                            drawingOADetails: { ...prev.drawingOADetails, sldDrawingNumber: val }
                          }));
                        }}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    {/* 3. Proforma Invoice (PI) Number */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-bold text-slate-700">Proforma Invoice No</label>
                        <button
                          type="button"
                          onClick={() => {
                            const ern = actionModal.workflow?.enquiryId?.ern || 'ERN-2026-0001';
                            setActionModal((prev) => ({
                              ...prev,
                              drawingOADetails: { ...prev.drawingOADetails, proformaInvoiceNumber: `PI-${ern.replace(/^ERN-/, '')}` }
                            }));
                          }}
                          className="text-[10px] text-blue-600 hover:text-blue-800 font-bold cursor-pointer"
                        >
                          + Auto PI
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="e.g. PI-2026-0104"
                        value={actionModal.drawingOADetails?.proformaInvoiceNumber || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setActionModal((prev) => ({
                            ...prev,
                            drawingOADetails: { ...prev.drawingOADetails, proformaInvoiceNumber: val }
                          }));
                        }}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    {/* 4. Proforma Invoice Date */}
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Proforma Invoice Date</label>
                      <input
                        type="date"
                        value={actionModal.drawingOADetails?.proformaInvoiceDate || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setActionModal((prev) => ({
                            ...prev,
                            drawingOADetails: { ...prev.drawingOADetails, proformaInvoiceDate: val }
                          }));
                        }}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    {/* 5. Order Acknowledgement (OA) Number */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-bold text-slate-700">Order Acknowledgement (OA) No <span className="text-rose-600">*</span></label>
                        <button
                          type="button"
                          onClick={() => {
                            const pid = actionModal.workflow?.projectTrackingId || 'PRJ-2026-0001';
                            setActionModal((prev) => ({
                              ...prev,
                              drawingOADetails: { ...prev.drawingOADetails, orderAcknowledgementNumber: `OA-${pid.replace(/^PRJ-/, '')}` }
                            }));
                          }}
                          className="text-[10px] text-blue-600 hover:text-blue-800 font-bold cursor-pointer"
                        >
                          + Auto OA
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="e.g. OA-2026-0089"
                        value={actionModal.drawingOADetails?.orderAcknowledgementNumber || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setActionModal((prev) => ({
                            ...prev,
                            drawingOADetails: { ...prev.drawingOADetails, orderAcknowledgementNumber: val }
                          }));
                        }}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    {/* 6. Order Acknowledgement Date */}
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Order Acknowledgement Date</label>
                      <input
                        type="date"
                        value={actionModal.drawingOADetails?.orderAcknowledgementDate || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setActionModal((prev) => ({
                            ...prev,
                            drawingOADetails: { ...prev.drawingOADetails, orderAcknowledgementDate: val }
                          }));
                        }}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    {/* 7. Customer End Drawing Approval Status (Step 5 in sheet) */}
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Customer End Approval Status <span className="text-rose-600">*</span>
                      </label>
                      <select
                        value={actionModal.drawingOADetails?.customerApprovalStatus || 'Approved with Code 1 (Clean)'}
                        onChange={(e) => {
                          const val = e.target.value;
                          setActionModal((prev) => ({
                            ...prev,
                            drawingOADetails: { ...prev.drawingOADetails, customerApprovalStatus: val }
                          }));
                        }}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-bold text-emerald-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="Approved with Code 1 (Clean)">Approved with Code 1 (Clean Approval - Proceed)</option>
                        <option value="Approved with Code 2 (Proceed with Comments)">Approved with Code 2 (Proceed with Minor Comments)</option>
                        <option value="Pending Customer Approval">Pending Customer End Approval</option>
                        <option value="Revision Required">Drawing Revision Requested by Customer</option>
                      </select>
                    </div>

                    {/* 8. Customer Confirmed CT Ratio (Step 5 in sheet) */}
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Customer Confirmed CT Ratio (Step 5)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 200/5A, 15VA, Class 0.5s"
                        value={actionModal.drawingOADetails?.ctRatioConfirmed || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setActionModal((prev) => ({
                            ...prev,
                            drawingOADetails: { ...prev.drawingOADetails, ctRatioConfirmed: val }
                          }));
                        }}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    {/* 9. Committed Dispatch Date */}
                    <div className="col-span-2">
                      <label className="block font-bold text-slate-700 mb-1">Committed Target Dispatch Date</label>
                      <input
                        type="date"
                        value={actionModal.drawingOADetails?.targetDispatchDate || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setActionModal((prev) => ({
                            ...prev,
                            drawingOADetails: { ...prev.drawingOADetails, targetDispatchDate: val }
                          }));
                        }}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Rejection Details (Mandatory for REJECT) */}
              {actionModal.type === 'REJECT' && (
                <div className="space-y-3.5 p-3.5 bg-rose-50/70 rounded-xl border border-rose-200">
                  {/* 1. Department Requiring Correction - ALL 10 DEPARTMENTS */}
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">
                      Department Requiring Correction (All 10 Departments) <span className="text-rose-600">*</span>
                    </label>
                    <select
                      value={actionModal.responsibleDepartmentSequence}
                      onChange={(e) => {
                        const seq = Number(e.target.value);
                        const targetDept = DEPARTMENTS.find((d) => d.sequence === seq);
                        setActionModal((prev) => ({
                          ...prev,
                          responsibleDepartmentSequence: seq,
                          rejectionReason: `Stage ${seq}: ${targetDept?.name} - Specification Discrepancy`
                        }));
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-bold text-slate-800 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    >
                      {DEPARTMENTS.map((dept) => (
                        <option key={dept.sequence} value={dept.sequence}>
                          Stage {dept.sequence}: {dept.name} {dept.canViewClient ? '(Client Details Authorized)' : '(Technical Stage)'}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-slate-500 mt-1 font-medium">
                      Select which of the 10 departments must correct the issue. Resubmission will resume at this department.
                    </p>
                  </div>

                  {/* 2. Rejection Reason (All 10 Departments Covered) */}
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">
                      Rejection Reason <span className="text-rose-600">*</span>
                    </label>
                    <select
                      value={actionModal.rejectionReason}
                      onChange={(e) =>
                        setActionModal((prev) => ({ ...prev, rejectionReason: e.target.value }))
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-medium text-slate-800 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    >
                      <option value="">-- Select Rejection Reason (All 10 Departments) --</option>

                      <optgroup label="Stage 1: Sales & Marketing">
                        <option value="Stage 1: Sales & Marketing - Client Contact / Billing Address Discrepancy">
                          Stage 1: Sales & Marketing - Client Contact / Billing Address Discrepancy
                        </option>
                        <option value="Stage 1: Sales & Marketing - Commercial Terms / Pricing & Tax Discrepancy">
                          Stage 1: Sales & Marketing - Commercial Terms / Pricing & Tax Discrepancy
                        </option>
                        <option value="Stage 1: Sales & Marketing - Delivery Timeline / Site Handover Clarification">
                          Stage 1: Sales & Marketing - Delivery Timeline / Site Handover Clarification
                        </option>
                      </optgroup>

                      <optgroup label="Stage 2: Purchase Order (PO) Team">
                        <option value="Stage 2: PO Team - Purchase Order Scope & Bill of Materials Mismatch">
                          Stage 2: PO Team - Purchase Order Scope & Bill of Materials Mismatch
                        </option>
                        <option value="Stage 2: PO Team - Client PO Terms Differ from Sky Power Quotation">
                          Stage 2: PO Team - Client PO Terms Differ from Sky Power Quotation
                        </option>
                      </optgroup>

                      <optgroup label="Stage 3: Accountant">
                        <option value="Stage 3: Accountant - Advance Payment / Bank Guarantee Clearance Pending">
                          Stage 3: Accountant - Advance Payment / Bank Guarantee Clearance Pending
                        </option>
                        <option value="Stage 3: Accountant - Credit Approval / Billing GSTIN Discrepancy">
                          Stage 3: Accountant - Credit Approval / Billing GSTIN Discrepancy
                        </option>
                      </optgroup>

                      <optgroup label="Stage 4: Drawing / Order Acknowledgement">
                        <option value="Stage 4: Drawing / OA - General Arrangement (GA) Drawing Revision Required">
                          Stage 4: Drawing / OA - General Arrangement (GA) Drawing Revision Required
                        </option>
                        <option value="Stage 4: Drawing / OA - Single Line Diagram (SLD) & Schematic Discrepancy">
                          Stage 4: Drawing / OA - Single Line Diagram (SLD) & Schematic Discrepancy
                        </option>
                      </optgroup>

                      <optgroup label="Stage 5: CT & PT">
                        <option value="Stage 5: CT & PT - CT/PT Ratio, Burden or Accuracy Class Change Required">
                          Stage 5: CT & PT - CT/PT Ratio, Burden or Accuracy Class Change Required
                        </option>
                        <option value="Stage 5: CT & PT - Primary / Secondary Injection Testing Specs Revision">
                          Stage 5: CT & PT - Primary / Secondary Injection Testing Specs Revision
                        </option>
                      </optgroup>

                      <optgroup label="Stage 6: Fabrication">
                        <option value="Stage 6: Fabrication - Sheet Metal Enclosure Dimensions / CRCA Thickness Rework">
                          Stage 6: Fabrication - Sheet Metal Enclosure Dimensions / CRCA Thickness Rework
                        </option>
                        <option value="Stage 6: Fabrication - Busbar Sizing & Clearance Discrepancy">
                          Stage 6: Fabrication - Busbar Sizing & Clearance Discrepancy
                        </option>
                      </optgroup>

                      <optgroup label="Stage 7: Metering Door">
                        <option value="Stage 7: Metering Door - Metering Compartment Cutout & Instrument Layout Revision">
                          Stage 7: Metering Door - Metering Compartment Cutout & Instrument Layout Revision
                        </option>
                        <option value="Stage 7: Metering Door - Protection Relay & Indicating Lamp Relocation">
                          Stage 7: Metering Door - Protection Relay & Indicating Lamp Relocation
                        </option>
                      </optgroup>

                      <optgroup label="Stage 8: Testing">
                        <option value="Stage 8: Testing - Routine / High Voltage Dielectric Testing Failure">
                          Stage 8: Testing - Routine / High Voltage Dielectric Testing Failure
                        </option>
                        <option value="Stage 8: Testing - Circuit Breaker Timing & Contact Resistance Deviation">
                          Stage 8: Testing - Circuit Breaker Timing & Contact Resistance Deviation
                        </option>
                      </optgroup>

                      <optgroup label="Stage 9: Delivery">
                        <option value="Stage 9: Delivery - Shipping Logistics / Dispatch Site Address Correction">
                          Stage 9: Delivery - Shipping Logistics / Dispatch Site Address Correction
                        </option>
                        <option value="Stage 9: Delivery - Transport Packaging & Special Transit Permits Required">
                          Stage 9: Delivery - Transport Packaging & Special Transit Permits Required
                        </option>
                      </optgroup>

                      <optgroup label="Stage 10: Installation">
                        <option value="Stage 10: Installation - Civil Foundation / Trench Layout Incompatibility">
                          Stage 10: Installation - Civil Foundation / Trench Layout Incompatibility
                        </option>
                        <option value="Stage 10: Installation - Site Erection & Commissioning Clearance Pending">
                          Stage 10: Installation - Site Erection & Commissioning Clearance Pending
                        </option>
                      </optgroup>

                      <optgroup label="Standard Technical Categories">
                        <option value="Technical Specification Discrepancy">Technical Specification Discrepancy</option>
                        <option value="Commercial Terms / Pricing Ambiguity">Commercial Terms / Pricing Ambiguity</option>
                        <option value="Customer Revision / Scope Change Request">Customer Revision / Scope Change Request</option>
                        <option value="Other Technical Rework Required">Other Technical Rework Required</option>
                      </optgroup>
                    </select>
                  </div>
                </div>
              )}

              {/* Previous Rejection Details for REACCEPT */}
              {actionModal.type === 'REACCEPT' && (
                <div className="space-y-2 p-3 bg-amber-50/90 rounded-xl border border-amber-200 text-xs">
                  <div className="flex items-center space-x-2 text-amber-900 font-bold">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Previous Rejection Details at {activeDept.name}:</span>
                  </div>
                  <p className="text-amber-950 font-medium">
                    <strong>Reason:</strong> {actionModal.workflow?.rejectionReason || 'Technical Specification Discrepancy'}
                  </p>
                  <p className="text-amber-950 font-medium">
                    <strong>Remarks:</strong> {actionModal.workflow?.rejectionRemarks || 'Rework required'}
                  </p>
                </div>
              )}

              {/* Detailed Remarks */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {actionModal.type === 'REACCEPT' ? 'Re-assignment & Resolution Remarks' : 'Detailed Remarks'}{' '}
                  {(actionModal.type === 'REJECT' || actionModal.type === 'REACCEPT') && (
                    <span className={actionModal.type === 'REACCEPT' ? 'text-emerald-600' : 'text-rose-600'}>* (Mandatory)</span>
                  )}
                </label>
                <textarea
                  rows={3}
                  placeholder={
                    actionModal.type === 'REJECT'
                      ? 'Explain precisely what changes or corrections Sales & Marketing needs to make...'
                      : actionModal.type === 'REACCEPT'
                      ? 'Explain re-assignment and resolution details (e.g. CT/PT specifications verified and updated as per client revision, re-accepting and moving to next stage)...'
                      : 'Enter review notes or approval remarks (optional)...'
                  }
                  value={actionModal.remarks}
                  onChange={(e) =>
                    setActionModal((prev) => ({ ...prev, remarks: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {actionModal.validationError && (
                <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-800 font-bold text-[11px]">
                  {actionModal.validationError}
                </div>
              )}

              {actionModal.type === 'REJECT' && (
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  <strong>Notice:</strong> Rejecting will immediately return this project to Sales & Marketing under &ldquo;Returned Projects / Rework Required&rdquo;. When Sales resubmits, the workflow will resume directly at {activeDept.name} without losing prior department approvals.
                </p>
              )}

              {actionModal.type === 'REACCEPT' && (
                <p className="text-[11px] text-emerald-800 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200 leading-relaxed font-medium">
                  <strong>Re-acceptance Clearance:</strong> This action will mark {activeDept.name} as <strong>Accepted</strong>, resolve the rejection, and immediately advance the project to the next department ({selectedDeptSeq < 10 ? DEPARTMENTS.find((d) => d.sequence === selectedDeptSeq + 1)?.name : 'Installation Finalization'}).
                </p>
              )}
            </div>

            {/* Modal Sticky Footer - Always Visible */}
            <div className="p-4 px-6 border-t border-slate-100 bg-slate-50/90 flex items-center justify-between shrink-0 rounded-b-2xl">
              <div className="text-[11px] text-slate-500">
                {selectedDeptSeq === 3 && (actionModal.type === 'ACCEPT' || actionModal.type === 'REACCEPT') && (
                  <span>Forwards to: <strong className="text-slate-800 font-medium">Stage 4 (Drawing / Order Acknowledgement)</strong></span>
                )}
                {selectedDeptSeq === 4 && (actionModal.type === 'ACCEPT' || actionModal.type === 'REACCEPT') && (
                  <span>Forwards to: <strong className="text-slate-800 font-medium">Stage 5 (CT &amp; PT Technical Status)</strong></span>
                )}
              </div>
              <div className="flex items-center space-x-2.5">
                <button
                  type="button"
                  onClick={closeActionModal}
                  disabled={actionModal.submitting}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={executeAction}
                  disabled={actionModal.submitting}
                  className={`px-5 py-2.5 rounded-lg text-xs font-bold text-white transition-all shadow-md cursor-pointer flex items-center space-x-1.5 ${
                    actionModal.type === 'REJECT'
                      ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
                      : actionModal.type === 'REACCEPT'
                      ? 'bg-gradient-to-r from-amber-600 to-emerald-600 hover:from-amber-700 hover:to-emerald-700 shadow-amber-200'
                      : selectedDeptSeq === 3
                      ? 'bg-gradient-to-r from-emerald-600 to-[#1E5BB8] hover:from-emerald-700 hover:to-[#174894] shadow-emerald-200'
                      : selectedDeptSeq === 4
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 shadow-blue-200'
                      : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
                  }`}
                >
                  {actionModal.submitting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {actionModal.type === 'REJECT'
                          ? 'Confirm Rejection'
                          : actionModal.type === 'REACCEPT'
                          ? 'Re-Accept & Move Forward'
                          : selectedDeptSeq === 2
                          ? 'Approve PO & Advance to Stage 3 →'
                          : selectedDeptSeq === 3
                          ? `Confirm Payment (₹ ${Number(actionModal.advancePaymentDetails?.amount || 0).toLocaleString('en-IN')}) & Forward to Stage 4 →`
                          : selectedDeptSeq === 4
                          ? 'Confirm Drawing & OA & Forward to Stage 5 (CT & PT) →'
                          : 'Confirm Action'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

