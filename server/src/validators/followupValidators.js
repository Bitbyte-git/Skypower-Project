import { z } from 'zod';
import { FOLLOWUP_STATUSES, FOLLOWUP_TYPES } from '../constants/statuses.js';

export const createFollowupSchema = z.object({
  body: z.object({
    enquiryId: z.string().min(1, 'Enquiry reference is required'),
    type: z.enum(Object.values(FOLLOWUP_TYPES)),
    followupDate: z.coerce.date().optional(),
    discussionNotes: z.string().trim().min(3, 'Discussion notes are required'),
    clientResponse: z.string().optional().or(z.literal('')),
    nextFollowupDate: z.coerce.date().optional(),
    status: z.enum(Object.values(FOLLOWUP_STATUSES)).optional().default(FOLLOWUP_STATUSES.PENDING)
  })
});

export const updateFollowupSchema = z.object({
  body: z.object({
    discussionNotes: z.string().trim().min(3).optional(),
    clientResponse: z.string().optional().or(z.literal('')),
    nextFollowupDate: z.coerce.date().optional(),
    status: z.enum(Object.values(FOLLOWUP_STATUSES)).optional()
  })
});

