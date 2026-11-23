import mongoose from 'mongoose';

export const CLARIFICATION_TYPES = {
  ELECTRICAL: 'Electrical Engineering & Ratings',
  MECHANICAL: 'Mechanical & Panel Dimensions',
  CT_PT: 'CT / PT Ratio & Burden',
  PROTECTION: 'Protection Relay & Trip Logic',
  METERING: 'Metering & Energy Accounting',
  DRAWING: 'Drawing & Symbol Discrepancy',
  INSTALLATION: 'Site Installation & Cable Entry',
  COMMERCIAL: 'Commercial / Scope Boundary',
  OTHER: 'General Technical Query'
};

export const CLARIFICATION_STATUSES = {
  OPEN: 'Open',
  SENT_TO_CUSTOMER: 'Sent to Customer',
  AWAITING_RESPONSE: 'Awaiting Customer Response',
  RESPONSE_RECEIVED: 'Response Received',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed'
};

const technicalClarificationSchema = new mongoose.Schema(
  {
    clarificationNumber: {
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
    drawingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EngineeringDrawing'
    },
    drawingNumber: {
      type: String,
      default: ''
    },
    clarificationType: {
      type: String,
      enum: Object.keys(CLARIFICATION_TYPES),
      default: 'ELECTRICAL',
      index: true
    },
    subject: {
      type: String,
      required: true,
      trim: true
    },
    raisedBy: {
      type: String,
      default: 'Design Engineer'
    },
    raisedDate: {
      type: Date,
      default: Date.now
    },
    question: {
      type: String,
      required: true
    },
    customerResponse: {
      type: String,
      default: ''
    },
    internalResponse: {
      type: String,
      default: ''
    },
    assignedEngineer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    assignedEngineerName: {
      type: String,
      default: 'Lead Electrical Engineer'
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM'
    },
    dueDate: {
      type: Date
    },
    resolvedDate: {
      type: Date
    },
    status: {
      type: String,
      enum: Object.values(CLARIFICATION_STATUSES),
      default: CLARIFICATION_STATUSES.OPEN,
      index: true
    },
    attachments: [
      {
        fileName: String,
        fileUrl: String,
        fileType: String,
        uploadedAt: { type: Date, default: Date.now }
      }
    ],
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

export const TechnicalClarification = mongoose.model('TechnicalClarification', technicalClarificationSchema);
