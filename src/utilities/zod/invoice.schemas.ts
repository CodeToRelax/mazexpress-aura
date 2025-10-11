import { z } from 'zod';

/**
 * Invoice Validation Schemas
 * Zod schemas for invoice-related operations
 */

export const generateInvoiceSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  shipmentIds: z.array(z.string())
    .min(1, 'At least one shipment must be selected')
    .max(50, 'Cannot generate invoice for more than 50 shipments at once'),
});

export const processPaymentSchema = z.object({
  amount: z.coerce.number()
    .min(1, 'Amount must be at least 1 LYD')
    .max(10000000, 'Amount cannot exceed 10,000,000 LYD'),
  source: z.enum(['WALLET', 'CASH', 'BANK_TRANSFER'], {
    errorMap: () => ({ message: 'Invalid payment source' }),
  }),
  description: z.string()
    .min(3, 'Description must be at least 3 characters')
    .max(500, 'Description cannot exceed 500 characters'),
});

export const updateInvoiceStatusSchema = z.object({
  status: z.enum(['DRAFT', 'UNPAID', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED'], {
    errorMap: () => ({ message: 'Invalid status' }),
  }),
  notes: z.string()
    .max(500, 'Notes cannot exceed 500 characters')
    .optional(),
});

export const invoiceFiltersSchema = z.object({
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(100).optional(),
  status: z.enum(['DRAFT', 'UNPAID', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED']).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export type GenerateInvoiceInput = z.infer<typeof generateInvoiceSchema>;
export type ProcessPaymentInput = z.infer<typeof processPaymentSchema>;
export type UpdateInvoiceStatusInput = z.infer<typeof updateInvoiceStatusSchema>;
export type InvoiceFiltersInput = z.infer<typeof invoiceFiltersSchema>;
