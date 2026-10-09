import { z } from 'zod';

export const expenseCategories = [
  'hotel',
  'accommodation',
  'food',
  'transport',
  'fuel',
  'activities',
  'shopping',
  'medical',
  'other',
] as const;

export const expenseCurrencies = ['INR', 'USD', 'EUR', 'GBP'] as const;

export const participantShareSchema = z.object({
  user: z.string().trim(),
  shareAmount: z.number().min(0).optional(),
  percentage: z.number().min(0).max(100).optional(),
});

export const createExpenseSchema = z.object({
  amount: z.number().positive('Amount must be greater than 0.').max(100_000_000),
  currency: z.enum(expenseCurrencies),
  description: z.string().trim().min(1, 'Description is required.').max(120),
  category: z.enum(expenseCategories),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must use YYYY-MM-DD format.'),
  splitMethod: z.enum(['equal', 'percentage', 'custom']).default('equal'),
  participants: z.array(participantShareSchema).optional(),
  notes: z.string().trim().max(300).optional().default(''),
});

export const updateExpenseSchema = createExpenseSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, 'Provide at least one field to update.');

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
