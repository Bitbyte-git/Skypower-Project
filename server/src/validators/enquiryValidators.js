import { z } from 'zod';
import { ENQUIRY_TYPES } from '../constants/statuses.js';

const productItemValidator = z.object({
  productName: z.string().trim().min(1, 'Product Name is required').default('VCB Switchboard'),
  productType: z.string().optional().default('HT Switchgear'),
  kilovolt: z.string().optional().default('11 kV'),
  ampere: z.string().optional().default('630 A'),
  kiloampere: z.string().optional().default('25 kA'),
  durationSec: z.string().optional().default('For 3 Sec'),
  usage: z.string().optional().default('Outdoor'),
  ebMetering: z.string().optional().default('(Transformer Control)'),
  basicPrice: z.coerce.number().min(0).optional().default(315000),
  totalBasicPrice: z.coerce.number().min(0).optional().default(315000),
  productDescription: z.string().optional().or(z.literal('')),
  voltageRating: z.string().optional().or(z.literal('')),
  currentRating: z.string().optional().or(z.literal('')),
  breakingCapacity: z.string().optional().or(z.literal('')),
  equipmentConfiguration: z.string().optional().or(z.literal('')),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1'),
  unit: z.string().optional().default('Nos'),
  estimatedUnitValue: z.coerce.number().min(0).optional().default(0),
  totalProductValue: z.coerce.number().min(0).optional().default(0),
  technicalSpecifications: z.string().optional().or(z.literal('')),
  additionalSpecifications: z.record(z.any()).optional().default({})
});

export const enquirySchema = z.object({
  body: z.object({
    clientId: z.string().min(1, 'Client selection is mandatory'),
    customerType: z.string().trim().min(1, 'Customer Type is required'),
    offerDate: z.coerce.date().optional(),
    project: z.object({
      standardType: z.string().optional().default('Standard'),
      projectName: z.string().trim().min(1, 'Project Title is required'),
      segment: z.string().optional().default('Commercial'),
      subSegment: z.string().optional().default('Building'),
      projectCategory: z.string().optional().default('Transmission & Distribution Substation'),
      projectLocation: z.string().optional().default('Salem, Tamil Nadu'),
      projectSiteAddress: z.string().optional().or(z.literal('')),
      expectedDeliveryDate: z.coerce.date().optional(),
      projectDescription: z.string().optional().or(z.literal('')),
      projectScope: z.string().optional().or(z.literal('')),
      specialRequirements: z.string().optional().or(z.literal('')),
      internalRemarks: z.string().optional().or(z.literal('')),
      referredBy: z.string().optional().or(z.literal(''))
    }),
    commercialPricing: z.object({
      priceBasis: z.string().optional().default('Ex-Works: Salem, Tamil Nadu'),
      forBasis: z.string().optional().default('Client Own Transport (Default)'),
      transportPrice: z.coerce.number().optional().default(0),
      subTotal: z.coerce.number().optional().default(0),
      gstType: z.string().optional().default('INTRA_STATE'),
      cgstRate: z.coerce.number().optional().default(9),
      sgstRate: z.coerce.number().optional().default(9),
      igstRate: z.coerce.number().optional().default(18),
      cgstAmount: z.coerce.number().optional().default(0),
      sgstAmount: z.coerce.number().optional().default(0),
      igstAmount: z.coerce.number().optional().default(0),
      totalTaxAmount: z.coerce.number().optional().default(0),
      totalAmount: z.coerce.number().optional().default(0),
      amountInWords: z.string().optional().default('')
    }).optional(),
    products: z
      .array(productItemValidator)
      .min(1, 'At least one equipment/product item is mandatory'),
    enquiryType: z.enum([ENQUIRY_TYPES.BUDGETARY, ENQUIRY_TYPES.FIRM]).optional().default(ENQUIRY_TYPES.FIRM),
    referredBy: z.string().optional().or(z.literal('')),
    enquirySource: z.string().optional().or(z.literal('')),
    expectedProjectValue: z.coerce.number().min(0).optional().default(0),
    commands: z.string().optional().default(''),
    enquiryRemarks: z.string().optional().or(z.literal('')),
    eSignature: z
      .object({
        signatureData: z.string().optional().or(z.literal('')),
        signatureType: z.string().optional().default('drawn'),
        signedByName: z.string().optional().or(z.literal('')),
        signedAt: z.coerce.date().optional(),
        employeeId: z.string().optional().or(z.literal('')),
        designation: z.string().optional().or(z.literal(''))
      })
      .optional()
  }).passthrough()
});

