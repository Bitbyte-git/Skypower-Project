import React, { useState } from 'react';
import { useWorkflow } from '../../../context/WorkflowContext';
import { Cpu, Plus, Minus, Trash2, Edit2, ArrowRight, ArrowLeft, Check, Layers, AlertCircle, RotateCcw } from 'lucide-react';
import { getStandardUnitPrice, formatIndianCommas, parseIndianCommas } from '../../../utils/pricingRules';

export const Step3AddProducts = () => {
  const { products, setProducts, submitStep3Products, prevStep, client, project } = useWorkflow();

  const defaultKv = '11 kV';
  const defaultAmp = '630 A';
  const defaultUsage = 'Indoor';
  const defaultPrice = getStandardUnitPrice(defaultKv, defaultAmp, defaultUsage); // ₹ 50,000

  const [currentProduct, setCurrentProduct] = useState({
    productName: 'VCB Switchboard',
    customProductName: '',
    kilovolt: defaultKv,
    customKilovolt: '',
    ampere: defaultAmp,
    customAmpere: '',
    kiloampere: '26.3 kA',
    customKiloampere: '',
    durationSec: 'For 3 Sec',
    customDurationSec: '',
    usage: defaultUsage,
    ebMetering: 'Transformer Control',
    customEbMetering: '',
    quantity: 1,
    basicPrice: defaultPrice
  });

  const [priceInputStr, setPriceInputStr] = useState(formatIndianCommas(defaultPrice));
  const [editingIndex, setEditingIndex] = useState(null);
  const [error, setError] = useState('');

  // Auto-calculate unit price when kV, Ampere, or Usage changes
  const handleCategoryChange = (field, value) => {
    const nextProd = { ...currentProduct, [field]: value };
    const kv = field === 'kilovolt' ? value : nextProd.kilovolt;
    const amp = field === 'ampere' ? value : nextProd.ampere;
    const usage = field === 'usage' ? value : nextProd.usage;

    const dynamicRate = getStandardUnitPrice(kv, amp, usage);
    nextProd.basicPrice = dynamicRate;

    setCurrentProduct(nextProd);
    setPriceInputStr(formatIndianCommas(dynamicRate));
  };

  // User manual price input handler (formats with commas)
  const handlePriceInputChange = (e) => {
    const rawVal = e.target.value;
    const parsedNum = parseIndianCommas(rawVal);
    setCurrentProduct((prev) => ({ ...prev, basicPrice: parsedNum }));
    if (rawVal.trim() === '') {
      setPriceInputStr('');
    } else {
      setPriceInputStr(formatIndianCommas(parsedNum));
    }
  };

  // Reset to the exact standard rate for current category
  const handleResetToStandardRate = () => {
    const stdRate = getStandardUnitPrice(currentProduct.kilovolt, currentProduct.ampere, currentProduct.usage);
    setCurrentProduct((prev) => ({ ...prev, basicPrice: stdRate }));
    setPriceInputStr(formatIndianCommas(stdRate));
  };

  // Auto-generate description
  const generateDescription = (p) => {
    const pName = p.productName === 'Custom' && p.customProductName ? p.customProductName : p.productName;
    const kv = p.kilovolt === 'Custom' && p.customKilovolt ? p.customKilovolt : p.kilovolt;
    const amp = p.ampere === 'Custom' && p.customAmpere ? p.customAmpere : p.ampere;
    const ka = p.kiloampere === 'Custom' && p.customKiloampere ? p.customKiloampere : p.kiloampere;
    const dur = p.durationSec === 'Custom' && p.customDurationSec ? p.customDurationSec : p.durationSec;
    const app = p.ebMetering === 'Custom' && p.customEbMetering ? p.customEbMetering : p.ebMetering;

    return `${kv}, ${amp}, ${ka}, ${dur}, ${p.usage} ${pName} (${app})`;
  };

  const handleAddOrUpdate = (e) => {
    e.preventDefault();
    setError('');

    if (currentProduct.productName === 'Custom' && !currentProduct.customProductName.trim()) {
      setError('Please enter a custom Product Name.');
      return;
    }
    if (currentProduct.kilovolt === 'Custom' && !currentProduct.customKilovolt.trim()) {
      setError('Please enter a custom Kilovolt (kV) value.');
      return;
    }
    if (currentProduct.ampere === 'Custom' && !currentProduct.customAmpere.trim()) {
      setError('Please enter a custom Ampere (A) value.');
      return;
    }
    if (currentProduct.kiloampere === 'Custom' && !currentProduct.customKiloampere.trim()) {
      setError('Please enter a custom Short Circuit (kA) value.');
      return;
    }
    if (currentProduct.durationSec === 'Custom' && !currentProduct.customDurationSec.trim()) {
      setError('Please enter a custom Duration (Sec) value.');
      return;
    }
    if (currentProduct.ebMetering === 'Custom' && !currentProduct.customEbMetering.trim()) {
      setError('Please enter a custom Application.');
      return;
    }

    const desc = generateDescription(currentProduct);
    const basicPrice = Number(currentProduct.basicPrice) || 0;
    const qty = Math.max(1, Number(currentProduct.quantity) || 1);
    const totalBasicPrice = basicPrice * qty;

    const newProductObj = {
      ...currentProduct,
      id: editingIndex !== null ? products[editingIndex].id : `prod-${Date.now()}`,
      productDescription: desc,
      basicPrice,
      quantity: qty,
      totalBasicPrice
    };

    if (editingIndex !== null) {
      const updated = [...products];
      updated[editingIndex] = newProductObj;
      setProducts(updated);
      setEditingIndex(null);
    } else {
      setProducts([...products, newProductObj]);
    }

    // Reset form to defaults starting from ₹ 50,000
    const resetPrice = getStandardUnitPrice(defaultKv, defaultAmp, defaultUsage);
    setCurrentProduct({
      productName: 'VCB Switchboard',
      customProductName: '',
      kilovolt: defaultKv,
      customKilovolt: '',
      ampere: defaultAmp,
      customAmpere: '',
      kiloampere: '26.3 kA',
      customKiloampere: '',
      durationSec: 'For 3 Sec',
      customDurationSec: '',
      usage: defaultUsage,
      ebMetering: 'Transformer Control',
      customEbMetering: '',
      quantity: 1,
      basicPrice: resetPrice
    });
    setPriceInputStr(formatIndianCommas(resetPrice));
  };

  const handleEdit = (idx) => {
    setEditingIndex(idx);
    const p = products[idx];
    setCurrentProduct(p);
    setPriceInputStr(formatIndianCommas(p.basicPrice));
  };

  const handleDelete = (idx) => {
    const updated = products.filter((_, i) => i !== idx);
    setProducts(updated);
    if (editingIndex === idx) {
      setEditingIndex(null);
    }
  };

  const handleUpdateQty = (idx, delta) => {
    const updated = [...products];
    const newQty = Math.max(1, (updated[idx].quantity || 1) + delta);
    updated[idx].quantity = newQty;
    updated[idx].totalBasicPrice = (Number(updated[idx].basicPrice) || 0) * newQty;
    setProducts(updated);
  };

  const handleNext = () => {
    setError('');
    if (products.length === 0) {
      setError('At least one product must be added to the project before proceeding.');
      return;
    }
    submitStep3Products(products);
  };

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200/90 overflow-hidden">
      {/* Card Header */}
      <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#FFF5EE] border border-[#FCDCC9] flex items-center justify-center text-[#EE6F2D]">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-[#0A1E3F] tracking-tight">Product Configuration</h2>
            <p className="text-xs text-slate-500 font-medium">
              Step 3: Add multiple products under <strong>{project.projectName || 'Project'}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
            {products.length} {products.length === 1 ? 'Product' : 'Products'} Configured
          </span>
        </div>
      </div>

      <div className="p-6 md:p-8 space-y-8">
        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs font-medium flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ============================================================
            ADD PRODUCT FORM
            ============================================================ */}
        <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-black uppercase tracking-wider text-[#EE6F2D]">
              <span className="w-1.5 h-3.5 bg-[#EE6F2D] rounded-full" />
              <span>{editingIndex !== null ? 'Edit Product Details' : 'Product Details (Add Multiple Products)'}</span>
            </div>
            {editingIndex !== null && (
              <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
                Editing Item #{editingIndex + 1}
              </span>
            )}
          </div>

          <form onSubmit={handleAddOrUpdate}>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {/* 1. Product Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Product Name <span className="text-rose-500">*</span>
                </label>
                <select
                  value={currentProduct.productName}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, productName: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#EE6F2D]/20 focus:border-[#EE6F2D]"
                >
                  <option value="VCB Switchboard">VCB Switchboard</option>
                  <option value="Custom">Custom</option>
                </select>
                {currentProduct.productName === 'Custom' && (
                  <input
                    type="text"
                    placeholder="Custom Product Name"
                    value={currentProduct.customProductName}
                    onChange={(e) => setCurrentProduct({ ...currentProduct, customProductName: e.target.value })}
                    className="w-full mt-1.5 px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                  />
                )}
              </div>

              {/* 2. Kilovolt (kV) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Kilovolt (kV) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={currentProduct.kilovolt}
                  onChange={(e) => handleCategoryChange('kilovolt', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#EE6F2D]/20 focus:border-[#EE6F2D]"
                >
                  <option value="11 kV">11 kV</option>
                  <option value="22 kV">22 kV</option>
                  <option value="33 kV">33 kV</option>
                  <option value="Custom">Custom</option>
                </select>
                {currentProduct.kilovolt === 'Custom' && (
                  <div className="mt-1.5 flex items-center rounded-lg border border-slate-300 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-[#EE6F2D]/20 focus-within:border-[#EE6F2D]">
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="e.g. 6.6"
                      value={(currentProduct.customKilovolt || '').replace(/\s*kV$/i, '')}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9.]/g, '');
                        setCurrentProduct({ ...currentProduct, customKilovolt: raw ? `${raw} kV` : '' });
                      }}
                      className="w-full px-3 py-1.5 text-xs bg-transparent focus:outline-hidden"
                    />
                    <span className="px-2.5 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 border-l border-slate-200 select-none shrink-0">
                      kV
                    </span>
                  </div>
                )}
              </div>

              {/* 3. Ampere (A) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Ampere (A) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={currentProduct.ampere}
                  onChange={(e) => handleCategoryChange('ampere', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#EE6F2D]/20 focus:border-[#EE6F2D]"
                >
                  <option value="630 A">630 A</option>
                  <option value="800 A">800 A</option>
                  <option value="1250 A">1250 A</option>
                  <option value="Custom">Custom</option>
                </select>
                {currentProduct.ampere === 'Custom' && (
                  <div className="mt-1.5 flex items-center rounded-lg border border-slate-300 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-[#EE6F2D]/20 focus-within:border-[#EE6F2D]">
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="e.g. 2000"
                      value={(currentProduct.customAmpere || '').replace(/\s*A$/i, '')}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9.]/g, '');
                        setCurrentProduct({ ...currentProduct, customAmpere: raw ? `${raw} A` : '' });
                      }}
                      className="w-full px-3 py-1.5 text-xs bg-transparent focus:outline-hidden"
                    />
                    <span className="px-2.5 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 border-l border-slate-200 select-none shrink-0">
                      A
                    </span>
                  </div>
                )}
              </div>

              {/* 4. Short Circuit (kA) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Short Circuit (kA) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={currentProduct.kiloampere}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, kiloampere: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#EE6F2D]/20 focus:border-[#EE6F2D]"
                >
                  <option value="25 kA">25 kA</option>
                  <option value="26.3 kA">26.3 kA</option>
                  <option value="Custom">Custom</option>
                </select>
                {currentProduct.kiloampere === 'Custom' && (
                  <div className="mt-1.5 flex items-center rounded-lg border border-slate-300 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-[#EE6F2D]/20 focus-within:border-[#EE6F2D]">
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="e.g. 31.5"
                      value={(currentProduct.customKiloampere || '').replace(/\s*kA$/i, '')}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9.]/g, '');
                        setCurrentProduct({ ...currentProduct, customKiloampere: raw ? `${raw} kA` : '' });
                      }}
                      className="w-full px-3 py-1.5 text-xs bg-transparent focus:outline-hidden"
                    />
                    <span className="px-2.5 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 border-l border-slate-200 select-none shrink-0">
                      kA
                    </span>
                  </div>
                )}
              </div>

              {/* 5. Duration (Sec) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Duration (Sec) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={currentProduct.durationSec}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, durationSec: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#EE6F2D]/20 focus:border-[#EE6F2D]"
                >
                  <option value="For 3 Sec">3 Sec</option>
                  <option value="For 1 Sec">1 Sec</option>
                  <option value="Custom">Custom</option>
                </select>
                {currentProduct.durationSec === 'Custom' && (
                  <div className="mt-1.5 flex items-center rounded-lg border border-slate-300 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-[#EE6F2D]/20 focus-within:border-[#EE6F2D]">
                    <span className="px-2.5 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 border-r border-slate-200 select-none shrink-0">
                      For
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="e.g. 5"
                      value={(currentProduct.customDurationSec || '').replace(/^For\s*/i, '').replace(/\s*Sec$/i, '')}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9.]/g, '');
                        setCurrentProduct({ ...currentProduct, customDurationSec: raw ? `For ${raw} Sec` : '' });
                      }}
                      className="w-full px-2.5 py-1.5 text-xs bg-transparent focus:outline-hidden"
                    />
                    <span className="px-2.5 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 border-l border-slate-200 select-none shrink-0">
                      Sec
                    </span>
                  </div>
                )}
              </div>

              {/* 6. Usage */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Usage <span className="text-rose-500">*</span>
                </label>
                <select
                  value={currentProduct.usage}
                  onChange={(e) => handleCategoryChange('usage', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#EE6F2D]/20 focus:border-[#EE6F2D]"
                >
                  <option value="Indoor">Indoor</option>
                  <option value="Outdoor">Outdoor</option>
                </select>
              </div>

              {/* 7. Application / EB Metering */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  EB Metering / Application <span className="text-rose-500">*</span>
                </label>
                <select
                  value={currentProduct.ebMetering}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, ebMetering: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#EE6F2D]/20 focus:border-[#EE6F2D]"
                >
                  <option value="Transformer Control">Transformer Control</option>
                  <option value="Point of Supply">Point of Supply</option>
                  <option value="EB Metering">EB Metering</option>
                  <option value="Custom">Custom</option>
                </select>
                {currentProduct.ebMetering === 'Custom' && (
                  <input
                    type="text"
                    placeholder="Custom Application"
                    value={currentProduct.customEbMetering}
                    onChange={(e) => setCurrentProduct({ ...currentProduct, customEbMetering: e.target.value })}
                    className="w-full mt-1.5 px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                  />
                )}
              </div>

              {/* 8. Quantity Counter */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Quantity <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={() => setCurrentProduct({ ...currentProduct, quantity: Math.max(1, currentProduct.quantity - 1) })}
                    className="w-8 h-8 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 flex items-center justify-center text-slate-700 cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={currentProduct.quantity}
                    onChange={(e) => setCurrentProduct({ ...currentProduct, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                    className="w-14 text-center py-1.5 text-xs font-bold rounded-lg border border-slate-300 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setCurrentProduct({ ...currentProduct, quantity: currentProduct.quantity + 1 })}
                    className="w-8 h-8 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 flex items-center justify-center text-slate-700 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* 9. Unit Basic Price (₹) with Category Standard & Indian Commas */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">
                    Unit Basic Price (₹) <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Std: ₹ {formatIndianCommas(getStandardUnitPrice(currentProduct.kilovolt, currentProduct.ampere, currentProduct.usage))}
                  </span>
                </div>
                <div className="relative flex items-center">
                  <span className="absolute left-2.5 text-slate-500 font-bold text-xs">₹</span>
                  <input
                    type="text"
                    placeholder="e.g. 50,000"
                    value={priceInputStr}
                    onChange={handlePriceInputChange}
                    className="w-full pl-6 pr-2 py-2 text-xs font-mono font-bold rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#EE6F2D]/20 focus:border-[#EE6F2D]"
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                  <span>Formatted with commas</span>
                  {currentProduct.basicPrice !== getStandardUnitPrice(currentProduct.kilovolt, currentProduct.ampere, currentProduct.usage) && (
                    <button
                      type="button"
                      onClick={handleResetToStandardRate}
                      className="text-[#EE6F2D] hover:underline font-bold flex items-center space-x-1 cursor-pointer"
                    >
                      <RotateCcw className="w-2.5 h-2.5" />
                      <span>Reset to Std</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Add Button */}
            <div className="mt-4 flex justify-end space-x-3">
              {editingIndex !== null && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingIndex(null);
                    const resetRate = getStandardUnitPrice(defaultKv, defaultAmp, defaultUsage);
                    setCurrentProduct({
                      productName: 'VCB Switchboard',
                      customProductName: '',
                      kilovolt: defaultKv,
                      customKilovolt: '',
                      ampere: defaultAmp,
                      customAmpere: '',
                      kiloampere: '26.3 kA',
                      customKiloampere: '',
                      durationSec: 'For 3 Sec',
                      customDurationSec: '',
                      usage: defaultUsage,
                      ebMetering: 'Transformer Control',
                      customEbMetering: '',
                      quantity: 1,
                      basicPrice: resetRate
                    });
                    setPriceInputStr(formatIndianCommas(resetRate));
                  }}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600 text-xs font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Cancel Edit
                </button>
              )}
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-[#EE6F2D] hover:bg-[#D95B1B] text-white text-xs font-bold shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{editingIndex !== null ? 'Update Product' : '+ Add Product'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* ============================================================
            ADDED PRODUCTS TABLE
            ============================================================ */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Added Products ({products.length})
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">Multiple products supported under one project</span>
          </div>

          {products.length === 0 ? (
            <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-xs font-medium">
              No products configured yet. Use the configuration form above to add products.
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold">
                    <th className="py-2.5 px-3 w-10 text-center">#</th>
                    <th className="py-2.5 px-4">Product Description</th>
                    <th className="py-2.5 px-3 text-right">Unit Price (₹)</th>
                    <th className="py-2.5 px-3 w-28 text-center">Quantity</th>
                    <th className="py-2.5 px-3 text-right">Total (₹)</th>
                    <th className="py-2.5 px-3 w-24 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((p, idx) => (
                    <tr key={p.id || idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 text-center font-bold text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-800 text-xs leading-relaxed">
                          {p.productDescription || generateDescription(p)}
                        </p>
                        <span className="inline-block mt-0.5 text-[10px] font-mono text-slate-400">
                          {p.kilovolt === 'Custom' && p.customKilovolt ? p.customKilovolt : p.kilovolt} •{' '}
                          {p.ampere === 'Custom' && p.customAmpere ? p.customAmpere : p.ampere} •{' '}
                          {p.kiloampere === 'Custom' && p.customKiloampere ? p.customKiloampere : p.kiloampere} •{' '}
                          {p.durationSec === 'Custom' && p.customDurationSec ? p.customDurationSec : p.durationSec} •{' '}
                          {p.usage}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-700">
                        ₹ {Number(p.basicPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex items-center space-x-1.5 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(idx, -1)}
                            className="w-4 h-4 rounded-sm flex items-center justify-center text-slate-500 hover:text-slate-800 cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-mono font-bold text-slate-800 text-xs w-6 text-center">
                            {p.quantity || 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(idx, 1)}
                            className="w-4 h-4 rounded-sm flex items-center justify-center text-slate-500 hover:text-slate-800 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-black text-[#1E5BB8]">
                        ₹ {Number(p.totalBasicPrice || ((p.basicPrice || 0) * (p.quantity || 1))).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(idx)}
                            className="p-1.5 rounded-md text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(idx)}
                            className="p-1.5 rounded-md text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

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
            onClick={handleNext}
            className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-[#EE6F2D] to-[#D95B1B] hover:from-[#E46220] hover:to-[#C65015] text-white text-sm font-bold shadow-md shadow-orange-500/20 transition-all flex items-center space-x-2 cursor-pointer"
          >
            <span>Next: Pricing &amp; Offering</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

