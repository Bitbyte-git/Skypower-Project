import mongoose from 'mongoose';
import { FOLLOWUP_STATUSES, FOLLOWUP_TYPES } from '../constants/statuses.js';

const followupSchema = new mongoose.Schema(
  {
    enquiryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Enquiry',
      required: [true, 'Enquiry reference is required'],
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
      required: [true, 'Client reference is required'],
      index: true
    },
    type: {
      type: String,
      enum: Object.values(FOLLOWUP_TYPES),
      default: FOLLOWUP_TYPES.PHONE_CALL,
      required: true
    },
    followupDate: {
      type: Date,
      default: Date.now,
      required: true
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    discussionNotes: {
      type: String,
      required: [true, 'Discussion notes are required'],
      trim: true
    },
    clientResponse: {
      type: String,
      trim: true
    },
    nextFollowupDate: {
      type: Date
    },
    status: {
      type: String,
      enum: Object.values(FOLLOWUP_STATUSES),
      default: FOLLOWUP_STATUSES.PENDING,
      required: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

followupSchema.index({ ownerId: 1, followupDate: 1 });
followupSchema.index({ status: 1, followupDate: 1 });

export const Followup = mongoose.model('Followup', followupSchema);

