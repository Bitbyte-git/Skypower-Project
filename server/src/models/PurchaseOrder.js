import mongoose from 'mongoose';

const poProductSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: true,
    trim: true,
    default: 'VCB Switchboard'
  },
  kilovolt: {
    type: String,
    trim: true,
    default: '11 kV'
  },
  ampere: {
    type: String,
    trim: true,
    default: '630 A'
  },
  kiloampere: {
    type: String,
    trim: true,
    default: '26.3 kA'
  },
  durationSec: {
    type: String,
    trim: true,
    default: 'For 3 Sec'
  },
  usage: {
    type: String,
    trim: true,
    default: 'Indoor'
  },
  ebMetering: {
    type: String,
    trim: true,
    default: 'Transformer Control'
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  productDescription: {
    type: String,
    trim: true
  },
  technicalSpecifications: {
    type: String,
    trim: true
  }
});

const purchaseOrderSchema = new mongoose.Schema(
  {
    poId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
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
      trim: true,
      index: true
    },
    clientId: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    projectId: {
      type: String,
      trim: true
    },
    projectTitle: {
      type: String,
      required: true,
      trim: true
    },
    segment: {
      type: String,
      trim: true
    },
    subSegment: {
      type: String,
      trim: true
    },
    offeringVersionId: {
      type: String,
      required: true,
      trim: true
    },
    products: [poProductSchema],
    finalApprovedAmount: {
      type: Number,
      required: true,
      min: 0
    },
    // Production & technical handover tracking
    status: {
      type: String,
      enum: [
        'Submitted to PO Team',
        'Under Technical Review',
        'BOM Generation',
        'Engineering Cleared',
        'Production Handover',
        'Completed'
      ],
      default: 'Submitted to PO Team',
      index: true
    },
    technicalNotes: {
      type: String,
      trim: true
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    submittedAt: {
      type: Date,
      default: Date.now
    },
    timeline: [
      {
        status: { type: String, required: true },
        notes: { type: String, default: '' },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        updatedAt: { type: Date, default: Date.now }
      }
    ]
  },
  {
    timestamps: true
  }
);

export const PurchaseOrder = mongoose.model('PurchaseOrder', purchaseOrderSchema);

