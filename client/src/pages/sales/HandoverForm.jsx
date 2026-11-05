import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { Sparkles, ArrowLeft, CheckCircle2, AlertCircle, Building2, FileCheck } from 'lucide-react';

export const HandoverForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [enquiry, setEnquiry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    poReference: '',
    poDate: new Date().toISOString().split('T')[0],
    poValue: 0,
    targetDepartment: 'R&D / Design Department',
    handoverNotes: 'Client accepted commercial quotation. Please proceed with General Arrangement (GA) drawing and single line diagram clearance for manufacturing.'
  });

  useEffect(() => {
    const fetchEnquiry = async () => {
      try {
        const res = await api.get(`/enquiries/${id}`);
        if (res.success && res.enquiry) {
          setEnquiry(res.enquiry);
          setFormData((prev) => ({
            ...prev,
            poValue: res.enquiry.expectedProjectValue || 0
          }));
        }
      } catch (err) {
        setError('Failed to load enquiry data.');
      } finally {
        setLoading(false);
      }
    };
    fetchEnquiry();
  }, [id]);

  const handleSubmitHandover = async (e) => {
    e.preventDefault();
    if (!formData.poReference.trim()) {
      setError('Purchase Order / LOI Reference Number is mandatory.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/enquiries/${id}/handover`, formData);
      navigate(`/enquiries/${id}`);
    } catch (err) {
      setError(err.message || 'Handover submission failed.');
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

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center space-x-3">
          <Link to={`/enquiries/${id}`} className="text-slate-400 hover:text-slate-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Order Confirmation & Engineering Handover Package
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Formally close the sales cycle (Won) and hand over technical package to R&D / Design Module.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Overview Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Enquiry Reference</span>
          <p className="font-mono font-bold text-blue-900 text-sm">{enquiry?.ern}</p>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Client Company</span>
          <p className="font-bold text-slate-900">{enquiry?.clientId?.companyName}</p>
        </div>
        <div className="sm:col-span-2">
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Project Title</span>
          <p className="font-semibold text-slate-800">{enquiry?.project?.projectName}</p>
        </div>
      </div>

      {/* Handover Form */}
      <form onSubmit={handleSubmitHandover} className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs space-y-5">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
          Client Purchase Order & Handover Specifications
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Purchase Order (PO) / LOI Number <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.poReference}
              onChange={(e) => setFormData({ ...formData, poReference: e.target.value })}
              placeholder="e.g. PO/LNT/2026/9821"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded font-mono font-bold outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Purchase Order Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              required
              value={formData.poDate}
              onChange={(e) => setFormData({ ...formData, poDate: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Confirmed Order Value (₹) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min={0}
              required
              value={formData.poValue}
              onChange={(e) => setFormData({ ...formData, poValue: Number(e.target.value) })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded font-mono font-bold outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Target Module for Handover
            </label>
            <input
              type="text"
              readOnly
              value={formData.targetDepartment}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded bg-slate-50 font-semibold text-slate-800"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Engineering Handover Directives & Instructions
            </label>
            <textarea
              rows={3}
              value={formData.handoverNotes}
              onChange={(e) => setFormData({ ...formData, handoverNotes: e.target.value })}
              className="w-full p-2.5 text-xs border border-slate-300 rounded outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
          <Link
            to={`/enquiries/${id}`}
            className="px-4 py-2 border border-slate-300 rounded text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center px-5 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded text-xs font-bold shadow-xs transition-colors"
          >
            <Sparkles className="w-4 h-4 mr-1.5" />
            {submitting ? 'Transmitting Handover...' : 'Confirm Order & Execute R&D Handover'}
          </button>
        </div>
      </form>
    </div>
  );
};

