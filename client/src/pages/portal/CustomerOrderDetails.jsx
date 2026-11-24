import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/client';
import {
  Package,
  Calendar,
  MapPin,
  Clock,
  ArrowLeft,
  FileCheck2,
  CreditCard,
  Cpu,
  Download,
  AlertCircle,
  CheckCircle2,
  Layers,
  ShieldCheck,
  Building2
} from 'lucide-react';

export const CustomerOrderDetails = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await api.get(`/portal/orders/${id}`);
        if (res.success) {
          setOrder(res.order);
        } else {
          setError(res.message || 'Order not found.');
        }
      } catch (err) {
        setError(err.message || 'Failed to retrieve order details.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-500 font-semibold">Retrieving order specifications and tracking...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-8 bg-rose-50 border border-rose-200 rounded-3xl text-rose-800 text-xs space-y-3">
        <div className="flex items-center space-x-2 font-bold text-sm">
          <AlertCircle className="w-5 h-5 text-rose-600" />
          <span>Access Restricted or Order Not Found</span>
        </div>
        <p>{error || 'This order record could not be loaded.'}</p>
        <Link to="/portal/orders" className="text-blue-600 font-bold hover:underline inline-block pt-2">
          ← Return to My Orders
        </Link>
      </div>
    );
  }

  const primaryProduct = order.products?.[0] || {};
  const stages = order.stages || [];
  const drawings = order.drawings || [];
  const payments = order.payments || [];
  const financials = order.financials || {};

  return (
    <div className="space-y-8 pb-20">
      {/* 1. Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-start space-x-4">
            <Link
              to="/portal/orders"
              className="p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500 mt-1 transition-colors"
              title="Return to Orders"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xl font-black text-slate-900 tracking-tight">
                  {order.orderNumber}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
                  {order.status}
                </span>
              </div>
              <h1 className="text-base font-bold text-slate-900 mt-1">{order.projectTitle}</h1>
              <p className="text-xs text-slate-500">
                Customer PO Ref: <strong className="text-slate-800">{order.customerPO || 'Direct Work Order'}</strong> • Ordered on {new Date(order.orderDate).toLocaleDateString('en-IN')}
              </p>
            </div>
          </div>

          {/* Financial summary badges */}
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-right">
              <span className="text-slate-400 text-[11px] block">Contract Amount</span>
              <span className="font-mono font-black text-slate-900 text-sm">
                ₹ {Number(financials.totalAmount || 0).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-100 text-right">
              <span className="text-emerald-700 text-[11px] block font-bold">Cleared Payments</span>
              <span className="font-mono font-bold text-emerald-800 text-sm">
                ₹ {Number(financials.totalPaid || 0).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-right">
              <span className="text-slate-400 text-[11px] block">Pending Balance</span>
              <span className="font-mono font-bold text-slate-800 text-sm">
                ₹ {Number(financials.pendingBalance || 0).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-1">
          <div>
            <span className="text-slate-400 block text-[11px]">Expected Delivery Date</span>
            <span className="font-bold text-slate-800 flex items-center mt-0.5">
              <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
              {order.expectedDeliveryDate
                ? new Date(order.expectedDeliveryDate).toLocaleDateString('en-IN')
                : 'Confirmed upon drawing clearance'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Delivery Terms &amp; Scope</span>
            <span className="font-bold text-slate-800 mt-0.5 block">{order.deliveryTerms}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Site Delivery Destination</span>
            <span className="font-medium text-slate-700 mt-0.5 block truncate flex items-center">
              <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0" />
              {order.siteAddress || 'Works, Tamil Nadu'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Visual Order Progress Timeline */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 space-y-6">
        <div>
          <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center">
            <Clock className="w-5 h-5 text-blue-600 mr-2" />
            Manufacturing &amp; Quality Clearance Milestone Pipeline
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            10-stage switchgear manufacturing workflow updated live from Sky Power production management.
          </p>
        </div>

        {/* Horizontal Milestone Timeline */}
        <div className="relative pl-6 space-y-8 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
          {stages.map((stage) => {
            const isCompleted = stage.status === 'COMPLETED';
            const isInProgress = stage.status === 'IN_PROGRESS';

            return (
              <div key={stage.sequence} className="relative flex items-start space-x-4">
                {/* Node indicator */}
                <div
                  className={`absolute -left-6 top-1 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-white ${
                    isCompleted
                      ? 'bg-emerald-600 text-white'
                      : isInProgress
                      ? 'bg-blue-600 text-white animate-pulse'
                      : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <span className="text-[10px] font-bold">{stage.sequence}</span>
                  )}
                </div>

                <div className="flex-1 bg-slate-50/70 p-4 rounded-2xl border border-slate-100 space-y-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900 text-sm">
                        Stage {stage.sequence}: {stage.title}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          isCompleted
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : isInProgress
                            ? 'bg-blue-50 text-blue-800 border-blue-300'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {isCompleted ? 'Completed' : isInProgress ? 'In Progress' : 'Pending'}
                      </span>
                    </div>

                    {stage.completedAt && (
                      <span className="text-[11px] text-slate-400 font-mono">
                        {new Date(stage.completedAt).toLocaleDateString('en-IN')}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600">{stage.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Switchgear Technical Specifications */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 space-y-5">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-sky-600" />
            <h2 className="text-base font-black text-slate-900 tracking-tight">
              Switchgear Electrical &amp; Mechanical Ratings
            </h2>
          </div>
          <span className="text-xs font-bold text-slate-400">Customer Specification Sheet</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block text-[11px]">Equipment Type</span>
            <span className="font-bold text-slate-900">{primaryProduct.productName || '11kV VCB Switchboard'}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block text-[11px]">System Voltage Rating</span>
            <span className="font-bold text-slate-900">{primaryProduct.voltageRating || '11 kV'}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block text-[11px]">Continuous Rated Current</span>
            <span className="font-bold text-slate-900">{primaryProduct.currentRating || '630 A'}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block text-[11px]">Short-Circuit Breaking Capacity</span>
            <span className="font-bold text-slate-900">{primaryProduct.breakingCapacity || '26.3 kA'}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block text-[11px]">Short-Circuit Duration</span>
            <span className="font-bold text-slate-900">{primaryProduct.durationSec || '3 Seconds'}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block text-[11px]">Enclosure &amp; Installation</span>
            <span className="font-bold text-slate-900">{primaryProduct.usage || 'Indoor Metal-Clad'}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block text-[11px]">Current Transformer (CT) Spec</span>
            <span className="font-bold text-slate-900">{primaryProduct.ctSpecification || 'Dual Ratio Class 0.5s / 5P10'}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block text-[11px]">Voltage Transformer (PT) Spec</span>
            <span className="font-bold text-slate-900">{primaryProduct.ptSpecification || '11000/sqrt(3) V : 110/sqrt(3) V'}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block text-[11px]">Protection Relay</span>
            <span className="font-bold text-slate-900">{primaryProduct.relaySpecification || 'Numerical Overcurrent & Earth Fault'}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block text-[11px]">Digital Energy Metering</span>
            <span className="font-bold text-slate-900">{primaryProduct.meteringSpecification || 'Class 0.5s RS-485 Modbus MFM'}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block text-[11px]">Quantity Ordered</span>
            <span className="font-bold text-slate-900">{primaryProduct.quantity || 1} {primaryProduct.unit || 'Nos'}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block text-[11px]">Panel Mechanical Type</span>
            <span className="font-bold text-slate-900">{primaryProduct.panelType || 'Floor-Mounted Drawout VCB'}</span>
          </div>
        </div>
      </div>

      {/* 4. Engineering Drawings & Documents for this Order */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <FileCheck2 className="w-5 h-5 text-purple-600" />
            <h2 className="text-base font-black text-slate-900 tracking-tight">
              Order Technical Drawings ({drawings.length})
            </h2>
          </div>
          <span className="text-xs text-slate-400">PDF &amp; CAD Layouts</span>
        </div>

        <div className="divide-y divide-slate-100">
          {drawings.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              Technical switchgear drawings are currently being generated by our design engineers.
            </p>
          ) : (
            drawings.map((dwg) => (
              <div key={dwg._id} className="py-3.5 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-blue-700">{dwg.drawingNumber}</span>
                    <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                      {dwg.currentRevision}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
                      {dwg.status}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 mt-1">{dwg.drawingTitle}</h4>
                </div>

                {dwg.fileUrl ? (
                  <a
                    href={dwg.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl font-bold flex items-center space-x-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </a>
                ) : (
                  <span className="text-slate-400 italic text-[11px]">Under drafting</span>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* 5. Payments Cleared for this Order */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-black text-slate-900 tracking-tight">
              Commercial Payments Cleared ({payments.length})
            </h2>
          </div>
          <span className="text-xs font-bold text-emerald-700">
            Total Cleared: ₹ {Number(financials.totalPaid || 0).toLocaleString('en-IN')}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="py-2.5 px-3">Receipt No</th>
                <th className="py-2.5 px-3">Payment Date</th>
                <th className="py-2.5 px-3">Mode &amp; Bank</th>
                <th className="py-2.5 px-3">Transaction / UTR Ref</th>
                <th className="py-2.5 px-3 text-right">Cleared Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400">
                    No payment receipts logged for this order yet.
                  </td>
                </tr>
              ) : (
                payments.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70">
                    <td className="py-3 px-3 font-mono font-bold text-blue-700">{p.receiptNumber}</td>
                    <td className="py-3 px-3 text-slate-700">
                      {new Date(p.receiptDate).toLocaleDateString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-slate-800 font-medium">
                      {p.paymentMode} {p.bankName ? `(${p.bankName})` : ''}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600">{p.transactionReference || '—'}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                      ₹ {Number(p.amount || 0).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
