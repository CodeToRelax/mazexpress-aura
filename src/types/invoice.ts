/**
 * Invoice Type Definitions
 * Defines types for invoice management and payment processing
 */

export type InvoiceStatus = 
  | 'DRAFT' 
  | 'SENT' 
  | 'PENDING' 
  | 'PAID' 
  | 'OVERDUE' 
  | 'CANCELLED'
  | 'VOID';

export type PaymentSource = 
  | 'WALLET' 
  | 'CASH' 
  | 'BANK_TRANSFER' 
  | 'CREDIT_CARD' 
  | 'OTHER';

export type InvoiceItemKind = 
  | 'SHIPMENT' 
  | 'SURCHARGE' 
  | 'DISCOUNT' 
  | 'ADJUSTMENT';

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
  status: InvoiceStatus;
  totals: {
    net: number;
    tax: number;
    gross: number;
    paid: number;
    due: number;
  };
  items: InvoiceItem[];
  createdAt: string;
  issueDate?: string;
  dueDate: string;
  closedAt?: string;
  notes?: string;
  paymentAllocations?: PaymentAllocation[];
  currency?: string;
  discountTotal?: number;
  extraChargesTotal?: number;
  sentAt?: string;
  createdBy?: string;
  lastModifiedBy?: string;
}

export interface InvoiceItem {
  _id: string;
  invoiceId: string;
  shipmentId?: any; // Can be populated with full shipment data
  kind: InvoiceItemKind;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number;
  taxAmount?: number;
  totalNet?: number;
  totalGross?: number;
}

export interface InvoiceFilters {
  page?: number;
  limit?: number;
  status?: InvoiceStatus;
  from?: string;
  to?: string;
  search?: string;
  userId?: string;
}

export interface PaymentAllocation {
  _id: string;
  invoiceId: string;
  amount: number;
  source: PaymentSource;
  happenedAt?: string;
  processedAt?: string; // Backward compatibility
  reference?: string;
  currency?: string;
  createdBy?: string;
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
  source: PaymentSource;
  reference?: string;
}

export interface UpdateInvoiceStatusRequest {
  status: InvoiceStatus;
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
