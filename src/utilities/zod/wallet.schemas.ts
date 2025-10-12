import { z } from 'zod';

/**
 * Wallet Validation Schemas
 * Zod schemas for wallet-related operations
 */

export const depositSchema = z.object({
  amount: z.coerce.number()
    .min(0.01, 'Amount must be at least 0.01 LYD')
    .max(100000, 'Amount cannot exceed 100,000 LYD'),
  description: z.string()
    .min(1, 'Description must be at least 1 character')
    .max(500, 'Description cannot exceed 500 characters'),
  reference: z.string()
    .max(100, 'Reference cannot exceed 100 characters')
    .optional()
    .or(z.literal('')),
}).required();

export const withdrawalSchema = z.object({
  amount: z.coerce.number()
    .min(0.01, 'Amount must be at least 0.01 LYD')
    .max(100000, 'Amount cannot exceed 100,000 LYD'),
  description: z.string()
    .min(1, 'Description must be at least 1 character')
    .max(500, 'Description cannot exceed 500 characters'),
  reference: z.string()
    .max(100, 'Reference cannot exceed 100 characters')
    .optional()
    .or(z.literal('')),
}).required();

export const adminTransactionSchema = z.object({
  walletId: z.string().min(1, 'Wallet ID is required'),
  type: z.enum(['deposit', 'withdrawal', 'deduction', 'refund', 'transfer'], {
    errorMap: () => ({ message: 'Type must be deposit, withdrawal, deduction, refund, or transfer' }),
  }),
  amount: z.coerce.number()
    .min(0.01, 'Amount must be at least 0.01 LYD')
    .max(100000, 'Amount cannot exceed 100,000 LYD'),
  description: z.string()
    .min(1, 'Description must be at least 1 character')
    .max(500, 'Description cannot exceed 500 characters'),
  reference: z.string()
    .max(100, 'Reference cannot exceed 100 characters')
    .optional()
    .or(z.literal('')),
});

export const createWalletSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  currency: z.string().min(2, 'Currency code is required').default('LYD'),
});

export const transactionFiltersSchema = z.object({
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(100).optional(),
  type: z.enum(['deposit', 'withdrawal', 'deduction', 'refund', 'transfer']).optional(),
  status: z.enum(['pending', 'completed', 'failed', 'cancelled']).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export const refundSchema = z.object({
  amount: z.coerce.number()
    .min(0.01, 'Amount must be at least 0.01 LYD')
    .max(100000, 'Amount cannot exceed 100,000 LYD'),
  description: z.string()
    .min(1, 'Description must be at least 1 character')
    .max(500, 'Description cannot exceed 500 characters'),
  reference: z.string()
    .max(100, 'Reference cannot exceed 100 characters')
    .optional()
    .or(z.literal('')),
}).required();

export const transferSchema = z.object({
  toWalletId: z.string().min(1, 'Destination wallet ID is required'),
  amount: z.coerce.number()
    .min(0.01, 'Amount must be at least 0.01 LYD')
    .max(100000, 'Amount cannot exceed 100,000 LYD'),
  description: z.string()
    .min(1, 'Description must be at least 1 character')
    .max(500, 'Description cannot exceed 500 characters'),
  reference: z.string()
    .max(100, 'Reference cannot exceed 100 characters')
    .optional()
    .or(z.literal('')),
}).required();

export type DepositInput = z.infer<typeof depositSchema>;
export type WithdrawalInput = z.infer<typeof withdrawalSchema>;
export type AdminTransactionInput = z.infer<typeof adminTransactionSchema>;
export type CreateWalletInput = z.infer<typeof createWalletSchema>;
export type TransactionFiltersInput = z.infer<typeof transactionFiltersSchema>;
export type RefundInput = z.infer<typeof refundSchema>;
export type TransferInput = z.infer<typeof transferSchema>;
