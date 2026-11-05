import mongoose from 'mongoose';
import {
  DEFAULT_CUSTOMER_TYPES,
  DEFAULT_PROJECT_CATEGORIES,
  DEFAULT_PRODUCT_UNITS,
  DEFAULT_VOLTAGE_RATINGS,
  DEFAULT_CURRENT_RATINGS,
  DEFAULT_BREAKING_CAPACITIES,
  DEFAULT_ENQUIRY_SOURCES
} from '../constants/switchgearDefaults.js';

const systemSettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: 'master_config',
      unique: true
    },
    customerTypes: {
      type: [String],
      default: DEFAULT_CUSTOMER_TYPES
    },
    projectCategories: {
      type: [String],
      default: DEFAULT_PROJECT_CATEGORIES
    },
    productUnits: {
      type: [String],
      default: DEFAULT_PRODUCT_UNITS
    },
    voltageRatings: {
      type: [String],
      default: DEFAULT_VOLTAGE_RATINGS
    },
    currentRatings: {
      type: [String],
      default: DEFAULT_CURRENT_RATINGS
    },
    breakingCapacities: {
      type: [String],
      default: DEFAULT_BREAKING_CAPACITIES
    },
    enquirySources: {
      type: [String],
      default: DEFAULT_ENQUIRY_SOURCES
    },
    companyProfile: {
      name: { type: String, default: 'SKY POWER' },
      tagline: { type: String, default: 'Switch to the Future — HT/LT Switchgear & Panel Engineering' },
      address: { type: String, default: 'Works & Registered Plant: Electrical Manufacturing Zone, Phase II, Pune - 411018, India' },
      gstin: { type: String, default: '27AABCS1984F1Z2' },
      email: { type: String, default: 'sales@skypower.co.in' },
      phone: { type: String, default: '+91 20 6790 8000' },
      website: { type: String, default: 'www.skypower.co.in' }
    },
    ernPrefix: {
      type: String,
      default: 'ERN'
    },
    quotationPrefix: {
      type: String,
      default: 'QT'
    },
    defaultTaxRatePercent: {
      type: Number,
      default: 18
    }
  },
  {
    timestamps: true
  }
);

export const SystemSetting = mongoose.model('SystemSetting', systemSettingSchema);
