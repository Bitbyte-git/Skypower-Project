import mongoose from 'mongoose';

export const TRANSACTION_TYPES = {
  INWARD: 'INWARD', // Stock In / Purchase Receipt / GRN
  OUTWARD: 'OUTWARD', // Stock Out / Issued to Project Stage
  ADJUSTMENT: 'ADJUSTMENT' // Physical count reconciliation
};

const stockTransactionSchema = new mongoose.Schema(
  {
    transactionNumber: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InventoryItem',
      required: true,
      index: true
    },
    itemCode: {
      type: String,
      required: true,
      trim: true
    },
    itemName: {
      type: String,
      required: true,
      trim: true
    },
    transactionType: {
      type: String,
      enum: Object.values(TRANSACTION_TYPES),
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1']
    },
    previousStock: {
      type: Number,
      default: 0
    },
    newStock: {
      type: Number,
      default: 0
    },
    unitRate: {
      type: Number,
      default: 0
    },
    totalAmount: {
      type: Number,
      default: 0
    },
    referenceNumber: {
      type: String,
      trim: true,
      default: '' // GRN No, PO No, Invoice No
    },
    projectTrackingId: {
      type: String,
      trim: true,
      index: true,
      default: '' // e.g. PRJ-2026-0001
    },
    departmentStage: {
      type: String,
      trim: true,
      default: 'Stores' // e.g., 'Stage 5: CT & PT', 'Stage 6: Fabrication'
    },
    vendorOrRecipient: {
      type: String,
      trim: true,
      default: '' // Vendor Name or Engineer/Technician Name
    },
    remarks: {
      type: String,
      trim: true,
      default: ''
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    performedByName: {
      type: String,
      default: 'Stock Admin'
    },
    performedByRole: {
      type: String,
      default: 'STOCK_ADMIN'
    }
  },
  {
    timestamps: true
  }
);

export const StockTransaction = mongoose.model('StockTransaction', stockTransactionSchema);
