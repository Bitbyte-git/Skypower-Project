import React, { useState, useEffect } from 'react';
import { useWorkflow } from '../../../context/WorkflowContext';
import api from '../../../api/client';
import { Building2, Search, UserCheck, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

export const Step1ClientRegister = () => {
  const {
    clientMode,
    setClientMode,
    client,
    setClient,
    submitStep1Client,
    saving,
    error,
    setError
  } = useWorkflow();

  const [formValues, setFormValues] = useState({
    companyName: client.companyName || '',
    customerType: client.customerType || 'Contractor',
    contactPerson: client.contactPerson || '',
    mobile: client.mobile || '',
    email: client.email || '',
    siteAddress: client.siteAddress || ''
  });

  const [formErrors, setFormErrors] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedExistingClient, setSelectedExistingClient] = useState(clientMode === 'existing' && client.clientId ? client : null);

  // Sync state if client was previously set
  useEffect(() => {
    if (client.companyName) {
      setFormValues({
        companyName: client.companyName,
        customerType: client.customerType || 'Contractor',
        contactPerson: client.contactPerson || '',
        mobile: client.mobile || '',
        email: client.email || '',
        siteAddress: client.siteAddress || ''
      });
    }
    if (client.clientId && clientMode === 'existing') {
      setSelectedExistingClient(client);
    }
  }, [client, clientMode]);

  // Search existing clients
  useEffect(() => {
    if (clientMode !== 'existing') return;

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.get(`/workflow/clients/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.success) {
          setSearchResults(res.clients || []);
        }
      } catch (err) {
        console.error('Client search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, clientMode]);

  const validateNewClient = () => {
    const errs = {};
    if (!formValues.companyName.trim()) {
      errs.companyName = 'Company Name is required.';
    }
    if (!formValues.customerType) {
      errs.customerType = 'Customer Type is required.';
    }
    if (!formValues.contactPerson.trim()) {
      errs.contactPerson = 'Contact Person Name is required.';
    } else if (formValues.contactPerson.trim().length > 50) {
      errs.contactPerson = 'Contact Person Name cannot exceed 50 characters.';
    }

    const cleanMobile = formValues.mobile.trim();
    if (!cleanMobile) {
      errs.mobile = 'Contact Number is required.';
    } else if (!/^[0-9]{10}$/.test(cleanMobile)) {
      errs.mobile = 'Contact Number must be exactly 10 digits.';
    }

    if (formValues.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formValues.email.trim())) {
      errs.email = 'Please enter a valid Email ID.';
    }

    if (formValues.siteAddress && formValues.siteAddress.length > 250) {
      errs.siteAddress = 'Site Address cannot exceed 250 characters.';
    }

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = async (e) => {
    e.preventDefault();
    setError('');

    if (clientMode === 'existing') {
      if (!selectedExistingClient) {
        setError('Please search and select an existing client to proceed.');
        return;
      }
      try {
        await submitStep1Client({
          isNewClient: false,
          clientId: selectedExistingClient._id || selectedExistingClient.clientId
        });
      } catch (err) {
        // error handled in context
      }
    } else {
      if (!validateNewClient()) {
        return;
      }
      try {
        await submitStep1Client({
          isNewClient: true,
          ...formValues
        });
      } catch (err) {
        // error handled in context
      }
    }
  };

  const handleSelectExisting = (c) => {
    setSelectedExistingClient(c);
    setClient({
      _id: c._id,
      clientId: c.clientId,
      companyName: c.companyName,
      customerType: c.customerType,
      contactPerson: c.contactPerson,
      mobile: c.mobile,
      email: c.email || '',
      siteAddress: c.siteAddress || ''
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200/90 overflow-hidden">
      {/* Card Header */}
      <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#FFF5EE] border border-[#FCDCC9] flex items-center justify-center text-[#EE6F2D]">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-[#0A1E3F] tracking-tight">Client Register</h2>
            <p className="text-xs text-slate-500 font-medium">Step 1: Identify client or create new enterprise account</p>
          </div>
        </div>

        {/* Client Mode Switch */}
        <div className="inline-flex p-1 rounded-lg bg-slate-200/80 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setClientMode('new');
              setError('');
            }}
            className={`px-4 py-1.5 rounded-md transition-all flex items-center space-x-1.5 cursor-pointer ${
              clientMode === 'new'
                ? 'bg-gradient-to-r from-[#EE6F2D] to-[#D95B1B] text-white shadow-xs font-extrabold'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <span>New Client</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setClientMode('existing');
              setError('');
            }}
            className={`px-4 py-1.5 rounded-md transition-all flex items-center space-x-1.5 cursor-pointer ${
              clientMode === 'existing'
                ? 'bg-gradient-to-r from-[#EE6F2D] to-[#D95B1B] text-white shadow-xs font-extrabold'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <span>Existing Client</span>
          </button>
        </div>
      </div>

      <div className="p-6 md:p-8">
        {error && (
          <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 rounded-lg flex items-start space-x-3 text-rose-800 text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {clientMode === 'new' ? (
          /* ============================================================
             NEW CLIENT FORM
             ============================================================ */
          <form onSubmit={handleNext} className="space-y-6 max-w-4xl">
            <div className="flex items-center space-x-2 text-xs font-black uppercase tracking-wider text-[#EE6F2D]">
              <span className="w-1.5 h-3.5 bg-[#EE6F2D] rounded-full" />
              <span>New Client Details</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Company Name */}
              <div className="md:col-span-2 space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Company Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. ABC Electricals Pvt. Ltd."
                  value={formValues.companyName}
                  onChange={(e) => setFormValues({ ...formValues, companyName: e.target.value })}
                  className={`w-full px-3.5 py-2.5 text-sm rounded-lg border bg-white focus:outline-hidden focus:ring-2 focus:ring-[#EE6F2D]/20 focus:border-[#EE6F2D] transition-colors ${
                    formErrors.companyName ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                  }`}
                />
                {formErrors.companyName && (
                  <p className="text-[11px] text-rose-600 font-semibold">{formErrors.companyName}</p>
                )}
              </div>

              {/* Customer Type */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Customer Type <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formValues.customerType}
                  onChange={(e) => setFormValues({ ...formValues, customerType: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#EE6F2D]/20 focus:border-[#EE6F2D]"
                >
                  <option value="Contractor">Contractor</option>
                  <option value="End User">End User</option>
                </select>
                {formErrors.customerType && (
                  <p className="text-[11px] text-rose-600 font-semibold">{formErrors.customerType}</p>
                )}
              </div>

              {/* Contact Person Name */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">
                    Contact Person Name <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">Max 50 characters</span>
                </div>
                <input
                  type="text"
                  maxLength={50}
                  placeholder="e.g. Ramesh Kumar"
                  value={formValues.contactPerson}
                  onChange={(e) => setFormValues({ ...formValues, contactPerson: e.target.value })}
                  className={`w-full px-3.5 py-2.5 text-sm rounded-lg border bg-white focus:outline-hidden focus:ring-2 focus:ring-[#EE6F2D]/20 focus:border-[#EE6F2D] transition-colors ${
                    formErrors.contactPerson ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                  }`}
                />
                {formErrors.contactPerson && (
                  <p className="text-[11px] text-rose-600 font-semibold">{formErrors.contactPerson}</p>
                )}
              </div>

              {/* Contact Number */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">
                    Contact Number <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">10 digits</span>
                </div>
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="e.g. 9876543210"
                  value={formValues.mobile}
                  onChange={(e) => {
                    const onlyNums = e.target.value.replace(/\D/g, '');
                    setFormValues({ ...formValues, mobile: onlyNums });
                  }}
                  className={`w-full px-3.5 py-2.5 text-sm rounded-lg border bg-white focus:outline-hidden focus:ring-2 focus:ring-[#EE6F2D]/20 focus:border-[#EE6F2D] transition-colors font-mono ${
                    formErrors.mobile ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                  }`}
                />
                {formErrors.mobile && (
                  <p className="text-[11px] text-rose-600 font-semibold">{formErrors.mobile}</p>
                )}
              </div>

              {/* Email ID */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">Email ID</label>
                  <span className="text-[10px] text-slate-400 font-medium">Optional</span>
                </div>
                <input
                  type="email"
                  placeholder="e.g. ramesh@abcelectricals.com"
                  value={formValues.email}
                  onChange={(e) => setFormValues({ ...formValues, email: e.target.value })}
                  className={`w-full px-3.5 py-2.5 text-sm rounded-lg border bg-white focus:outline-hidden focus:ring-2 focus:ring-[#EE6F2D]/20 focus:border-[#EE6F2D] transition-colors ${
                    formErrors.email ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                  }`}
                />
                {formErrors.email && (
                  <p className="text-[11px] text-rose-600 font-semibold">{formErrors.email}</p>
                )}
              </div>

              {/* Site Address */}
              <div className="md:col-span-2 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">Site Address</label>
                  <span className="text-[10px] text-slate-400 font-medium">Max 250 characters</span>
                </div>
                <textarea
                  rows={2}
                  maxLength={250}
                  placeholder="e.g. SF No. 123/4, SIPCOT Phase - II, Salem, Tamil Nadu - 636005."
                  value={formValues.siteAddress}
                  onChange={(e) => setFormValues({ ...formValues, siteAddress: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#EE6F2D]/20 focus:border-[#EE6F2D]"
                />
                {formErrors.siteAddress && (
                  <p className="text-[11px] text-rose-600 font-semibold">{formErrors.siteAddress}</p>
                )}
              </div>
            </div>

            {/* Note about Client ID */}
            <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-lg flex items-center space-x-3 text-xs text-blue-900">
              <ShieldCheck className="w-4 h-4 text-[#1E5BB8] shrink-0" />
              <span>
                A unique Client ID (e.g. <strong>SP-CL-2026-XXXX</strong>) will be generated upon saving and remain permanently locked for all offering revisions.
              </span>
            </div>

            {/* Action Bar */}
            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-[#EE6F2D] to-[#D95B1B] hover:from-[#E46220] hover:to-[#C65015] text-white text-sm font-bold shadow-md shadow-orange-500/20 transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                <span>{saving ? 'Registering Client...' : 'Next: Project Details'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        ) : (
          /* ============================================================
             EXISTING CLIENT LOOKUP
             ============================================================ */
          <div className="space-y-6 max-w-4xl">
            <div className="flex items-center space-x-2 text-xs font-black uppercase tracking-wider text-[#EE6F2D]">
              <span className="w-1.5 h-3.5 bg-[#EE6F2D] rounded-full" />
              <span>Search Existing Client</span>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search using Client ID (e.g. SP-CL-2026-0001), company name or contact number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#EE6F2D]/20 focus:border-[#EE6F2D]"
              />
              {isSearching && (
                <div className="absolute right-3.5 top-3.5 w-4 h-4 border-2 border-[#EE6F2D] border-t-transparent rounded-full animate-spin" />
              )}
            </div>

            {/* Selected Client Card */}
            {selectedExistingClient && (
              <div className="p-4 rounded-xl border-2 border-emerald-500 bg-emerald-50/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                      {selectedExistingClient.clientId || 'SP-CL-2026-0001'}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {selectedExistingClient.customerType || 'Contractor'}
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-[#0A1E3F]">
                    {selectedExistingClient.companyName}
                  </h3>
                  <p className="text-xs text-slate-600">
                    Contact: <strong>{selectedExistingClient.contactPerson}</strong> ({selectedExistingClient.mobile})
                  </p>
                  {selectedExistingClient.siteAddress && (
                    <p className="text-xs text-slate-500 truncate max-w-xl">
                      {selectedExistingClient.siteAddress}
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-1.5 text-emerald-700 font-bold text-xs shrink-0 bg-white px-3 py-1.5 rounded-lg border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Selected</span>
                </div>
              </div>
            )}

            {/* Search Results List */}
            {searchResults.length > 0 && (
              <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100 max-h-64 overflow-y-auto">
                {searchResults.map((c) => {
                  const isSelected = selectedExistingClient?._id === c._id || selectedExistingClient?.clientId === c.clientId;
                  return (
                    <div
                      key={c._id || c.clientId}
                      onClick={() => handleSelectExisting(c)}
                      className={`p-3.5 flex items-center justify-between cursor-pointer transition-colors ${
                        isSelected ? 'bg-orange-50/50' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-mono font-bold text-[#1E5BB8]">
                            {c.clientId || 'Client'}
                          </span>
                          <span className="text-sm font-bold text-slate-800">{c.companyName}</span>
                          <span className="text-[11px] px-2 py-0.2 rounded-full bg-slate-100 text-slate-600">
                            {c.customerType}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          {c.contactPerson} • {c.mobile} • {c.clientLocation || c.siteAddress || 'Salem, TN'}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectExisting(c);
                        }}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                          isSelected
                            ? 'bg-[#EE6F2D] text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {isSelected ? 'Selected' : 'Select'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Action Bar */}
            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={handleNext}
                disabled={!selectedExistingClient || saving}
                className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-[#EE6F2D] to-[#D95B1B] hover:from-[#E46220] hover:to-[#C65015] text-white text-sm font-bold shadow-md shadow-orange-500/20 transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                <span>{saving ? 'Loading...' : 'Next: Project Details'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

