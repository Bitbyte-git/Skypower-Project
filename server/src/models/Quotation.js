import mongoose from 'mongoose';
import { QUOTATION_STATUSES } from '../constants/statuses.js';

const quotationItemSchema = new mongoose.Schema({
  productId: mongoose.Schema.Types.ObjectId,
  productName: { type: String, required: true },
  productDescription: String,
  voltageRating: String,
  currentRating: String,
  breakingCapacity: String,
  equipmentConfiguration: String,
  quantity: { type: Number, required: true, min: 1 },
  unit: { type: String, default: 'Nos' },
  unitPrice: { type: Number, required: true, min: 0 },
  discountPercent: { type: Number, default: 0, min: 0, max: 100 },
  taxRatePercent: { type: Number, default: 18, min: 0 },
  netAmount: { type: Number, required: true, min: 0 }
});

const quotationSchema = new mongoose.Schema(
  {
    quotationNumber: {
      type: String,
      required: true,
      index: true
    },
    version: {
      type: Number,
      required: true,
      default: 1
    },
    formattedQuotationNumber: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    enquiryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Enquiry',
      required: true,
      index: true
    },
    ern: {
      type: String,
      required: true,
      index: true
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true
    },
    quotationDate: {
      type: Date,
      default: Date.now,
      required: true
    },
    validityDate: {
      type: Date,
      required: true
    },
    productPricing: [quotationItemSchema],
    subTotal: {
      type: Number,
      required: true,
      default: 0
    },
    discountTotal: {
      type: Number,
      default: 0
    },
    taxRatePercent: {
      type: Number,
      default: 18
    },
    taxTotal: {
      type: Number,
      default: 0
    },
    freightAndInsurance: {
      type: Number,
      default: 0
    },
    finalQuotationValue: {
      type: Number,
      required: true,
      default: 0
    },
    commercialTerms: {
      type: String,
      default: 'Price Basis: Ex-works manufacturing facility. Packing & Forwarding extra at actuals.'
    },
    paymentTerms: {
      type: String,
      default: '30% advance with Purchase Order, 70% against Proforma Invoice prior to dispatch.'
    },
    deliveryTerms: {
      type: String,
      default: '10 to 12 weeks from the date of technically and commercially clear order & drawing approval.'
    },
    warrantyTerms: {
      type: String,
      default: '18 months from the date of dispatch or 12 months from the date of commissioning, whichever is earlier.'
    },
    status: {
      type: String,
      enum: Object.values(QUOTATION_STATUSES),
      default: QUOTATION_STATUSES.DRAFT,
      required: true,
      index: true
    },
    pdfFileUrl: {
      type: String
    },
    revisionRemarks: {
      type: String
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

quotationSchema.index({ quotationNumber: 1, version: 1 });

export const Quotation = mongoose.model('Quotation', quotationSchema);

