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
  status: 'draft' | 'unpaid' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled';
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
}

export interface PaymentAllocation {
  _id: string;
  invoiceId: string;
  amount: number;
  source: 'wallet' | 'cash' | 'bank_transfer';
  paymentMethod: string;
  processedAt: string;
  notes?: string;
}

export interface GenerateInvoiceRequest {
  shipmentIds: string[];
  dueDate: string;
  notes?: string;
}

export interface ProcessPaymentRequest {
  amount: number;
  source: 'wallet' | 'cash' | 'bank_transfer';
  paymentMethod: string;
  notes?: string;
}

export interface UpdateInvoiceStatusRequest {
  status: 'draft' | 'unpaid' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled';
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
