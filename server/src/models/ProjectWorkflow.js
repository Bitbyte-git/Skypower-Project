import mongoose from 'mongoose';
import { PROJECT_WORKFLOW_STATUSES } from '../constants/statuses.js';

const projectWorkflowSchema = new mongoose.Schema(
  {
    projectTrackingId: {
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
      unique: true,
      index: true
    },
    currentDepartmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department'
    },
    currentDepartmentCode: {
      type: String,
      default: 'SALES',
      trim: true
    },
    currentDepartmentSequence: {
      type: Number,
      default: 1,
      min: 1,
      max: 10
    },
    overallStatus: {
      type: String,
      enum: Object.values(PROJECT_WORKFLOW_STATUSES),
      default: PROJECT_WORKFLOW_STATUSES.DRAFT,
      required: true,
      index: true
    },
    lastRejectedDepartmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null
    },
    lastRejectedDepartmentCode: {
      type: String,
      default: null
    },
    rejectionReason: {
      type: String,
      default: null
    },
    rejectionRemarks: {
      type: String,
      default: null
    },
    rejectedAt: {
      type: Date,
      default: null
    },
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    resubmittedAt: {
      type: Date,
      default: null
    },
    managerReviewedAt: {
      type: Date,
      default: null
    },
    managerForwardedAt: {
      type: Date,
      default: null
    },
    completedAt: {
      type: Date,
      default: null
    },
    completionPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  {
    timestamps: true
  }
);

projectWorkflowSchema.index({ currentDepartmentSequence: 1 });
projectWorkflowSchema.index({ projectTrackingId: 1, overallStatus: 1 });

export const ProjectWorkflow = mongoose.model('ProjectWorkflow', projectWorkflowSchema);

