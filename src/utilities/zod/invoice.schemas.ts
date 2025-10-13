import { z } from 'zod';

/**
 * Invoice Validation Schemas
 * Zod schemas for invoice-related operations
 */

export const generateInvoiceSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  shipmentIds: z.array(z.string())
    .max(50, 'Cannot generate invoice for more than 50 shipments at once')
    .optional(),
  shipmentStatus: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
}).refine(
  (data) => data.shipmentIds || data.shipmentStatus,
  {
    message: 'Either shipmentIds or shipmentStatus must be provided',
  }
);

export const processPaymentSchema = z.object({
  amount: z.coerce.number()
    .min(0.01, 'Amount must be at least 0.01 LYD')
    .max(100000, 'Amount cannot exceed 100,000 LYD'),
  source: z.enum(['WALLET', 'CASH', 'BANK_TRANSFER', 'CREDIT_CARD', 'OTHER'], {
    errorMap: () => ({ message: 'Invalid payment source' }),
  }),
  reference: z.string()
    .max(100, 'Reference cannot exceed 100 characters')
    .optional(),
});

export const updateInvoiceStatusSchema = z.object({
  status: z.enum([
    'DRAFT', 
    'SENT', 
    'PENDING', 
    'PAID', 
    'OVERDUE', 
    'CANCELLED',
    'VOID'
  ], {
    errorMap: () => ({ message: 'Invalid status' }),
  }),
});

export const invoiceFiltersSchema = z.object({
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(100).optional(),
  status: z.enum([
    'DRAFT', 
    'SENT', 
    'PENDING', 
    'PAID', 
    'OVERDUE', 
    'CANCELLED',
    'VOID'
  ]).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export type GenerateInvoiceInput = z.infer<typeof generateInvoiceSchema>;
export type ProcessPaymentInput = z.infer<typeof processPaymentSchema>;
export type UpdateInvoiceStatusInput = z.infer<typeof updateInvoiceStatusSchema>;
export type InvoiceFiltersInput = z.infer<typeof invoiceFiltersSchema>;
