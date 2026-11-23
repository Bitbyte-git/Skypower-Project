import mongoose from 'mongoose';

export const SUBMISSION_STATUSES = {
  DRAFT: 'Draft',
  READY: 'Ready for Submission',
  SUBMITTED: 'Submitted to Customer',
  UNDER_CUSTOMER_REVIEW: 'Under Customer Review',
  RESPONSE_RECEIVED: 'Response Received',
  CLOSED: 'Closed'
};

const submissionItemSchema = new mongoose.Schema(
  {
    drawingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EngineeringDrawing',
      required: true
    },
    drawingNumber: { type: String, required: true },
    drawingTitle: { type: String, required: true },
    revision: { type: String, default: 'Rev 0' },
    fileUrl: { type: String, default: '' },
    fileName: { type: String, default: '' },
    customerStatus: {
      type: String,
      enum: ['Under Review', 'Approved', 'Approved with Comments', 'Revision Required', 'Rejected'],
      default: 'Under Review'
    },
    customerComments: { type: String, default: '' }
  },
  { _id: true }
);

const drawingSubmissionSchema = new mongoose.Schema(
  {
    submissionNumber: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EngineeringProject',
      required: true,
      index: true
    },
    projectNumber: {
      type: String,
      required: true,
      index: true
    },
    salesOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SalesOrder'
    },
    orderNumber: {
      type: String,
      default: ''
    },
    customerName: {
      type: String,
      required: true
    },
    submissionDate: {
      type: Date,
      default: Date.now
    },
    submissionType: {
      type: String,
      enum: ['INITIAL_SUBMISSION', 'REVISED_SUBMISSION', 'FINAL_APPROVAL_SET', 'AS_BUILT'],
      default: 'INITIAL_SUBMISSION'
    },
    revision: {
      type: String,
      default: 'Rev 0'
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    submittedByName: {
      type: String,
      default: 'Lead Design Engineer'
    },
    submissionRemarks: {
      type: String,
      default: 'Official switchgear drawing transmittal for customer approval.'
    },
    emailReference: {
      type: String,
      default: ''
    },
    expectedCustomerResponseDate: {
      type: Date
    },
    status: {
      type: String,
      enum: Object.values(SUBMISSION_STATUSES),
      default: SUBMISSION_STATUSES.READY,
      index: true
    },

    // Bundled Drawings
    drawings: [submissionItemSchema],

    // Transmittal & Supporting Documents
    supportingDocuments: [
      {
        title: String,
        fileUrl: String,
        fileName: String,
        fileType: String,
        uploadedAt: { type: Date, default: Date.now }
      }
    ],

    // Customer Response
    customerResponse: {
      responseDate: Date,
      receivedBy: String,
      overallStatus: {
        type: String,
        enum: ['Pending', 'Approved', 'Approved with Comments', 'Revision Required', 'Rejected'],
        default: 'Pending'
      },
      comments: { type: String, default: '' },
      responseDocumentUrl: { type: String, default: '' },
      responseDocumentName: { type: String, default: '' }
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
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

export const DrawingSubmission = mongoose.model('DrawingSubmission', drawingSubmissionSchema);
