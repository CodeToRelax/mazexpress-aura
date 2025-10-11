import { z } from 'zod';

/**
 * Wallet Validation Schemas
 * Zod schemas for wallet-related operations
 */

export const depositSchema = z.object({
  amount: z.coerce.number()
    .min(1, 'Amount must be at least 1 LYD')
    .max(1000000, 'Amount cannot exceed 1,000,000 LYD'),
  description: z.string()
    .min(3, 'Description must be at least 3 characters')
    .max(200, 'Description cannot exceed 200 characters'),
}).required();

export const withdrawalSchema = z.object({
  amount: z.coerce.number()
    .min(1, 'Amount must be at least 1 LYD')
    .max(1000000, 'Amount cannot exceed 1,000,000 LYD'),
  description: z.string()
    .min(3, 'Description must be at least 3 characters')
    .max(200, 'Description cannot exceed 200 characters'),
}).required();

export const adminTransactionSchema = z.object({
  walletId: z.string().min(1, 'Wallet ID is required'),
  type: z.enum(['DEPOSIT', 'WITHDRAWAL', 'DEDUCTION', 'REFUND'], {
    errorMap: () => ({ message: 'Type must be DEPOSIT, WITHDRAWAL, DEDUCTION, or REFUND' }),
  }),
  amount: z.coerce.number()
    .min(1, 'Amount must be at least 1 LYD')
    .max(1000000, 'Amount cannot exceed 1,000,000 LYD'),
  description: z.string()
    .min(3, 'Description must be at least 3 characters')
    .max(200, 'Description cannot exceed 200 characters'),
  reference: z.string().optional(),
});

export const createWalletSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  currency: z.string().min(2, 'Currency code is required').default('LYD'),
});

export const transactionFiltersSchema = z.object({
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(100).optional(),
  type: z.enum(['DEPOSIT', 'WITHDRAWAL', 'DEDUCTION', 'REFUND']).optional(),
  status: z.enum(['PENDING', 'COMPLETED', 'FAILED']).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export type DepositInput = z.infer<typeof depositSchema>;
export type WithdrawalInput = z.infer<typeof withdrawalSchema>;
export type AdminTransactionInput = z.infer<typeof adminTransactionSchema>;
export type CreateWalletInput = z.infer<typeof createWalletSchema>;
export type TransactionFiltersInput = z.infer<typeof transactionFiltersSchema>;
