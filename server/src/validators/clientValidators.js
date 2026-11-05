import { z } from 'zod';

export const clientSchema = z.object({
  body: z.object({
    companyName: z
      .string()
      .trim()
      .min(2, 'Company Name is mandatory (at least 2 characters)')
      .max(200, 'Company Name cannot exceed 200 characters'),
    customerType: z
      .string()
      .trim()
      .min(1, 'Contractor or End User selection is mandatory'),
    contactPerson: z
      .string()
      .trim()
      .min(1, 'Contact Person Name is mandatory')
      .max(50, 'Contact Person Name cannot exceed 50 characters'),
    mobile: z
      .string()
      .trim()
      .regex(/^[0-9]{10}$/, 'Contact No must be exactly 10 digits'),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .max(30, 'Email ID cannot exceed 30 characters')
      .optional()
      .or(z.literal('')),
    siteAddress: z
      .string()
      .trim()
      .max(250, 'Site Address cannot exceed 250 characters')
      .optional()
      .or(z.literal('')),
    clientLocation: z
      .string()
      .trim()
      .optional()
      .or(z.literal('')),
    officePhone: z
      .string()
      .trim()
      .optional()
      .or(z.literal('')),
    website: z
      .string()
      .trim()
      .optional()
      .or(z.literal('')),
    billingAddress: z
      .object({
        street: z.string().optional().or(z.literal('')),
        city: z.string().optional().or(z.literal('')),
        state: z.string().optional().or(z.literal('')),
        postalCode: z.string().optional().or(z.literal('')),
        country: z.string().optional().or(z.literal(''))
      })
      .optional(),
    gstNumber: z
      .string()
      .trim()
      .optional()
      .or(z.literal('')),
    additionalContacts: z
      .array(
        z.object({
          name: z.string().optional(),
          designation: z.string().optional(),
          phone: z.string().optional(),
          email: z.string().optional()
        })
      )
      .optional()
  })
});
