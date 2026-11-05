import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useWorkflow } from '../../../context/WorkflowContext';
import { downloadEnquiryPDF } from '../../../utils/pdfMakerService';
import { getStandardUnitPrice, formatIndianCommas, parseIndianCommas } from '../../../utils/pricingRules';
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
  FolderGit2,
  GripHorizontal,
  Plus,
  Minus,
  Trash2
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

  // ── Revision modal state: seed from actual pricing & products ──
  const [reductionAmount, setReductionAmount] = useState('');
  const [newTransportPrice, setNewTransportPrice] = useState(0);
  const [newForBasis, setNewForBasis] = useState('Client Own Transport');
  const [revisedProducts, setRevisedProducts] = useState([]);
  const [showAddProductInline, setShowAddProductInline] = useState(false);
  const defaultRevRate = getStandardUnitPrice('11 kV', '630 A', 'Indoor');
  const [newProductForm, setNewProductForm] = useState({
    productName: 'VCB Switchboard',
    kilovolt: '11 kV',
    ampere: '630 A',
    kiloampere: '26.3 kA',
    durationSec: 'For 3 Sec',
    usage: 'Indoor',
    ebMetering: 'Transformer Control',
    quantity: 1,
    basicPrice: defaultRevRate
  });

  const handleNewProductCategoryChange = (field, value) => {
    const updated = { ...newProductForm, [field]: value };
    const autoRate = getStandardUnitPrice(
      field === 'kilovolt' ? value : updated.kilovolt,
      field === 'ampere' ? value : updated.ampere,
      field === 'usage' ? value : updated.usage
    );
    updated.basicPrice = autoRate;
    setNewProductForm(updated);
  };

  // Draggable modal coordinates
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, posX: 0, posY: 0 });

  const handleMouseDown = (e) => {
    if (e.target.closest('button') || e.target.closest('input') || e.target.closest('select')) return;
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: modalPosition.x,
      posY: modalPosition.y
    };
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      setModalPosition({
        x: dragRef.current.posX + dx,
        y: dragRef.current.posY + dy
      });
    };

    const handleMouseUp = () => {
      if (isDragging) setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const openRevisionModal = () => {
    setError('');
    setRevisionSummary('');
    setReductionAmount('');
    setModalPosition({ x: 0, y: 0 });
    setShowAddProductInline(false);

    const basis = pricing.forBasis || 'Client Own Transport';
    setNewForBasis(basis);
    setNewTransportPrice(basis === 'Client Own Transport' ? 0 : (pricing.transportPrice || 0));

    // Clone products with their live individual basicPrices and quantities
    const cloned = (products && products.length > 0)
      ? products.map((p, idx) => {
          const bp = p.basicPrice !== undefined && !isNaN(p.basicPrice) && Number(p.basicPrice) > 0
            ? Number(p.basicPrice)
            : (Number(pricing.basicPrice) || 50000);
          const qty = Math.max(1, Number(p.quantity) || 1);
          return {
            ...p,
            id: p.id || `rev-prod-${idx}`,
            basicPrice: bp,
            quantity: qty,
            totalBasicPrice: bp * qty
          };
        })
      : [];

    setRevisedProducts(cloned);
    setShowRevisionModal(true);
  };

  const handleUpdateRevQty = (idx, delta) => {
    setRevisedProducts((prev) => {
      const updated = [...prev];
      const newQty = Math.max(1, (Number(updated[idx].quantity) || 1) + delta);
      const bp = Number(updated[idx].basicPrice) || 0;
      updated[idx] = {
        ...updated[idx],
        quantity: newQty,
        totalBasicPrice: bp * newQty
      };
      return updated;
    });
  };

  const handleUpdateRevProductPrice = (idx, newPrice) => {
    const priceNum = Math.max(0, Number(newPrice) || 0);
    setRevisedProducts((prev) => {
      const updated = [...prev];
      updated[idx] = {
        ...updated[idx],
        basicPrice: priceNum,
        totalBasicPrice: priceNum * (Number(updated[idx].quantity) || 1)
      };
      return updated;
    });
  };

  const handleUpdateAllProductsPrice = (newPrice) => {
    const priceNum = Math.max(0, Number(newPrice) || 0);
    setRevisedProducts((prev) =>
      prev.map((p) => ({
        ...p,
        basicPrice: priceNum,
        totalBasicPrice: priceNum * (Number(p.quantity) || 1)
      }))
    );
  };

  const handleDeleteRevProduct = (idx) => {
    if (revisedProducts.length <= 1) {
      setError('A revision must contain at least one product.');
      return;
    }
    setError('');
    setRevisedProducts((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAddRevProductSubmit = (e) => {
    e.preventDefault();
    const desc = `${newProductForm.kilovolt}, ${newProductForm.ampere}, ${newProductForm.kiloampere}, ${newProductForm.durationSec}, ${newProductForm.usage} ${newProductForm.productName} (${newProductForm.ebMetering})`;
    const bp = Number(newProductForm.basicPrice) || (Number(pricing.basicPrice) || 50000);
    const qty = Math.max(1, Number(newProductForm.quantity) || 1);
    const newProd = {
      ...newProductForm,
      id: `rev-add-${Date.now()}`,
      productDescription: desc,
      basicPrice: bp,
      quantity: qty,
      totalBasicPrice: bp * qty
    };
    setRevisedProducts((prev) => [...prev, newProd]);
    setShowAddProductInline(false);
  };

  // Live recalculation inside revision modal
  const revisionPreview = useMemo(() => {
    const totalUnits = revisedProducts.reduce((sum, p) => sum + (Number(p.quantity) || 1), 0);
    const benchmarkBasePrice = revisedProducts.length > 0
      ? Number(revisedProducts[0].basicPrice) || Number(pricing.basicPrice) || 0
      : Number(pricing.basicPrice) || 0;

    const reduction = Math.max(0, Number(reductionAmount) || 0);

    const totalBasic = revisedProducts.reduce((acc, p) => {
      const unitP = Number(p.basicPrice) || benchmarkBasePrice;
      const effectiveUnit = Math.max(0, unitP - reduction);
      return acc + (effectiveUnit * (Number(p.quantity) || 1));
    }, 0);

    const transport = newForBasis === 'Client Own Transport' ? 0 : (Number(newTransportPrice) || 0);
    const subTotal   = totalBasic + transport;
    const isIntra    = pricing.gstType === 'INTRA_STATE';
    const cgst       = isIntra ? Math.round(subTotal * 0.09) : 0;
    const sgst       = isIntra ? Math.round(subTotal * 0.09) : 0;
    const igst       = !isIntra ? Math.round(subTotal * 0.18) : 0;
    const tax        = cgst + sgst + igst;
    const total      = subTotal + tax;

    const effectiveBenchmark = Math.max(0, benchmarkBasePrice - reduction);

    return {
      benchmarkBasePrice,
      reduction,
      effectiveBenchmark,
      totalUnits,
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
  }, [revisedProducts, reductionAmount, newTransportPrice, newForBasis, pricing.basicPrice, pricing.gstType]);

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
    if (revisedProducts.length === 0) {
      setError('Please configure at least one product in this revision.');
      return;
    }

    const effectiveSummary = revisionSummary.trim() || (
      revisionPreview.reduction > 0
        ? `Client requested price reduction of ₹ ${revisionPreview.reduction.toLocaleString('en-IN')} per unit`
        : `Commercial revision with ${revisedProducts.length} product(s) (Total ${revisionPreview.totalUnits} units)`
    );

    try {
      const reduction = revisionPreview.reduction;

      const finalRevisedProducts = revisedProducts.map((p) => {
        const bp = Number(p.basicPrice) || revisionPreview.benchmarkBasePrice;
        const effPrice = Math.max(0, bp - reduction);
        const qty = Math.max(1, Number(p.quantity) || 1);
        return {
          ...p,
          basicPrice: effPrice,
          quantity: qty,
          totalBasicPrice: effPrice * qty
        };
      });

      // Use live-computed preview values so the snapshot is always consistent
      const revisedPricing = {
        ...pricing,
        forBasis: newForBasis,
        basicPrice: revisionPreview.effectiveBenchmark,
        reductionAmount: reduction,
        transportPrice: revisionPreview.transport,
        subTotal: revisionPreview.subTotal,
        cgstAmount: revisionPreview.cgst,
        sgstAmount: revisionPreview.sgst,
        igstAmount: revisionPreview.igst,
        totalTaxAmount: revisionPreview.tax,
        totalAmount: revisionPreview.total
      };

      await submitNewRevision(effectiveSummary, finalRevisedProducts, revisedPricing);
      setShowRevisionModal(false);
      setRevisionSummary('');
      setReductionAmount('');
      setSuccessMsg('New revision created successfully with updated products and commercial pricing.');
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
            NEW REVISION MODAL (DRAGGABLE & FULLY VIEWPORT RESPONSIVE)
            ============================================================ */}
        {showRevisionModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-hidden">
            <div
              style={{ transform: `translate(${modalPosition.x}px, ${modalPosition.y}px)` }}
              className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[90vh] flex flex-col my-auto transition-shadow"
            >
              {/* Draggable Header */}
              <div
                onMouseDown={handleMouseDown}
                className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0 select-none cursor-move rounded-t-xl"
              >
                <div className="flex items-center space-x-2">
                  <GripHorizontal className="w-4 h-4 text-slate-400" />
                  <RefreshCw className="w-4 h-4 text-[#EE6F2D]" />
                  <h3 className="text-xs sm:text-sm font-extrabold text-[#0A1E3F]">
                    Create New Revision (Client ID: {client.clientId})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRevisionModal(false)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors text-xs font-bold cursor-pointer"
                  title="Close (Esc)"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateRevisionSubmit} className="flex flex-col flex-1 min-h-0">
                {/* Scrollable Form Body */}
                <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 flex-1 min-h-0">
                  {/* Revision Reason */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      Revision Reason / Change Summary <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Client requested 3% price reduction or quantity amendment"
                      value={revisionSummary}
                      onChange={(e) => setRevisionSummary(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#EE6F2D]/20 focus:border-[#EE6F2D]"
                      autoFocus
                    />
                  </div>

                  {/* ============================================================
                      1. PRODUCTS IN THIS REVISION (ADD / REDUCE / REMOVE)
                      ============================================================ */}
                  <div className="space-y-2 p-3 bg-slate-50/90 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800">
                        <span>Configured Products ({revisedProducts.length})</span>
                        <span className="text-[10px] text-slate-500 font-normal">• {revisionPreview.totalUnits} Units Total</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowAddProductInline(!showAddProductInline)}
                        className="text-[11px] font-bold text-[#EE6F2D] hover:text-[#D95B1B] flex items-center space-x-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>{showAddProductInline ? 'Hide Add Form' : '+ Add Product'}</span>
                      </button>
                    </div>

                    {/* Product rows list */}
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {revisedProducts.map((p, idx) => {
                        const pBase = Number(p.basicPrice) || revisionPreview.benchmarkBasePrice;
                        const pEffective = Math.max(0, pBase - revisionPreview.reduction);
                        const pLineTotal = pEffective * (Number(p.quantity) || 1);

                        return (
                          <div
                            key={p.id || idx}
                            className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 shadow-2xs"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-slate-800 truncate text-[11px]">
                                {p.productDescription || `${p.kilovolt || '11kV'} ${p.productName || 'Switchboard'}`}
                              </p>
                              <div className="flex items-center space-x-1.5 mt-1">
                                <span className="text-[11px] font-semibold text-slate-500">Unit Price:</span>
                                <div className="relative flex items-center">
                                  <span className="absolute left-1.5 text-slate-400 font-bold text-[11px]">₹</span>
                                  <input
                                    type="number"
                                    min="0"
                                    value={p.basicPrice}
                                    onChange={(e) => handleUpdateRevProductPrice(idx, e.target.value)}
                                    className="w-28 pl-4 pr-1 py-0.5 text-xs font-mono font-bold rounded border border-slate-300 bg-white focus:border-[#EE6F2D] focus:outline-hidden"
                                  />
                                </div>
                                {revisionPreview.reduction > 0 && (
                                  <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-1 py-0.5 rounded border border-rose-200">
                                    Eff: ₹{pEffective.toLocaleString('en-IN')}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center space-x-3 shrink-0 self-end sm:self-center">
                              {/* Quantity Counter */}
                              <div className="flex items-center space-x-1">
                                <span className="text-[10px] font-semibold text-slate-500">Qty:</span>
                                <div className="inline-flex items-center space-x-1 bg-slate-100 px-1.5 py-0.5 rounded-md border border-slate-200">
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateRevQty(idx, -1)}
                                    className="w-4 h-4 rounded flex items-center justify-center text-slate-600 hover:text-slate-900 cursor-pointer"
                                    title="Reduce Quantity"
                                  >
                                    <Minus className="w-2.5 h-2.5" />
                                  </button>
                                  <span className="font-mono font-bold text-slate-800 text-[11px] w-5 text-center">
                                    {p.quantity || 1}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateRevQty(idx, 1)}
                                    className="w-4 h-4 rounded flex items-center justify-center text-slate-600 hover:text-slate-900 cursor-pointer"
                                    title="Add Quantity"
                                  >
                                    <Plus className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Explicit Line Total */}
                              <div className="text-right min-w-[95px]">
                                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-tight">Line Total</span>
                                <span className="font-mono font-black text-[#1E5BB8] text-xs">
                                  ₹ {pLineTotal.toLocaleString('en-IN')}
                                </span>
                              </div>

                              {/* Remove Product */}
                              <button
                                type="button"
                                onClick={() => handleDeleteRevProduct(idx)}
                                className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer transition-colors"
                                title="Remove Product"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Inline Add Product Form */}
                    {showAddProductInline && (
                      <div className="mt-2 p-3 bg-orange-50/60 rounded-lg border border-orange-200 space-y-2 text-xs">
                        <div className="font-bold text-[#0A1E3F] text-[11px]">Add Additional Product to Revision</div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600">Product</label>
                            <select
                              value={newProductForm.productName}
                              onChange={(e) => setNewProductForm({ ...newProductForm, productName: e.target.value })}
                              className="w-full px-2 py-1 text-xs rounded border border-slate-300 bg-white"
                            >
                              <option value="VCB Switchboard">VCB Switchboard</option>
                              <option value="Others">Others</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600">Kilovolt</label>
                            <select
                              value={newProductForm.kilovolt}
                              onChange={(e) => handleNewProductCategoryChange('kilovolt', e.target.value)}
                              className="w-full px-2 py-1 text-xs rounded border border-slate-300 bg-white"
                            >
                              <option value="11 kV">11 kV</option>
                              <option value="22 kV">22 kV</option>
                              <option value="33 kV">33 kV</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600">Ampere</label>
                            <select
                              value={newProductForm.ampere}
                              onChange={(e) => handleNewProductCategoryChange('ampere', e.target.value)}
                              className="w-full px-2 py-1 text-xs rounded border border-slate-300 bg-white"
                            >
                              <option value="630 A">630 A</option>
                              <option value="800 A">800 A</option>
                              <option value="1250 A">1250 A</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600">Usage</label>
                            <select
                              value={newProductForm.usage}
                              onChange={(e) => handleNewProductCategoryChange('usage', e.target.value)}
                              className="w-full px-2 py-1 text-xs rounded border border-slate-300 bg-white"
                            >
                              <option value="Indoor">Indoor</option>
                              <option value="Outdoor">Outdoor</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600">Quantity</label>
                            <input
                              type="number"
                              min="1"
                              value={newProductForm.quantity}
                              onChange={(e) => setNewProductForm({ ...newProductForm, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                              className="w-full px-2 py-1 text-xs rounded border border-slate-300 bg-white font-bold"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600">Unit Price (₹)</label>
                            <input
                              type="text"
                              value={formatIndianCommas(newProductForm.basicPrice)}
                              onChange={(e) => setNewProductForm({ ...newProductForm, basicPrice: parseIndianCommas(e.target.value) })}
                              className="w-full px-2 py-1 text-xs rounded border border-slate-300 bg-white font-bold font-mono"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end space-x-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setShowAddProductInline(false)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-200 rounded cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleAddRevProductSubmit}
                            className="px-3 py-1 text-[11px] font-bold bg-[#EE6F2D] text-white rounded hover:bg-[#D95B1B] cursor-pointer"
                          >
                            Add to Revision
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ============================================================
                      2. COMMERCIAL & PRICING ADJUSTMENTS
                      ============================================================ */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50/80 rounded-xl border border-slate-200">
                    {/* Live Unit Basic Price benchmark */}
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        Current Unit Basic Price (₹)
                      </label>
                      <div className="relative flex items-center">
                        <span className="absolute left-2.5 text-slate-500 font-bold text-xs">₹</span>
                        <input
                          type="number"
                          min="0"
                          value={revisionPreview.benchmarkBasePrice}
                          onChange={(e) => handleUpdateAllProductsPrice(e.target.value)}
                          className="w-full pl-6 pr-2 py-2 text-xs font-mono font-bold rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#EE6F2D]/20 focus:border-[#EE6F2D] text-slate-800"
                        />
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

                    {/* Effective Unit Basic Price display */}
                    <div className="sm:col-span-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                      <span className="font-bold text-emerald-900">Effective Basic Price / Unit:</span>
                      <span className="font-mono font-black text-emerald-700 text-sm flex items-center space-x-1.5">
                        <span>₹ {revisionPreview.effectiveBenchmark.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        {revisionPreview.reduction > 0 && (
                          <span className="text-[10px] font-bold text-rose-600 bg-white px-1.5 py-0.5 rounded border border-rose-200">
                            -₹ {revisionPreview.reduction.toLocaleString('en-IN')}
                          </span>
                        )}
                      </span>
                    </div>

                    {/* FOR Basis & Transport */}
                    <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">FOR Basis</label>
                        <select
                          value={newForBasis}
                          onChange={(e) => setNewForBasis(e.target.value)}
                          className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#EE6F2D]/20 focus:border-[#EE6F2D]"
                        >
                          <option value="Client Own Transport">Client Own Transport</option>
                          <option value="Sky Power Needs">Sky Power Needs</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                          Transport (₹)
                          {newForBasis === 'Client Own Transport' && (
                            <span className="ml-1 text-[10px] font-bold text-emerald-600">(Not Charged)</span>
                          )}
                        </label>
                        <input
                          type="number"
                          value={newForBasis === 'Client Own Transport' ? 0 : newTransportPrice}
                          onChange={(e) => setNewTransportPrice(e.target.value)}
                          disabled={newForBasis === 'Client Own Transport'}
                          className={`w-full px-2.5 py-2 text-xs font-mono font-bold rounded-lg border ${
                            newForBasis === 'Client Own Transport'
                              ? 'border-dashed border-slate-300 bg-slate-100 text-slate-400 cursor-not-allowed'
                              : 'border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#EE6F2D]/20 focus:border-[#EE6F2D]'
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* ============================================================
                      3. LIVE AMOUNT PREVIEW
                      ============================================================ */}
                  <div className="rounded-lg border border-slate-200 overflow-hidden text-xs">
                    <div className="bg-slate-100 px-3 py-1.5 font-black uppercase tracking-wider text-slate-600 text-[10px]">
                      Live Amount Preview
                    </div>
                    <table className="w-full">
                      <tbody className="divide-y divide-slate-100">
                        <tr>
                          <td className="px-3 py-1.5 text-slate-600">
                            Basic Price × Units ({Number(revisionPreview.effectiveBenchmark).toLocaleString('en-IN')} × {revisionPreview.totalUnits})
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
                </div>

                {/* Sticky Action Footer */}
                <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-2 shrink-0 rounded-b-xl">
                  <button
                    type="button"
                    onClick={() => setShowRevisionModal(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200/80 rounded-lg cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 text-xs font-bold bg-[#EE6F2D] hover:bg-[#D95B1B] text-white rounded-lg shadow-xs cursor-pointer disabled:opacity-50 transition-colors"
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

