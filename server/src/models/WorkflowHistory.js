import mongoose from 'mongoose';

const workflowHistorySchema = new mongoose.Schema(
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
    departmentCode: {
      type: String,
      required: true
    },
    departmentName: {
      type: String,
      required: true
    },
    action: {
      type: String,
      enum: ['Submitted', 'Forwarded', 'Accepted', 'Rejected', 'Resubmitted', 'Completed'],
      required: true
    },
    actionBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    actionByName: {
      type: String,
      default: ''
    },
    actionByRole: {
      type: String,
      default: ''
    },
    previousStatus: {
      type: String,
      default: ''
    },
    newStatus: {
      type: String,
      default: ''
    },
    remarks: {
      type: String,
      default: ''
    },
    rejectionReason: {
      type: String,
      default: ''
    },
    attachmentUrl: {
      type: String,
      default: null
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

workflowHistorySchema.index({ workflowId: 1, createdAt: 1 });
workflowHistorySchema.index({ projectTrackingId: 1, createdAt: 1 });

export const WorkflowHistory = mongoose.model('WorkflowHistory', workflowHistorySchema);

