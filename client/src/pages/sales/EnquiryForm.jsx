import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import api from '../../api/client';
import { ESignaturePad } from '../../components/ESignaturePad';
import { numberToWords } from '../../utils/numberToWords';
import {
  FileText,
  Building2,
  Trash2,
  Plus,
  Minus,
  Save,
  Send,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  Search,
  Printer,
  Calculator,
  ShieldCheck,
  Truck,
  RotateCcw
} from 'lucide-react';

export const EnquiryForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [searchParams] = useSearchParams();
  const prefillClientId = searchParams.get('clientId');
  const navigate = useNavigate();

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [errors, setErrors] = useState({});

  // Client Selection Mode: 'existing' | 'new'
  const [clientMode, setClientMode] = useState('existing');

  // New Client Fields
  const [newClient, setNewClient] = useState({
    companyName: '',
    customerType: 'Contractor', // 'Contractor' | 'End User'
    contactPerson: '', // Name (max 50 chars)
    mobile: '', // 10-digit mobile
    email: '', // lowercase, max 30 chars
    siteAddress: '' // max 250 chars
  });

  // Main Enquiry Form State
  const [formData, setFormData] = useState({
    clientId: prefillClientId || '',
    customerType: 'Contractor',
    offerDate: new Date().toISOString().split('T')[0],
    project: {
      standardType: 'Standard', // 'Standard' | 'Non Standard'
      projectName: '', // Project Title
      segment: 'Commercial', // 'Renewable' | 'Industry' | 'Commercial' | 'Others'
      subSegment: 'Building',
      customSegment: '',
      expectedDeliveryDate: '',
      projectLocation: 'Salem, Tamil Nadu',
      projectSiteAddress: '',
      projectScope: 'Our scope shall be limited to design, Manufacturing and supply of the quoted HT switchgear panels only. Erection, testing and commissioning shall not be in our scope.'
    },
    products: [
      {
        productName: 'VCB Switchboard',
        customProductName: '',
        kilovolt: '11 kV',
        ampere: '630 A',
        kiloampere: '25 kA',
        durationSec: 'For 3 Sec',
        usage: 'Outdoor',
        ebMetering: '(Transformer Control)',
        customEbMetering: '',
        productDescription: '11KV, 630A, 25kA for 3 sec Outdoor Type Standalone VCB Switchboard (Transformer Control) as per our specification and bill of materials Make (Skypower switchgears)',
        quantity: 1,
        basicPrice: 315000,
        totalBasicPrice: 315000,
        productType: 'HT Switchgear',
        unit: 'Nos'
      }
    ],
    commercialPricing: {
      priceBasis: 'Ex-Works: Salem, Tamil Nadu',
      forBasis: 'Client Own Transport (Default)', // 'Client Own Transport (Default)' | 'Sky Power Transport (Up and Down)'
      transportPrice: 0,
      subTotal: 315000,
      gstType: 'INTRA_STATE', // 'INTRA_STATE' (CGST 9% + SGST 9%) | 'INTER_STATE' (IGST 18%)
      cgstRate: 9,
      sgstRate: 9,
      igstRate: 18,
      cgstAmount: 28350,
      sgstAmount: 28350,
      igstAmount: 0,
      totalTaxAmount: 56700,
      totalAmount: 371700,
      amountInWords: 'Three Lakhs Seventy One Thousand Seven Hundred Rupees Only.'
    },
    enquiryType: 'Firm',
    eSignature: {
      signatureData: '',
      signatureType: 'adopted',
      signedByName: 'Rajesh Sharma',
      designation: 'Senior Proposal & Sales Engineer',
      employeeId: 'EMP-SKP-2026-88',
      signedAt: new Date().toISOString()
    }
  });

  // Load Existing Clients
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await api.get('/clients');
        if (res.success) {
          setClients(res.clients || []);
          if (prefillClientId && res.clients) {
            const found = res.clients.find((c) => c._id === prefillClientId);
            if (found) {
              setFormData((prev) => ({
                ...prev,
                clientId: found._id,
                customerType: found.customerType || 'Contractor',
                project: {
                  ...prev.project,
                  projectLocation: found.clientLocation || found.siteAddress || 'Salem, Tamil Nadu',
                  projectSiteAddress: found.siteAddress || ''
                }
              }));
            }
          }
        }
      } catch (err) {
        console.error('Failed to load clients:', err);
      }
    };
    fetchClients();
  }, [prefillClientId]);

  // Load enquiry if editing
  useEffect(() => {
    if (isEdit) {
      const fetchEnquiry = async () => {
        setLoading(true);
        try {
          const res = await api.get(`/enquiries/${id}`);
          if (res.success && res.enquiry) {
            const e = res.enquiry;
            setFormData({
              clientId: e.clientId?._id || e.clientId || '',
              customerType: e.customerType || 'Contractor',
              offerDate: e.offerDate ? new Date(e.offerDate).toISOString().split('T')[0] : '',
              project: {
                standardType: e.project?.standardType || 'Standard',
                projectName: e.project?.projectName || '',
                segment: e.project?.segment || 'Commercial',
                subSegment: e.project?.subSegment || 'Building',
                customSegment: '',
                expectedDeliveryDate: e.project?.expectedDeliveryDate
                  ? new Date(e.project.expectedDeliveryDate).toISOString().split('T')[0]
                  : '',
                projectLocation: e.project?.projectLocation || '',
                projectSiteAddress: e.project?.projectSiteAddress || '',
                projectScope: e.project?.projectScope || ''
              },
              products: (e.products || []).map((p) => ({
                productName: p.productName || 'VCB Switchboard',
                customProductName: '',
                kilovolt: p.kilovolt || '11 kV',
                ampere: p.ampere || '630 A',
                kiloampere: p.kiloampere || '25 kA',
                durationSec: p.durationSec || 'For 3 Sec',
                usage: p.usage || 'Outdoor',
                ebMetering: p.ebMetering || '(Transformer Control)',
                customEbMetering: '',
                productDescription: p.productDescription || '',
                quantity: Number(p.quantity || 1),
                basicPrice: Number(p.basicPrice || p.estimatedUnitValue || 315000),
                totalBasicPrice: Number(p.totalBasicPrice || p.totalProductValue || 315000),
                productType: p.productType || 'HT Switchgear',
                unit: p.unit || 'Nos'
              })),
              commercialPricing: e.commercialPricing || {
                priceBasis: 'Ex-Works: Salem, Tamil Nadu',
                forBasis: 'Client Own Transport (Default)',
                transportPrice: 0,
                subTotal: e.expectedProjectValue || 315000,
                gstType: 'INTRA_STATE',
                cgstRate: 9,
                sgstRate: 9,
                igstRate: 18,
                cgstAmount: Math.round((e.expectedProjectValue || 315000) * 0.09),
                sgstAmount: Math.round((e.expectedProjectValue || 315000) * 0.09),
                igstAmount: 0,
                totalTaxAmount: Math.round((e.expectedProjectValue || 315000) * 0.18),
                totalAmount: Math.round((e.expectedProjectValue || 315000) * 1.18),
                amountInWords: numberToWords((e.expectedProjectValue || 315000) * 1.18)
              },
              enquiryType: e.enquiryType || 'Firm',
              eSignature: e.eSignature || {
                signatureData: '',
                signatureType: 'adopted',
                signedByName: 'Rajesh Sharma',
                designation: 'Senior Proposal & Sales Engineer',
                employeeId: 'EMP-SKP-2026-88',
                signedAt: new Date().toISOString()
              }
            });
          }
        } catch (err) {
          setServerError('Failed to load existing enquiry.');
        } finally {
          setLoading(false);
        }
      };
      fetchEnquiry();
    }
  }, [id, isEdit]);

  // Recalculate commercial totals whenever products, transport, or GST mode change
  const recalculateCommercials = (updatedProducts, forBasis, transportPrice, gstType) => {
    const productsSum = updatedProducts.reduce((sum, p) => sum + (Number(p.totalBasicPrice) || 0), 0);
    const transport = forBasis === 'Sky Power Transport (Up and Down)' ? Number(transportPrice || 20000) : 0;
    const subTotal = productsSum + transport;

    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;
    let totalTaxAmount = 0;

    if (gstType === 'INTER_STATE') {
      igstAmount = Math.round(subTotal * 0.18);
      totalTaxAmount = igstAmount;
    } else {
      cgstAmount = Math.round(subTotal * 0.09);
      sgstAmount = Math.round(subTotal * 0.09);
      totalTaxAmount = cgstAmount + sgstAmount;
    }

    const totalAmount = subTotal + totalTaxAmount;
    const amountInWords = numberToWords(totalAmount);

    return {
      priceBasis: 'Ex-Works: Salem, Tamil Nadu',
      forBasis,
      transportPrice: transport,
      subTotal,
      gstType,
      cgstRate: gstType === 'INTRA_STATE' ? 9 : 0,
      sgstRate: gstType === 'INTRA_STATE' ? 9 : 0,
      igstRate: gstType === 'INTER_STATE' ? 18 : 0,
      cgstAmount,
      sgstAmount,
      igstAmount,
      totalTaxAmount,
      totalAmount,
      amountInWords
    };
  };

  // Helper to compose dynamic product description
  const composeProductDescription = (p) => {
    const pName = p.productName === 'Others' && p.customProductName ? p.customProductName : p.productName;
    const eb = p.ebMetering === 'Others' && p.customEbMetering ? `(${p.customEbMetering})` : p.ebMetering;
    return `${p.kilovolt}, ${p.ampere}, ${p.kiloampere} for ${p.durationSec} ${p.usage} Type Standalone ${pName} ${eb} as per our specification and bill of materials Make (Skypower switchgears)`;
  };

  // Handle product field changes
  const handleProductChange = (index, field, value) => {
    const updated = [...formData.products];
    const current = { ...updated[index], [field]: value };

    // Auto-update total basic price if qty or basicPrice changed
    if (field === 'quantity' || field === 'basicPrice') {
      const q = field === 'quantity' ? Math.max(1, parseInt(value, 10) || 1) : current.quantity;
      const bp = field === 'basicPrice' ? Math.max(0, parseFloat(value) || 0) : current.basicPrice;
      current.quantity = q;
      current.basicPrice = bp;
      current.totalBasicPrice = q * bp;
    }

    // Auto-compose description if specification components changed
    if (['productName', 'customProductName', 'kilovolt', 'ampere', 'kiloampere', 'durationSec', 'usage', 'ebMetering', 'customEbMetering'].includes(field)) {
      current.productDescription = composeProductDescription(current);
    }

    updated[index] = current;

    const updatedPricing = recalculateCommercials(
      updated,
      formData.commercialPricing.forBasis,
      formData.commercialPricing.transportPrice,
      formData.commercialPricing.gstType
    );

    setFormData({
      ...formData,
      products: updated,
      commercialPricing: updatedPricing
    });
  };

  // Add new product line
  const handleAddProduct = () => {
    const newProd = {
      productName: 'VCB Switchboard',
      customProductName: '',
      kilovolt: '11 kV',
      ampere: '630 A',
      kiloampere: '25 kA',
      durationSec: 'For 3 Sec',
      usage: 'Outdoor',
      ebMetering: '(Transformer Control)',
      customEbMetering: '',
      productDescription: '11KV, 630A, 25kA for 3 sec Outdoor Type Standalone VCB Switchboard (Transformer Control) as per our specification and bill of materials Make (Skypower switchgears)',
      quantity: 1,
      basicPrice: 315000,
      totalBasicPrice: 315000,
      productType: 'HT Switchgear',
      unit: 'Nos'
    };
    const updated = [...formData.products, newProd];
    const updatedPricing = recalculateCommercials(
      updated,
      formData.commercialPricing.forBasis,
      formData.commercialPricing.transportPrice,
      formData.commercialPricing.gstType
    );
    setFormData({
      ...formData,
      products: updated,
      commercialPricing: updatedPricing
    });
  };

  // Remove product line
  const handleRemoveProduct = (index) => {
    if (formData.products.length <= 1) return;
    const updated = formData.products.filter((_, idx) => idx !== index);
    const updatedPricing = recalculateCommercials(
      updated,
      formData.commercialPricing.forBasis,
      formData.commercialPricing.transportPrice,
      formData.commercialPricing.gstType
    );
    setFormData({
      ...formData,
      products: updated,
      commercialPricing: updatedPricing
    });
  };

  // 1-Click Auto-Fill Sample Enquiry (Matching Image 1 Sivili Engineering)
  const handleAutoFillSample = () => {
    const sampleProducts = [
      {
        productName: 'VCB Switchboard',
        customProductName: '',
        kilovolt: '11 kV',
        ampere: '630 A',
        kiloampere: '25 kA',
        durationSec: 'For 3 Sec',
        usage: 'Outdoor',
        ebMetering: '(Transformer Control)',
        customEbMetering: '',
        productDescription: '11KV, 630A, 25kA for 3 sec Outdoor Type Standalone VCB Switchboard (Transformer Control) as per our specification and bill of materials Make (Skypower switchgears)',
        quantity: 1,
        basicPrice: 315000,
        totalBasicPrice: 315000,
        productType: 'HT Switchgear',
        unit: 'Nos'
      }
    ];

    const samplePricing = recalculateCommercials(sampleProducts, 'Client Own Transport (Default)', 0, 'INTRA_STATE');

    setClientMode('new');
    setNewClient({
      companyName: 'Sivili Engineering Construction',
      customerType: 'Contractor',
      contactPerson: 'S. Sivakumar (Chief Electrical Engineer)',
      mobile: '9840198401',
      email: 'sivili.engg@gmail.com',
      siteAddress: 'Plot 14, SIPCOT Industrial Park, Kancheepuram, Tamil Nadu - 631501'
    });

    setFormData({
      ...formData,
      customerType: 'Contractor',
      project: {
        standardType: 'Standard',
        projectName: '11kV Outdoor Type Standalone VCB Substation Scheme',
        segment: 'Commercial',
        subSegment: 'Building',
        customSegment: '',
        expectedDeliveryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        projectLocation: 'Kancheepuram, Tamil Nadu',
        projectSiteAddress: 'Plot 14, SIPCOT Industrial Park, Kancheepuram, Tamil Nadu - 631501',
        projectScope: 'Our scope shall be limited to design, Manufacturing and supply of the quoted HT switchgear panels only. Erection, testing and commissioning shall not be in our scope.'
      },
      products: sampleProducts,
      commercialPricing: samplePricing
    });
    setErrors({});
    setServerError('');
  };

  // Validation
  const validateForm = () => {
    const newErrors = {};

    // Validate Client
    if (clientMode === 'existing') {
      if (!formData.clientId) {
        newErrors.clientId = 'Please select an existing verified client or switch to New Client.';
      }
    } else {
      if (!newClient.companyName.trim()) {
        newErrors.companyName = 'Company Name is mandatory.';
      }
      if (!newClient.customerType) {
        newErrors.customerType = 'Please select Contractor or End User.';
      }
      if (!newClient.contactPerson.trim()) {
        newErrors.contactPerson = 'Contact Person Name is mandatory.';
      } else if (newClient.contactPerson.trim().length > 50) {
        newErrors.contactPerson = 'Contact Person Name cannot exceed 50 characters.';
      }
      if (!newClient.mobile.trim()) {
        newErrors.mobile = 'Contact Number is mandatory.';
      } else if (!/^[0-9]{10}$/.test(newClient.mobile.trim())) {
        newErrors.mobile = 'Contact Number must be exactly 10 digits.';
      }
      if (newClient.email.trim() && newClient.email.trim().length > 30) {
        newErrors.email = 'Email ID cannot exceed 30 characters.';
      }
      if (newClient.siteAddress && newClient.siteAddress.length > 250) {
        newErrors.siteAddress = 'Site Address cannot exceed 250 characters.';
      }
    }

    // Validate Project Details
    if (!formData.project.projectName.trim()) {
      newErrors.projectName = 'Project Title is mandatory.';
    }

    // Validate Products
    if (formData.products.length === 0) {
      newErrors.products = 'At least one product line item is mandatory.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submission handler
  const handleSubmit = async (actionType = 'save') => {
    setServerError('');
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      let finalClientId = formData.clientId;

      // If New Client Mode, register client first
      if (clientMode === 'new') {
        const clientRes = await api.post('/clients', {
          companyName: newClient.companyName.trim(),
          customerType: newClient.customerType,
          contactPerson: newClient.contactPerson.trim(),
          mobile: newClient.mobile.trim(),
          email: newClient.email.trim().toLowerCase(),
          siteAddress: newClient.siteAddress.trim(),
          clientLocation: newClient.siteAddress.trim() || 'Salem, Tamil Nadu'
        });
        if (clientRes.success && clientRes.client) {
          finalClientId = clientRes.client._id;
        }
      }

      const payload = {
        clientId: finalClientId,
        customerType: clientMode === 'new' ? newClient.customerType : formData.customerType,
        offerDate: formData.offerDate,
        project: {
          ...formData.project,
          projectLocation: formData.project.projectLocation || 'Salem, Tamil Nadu',
          projectCategory: 'HT Switchgear Requisition'
        },
        products: formData.products.map((p) => ({
          ...p,
          estimatedUnitValue: p.basicPrice,
          totalProductValue: p.totalBasicPrice
        })),
        commercialPricing: formData.commercialPricing,
        expectedProjectValue: formData.commercialPricing.totalAmount,
        enquiryType: formData.enquiryType,
        eSignature: formData.eSignature
      };

      let savedEnquiryId = id;
      if (isEdit) {
        await api.put(`/enquiries/${id}`, payload);
      } else {
        const res = await api.post('/enquiries', payload);
        savedEnquiryId = res.enquiry._id;
      }

      // If clicking "Submit for Admin Approval", automatically submit
      if (actionType === 'submit') {
        await api.post(`/enquiries/${savedEnquiryId}/submit`);
      }

      navigate(`/enquiries/${savedEnquiryId}`);
    } catch (err) {
      setServerError(err.message || 'Failed to save enquiry requisition. Please review inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-28">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center space-x-3">
          <Link to="/enquiries" className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-50">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-[#1E5BB8] bg-[#F0F5FD] px-2.5 py-0.5 rounded border border-[#D0E1F9]">
                FORM SG-ERN-01
              </span>
              <h1 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                {isEdit ? 'Modify Switchgear Requisition' : 'New Switchgear Technical & Commercial Requisition'}
              </h1>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">HT/LT Switchboard Specification Dossier</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {!isEdit && (
            <button
              type="button"
              onClick={handleAutoFillSample}
              className="inline-flex items-center px-3.5 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white shadow-xs transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-300" />
              ⚡ Auto-Fill Sample Enquiry (Sivili Engg)
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

      {/* Helpful 1-Click Auto-Fill Guide Banner for Non-Technical Users */}
      {!isEdit && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-2xs">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">💡</span>
            <div>
              <p className="text-xs font-black text-blue-950">
                Want to fill the form in 1 second?
              </p>
              <p className="text-[11px] text-blue-800 font-medium">
                Click the button on the right to auto-fill sample Sivili Engineering switchboard quotation data.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleAutoFillSample}
            className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-black bg-[#1E5BB8] hover:bg-[#174894] text-white shadow-xs transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-300" />
            ⚡ Auto-Fill Sample Data
          </button>
        </div>
      )}

      {/* Main Form Sheet */}
      <div className="paper-sheet p-8 md:p-10 text-slate-900 space-y-8 shadow-sm">
        {/* Paper Official Header Banner */}
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
                  HT/LT Switchgear &amp; Substation Engineering • Works: Salem-636030, Tamil Nadu
                </p>
              </div>
            </div>

            <div className="border border-slate-300 p-3 rounded-xl bg-slate-50/80 text-right min-w-[210px]">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
                Official Requisition
              </span>
              <span className="text-sm font-black font-mono text-[#1E5BB8] block mt-0.5">
                {isEdit ? 'REVISION DOCKET' : 'ERN: [AUTO-GENERATED ON SUBMIT]'}
              </span>
            </div>
          </div>
        </div>

        {/* =========================================================================
            SECTION 1.0: USER-FRIENDLY CLIENT SELECTION
        ========================================================================= */}
        <div className="space-y-4">
          <div className="pb-2 border-b border-slate-200">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1E5BB8]" />
              <h3 className="text-sm font-black text-slate-900 tracking-wide">
                1. Client &amp; Customer Information
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Choose an existing client from your records or register a new client in seconds.
            </p>
          </div>

          {/* Mode Switcher Big Friendly Card Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
            <button
              type="button"
              onClick={() => setClientMode('existing')}
              className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                clientMode === 'existing'
                  ? 'border-[#1E5BB8] bg-blue-50/70 text-[#1E5BB8] shadow-xs'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <span className="text-lg">👥</span>
                <div>
                  <span className="text-xs font-black block text-slate-900">Select Existing Client</span>
                  <span className="text-[11px] text-slate-500 font-medium">Pick from registered client database</span>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setClientMode('new')}
              className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                clientMode === 'new'
                  ? 'border-[#1E5BB8] bg-blue-50/70 text-[#1E5BB8] shadow-xs'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <span className="text-lg">➕</span>
                <div>
                  <span className="text-xs font-black block text-slate-900">Register New Client</span>
                  <span className="text-[11px] text-slate-500 font-medium">Generates new Client ID automatically</span>
                </div>
              </div>
            </button>
          </div>

          {/* 1A. Existing Client Mode */}
          {clientMode === 'existing' ? (
            <div className="space-y-4 bg-slate-50/80 p-5 rounded-2xl border border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Choose Client from List <span className="text-rose-600 font-bold">*</span>
                </label>
                <select
                  value={formData.clientId}
                  onChange={(e) => {
                    const selId = e.target.value;
                    const selClient = clients.find((c) => c._id === selId);
                    if (selClient) {
                      setFormData({
                        ...formData,
                        clientId: selClient._id,
                        customerType: selClient.customerType || 'Contractor',
                        project: {
                          ...formData.project,
                          projectLocation: selClient.clientLocation || selClient.siteAddress || 'Salem, Tamil Nadu',
                          projectSiteAddress: selClient.siteAddress || ''
                        }
                      });
                    } else {
                      setFormData({ ...formData, clientId: '' });
                    }
                  }}
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl bg-white text-slate-900 font-bold outline-none focus:border-[#1E5BB8] shadow-2xs"
                >
                  <option value="">-- Click here to select a client --</option>
                  {clients.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.companyName} ({c.customerType}) • {c.clientLocation || c.siteAddress || '-'}
                    </option>
                  ))}
                </select>
                {errors.clientId && <p className="text-[10px] text-rose-600 mt-1 font-bold">{errors.clientId}</p>}
              </div>

              {formData.clientId && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-white rounded-xl border border-slate-200 text-xs shadow-2xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Customer Role</span>
                    <span className="text-xs font-black text-[#1E5BB8] mt-0.5 block">{formData.customerType}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Location / City</span>
                    <span className="text-xs font-bold text-slate-800 mt-0.5 block">{formData.project.projectLocation}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Status</span>
                    <span className="text-xs font-bold text-emerald-700 mt-0.5 block">✓ Verified Record</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* 1B. New Client Mode (Mandatory & Optional Fields) */
            <div className="space-y-4 bg-blue-50/40 p-5 rounded-2xl border border-blue-200/90">
              <div className="flex items-center justify-between pb-2 border-b border-blue-200/70">
                <span className="text-xs font-black text-[#1E5BB8]">
                  Quick Client Registration (Client ID will be created automatically)
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-[#1E5BB8] rounded-md">
                  New Customer
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Company Name */}
                <div className="sm:col-span-2 space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-800">
                      1. Company Name <span className="text-rose-600">*</span>
                    </label>
                    <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">Required</span>
                  </div>
                  <input
                    type="text"
                    value={newClient.companyName}
                    onChange={(e) => setNewClient({ ...newClient, companyName: e.target.value })}
                    placeholder="e.g. Sivili Engineering Construction"
                    className={`w-full px-3.5 py-2.5 text-xs border rounded-xl outline-none font-bold text-slate-900 bg-white shadow-2xs ${
                      errors.companyName ? 'border-rose-500 bg-rose-50/20' : 'border-slate-300 focus:border-[#1E5BB8]'
                    }`}
                  />
                  {errors.companyName && <p className="text-[10px] text-rose-600 mt-1 font-bold">{errors.companyName}</p>}
                </div>

                {/* 2. Contractor or End User */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-800">
                      2. Customer Type <span className="text-rose-600">*</span>
                    </label>
                    <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">Required</span>
                  </div>
                  <select
                    value={newClient.customerType}
                    onChange={(e) => setNewClient({ ...newClient, customerType: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl bg-white text-slate-900 font-bold focus:border-[#1E5BB8] outline-none shadow-2xs"
                  >
                    <option value="Contractor">Contractor</option>
                    <option value="End User">End User</option>
                  </select>
                </div>

                {/* 3. Name (50 Char) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wide">
                      3. Contact Person Name <span className="text-rose-600 font-black">*</span>
                    </label>
                    <span className="text-[10px] font-mono text-slate-400">{newClient.contactPerson.length}/50</span>
                  </div>
                  <input
                    type="text"
                    maxLength={50}
                    value={newClient.contactPerson}
                    onChange={(e) => setNewClient({ ...newClient, contactPerson: e.target.value })}
                    placeholder="e.g. S. Sivakumar (Chief Electrical Engineer)"
                    className={`w-full px-3 py-2 text-xs border rounded-xl outline-none font-medium bg-white text-slate-900 ${
                      errors.contactPerson ? 'border-rose-500 bg-rose-50/20' : 'border-slate-300 focus:border-[#1E5BB8]'
                    }`}
                  />
                  {errors.contactPerson && <p className="text-[10px] text-rose-600 mt-1 font-bold">{errors.contactPerson}</p>}
                </div>

                {/* 4. Contact NO (10 digits) */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wide mb-1">
                    4. Contact No (10-Digit Mobile) <span className="text-rose-600 font-black">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    value={newClient.mobile}
                    onChange={(e) => setNewClient({ ...newClient, mobile: e.target.value.replace(/[^0-9]/g, '') })}
                    placeholder="9840198401"
                    className={`w-full px-3 py-2 text-xs border font-mono rounded-xl outline-none font-black text-[#1E5BB8] bg-white ${
                      errors.mobile ? 'border-rose-500 bg-rose-50/20' : 'border-slate-300 focus:border-[#1E5BB8]'
                    }`}
                  />
                  {errors.mobile && <p className="text-[10px] text-rose-600 mt-1 font-bold">{errors.mobile}</p>}
                </div>

                {/* 5. Email ID (Optional, max 30 char, lowercase) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wide">
                      5. Email ID (Optional)
                    </label>
                    <span className="text-[10px] font-mono text-slate-400">{newClient.email.length}/30</span>
                  </div>
                  <input
                    type="email"
                    maxLength={30}
                    value={newClient.email}
                    onChange={(e) => setNewClient({ ...newClient, email: e.target.value.toLowerCase() })}
                    placeholder="sivili.engg@gmail.com"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl outline-none lowercase bg-white focus:border-[#1E5BB8]"
                  />
                  {errors.email && <p className="text-[10px] text-rose-600 mt-1 font-bold">{errors.email}</p>}
                </div>

                {/* 6. Site Address (Optional, max 250 char) */}
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wide">
                      6. Site Address (Optional)
                    </label>
                    <span className="text-[10px] font-mono text-slate-400">{newClient.siteAddress.length}/250</span>
                  </div>
                  <textarea
                    rows={2}
                    maxLength={250}
                    value={newClient.siteAddress}
                    onChange={(e) => setNewClient({ ...newClient, siteAddress: e.target.value })}
                    placeholder="Plot 14, SIPCOT Industrial Park, Kancheepuram, Tamil Nadu - 631501"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl outline-none bg-white focus:border-[#1E5BB8]"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* =========================================================================
            SECTION 2.0: USER-FRIENDLY PROJECT DETAILS
        ========================================================================= */}
        <div className="space-y-4">
          <div className="pb-2 border-b border-slate-200">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1E5BB8]" />
              <h3 className="text-sm font-black text-slate-900 tracking-wide">
                2. Project &amp; Site Details
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Specify the project title, scheme category, and the customer's industry sector.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50/70 p-5 rounded-2xl border border-slate-200">
            {/* 7. Standard / Non Standard */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-800">
                Scheme Category <span className="text-rose-600 font-bold">*</span>
              </label>
              <select
                value={formData.project.standardType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    project: { ...formData.project, standardType: e.target.value }
                  })
                }
                className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl bg-white font-bold text-slate-900 focus:border-[#1E5BB8] outline-none shadow-2xs"
              >
                <option value="Standard">Standard Product Design</option>
                <option value="Non Standard">Non-Standard (Customized)</option>
              </select>
            </div>

            {/* 8. Project Title */}
            <div className="sm:col-span-2 space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-800">
                  Project Title <span className="text-rose-600 font-bold">*</span>
                </label>
                <span className="text-[10px] text-slate-400 font-mono">{formData.project.projectName.length}/50 chars</span>
              </div>
              <input
                type="text"
                maxLength={50}
                value={formData.project.projectName}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    project: { ...formData.project, projectName: e.target.value }
                  })
                }
                placeholder="e.g. 11kV Outdoor Type Standalone VCB Substation Scheme"
                className={`w-full px-3.5 py-2.5 text-xs border rounded-xl outline-none font-bold text-slate-900 bg-white shadow-2xs ${
                  errors.projectName ? 'border-rose-500 bg-rose-50/20' : 'border-slate-300 focus:border-[#1E5BB8]'
                }`}
              />
              {errors.projectName && <p className="text-[10px] text-rose-600 mt-1 font-bold">{errors.projectName}</p>}
            </div>

            {/* 9. Segment */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-800">
                Industry Segment <span className="text-rose-600 font-bold">*</span>
              </label>
              <select
                value={formData.project.segment}
                onChange={(e) => {
                  const seg = e.target.value;
                  let defaultSub = 'Building';
                  if (seg === 'Renewable') defaultSub = 'Solar';
                  else if (seg === 'Industry') defaultSub = 'Chemical';
                  else if (seg === 'Commercial') defaultSub = 'Building';
                  else defaultSub = 'Others';

                  setFormData({
                    ...formData,
                    project: { ...formData.project, segment: seg, subSegment: defaultSub }
                  });
                }}
                className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl bg-white font-bold text-slate-900 focus:border-[#1E5BB8] outline-none shadow-2xs"
              >
                <option value="Commercial">Commercial (Building, College...)</option>
                <option value="Renewable">Renewable (Solar, Wind...)</option>
                <option value="Industry">Industry (Chemical, Textile...)</option>
                <option value="Others">Others</option>
              </select>
            </div>

            {/* 9b. Sub-Segment Dependent Dropdown */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-800">
                Sub-Category ({formData.project.segment})
              </label>
              {formData.project.segment === 'Renewable' && (
                <select
                  value={formData.project.subSegment}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      project: { ...formData.project, subSegment: e.target.value }
                    })
                  }
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl bg-white font-semibold text-slate-900 focus:border-[#1E5BB8] outline-none shadow-2xs"
                >
                  <option value="Solar">Solar Power Plant</option>
                  <option value="Wind">Wind Farm Substation</option>
                  <option value="Others">Others</option>
                </select>
              )}

              {formData.project.segment === 'Commercial' && (
                <select
                  value={formData.project.subSegment}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      project: { ...formData.project, subSegment: e.target.value }
                    })
                  }
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl bg-white font-semibold text-slate-900 focus:border-[#1E5BB8] outline-none shadow-2xs"
                >
                  <option value="Building">Commercial Building / Mall</option>
                  <option value="Colleges">Colleges &amp; Universities</option>
                  <option value="Hospital / Healthcare">Hospital / Healthcare</option>
                  <option value="IT Park / Data Center">IT Park / Data Center</option>
                  <option value="Others">Others</option>
                </select>
              )}

              {formData.project.segment === 'Industry' && (
                <select
                  value={formData.project.subSegment}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      project: { ...formData.project, subSegment: e.target.value }
                    })
                  }
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl bg-white font-semibold text-slate-900 focus:border-[#1E5BB8] outline-none shadow-2xs"
                >
                  <option value="Chemical">Chemical Industry</option>
                  <option value="Textile">Textile Mill</option>
                  <option value="Steel">Steel Plant</option>
                  <option value="Pharma">Pharmaceutical</option>
                  <option value="Cement">Cement Factory</option>
                  <option value="Others">Others</option>
                </select>
              )}

              {formData.project.segment === 'Others' && (
                <input
                  type="text"
                  value={formData.project.subSegment}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      project: { ...formData.project, subSegment: e.target.value }
                    })
                  }
                  placeholder="Specify Custom Segment..."
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl bg-white focus:border-[#1E5BB8] outline-none shadow-2xs"
                />
              )}
            </div>

            {/* Expected Delivery Date */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-800">
                Target Delivery Date
              </label>
              <input
                type="date"
                value={formData.project.expectedDeliveryDate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    project: { ...formData.project, expectedDeliveryDate: e.target.value }
                  })
                }
                className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl bg-white font-mono font-bold text-slate-900 focus:border-[#1E5BB8] outline-none shadow-2xs"
              />
            </div>
          </div>
        </div>

        {/* =========================================================================
            SECTION 3.0: USER-FRIENDLY SWITCHGEAR PRODUCT BUILDER
        ========================================================================= */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#EE6F2D]" />
                <h3 className="text-sm font-black text-slate-900 tracking-wide">
                  3. Switchgear Products &amp; Equipment Rating
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Select your technical ratings below. The full specification and price calculate automatically.
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddProduct}
              className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-black bg-[#1E5BB8] hover:bg-[#174894] text-white shadow-xs transition-all cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4 mr-1.5" /> + Add Another Switchgear
            </button>
          </div>

          <div className="space-y-6">
            {formData.products.map((p, idx) => (
              <div
                key={idx}
                className="bg-white p-6 rounded-2xl border-2 border-slate-200/90 shadow-sm space-y-6 relative hover:border-[#1E5BB8]/40 transition-colors"
              >
                {/* Product Card Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-3">
                    <span className="px-3 py-1 rounded-xl bg-[#1E3A5F] text-white font-mono text-xs font-black">
                      Product #{idx + 1}
                    </span>
                    <span className="text-sm font-extrabold text-slate-900">
                      {p.productName} ({p.kilovolt}, {p.ampere}, {p.usage})
                    </span>
                  </div>

                  {formData.products.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveProduct(idx)}
                      className="text-xs text-rose-600 hover:text-rose-800 flex items-center font-bold px-2.5 py-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4 mr-1 text-rose-600" /> Remove This Item
                    </button>
                  )}
                </div>

                {/* ROW 1: PRIMARY ELECTRICAL RATINGS (4 Comfortable Columns) */}
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-2.5">
                    Step A: Choose Primary Ratings
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* 1. Product Name */}
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700">
                        Product Type
                      </label>
                      <select
                        value={p.productName}
                        onChange={(e) => handleProductChange(idx, 'productName', e.target.value)}
                        className="w-full px-3 py-2.5 text-xs border border-slate-300 rounded-xl bg-slate-50/50 font-bold text-slate-900 focus:bg-white focus:border-[#1E5BB8] outline-none transition-all"
                      >
                        <option value="VCB Switchboard">VCB Switchboard</option>
                        <option value="Others">Others</option>
                      </select>
                    </div>

                    {/* 2. Kilovolt */}
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700">
                        Voltage (kV)
                      </label>
                      <select
                        value={p.kilovolt}
                        onChange={(e) => handleProductChange(idx, 'kilovolt', e.target.value)}
                        className="w-full px-3 py-2.5 text-xs border border-slate-300 rounded-xl bg-slate-50/50 font-bold text-slate-900 focus:bg-white focus:border-[#1E5BB8] outline-none transition-all"
                      >
                        <option value="11 kV">11 kV</option>
                        <option value="22 kV">22 kV</option>
                        <option value="33 kV">33 kV</option>
                        <option value="Others">Others</option>
                      </select>
                    </div>

                    {/* 3. Ampere */}
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700">
                        Current Rating (A)
                      </label>
                      <select
                        value={p.ampere}
                        onChange={(e) => handleProductChange(idx, 'ampere', e.target.value)}
                        className="w-full px-3 py-2.5 text-xs border border-slate-300 rounded-xl bg-slate-50/50 font-bold text-slate-900 focus:bg-white focus:border-[#1E5BB8] outline-none transition-all"
                      >
                        <option value="630 A">630 A</option>
                        <option value="800 A">800 A</option>
                        <option value="1250 A">1250 A</option>
                        <option value="Others">Others</option>
                      </select>
                    </div>

                    {/* 4. Kiloampere */}
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700">
                        Breaking Capacity (kA)
                      </label>
                      <select
                        value={p.kiloampere}
                        onChange={(e) => handleProductChange(idx, 'kiloampere', e.target.value)}
                        className="w-full px-3 py-2.5 text-xs border border-slate-300 rounded-xl bg-slate-50/50 font-bold text-slate-900 focus:bg-white focus:border-[#1E5BB8] outline-none transition-all"
                      >
                        <option value="25 kA">25 kA</option>
                        <option value="26.3 kA">26.3 kA</option>
                        <option value="Others">Others</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* ROW 2: OPERATING CONDITIONS & METERING (3 Spacious Columns) */}
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-2.5">
                    Step B: Operating Conditions &amp; Application
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* 5. Duration (sec) */}
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700">
                        Short-Circuit Duration
                      </label>
                      <select
                        value={p.durationSec}
                        onChange={(e) => handleProductChange(idx, 'durationSec', e.target.value)}
                        className="w-full px-3 py-2.5 text-xs border border-slate-300 rounded-xl bg-slate-50/50 font-bold text-slate-900 focus:bg-white focus:border-[#1E5BB8] outline-none transition-all"
                      >
                        <option value="For 3 Sec">For 3 Sec</option>
                        <option value="For 1 Sec">For 1 Sec</option>
                        <option value="Others">Others</option>
                      </select>
                    </div>

                    {/* 6. Usage (Outdoor / Indoor) */}
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700">
                        Installation Type
                      </label>
                      <select
                        value={p.usage}
                        onChange={(e) => handleProductChange(idx, 'usage', e.target.value)}
                        className="w-full px-3 py-2.5 text-xs border border-slate-300 rounded-xl bg-slate-50/50 font-bold text-slate-900 focus:bg-white focus:border-[#1E5BB8] outline-none transition-all"
                      >
                        <option value="Outdoor">Outdoor Type (Weatherproof)</option>
                        <option value="Indoor">Indoor Type</option>
                      </select>
                    </div>

                    {/* 7. EB Metering Function */}
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700">
                        Panel Function / Metering
                      </label>
                      <select
                        value={p.ebMetering}
                        onChange={(e) => handleProductChange(idx, 'ebMetering', e.target.value)}
                        className="w-full px-3 py-2.5 text-xs border border-slate-300 rounded-xl bg-slate-50/50 font-bold text-slate-900 focus:bg-white focus:border-[#1E5BB8] outline-none transition-all"
                      >
                        <option value="(Transformer Control)">(Transformer Control)</option>
                        <option value="(Point of supply)">(Point of supply)</option>
                        <option value="(EB Metering)">(EB Metering)</option>
                        <option value="Others">Others</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* ROW 3: HUMAN-FRIENDLY SPECIFICATION PREVIEW */}
                <div className="p-4 bg-gradient-to-r from-blue-50/70 to-indigo-50/40 rounded-xl border border-blue-200/80">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-black uppercase tracking-wider text-[#1E5BB8] flex items-center">
                      <span className="w-2 h-2 rounded-full bg-[#1E5BB8] mr-2" />
                      Generated Product Description (As will appear on Quotation)
                    </span>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      ✓ Ready for Offer
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-800 leading-relaxed">
                    {p.productDescription}
                  </p>
                </div>

                {/* ROW 4: QUANTITY & PRICING (3 Highlight Cards) */}
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-2.5">
                    Step C: Quantity &amp; Pricing
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Quantity Selector Card */}
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col justify-between">
                      <label className="block text-xs font-bold text-slate-700 mb-2">
                        Quantity Required
                      </label>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => handleProductChange(idx, 'quantity', Math.max(1, p.quantity - 1))}
                          className="w-9 h-9 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 flex items-center justify-center font-black text-slate-700 shadow-2xs cursor-pointer active:scale-95 transition-all"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <input
                          type="number"
                          min={1}
                          value={p.quantity}
                          onChange={(e) => handleProductChange(idx, 'quantity', e.target.value)}
                          className="w-20 py-1.5 text-center font-mono font-black text-base border border-slate-300 rounded-xl bg-white shadow-inner"
                        />
                        <button
                          type="button"
                          onClick={() => handleProductChange(idx, 'quantity', p.quantity + 1)}
                          className="w-9 h-9 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 flex items-center justify-center font-black text-slate-700 shadow-2xs cursor-pointer active:scale-95 transition-all"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <span className="text-xs font-bold text-slate-500 ml-1">Nos</span>
                      </div>
                    </div>

                    {/* Basic Unit Price Card */}
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col justify-between">
                      <div>
                        <label className="block text-xs font-bold text-slate-700">
                          Unit Basic Price (₹)
                        </label>
                        <span className="text-[10px] text-slate-400 font-medium">Ex-Works Salem (editable)</span>
                      </div>
                      <div className="relative mt-2">
                        <span className="absolute left-3 top-2.5 text-sm font-bold text-slate-500">₹</span>
                        <input
                          type="number"
                          min={0}
                          value={p.basicPrice}
                          onChange={(e) => handleProductChange(idx, 'basicPrice', e.target.value)}
                          className="w-full pl-8 pr-3 py-2 text-sm font-mono font-black border border-slate-300 rounded-xl bg-white text-slate-900 focus:border-[#1E5BB8] outline-none shadow-inner"
                        />
                      </div>
                    </div>

                    {/* Total Basic Price Card (Highlighted) */}
                    <div className="bg-gradient-to-br from-[#F0F5FD] to-blue-50/60 p-3.5 rounded-xl border-2 border-blue-200 flex flex-col justify-between">
                      <div>
                        <span className="text-xs font-black text-[#1E5BB8] uppercase tracking-wide block">
                          Total Line Value
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {p.quantity} Unit(s) × ₹ {Number(p.basicPrice || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="text-lg font-black font-mono text-[#1E5BB8] mt-2">
                        ₹ {Number(p.totalBasicPrice || 0).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Large bottom button to add more */}
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={handleAddProduct}
              className="inline-flex items-center px-6 py-2.5 rounded-xl border-2 border-dashed border-slate-300 hover:border-[#1E5BB8] hover:bg-blue-50/40 text-slate-700 hover:text-[#1E5BB8] text-xs font-extrabold transition-all cursor-pointer shadow-2xs"
            >
              <Plus className="w-4 h-4 mr-2" /> + Add Another Switchboard Equipment Line
            </button>
          </div>
        </div>

        {/* =========================================================================
            SECTION 4.0: USER-FRIENDLY TRANSPORT, GST & PRICE SUMMARY
        ========================================================================= */}
        <div className="space-y-4 pt-2 border-t border-slate-200">
          <div className="pb-2 border-b border-slate-200">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              <h3 className="text-sm font-black text-slate-900 tracking-wide">
                4. Transport, Commercial Terms &amp; Total Price Summary
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Select delivery option and tax state. The total amount and words calculate in real-time.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-50/70 p-6 rounded-2xl border border-slate-200">
            {/* Left Column: Delivery & Basis Controls */}
            <div className="lg:col-span-7 space-y-5">
              {/* Price Basis */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-800">
                  Price Basis Terms
                </label>
                <input
                  type="text"
                  value={formData.commercialPricing.priceBasis}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      commercialPricing: { ...formData.commercialPricing, priceBasis: e.target.value }
                    })
                  }
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl bg-white font-semibold text-slate-800 focus:border-[#1E5BB8] outline-none shadow-2xs"
                />
                <span className="text-[10px] text-slate-400 font-medium">Standard works manufacturing origin</span>
              </div>

              {/* Transport Option (Friendly Cards) */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  Transport &amp; Delivery Option
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Option A: Client Own Transport */}
                  <div
                    onClick={() => {
                      const updated = recalculateCommercials(
                        formData.products,
                        'Client Own Transport (Default)',
                        0,
                        formData.commercialPricing.gstType
                      );
                      setFormData({ ...formData, commercialPricing: updated });
                    }}
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.commercialPricing.forBasis === 'Client Own Transport (Default)'
                        ? 'border-[#1E5BB8] bg-blue-50/70 text-[#1E5BB8] shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-start space-x-2.5">
                      <span className="text-xl">🚛</span>
                      <div>
                        <span className="text-xs font-black block text-slate-900">
                          Client Own Transport
                        </span>
                        <span className="text-[11px] text-emerald-700 font-bold block mt-0.5">
                          ₹ 0 (Free / Self-Arranged)
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Client arranges pickup from Salem
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Option B: Sky Power Transport */}
                  <div
                    onClick={() => {
                      const updated = recalculateCommercials(
                        formData.products,
                        'Sky Power Transport (Up and Down)',
                        20000,
                        formData.commercialPricing.gstType
                      );
                      setFormData({ ...formData, commercialPricing: updated });
                    }}
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.commercialPricing.forBasis === 'Sky Power Transport (Up and Down)'
                        ? 'border-[#1E5BB8] bg-blue-50/70 text-[#1E5BB8] shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-start space-x-2.5">
                      <span className="text-xl">🚚</span>
                      <div>
                        <span className="text-xs font-black block text-slate-900">
                          Sky Power Transport
                        </span>
                        <span className="text-[11px] text-[#1E5BB8] font-black block mt-0.5">
                          + ₹ 20,000 (Up &amp; Down)
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Direct site dispatch from Salem
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Editable Transport Price if Sky Power Transport selected */}
                {formData.commercialPricing.forBasis === 'Sky Power Transport (Up and Down)' && (
                  <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200/80 flex items-center justify-between mt-2">
                    <span className="text-xs font-bold text-slate-700">Custom Transport Price:</span>
                    <div className="relative w-36">
                      <span className="absolute left-3 top-2 text-xs font-bold text-slate-500">₹</span>
                      <input
                        type="number"
                        min={0}
                        value={formData.commercialPricing.transportPrice}
                        onChange={(e) => {
                          const newTransportPrice = parseFloat(e.target.value) || 0;
                          const updated = recalculateCommercials(
                            formData.products,
                            formData.commercialPricing.forBasis,
                            newTransportPrice,
                            formData.commercialPricing.gstType
                          );
                          setFormData({ ...formData, commercialPricing: updated });
                        }}
                        className="w-full pl-7 pr-3 py-1.5 text-xs font-mono font-black border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* GST Tax State Selection */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  GST Tax Option (Based on Delivery State)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => {
                      const updated = recalculateCommercials(
                        formData.products,
                        formData.commercialPricing.forBasis,
                        formData.commercialPricing.transportPrice,
                        'INTRA_STATE'
                      );
                      setFormData({ ...formData, commercialPricing: updated });
                    }}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.commercialPricing.gstType === 'INTRA_STATE'
                        ? 'border-[#1E5BB8] bg-blue-50/70 text-[#1E5BB8]'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="text-xs font-black block text-slate-900">📍 Tamil Nadu (Intra-State)</span>
                    <span className="text-[11px] text-slate-500 mt-0.5 block">CGST 9% + SGST 9% (18% Total)</span>
                  </div>

                  <div
                    onClick={() => {
                      const updated = recalculateCommercials(
                        formData.products,
                        formData.commercialPricing.forBasis,
                        formData.commercialPricing.transportPrice,
                        'INTER_STATE'
                      );
                      setFormData({ ...formData, commercialPricing: updated });
                    }}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.commercialPricing.gstType === 'INTER_STATE'
                        ? 'border-[#1E5BB8] bg-blue-50/70 text-[#1E5BB8]'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="text-xs font-black block text-slate-900">🌐 Other States (Inter-State)</span>
                    <span className="text-[11px] text-slate-500 mt-0.5 block">IGST 18% Total</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Clear, Friendly Financial Summary Box */}
            <div className="lg:col-span-5 bg-white p-6 rounded-2xl border-2 border-slate-200/90 shadow-sm space-y-3.5 flex flex-col justify-between">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-slate-500 block pb-2 border-b border-slate-100">
                  Quotation Price Summary
                </span>

                <div className="space-y-2 pt-2 text-xs">
                  {/* Basic Subtotal */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 font-semibold">Total Basic Price (Ex-Works):</span>
                    <span className="font-mono font-bold text-slate-900">
                      ₹ {Number(formData.commercialPricing.subTotal || 0).toLocaleString('en-IN')}
                    </span>
                  </div>

                  {/* Transport */}
                  {formData.commercialPricing.transportPrice > 0 && (
                    <div className="flex items-center justify-between text-blue-700">
                      <span className="font-semibold">+ Transport Delivery:</span>
                      <span className="font-mono font-bold">
                        ₹ {Number(formData.commercialPricing.transportPrice).toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}

                  {/* GST */}
                  {formData.commercialPricing.gstType === 'INTRA_STATE' ? (
                    <>
                      <div className="flex items-center justify-between text-slate-600">
                        <span>CGST (9%):</span>
                        <span className="font-mono font-bold">
                          ₹ {Number(formData.commercialPricing.cgstAmount || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span>SGST (9%):</span>
                        <span className="font-mono font-bold">
                          ₹ {Number(formData.commercialPricing.sgstAmount || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-between text-slate-600">
                      <span>IGST (18%):</span>
                      <span className="font-mono font-bold">
                        ₹ {Number(formData.commercialPricing.igstAmount || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-slate-600 font-bold border-t border-slate-100 pt-2">
                    <span>Total GST Tax (18%):</span>
                    <span className="font-mono font-bold text-[#EE6F2D]">
                      ₹ {Number(formData.commercialPricing.totalTaxAmount || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Big Total Payable Box */}
              <div className="p-4 bg-gradient-to-br from-emerald-500 to-teal-700 text-white rounded-xl shadow-xs">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-100 block">
                  Final Quotation Valuation
                </span>
                <div className="text-2xl font-black font-mono mt-1 text-white">
                  ₹ {Number(formData.commercialPricing.totalAmount || 0).toLocaleString('en-IN')}
                </div>
                <div className="mt-2 pt-2 border-t border-white/20 text-[11px] font-medium leading-relaxed italic text-emerald-50">
                  {formData.commercialPricing.amountInWords}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            SECTION 5.0: AUTHORIZED SALES E-SIGNATURE
        ========================================================================= */}
        <div className="space-y-4 pt-2 border-t border-slate-200">
          <div className="form-section-title flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#1E5BB8]" />
            <span>5.0 Authorized Sales Officer Digital Sign-off</span>
          </div>

          <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200">
            <ESignaturePad
              initialSignature={formData.eSignature?.signatureData}
              signerName={formData.eSignature?.signedByName || 'Rajesh Sharma'}
              designation={formData.eSignature?.designation || 'Senior Proposal & Sales Engineer'}
              onSaveSignature={(sigData) => {
                setFormData({
                  ...formData,
                  eSignature: {
                    ...formData.eSignature,
                    signatureData: sigData,
                    signedAt: new Date().toISOString()
                  }
                });
              }}
            />
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-200">
          <Link
            to="/enquiries"
            className="px-4 py-2 border border-slate-300 text-xs font-bold rounded-xl text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </Link>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleSubmit('save')}
              className="inline-flex items-center px-5 py-2.5 border border-slate-300 text-xs font-bold rounded-xl text-slate-700 hover:bg-slate-50 shadow-2xs transition-all cursor-pointer"
            >
              <Save className="w-4 h-4 mr-1.5" />
              Save Requisition Draft
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => handleSubmit('submit')}
              className="inline-flex items-center px-6 py-2.5 btn-primary text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer"
            >
              <Send className="w-4 h-4 mr-1.5" />
              {loading ? 'Processing Requisition...' : 'Submit for Admin Approval →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
