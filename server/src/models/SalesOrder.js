import mongoose from 'mongoose';

export const ORDER_STATUSES = {
  AWAITING_PO: 'Awaiting PO',
  PO_RECEIVED: 'PO Received',
  UNDER_VERIFICATION: 'Under Verification',
  CLARIFICATION_REQUIRED: 'Clarification Required',
  PO_REVISION_AWAITED: 'PO Revision Awaited',
  VERIFIED: 'Verified',
  ORDER_CONFIRMED: 'Order Confirmed',
  ON_HOLD: 'On Hold',
  CANCELLED: 'Cancelled',
  COMPLETED: 'Completed'
};

export const HOLD_REASONS = [
  'Technical Clarification',
  'Commercial Clarification',
  'Payment Pending',
  'Customer Request',
  'Material Issue',
  'Delivery Issue',
  'Management Approval',
  'Other'
];

const orderProductSchema = new mongoose.Schema({
  productId: mongoose.Schema.Types.ObjectId,
  productName: { type: String, required: true },
  productDescription: { type: String, default: '' },
  voltageRating: { type: String, default: '11 kV' },
  currentRating: { type: String, default: '630 A' },
  breakingCapacity: { type: String, default: '26.3 kA' },
  durationSec: { type: String, default: 'For 3 Sec' },
  usage: { type: String, default: 'Indoor' },
  ebMetering: { type: String, default: 'Transformer Control' },
  equipmentConfiguration: { type: String, default: '' },
  panelType: { type: String, default: 'Standalone Indoor VCB' },
  ctSpecification: { type: String, default: 'Ratio & Class as approved' },
  ptSpecification: { type: String, default: '11kV / 110V 3-Phase' },
  relaySpecification: { type: String, default: 'Numerical Overcurrent & Earth Fault' },
  meteringSpecification: { type: String, default: 'Digital MFM 0.5s' },
  quantity: { type: Number, required: true, min: 1, default: 1 },
  unit: { type: String, default: 'Nos' },
  unitPrice: { type: Number, required: true, min: 0 },
  discountPercent: { type: Number, default: 0 },
  taxRatePercent: { type: Number, default: 18 },
  totalPrice: { type: Number, required: true, min: 0 },
  technicalSpecifications: { type: String, default: '' }
});

const verificationItemSchema = new mongoose.Schema({
  parameter: { type: String, required: true },
  quotationValue: { type: String, default: '' },
  poValue: { type: String, default: '' },
  isMatch: { type: Boolean, default: true },
  status: {
    type: String,
    enum: ['Match', 'Mismatch', 'Clarification Required', 'Pending'],
    default: 'Match'
  },
  remarks: { type: String, default: '' }
});

const poRevisionSchema = new mongoose.Schema({
  revisionNumber: { type: Number, required: true },
  revisionDate: { type: Date, default: Date.now },
  previousPoValue: { type: Number, default: 0 },
  newPoValue: { type: Number, default: 0 },
  previousDeliveryDate: { type: Date },
  newDeliveryDate: { type: Date },
  revisionReason: { type: String, required: true },
  changesSummary: { type: String, default: '' },
  documentUrl: { type: String, default: '' },
  revisedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  revisedByName: { type: String, default: '' }
});

const holdHistorySchema = new mongoose.Schema({
  reason: { type: String, required: true },
  description: { type: String, default: '' },
  holdDate: { type: Date, default: Date.now },
  holdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  holdByName: { type: String, default: '' },
  expectedResumeDate: { type: Date },
  resumedDate: { type: Date },
  resumedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resumedByName: { type: String, default: '' },
  resumeNotes: { type: String, default: '' }
});

const orderTimelineSchema = new mongoose.Schema({
  event: { type: String, required: true },
  status: { type: String, default: '' },
  notes: { type: String, default: '' },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  performedByName: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now }
});

const salesOrderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    orderDate: {
      type: Date,
      default: Date.now,
      required: true
    },
    quotationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quotation',
      required: false,
      index: true
    },
    quotationNumber: {
      type: String,
      required: true,
      index: true
    },
    quotationVersion: {
      type: Number,
      default: 1
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
    customerName: {
      type: String,
      required: true,
      trim: true
    },
    customerCode: {
      type: String,
      trim: true,
      default: ''
    },
    projectTitle: {
      type: String,
      required: true,
      trim: true
    },
    endUser: {
      type: String,
      trim: true,
      default: ''
    },
    contactPerson: {
      type: String,
      trim: true,
      default: ''
    },
    contactEmail: {
      type: String,
      trim: true,
      default: ''
    },
    contactPhone: {
      type: String,
      trim: true,
      default: ''
    },
    billingAddress: {
      type: mongoose.Schema.Types.Mixed,
      default: ''
    },
    siteAddress: {
      type: mongoose.Schema.Types.Mixed,
      default: ''
    },
    gstNumber: {
      type: String,
      trim: true,
      default: ''
    },
    status: {
      type: String,
      enum: Object.values(ORDER_STATUSES),
      default: ORDER_STATUSES.PO_RECEIVED,
      required: true,
      index: true
    },

    // Customer PO Information
    customerPO: {
      poNumber: { type: String, default: '', trim: true, index: true },
      poDate: { type: Date, default: Date.now },
      poReceivedDate: { type: Date, default: Date.now },
      poValue: { type: Number, default: 0 },
      poCurrency: { type: String, default: 'INR' },
      poRevision: { type: Number, default: 1 },
      expectedDeliveryDate: { type: Date },
      paymentTerms: { type: String, default: '' },
      deliveryTerms: { type: String, default: '' },
      warrantyTerms: { type: String, default: '' },
      customerRemarks: { type: String, default: '' },
      internalRemarks: { type: String, default: '' },
      documentUrl: { type: String, default: '' },
      attachments: [
        {
          name: String,
          fileUrl: String,
          fileType: String,
          uploadedAt: { type: Date, default: Date.now },
          uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
        }
      ]
    },

    // Products & Technical Specifications
    products: [orderProductSchema],

    // Financial Values & Commercials
    pricing: {
      subTotal: { type: Number, default: 0 },
      discountTotal: { type: Number, default: 0 },
      taxRatePercent: { type: Number, default: 18 },
      taxTotal: { type: Number, default: 0 },
      freightAndInsurance: { type: Number, default: 0 },
      totalOrderValue: { type: Number, required: true, default: 0 }
    },

    commercialTerms: {
      priceBasis: { type: String, default: 'Ex-works Salem Manufacturing Facility' },
      paymentTerms: { type: String, default: '30% Advance with PO, 70% against PI prior to dispatch' },
      deliveryTerms: { type: String, default: '10 to 12 weeks from technically and commercially clear order' },
      warrantyTerms: { type: String, default: '18 months from dispatch or 12 months from commissioning' }
    },

    // PO Verification Checklist & Comparison
    verification: {
      isVerified: { type: Boolean, default: false },
      status: {
        type: String,
        enum: ['Pending', 'In Progress', 'Verified', 'Clarification Required'],
        default: 'Pending'
      },
      verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      verifiedByName: { type: String, default: '' },
      verifiedAt: { type: Date },
      checklist: [verificationItemSchema],
      mismatchCount: { type: Number, default: 0 },
      clarificationNotes: { type: String, default: '' },
      resolutionNotes: { type: String, default: '' }
    },

    // Order Confirmation & Order Acknowledgement (OA)
    confirmation: {
      isConfirmed: { type: Boolean, default: false },
      confirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      confirmedByName: { type: String, default: '' },
      confirmedAt: { type: Date },
      orderCoordinator: { type: String, default: '' },
      orderAcknowledgementNumber: { type: String, default: '', index: true },
      acknowledgementDate: { type: Date },
      acknowledgementPdfUrl: { type: String, default: '' },
      confirmationRemarks: { type: String, default: '' },
      committedDeliveryDate: { type: Date }
    },

    // Historical Revisions & Hold Management
    revisions: [poRevisionSchema],
    holdHistory: [holdHistorySchema],
    currentHold: {
      isOnHold: { type: Boolean, default: false },
      reason: { type: String, default: '' },
      description: { type: String, default: '' },
      holdDate: { type: Date },
      holdByName: { type: String, default: '' },
      expectedResumeDate: { type: Date }
    },

    // Cancellation
    cancellation: {
      isCancelled: { type: Boolean, default: false },
      cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      cancelledByName: { type: String, default: '' },
      cancelledAt: { type: Date },
      reason: { type: String, default: '' }
    },

    // Timeline Audit Trail
    timeline: [orderTimelineSchema],

    // Manufacturing Link (Reserved for future modules)
    projectWorkflowId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProjectWorkflow'
    },
    projectTrackingId: {
      type: String,
      default: ''
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false
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

export const SalesOrder = mongoose.model('SalesOrder', salesOrderSchema);
