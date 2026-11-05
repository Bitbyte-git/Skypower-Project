import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/client';
import { StatusBadge } from '../../components/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { numberToWords } from '../../utils/numberToWords';
import {
  FileText,
  Download,
  ArrowLeft,
  Building2,
  Calendar,
  Layers,
  History,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Printer
} from 'lucide-react';

export const QuotationDetails = () => {
  const { id } = useParams();
  const { isAdmin } = useAuth();

  const [quotation, setQuotation] = useState(null);
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Revision Modal State
  const [showReviseModal, setShowReviseModal] = useState(false);
  const [revisionRemarks, setRevisionRemarks] = useState('');
  const [discountTotal, setDiscountTotal] = useState(0);
  const [revising, setRevising] = useState(false);

  const fetchQuotation = async () => {
    try {
      const res = await api.get(`/quotations/${id}`);
      if (res.success) {
        setQuotation(res.quotation);
        setVersions(res.versions || []);
        setDiscountTotal(res.quotation.discountTotal || 0);
      }
    } catch (err) {
      setError('Failed to load quotation details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotation();
  }, [id]);

  const handleExecuteRevision = async () => {
    if (!revisionRemarks.trim()) {
      alert('Please specify the reason / remarks for this quotation revision.');
      return;
    }

    setRevising(true);
    try {
      const payload = {
        revisionRemarks,
        validityDays: 30,
        productPricing: quotation.productPricing,
        commercialTerms: quotation.commercialTerms,
        paymentTerms: quotation.paymentTerms,
        deliveryTerms: quotation.deliveryTerms,
        warrantyTerms: quotation.warrantyTerms,
        discountTotal: Number(discountTotal),
        taxRatePercent: quotation.taxRatePercent || 18
      };

      const res = await api.post(`/quotations/${id}/revise`, payload);
      setShowReviseModal(false);
      window.location.href = `/quotations/${res.quotation._id}`;
    } catch (err) {
      alert(err.message || 'Revision failed.');
    } finally {
      setRevising(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-slate-500">Quotation not found.</p>
        <Link to="/quotations" className="text-xs text-blue-600 underline mt-2 inline-block">
          Return to Quotations List
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-xs print:hidden">
        <div className="flex items-center space-x-3">
          <Link to="/quotations" className="text-slate-400 hover:text-slate-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-lg font-black font-mono text-indigo-950 tracking-tight">
                {quotation.formattedQuotationNumber}
              </h1>
              <StatusBadge status={quotation.status} />
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                Version #{quotation.version}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Against Approved Requisition:{' '}
              <Link to={`/enquiries/${quotation.enquiryId?._id}`} className="font-mono text-blue-700 font-bold hover:underline">
                {quotation.ern}
              </Link>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center px-3 py-1.5 border border-slate-300 text-xs font-semibold rounded bg-white text-slate-700 hover:bg-slate-50 shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5 mr-1 text-slate-500" /> Print
          </button>

          {quotation.pdfFileUrl && (
            <a
              href={quotation.pdfFileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-bold shadow-xs transition-colors"
            >
              <Download className="w-4 h-4 mr-1.5" /> Download Generated PDF
            </a>
          )}

          {isAdmin && quotation.status === 'Issued' && (
            <button
              type="button"
              onClick={() => setShowReviseModal(true)}
              className="inline-flex items-center px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Revise Quotation (V{quotation.version + 1})
            </button>
          )}
        </div>
      </div>

      {/* Version Navigation Bar */}
      {versions.length > 1 && (
        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-xs flex items-center space-x-2 print:hidden">
          <History className="w-4 h-4 text-slate-400 mr-1" />
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider mr-2">Version Audit Trail:</span>
          <div className="flex flex-wrap gap-2">
            {versions.map((v) => (
              <Link
                key={v._id}
                to={`/quotations/${v._id}`}
                className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all ${
                  v._id === quotation._id
                    ? 'bg-indigo-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {v.formattedQuotationNumber} {v.status === 'Superseded' && '(Archived)'}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          AUTHENTIC PAPER QUOTATION DOCUMENT
      ========================================================================= */}
      <div className="paper-sheet p-8 sm:p-12 text-slate-900 bg-white border border-slate-200/90 rounded-2xl shadow-sm">
        {/* Paper Header */}
        <div className="paper-header pb-6 mb-8 border-b border-slate-200">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="space-y-1.5">
              <div className="flex items-center space-x-3.5">
                <div className="w-14 h-14 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0 shadow-xs">
                  <img src="/brand-logo.jpg" alt="Sky Power Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <div className="flex items-center space-x-1.5 text-xl font-black tracking-tight leading-none">
                    <span className="text-[#1E5BB8]">SKY</span>
                    <span className="text-[#EE6F2D]">POWER</span>
                  </div>
                  <p className="text-xs text-[#1E3A5F] font-bold tracking-wide mt-1">
                    Switch to the Future — HT / LT Switchgears &amp; Panel Engineering
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-500 font-medium pl-0.5">
                Works: 3/97D, Sarkarkollapatty, Paaraivattam, Salem-636030, Tamil Nadu • GST No: 33AFCFS0165B1ZL • ISO 9001:2015
              </p>
            </div>

            {/* Official Offer Specification Box (Cleanly Stacked, Zero Collision) */}
            <div className="flex flex-col items-start md:items-end space-y-2 shrink-0">
              <div className="stamp-badge stamp-approved text-xs">
                SKY POWER COMMERCIAL OFFER VALIDATED
              </div>

              <div className="border border-slate-300 p-4 rounded-xl bg-slate-50/90 text-left md:text-right min-w-[230px] shadow-2xs">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block">
                  Official Commercial Offer
                </span>
                <span className="text-base font-black font-mono text-[#1E5BB8] block mt-0.5">
                  {quotation.formattedQuotationNumber}
                </span>
                <span className="text-xs font-mono text-slate-600 block mt-0.5">
                  Issue Dt: {new Date(quotation.quotationDate).toLocaleDateString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 1.0 Client & Validity */}
        <div className="mb-8">
          <div className="form-section-title">1.0 Issued Client Demographic & Validity Horizon</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border border-slate-200 rounded p-4 bg-slate-50/40 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">1.1 Client Legal Entity</span>
              <p className="font-bold text-slate-900 text-sm">{quotation.clientId?.companyName}</p>
              <p className="text-slate-500">Attn: {quotation.clientId?.contactPerson} ({quotation.clientId?.mobile})</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">1.2 Requisition Reference</span>
              <p className="font-mono font-bold text-blue-900 text-sm">{quotation.ern}</p>
              <p className="text-slate-500">Location: {quotation.clientId?.clientLocation}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">1.3 Offer Validity Window</span>
              <p className="font-bold text-slate-800">
                Valid until {new Date(quotation.validityDate).toLocaleDateString('en-IN')}
              </p>
              <p className="text-[10px] text-emerald-700 font-semibold">Active Commercial Term</p>
            </div>
          </div>
        </div>

        {/* 2.0 Pricing Matrix */}
        <div className="mb-8">
          <div className="form-section-title flex items-center justify-between">
            <span>2.0 Equipment Pricing Schedule</span>
            <span className="text-[10px] font-mono text-slate-500">{quotation.productPricing.length} Line Items</span>
          </div>

          <div className="border border-slate-300 rounded overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Equipment Item Description</th>
                  <th className="py-2.5 px-3">Rating / Spec</th>
                  <th className="py-2.5 px-3">Qty</th>
                  <th className="py-2.5 px-3">Unit Price (₹)</th>
                  <th className="py-2.5 px-3">Disc %</th>
                  <th className="py-2.5 px-3 text-right">Net Line Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {quotation.productPricing.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-bold text-slate-400">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">
                      {item.productName}
                      <div className="text-[10px] text-slate-500 font-normal">{item.productDescription}</div>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-700">
                      {[item.voltageRating, item.breakingCapacity].filter(Boolean).join(' | ') || '-'}
                    </td>
                    <td className="py-2.5 px-3 font-bold">{item.quantity} {item.unit}</td>
                    <td className="py-2.5 px-3 font-mono">₹ {Number(item.unitPrice).toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-600">{item.discountPercent || 0}%</td>
                    <td className="py-2.5 px-3 font-mono font-black text-slate-900 text-right">
                      ₹ {Number(item.netAmount).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tally Box */}
          <div className="mt-3 p-4 bg-slate-50 border border-slate-300 rounded flex flex-col items-end space-y-1.5 text-xs">
            <div className="flex justify-between w-72 text-slate-700">
              <span className="font-semibold">Subtotal Gross:</span>
              <span className="font-mono font-bold">₹ {Number(quotation.subTotal).toLocaleString('en-IN')}</span>
            </div>
            {quotation.discountTotal > 0 && (
              <div className="flex justify-between w-72 text-rose-700 font-semibold">
                <span>Commercial Discount:</span>
                <span className="font-mono font-bold">- ₹ {Number(quotation.discountTotal).toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between w-72 text-slate-700">
              <span className="font-semibold">Statutory GST ({quotation.taxRatePercent || 18}%):</span>
              <span className="font-mono font-bold">₹ {Number(quotation.taxTotal).toLocaleString('en-IN')}</span>
            </div>
            <div className="pt-2 border-t-2 border-slate-400 flex justify-between w-80 text-sm font-black text-slate-950">
              <span className="uppercase tracking-wider">Total Offer Value:</span>
              <span className="font-mono text-emerald-800 text-base">
                ₹ {Number(quotation.finalQuotationValue).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="pt-2 text-right text-xs italic font-semibold text-slate-600">
              Amount in Words: {numberToWords(quotation.finalQuotationValue)}
            </div>
          </div>
        </div>

        {/* 3.0 Terms */}
        <div className="mb-8">
          <div className="form-section-title">3.0 Commercial &amp; Statutory Terms (Clauses 4 – 12)</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs border border-slate-200 rounded p-4 bg-slate-50/40">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">3.1 Price Basis</span>
              <p className="font-medium text-slate-800 mt-0.5">{quotation.commercialTerms || 'Ex-Works: Salem, Tamil Nadu'}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">3.2 Payment Terms</span>
              <p className="font-medium text-slate-800 mt-0.5">{quotation.paymentTerms || '50% as advance along with your valued purchase order and balance 50% against proforma Invoice after inspection and before dispatch.'}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">3.3 Delivery Schedule</span>
              <p className="font-medium text-slate-800 mt-0.5">{quotation.deliveryTerms || 'Within 4 weeks from the date of receipt of approved drawing.'}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">3.4 Warranty &amp; Guarantee</span>
              <p className="font-medium text-slate-800 mt-0.5">{quotation.warrantyTerms || '18 Months from the date of dispatch or 12 Months from commissioning, whichever is earlier.'}</p>
            </div>
          </div>
        </div>

        {/* Sign-off */}
        <div className="border-t-2 border-dashed border-slate-300 pt-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
            <span className="text-slate-500 italic">
              Commercial proposal certified by Sky Power Switchgears, Salem, Tamil Nadu.
            </span>
            <div className="text-right">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-3">
                FOR SKY POWER SWITCHGEARS
              </span>
              <div className="h-0.5 w-48 bg-slate-400 ml-auto mb-1" />
              <span className="font-bold text-slate-900 block">Authorized Signatory</span>
              <span className="font-mono text-[11px] text-slate-500 block">Mobile: +91 6380301817</span>
            </div>
          </div>
        </div>

        {/* Official Salem Letterhead Footer */}
        <div className="border-t border-slate-300 pt-6 mt-8 text-center text-xs text-slate-500">
          <p className="font-extrabold uppercase tracking-wider text-slate-800 text-sm">SKY POWER SWITCHGEARS</p>
          <p className="font-semibold text-slate-600 mt-1">
            3/97D, Sarkarkollapatty, Paaraivattam, Salem-636030. Tamil Nadu.
          </p>
          <p className="font-mono text-[11px] text-slate-500 mt-0.5">
            GST No: 33AFCFS0165B1ZL • Mobile: 8667033968 / 7904209057 / 6381185644 • Email: sales.skypower@gmail.com
          </p>
        </div>
      </div>

      {/* Revise Modal */}
      {showReviseModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900">
              Revise Quotation (Generates Version #{quotation.version + 1})
            </h3>
            <p className="text-xs text-slate-600">
              Previous version ({quotation.formattedQuotationNumber}) will be marked as Superseded and permanently preserved.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason / Client Modification Request *
              </label>
              <textarea
                rows={3}
                value={revisionRemarks}
                onChange={(e) => setRevisionRemarks(e.target.value)}
                placeholder="e.g. Revised pricing based on client commercial negotiations. Reduced discount..."
                className="w-full p-2.5 text-xs border border-slate-300 rounded focus:border-blue-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Adjust Special Discount Amount (₹)
              </label>
              <input
                type="number"
                min={0}
                value={discountTotal}
                onChange={(e) => setDiscountTotal(e.target.value)}
                className="w-full p-2 text-xs border border-slate-300 rounded font-mono font-bold"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowReviseModal(false)}
                className="px-3 py-1.5 border border-slate-300 rounded text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={revising}
                onClick={handleExecuteRevision}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold"
              >
                {revising ? 'Issuing Revision...' : 'Confirm & Generate Revised Offer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
