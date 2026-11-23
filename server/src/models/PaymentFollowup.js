import mongoose from 'mongoose';

export const FOLLOWUP_METHODS = ['Phone', 'Email', 'WhatsApp', 'Meeting'];
export const FOLLOWUP_STATUSES = ['Pending', 'Completed', 'Overdue'];

const paymentFollowupSchema = new mongoose.Schema(
  {
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
    pendingAmount: {
      type: Number,
      required: true,
      min: 0
    },
    followupDate: {
      type: Date,
      default: Date.now,
      required: true
    },
    followupMethod: {
      type: String,
      enum: FOLLOWUP_METHODS,
      default: 'Phone',
      required: true
    },
    contactPerson: {
      type: String,
      default: '',
      trim: true
    },
    remarks: {
      type: String,
      required: true,
      trim: true
    },
    customerResponse: {
      type: String,
      default: '',
      trim: true
    },
    nextFollowupDate: {
      type: Date
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    assignedToName: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: FOLLOWUP_STATUSES,
      default: 'Pending',
      index: true
    },
    completedAt: {
      type: Date
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

paymentFollowupSchema.index({ followupDate: -1, status: 1 });

export const PaymentFollowup = mongoose.model('PaymentFollowup', paymentFollowupSchema);
