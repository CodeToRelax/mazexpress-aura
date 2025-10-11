import { z } from 'zod';

/**
 * Invoice Validation Schemas
 * Zod schemas for invoice-related operations
 */

export const generateInvoiceSchema = z.object({
  shipmentIds: z.array(z.string())
    .min(1, 'At least one shipment must be selected')
    .max(50, 'Cannot generate invoice for more than 50 shipments at once'),
  dueDate: z.string()
    .min(1, 'Due date is required')
    .refine((date) => {
      const dueDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return dueDate >= today;
    }, 'Due date must be today or in the future'),
  notes: z.string()
    .max(500, 'Notes cannot exceed 500 characters')
    .optional(),
});

export const processPaymentSchema = z.object({
  amount: z.number()
    .min(1, 'Amount must be at least 1 LYD')
    .max(10000000, 'Amount cannot exceed 10,000,000 LYD'),
  source: z.enum(['wallet', 'cash', 'bank_transfer'], {
    errorMap: () => ({ message: 'Invalid payment source' }),
  }),
  paymentMethod: z.string()
    .min(1, 'Payment method is required')
    .max(100, 'Payment method cannot exceed 100 characters'),
  notes: z.string()
    .max(500, 'Notes cannot exceed 500 characters')
    .optional(),
});

export const updateInvoiceStatusSchema = z.object({
  status: z.enum(['draft', 'unpaid', 'partially_paid', 'paid', 'overdue', 'cancelled'], {
    errorMap: () => ({ message: 'Invalid status' }),
  }),
  notes: z.string()
    .max(500, 'Notes cannot exceed 500 characters')
    .optional(),
});

export const invoiceFiltersSchema = z.object({
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(100).optional(),
  status: z.enum(['draft', 'unpaid', 'partially_paid', 'paid', 'overdue', 'cancelled']).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export type GenerateInvoiceInput = z.infer<typeof generateInvoiceSchema>;
export type ProcessPaymentInput = z.infer<typeof processPaymentSchema>;
export type UpdateInvoiceStatusInput = z.infer<typeof updateInvoiceStatusSchema>;
export type InvoiceFiltersInput = z.infer<typeof invoiceFiltersSchema>;
