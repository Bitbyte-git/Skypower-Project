import mongoose from 'mongoose';

export const PAYMENT_STATUSES = {
  NOT_PAID: 'Not Paid',
  ADVANCE_PENDING: 'Advance Pending',
  PARTIALLY_PAID: 'Partially Paid',
  ADVANCE_RECEIVED: 'Advance Received',
  PAYMENT_PENDING: 'Payment Pending',
  FULLY_PAID: 'Fully Paid',
  OVERDUE: 'Overdue',
  CANCELLED: 'Cancelled'
};

export const PAYMENT_MODES = [
  'Bank Transfer',
  'NEFT',
  'RTGS',
  'IMPS',
  'UPI',
  'Cheque',
  'Cash',
  'Other'
];

export const MILESTONE_TRIGGERS = [
  'Order confirmation',
  'Drawing approval',
  'Production completion',
  'Before dispatch',
  'After commissioning',
  'Custom milestone'
];

const paymentMilestoneSchema = new mongoose.Schema({
  milestoneName: {
    type: String,
    required: true,
    trim: true
  },
  percentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  dueDate: {
    type: Date,
    required: true
  },
  trigger: {
    type: String,
    default: 'Order confirmation'
  },
  amountReceived: {
    type: Number,
    default: 0,
    min: 0
  },
  pendingAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['Pending', 'Partially Paid', 'Paid', 'Overdue'],
    default: 'Pending'
  },
  remarks: {
    type: String,
    default: '',
    trim: true
  }
});

const paymentAuditEntrySchema = new mongoose.Schema({
  action: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userName: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now },
  previousValue: { type: mongoose.Schema.Types.Mixed },
  newValue: { type: mongoose.Schema.Types.Mixed },
  remarks: { type: String, default: '' }
});

const orderPaymentTermsSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SalesOrder',
      required: true,
      unique: true,
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
    customerPONumber: {
      type: String,
      default: '',
      trim: true
    },
    projectTitle: {
      type: String,
      default: '',
      trim: true
    },
    totalOrderValue: {
      type: Number,
      required: true,
      min: 0
    },
    termsType: {
      type: String,
      enum: ['Percentage', 'Custom'],
      default: 'Percentage'
    },
    termsDescription: {
      type: String,
      default: '30% Advance with PO, 70% against PI prior to dispatch'
    },
    advancePercentage: {
      type: Number,
      default: 30,
      min: 0,
      max: 100
    },
    advanceAmountRequired: {
      type: Number,
      default: 0,
      min: 0
    },
    totalReceived: {
      type: Number,
      default: 0,
      min: 0
    },
    pendingAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    advanceReceived: {
      type: Number,
      default: 0,
      min: 0
    },
    advancePending: {
      type: Number,
      default: 0,
      min: 0
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PAYMENT_STATUSES),
      default: PAYMENT_STATUSES.ADVANCE_PENDING,
      index: true
    },
    earliestOverdueDate: {
      type: Date
    },
    milestones: [paymentMilestoneSchema],
    auditTrail: [paymentAuditEntrySchema],
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

/**
 * Method to re-calculate payment status & milestone progress from transaction records
 */
orderPaymentTermsSchema.methods.recalculateBalances = function (transactions = []) {
  const round2 = (num) => Math.round((Number(num) || 0) * 100) / 100;
  
  const totalOrderVal = round2(this.totalOrderValue);
  const activeTxns = transactions.filter((t) => t.status === 'Cleared');

  // Sum total received from active transactions
  const totalRcvd = round2(activeTxns.reduce((sum, t) => sum + (t.amount || 0), 0));
  this.totalReceived = totalRcvd;
  this.pendingAmount = Math.max(0, round2(totalOrderVal - totalRcvd));

  // Calculate Advance required & received
  const advReq = round2((totalOrderVal * (this.advancePercentage || 0)) / 100);
  this.advanceAmountRequired = advReq;

  // Transactions tagged to 'Advance' milestone or general payments up to advance required
  const advTxns = activeTxns.filter(
    (t) => (t.milestoneName || '').toLowerCase().includes('advance') || (t.milestoneName || '') === 'Advance'
  );
  let advRcvd = round2(advTxns.reduce((sum, t) => sum + (t.amount || 0), 0));
  // If not explicitly tagged, consider cumulative payments up to advance required
  if (advTxns.length === 0 && totalRcvd > 0) {
    advRcvd = Math.min(totalRcvd, advReq);
  }
  this.advanceReceived = Math.min(advRcvd, advReq);
  this.advancePending = Math.max(0, round2(advReq - this.advanceReceived));

  // Recalculate milestones allocation
  let runningAllocation = totalRcvd;
  let hasOverdueMilestone = false;
  const now = new Date();

  this.milestones.forEach((m) => {
    const mExpected = round2(m.amount);
    const mAllocated = Math.min(runningAllocation, mExpected);
    m.amountReceived = mAllocated;
    m.pendingAmount = Math.max(0, round2(mExpected - mAllocated));
    runningAllocation = Math.max(0, round2(runningAllocation - mAllocated));

    if (m.pendingAmount === 0 && mExpected > 0) {
      m.status = 'Paid';
    } else if (m.amountReceived > 0) {
      m.status = 'Partially Paid';
    } else {
      m.status = 'Pending';
    }

    if (m.status !== 'Paid' && m.dueDate && new Date(m.dueDate) < now) {
      m.status = 'Overdue';
      hasOverdueMilestone = true;
    }
  });

  // Calculate high-level Payment Status
  if (totalRcvd >= totalOrderVal && totalOrderVal > 0) {
    this.paymentStatus = PAYMENT_STATUSES.FULLY_PAID;
  } else if (hasOverdueMilestone) {
    this.paymentStatus = PAYMENT_STATUSES.OVERDUE;
  } else if (this.advancePending > 0 && totalRcvd > 0) {
    this.paymentStatus = PAYMENT_STATUSES.PARTIALLY_PAID;
  } else if (this.advancePending > 0) {
    this.paymentStatus = PAYMENT_STATUSES.ADVANCE_PENDING;
  } else if (this.advancePending === 0 && this.pendingAmount > 0) {
    this.paymentStatus = totalRcvd === this.advanceReceived ? PAYMENT_STATUSES.ADVANCE_RECEIVED : PAYMENT_STATUSES.PAYMENT_PENDING;
  } else if (totalRcvd === 0) {
    this.paymentStatus = PAYMENT_STATUSES.NOT_PAID;
  }
};

export const OrderPaymentTerms = mongoose.model('OrderPaymentTerms', orderPaymentTermsSchema);
