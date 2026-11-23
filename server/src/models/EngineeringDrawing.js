import mongoose from 'mongoose';

export const DRAWING_TYPES = {
  GA: 'General Arrangement (GA) Drawing',
  SLD: 'Single Line Diagram (SLD)',
  SCHEMATIC: 'Electrical Schematic',
  CONTROL_WIRING: 'Control Wiring Diagram',
  PROTECTION: 'Protection Circuit Diagram',
  CT_CONNECTION: 'CT Connection Diagram',
  PT_CONNECTION: 'PT Connection Diagram',
  METERING: 'Metering Diagram',
  PANEL_LAYOUT: 'Panel Layout & Dimensions',
  BUSBAR: 'Busbar Arrangement & Clearances',
  CABLE_SCHEDULE: 'Cable Schedule & Termination',
  TERMINAL: 'Terminal Diagram',
  BOM: 'Bill of Materials Drawing',
  FOUNDATION: 'Foundation / Installation Drawing',
  CUSTOMER_SPECIFIC: 'Customer-Specific Drawing',
  OTHER: 'Other Engineering Drawing'
};

export const DRAWING_STATUSES = {
  NOT_STARTED: 'Not Started',
  IN_PREPARATION: 'In Preparation',
  INTERNAL_REVIEW: 'Internal Review',
  READY_FOR_SUBMISSION: 'Ready for Submission',
  SUBMITTED: 'Submitted',
  UNDER_CUSTOMER_REVIEW: 'Under Customer Review',
  REVISION_REQUIRED: 'Revision Required',
  APPROVED: 'Approved',
  REJECTED: 'Rejected'
};

const internalReviewChecklistSchema = new mongoose.Schema(
  {
    checkItem: { type: String, required: true },
    status: { type: String, enum: ['Pass', 'Fail', 'N/A'], default: 'Pass' },
    remarks: { type: String, default: '' }
  },
  { _id: false }
);

const drawingRevisionSchema = new mongoose.Schema(
  {
    revisionNumber: { type: String, required: true }, // 'Rev 0', 'Rev A', 'Rev B'
    revisionDate: { type: Date, default: Date.now },
    description: { type: String, default: 'Initial engineering draft' },
    changeReason: { type: String, default: 'New drawing creation' },
    preparedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    preparedByName: { type: String, default: 'Design Engineer' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedByName: { type: String, default: '' },
    
    // File Details
    fileUrl: { type: String, default: '' },
    fileName: { type: String, default: '' },
    fileSize: { type: Number, default: 0 },
    fileType: { type: String, default: 'pdf' },

    // Internal Review
    internalReview: {
      reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      reviewerName: String,
      reviewDate: Date,
      result: { type: String, enum: ['Pending', 'Approved', 'Rework Required'], default: 'Pending' },
      comments: { type: String, default: '' },
      reworkNotes: { type: String, default: '' },
      checklist: [internalReviewChecklistSchema]
    },

    // Customer Approval
    customerApproval: {
      status: {
        type: String,
        enum: ['Awaiting Submission', 'Submitted', 'Under Review', 'Approved', 'Approved with Comments', 'Revision Required', 'Rejected'],
        default: 'Awaiting Submission'
      },
      responseDate: Date,
      approvedBy: { type: String, default: '' },
      comments: { type: String, default: '' },
      approvalDocumentUrl: { type: String, default: '' },
      approvalDocumentName: { type: String, default: '' }
    }
  },
  { _id: true, timestamps: true }
);

const engineeringDrawingSchema = new mongoose.Schema(
  {
    drawingNumber: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    drawingTitle: {
      type: String,
      required: true,
      trim: true
    },
    drawingType: {
      type: String,
      enum: Object.keys(DRAWING_TYPES),
      required: true,
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
      ref: 'SalesOrder',
      index: true
    },
    panelNumber: {
      type: String,
      default: 'Panel 01 - Main Lineup'
    },
    currentRevision: {
      type: String,
      default: 'Rev 0'
    },
    status: {
      type: String,
      enum: Object.values(DRAWING_STATUSES),
      default: DRAWING_STATUSES.NOT_STARTED,
      index: true
    },

    // Responsible Parties
    assignedEngineer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    assignedEngineerName: {
      type: String,
      default: 'Design Engineer'
    },
    checkedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    checkedByName: {
      type: String,
      default: ''
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedByName: {
      type: String,
      default: ''
    },

    // Milestone Dates
    plannedDate: { type: Date },
    actualCompletionDate: { type: Date },
    internalReviewDate: { type: Date },
    customerSubmissionDate: { type: Date },
    customerApprovalDate: { type: Date },

    technicalNotes: { type: String, default: '' },

    // Latest Active File
    fileUrl: { type: String, default: '' },
    fileName: { type: String, default: '' },
    fileSize: { type: Number, default: 0 },
    fileType: { type: String, default: 'pdf' },

    // Latest Review Snapshot
    internalReview: {
      reviewerName: { type: String, default: '' },
      reviewDate: { type: Date },
      result: { type: String, enum: ['Pending', 'Approved', 'Rework Required'], default: 'Pending' },
      comments: { type: String, default: '' },
      reworkNotes: { type: String, default: '' }
    },

    // Latest Customer Approval Snapshot
    customerApproval: {
      status: {
        type: String,
        enum: ['Awaiting Submission', 'Submitted', 'Under Review', 'Approved', 'Approved with Comments', 'Revision Required', 'Rejected'],
        default: 'Awaiting Submission'
      },
      responseDate: { type: Date },
      approvedBy: { type: String, default: '' },
      comments: { type: String, default: '' },
      approvalDocumentUrl: { type: String, default: '' }
    },

    // Full Revision History
    revisions: [drawingRevisionSchema],

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

export const EngineeringDrawing = mongoose.model('EngineeringDrawing', engineeringDrawingSchema);
