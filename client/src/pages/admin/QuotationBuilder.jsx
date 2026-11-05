import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../../api/client';
import { numberToWords } from '../../utils/numberToWords';
import {
  FileText,
  Save,
  ArrowLeft,
  Building2,
  AlertCircle,
  CheckCircle2,
  IndianRupee,
  ShieldCheck,
  Download,
  Printer,
  Sparkles
} from 'lucide-react';

export const QuotationBuilder = () => {
  const [searchParams] = useSearchParams();
  const enquiryId = searchParams.get('enquiryId');
  const navigate = useNavigate();

  const [enquiry, setEnquiry] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const [formData, setFormData] = useState({
    enquiryId: enquiryId || '',
    validityDays: 7,
    productPricing: [],
    commercialTerms: 'Ex-Works: Salem, Tamil Nadu',
    paymentTerms: '50% as advance along with your valued purchase order and balance 50% against proforma Invoice after inspection and before dispatch.',
    deliveryTerms: 'Within 4 weeks from the date of receipt of approved drawing, our drawing will be submitted within three working days from the date of receipt of purchase order.',
    warrantyTerms: 'We offer a warranty period of 18 Months from the date of dispatch or 12 Months from the date of commissioning whichever is earlier',
    discountTotal: 0,
    freightAndInsurance: 0,
    taxRatePercent: 18
  });

  useEffect(() => {
    const fetchEnquiryForQuotation = async () => {
      if (!enquiryId) {
        setServerError('No approved enquiry specified for quotation generation.');
        setLoading(false);
        return;
      }

      try {
        const [enqRes, settingsRes] = await Promise.all([
          api.get(`/enquiries/${enquiryId}`),
          api.get('/settings')
        ]);

        if (enqRes.success && enqRes.enquiry) {
          const enq = enqRes.enquiry;
          if (enq.approvalStatus !== 'Approved') {
            setServerError(`Quotation generation prohibited: Enquiry ${enq.ern} is currently in '${enq.approvalStatus}' status. Only Approved enquiries are eligible.`);
            setLoading(false);
            return;
          }

          setEnquiry(enq);

          // Populate pricing line items from enquiry products
          const items = (enq.products || []).map((p) => {
            const unitRate = p.basicPrice || p.estimatedUnitValue || 315000;
            const qty = p.quantity || 1;
            return {
              productId: p._id,
              productName: p.productName || 'VCB Switchboard',
              productDescription: p.productDescription || '',
              voltageRating: p.voltageRating || p.kilovolt || '11 kV',
              currentRating: p.currentRating || p.ampere || '630 A',
              breakingCapacity: p.breakingCapacity || p.kiloampere || '25 kA',
              equipmentConfiguration: p.equipmentConfiguration || p.usage || 'Outdoor',
              quantity: qty,
              unit: p.unit || 'Nos',
              unitPrice: unitRate,
              discountPercent: 0,
              taxRatePercent: 18,
              netAmount: qty * unitRate
            };
          });

          setFormData((prev) => ({
            ...prev,
            productPricing: items,
            freightAndInsurance: enq.commercialPricing?.transportPrice || 0,
            commercialTerms: enq.commercialPricing?.priceBasis || 'Ex-Works: Salem, Tamil Nadu'
          }));
        }

        if (settingsRes.success) setSettings(settingsRes.settings);
      } catch (err) {
        setServerError('Failed to load enquiry data for quotation generation.');
      } finally {
        setLoading(false);
      }
    };

    fetchEnquiryForQuotation();
  }, [enquiryId]);

  const handlePriceChange = (index, field, value) => {
    const updated = [...formData.productPricing];
    const item = { ...updated[index], [field]: value };

    const qty = field === 'quantity' ? Number(value) : Number(item.quantity);
    const rate = field === 'unitPrice' ? Number(value) : Number(item.unitPrice);
    const disc = field === 'discountPercent' ? Number(value) : Number(item.discountPercent);

    const gross = qty * rate;
    const discountAmount = gross * (disc / 100);
    item.netAmount = Math.round(gross - discountAmount);

    updated[index] = item;
    setFormData((prev) => ({ ...prev, productPricing: updated }));
  };

  // Calculations
  const subTotal = formData.productPricing.reduce((sum, item) => sum + Number(item.netAmount || 0), 0);
  const netTaxable = Math.max(0, subTotal - Number(formData.discountTotal || 0) + Number(formData.freightAndInsurance || 0));
  const taxAmount = Math.round(netTaxable * (Number(formData.taxRatePercent || 18) / 100));
  const finalValue = Math.round(netTaxable + taxAmount);

  const handleFillSampleCommercialTerms = () => {
    setFormData((prev) => ({
      ...prev,
      validityDays: 7,
      taxRatePercent: 18,
      commercialTerms: 'Ex-Works: Salem, Tamil Nadu',
      paymentTerms: '50% as advance along with your valued purchase order and balance 50% against proforma Invoice after inspection and before dispatch.',
      deliveryTerms: 'Within 4 weeks from the date of receipt of approved drawing, our drawing will be submitted within three working days from the date of receipt of purchase order.',
      warrantyTerms: 'We offer a warranty period of 18 Months from the date of dispatch or 12 Months from the date of commissioning whichever is earlier'
    }));
  };

  const handleGenerateQuotation = async (e) => {
    e.preventDefault();
    setServerError('');
    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        productPricing: formData.productPricing
      };
      const res = await api.post('/quotations', payload);
      navigate(`/quotations/${res.quotation._id}`);
    } catch (err) {
      setServerError(err.message || 'Failed to generate quotation.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (serverError && !enquiry) {
    return (
      <div className="max-w-2xl mx-auto bg-white border border-rose-200 rounded-lg p-6 shadow-sm text-center space-y-3">
        <AlertCircle className="w-10 h-10 text-rose-600 mx-auto" />
        <h2 className="text-base font-bold text-slate-900">Quotation Generation Blocked</h2>
        <p className="text-xs text-rose-700">{serverError}</p>
        <Link
          to="/enquiries"
          className="inline-block px-4 py-2 bg-blue-600 text-white rounded text-xs font-semibold mt-2"
        >
          Return to Enquiries Pipeline
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-24">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center space-x-3">
          <Link to={`/enquiries/${enquiry?._id}`} className="text-slate-400 hover:text-[#1E5BB8] transition-colors p-1 rounded-md hover:bg-slate-50">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-[#1E5BB8] bg-[#F0F5FD] px-2 py-0.5 rounded border border-[#D0E1F9]">
                FORM SG-QT-01
              </span>
              <h1 className="text-sm font-bold text-[#1E3A5F] uppercase tracking-wide">
                Quotation Builder
              </h1>
            </div>
            <p className="text-[11px] text-slate-400">Commercial Tender Offer Generation</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleFillSampleCommercialTerms}
            className="inline-flex items-center px-3.5 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white shadow-xs transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-300" />
            ⚡ Auto-Fill Commercial Terms
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center px-3 py-1.5 border border-slate-200 text-xs font-semibold rounded-lg bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 shadow-2xs self-start sm:self-auto transition-all hover:-translate-y-0.5"
          >
            <Printer className="w-3.5 h-3.5 mr-1 text-slate-400" /> Print Draft
          </button>
        </div>
      </div>

      {serverError && (
        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2 shadow-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span className="font-semibold">{serverError}</span>
        </div>
      )}

      {/* =========================================================================
          AUTHENTIC PAPER QUOTATION SHEET
      ========================================================================= */}
      <form onSubmit={handleGenerateQuotation} className="paper-sheet p-8 sm:p-12 text-slate-900 bg-white border border-slate-200/90 rounded-2xl shadow-sm">
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
                GSTIN: 33AFCFS0165B1ZL • Works: 3/97D, Sarkarkollapatty, Paaraivattam, Salem - 636030, Tamil Nadu
              </p>
            </div>

            {/* Official Offer Specification Box (Cleanly Stacked, Zero Collision) */}
            <div className="flex flex-col items-start md:items-end space-y-2 shrink-0">
              <div className="stamp-badge stamp-approved text-xs">
                ADMIN COMMERCIAL OFFER
              </div>

              <div className="border border-slate-300 p-4 rounded-xl bg-slate-50/90 text-left md:text-right min-w-[230px] shadow-2xs">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block">
                  Commercial Offer Reference
                </span>
                <span className="text-base font-black font-mono text-emerald-700 block mt-0.5">
                  QT-2026-XXXX-V1
                </span>
                <span className="text-xs font-mono text-[#1E5BB8] block mt-0.5">
                  Against ERN: <strong>{enquiry?.ern}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 1.0 Client & Offer Metadata */}
        <div className="mb-8">
          <div className="form-section-title">1.0 Commercial Client Profile & Validity Terms</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border border-slate-200 rounded p-4 bg-slate-50/40 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Client Legal Entity</span>
              <p className="font-bold text-slate-900 text-sm">{enquiry?.clientId?.companyName}</p>
              <p className="text-slate-500">{enquiry?.clientId?.clientLocation}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Substation Project</span>
              <p className="font-bold text-slate-800">{enquiry?.project?.projectName}</p>
              <p className="text-slate-500">{enquiry?.project?.projectLocation}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Offer Validity Duration</span>
              <div className="flex items-center space-x-2 mt-1">
                <input
                  type="number"
                  min={7}
                  max={180}
                  value={formData.validityDays}
                  onChange={(e) => setFormData({ ...formData, validityDays: Number(e.target.value) })}
                  className="w-20 px-2 py-1 text-xs border border-slate-300 rounded font-bold text-center bg-white"
                />
                <span className="text-xs text-slate-700 font-semibold">Days from issue</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2.0 Itemized Commercial Matrix */}
        <div className="mb-8">
          <div className="form-section-title flex items-center justify-between">
            <span>2.0 Equipment Pricing & Commercial Discount Schedule</span>
            <span className="text-[10px] font-mono text-slate-500">{formData.productPricing.length} Items</span>
          </div>

          <div className="border border-slate-300 rounded overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Equipment Item Description</th>
                  <th className="py-2.5 px-3">Rating</th>
                  <th className="py-2.5 px-3">Qty</th>
                  <th className="py-2.5 px-3">Base Unit Rate (₹)</th>
                  <th className="py-2.5 px-3">Disc %</th>
                  <th className="py-2.5 px-3 text-right">Net Value (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {formData.productPricing.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-bold text-slate-400">{idx + 1}</td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900">{item.productName}</div>
                      <div className="text-[10px] text-slate-500">{item.productDescription}</div>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-700">
                      {[item.voltageRating, item.breakingCapacity].filter(Boolean).join(' | ') || '-'}
                    </td>
                    <td className="py-2.5 px-3 font-bold">{item.quantity} {item.unit}</td>
                    <td className="py-2.5 px-3">
                      <input
                        type="number"
                        min={0}
                        value={item.unitPrice}
                        onChange={(e) => handlePriceChange(idx, 'unitPrice', e.target.value)}
                        className="w-28 px-2 py-1 border border-slate-300 rounded font-mono font-bold bg-white"
                      />
                    </td>
                    <td className="py-2.5 px-3">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={item.discountPercent}
                        onChange={(e) => handlePriceChange(idx, 'discountPercent', e.target.value)}
                        className="w-16 px-1.5 py-1 border border-slate-300 rounded font-bold text-center bg-white"
                      />
                    </td>
                    <td className="py-2.5 px-3 font-mono font-black text-slate-900 text-right">
                      ₹ {Number(item.netAmount || 0).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Ledger Calculation Tally */}
          <div className="mt-3 p-4 bg-slate-50 border border-slate-300 rounded flex flex-col items-end space-y-1.5 text-xs">
            <div className="flex justify-between w-72 text-slate-700">
              <span className="font-semibold">Subtotal Gross:</span>
              <span className="font-mono font-bold">₹ {subTotal.toLocaleString('en-IN')}</span>
            </div>

            <div className="flex justify-between w-72 items-center text-slate-700">
              <span className="font-semibold">Overall Commercial Discount (₹):</span>
              <input
                type="number"
                min={0}
                value={formData.discountTotal}
                onChange={(e) => setFormData({ ...formData, discountTotal: Number(e.target.value) })}
                className="w-24 px-2 py-0.5 border border-slate-300 rounded text-right font-mono font-bold bg-white"
              />
            </div>

            <div className="flex justify-between w-72 items-center text-slate-700">
              <span className="font-semibold">Applicable Statutory GST (%):</span>
              <input
                type="number"
                min={0}
                value={formData.taxRatePercent}
                onChange={(e) => setFormData({ ...formData, taxRatePercent: Number(e.target.value) })}
                className="w-24 px-2 py-0.5 border border-slate-300 rounded text-right font-mono font-bold bg-white"
              />
            </div>

            <div className="flex justify-between w-72 text-slate-700">
              <span className="font-semibold">GST Amount ({formData.taxRatePercent}%):</span>
              <span className="font-mono font-bold">₹ {taxAmount.toLocaleString('en-IN')}</span>
            </div>

            <div className="pt-2 border-t-2 border-slate-400 flex justify-between w-80 text-sm font-black text-slate-950">
              <span className="uppercase tracking-wider">Final Quotation Value:</span>
              <span className="font-mono text-emerald-800 text-base">₹ {finalValue.toLocaleString('en-IN')}</span>
            </div>

            <div className="pt-2 text-[11px] font-bold text-slate-600 border-t border-dashed border-slate-200 w-80 text-right">
              <span className="text-[9px] uppercase tracking-wider text-slate-400 block mb-0.5">Amount in Words:</span>
              <span className="italic text-slate-800">{finalAmountInWords}</span>
            </div>
          </div>
        </div>

        {/* 3.0 Commercial Terms */}
        <div className="mb-8">
          <div className="form-section-title">3.0 Commercial & Statutory Terms</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-800 mb-1">3.1 Price Basis</label>
              <textarea
                rows={2}
                value={formData.commercialTerms}
                onChange={(e) => setFormData({ ...formData, commercialTerms: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-800 mb-1">3.2 Payment Terms</label>
              <textarea
                rows={2}
                value={formData.paymentTerms}
                onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-800 mb-1">3.3 Delivery Schedule</label>
              <textarea
                rows={2}
                value={formData.deliveryTerms}
                onChange={(e) => setFormData({ ...formData, deliveryTerms: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-800 mb-1">3.4 Warranty & Guarantee</label>
              <textarea
                rows={2}
                value={formData.warrantyTerms}
                onChange={(e) => setFormData({ ...formData, warrantyTerms: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded font-medium"
              />
            </div>
          </div>
        </div>

        {/* 4.0 Sign-off Box */}
        <div className="border-t-2 border-dashed border-slate-300 pt-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
            <span className="text-slate-500 italic">
              Official Techno-Commercial Offer issued by Sky Power Switchgears, Salem.
            </span>
            <div className="text-right">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-4">
                FOR SKY POWER SWITCHGEARS / AUTHORIZED SIGNATORY
              </span>
              <div className="h-0.5 w-48 bg-slate-400 ml-auto mb-1" />
              <span className="font-bold text-slate-900 block">Authorized Signatory • Mob: +91 6380301817</span>
            </div>
          </div>
        </div>

        {/* Floating Action Submit */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#111827] text-white border-t border-slate-800 py-3.5 px-6 shadow-2xl">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Total Quotation Offer Value (Inc. Taxes):
              </span>
              <span className="text-lg font-black font-mono text-emerald-400">
                ₹ {finalValue.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex items-center space-x-3">
              <Link
                to={`/enquiries/${enquiry?._id}`}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-bold border border-slate-600"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-black tracking-wide shadow-md transition-colors flex items-center"
              >
                <FileText className="w-4 h-4 mr-1.5" />
                {submitting ? 'Generating Quotation & PDF...' : 'Finalize & Issue Quotation (with PDF)'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
