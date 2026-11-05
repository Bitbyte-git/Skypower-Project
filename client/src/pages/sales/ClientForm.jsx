import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../../api/client';
import { Building2, Save, ArrowLeft, AlertCircle, CheckCircle2, ShieldCheck, Printer, Sparkles, Hash } from 'lucide-react';

export const ClientForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    clientId: '',
    companyName: '',
    customerType: 'Contractor', // Contractor or End User
    contactPerson: '', // Name (max 50 chars)
    mobile: '', // 10-digit Contact No
    email: '', // Email ID (lowercase, max 30 chars)
    siteAddress: '', // Site Address (max 250 chars)
    clientLocation: '',
    gstNumber: ''
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  // 1-Click Auto-Fill Sample Client matching Image 1
  const fillSampleClientData = () => {
    setFormData({
      clientId: 'CL-2026-0001',
      companyName: 'Sivili Engineering Construction',
      customerType: 'Contractor',
      contactPerson: 'S. Sivakumar (Chief Electrical Engineer)',
      mobile: '9840198401',
      email: 'sivili.engg@gmail.com',
      siteAddress: 'Plot 14, SIPCOT Industrial Park, Kancheepuram, Tamil Nadu - 631501',
      clientLocation: 'Kancheepuram, Tamil Nadu',
      gstNumber: '33AAACL0140P1ZX'
    });
    setErrors({});
    setServerError('');
  };

  useEffect(() => {
    const fetchClient = async () => {
      if (isEdit) {
        try {
          const res = await api.get(`/clients/${id}`);
          if (res.success && res.client) {
            setFormData({
              clientId: res.client.clientId || '',
              companyName: res.client.companyName || '',
              customerType: res.client.customerType || 'Contractor',
              contactPerson: res.client.contactPerson || '',
              mobile: res.client.mobile || '',
              email: res.client.email || '',
              siteAddress: res.client.siteAddress || res.client.billingAddress?.street || '',
              clientLocation: res.client.clientLocation || '',
              gstNumber: res.client.gstNumber || ''
            });
          }
        } catch (err) {
          setServerError('Failed to retrieve client profile.');
        }
      }
    };
    fetchClient();
  }, [id, isEdit]);

  const validateClientInput = () => {
    const newErrors = {};

    // 1. Company Name (Mandatory)
    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company Name is mandatory.';
    }

    // 2. Contractor or End User (Mandatory)
    if (!formData.customerType) {
      newErrors.customerType = 'Please select Contractor or End User.';
    }

    // 3. Name (Contact Person: max 50 chars, Mandatory)
    if (!formData.contactPerson.trim()) {
      newErrors.contactPerson = 'Contact Person Name is mandatory.';
    } else if (formData.contactPerson.trim().length > 50) {
      newErrors.contactPerson = 'Contact Person Name cannot exceed 50 characters.';
    }

    // 4. Contact NO (Mandatory 10 digits)
    if (!formData.mobile.trim()) {
      newErrors.mobile = 'Contact Number is mandatory.';
    } else if (!/^[0-9]{10}$/.test(formData.mobile.trim())) {
      newErrors.mobile = 'Contact Number must be exactly 10 numeric digits.';
    }

    // 5. Email ID (Optional, max 30 chars, lowercase)
    if (formData.email.trim()) {
      if (formData.email.trim().length > 30) {
        newErrors.email = 'Email ID cannot exceed 30 characters.';
      } else if (!/^\S+@\S+\.\S+$/.test(formData.email.trim())) {
        newErrors.email = 'Please enter a valid email address.';
      }
    }

    // 6. Site Address (Optional, max 250 chars)
    if (formData.siteAddress && formData.siteAddress.length > 250) {
      newErrors.siteAddress = 'Site Address cannot exceed 250 characters.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validateClientInput()) {
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        email: formData.email.trim().toLowerCase(),
        clientLocation: formData.clientLocation.trim() || formData.siteAddress.trim() || 'Salem, Tamil Nadu'
      };

      if (isEdit) {
        await api.put(`/clients/${id}`, payload);
        navigate(`/clients/${id}`);
      } else {
        const res = await api.post('/clients', payload);
        navigate(`/clients/${res.client._id}`);
      }
    } catch (err) {
      setServerError(err.message || 'Client registration failed. Please verify entered data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Top Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center space-x-3">
          <Link to="/clients" className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-50">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-[#1E5BB8] bg-[#F0F5FD] px-2.5 py-0.5 rounded border border-[#D0E1F9]">
                FORM SG-CL-01
              </span>
              <h1 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                {isEdit ? 'Client Master Modification' : 'New Client Registration Form'}
              </h1>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Commercial KYC &amp; Technical Master Entry</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {!isEdit && (
            <button
              type="button"
              onClick={fillSampleClientData}
              className="inline-flex items-center px-3.5 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white shadow-xs transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-300" />
              ⚡ Auto-Fill Sample Client
            </button>
          )}

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center px-3 py-1.5 border border-slate-300 text-xs font-semibold rounded-xl bg-white text-slate-700 hover:bg-slate-50 shadow-2xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 mr-1 text-slate-500" /> Print
          </button>
        </div>
      </div>

      {serverError && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs flex items-center space-x-2 shadow-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span className="font-semibold">{serverError}</span>
        </div>
      )}

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="paper-sheet p-8 md:p-10 text-slate-900 space-y-7 shadow-sm">
        {/* Paper Header */}
        <div className="paper-header pb-5 border-b border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0 shadow-2xs">
                <img src="/brand-logo.jpg" alt="Sky Power Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h2 className="text-base font-black tracking-tight flex items-center text-[#1E3A5F]">
                  <span className="text-[#1E5BB8]">SKY</span>
                  <span className="text-[#EE6F2D] ml-1.5">POWER</span>
                  <span className="text-slate-400 font-normal text-xs ml-2">SWITCHGEARS</span>
                </h2>
                <p className="text-[11px] text-[#1E3A5F] font-semibold">
                  HT/LT Switchgear &amp; Substation Engineering • Salem Works
                </p>
              </div>
            </div>

            <div className="border border-slate-300 p-3 rounded-xl bg-slate-50/80 text-right min-w-[200px]">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
                Official Client Identifier
              </span>
              <span className="text-sm font-black font-mono text-[#1E5BB8] block mt-0.5">
                {formData.clientId || '[AUTO-GENERATED ON SUBMIT]'}
              </span>
            </div>
          </div>
        </div>

        {/* 1. Mandatory Fields */}
        <div className="space-y-4">
          <div className="form-section-title flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#1E5BB8]" />
            <span>1.0 Mandatory Client Details</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 1. Company Name */}
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wide mb-1">
                1. Company Name <span className="text-rose-600 font-black">*</span>
              </label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="e.g. Sivili Engineering Construction"
                className={`w-full px-3 py-2 text-xs border rounded-xl outline-none font-bold text-slate-900 ${
                  errors.companyName ? 'border-rose-500 bg-rose-50/20' : 'border-slate-300 focus:border-[#1E5BB8]'
                }`}
              />
              {errors.companyName && <p className="text-[10px] text-rose-600 mt-1 font-bold">{errors.companyName}</p>}
            </div>

            {/* 2. Contractor or End User */}
            <div>
              <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wide mb-1">
                2. Contractor or End User <span className="text-rose-600 font-black">*</span>
              </label>
              <select
                value={formData.customerType}
                onChange={(e) => setFormData({ ...formData, customerType: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white text-slate-800 font-bold focus:border-[#1E5BB8] outline-none"
              >
                <option value="Contractor">Contractor</option>
                <option value="End User">End User</option>
              </select>
              {errors.customerType && <p className="text-[10px] text-rose-600 mt-1 font-bold">{errors.customerType}</p>}
            </div>

            {/* 3. Name (Contact Person - 50 Char) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wide">
                  3. Contact Person Name <span className="text-rose-600 font-black">*</span>
                </label>
                <span className="text-[10px] font-mono text-slate-400">
                  {formData.contactPerson.length}/50
                </span>
              </div>
              <input
                type="text"
                maxLength={50}
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                placeholder="e.g. S. Sivakumar (Chief Electrical Engineer)"
                className={`w-full px-3 py-2 text-xs border rounded-xl outline-none font-medium text-slate-900 ${
                  errors.contactPerson ? 'border-rose-500 bg-rose-50/20' : 'border-slate-300 focus:border-[#1E5BB8]'
                }`}
              />
              {errors.contactPerson && <p className="text-[10px] text-rose-600 mt-1 font-bold">{errors.contactPerson}</p>}
            </div>

            {/* 4. Contact NO (10 Digits) */}
            <div>
              <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wide mb-1">
                4. Contact No (10-Digit Mobile) <span className="text-rose-600 font-black">*</span>
              </label>
              <input
                type="text"
                maxLength={10}
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value.replace(/[^0-9]/g, '') })}
                placeholder="9840198401"
                className={`w-full px-3 py-2 text-xs border font-mono rounded-xl outline-none font-black text-[#1E5BB8] tracking-wider ${
                  errors.mobile ? 'border-rose-500 bg-rose-50/20' : 'border-slate-300 focus:border-[#1E5BB8]'
                }`}
              />
              <span className="text-[9px] text-slate-400 mt-0.5 block font-mono">Numeric digits only (e.g. 9840198401).</span>
              {errors.mobile && <p className="text-[10px] text-rose-600 mt-1 font-bold">{errors.mobile}</p>}
            </div>

            {/* GSTIN (Optional) */}
            <div>
              <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wide mb-1">
                Corporate GSTIN (Optional)
              </label>
              <input
                type="text"
                maxLength={15}
                value={formData.gstNumber}
                onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value.toUpperCase() })}
                placeholder="33AAACL0140P1ZX"
                className="w-full px-3 py-2 text-xs border border-slate-300 font-mono rounded-xl outline-none font-bold uppercase focus:border-[#1E5BB8]"
              />
            </div>
          </div>
        </div>

        {/* 2. Optional Fields */}
        <div className="space-y-4 pt-2 border-t border-slate-200">
          <div className="form-section-title flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <span>2.0 Optional Information</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 5. Email ID */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wide">
                  5. Email ID (Optional)
                </label>
                <span className="text-[10px] font-mono text-slate-400">
                  {formData.email.length}/30
                </span>
              </div>
              <input
                type="email"
                maxLength={30}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value.toLowerCase() })}
                placeholder="sivili.engg@gmail.com"
                className={`w-full px-3 py-2 text-xs border rounded-xl outline-none lowercase ${
                  errors.email ? 'border-rose-500 bg-rose-50/20' : 'border-slate-300 focus:border-[#1E5BB8]'
                }`}
              />
              <span className="text-[9px] text-slate-400 mt-0.5 block font-mono">Lowercase, max 30 characters.</span>
              {errors.email && <p className="text-[10px] text-rose-600 mt-1 font-bold">{errors.email}</p>}
            </div>

            {/* City / State Location */}
            <div>
              <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wide mb-1">
                Client Location (City / State)
              </label>
              <input
                type="text"
                value={formData.clientLocation}
                onChange={(e) => setFormData({ ...formData, clientLocation: e.target.value })}
                placeholder="Kancheepuram, Tamil Nadu"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl outline-none focus:border-[#1E5BB8]"
              />
            </div>

            {/* 6. Site Address */}
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wide">
                  6. Site Address (Optional)
                </label>
                <span className="text-[10px] font-mono text-slate-400">
                  {formData.siteAddress.length}/250
                </span>
              </div>
              <textarea
                rows={3}
                maxLength={250}
                value={formData.siteAddress}
                onChange={(e) => setFormData({ ...formData, siteAddress: e.target.value })}
                placeholder="Plot 14, SIPCOT Industrial Park, Kancheepuram, Tamil Nadu - 631501"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl outline-none focus:border-[#1E5BB8]"
              />
              <span className="text-[9px] text-slate-400 mt-0.5 block font-mono">
                Used to determine state taxation (CGST 9% + SGST 9% within TN vs IGST 18% interstate).
              </span>
              {errors.siteAddress && <p className="text-[10px] text-rose-600 mt-1 font-bold">{errors.siteAddress}</p>}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-5 border-t border-slate-200">
          <Link
            to="/clients"
            className="px-4 py-2 border border-slate-300 text-xs font-bold rounded-xl text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-6 py-2.5 btn-primary text-white text-xs font-extrabold rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Save className="w-4 h-4 mr-1.5" />
            {loading ? 'Saving Client Master...' : isEdit ? 'Update Client Record' : 'Register New Client'}
          </button>
        </div>
      </form>
    </div>
  );
};
