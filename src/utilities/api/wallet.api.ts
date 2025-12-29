import { 
  Wallet, 
  Transaction, 
  TransactionFilters,
  DepositRequest,
  WithdrawRequest,
  RefundRequest,
  TransferRequest,
  AdminTransactionRequest,
  CreateWalletRequest,
  WalletBalance,
  TransferResponse,
  TransactionPaginationResponse,
  DeleteTransactionResponse,
} from '@/types/wallet';
import { getFirebaseAuth } from '@/utilities/firebase/firebase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * Get authorization headers with JWT token
 */
async function getAuthHeaders(locale?: string): Promise<HeadersInit> {
  // Get Firebase auth token
  const auth = getFirebaseAuth();
  const token = await auth.currentUser?.getIdToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  if (locale) {
    headers['Accept-Language'] = locale;
  }
  
  return headers;
}

/**
 * Handle API response and errors
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: 'An error occurred',
      success: false,
    }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }
  
  const data = await response.json();
  return data.data;
}

/**
 * Wallet API Functions
 */

export async function getWallet(locale?: string): Promise<Wallet> {
  const headers = await getAuthHeaders(locale);
  const response = await fetch(`${API_BASE_URL}/api/wallet`, {
    method: 'GET',
    headers,
  });
  return handleResponse<Wallet>(response);
}

export async function getWalletBalance(locale?: string): Promise<WalletBalance> {
  const headers = await getAuthHeaders(locale);
  const response = await fetch(`${API_BASE_URL}/api/wallet/balance`, {
    method: 'GET',
    headers,
  });
  return handleResponse<WalletBalance>(response);
}

export async function deposit(
  data: DepositRequest,
  locale?: string
): Promise<{ wallet: Wallet; transaction: Transaction }> {
  const headers = await getAuthHeaders(locale);
  const response = await fetch(`${API_BASE_URL}/api/wallet/deposit`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  return handleResponse<{ wallet: Wallet; transaction: Transaction }>(response);
}

export async function withdraw(
  data: WithdrawRequest,
  locale?: string
): Promise<{ wallet: Wallet; transaction: Transaction }> {
  const headers = await getAuthHeaders(locale);
  const response = await fetch(`${API_BASE_URL}/api/wallet/withdraw`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  return handleResponse<{ wallet: Wallet; transaction: Transaction }>(response);
}

export async function refund(
  data: RefundRequest,
  locale?: string
): Promise<{ wallet: Wallet; transaction: Transaction }> {
  const headers = await getAuthHeaders(locale);
  const response = await fetch(`${API_BASE_URL}/api/wallet/refund`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  return handleResponse<{ wallet: Wallet; transaction: Transaction }>(response);
}

export async function transfer(
  data: TransferRequest,
  locale?: string
): Promise<TransferResponse> {
  const headers = await getAuthHeaders(locale);
  const response = await fetch(`${API_BASE_URL}/api/wallet/transfer`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  return handleResponse<TransferResponse>(response);
}

export async function getTransactions(
  filters: TransactionFilters = {},
  locale?: string
): Promise<TransactionPaginationResponse> {
  const headers = await getAuthHeaders(locale);
  
  // Build query string
  const params = new URLSearchParams();
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.type) params.append('type', filters.type);
  if (filters.status) params.append('status', filters.status);
  if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
  if (filters.dateTo) params.append('dateTo', filters.dateTo);
  if (filters.search) params.append('search', filters.search);
  
  const queryString = params.toString();
  const url = `${API_BASE_URL}/api/wallet/transactions${queryString ? `?${queryString}` : ''}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers,
  });
  
  const rawData = await response.json();
  
  if (!response.ok) {
    const error = rawData;
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }
  
  const backendData = rawData.data;
  
  // Transform backend response to match frontend interface
  return {
    transactions: backendData.docs || [],
    pagination: {
      currentPage: backendData.page || 1,
      totalPages: backendData.totalPages || 0,
      totalItems: backendData.totalDocs || 0,
      itemsPerPage: backendData.limit || 10,
      hasNextPage: backendData.hasNextPage || false,
      hasPrevPage: backendData.hasPrevPage || false,
    }
  };
}

/**
 * Admin Functions
 */

export async function createWallet(
  data: CreateWalletRequest,
  locale?: string
): Promise<Wallet> {
  const headers = await getAuthHeaders(locale);
  const response = await fetch(`${API_BASE_URL}/api/wallet/admin/create`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  return handleResponse<Wallet>(response);
}

export async function processTransaction(
  data: AdminTransactionRequest,
  locale?: string
): Promise<{ wallet: Wallet; transaction: Transaction }> {
  const headers = await getAuthHeaders(locale);
  const response = await fetch(`${API_BASE_URL}/api/wallet/admin/process-transaction`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  return handleResponse<{ wallet: Wallet; transaction: Transaction }>(response);
}

export async function getWalletByUserId(
  userId: string,
  locale?: string
): Promise<Wallet> {
  const headers = await getAuthHeaders(locale);
  const response = await fetch(`${API_BASE_URL}/api/wallet/admin/user/${userId}`, {
    method: 'GET',
    headers,
  });
  return handleResponse<Wallet>(response);
}

export async function getUserTransactions(
  userId: string,
  filters: TransactionFilters = {},
  locale?: string
): Promise<TransactionPaginationResponse> {
  const headers = await getAuthHeaders(locale);
  
  // Build query string
  const params = new URLSearchParams();
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.type) params.append('type', filters.type);
  if (filters.status) params.append('status', filters.status);
  if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
  if (filters.dateTo) params.append('dateTo', filters.dateTo);
  if (filters.search) params.append('search', filters.search);
  
  const queryString = params.toString();
  const url = `${API_BASE_URL}/api/wallet/admin/user/${userId}/transactions${queryString ? `?${queryString}` : ''}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers,
  });
  
  const rawData = await response.json();
  
  if (!response.ok) {
    const error = rawData;
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }
  
  const backendData = rawData.data;
  
  // Transform backend response to match frontend interface
  return {
    transactions: backendData.docs || [],
    pagination: {
      currentPage: backendData.page || 1,
      totalPages: backendData.totalPages || 0,
      totalItems: backendData.totalDocs || 0,
      itemsPerPage: backendData.limit || 10,
      hasNextPage: backendData.hasNextPage || false,
      hasPrevPage: backendData.hasPrevPage || false,
    }
  };
}

export async function updateTransaction(
  transactionId: string,
  data: { description?: string; reference?: string },
  locale?: string
): Promise<Transaction> {
  const headers = await getAuthHeaders(locale);
  const response = await fetch(`${API_BASE_URL}/api/wallet/admin/transaction/${transactionId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(data),
  });
  return handleResponse<Transaction>(response);
}

export async function deleteTransaction(
  transactionId: string,
  force?: boolean,
  locale?: string
): Promise<DeleteTransactionResponse> {
  const headers = await getAuthHeaders(locale);
  const url = `${API_BASE_URL}/api/wallet/admin/transaction/${transactionId}${force ? '?force=true' : ''}`;
  const response = await fetch(url, {
    method: 'DELETE',
    headers,
  });
  return handleResponse<DeleteTransactionResponse>(response);
}
