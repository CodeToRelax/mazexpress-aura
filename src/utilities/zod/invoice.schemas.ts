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

export const paymentMethodSchema = z.object({
  source: z.enum(['WALLET', 'CASH', 'BANK_TRANSFER', 'CREDIT_CARD', 'OTHER'], {
    errorMap: () => ({ message: 'Invalid payment source' }),
  }),
  amount: z.coerce.number()
    .min(0.01, 'Amount must be at least 0.01 LYD')
    .max(100000, 'Amount cannot exceed 100,000 LYD'),
  reference: z.string()
    .max(100, 'Reference cannot exceed 100 characters')
    .optional(),
});

export const processPaymentSchema = z.object({
  totalAmount: z.coerce.number()
    .min(0.01, 'Total amount must be at least 0.01 LYD')
    .max(100000, 'Total amount cannot exceed 100,000 LYD'),
  paymentMethods: z.array(paymentMethodSchema)
    .min(1, 'At least one payment method is required')
    .max(5, 'Maximum 5 payment methods allowed'),
  notes: z.string()
    .max(500, 'Notes cannot exceed 500 characters')
    .optional(),
}).refine(
  (data) => {
    const sum = data.paymentMethods.reduce((acc, pm) => acc + pm.amount, 0);
    return Math.abs(sum - data.totalAmount) < 0.01;
  },
  {
    message: 'Sum of payment method amounts must equal total amount',
    path: ['paymentMethods'],
  }
);

export const updateInvoiceStatusSchema = z.object({
  status: z.enum([
    'DRAFT', 
    'SENT', 
    'PENDING',
    'PARTIALLY_PAID',
    'PAID', 
    'OVERDUE',
    'REFUNDED',
    'DISPUTED',
    'VOID',
    'FAILED'
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
    'PARTIALLY_PAID',
    'PAID', 
    'OVERDUE',
    'REFUNDED',
    'DISPUTED',
    'VOID',
    'FAILED'
  ]).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export type PaymentMethodInput = z.infer<typeof paymentMethodSchema>;
export type GenerateInvoiceInput = z.infer<typeof generateInvoiceSchema>;
export type ProcessPaymentInput = z.infer<typeof processPaymentSchema>;
export type UpdateInvoiceStatusInput = z.infer<typeof updateInvoiceStatusSchema>;
export type InvoiceFiltersInput = z.infer<typeof invoiceFiltersSchema>;
