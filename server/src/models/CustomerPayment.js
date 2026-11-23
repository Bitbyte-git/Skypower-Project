import mongoose from 'mongoose';
import { PAYMENT_MODES } from './OrderPaymentTerms.js';

const customerPaymentSchema = new mongoose.Schema(
  {
    receiptNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    receiptDate: {
      type: Date,
      default: Date.now,
      required: true
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SalesOrder',
      required: true,
      index: true
    },
    orderNumber: {
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
    customerName: {
      type: String,
      required: true,
      trim: true
    },
    customerAddress: {
      type: String,
      default: '',
      trim: true
    },
    customerPONumber: {
      type: String,
      default: '',
      trim: true
    },
    amount: {
      type: Number,
      required: true,
      min: [1, 'Payment amount must be greater than zero']
    },
    amountInWords: {
      type: String,
      default: ''
    },
    paymentDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    paymentMode: {
      type: String,
      enum: PAYMENT_MODES,
      default: 'RTGS',
      required: true
    },
    transactionReference: {
      type: String,
      required: true,
      trim: true
    },
    bankName: {
      type: String,
      default: '',
      trim: true
    },
    utrNumber: {
      type: String,
      default: '',
      trim: true
    },
    chequeNumber: {
      type: String,
      default: '',
      trim: true
    },
    chequeDate: {
      type: Date
    },
    milestoneId: {
      type: mongoose.Schema.Types.ObjectId
    },
    milestoneName: {
      type: String,
      default: 'Advance',
      trim: true
    },
    remainingOutstandingAmount: {
      type: Number,
      default: 0
    },
    remarks: {
      type: String,
      default: '',
      trim: true
    },
    attachmentUrl: {
      type: String,
      default: ''
    },
    receiptPdfUrl: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['Cleared', 'Pending', 'Cancelled', 'Reversed'],
      default: 'Cleared',
      index: true
    },
    cancellation: {
      isCancelled: { type: Boolean, default: false },
      cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      cancelledByName: { type: String, default: '' },
      cancelledAt: { type: Date },
      reason: { type: String, default: '' }
    },
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    receivedByName: {
      type: String,
      default: 'Accounts & Finance Team'
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

customerPaymentSchema.index({ transactionReference: 1, status: 1 });
customerPaymentSchema.index({ paymentDate: -1 });

export const CustomerPayment = mongoose.model('CustomerPayment', customerPaymentSchema);
