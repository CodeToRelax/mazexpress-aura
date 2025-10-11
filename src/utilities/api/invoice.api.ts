import { 
  Invoice, 
  InvoiceFilters,
  GenerateInvoiceRequest,
  ProcessPaymentRequest,
  UpdateInvoiceStatusRequest,
  PaymentAllocation,
} from '@/types/invoice';
import type { Transaction } from '@/types/wallet';
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
 * Invoice API Functions
 */

export async function getInvoices(
  filters: InvoiceFilters = {},
  locale?: string
): Promise<{
  docs: Invoice[];
  totalDocs: number;
  limit: number;
  totalPages: number;
  page: number;
  pagingCounter: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
}> {
  const headers = await getAuthHeaders(locale);
  
  // Build query string
  const params = new URLSearchParams();
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.status) params.append('status', filters.status);
  if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
  if (filters.dateTo) params.append('dateTo', filters.dateTo);
  if (filters.userId) params.append('userId', filters.userId);
  if (filters.sortBy) params.append('sortBy', filters.sortBy);
  if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
  
  const queryString = params.toString();
  const url = `${API_BASE_URL}/api/invoice/my-invoices${queryString ? `?${queryString}` : ''}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers,
  });
  return handleResponse(response);
}

export async function getUserInvoices(
  userId: string,
  filters: Omit<InvoiceFilters, 'userId'> = {},
  locale?: string
): Promise<{
  docs: Invoice[];
  totalDocs: number;
  limit: number;
  totalPages: number;
  page: number;
  pagingCounter: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
}> {
  const headers = await getAuthHeaders(locale);
  
  // Build query string
  const params = new URLSearchParams();
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.status) params.append('status', filters.status);
  if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
  if (filters.dateTo) params.append('dateTo', filters.dateTo);
  if (filters.sortBy) params.append('sortBy', filters.sortBy);
  if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
  
  const queryString = params.toString();
  const url = `${API_BASE_URL}/api/invoice/user/${userId}${queryString ? `?${queryString}` : ''}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers,
  });
  return handleResponse(response);
}

export async function getInvoiceById(
  id: string,
  locale?: string
): Promise<Invoice> {
  const headers = await getAuthHeaders(locale);
  const response = await fetch(`${API_BASE_URL}/api/invoice/${id}`, {
    method: 'GET',
    headers,
  });
  return handleResponse<Invoice>(response);
}

export async function generateInvoice(
  data: GenerateInvoiceRequest,
  locale?: string
): Promise<Invoice> {
  const headers = await getAuthHeaders(locale);
  const response = await fetch(`${API_BASE_URL}/api/invoice/generate`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  return handleResponse<Invoice>(response);
}

export async function processPayment(
  invoiceId: string,
  data: ProcessPaymentRequest,
  locale?: string
): Promise<{
  invoice: Invoice;
  paymentAllocation: PaymentAllocation;
  walletTransaction?: Transaction;
}> {
  const headers = await getAuthHeaders(locale);
  const response = await fetch(`${API_BASE_URL}/api/invoice/${invoiceId}/payment`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}

/**
 * Admin Functions
 */

export async function updateInvoiceStatus(
  invoiceId: string,
  data: UpdateInvoiceStatusRequest,
  locale?: string
): Promise<Invoice> {
  const headers = await getAuthHeaders(locale);
  const response = await fetch(`${API_BASE_URL}/api/invoice/${invoiceId}/status`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(data),
  });
  return handleResponse<Invoice>(response);
}
