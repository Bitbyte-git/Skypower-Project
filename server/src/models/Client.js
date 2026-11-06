import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema(
  {
    clientId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      index: true
    },
    name: {
      type: String,
      trim: true,
      default: ''
    },
    clientName: {
      type: String,
      trim: true,
      default: ''
    },
    companyName: {
      type: String,
      required: [true, 'Client / Company Name is required'],
      trim: true,
      maxlength: 200,
      unique: true
    },
    clientLocation: {
      type: String,
      trim: true,
      default: 'Tamil Nadu'
    },
    siteAddress: {
      type: String,
      trim: true,
      maxlength: [250, 'Site address cannot exceed 250 characters']
    },
    contactPerson: {
      type: String,
      required: [true, 'Contact Person Name is required'],
      trim: true,
      maxlength: [50, 'Contact Person Name cannot exceed 50 characters']
    },
    mobile: {
      type: String,
      required: [true, 'Mobile number is required'],
      trim: true,
      match: [/^[0-9]{10}$/, 'Mobile number must be exactly 10 digits']
    },
    officePhone: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: [30, 'Email ID cannot exceed 30 characters']
    },
    website: {
      type: String,
      trim: true
    },
    customerType: {
      type: String,
      required: [true, 'Customer Type is required'],
      trim: true
    },
    billingAddress: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      postalCode: { type: String, trim: true },
      country: { type: String, default: 'India', trim: true }
    },
    gstNumber: {
      type: String,
      trim: true,
      uppercase: true,
      match: [
        /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
        'Please enter a valid 15-character GSTIN format'
      ]
    },
    additionalContacts: [
      {
        name: { type: String, trim: true },
        designation: { type: String, trim: true },
        phone: { type: String, trim: true },
        email: { type: String, trim: true }
      }
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

clientSchema.index({ companyName: 'text', clientLocation: 'text', contactPerson: 'text' });

export const Client = mongoose.model('Client', clientSchema);

