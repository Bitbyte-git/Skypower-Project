import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema(
  {
    departmentCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true
    },
    departmentName: {
      type: String,
      required: true,
      trim: true
    },
    sequenceNumber: {
      type: Number,
      required: true,
      unique: true,
      min: 1,
      max: 10
    },
    canViewClientDetails: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

export const Department = mongoose.model('Department', departmentSchema);

