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
  type: 'deposit' | 'withdrawal' | 'deduction' | 'refund' | 'transfer';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  reference?: string;
  invoiceId?: string;
  createdAt: string;
}

export interface DeleteTransactionResponse {
  transactionId: string;
  balanceReversed: boolean;
  balanceChange: number;
  newWalletBalance: number;
  invoiceUpdated: boolean;
  paymentAllocationDeleted: boolean;
}

export interface TransactionFilters {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
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
  reference?: string;
};

export type WithdrawRequest = {
  amount: number;
  description: string;
  reference?: string;
};

export type RefundRequest = {
  amount: number;
  description: string;
  reference?: string;
};

export type TransferRequest = {
  toWalletId: string;
  amount: number;
  description: string;
  reference?: string;
};

export interface AdminTransactionRequest {
  walletId: string;
  type: 'deposit' | 'withdrawal' | 'deduction' | 'refund' | 'transfer';
  amount: number;
  description: string;
  reference?: string;
}

export interface CreateWalletRequest {
  userId: string;
  currency: string;
}

export interface WalletBalance {
  balance: number;
  currency: string;
}

export interface TransferResponse {
  fromWallet: Wallet;
  toWallet: Wallet;
  fromTransaction: Transaction;
  toTransaction: Transaction;
}

export interface TransactionPaginationResponse {
  transactions: Transaction[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}
