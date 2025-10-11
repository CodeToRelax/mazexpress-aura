/**
 * Invoice Type Definitions
 * Defines types for invoice management and payment processing
 */

export interface Invoice {
  _id: string;
  invoiceNumber: string;
  userId: string | {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    uniqueShippingNumber: string;
  };
  status: 'DRAFT' | 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  totals: {
    net: number;
    gross: number;
    paid: number;
    due: number;
  };
  items: InvoiceItem[];
  createdAt: string;
  dueDate: string;
  closedAt?: string;
  notes?: string;
}

export interface InvoiceItem {
  _id: string;
  invoiceId: string;
  shipmentId?: any; // Can be populated with full shipment data
  kind: 'shipment' | 'custom';
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface InvoiceFilters {
  page?: number;
  limit?: number;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  userId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaymentAllocation {
  _id: string;
  invoiceId: string;
  amount: number;
  source: 'WALLET' | 'CASH' | 'BANK_TRANSFER';
  processedAt: string;
  description?: string;
}

export interface GenerateInvoiceRequest {
  userId: string;
  shipmentIds?: string[];
  shipmentStatus?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface ProcessPaymentRequest {
  amount: number;
  source: 'WALLET' | 'CASH' | 'BANK_TRANSFER';
  description: string;
}

export interface UpdateInvoiceStatusRequest {
  status: 'DRAFT' | 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  notes?: string;
}

export interface InvoiceStats {
  total: number;
  unpaid: number;
  overdue: number;
  paid: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
}
