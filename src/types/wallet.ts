/**
 * Wallet Type Definitions
 * Defines types for wallet management and transactions
 */

export interface Wallet {
  _id: string;
  userId: string | {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  balance: number;
  currency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  _id: string;
  walletId: string | { _id: string; currency: string };
  userId: string;
  transactionNumber: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'DEDUCTION' | 'REFUND';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  reference?: string;
  createdAt: string;
}

export interface TransactionFilters {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface WalletStats {
  balance: number;
  totalDeposits: number;
  totalWithdrawals: number;
  pendingTransactions: number;
}

export type DepositRequest = {
  amount: number;
  description: string;
};

export type WithdrawRequest = {
  amount: number;
  description: string;
};

export interface AdminTransactionRequest {
  walletId: string;
  type: 'DEDUCTION' | 'REFUND';
  amount: number;
  description: string;
  reference?: string;
}

export interface CreateWalletRequest {
  userId: string;
  currency: string;
}
