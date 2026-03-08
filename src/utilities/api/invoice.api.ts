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

export async function getAllInvoices(
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
  
  const params = new URLSearchParams();
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.status) params.append('status', filters.status);
  if (filters.from) params.append('from', filters.from);
  if (filters.to) params.append('to', filters.to);
  if (filters.search) params.append('search', filters.search);
  if (filters.userId) params.append('userId', filters.userId);
  
  const queryString = params.toString();
  const url = `${API_BASE_URL}/api/invoice${queryString ? `?${queryString}` : ''}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers,
  });
  return handleResponse(response);
}

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
  
  const params = new URLSearchParams();
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.status) params.append('status', filters.status);
  if (filters.from) params.append('from', filters.from);
  if (filters.to) params.append('to', filters.to);
  
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
  
  const params = new URLSearchParams();
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.status) params.append('status', filters.status);
  if (filters.from) params.append('from', filters.from);
  if (filters.to) params.append('to', filters.to);
  
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

export interface DeleteInvoiceResult {
  invoiceId: string;
  invoiceNumber: string;
  cascade: {
    transactionsDeleted: number;
    allocationsDeleted: number;
    itemsDeleted: number;
    shipmentsFreed: string[];
    totalBalanceReversed: number;
  };
}

export async function deleteInvoice(
  invoiceId: string,
  options?: { force?: boolean },
  locale?: string
): Promise<DeleteInvoiceResult> {
  const headers = await getAuthHeaders(locale);
  
  const params = new URLSearchParams();
  if (options?.force) {
    params.append('force', 'true');
  }
  const queryString = params.toString();
  const url = `${API_BASE_URL}/api/invoice/${invoiceId}${queryString ? `?${queryString}` : ''}`;
  
  const response = await fetch(url, {
    method: 'DELETE',
    headers,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: 'Failed to delete invoice',
      code: 'UNKNOWN_ERROR',
    }));
    throw new Error(error.message);
  }
  
  const data = await response.json();
  return data.data;
}

export async function cancelInvoice(
  invoiceId: string,
  locale?: string
): Promise<Invoice> {
  return updateInvoiceStatus(invoiceId, { status: 'VOID' }, locale);
}

export async function getInvoiceByShipmentId(
  shipmentId: string,
  locale?: string
): Promise<Invoice | null> {
  const headers = await getAuthHeaders(locale);
  const response = await fetch(`${API_BASE_URL}/api/invoice/by-shipment/${shipmentId}`, {
    method: 'GET',
    headers,
  });
  if (response.status === 404) return null;
  return handleResponse<Invoice>(response);
}
