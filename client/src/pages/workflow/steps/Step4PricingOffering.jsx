import React, { useState } from 'react';
import { useWorkflow } from '../../../context/WorkflowContext';
import { Calculator, Edit3, ArrowRight, ArrowLeft, Truck, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { formatIndianCommas, parseIndianCommas } from '../../../utils/pricingRules';

export const Step4PricingOffering = () => {
  const {
    pricing,
    setPricing,
    products,
    setProducts,
    submitStep4PricingAndCreateOffering,
    prevStep,
    client,
    project,
    saving,
    error
  } = useWorkflow();

  const [editingBasicPrice, setEditingBasicPrice] = useState(false);
  const displayBasicPrice = Number(pricing.basicPrice) || (Number(products[0]?.basicPrice) || 50000);
  const [basicPriceInput, setBasicPriceInput] = useState(formatIndianCommas(displayBasicPrice));

  const totalBasic = products.reduce(
    (acc, p) => acc + (p.totalBasicPrice !== undefined ? Number(p.totalBasicPrice) : ((Number(p.basicPrice) || 0) * (Number(p.quantity) || 1))),
    0
  );
  const totalQuantity = products.reduce((acc, p) => acc + (Number(p.quantity) || 1), 0);

  const handleBasicPriceInputChange = (e) => {
    const raw = e.target.value;
    const num = parseIndianCommas(raw);
    setBasicPriceInput(raw === '' ? '' : formatIndianCommas(num));
  };

  const handleUpdateBasicPrice = () => {
    const newPrice = Math.max(0, parseIndianCommas(basicPriceInput));
    // Update all products' basicPrice and totals
    const updatedProducts = products.map((p) => ({
      ...p,
      basicPrice: newPrice,
      totalBasicPrice: newPrice * (p.quantity || 1)
    }));
    setProducts(updatedProducts);
    setPricing({
      ...pricing,
      basicPrice: newPrice
    });
    setEditingBasicPrice(false);
  };

  const handleTransportChange = (option) => {
    let price = 20000;
    if (option === 'One Way') price = 10000;
    if (option === 'Custom Amount') price = pricing.transportPrice || 0;

    setPricing({
      ...pricing,
      transportType: option,
      transportPrice: price
    });
  };

  // When FOR Basis changes: if Client Own Transport → lock basic price edit & zero out transport
  const handleForBasisChange = (basis) => {
    if (basis === 'Client Own Transport') {
      setEditingBasicPrice(false); // close any open edit panel
    }
    setPricing({ ...pricing, forBasis: basis });
  };

  const handleCreateOffering = async (e) => {
    e.preventDefault();
    await submitStep4PricingAndCreateOffering(pricing);
  };

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200/90 overflow-hidden">
      {/* Card Header */}
      <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#FFF5EE] border border-[#FCDCC9] flex items-center justify-center text-[#EE6F2D]">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-[#0A1E3F] tracking-tight">Pricing &amp; Offering</h2>
            <p className="text-xs text-slate-500 font-medium">
              Step 4: Configure commercial basic price, transport terms, and tax calculation
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono font-bold text-slate-700">
          <span className="px-2.5 py-1 rounded-md bg-blue-50 text-[#1E5BB8] border border-blue-200">
            {client.clientId || 'Client'}
          </span>
          <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
            {totalQuantity} {totalQuantity === 1 ? 'Unit' : 'Units'} Total
          </span>
        </div>
      </div>

      <div className="p-6 md:p-8 space-y-7 max-w-4xl">
        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs font-medium">
            {error}
          </div>
        )}

        {/* ============================================================
            PRICING DETAILS
            ============================================================ */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-xs font-black uppercase tracking-wider text-[#EE6F2D]">
            <span className="w-1.5 h-3.5 bg-[#EE6F2D] rounded-full" />
            <span>Pricing Details</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 p-5 bg-slate-50/70 rounded-xl border border-slate-200">
            {/* 1. Basic Price (EX-Works Salem) - Always Editable */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Basic Price (EX-Works – Salem) <span className="text-rose-500">*</span>
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-slate-500 font-bold text-xs">₹</span>
                {editingBasicPrice ? (
                  <div className="flex items-center w-full space-x-1">
                    <input
                      type="text"
                      value={basicPriceInput}
                      onChange={handleBasicPriceInputChange}
                      className="w-full pl-7 pr-2 py-2 text-xs font-mono font-bold rounded-lg border border-[#EE6F2D] bg-white focus:outline-hidden"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleUpdateBasicPrice}
                      className="px-2 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 cursor-pointer"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => {
                      setBasicPriceInput(formatIndianCommas(displayBasicPrice));
                      setEditingBasicPrice(true);
                    }}
                    className="w-full pl-7 pr-9 py-2.5 text-sm font-mono font-bold rounded-lg border border-slate-300 bg-white cursor-pointer hover:border-[#EE6F2D] transition-colors flex items-center justify-between"
                  >
                    <span>{Number(displayBasicPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    <Edit3 className="w-3.5 h-3.5 text-slate-400 hover:text-[#EE6F2D]" />
                  </div>
                )}
              </div>
            </div>

            {/* 2. Transport Charges — hidden when client uses own transport */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Transport Charges
                {pricing.forBasis === 'Client Own Transport' && (
                  <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                    Not Applicable
                  </span>
                )}
              </label>
              {pricing.forBasis === 'Client Own Transport' ? (
                <div className="flex items-center space-x-2 px-3 py-2.5 rounded-lg border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-500 font-medium">
                  <Truck className="w-3.5 h-3.5 text-slate-400" />
                  <span>Client arranges own transport — no charge applied</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-1.5">
                  <select
                    value={pricing.transportType}
                    onChange={(e) => handleTransportChange(e.target.value)}
                    className="px-2.5 py-2.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#EE6F2D]/20 focus:border-[#EE6F2D]"
                  >
                    <option value="Up & Down">Up &amp; Down (₹20k)</option>
                    <option value="One Way">One Way (₹10k)</option>
                    <option value="Custom Amount">Custom</option>
                  </select>

                  <div className="relative flex items-center">
                    <span className="absolute left-2.5 text-slate-500 font-bold text-xs">₹</span>
                    <input
                      type="number"
                      value={pricing.transportPrice}
                      onChange={(e) => setPricing({ ...pricing, transportPrice: Number(e.target.value) || 0 })}
                      className="w-full pl-6 pr-2 py-2 text-xs font-mono font-bold rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 3. FOR Basis */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                FOR Basis <span className="text-rose-500">*</span>
              </label>
              <select
                value={pricing.forBasis}
                onChange={(e) => handleForBasisChange(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#EE6F2D]/20 focus:border-[#EE6F2D]"
              >
                <option value="Client Own Transport">Client Own Transport</option>
                <option value="Sky Power Needs">Sky Power Needs</option>
              </select>
            </div>
          </div>
        </div>

        {/* GST Type Selector */}
        <div className="flex items-center space-x-4 p-3.5 bg-blue-50/50 border border-blue-200/80 rounded-xl text-xs">
          <span className="font-bold text-[#1E3A5F]">Place of Supply / GST Regime:</span>
          <label className="inline-flex items-center space-x-1.5 cursor-pointer">
            <input
              type="radio"
              name="gstType"
              value="INTRA_STATE"
              checked={pricing.gstType === 'INTRA_STATE'}
              onChange={() => setPricing({ ...pricing, gstType: 'INTRA_STATE' })}
              className="text-[#EE6F2D] focus:ring-[#EE6F2D]"
            />
            <span className="font-semibold text-slate-700">Intra-State (CGST 9% + SGST 9%) [Tamil Nadu]</span>
          </label>
          <label className="inline-flex items-center space-x-1.5 cursor-pointer">
            <input
              type="radio"
              name="gstType"
              value="INTER_STATE"
              checked={pricing.gstType === 'INTER_STATE'}
              onChange={() => setPricing({ ...pricing, gstType: 'INTER_STATE' })}
              className="text-[#EE6F2D] focus:ring-[#EE6F2D]"
            />
            <span className="font-semibold text-slate-700">Inter-State (IGST 18%)</span>
          </label>
        </div>

        {/* ============================================================
            AMOUNT SUMMARY
            ============================================================ */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-xs font-black uppercase tracking-wider text-[#EE6F2D]">
            <span className="w-1.5 h-3.5 bg-[#EE6F2D] rounded-full" />
            <span>Amount Summary</span>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Description</th>
                  <th className="py-2.5 px-4 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                <tr>
                  <td className="py-2.5 px-4">
                    Basic Price × Quantity ({Number(displayBasicPrice).toLocaleString('en-IN')} × {totalQuantity})
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono font-semibold">
                    ₹ {totalBasic.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>

                <tr>
                  <td className="py-2.5 px-4">
                    Transport
                    {pricing.forBasis === 'Client Own Transport' ? (
                      <span className="ml-2 text-[10px] text-emerald-600 font-bold">(Client Own — Not Charged)</span>
                    ) : (
                      <span className="text-slate-500"> ({pricing.transportType})</span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono font-semibold">
                    {pricing.forBasis === 'Client Own Transport' ? (
                      <span className="text-emerald-600">₹ 0.00</span>
                    ) : (
                      `₹ ${Number(pricing.transportPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                    )}
                  </td>
                </tr>

                <tr className="bg-slate-50 font-bold text-slate-900">
                  <td className="py-2.5 px-4">Subtotal</td>
                  <td className="py-2.5 px-4 text-right font-mono">
                    ₹ {Number(pricing.subTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>

                {pricing.gstType === 'INTRA_STATE' ? (
                  <>
                    <tr>
                      <td className="py-2 px-4 text-slate-600">CGST @ 9%</td>
                      <td className="py-2 px-4 text-right font-mono text-slate-600">
                        ₹ {Number(pricing.cgstAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4 text-slate-600">SGST @ 9%</td>
                      <td className="py-2 px-4 text-right font-mono text-slate-600">
                        ₹ {Number(pricing.sgstAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </>
                ) : (
                  <tr>
                    <td className="py-2 px-4 text-slate-600">IGST @ 18%</td>
                    <td className="py-2 px-4 text-right font-mono text-slate-600">
                      ₹ {Number(pricing.igstAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                )}

                {/* Final Total Amount */}
                <tr className="bg-gradient-to-r from-orange-50 to-amber-50 border-t-2 border-[#EE6F2D] font-black text-sm">
                  <td className="py-3.5 px-4 text-[#0A1E3F]">Total Amount</td>
                  <td className="py-3.5 px-4 text-right font-mono text-[#EE6F2D] text-base">
                    ₹ {Number(pricing.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ============================================================
            AMOUNT IN WORDS
            ============================================================ */}
        <div className="space-y-1.5 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="text-[11px] font-black uppercase tracking-wider text-slate-500">
            Amount In Words
          </div>
          <p className="text-xs font-bold text-[#0A1E3F] italic leading-relaxed">
            {pricing.amountInWords || 'Zero Rupees Only.'}
          </p>
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
            onClick={handleCreateOffering}
            disabled={saving}
            className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-[#EE6F2D] to-[#D95B1B] hover:from-[#E46220] hover:to-[#C65015] text-white text-sm font-bold shadow-md shadow-orange-500/20 transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            <span>{saving ? 'Creating Offering Draft...' : 'Create Offering (Draft)'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

