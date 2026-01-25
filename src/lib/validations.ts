import { z } from 'zod';

// Common validation patterns
export const emailSchema = z.string().email('Invalid email address');
export const phoneSchema = z.string().regex(/^[\d\s\-\+\(\)]+$/, 'Invalid phone number').optional().or(z.literal(''));
export const currencySchema = z.number().min(0, 'Amount must be positive');
export const requiredString = z.string().min(1, 'This field is required');

// Unit validation
export const unitSchema = z.object({
  unit_number: requiredString,
  address: z.string().optional(),
  building: z.string().optional(),
  floor: z.number().int().positive().optional().nullable(),
  bedrooms: z.number().int().positive().optional().nullable(),
  bathrooms: z.number().positive().optional().nullable(),
  square_feet: z.number().int().positive().optional().nullable(),
  parking_spaces: z.number().int().min(0).optional().nullable(),
  notes: z.string().optional(),
});

// Invoice validation
export const invoiceSchema = z.object({
  unit_id: requiredString,
  title: requiredString,
  description: z.string().optional(),
  amount: currencySchema,
  issue_date: requiredString,
  due_date: requiredString,
  category_id: z.string().optional(),
  deposit_account_id: z.string().optional(),
  is_recurring: z.boolean().optional(),
  recurring_frequency: z.enum(['monthly', 'quarterly', 'semi_annually', 'annually']).optional(),
}).refine((data) => {
  const issue = new Date(data.issue_date);
  const due = new Date(data.due_date);
  return due >= issue;
}, {
  message: 'Due date must be on or after issue date',
  path: ['due_date'],
});

// Payment validation
export const paymentSchema = z.object({
  invoice_id: requiredString,
  unit_id: requiredString,
  amount: currencySchema.refine((val) => val > 0, 'Amount must be greater than 0'),
  payment_method: z.enum(['check', 'cash', 'credit_card', 'ach', 'bank_transfer', 'other']),
  payment_date: requiredString,
  reference_number: z.string().optional(),
  notes: z.string().optional(),
});

// Transaction validation
export const transactionSchema = z.object({
  transaction_date: requiredString,
  type: z.enum(['income', 'expense']),
  amount: currencySchema.refine((val) => val > 0, 'Amount must be greater than 0'),
  description: requiredString,
  category_id: z.string().optional(),
});

// HOA settings validation
export const hoaSettingsSchema = z.object({
  name: requiredString,
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().max(2).optional(),
  zip_code: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code').optional().or(z.literal('')),
  phone: phoneSchema,
  email: emailSchema.optional().or(z.literal('')),
});

// Announcement validation
export const announcementSchema = z.object({
  title: requiredString,
  content: z.string().min(10, 'Content must be at least 10 characters'),
  is_pinned: z.boolean().optional(),
});

// Budget line validation
export const budgetLineSchema = z.object({
  category_name: requiredString,
  january: z.number().min(0).optional(),
  february: z.number().min(0).optional(),
  march: z.number().min(0).optional(),
  april: z.number().min(0).optional(),
  may: z.number().min(0).optional(),
  june: z.number().min(0).optional(),
  july: z.number().min(0).optional(),
  august: z.number().min(0).optional(),
  september: z.number().min(0).optional(),
  october: z.number().min(0).optional(),
  november: z.number().min(0).optional(),
  december: z.number().min(0).optional(),
});

export type UnitFormData = z.infer<typeof unitSchema>;
export type InvoiceFormData = z.infer<typeof invoiceSchema>;
export type PaymentFormData = z.infer<typeof paymentSchema>;
export type TransactionFormData = z.infer<typeof transactionSchema>;
export type HOASettingsFormData = z.infer<typeof hoaSettingsSchema>;
export type AnnouncementFormData = z.infer<typeof announcementSchema>;
export type BudgetLineFormData = z.infer<typeof budgetLineSchema>;
