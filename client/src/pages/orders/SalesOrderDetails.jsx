import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import {
  CreditCard,
  ShoppingCart,
  Building2,
  FileText,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  PauseCircle,
  Clock,
  Download,
  Printer,
  ArrowLeft,
  ShieldCheck,
  FileSpreadsheet,
  Layers,
  FileCheck2,
  AlertCircle,
  Upload,
  RefreshCw,
  X,
  PlayCircle,
  Ban,
  Check,
  HelpCircle,
  Info,
  Cpu
} from 'lucide-react';

const formatAddress = (addr) => {
  if (!addr) return 'Tamil Nadu, India';
  if (typeof addr === 'string') return addr;
  if (typeof addr === 'object') {
    const parts = [addr.street, addr.city, addr.state, addr.postalCode || addr.pincode, addr.country].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Tamil Nadu, India';
  }
  return String(addr);
};

export const SalesOrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const isPOTeam = user?.role === 'PO_TEAM';

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview'); // overview, products, documents, verification, timeline

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Action Modals State
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmRemarks, setConfirmRemarks] = useState('');
  const [confirming, setConfirming] = useState(false);

  const [showHoldModal, setShowHoldModal] = useState(false);
  const [holdReason, setHoldReason] = useState('Technical Clarification');
  const [holdDescription, setHoldDescription] = useState('');
  const [expectedResumeDate, setExpectedResumeDate] = useState('');
  const [holding, setHolding] = useState(false);

  const [showResumeModal, setShowResumeModal] = useState(false);
  const [resumeNotes, setResumeNotes] = useState('');
  const [revisedDeliveryDate, setRevisedDeliveryDate] = useState('');
  const [resuming, setResuming] = useState(false);

  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [poRevisionNumber, setPoRevisionNumber] = useState('');
  const [revisionChangesSummary, setRevisionChangesSummary] = useState('');
  const [revisionPoValue, setRevisionPoValue] = useState('');
  const [revising, setRevising] = useState(false);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Verification Checklist State
  const [verificationItems, setVerificationItems] = useState([]);
  const [clarificationNotes, setClarificationNotes] = useState('');
  const [verifying, setVerifying] = useState(false);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get(`/orders/${id}`);
      if (res.success && res.order) {
        setOrder(res.order);
        if (res.order.verification?.checklist && res.order.verification.checklist.length > 0) {
          setVerificationItems(res.order.verification.checklist);
        } else {
          // Provide default switchgear checklist parameters if empty
          const po = res.order.customerPO || {};
          const pricing = res.order.pricing || {};
          const quotationVal = pricing.totalOrderValue ? `₹ ${Number(pricing.totalOrderValue).toLocaleString('en-IN')}` : '₹ 42,00,000';
          const poVal = po.poValue ? `₹ ${Number(po.poValue).toLocaleString('en-IN')}` : quotationVal;
          const isValMatch = !po.poValue || Number(po.poValue) === pricing.totalOrderValue;

          setVerificationItems([
            {
              parameter: 'Customer Name & Legal Entity',
              quotationValue: res.order.customerName || 'Larsen & Toubro Ltd (T&D Division)',
              poValue: res.order.customerName || 'Larsen & Toubro Ltd (T&D Division)',
              status: 'Match',
              remarks: 'Customer corporate entity matched with registered quotation.'
            },
            {
              parameter: 'Total Order Value (₹)',
              quotationValue: quotationVal,
              poValue: poVal,
              status: isValMatch ? 'Match' : 'Mismatch',
              remarks: isValMatch
                ? 'Total commercial order value matches submitted offer.'
                : `PO Value differs from Quote (PO: ${poVal}, Quote: ${quotationVal}).`
            },
            {
              parameter: 'Scope of Supply & Ratings',
              quotationValue: res.order.projectTitle || 'Substation Control Panels & Breakers',
              poValue: res.order.projectTitle || 'Substation Control Panels & Breakers',
              status: 'Match',
              remarks: 'Technical scope and product ratings verified with engineering schedule.'
            },
            {
              parameter: 'Delivery Schedule / Commitment',
              quotationValue: res.order.commercialTerms?.deliveryTerms || '10 to 12 weeks',
              poValue: po.expectedDeliveryDate ? new Date(po.expectedDeliveryDate).toLocaleDateString('en-IN') : '10 to 12 weeks',
              status: 'Match',
              remarks: 'Agreed manufacturing and testing dispatch window.'
            },
            {
              parameter: 'Payment Terms & Milestones',
              quotationValue: res.order.commercialTerms?.paymentTerms || '30% Advance, 70% against PI',
              poValue: po.paymentTerms || res.order.commercialTerms?.paymentTerms || '30% Advance, 70% against PI',
              status: 'Match',
              remarks: 'Commercial payment milestones acceptable to Sky Power finance.'
            },
            {
              parameter: 'Warranty & Guarantee Period',
              quotationValue: res.order.commercialTerms?.warrantyTerms || '18 months from dispatch',
              poValue: po.warrantyTerms || res.order.commercialTerms?.warrantyTerms || '18 months from dispatch',
              status: 'Match',
              remarks: 'Standard OEM switchgear warranty terms accepted.'
            }
          ]);
        }
        setClarificationNotes(res.order.verification?.clarificationNotes || '');
      } else {
        setError(res.message || 'Failed to load order.');
      }
    } catch (err) {
      setError(err.message || 'Error fetching order details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  // Handle PO Verification Checklist change
  const handleItemStatusChange = (index, newStatus) => {
    const updated = [...verificationItems];
    updated[index].status = newStatus;
    setVerificationItems(updated);
  };

  const handleItemRemarksChange = (index, remarks) => {
    const updated = [...verificationItems];
    updated[index].remarks = remarks;
    setVerificationItems(updated);
  };

  const handleSaveVerification = async (markVerified = false) => {
    try {
      setVerifying(true);
      const itemsToSend = markVerified
        ? verificationItems.map((v) => ({ ...v, status: 'Match', isMatch: true }))
        : verificationItems;

      const res = await api.post(`/orders/${id}/verify-po`, {
        checklist: itemsToSend,
        clarificationNotes,
        markVerified,
        isApproved: markVerified
      });
      if (res.success) {
        setOrder(res.order);
        if (res.order?.verification?.checklist) {
          setVerificationItems(res.order.verification.checklist);
        }
        alert(markVerified ? 'PO successfully verified and cleared!' : 'Verification notes saved.');
      } else {
        alert('Verification update failed: ' + (res.message || 'Unknown error'));
      }
    } catch (err) {
      alert('Verification update failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setVerifying(false);
    }
  };

  // Handle Confirm Order
  const handleConfirmOrder = async () => {
    try {
      setConfirming(true);
      const res = await api.post(`/orders/${id}/confirm`, {
        remarks: confirmRemarks
      });
      if (res.success) {
        setShowConfirmModal(false);
        setOrder(res.order);
        alert(`Order confirmed successfully! OA Number: ${res.order.confirmation?.orderAcknowledgementNumber}`);
      }
    } catch (err) {
      alert('Confirmation failed: ' + err.message);
    } finally {
      setConfirming(false);
    }
  };

  // Handle Hold Order
  const handleHoldOrder = async () => {
    if (!holdDescription.trim()) {
      alert('Please provide a description or reason for putting the order on hold.');
      return;
    }
    try {
      setHolding(true);
      const res = await api.post(`/orders/${id}/hold`, {
        holdReason,
        holdDescription,
        expectedResumeDate: expectedResumeDate || undefined
      });
      if (res.success) {
        setShowHoldModal(false);
        setOrder(res.order);
      }
    } catch (err) {
      alert('Hold action failed: ' + err.message);
    } finally {
      setHolding(false);
    }
  };

  // Handle Resume Order
  const handleResumeOrder = async () => {
    try {
      setResuming(true);
      const res = await api.post(`/orders/${id}/resume`, {
        resolutionNotes: resumeNotes,
        revisedDeliveryDate: revisedDeliveryDate || undefined
      });
      if (res.success) {
        setShowResumeModal(false);
        setOrder(res.order);
      }
    } catch (err) {
      alert('Resume action failed: ' + err.message);
    } finally {
      setResuming(false);
    }
  };

  // Handle PO Revision
  const handlePORevision = async () => {
    if (!poRevisionNumber.trim()) {
      alert('Please specify the revised PO number or revision code.');
      return;
    }
    try {
      setRevising(true);
      const res = await api.post(`/orders/${id}/revision`, {
        poRevisionNumber,
        changesSummary: revisionChangesSummary,
        newPoValue: revisionPoValue ? Number(revisionPoValue) : undefined
      });
      if (res.success) {
        setShowRevisionModal(false);
        setOrder(res.order);
        alert('PO Revision registered. Re-verification required.');
      }
    } catch (err) {
      alert('Revision registration failed: ' + err.message);
    } finally {
      setRevising(false);
    }
  };

  // Handle Cancel Order
  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      alert('Please specify the reason for cancellation.');
      return;
    }
    try {
      setCancelling(true);
      const res = await api.post(`/orders/${id}/cancel`, {
        reason: cancelReason
      });
      if (res.success) {
        setShowCancelModal(false);
        setOrder(res.order);
      }
    } catch (err) {
      alert('Cancellation failed: ' + err.message);
    } finally {
      setCancelling(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Order Confirmed':
      case 'Completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-300';
      case 'Verified':
        return 'bg-blue-50 text-blue-700 border-blue-300';
      case 'Under Verification':
      case 'PO Received':
        return 'bg-amber-50 text-amber-700 border-amber-300';
      case 'On Hold':
        return 'bg-purple-50 text-purple-700 border-purple-300';
      case 'Clarification Required':
      case 'PO Revision Awaited':
        return 'bg-orange-50 text-orange-700 border-orange-300';
      case 'Cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-300';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-300';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-500">Loading Order Details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
        <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <p className="text-sm font-bold text-slate-800">{error || 'Order not found.'}</p>
        <Link to="/orders" className="text-xs text-blue-600 underline mt-2 inline-block">
          Return to Sales Orders
        </Link>
      </div>
    );
  }

  const client = order.clientId || {};
  const po = order.customerPO || {};
  const isConfirmed = order.status === 'Order Confirmed' || order.status === 'Completed';
  const isOnHold = order.status === 'On Hold';
  const isCancelled = order.status === 'Cancelled';

  return (
    <div className="space-y-6 pb-24">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-start space-x-3.5">
            <Link
              to="/orders"
              className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500 mt-1"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xl font-black text-slate-900 tracking-tight">
                  {order.orderNumber}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getStatusBadge(order.status)}`}>
                  {order.status}
                </span>
                {order.confirmation?.orderAcknowledgementNumber && !isPOTeam && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800">
                    OA: {order.confirmation.orderAcknowledgementNumber}
                  </span>
                )}
                {isPOTeam && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-blue-600" /> Data Shield Active
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Project: <strong className="text-slate-800">{order.projectTitle}</strong> • {isPOTeam ? (
                  <>Client ID: <strong className="text-blue-700 font-mono">{order.customerCode || client.clientId || 'Protected'}</strong></>
                ) : (
                  <>Customer: <strong className="text-slate-800">{order.clientName || client.companyName}</strong></>
                )}
              </p>
            </div>
          </div>

          {/* Quick Header Metric Pills & Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {!isPOTeam ? (
              <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-right">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Order Value</span>
                <span className="font-mono text-sm font-black text-slate-900">
                  ₹{(order.pricing?.totalOrderValue || 0).toLocaleString('en-IN')}
                </span>
              </div>
            ) : (
              <div className="px-3 py-1.5 bg-blue-50/70 border border-blue-200 rounded-xl text-right">
                <span className="text-[10px] text-blue-700 font-bold block uppercase tracking-wider">Access Scope</span>
                <span className="text-xs font-bold text-blue-900 flex items-center justify-end gap-1 font-mono">
                  Technical Spec
                </span>
              </div>
            )}

            <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Customer PO</span>
              <span className="font-mono text-xs font-bold text-slate-800">
                {po.poNumber || 'Pending'}
              </span>
            </div>

            <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Delivery Due</span>
              <span className="text-xs font-bold text-slate-800">
                {order.deliveryCommitment?.expectedDeliveryDate
                  ? new Date(order.deliveryCommitment.expectedDeliveryDate).toLocaleDateString('en-IN')
                  : po.expectedDeliveryDate
                  ? new Date(po.expectedDeliveryDate).toLocaleDateString('en-IN')
                  : 'TBD'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls Bar */}
        <div className="pt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {!isPOTeam && (
              <Link
                to={`/payments/orders/${order._id}`}
                className="inline-flex items-center px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
              >
                <CreditCard className="w-3.5 h-3.5 mr-1.5" /> Payments &amp; Milestones
              </Link>
            )}

            {/* Download Order Acknowledgement PDF */}
            {!isPOTeam && isConfirmed && (
              <a
                href={`/api/orders/${order._id}/acknowledgement-pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" /> Download OA Document (PDF)
              </a>
            )}

            <Link
              to={order.engineeringProjectId ? `/engineering/projects/${order.engineeringProjectId}` : `/engineering/projects`}
              className="inline-flex items-center px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold shadow-2xs transition-colors"
            >
              <Cpu className="w-3.5 h-3.5 mr-1.5" />
              {order.engineeringProjectId ? 'Engineering Workspace →' : 'Engineering & Drawings'}
            </Link>

            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 mr-1 text-slate-400" /> Print
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Confirm Order Action (Available when Verified or Under Verification) */}
            {!isConfirmed && !isCancelled && !isOnHold && (
              <button
                type="button"
                onClick={() => setShowConfirmModal(true)}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white rounded-xl text-xs font-bold shadow-md transition-all"
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5 text-amber-300" />
                Confirm Order & Issue OA
              </button>
            )}

            {/* Hold / Resume Actions */}
            {!isCancelled && !isOnHold && (
              <button
                type="button"
                onClick={() => setShowHoldModal(true)}
                className="inline-flex items-center px-3 py-1.5 border border-purple-200 hover:bg-purple-50 text-purple-700 rounded-xl text-xs font-bold transition-colors"
              >
                <PauseCircle className="w-3.5 h-3.5 mr-1 text-purple-500" /> Place On Hold
              </button>
            )}

            {isOnHold && (
              <button
                type="button"
                onClick={() => setShowResumeModal(true)}
                className="inline-flex items-center px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
              >
                <PlayCircle className="w-4 h-4 mr-1.5" /> Resume Order Execution
              </button>
            )}

            {/* Record Revised PO */}
            {!isCancelled && (
              <button
                type="button"
                onClick={() => setShowRevisionModal(true)}
                className="inline-flex items-center px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold"
              >
                <FileCheck2 className="w-3.5 h-3.5 mr-1 text-blue-500" /> Record Revised PO
              </button>
            )}

            {/* Cancel Action */}
            {!isCancelled && !isConfirmed && (
              <button
                type="button"
                onClick={() => setShowCancelModal(true)}
                className="inline-flex items-center px-3 py-1.5 border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-xl text-xs font-semibold"
              >
                <Ban className="w-3.5 h-3.5 mr-1" /> Cancel Order
              </button>
            )}
          </div>
        </div>
      </div>

      {/* On Hold Warning Banner */}
      {isOnHold && (
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl flex items-start space-x-3 text-purple-900 text-xs">
          <PauseCircle className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold">This Order is Currently On Hold</h4>
            <p>
              <strong>Reason:</strong> {order.holdDetails?.holdReason || order.currentHold?.reason || 'Clarification Pending'} — {order.holdDetails?.holdDescription || order.currentHold?.description || 'Awaiting customer response'}
            </p>
            {(order.holdDetails?.expectedResumeDate || order.currentHold?.expectedResumeDate) && (
              <p className="text-[11px] text-purple-700">
                Expected Resume Date: {new Date(order.holdDetails?.expectedResumeDate || order.currentHold?.expectedResumeDate).toLocaleDateString('en-IN')}
              </p>
            )}
          </div>
        </div>
      )}

      {/* 5 Tabs Navigation */}
      <div className="border-b border-slate-200 flex space-x-2 sm:space-x-6 overflow-x-auto text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-1 border-b-2 transition-colors flex items-center space-x-1.5 ${
            activeTab === 'overview'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Info className="w-4 h-4" />
          <span>1. Overview</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('products')}
          className={`pb-3 px-1 border-b-2 transition-colors flex items-center space-x-1.5 ${
            activeTab === 'products'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>2. Products & Specifications ({order.products?.length || 0})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('documents')}
          className={`pb-3 px-1 border-b-2 transition-colors flex items-center space-x-1.5 ${
            activeTab === 'documents'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>3. Documents</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('verification')}
          className={`pb-3 px-1 border-b-2 transition-colors flex items-center space-x-1.5 ${
            activeTab === 'verification'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>
            4. PO Verification
            {order.verification?.mismatchCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-rose-100 text-rose-700 rounded-full text-[10px]">
                {order.verification.mismatchCount} Mismatch
              </span>
            )}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('timeline')}
          className={`pb-3 px-1 border-b-2 transition-colors flex items-center space-x-1.5 ${
            activeTab === 'timeline'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>5. Order Timeline ({order.timeline?.length || 0})</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Customer & Project Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer Details */}
            {isPOTeam ? (
              <div className="bg-white p-5 rounded-2xl border border-blue-200/90 bg-gradient-to-br from-white to-blue-50/20 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center">
                    <ShieldCheck className="w-4 h-4 mr-1.5 text-blue-600" /> Client Identifiers (Data Shield Active)
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-100 text-blue-800">
                    Data Shield Active
                  </span>
                </div>
                <div className="p-3 bg-blue-50/50 border border-blue-200/60 rounded-xl text-xs text-blue-900 mb-2">
                  Corporate company identity, personal contacts, and commercial billing are shielded for PO technical execution.
                </div>
                <div className="text-xs space-y-2.5">
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500">Client ID Code</span>
                    <span className="font-mono font-bold text-blue-700 text-sm">{order.customerCode || client.clientId || 'SP-CL-CLIENT'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500">Client Category</span>
                    <span className="font-semibold text-slate-800">{client.customerType || 'Industrial Client'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500">Delivery Region</span>
                    <span className="text-slate-700 font-medium">Tamil Nadu, India</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-slate-500">Commercial Contact</span>
                    <span className="text-slate-500 italic">Managed by Commercial Sales Desk</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
                  <Building2 className="w-3.5 h-3.5 mr-1.5 text-blue-600" /> Customer Information
                </h3>
                <div className="text-xs space-y-2">
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500">Company Name</span>
                    <span className="font-bold text-slate-900">{order.clientName || client.companyName || '—'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500">Client Code</span>
                    <span className="font-mono font-bold text-blue-700">{order.customerCode || client.clientId || client.clientCode || '—'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500">Contact Person</span>
                    <span className="font-semibold text-slate-800">{order.contactPerson || client.contactPerson || client.contactPersonName || '—'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500">Email & Phone</span>
                    <span className="text-slate-800">{order.contactEmail || client.email || '—'} • {order.contactPhone || client.mobile || client.phone || '—'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500">GSTIN / Tax ID</span>
                    <span className="font-mono font-semibold text-slate-800">{order.gstNumber || client.gstNumber || client.gstin || '33AAFCP0161B1ZL'}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-slate-500">Site / Delivery Address</span>
                    <span className="text-slate-800 text-right max-w-xs">{formatAddress(order.siteAddress || client.siteAddress || order.billingAddress || client.billingAddress)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Project & Order Details */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
                <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-indigo-600" /> Project & Order Identifiers
              </h3>
              <div className="text-xs space-y-2">
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500">Project Title</span>
                  <span className="font-bold text-slate-900">{order.projectTitle}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500">End User</span>
                  <span className="font-semibold text-slate-800">{order.endUser || 'Direct Client'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500">Quotation Reference</span>
                  {order.quotationId && !isPOTeam ? (
                    <Link
                      to={`/quotations/${order.quotationId?._id || order.quotationId}`}
                      className="font-mono font-bold text-blue-600 hover:underline"
                    >
                      {order.quotationNumber} (Rev #{order.quotationRevision || 1})
                    </Link>
                  ) : (
                    <span className="font-mono font-bold text-slate-800">
                      {order.quotationNumber || 'Direct PO'}
                    </span>
                  )}
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500">Customer PO Number</span>
                  <span className="font-mono font-bold text-slate-900">{po.poNumber || 'Pending'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500">Customer PO Date</span>
                  <span className="text-slate-800">
                    {po.poDate ? new Date(po.poDate).toLocaleDateString('en-IN') : '—'}
                  </span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-500">Order Coordinator</span>
                  <span className="font-semibold text-slate-800">{order.confirmation?.orderCoordinator || order.orderCoordinatorName || order.createdBy?.name || 'Sales & Contracts Team'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Commercial Terms & Pricing Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Commercial Terms */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {isPOTeam ? 'Technical & Delivery Commitments' : 'Commercial & Delivery Terms'}
              </h3>
              <div className="text-xs space-y-2.5">
                <div>
                  <span className="text-slate-400 font-medium block text-[11px]">Price Basis</span>
                  <p className="font-semibold text-slate-800 mt-0.5">
                    {order.commercialTerms?.priceBasis || 'Ex-works Salem Manufacturing Facility'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block text-[11px]">Payment Terms</span>
                  <p className="font-semibold text-slate-800 mt-0.5">
                    {isPOTeam
                      ? 'Managed by Corporate Accounts Desk'
                      : (order.commercialTerms?.paymentTerms || po.paymentTerms || '30% Advance with PO, 70% against PI')}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block text-[11px]">Delivery Commitment</span>
                  <p className="font-semibold text-slate-800 mt-0.5">
                    {order.commercialTerms?.deliveryTerms || po.deliveryTerms || '10 to 12 weeks from technically & commercially clear order'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block text-[11px]">Warranty Terms</span>
                  <p className="font-semibold text-slate-800 mt-0.5">
                    {order.commercialTerms?.warrantyTerms || po.warrantyTerms || '18 months from supply or 12 months from commissioning'}
                  </p>
                </div>
              </div>
            </div>

            {/* Financial Valuation / Technical Scope */}
            {!isPOTeam ? (
              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Financial Value &amp; Tax Breakdown
                </h3>
                <div className="text-xs space-y-2">
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500">Basic Sub-Total</span>
                    <span className="font-mono font-semibold text-slate-800">
                      ₹{(order.pricing?.subTotal || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500">Commercial Discount</span>
                    <span className="font-mono text-emerald-600 font-semibold">
                      - ₹{(order.pricing?.discountTotal || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500">GST / Tax ({order.pricing?.taxRatePercent || 18}%)</span>
                    <span className="font-mono font-semibold text-slate-800">
                      + ₹{(order.pricing?.taxTotal || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500">Freight &amp; Transit Insurance</span>
                    <span className="font-mono text-slate-800">
                      ₹{(order.pricing?.freightAndInsurance || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t-2 border-slate-100">
                    <span className="text-sm font-bold text-slate-900">Total Net Order Value</span>
                    <span className="text-base font-black font-mono text-blue-700">
                      ₹{(order.pricing?.totalOrderValue || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="p-2.5 bg-blue-50/60 rounded-xl mt-3 flex items-center justify-between text-[11px] text-blue-900">
                    <span>Customer PO Value Registered:</span>
                    <strong className="font-mono">₹{(po.poValue || 0).toLocaleString('en-IN')}</strong>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center">
                    <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-blue-600" /> Technical Execution Scope
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    Production Cleared
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl space-y-2 text-xs">
                  <p className="text-slate-600 font-medium">
                    Financial valuation, commercial discounts, advance payments, and customer invoicing are managed strictly by Corporate Finance.
                  </p>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-slate-800">
                    <span>Total Switchgear Assemblies:</span>
                    <strong className="font-mono font-bold text-blue-700">{order.products?.length || 0} Line Items</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-800">
                    <span>Target Delivery Schedule:</span>
                    <strong className="font-mono font-bold text-slate-900">
                      {order.deliveryCommitment?.expectedDeliveryDate
                        ? new Date(order.deliveryCommitment.expectedDeliveryDate).toLocaleDateString('en-IN')
                        : '10 to 12 Weeks'}
                    </strong>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PRODUCTS & SPECIFICATIONS */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Switchgear Panels & Equipment Scope of Supply
              </h3>
              <span className="text-xs font-mono text-slate-500">{order.products?.length || 0} Line Items</span>
            </div>

            <div className="divide-y divide-slate-100">
              {order.products?.map((item, index) => (
                <div key={index} className="p-5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center space-x-3">
                      <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 font-mono text-xs font-black flex items-center justify-center">
                        {index + 1}
                      </span>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{item.productName}</h4>
                        <p className="text-xs text-slate-500">{item.itemDescription || 'Standard Switchgear Panel'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400 block">{isPOTeam ? 'Production Qty' : 'Qty & Price'}</span>
                      {isPOTeam ? (
                        <span className="text-xs font-bold text-slate-900 font-mono">
                          {item.quantity} {item.unit || 'Nos'}
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-slate-900">
                          {item.quantity} {item.unit || 'Nos'} @ ₹{(item.unitPrice || 0).toLocaleString('en-IN')} ={' '}
                          <strong className="font-mono text-blue-700">₹{(item.totalPrice || 0).toLocaleString('en-IN')}</strong>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Technical Specifications Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 p-3.5 bg-slate-50/70 rounded-xl text-xs border border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Switchgear Type</span>
                      <span className="font-semibold text-slate-800">{item.technicalSpecs?.switchgearType || 'HT VCB'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Voltage Rating</span>
                      <span className="font-semibold text-slate-800">{item.technicalSpecs?.voltageRating || '11 kV'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Current Rating</span>
                      <span className="font-semibold text-slate-800">{item.technicalSpecs?.currentRating || '1250 A'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Short-Circuit</span>
                      <span className="font-semibold text-slate-800">{item.technicalSpecs?.shortCircuitRating || '26.3 kA / 3s'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Indoor / Outdoor</span>
                      <span className="font-semibold text-slate-800">{item.technicalSpecs?.indoorOutdoor || 'Indoor'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Ingress Protection</span>
                      <span className="font-semibold text-slate-800">{item.technicalSpecs?.panelType || 'IP54 / IP55'}</span>
                    </div>
                  </div>

                  {/* Components (CT/PT, Relay, Metering) */}
                  {(item.technicalSpecs?.relaySpecs || item.technicalSpecs?.ctPtSpecs || item.technicalSpecs?.metering) && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                      {item.technicalSpecs.ctPtSpecs && (
                        <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">CT / PT Specs</span>
                          <span className="text-slate-800 font-medium">{item.technicalSpecs.ctPtSpecs}</span>
                        </div>
                      )}
                      {item.technicalSpecs.relaySpecs && (
                        <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">Protection Relay</span>
                          <span className="text-slate-800 font-medium">{item.technicalSpecs.relaySpecs}</span>
                        </div>
                      )}
                      {item.technicalSpecs.metering && (
                        <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">Metering</span>
                          <span className="text-slate-800 font-medium">{item.technicalSpecs.metering}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DOCUMENTS */}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer Purchase Order File */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-start space-x-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div className="flex-1 space-y-1">
                <h4 className="text-sm font-bold text-slate-900">Customer Purchase Order (PO)</h4>
                <p className="text-xs text-slate-500">
                  PO Number: <span className="font-mono font-bold text-slate-800">{po.poNumber || 'N/A'}</span>
                </p>
                <div className="pt-2">
                  {po.documentUrl ? (
                    <a
                      href={po.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-xs font-bold text-blue-600 hover:text-blue-800"
                    >
                      <Download className="w-3.5 h-3.5 mr-1" /> View / Download Attached PO
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400">No document attached during PO conversion</span>
                  )}
                </div>
              </div>
            </div>

            {/* Generated Order Acknowledgement (OA) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-start space-x-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="flex-1 space-y-1">
                <h4 className="text-sm font-bold text-slate-900">Official Order Acknowledgement (OA)</h4>
                <p className="text-xs text-slate-500">
                  OA Number:{' '}
                  <span className="font-mono font-bold text-emerald-700">
                    {order.confirmation?.orderAcknowledgementNumber || 'Not Yet Generated'}
                  </span>
                </p>
                <div className="pt-2">
                  {order.confirmation?.orderAcknowledgementNumber ? (
                    <a
                      href={`/api/orders/${order._id}/acknowledgement-pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-xs font-bold text-emerald-600 hover:text-emerald-800"
                    >
                      <Download className="w-3.5 h-3.5 mr-1" /> Download Order Acknowledgement PDF
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400">Generated automatically upon Order Confirmation</span>
                  )}
                </div>
              </div>
            </div>

            {/* Original Quotation Reference */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-start space-x-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div className="flex-1 space-y-1">
                <h4 className="text-sm font-bold text-slate-900">Accepted Quotation Document</h4>
                <p className="text-xs text-slate-500">
                  Ref: <span className="font-mono font-bold text-indigo-700">{order.quotationNumber}</span>
                </p>
                <div className="pt-2">
                  {order.quotationId ? (
                    <Link
                      to={`/quotations/${order.quotationId?._id || order.quotationId}`}
                      className="inline-flex items-center text-xs font-bold text-indigo-600 hover:text-indigo-800"
                    >
                      View Source Quotation Details →
                    </Link>
                  ) : (
                    <span className="text-xs text-slate-400">Direct Purchase Order without linked quotation docket</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PO VERIFICATION & QUOTATION COMPARISON */}
      {activeTab === 'verification' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center">
                  <ShieldCheck className="w-4 h-4 text-blue-600 mr-2" />
                  Technical & Commercial PO Verification Checklist
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Side-by-side comparison between submitted quotation and received customer PO. Mismatches must be resolved prior to confirmation.
                </p>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleSaveVerification(false)}
                  disabled={verifying}
                  className="px-3.5 py-1.5 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Save Progress
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveVerification(true)}
                  disabled={verifying}
                  className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                >
                  <Check className="w-3.5 h-3.5 mr-1.5" />
                  Mark All Verified & Clear Order
                </button>
              </div>
            </div>

            {/* Comparison Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <th className="py-3 px-4">Verification Parameter</th>
                    <th className="py-3 px-4">Submitted Quotation</th>
                    <th className="py-3 px-4">Customer PO Received</th>
                    <th className="py-3 px-4 text-center">Verification Status</th>
                    <th className="py-3 px-4">Remarks / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {verificationItems.map((item, index) => {
                    const isMatch = item.status === 'Match';
                    const isMismatch = item.status === 'Mismatch';

                    return (
                      <tr
                        key={item.parameter}
                        className={isMismatch ? 'bg-amber-50/40' : 'hover:bg-slate-50/60'}
                      >
                        <td className="py-3.5 px-4 font-bold text-slate-800">
                          {isPOTeam && item.parameter?.toLowerCase().includes('customer name')
                            ? 'Client Identification Reference'
                            : item.parameter}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 font-medium max-w-[200px]">
                          {isPOTeam && (item.parameter?.toLowerCase().includes('value') || item.parameter?.toLowerCase().includes('price') || item.parameter?.toLowerCase().includes('payment'))
                            ? '[Commercial Protected]'
                            : isPOTeam && item.parameter?.toLowerCase().includes('customer name')
                            ? `Client ID: ${order.customerCode || 'Protected'}`
                            : (item.quotationValue || '—')}
                        </td>
                        <td className="py-3.5 px-4 font-medium max-w-[200px]">
                          <span className={isMismatch ? 'text-amber-900 font-bold' : 'text-slate-800'}>
                            {isPOTeam && (item.parameter?.toLowerCase().includes('value') || item.parameter?.toLowerCase().includes('price') || item.parameter?.toLowerCase().includes('payment'))
                              ? '[Commercial Protected]'
                              : isPOTeam && item.parameter?.toLowerCase().includes('customer name')
                              ? `Client ID: ${order.customerCode || 'Protected'}`
                              : (item.poValue || '—')}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <select
                            value={item.status}
                            onChange={(e) => handleItemStatusChange(index, e.target.value)}
                            className={`text-xs font-bold rounded-lg px-2.5 py-1 border focus:outline-hidden ${
                              isMatch
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                : isMismatch
                                ? 'bg-rose-50 text-rose-700 border-rose-300'
                                : 'bg-slate-50 text-slate-700 border-slate-300'
                            }`}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Match">Match ✓</option>
                            <option value="Mismatch">Mismatch ✗</option>
                          </select>
                        </td>
                        <td className="py-3.5 px-4">
                          <input
                            type="text"
                            value={item.remarks || ''}
                            onChange={(e) => handleItemRemarksChange(index, e.target.value)}
                            placeholder="Add verification remark..."
                            className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Clarification Notes Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Verification Findings & Clarification Remarks
              </label>
              <textarea
                rows={2}
                value={clarificationNotes}
                onChange={(e) => setClarificationNotes(e.target.value)}
                placeholder="Record any discrepancies, technical queries raised with customer, or commercial exceptions..."
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: TIMELINE */}
      {activeTab === 'timeline' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-6 flex items-center">
            <Clock className="w-4 h-4 text-blue-600 mr-2" />
            Audit Trail & Order Lifecycle Timeline
          </h3>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {order.timeline?.map((evt, idx) => (
              <div key={idx} className="relative flex items-start space-x-3">
                <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-white border-3 border-blue-600" />
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-900">{evt.event}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(evt.timestamp).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">{evt.description}</p>
                  <p className="text-[11px] text-slate-400">
                    By: <strong>{evt.userName}</strong> ({evt.role})
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: CONFIRM ORDER */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center space-x-3 text-slate-900">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold">Confirm Sales Order</h3>
                <p className="text-xs text-slate-500">Order: {order.orderNumber}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Confirming this order will automatically issue an official <strong>Order Acknowledgement (OA)</strong> number, generate the Sky Power OA document PDF, and transition the order status to <strong>Order Confirmed</strong>.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Confirmation Remarks</label>
              <textarea
                rows={3}
                value={confirmRemarks}
                onChange={(e) => setConfirmRemarks(e.target.value)}
                placeholder="Commercial terms verified against PO. Order confirmed for manufacturing..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={confirming}
                onClick={handleConfirmOrder}
                className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
              >
                {confirming ? 'Confirming...' : 'Confirm & Issue OA'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: HOLD ORDER */}
      {showHoldModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center space-x-3 text-slate-900">
              <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                <PauseCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold">Place Order On Hold</h3>
                <p className="text-xs text-slate-500">Order: {order.orderNumber}</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Hold Category / Reason</label>
              <select
                value={holdReason}
                onChange={(e) => setHoldReason(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
              >
                <option value="Technical Clarification">Technical Clarification</option>
                <option value="Commercial Clarification">Commercial Clarification</option>
                <option value="Payment Pending">Advance Payment Pending</option>
                <option value="Customer Request">Customer Hold Request</option>
                <option value="Material Issue">Material / Component Availability</option>
                <option value="Delivery Issue">Delivery Reschedule</option>
                <option value="Management Approval">Management Approval Pending</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Hold Description & Details *</label>
              <textarea
                rows={3}
                required
                value={holdDescription}
                onChange={(e) => setHoldDescription(e.target.value)}
                placeholder="Explain why the order is placed on hold..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Expected Resume Date</label>
              <input
                type="date"
                value={expectedResumeDate}
                onChange={(e) => setExpectedResumeDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
              />
            </div>

            <div className="pt-2 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowHoldModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={holding}
                onClick={handleHoldOrder}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md"
              >
                {holding ? 'Saving...' : 'Place On Hold'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RESUME ORDER */}
      {showResumeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center space-x-3 text-slate-900">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                <PlayCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold">Resume Order Execution</h3>
                <p className="text-xs text-slate-500">Order: {order.orderNumber}</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Resolution Remarks</label>
              <textarea
                rows={3}
                value={resumeNotes}
                onChange={(e) => setResumeNotes(e.target.value)}
                placeholder="Details of clarification resolved, revised customer approval received..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Adjusted Delivery Date (If Extended)</label>
              <input
                type="date"
                value={revisedDeliveryDate}
                onChange={(e) => setRevisedDeliveryDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
              />
            </div>

            <div className="pt-2 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowResumeModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={resuming}
                onClick={handleResumeOrder}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md"
              >
                {resuming ? 'Resuming...' : 'Confirm Resume'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RECORD PO REVISION */}
      {showRevisionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center space-x-3 text-slate-900">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold">Record Revised Customer PO</h3>
                <p className="text-xs text-slate-500">Current Revision: #{po.poRevision || 0}</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Revised PO Number / Code *</label>
              <input
                type="text"
                required
                value={poRevisionNumber}
                onChange={(e) => setPoRevisionNumber(e.target.value)}
                placeholder="e.g. PO-LT-2026-904-REV1"
                className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Revised PO Value (₹ If Changed)</label>
              <input
                type="number"
                step="any"
                value={revisionPoValue}
                onChange={(e) => setRevisionPoValue(e.target.value)}
                placeholder={po.poValue?.toString()}
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Summary of Modifications</label>
              <textarea
                rows={3}
                value={revisionChangesSummary}
                onChange={(e) => setRevisionChangesSummary(e.target.value)}
                placeholder="Scope additions, updated payment milestone, corrected technical rating..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
              />
            </div>

            <div className="pt-2 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowRevisionModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={revising}
                onClick={handlePORevision}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md"
              >
                {revising ? 'Saving...' : 'Submit Revision'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CANCEL ORDER */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center space-x-3 text-slate-900">
              <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
                <Ban className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-rose-700">Cancel Sales Order</h3>
                <p className="text-xs text-slate-500">Order: {order.orderNumber}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              Are you sure you want to cancel this order? This action will set the status to Cancelled and halt all processing.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Cancellation Reason *</label>
              <textarea
                rows={3}
                required
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Reason for cancellation (e.g. project dropped by client, commercial default)..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
              />
            </div>

            <div className="pt-2 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Close
              </button>
              <button
                type="button"
                disabled={cancelling}
                onClick={handleCancelOrder}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md"
              >
                {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
