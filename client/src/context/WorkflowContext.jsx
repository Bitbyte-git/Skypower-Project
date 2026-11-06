import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';
import { numberToWords } from '../utils/numberToWords';

const WorkflowContext = createContext(null);

export const useWorkflow = () => {
  const context = useContext(WorkflowContext);
  if (!context) {
    throw new Error('useWorkflow must be used within a WorkflowProvider');
  }
  return context;
};

const STORAGE_KEY = 'skypower_workflow_state_v1';

export const WorkflowProvider = ({ children, initialEnquiryId = null }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [enquiryId, setEnquiryId] = useState(initialEnquiryId);
  const [ern, setErn] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Client State
  const [clientMode, setClientMode] = useState('new'); // 'new' | 'existing'
  const [client, setClient] = useState({
    _id: '',
    clientId: '',
    companyName: '',
    customerType: 'Contractor',
    contactPerson: '',
    mobile: '',
    email: '',
    siteAddress: ''
  });

  // Step 2: Project State
  const [project, setProject] = useState({
    standardType: 'Standard',
    projectName: '',
    segment: 'Renewable',
    subSegment: 'Wind',
    customSubSegment: ''
  });

  // Step 3: Products (Multiple Products) — start empty; user adds products from scratch
  const [products, setProducts] = useState([]);

  // Step 4: Pricing & Offering — starts at 0, configured dynamically
  const [pricing, setPricing] = useState({
    basicPrice: 0,
    transportType: 'Up & Down',
    transportPrice: 0,
    forBasis: 'Client Own Transport',
    gstType: 'INTRA_STATE',
    cgstRate: 9,
    sgstRate: 9,
    igstRate: 18,
    subTotal: 0,
    cgstAmount: 0,
    sgstAmount: 0,
    igstAmount: 0,
    totalTaxAmount: 0,
    totalAmount: 0,
    amountInWords: 'Zero Rupees Only.'
  });

  // Step 5: Offering Versions & History
  const [currentVersion, setCurrentVersion] = useState('OFR-001');
  const [revisions, setRevisions] = useState([]);

  // Step 6: PO Handover
  const [poData, setPoData] = useState(null);

  // Recalculate Pricing dynamically whenever products, transport, forBasis, or GST change
  useEffect(() => {
    const totalBasic = products.reduce(
      (acc, p) => acc + (p.totalBasicPrice !== undefined ? Number(p.totalBasicPrice) : ((Number(p.basicPrice) || 0) * (Number(p.quantity) || 1))),
      0
    );
    // When client arranges their own transport, Sky Power does NOT charge transport fees
    const isClientOwnTransport = pricing.forBasis === 'Client Own Transport';
    const transport = isClientOwnTransport ? 0 : (Number(pricing.transportPrice) || 0);
    const subTotal = totalBasic + transport;

    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;
    let totalTax = 0;

    if (pricing.gstType === 'INTRA_STATE') {
      cgstAmount = Math.round(subTotal * (pricing.cgstRate / 100));
      sgstAmount = Math.round(subTotal * (pricing.sgstRate / 100));
      totalTax = cgstAmount + sgstAmount;
    } else {
      igstAmount = Math.round(subTotal * (pricing.igstRate / 100));
      totalTax = igstAmount;
    }

    const totalAmount = subTotal + totalTax;
    const words = numberToWords(totalAmount);

    setPricing((prev) => ({
      ...prev,
      subTotal,
      cgstAmount,
      sgstAmount,
      igstAmount,
      totalTaxAmount: totalTax,
      totalAmount,
      amountInWords: words
    }));
  }, [products, pricing.transportPrice, pricing.forBasis, pricing.gstType]);

  // Load existing enquiry if initialEnquiryId provided
  useEffect(() => {
    if (initialEnquiryId) {
      loadEnquiry(initialEnquiryId);
    }
  }, [initialEnquiryId]);

  const loadEnquiry = async (id) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/workflow/enquiry/${id}`);
      if (res.success && res.enquiry) {
        const eq = res.enquiry;
        setEnquiryId(eq._id);
        setErn(eq.ern);

        if (eq.clientId) {
          setClient({
            _id: eq.clientId._id,
            clientId: eq.clientCustomId || eq.clientId.clientId || 'SP-CL-2026-0001',
            companyName: eq.clientId.companyName || '',
            customerType: eq.clientId.customerType || 'Contractor',
            contactPerson: eq.clientId.contactPerson || '',
            mobile: eq.clientId.mobile || '',
            email: eq.clientId.email || '',
            siteAddress: eq.clientId.siteAddress || ''
          });
          setClientMode('existing');
        }

        if (eq.project) {
          setProject({
            standardType: eq.project.standardType || 'Standard',
            projectName: eq.project.projectName || '',
            segment: eq.project.segment || 'Renewable',
            subSegment: eq.project.subSegment || 'Wind',
            customSubSegment: eq.project.customSubSegment || ''
          });
        }

        if (eq.products && eq.products.length > 0) {
          setProducts(
            eq.products.map((p, idx) => ({
              ...p,
              id: p._id || `prod-loaded-${idx}`,
              basicPrice: p.basicPrice !== undefined ? Number(p.basicPrice) : 0,
              quantity: Number(p.quantity) || 1,
              totalBasicPrice: (p.basicPrice !== undefined ? Number(p.basicPrice) : 0) * (Number(p.quantity) || 1)
            }))
          );
        }

        if (eq.commercialPricing) {
          setPricing((prev) => ({
            ...prev,
            ...eq.commercialPricing
          }));
        }

        if (eq.currentOfferingVersion) {
          setCurrentVersion(eq.currentOfferingVersion);
        }

        if (eq.offeringRevisions && eq.offeringRevisions.length > 0) {
          setRevisions(eq.offeringRevisions);
        }

        if (eq.poDetails?.poId) {
          setPoData(eq.poDetails);
        }
      }
    } catch (err) {
      console.error('Failed to load enquiry workflow:', err);
      setError(err.message || 'Could not load existing enquiry workflow.');
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Save Client
  const submitStep1Client = async (clientPayload) => {
    setSaving(true);
    setError('');
    try {
      const res = await api.post('/workflow/client', clientPayload);
      if (res.success && res.client) {
        setClient({
          _id: res.client._id,
          clientId: res.client.clientId,
          name: res.client.name || res.client.clientName || '',
          clientName: res.client.clientName || res.client.name || '',
          companyName: res.client.companyName,
          customerType: res.client.customerType,
          contactPerson: res.client.contactPerson,
          mobile: res.client.mobile,
          email: res.client.email || '',
          siteAddress: res.client.siteAddress || ''
        });
        setCurrentStep(2);
        return res.client;
      }
    } catch (err) {
      setError(err.message || 'Error registering / selecting client.');
      throw err;
    } finally {
      setSaving(false);
    }
  };

  // Step 2 -> Step 3: Save Project
  const submitStep2Project = async (projectPayload) => {
    setProject(projectPayload);
    setCurrentStep(3);
  };

  // Step 3 -> Step 4: Save Products
  const submitStep3Products = async (productsPayload) => {
    setProducts(productsPayload);
    const benchmark = productsPayload && productsPayload.length > 0 ? Number(productsPayload[0].basicPrice) || 50000 : 50000;
    setPricing((prev) => ({
      ...prev,
      basicPrice: prev.basicPrice > 0 ? prev.basicPrice : benchmark
    }));
    setCurrentStep(4);
  };

  // Step 4 -> Step 5: Save Pricing & Create Offering Draft
  const submitStep4PricingAndCreateOffering = async (pricingPayload) => {
    setSaving(true);
    setError('');
    try {
      const finalPricing = { ...pricing, ...pricingPayload };
      setPricing(finalPricing);

      const payload = {
        enquiryId,
        clientId: client._id,
        clientData: client,
        project,
        products,
        commercialPricing: finalPricing,
        step: 4
      };

      const res = await api.post('/workflow/draft', payload);
      if (res.success && res.enquiry) {
        setEnquiryId(res.enquiry._id);
        setErn(res.enquiry.ern);
        if (res.enquiry.offeringRevisions) {
          setRevisions(res.enquiry.offeringRevisions);
        }
        if (res.enquiry.currentOfferingVersion) {
          setCurrentVersion(res.enquiry.currentOfferingVersion);
        }
        setCurrentStep(5);
        return res.enquiry;
      }
    } catch (err) {
      setError(err.message || 'Error creating offering draft.');
      throw err;
    } finally {
      setSaving(false);
    }
  };

  // Step 5: Create Revision (e.g. OFR-002, OFR-003)
  const submitNewRevision = async (changeSummary, revisedProducts, revisedPricing) => {
    setSaving(true);
    setError('');
    try {
      let activeEnquiryId = enquiryId;
      if (!activeEnquiryId) {
        const payload = {
          clientId: client._id,
          clientData: client,
          project,
          products,
          commercialPricing: pricing,
          step: 4
        };
        const draftRes = await api.post('/workflow/draft', payload);
        if (draftRes.success && draftRes.enquiry) {
          activeEnquiryId = draftRes.enquiry._id;
          setEnquiryId(activeEnquiryId);
          setErn(draftRes.enquiry.ern);
        }
      }

      const res = await api.post('/workflow/offering-revision', {
        enquiryId: activeEnquiryId,
        changeSummary,
        revisedProducts: revisedProducts || products,
        revisedPricing: revisedPricing || pricing
      });

      if (res.success) {
        setCurrentVersion(res.currentVersionId);
        setRevisions(res.revisions || res.enquiry?.offeringRevisions || []);
        if (revisedProducts) setProducts(revisedProducts);
        if (revisedPricing) setPricing((prev) => ({ ...prev, ...revisedPricing }));
        return res;
      }
    } catch (err) {
      setError(err.message || 'Error creating revision.');
      throw err;
    } finally {
      setSaving(false);
    }
  };

  // Step 5: Send Offering to Client
  const sendOffering = async (versionId) => {
    setSaving(true);
    setError('');
    try {
      let activeEnquiryId = enquiryId;
      if (!activeEnquiryId) {
        const payload = {
          clientId: client._id,
          clientData: client,
          project,
          products,
          commercialPricing: pricing,
          step: 4
        };
        const draftRes = await api.post('/workflow/draft', payload);
        if (draftRes.success && draftRes.enquiry) {
          activeEnquiryId = draftRes.enquiry._id;
          setEnquiryId(activeEnquiryId);
          setErn(draftRes.enquiry.ern);
        }
      }

      const res = await api.post('/workflow/offering-send', {
        enquiryId: activeEnquiryId,
        versionId: versionId || currentVersion
      });
      if (res.success) {
        if (res.enquiry?.offeringRevisions) {
          setRevisions(res.enquiry.offeringRevisions);
        }
        return res;
      }
    } catch (err) {
      setError(err.message || 'Error sending offering to client.');
      throw err;
    } finally {
      setSaving(false);
    }
  };

  // Step 6: Finalize & Send to PO Team
  const submitFinalizeToPO = async () => {
    setSaving(true);
    setError('');
    try {
      let activeEnquiryId = enquiryId;
      if (!activeEnquiryId) {
        const payload = {
          clientId: client._id,
          clientData: client,
          project,
          products,
          commercialPricing: pricing,
          step: 5
        };
        const draftRes = await api.post('/workflow/draft', payload);
        if (draftRes.success && draftRes.enquiry) {
          activeEnquiryId = draftRes.enquiry._id;
          setEnquiryId(activeEnquiryId);
          setErn(draftRes.enquiry.ern);
        }
      }

      const res = await api.post('/workflow/finalize-to-po', {
        enquiryId: activeEnquiryId,
        offeringVersionId: currentVersion
      });
      if (res.success) {
        setPoData({
          poId: res.poId,
          clientId: res.clientId,
          offeringVersionId: res.offeringVersionId,
          submittedAt: res.submittedAt
        });
        setCurrentStep(6);
        return res;
      }
    } catch (err) {
      setError(err.message || 'Error submitting to PO Team.');
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const nextStep = () => {
    setCurrentStep((prev) => Math.min(6, prev + 1));
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const goToStep = (targetStep) => {
    if (targetStep >= 1 && targetStep <= 6) {
      setCurrentStep(targetStep);
    }
  };

  const value = {
    currentStep,
    setCurrentStep,
    goToStep,
    nextStep,
    prevStep,
    enquiryId,
    ern,
    loading,
    saving,
    error,
    setError,

    // Step 1
    clientMode,
    setClientMode,
    client,
    setClient,
    submitStep1Client,

    // Step 2
    project,
    setProject,
    submitStep2Project,

    // Step 3
    products,
    setProducts,
    submitStep3Products,

    // Step 4
    pricing,
    setPricing,
    submitStep4PricingAndCreateOffering,

    // Step 5
    currentVersion,
    setCurrentVersion,
    revisions,
    setRevisions,
    submitNewRevision,
    sendOffering,

    // Step 6
    poData,
    submitFinalizeToPO,

    loadEnquiry
  };

  return <WorkflowContext.Provider value={value}>{children}</WorkflowContext.Provider>;
};

