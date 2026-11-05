import mongoose from 'mongoose';
import { DEPARTMENT_APPROVAL_STATUSES } from '../constants/statuses.js';

const departmentApprovalSchema = new mongoose.Schema(
  {
    workflowId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProjectWorkflow',
      required: true,
      index: true
    },
    enquiryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Enquiry',
      required: true,
      index: true
    },
    projectTrackingId: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true
    },
    departmentCode: {
      type: String,
      required: true,
      trim: true
    },
    departmentName: {
      type: String,
      required: true,
      trim: true
    },
    departmentSequence: {
      type: Number,
      required: true,
      min: 1,
      max: 10
    },
    status: {
      type: String,
      enum: Object.values(DEPARTMENT_APPROVAL_STATUSES),
      default: DEPARTMENT_APPROVAL_STATUSES.WAITING,
      required: true,
      index: true
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    reviewedAt: {
      type: Date,
      default: null
    },
    remarks: {
      type: String,
      trim: true,
      default: ''
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: ''
    },
    attachmentUrl: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

departmentApprovalSchema.index({ workflowId: 1, departmentSequence: 1 }, { unique: true });
departmentApprovalSchema.index({ departmentCode: 1, status: 1 });

export const DepartmentApproval = mongoose.model('DepartmentApproval', departmentApprovalSchema);

