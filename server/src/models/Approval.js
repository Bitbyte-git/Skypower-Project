import mongoose from 'mongoose';

const approvalSchema = new mongoose.Schema(
  {
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
    action: {
      type: String,
      enum: ['APPROVED', 'RETURNED', 'REJECTED'],
      required: true
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    adminRemarks: {
      type: String,
      trim: true,
      required: function () {
        return this.action === 'RETURNED' || this.action === 'REJECTED';
      }
    },
    previousStatus: {
      type: String,
      required: true
    },
    newStatus: {
      type: String,
      required: true
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

export const Approval = mongoose.model('Approval', approvalSchema);

