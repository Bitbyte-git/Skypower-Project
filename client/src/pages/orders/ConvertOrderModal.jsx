import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import {
  FileCheck2,
  X,
  Building2,
  Calendar,
  IndianRupee,
  Upload,
  AlertCircle,
  FileText,
  Clock,
  Check
} from 'lucide-react';

export const ConvertOrderModal = ({ quotation, onClose, onSuccess }) => {
  const navigate = useNavigate();

  const client = quotation?.clientId || {};
  const netPayable = quotation?.netPayableAmount || quotation?.productPricing?.reduce((acc, p) => acc + (p.netAmount || 0), 0) || 0;

  const [poNumber, setPoNumber] = useState('');
  const [poDate, setPoDate] = useState(new Date().toISOString().split('T')[0]);
  const [poReceivedDate, setPoReceivedDate] = useState(new Date().toISOString().split('T')[0]);
  const [poValue, setPoValue] = useState(netPayable);
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(
    new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [paymentTerms, setPaymentTerms] = useState(quotation?.paymentTerms || '30% Advance with PO, 70% against PI prior to dispatch');
  const [deliveryTerms, setDeliveryTerms] = useState(quotation?.deliveryTerms || '10 to 12 weeks from technically & commercially clear PO');
  const [warrantyTerms, setWarrantyTerms] = useState(quotation?.warrantyTerms || '18 months from supply or 12 months from commissioning');
  const [customerRemarks, setCustomerRemarks] = useState('');
  const [internalRemarks, setInternalRemarks] = useState('');
  const [poFile, setPoFile] = useState(null);
  const [poFileName, setPoFileName] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPoFile(file);
      setPoFileName(file.name);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!poNumber.trim()) {
      setError('Customer Purchase Order (PO) Number is required.');
      return;
    }
    if (!poValue || Number(poValue) <= 0) {
      setError('Please provide a valid PO Value.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      // If a file was selected, create data URL or upload filename
      let documentUrl = '';
      if (poFile) {
        documentUrl = `/uploads/${poFileName || 'customer-po.pdf'}`;
      }

      const payload = {
        quotationId: quotation._id,
        poNumber: poNumber.trim(),
        poDate,
        poReceivedDate,
        poValue: Number(poValue),
        poCurrency: 'INR',
        expectedDeliveryDate,
        paymentTerms,
        deliveryTerms,
        warrantyTerms,
        customerRemarks,
        internalRemarks,
        documentUrl
      };

      const res = await api.post('/orders/from-quotation', payload);
      if (res.success && res.order) {
        if (onSuccess) onSuccess(res.order);
        onClose();
        navigate(`/orders/${res.order._id}`);
      } else {
        setError(res.message || 'Failed to create sales order.');
      }
    } catch (err) {
      setError(err.message || 'Error converting quotation to order.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-900 to-indigo-900 text-white">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <FileCheck2 className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight">Convert to Customer Sales Order</h2>
              <p className="text-xs text-blue-200">
                Quotation: <span className="font-mono font-bold text-white">{quotation?.formattedQuotationNumber || quotation?.quotationNumber}</span> (Rev #{quotation?.version || 1})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Customer & Project Preview (Read-only from Quotation) */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400 font-medium block">Customer / Client</span>
              <span className="text-slate-900 font-bold flex items-center mt-0.5">
                <Building2 className="w-3.5 h-3.5 text-blue-600 mr-1" />
                {client?.companyName || quotation?.clientName || 'N/A'}
              </span>
              <span className="text-slate-500 text-[11px] block">{client?.contactPersonName} • {client?.email}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">Project / End User</span>
              <span className="text-slate-900 font-bold block mt-0.5">
                {quotation?.enquiryId?.projectTitle || quotation?.projectTitle || 'Switchgear Project'}
              </span>
              <span className="text-slate-500 text-[11px] block">
                End User: {quotation?.enquiryId?.endUser || client?.endUser || 'Direct'}
              </span>
            </div>
          </div>

          {/* Customer PO Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Customer PO Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                placeholder="e.g. PO-LT-2026-904"
                className="w-full px-3 py-2 text-xs font-mono font-bold bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Customer PO Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={poDate}
                onChange={(e) => setPoDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                PO Value (₹ Incl. Taxes) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-xs font-bold">₹</span>
                <input
                  type="number"
                  step="any"
                  required
                  value={poValue}
                  onChange={(e) => setPoValue(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 text-xs font-mono font-bold bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Quotation Total: ₹{netPayable.toLocaleString('en-IN')}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Expected Delivery Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={expectedDeliveryDate}
                onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900"
              />
            </div>
          </div>

          {/* Terms & Conditions */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Payment Terms</label>
              <input
                type="text"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Delivery Terms</label>
                <input
                  type="text"
                  value={deliveryTerms}
                  onChange={(e) => setDeliveryTerms(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Warranty Terms</label>
                <input
                  type="text"
                  value={warrantyTerms}
                  onChange={(e) => setWarrantyTerms(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* File Upload for PO PDF */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Upload Customer Purchase Order (PDF / Scan)
            </label>
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-blue-400 transition-colors bg-slate-50/50">
              <input
                type="file"
                id="po-file-upload"
                accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="po-file-upload" className="cursor-pointer flex flex-col items-center justify-center space-y-1">
                <Upload className="w-6 h-6 text-slate-400" />
                <span className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                  {poFileName ? poFileName : 'Click to select PO PDF or scanned document'}
                </span>
                <span className="text-[10px] text-slate-400">PDF, JPG, PNG or Excel up to 25MB</span>
              </label>
            </div>
          </div>

          {/* Remarks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Customer Remarks</label>
              <textarea
                rows={2}
                value={customerRemarks}
                onChange={(e) => setCustomerRemarks(e.target.value)}
                placeholder="Special notes or dispatch instructions from customer..."
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Internal Notes</label>
              <textarea
                rows={2}
                value={internalRemarks}
                onChange={(e) => setInternalRemarks(e.target.value)}
                placeholder="Internal instructions for production / design team..."
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Generating Order...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-1.5 text-amber-300" />
                  Confirm & Create Sales Order
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
