import { z } from 'zod';

const quotationItemSchema = z.object({
  productId: z.string().optional(),
  productName: z.string().min(1, 'Product name is required'),
  productDescription: z.string().optional().or(z.literal('')),
  voltageRating: z.string().optional().or(z.literal('')),
  currentRating: z.string().optional().or(z.literal('')),
  breakingCapacity: z.string().optional().or(z.literal('')),
  equipmentConfiguration: z.string().optional().or(z.literal('')),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
  unit: z.string().optional().default('Nos'),
  unitPrice: z.coerce.number().min(0, 'Unit price cannot be negative'),
  discountPercent: z.coerce.number().min(0).max(100).optional().default(0),
  taxRatePercent: z.coerce.number().min(0).optional().default(18),
  netAmount: z.coerce.number().min(0)
});

export const createQuotationSchema = z.object({
  body: z.object({
    enquiryId: z.string().min(1, 'Approved enquiry reference is required'),
    validityDays: z.coerce.number().min(1).optional().default(30),
    productPricing: z.array(quotationItemSchema).min(1, 'At least one priced item is required'),
    commercialTerms: z.string().optional(),
    paymentTerms: z.string().optional(),
    deliveryTerms: z.string().optional(),
    warrantyTerms: z.string().optional(),
    discountTotal: z.coerce.number().min(0).optional().default(0),
    freightAndInsurance: z.coerce.number().min(0).optional().default(0),
    taxRatePercent: z.coerce.number().min(0).optional().default(18)
  })
});

export const reviseQuotationSchema = z.object({
  body: z.object({
    revisionRemarks: z.string().trim().min(3, 'Revision reason is required'),
    validityDays: z.coerce.number().min(1).optional().default(30),
    productPricing: z.array(quotationItemSchema).min(1, 'At least one priced item is required'),
    commercialTerms: z.string().optional(),
    paymentTerms: z.string().optional(),
    deliveryTerms: z.string().optional(),
    warrantyTerms: z.string().optional(),
    discountTotal: z.coerce.number().min(0).optional().default(0),
    freightAndInsurance: z.coerce.number().min(0).optional().default(0),
    taxRatePercent: z.coerce.number().min(0).optional().default(18)
  })
});

