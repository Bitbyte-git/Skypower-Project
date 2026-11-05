import { z } from 'zod';
import { ROLE_LIST } from '../constants/roles.js';

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email('Invalid email address format'),
    password: z.string().min(1, 'Password is required')
  })
});

export const createUserSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters'),
    email: z.string().trim().email('Invalid email address format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(ROLE_LIST, { errorMap: () => ({ message: 'Invalid role' }) }),
    phone: z.string().regex(/^[0-9]{10}$/, 'Phone number must be exactly 10 digits').optional().or(z.literal('')),
    department: z.string().optional()
  })
});

