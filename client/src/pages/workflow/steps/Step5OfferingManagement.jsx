import React, { useState, useMemo } from 'react';
import { useWorkflow } from '../../../context/WorkflowContext';
import { downloadEnquiryPDF } from '../../../utils/pdfMakerService';
import {
  FileText,
  Download,
  Send,
  Edit2,
  PlusCircle,
  Eye,
  CheckCircle2,
  Clock,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  RefreshCw,
  Building2,
  FolderGit2
} from 'lucide-react';

export const Step5OfferingManagement = () => {
  const {
    enquiryId,
    ern,
    client,
    project,
    products,
    pricing,
    currentVersion,
    setCurrentVersion,
    revisions,
    submitNewRevision,
    sendOffering,
    prevStep,
    nextStep,
    saving,
    error,
    setError
  } = useWorkflow();

  const [downloading, setDownloading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionSummary, setRevisionSummary] = useState('');

  // ── Revision modal state: seed from actual pricing ──
  const [reductionAmount, setReductionAmount] = useState('');
  const [newTransportPrice, setNewTransportPrice] = useState(0);
  const [newForBasis, setNewForBasis] = useState('Client Own Transport');

  const openRevisionModal = () => {
    setError('');
    setRevisionSummary('');
    setReductionAmount('');
    const basis = pricing.forBasis || 'Client Own Transport';
    setNewForBasis(basis);
    setNewTransportPrice(basis === 'Client Own Transport' ? 0 : (pricing.transportPrice || 0));
    setShowRevisionModal(true);
  };

  // Live recalculation inside revision modal
  const revisionPreview = useMemo(() => {
    const currentBasePrice = Number(pricing.basicPrice) || (Number(products[0]?.basicPrice) || 0);
    const reduction = Math.max(0, Number(reductionAmount) || 0);
    const effectiveBasicPrice = Math.max(0, currentBasePrice - reduction);

    const transport = newForBasis === 'Client Own Transport' ? 0 : (Number(newTransportPrice) || 0);
    const totalBasic = products.reduce((acc, p) => acc + effectiveBasicPrice * (p.quantity || 1), 0);
    const subTotal   = totalBasic + transport;
    const isIntra    = pricing.gstType === 'INTRA_STATE';
    const cgst       = isIntra ? Math.round(subTotal * 0.09) : 0;
    const sgst       = isIntra ? Math.round(subTotal * 0.09) : 0;
    const igst       = !isIntra ? Math.round(subTotal * 0.18) : 0;
    const tax        = cgst + sgst + igst;
    const total      = subTotal + tax;

    return {
      currentBasePrice,
      reduction,
      effectiveBasicPrice,
      totalBasic,
      transport,
      subTotal,
      cgst,
      sgst,
      igst,
      tax,
      total,
      isIntra
    };
  }, [pricing.basicPrice, reductionAmount, newTransportPrice, newForBasis, products, pricing.gstType]);

  // Fallback demo revisions if brand new
  const displayRevisions =
    revisions && revisions.length > 0
      ? revisions
      : [
          {
            versionId: currentVersion || 'OFR-001',
            versionNumber: 1,
            createdAt: new Date(),
            totalAmount: pricing.totalAmount || 1203600,
            status: 'Current',
            changeSummary: 'Initial Techno-Commercial Offering Generated'
          }
        ];

  const handleDownloadPDF = async (rev = null) => {
    setDownloading(true);
    setSuccessMsg('');
    try {
      const activeVerId = rev?.versionId || currentVersion || 'OFR-001';
      const activeProducts = rev?.productsSnapshot?.length ? rev.productsSnapshot : products;
      const activePricing = rev?.pricingSnapshot || pricing;

      await downloadEnquiryPDF({
        ern: ern || 'ERN-2026-0001',
        clientCustomId: client.clientId || 'SP-CL-2026-0001',
        clientId: client,
        offerDate: rev?.createdAt || new Date(),
        versionId: activeVerId,
        project,
        products: activeProducts,
        commercialPricing: activePricing
      });

      setSuccessMsg(`Official Quotation PDF for ${activeVerId} generated & downloaded successfully.`);
    } catch (err) {
      console.error('PDF download failed:', err);
      setError('Could not generate PDF: ' + (err.message || 'Unknown error'));
    } finally {
      setDownloading(false);
    }
  };

  const handleSendToClient = async (versionId) => {
    setError('');
    setSuccessMsg('');
    try {
      await sendOffering(versionId || currentVersion);
      setSuccessMsg(`Offering ${versionId || currentVersion} has been recorded as Sent to Client.`);
    } catch (err) {
      // error set in context
    }
  };

  const handleCreateRevisionSubmit = async (e) => {
    e.preventDefault();
    const effectiveSummary = revisionSummary.trim() || (
      revisionPreview.reduction > 0
        ? `Client requested price reduction of ₹ ${revisionPreview.reduction.toLocaleString('en-IN')} per unit`
        : 'Commercial revision requested'
    );

    try {
      const effectiveBasicPrice = revisionPreview.effectiveBasicPrice;

      const updatedProducts = products.map((p) => ({
        ...p,
        basicPrice: effectiveBasicPrice,
        totalBasicPrice: effectiveBasicPrice * (p.quantity || 1)
      }));

      // Use live-computed preview values so the snapshot is always consistent
      const revisedPricing = {
        ...pricing,
        forBasis: newForBasis,
        basicPrice: effectiveBasicPrice,
        reductionAmount: revisionPreview.reduction,
        transportPrice: revisionPreview.transport,
        subTotal: revisionPreview.subTotal,
        cgstAmount: revisionPreview.cgst,
        sgstAmount: revisionPreview.sgst,
        igstAmount: revisionPreview.igst,
        totalTaxAmount: revisionPreview.tax,
        totalAmount: revisionPreview.total
      };

      await submitNewRevision(effectiveSummary, updatedProducts, revisedPricing);
      setShowRevisionModal(false);
      setRevisionSummary('');
      setReductionAmount('');
      setSuccessMsg('New revision created successfully with updated commercial pricing.');
    } catch (err) {
      // error handled in context
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Current':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">Current</span>;
      case 'Sent':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-[#1E5BB8] border border-blue-200">Sent</span>;
      case 'Draft':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">Draft</span>;
      case 'Approved':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300">Approved</span>;
      case 'Superseded':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500">Superseded</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200/90 overflow-hidden">
      {/* Card Header */}
      <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#FFF5EE] border border-[#FCDCC9] flex items-center justify-center text-[#EE6F2D]">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-[#0A1E3F] tracking-tight">Offering Management – Revision &amp; Actions</h2>
            <p className="text-xs text-slate-500 font-medium">
              Step 5: Track version history, download quotation PDFs, and handle client revisions
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            Active: {currentVersion}
          </span>
        </div>
      </div>

      <div className="p-6 md:p-8 space-y-7 max-w-5xl">
        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs font-medium flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-medium flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ============================================================
            METADATA SUMMARY CARD
            ============================================================ */}
        <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Client ID</span>
            <p className="text-sm font-mono font-extrabold text-[#1E5BB8]">
              {client.clientId || 'SP-CL-2026-0001'}
            </p>
            <p className="text-xs font-semibold text-slate-700 truncate">{client.companyName || 'ABC Electricals'}</p>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Project Title</span>
            <p className="text-sm font-bold text-[#0A1E3F] truncate">
              {project.projectName || '11kV VCB Switchboard'}
            </p>
            <p className="text-xs text-slate-500 font-mono">ERN: {ern || 'Pending'}</p>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Segment &amp; Scope</span>
            <p className="text-sm font-bold text-slate-800">
              {project.segment || 'Renewable'} – {project.subSegment || 'Wind'}
            </p>
            <p className="text-xs text-slate-500">{products.length} Products Configured</p>
          </div>
        </div>

        {/* ============================================================
            OFFERING HISTORY TABLE
            ============================================================ */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-black uppercase tracking-wider text-[#EE6F2D]">
              <span className="w-1.5 h-3.5 bg-[#EE6F2D] rounded-full" />
              <span>Offering History (Same Enquiry)</span>
            </div>

            <button
              type="button"
              onClick={openRevisionModal}
              className="text-xs font-bold text-[#EE6F2D] hover:text-[#D95B1B] flex items-center space-x-1 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Create New Revision</span>
            </button>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-2.5 px-3 w-24">Version</th>
                  <th className="py-2.5 px-4">Date &amp; Time</th>
                  <th className="py-2.5 px-4 text-right">Total Amount (₹)</th>
                  <th className="py-2.5 px-3 text-center w-28">Status</th>
                  <th className="py-2.5 px-4 text-center w-36">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {displayRevisions.map((rev, idx) => {
                  const dateStr = rev.createdAt
                    ? new Date(rev.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      }) +
                      ' ' +
                      new Date(rev.createdAt).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : 'Today';

                  const isCurrent = rev.versionId === currentVersion;

                  return (
                    <tr
                      key={rev.versionId || idx}
                      className={isCurrent ? 'bg-orange-50/40 font-bold' : 'hover:bg-slate-50/70'}
                    >
                      <td className="py-3 px-3">
                        <span className="font-mono font-black text-[#1E5BB8]">{rev.versionId}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{dateStr}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        ₹ {Number(rev.totalAmount || pricing.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 text-center">{getStatusBadge(isCurrent ? 'Current' : rev.status)}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => handleDownloadPDF(rev)}
                            disabled={downloading}
                            className="p-1.5 rounded-md text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                            title="Download PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSendToClient(rev.versionId)}
                            className="p-1.5 rounded-md text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            title="Re-Send to Client"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ============================================================
            OFFERING ACTIONS BAR
            ============================================================ */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-xs font-black uppercase tracking-wider text-[#EE6F2D]">
            <span className="w-1.5 h-3.5 bg-[#EE6F2D] rounded-full" />
            <span>Offering Actions</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={openRevisionModal}
              className="px-4 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Edit Offering</span>
            </button>

            <button
              type="button"
              onClick={() => handleDownloadPDF()}
              disabled={downloading}
              className="px-4 py-2.5 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>{downloading ? 'Generating PDF...' : 'Download PDF'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleSendToClient()}
              disabled={saving}
              className="px-4 py-2.5 rounded-lg border border-blue-300 bg-blue-50 hover:bg-blue-100 text-[#1E5BB8] text-xs font-bold shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5 text-[#1E5BB8]" />
              <span>Re-Send to Client</span>
            </button>
          </div>
        </div>

        {/* ============================================================
            NEW REVISION MODAL
            ============================================================ */}
        {showRevisionModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <RefreshCw className="w-4 h-4 text-[#EE6F2D]" />
                  <h3 className="text-sm font-extrabold text-[#0A1E3F]">
                    Create New Revision (Client ID: {client.clientId})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRevisionModal(false)}
                  className="text-slate-400 hover:text-slate-700 text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateRevisionSubmit} className="space-y-4">
                {/* Revision Reason */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Revision Reason / Change Summary <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Client requested 3% price reduction or scope amendment"
                    value={revisionSummary}
                    onChange={(e) => setRevisionSummary(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#EE6F2D]/20 focus:border-[#EE6F2D]"
                    autoFocus
                  />
                </div>

                {/* FOR Basis selector */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">FOR Basis</label>
                  <select
                    value={newForBasis}
                    onChange={(e) => setNewForBasis(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#EE6F2D]/20 focus:border-[#EE6F2D]"
                  >
                    <option value="Client Own Transport">Client Own Transport</option>
                    <option value="Sky Power Needs">Sky Power Needs</option>
                  </select>
                </div>

                {/* Price and Reduction Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50/80 rounded-xl border border-slate-200">
                  {/* Original Base Price (Read-only as entered in Step 4) */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Current Basic Price (Step 4)
                    </label>
                    <div className="px-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-300 bg-white text-slate-800 flex items-center justify-between select-none">
                      <span>₹ {revisionPreview.currentBasePrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      <span className="text-[10px] font-semibold text-slate-400">Fixed</span>
                    </div>
                  </div>

                  {/* Reduce Amount Input */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-rose-600 uppercase tracking-wider">
                      Reduce Amount (₹) <span className="text-slate-400 font-normal">per unit</span>
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-2.5 text-slate-500 font-bold text-xs">₹</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="e.g. 500 or 1000"
                        value={reductionAmount}
                        onChange={(e) => setReductionAmount(e.target.value)}
                        className="w-full pl-6 pr-2 py-2 text-xs font-mono font-bold rounded-lg border border-rose-300 focus:border-rose-500 bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 text-rose-900"
                      />
                    </div>
                  </div>

                  {/* Effective Basic Price display after reduction */}
                  <div className="sm:col-span-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-900">Effective Basic Price / Unit:</span>
                    <span className="font-mono font-black text-emerald-700 text-sm flex items-center space-x-1.5">
                      <span>₹ {revisionPreview.effectiveBasicPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      {revisionPreview.reduction > 0 && (
                        <span className="text-[10px] font-bold text-rose-600 bg-white px-1.5 py-0.5 rounded border border-rose-200">
                          -₹ {revisionPreview.reduction.toLocaleString('en-IN')}
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Revised Transport */}
                  <div className="sm:col-span-2 space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Transport (₹)
                      {newForBasis === 'Client Own Transport' && (
                        <span className="ml-1.5 text-[10px] font-bold text-emerald-600">(Not Charged)</span>
                      )}
                    </label>
                    <input
                      type="number"
                      value={newForBasis === 'Client Own Transport' ? 0 : newTransportPrice}
                      onChange={(e) => setNewTransportPrice(e.target.value)}
                      disabled={newForBasis === 'Client Own Transport'}
                      className={`w-full px-3 py-2 text-xs font-mono font-bold rounded-lg border ${
                        newForBasis === 'Client Own Transport'
                          ? 'border-dashed border-slate-300 bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#EE6F2D]/20 focus:border-[#EE6F2D]'
                      }`}
                    />
                  </div>
                </div>

                {/* Live calculation preview */}
                <div className="rounded-lg border border-slate-200 overflow-hidden text-xs">
                  <div className="bg-slate-100 px-3 py-1.5 font-black uppercase tracking-wider text-slate-600 text-[10px]">
                    Live Amount Preview
                  </div>
                  <table className="w-full">
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="px-3 py-1.5 text-slate-600">
                          Basic Price × Units ({Number(revisionPreview.effectiveBasicPrice).toLocaleString('en-IN')} × {products.reduce((a, b) => a + (Number(b.quantity) || 1), 0)})
                        </td>
                        <td className="px-3 py-1.5 text-right font-mono font-semibold text-slate-800">
                          ₹ {revisionPreview.totalBasic.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-3 py-1.5 text-slate-600">
                          Transport
                          {newForBasis === 'Client Own Transport' && (
                            <span className="ml-1 text-emerald-600 font-bold">(Client Own)</span>
                          )}
                        </td>
                        <td className="px-3 py-1.5 text-right font-mono font-semibold">
                          {newForBasis === 'Client Own Transport'
                            ? <span className="text-emerald-600">₹ 0.00</span>
                            : `₹ ${revisionPreview.transport.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                          }
                        </td>
                      </tr>
                      <tr className="bg-slate-50 font-bold">
                        <td className="px-3 py-1.5 text-slate-800">Subtotal</td>
                        <td className="px-3 py-1.5 text-right font-mono text-slate-900">
                          ₹ {revisionPreview.subTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                      {revisionPreview.isIntra ? (
                        <>
                          <tr>
                            <td className="px-3 py-1 text-slate-500">CGST 9%</td>
                            <td className="px-3 py-1 text-right font-mono text-slate-500">
                              ₹ {revisionPreview.cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                          <tr>
                            <td className="px-3 py-1 text-slate-500">SGST 9%</td>
                            <td className="px-3 py-1 text-right font-mono text-slate-500">
                              ₹ {revisionPreview.sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        </>
                      ) : (
                        <tr>
                          <td className="px-3 py-1 text-slate-500">IGST 18%</td>
                          <td className="px-3 py-1 text-right font-mono text-slate-500">
                            ₹ {revisionPreview.igst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      )}
                      <tr className="bg-orange-50 border-t-2 border-[#EE6F2D] font-black text-sm">
                        <td className="px-3 py-2 text-[#0A1E3F]">Total Amount</td>
                        <td className="px-3 py-2 text-right font-mono text-[#EE6F2D]">
                          ₹ {revisionPreview.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900 leading-relaxed">
                  <strong>Notice:</strong> Client ID <strong>{client.clientId}</strong> will remain unchanged. A new snapshot (e.g. OFR-00{displayRevisions.length + 1}) will be created without overwriting previous versions.
                </div>

                <div className="pt-2 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowRevisionModal(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 text-xs font-bold bg-[#EE6F2D] hover:bg-[#D95B1B] text-white rounded-lg shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {saving ? 'Creating Revision...' : 'Generate New Revision'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Action Bar */}
        <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={prevStep}
            className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-sm font-bold hover:bg-slate-50 transition-colors flex items-center space-x-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <button
            type="button"
            onClick={nextStep}
            className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-[#EE6F2D] to-[#D95B1B] hover:from-[#E46220] hover:to-[#C65015] text-white text-sm font-bold shadow-md shadow-orange-500/20 transition-all flex items-center space-x-2 cursor-pointer"
          >
            <span>Finalize &amp; Send to PO Team</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

