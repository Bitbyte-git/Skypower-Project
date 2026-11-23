import mongoose from 'mongoose';

export const INVENTORY_CATEGORIES = {
  CIRCUIT_BREAKER: 'Circuit Breaker',
  CONTACTOR: 'Contactor',
  MCCB: 'MCCB',
  PANEL: 'Panel',
  CABLE: 'Cable',
  CT_PT: 'CT & PT Coils',
  RELAYS: 'Protection & Aux Relays',
  SWITCHGEAR_BREAKER: 'Switchgear & VCB / ACB',
  BUSBAR_COPPER: 'Copper & Aluminum Busbars',
  FABRICATION: 'Fabrication & Enclosures',
  METERS_INSTRUMENTS: 'Meters & Multi-Function Instruments',
  HARDWARE_WIRING: 'Hardware, Wires & Terminals',
  OTHERS: 'General Consumables & Spares'
};

export const STOCK_STATUSES = {
  IN_STOCK: 'IN_STOCK',
  LOW_STOCK: 'LOW_STOCK',
  OUT_OF_STOCK: 'OUT_OF_STOCK'
};

const inventoryItemSchema = new mongoose.Schema(
  {
    itemCode: {
      type: String,
      required: [true, 'Item code is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },
    itemName: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      default: INVENTORY_CATEGORIES.CT_PT
    },
    subcategory: {
      type: String,
      trim: true,
      default: ''
    },
    specification: {
      type: String,
      trim: true,
      default: ''
    },
    brand: {
      type: String,
      trim: true,
      default: 'Sky Power Approved'
    },
    imageUrl: {
      type: String,
      trim: true,
      default: ''
    },
    uom: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      default: 'NOS' // NOS, SETS, MTRS, KGS, SHEETS, BOXES
    },
    currentStock: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Current stock cannot be negative']
    },
    allocatedStock: {
      type: Number,
      default: 0,
      min: 0
    },
    minReorderLevel: {
      type: Number,
      default: 5,
      min: 0
    },
    unitCost: {
      type: Number,
      default: 0,
      min: 0
    },
    rackLocation: {
      type: String,
      trim: true,
      default: 'Central Store Bay 1'
    },
    supplier: {
      type: String,
      trim: true,
      default: ''
    },
    status: {
      type: String,
      enum: Object.values(STOCK_STATUSES),
      default: STOCK_STATUSES.IN_STOCK
    },
    notes: {
      type: String,
      trim: true,
      default: ''
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    lastUpdatedBy: {
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

// Virtual for available stock (free stock not allocated)
inventoryItemSchema.virtual('availableStock').get(function () {
  return Math.max(0, (this.currentStock || 0) - (this.allocatedStock || 0));
});

// Virtual for total valuation
inventoryItemSchema.virtual('totalValuation').get(function () {
  return (this.currentStock || 0) * (this.unitCost || 0);
});

// Auto-update status before saving
inventoryItemSchema.pre('save', function (next) {
  if (this.currentStock <= 0) {
    this.status = STOCK_STATUSES.OUT_OF_STOCK;
  } else if (this.currentStock <= this.minReorderLevel) {
    this.status = STOCK_STATUSES.LOW_STOCK;
  } else {
    this.status = STOCK_STATUSES.IN_STOCK;
  }
  next();
});

export const InventoryItem = mongoose.model('InventoryItem', inventoryItemSchema);
