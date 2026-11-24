import mongoose from 'mongoose';
import {
  APPROVAL_STATUSES,
  COMMERCIAL_STATUSES,
  ENQUIRY_TYPES
} from '../constants/statuses.js';

const productSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: [true, 'Product Name is required'],
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
    default: '25 kA'
  },
  durationSec: {
    type: String,
    trim: true,
    default: 'For 3 Sec'
  },
  usage: {
    type: String,
    trim: true,
    default: 'Outdoor'
  },
  ebMetering: {
    type: String,
    trim: true,
    default: '(Transformer Control)'
  },
  basicPrice: {
    type: Number,
    min: [0, 'Basic price cannot be negative'],
    default: 315000
  },
  totalBasicPrice: {
    type: Number,
    min: [0, 'Total basic price cannot be negative'],
    default: 315000
  },
  productType: {
    type: String,
    trim: true,
    default: 'HT Switchgear'
  },
  productDescription: {
    type: String,
    trim: true
  },
  voltageRating: {
    type: String,
    trim: true
  },
  currentRating: {
    type: String,
    trim: true
  },
  breakingCapacity: {
    type: String,
    trim: true
  },
  equipmentConfiguration: {
    type: String,
    trim: true
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1'],
    default: 1
  },
  unit: {
    type: String,
    trim: true,
    default: 'Nos'
  },
  estimatedUnitValue: {
    type: Number,
    min: [0, 'Estimated unit value cannot be negative'],
    default: 0
  },
  totalProductValue: {
    type: Number,
    min: [0, 'Total product value cannot be negative'],
    default: 0
  },
  technicalSpecifications: {
    type: String,
    trim: true
  },
  additionalSpecifications: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  supportingDrawings: [
    {
      fileName: String,
      originalName: String,
      filePath: String,
      fileSize: Number,
      uploadedAt: { type: Date, default: Date.now }
    }
  ]
});

const documentSchema = new mongoose.Schema({
  fileName: { type: String, required: true },
  originalName: { type: String, required: true },
  filePath: { type: String, required: true },
  mimeType: { type: String, required: true },
  fileSize: { type: Number, required: true },
  documentType: {
    type: String,
    default: 'Supporting Document',
    enum: [
      'Client enquiry documents',
      'Technical specifications',
      'Electrical drawings',
      'BOQ documents',
      'Product datasheets',
      'Supporting documents',
      'Revised requirements',
      'PO / LOI Document'
    ]
  },
  version: { type: Number, default: 1 },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  uploadDate: { type: Date, default: Date.now }
});

const enquirySchema = new mongoose.Schema(
  {
    ern: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    offerDate: {
      type: Date,
      required: [true, 'Offer date is required'],
      default: Date.now
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: [true, 'Client reference is required'],
      index: true
    },
    clientCustomId: {
      type: String,
      trim: true,
      index: true
    },
    customerType: {
      type: String,
      required: [true, 'Customer type is required'],
      trim: true
    },
    project: {
      standardType: {
        type: String,
        enum: ['Standard', 'Non Standard', 'Non-Standard'],
        default: 'Standard'
      },
      projectName: {
        type: String,
        required: [true, 'Project Name is required'],
        trim: true
      },
      segment: {
        type: String,
        trim: true,
        default: 'Commercial'
      },
      subSegment: {
        type: String,
        trim: true,
        default: 'Building'
      },
      projectCategory: {
        type: String,
        trim: true,
        default: 'HT Switchgear Requisition'
      },
      projectLocation: {
        type: String,
        trim: true,
        default: 'Tamil Nadu'
      },
      projectSiteAddress: {
        type: String,
        trim: true
      },
      expectedDeliveryDate: {
        type: Date
      },
      deliveryTerms: {
        type: String,
        trim: true
      },
      deliveryWeeks: {
        type: Number,
        default: 8
      },
      projectDescription: {
        type: String,
        trim: true
      },
      projectScope: {
        type: String,
        trim: true,
        default: 'Our scope shall be limited to design, Manufacturing and supply of the quoted HT switchgear panels only. Erection, testing and commissioning shall not be in our scope.'
      },
      specialRequirements: {
        type: String,
        trim: true
      },
      internalRemarks: {
        type: String,
        trim: true
      },
      referredBy: {
        type: String,
        trim: true
      }
    },
    commercialPricing: {
      priceBasis: {
        type: String,
        default: 'Ex-Works: Salem, Tamil Nadu'
      },
      forBasis: {
        type: String,
        default: 'Client Own Transport (Default)'
      },
      transportPrice: {
        type: Number,
        default: 0
      },
      subTotal: {
        type: Number,
        default: 0
      },
      gstType: {
        type: String,
        default: 'INTRA_STATE'
      },
      cgstRate: {
        type: Number,
        default: 9
      },
      sgstRate: {
        type: Number,
        default: 9
      },
      igstRate: {
        type: Number,
        default: 18
      },
      cgstAmount: {
        type: Number,
        default: 0
      },
      sgstAmount: {
        type: Number,
        default: 0
      },
      igstAmount: {
        type: Number,
        default: 0
      },
      totalTaxAmount: {
        type: Number,
        default: 0
      },
      totalAmount: {
        type: Number,
        default: 0
      },
      amountInWords: {
        type: String,
        default: ''
      },
      deliverySchedule: {
        type: String,
        default: '6 to 8 Weeks'
      },
      deliveryWeeks: {
        type: Number,
        default: 8
      },
      expectedDeliveryDate: {
        type: Date
      },
      deliveryTerms: {
        type: String,
        default: 'Within 6 to 8 weeks from the date of technically & commercially clear Purchase Order and approved drawing.'
      }
    },
    products: {
      type: [productSchema],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: 'At least one product specification is mandatory.'
      }
    },
    enquiryType: {
      type: String,
      enum: Object.values(ENQUIRY_TYPES),
      default: ENQUIRY_TYPES.BUDGETARY,
      required: true
    },
    referredBy: {
      type: String,
      trim: true
    },
    enquirySource: {
      type: String,
      trim: true
    },
    assignedSalesEngineer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    expectedProjectValue: {
      type: Number,
      min: [0, 'Expected project value cannot be negative'],
      default: 0
    },
    commands: {
      type: String,
      trim: true,
      default: ''
    },
    enquiryRemarks: {
      type: String,
      trim: true
    },
    eSignature: {
      signatureData: { type: String, default: '' },
      signatureType: { type: String, default: 'drawn' },
      signedByName: { type: String, default: '' },
      signedAt: { type: Date, default: Date.now },
      employeeId: { type: String, default: '' },
      designation: { type: String, default: '' }
    },
    documents: [documentSchema],
    approvalStatus: {
      type: String,
      enum: Object.values(APPROVAL_STATUSES),
      default: APPROVAL_STATUSES.DRAFT,
      required: true,
      index: true
    },
    commercialStatus: {
      type: String,
      enum: Object.values(COMMERCIAL_STATUSES),
      default: COMMERCIAL_STATUSES.IN_PROGRESS,
      required: true,
      index: true
    },
    currentRevision: {
      type: Number,
      default: 1
    },
    revisionHistory: [
      {
        revisionNumber: Number,
        modifiedAt: { type: Date, default: Date.now },
        modifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        snapshot: mongoose.Schema.Types.Mixed,
        changeSummary: String
      }
    ],
    currentOfferingVersion: {
      type: String,
      default: 'OFR-001',
      trim: true
    },
    offeringRevisions: [
      {
        versionId: { type: String, required: true },
        versionNumber: { type: Number, required: true },
        createdAt: { type: Date, default: Date.now },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        totalAmount: { type: Number, default: 0 },
        status: { type: String, default: 'Draft' },
        productsSnapshot: [mongoose.Schema.Types.Mixed],
        pricingSnapshot: mongoose.Schema.Types.Mixed,
        pdfUrl: { type: String, default: '' },
        changeSummary: { type: String, default: '' }
      }
    ],
    poDetails: {
      poId: { type: String, trim: true },
      poObjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseOrder' },
      submittedAt: Date,
      submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    },
    advancePaymentDetails: {
      amount: { type: Number, default: 0 },
      percentage: { type: Number, default: 50 },
      paymentDate: { type: Date, default: null },
      paymentMode: { type: String, default: 'RTGS' },
      referenceNumber: { type: String, default: '' },
      bankName: { type: String, default: '' },
      status: { type: String, default: 'Pending' },
      clearedAt: { type: Date, default: null },
      clearedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      clearedByName: { type: String, default: '' },
      remarks: { type: String, default: '' }
    },
    drawingOADetails: {
      gaDrawingNumber: { type: String, default: '' },
      sldDrawingNumber: { type: String, default: '' },
      proformaInvoiceNumber: { type: String, default: '' },
      proformaInvoiceDate: { type: Date, default: null },
      orderAcknowledgementNumber: { type: String, default: '' },
      orderAcknowledgementDate: { type: Date, default: null },
      customerApprovalStatus: {
        type: String,
        default: 'Approved with Code 1 (Clean)'
      },
      ctRatioConfirmed: { type: String, default: '' },
      targetDispatchDate: { type: Date, default: null },
      attachmentUrl: { type: String, default: '' },
      
      // Uploaded Drawing PDF & Admin Verification
      drawingPdfUrl: { type: String, default: '' },
      drawingPdfName: { type: String, default: '' },
      drawingPdfUploadedAt: { type: Date, default: null },
      drawingPdfUploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      drawingPdfUploadedByName: { type: String, default: '' },
      adminVerificationStatus: {
        type: String,
        enum: ['Pending Upload', 'Pending Admin Verification', 'Verified & Approved', 'Revision Required'],
        default: 'Pending Upload'
      },
      adminVerifiedAt: { type: Date, default: null },
      adminVerifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      adminVerifiedByName: { type: String, default: '' },
      adminVerificationRemarks: { type: String, default: '' },

      approvedAt: { type: Date, default: null },
      approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      approvedByName: { type: String, default: '' },
      remarks: { type: String, default: '' }
    },
    handoverDetails: {
      isHandedOver: { type: Boolean, default: false },
      handedOverAt: Date,
      handedOverBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      targetDepartment: { type: String, default: 'R&D / Design' },
      handoverNotes: String,
      poReference: String,
      poDate: Date,
      poValue: Number,
      poDocumentUrl: String
    }
  },
  {
    timestamps: true
  }
);

enquirySchema.index({ ern: 1, approvalStatus: 1 });
enquirySchema.index({ assignedSalesEngineer: 1, approvalStatus: 1 });

export const Enquiry = mongoose.model('Enquiry', enquirySchema);

