/**
 * Domestic Shipments — Type Definitions
 * Per Cursor "continuation" PRD. Backend wraps responses as { success, data, message }.
 */

export type DomesticCity = string; // lowercase, e.g. 'tripoli', 'al bayda'

export type DomesticTier = 'A' | 'B' | 'C' | 'D';
export const STANDARD_TIERS: DomesticTier[] = ['A', 'B', 'C', 'D'];
/** Tier that requires admin to manually set shippingPrice. A/B/C are auto-calculated by the backend. */
export const MANUAL_PRICE_TIER: DomesticTier = 'D';

export type DomesticStatus =
  | 'awaiting_approval'
  | 'awaiting_shipping'
  | 'in_transit'
  | 'delivered'
  | 'delivery_failed'
  | 'returned'
  | 'cancelled';

export const DOMESTIC_STATUSES: DomesticStatus[] = [
  'awaiting_approval',
  'awaiting_shipping',
  'in_transit',
  'delivered',
  'delivery_failed',
  'returned',
  'cancelled',
];

export type PaidBy = 'sender' | 'receiver';
export type CreationSource = 'app' | 'walk_in';

/** State machine — allowed next states per current status. */
export const ALLOWED_TRANSITIONS: Record<DomesticStatus, DomesticStatus[]> = {
  awaiting_approval: ['awaiting_shipping', 'cancelled'],
  awaiting_shipping: ['in_transit', 'cancelled'],
  in_transit: ['delivered', 'delivery_failed', 'cancelled'],
  delivery_failed: ['in_transit', 'returned'],
  delivered: [],
  returned: [],
  cancelled: [],
};

// ───────── Routes ─────────

export interface Route {
  _id: string;
  originCity: DomesticCity;
  destinationCity: DomesticCity;
  priceTierA: number;
  priceTierB: number;
  priceTierC: number;
  priceTierD: number;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RouteCreateBody {
  originCity: DomesticCity;
  destinationCity: DomesticCity;
  priceTierA: number;
  priceTierB: number;
  priceTierC: number;
  priceTierD: number;
}

export type RouteUpdateBody = Partial<RouteCreateBody>;

export interface RouteListFilters {
  page?: number;
  limit?: number;
  originCity?: DomesticCity;
  destinationCity?: DomesticCity;
}

/** mongoose-paginate envelope */
export interface PaginatedDocs<T> {
  docs: T[];
  totalDocs: number;
  limit: number;
  page: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
  nextPage?: number | null;
  prevPage?: number | null;
}

// ───────── Domestic Shipments ─────────

export interface Recipient {
  name: string;
  primaryPhone: string;
  alternatePhone?: string | null;
  city: DomesticCity;
  address: string;
}

export interface ShipmentOptions {
  fragile?: boolean;
  storeOnDeliveryFailure?: boolean;
  insurance?: boolean;
}

export interface PopulatedSender {
  _id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  uniqueShippingNumber?: string;
}

export interface DomesticShipment {
  _id: string;
  shipmentNumber: string;
  status: DomesticStatus;
  creationSource: CreationSource;
  senderUserId: string | PopulatedSender;
  originCity: DomesticCity;
  recipient: Recipient;
  description: string;
  itemPrice: number;
  itemPaidBy: PaidBy;
  quantity: number;
  tier: DomesticTier;
  shippingPrice: number;
  shippingPaidBy: PaidBy;
  options?: ShipmentOptions;
  notes?: string | null;

  // Wallet posting markers
  shippingChargedAt?: string | null;
  shippingChargedAmount?: number | null;
  itemCreditedAt?: string | null;
  itemCreditedAmount?: number | null;

  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StatusHistoryEntry {
  _id: string;
  fromStatus: DomesticStatus | null;
  toStatus: DomesticStatus;
  note?: string | null;
  changedByUserId?: {
    _id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  } | null;
  // optional flags surfaced by the backend if a wallet posting flipped on this transition
  postedShippingCharge?: boolean;
  postedItemCredit?: boolean;
  createdAt: string;
}

export interface AdminCreateBody {
  senderUserId: string;
  originCity: DomesticCity;
  recipient: Recipient;
  description: string;
  itemPrice?: number;
  quantity?: number;
  tier: DomesticTier;
  /** Required when tier === 'D'. Ignored otherwise (server auto-calculates). */
  shippingPrice?: number;
  options?: ShipmentOptions;
  notes?: string | null;
  status?: 'awaiting_approval' | 'awaiting_shipping' | 'in_transit';
}

export type AdminEditBody = Partial<{
  recipient: Recipient;
  description: string;
  itemPrice: number;
  quantity: number;
  tier: DomesticTier;
  /** Required when tier === 'D'. */
  shippingPrice: number;
  options: ShipmentOptions;
  notes: string | null;
  originCity: DomesticCity;
}>;

export interface ShipmentListFilters {
  status?: DomesticStatus;
  originCity?: DomesticCity;
  destinationCity?: DomesticCity;
  senderUserId?: string;
  q?: string;
  page?: number;
  limit?: number;
}

export interface ShipmentDetailResponse {
  shipment: DomesticShipment;
  history: StatusHistoryEntry[];
}

export interface ChangeStatusBody {
  toStatus: DomesticStatus;
  note?: string;
}

/** 409 details from the state machine. */
export interface InvalidTransitionDetails {
  from: DomesticStatus;
  to: DomesticStatus;
  allowed: DomesticStatus[];
}

export class InvalidTransitionError extends Error {
  details: InvalidTransitionDetails;
  constructor(message: string, details: InvalidTransitionDetails) {
    super(message);
    this.name = 'InvalidTransitionError';
    this.details = details;
  }
}

export class RouteDuplicateError extends Error {
  constructor(message = 'A route already exists for this pair.') {
    super(message);
    this.name = 'RouteDuplicateError';
  }
}

// ───────── Wallet (inline transactions card) ─────────

export type DomesticTxType =
  | 'domestic_shipping_charge'
  | 'domestic_item_credit'
  | string;

// ───────── Label payload ─────────

export interface DomesticLabelData {
  shipmentNumber: string;
  barcode: string;
  createdAt: string;
  status: DomesticStatus;
  tier: DomesticTier;
  origin: {
    city: DomesticCity;
    senderName: string;
    senderPhone: string;
  };
  destination: {
    city: DomesticCity;
    address: string;
    recipientName: string;
    recipientPhone: string;
    recipientAlternatePhone?: string | null;
  };
  parcel: {
    description: string;
    quantity: number;
    itemPrice: number;
    itemCurrency?: string;
  };
  shipping: {
    price: number;
    currency?: string;
  };
  options?: ShipmentOptions;
  notes?: string | null;
}

// ───────── Bulk status ─────────

export interface BulkStatusResult {
  id: string;
  success: boolean;
  error?: string;
}

export interface BulkStatusResponse {
  results: BulkStatusResult[];
  successCount: number;
  failCount: number;
}

export interface WalletTransaction {
  _id: string;
  transactionNumber?: string;
  type: DomesticTxType;
  amount: number;
  description?: string;
  status?: 'pending' | 'completed' | 'failed' | 'reversed' | string;
  balanceBefore?: number;
  balanceAfter?: number;
  metadata?: {
    domesticShipmentId?: string;
    [k: string]: unknown;
  };
  createdAt: string;
}