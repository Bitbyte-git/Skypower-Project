import { z } from 'zod';

export const approvalActionSchema = z.object({
  body: z.object({
    remarks: z.string().optional()
  })
});

export const returnActionSchema = z.object({
  body: z.object({
    remarks: z
      .string()
      .trim()
      .optional()
      .transform((val) => (val && val.length >= 3 ? val : 'Administrative review requested: please verify technical parameters, ratings, and bill of quantities before resubmitting.'))
  })
});

export const rejectActionSchema = z.object({
  body: z.object({
    remarks: z
      .string()
      .trim()
      .optional()
      .transform((val) => (val && val.length >= 3 ? val : 'Administrative rejection: commercial or technical non-compliance with plant production capabilities.'))
  })
});

