/**
 * Shipment Type Definitions
 * Defines types for shipment management
 */

export enum ShipmentStatus {
  PENDING = 'pending',
  RECEIVED_AT_WAREHOUSE = 'received at warehouse',
  SHIPPED_TO_DESTINATION = 'shipped to destination',
  READY_FOR_PICK_UP = 'ready for pick up',
  DELIVERED = 'delivered',
  IN_TRANSIT = 'in transit',
  CANCELLED = 'cancelled',
  RETURNED = 'returned',
}

export enum ShippingMethod {
  AIR = 'air',
  SEA = 'sea',
  LAND = 'land',
}

export enum Cities {
  BENGHAZI = 'benghazi',
  TRIPOLI = 'tripoli',
  MUSRATA = 'musrata',
  ALBAYDA = 'al bayda',
  ZAWIYA = 'zawiya',
  GHARYAN = 'gharyan',
  TOBRUK = 'tobruk',
  AJDABIYA = 'ajdabiya',
  ZLITEN = 'zliten',
  DERNA = 'derna',
  SIRTE = 'sirte',
  SABHA = 'sabha',
  KHOMS = 'khoms',
  BANI_WALID = 'bani walid',
  SABRATHA = 'sabratha',
  ZUWARA = 'zuwara',
  KUFRA = 'kufra',
  AL_MARJ = 'al marj',
  TARHUNA = 'tarhuna',
  UBARI = 'ubari',
  GADAMES = 'gadames',
  GHAT = 'ghat',
  NALUT = 'nalut',
  JALU = 'jalu',
  BREGA = 'brega',
  ISTANBUL = 'istanbul',
  DUBAI = 'dubai',
  HONGKONG = 'hongkong',
}

export interface IShipmentSize {
  weight: number;
  height: number;
  width: number;
  length: number;
}

export interface IShipment {
  _id: string;
  isn?: string;
  esn: string;
  csn: string;
  size: IShipmentSize;
  shipmentDestination: string;
  shippingMethod: string;
  extraCosts?: number;
  note?: string;
  status: string;
  estimatedArrival?: string;
  isDomestic?: boolean;
  tier?: 'A' | 'B' | 'C' | 'D' | 'E';
  createdAt: string;
  updatedAt: string;
  updatedBy?: string;
}

export interface CreateShipmentPayload {
  isn?: string;
  csn: string;
  size: IShipmentSize;
  shipmentDestination: string;
  shippingMethod: string;
  extraCosts?: number;
  note?: string;
  estimatedArrival?: string;
  isDomestic?: boolean;
  tier?: 'A' | 'B' | 'C' | 'D' | 'E';
}

export interface UpdateShipmentPayload {
  isn?: string;
  csn?: string;
  size?: Partial<IShipmentSize>;
  shipmentDestination?: string;
  shippingMethod?: string;
  extraCosts?: number;
  note?: string;
  status?: string;
  estimatedArrival?: string;
  isDomestic?: boolean;
  tier?: 'A' | 'B' | 'C' | 'D' | 'E';
}

export interface BulkUpdatePayload {
  shipmentsId: string[];
  shipmentStatus: string;
  tier?: 'A' | 'B' | 'C' | 'D' | 'E';
}

export interface BulkUpdateEsnPayload {
  shipmentsEsn: string[];
  shipmentStatus: string;
}

export interface BulkDeletePayload {
  shipmentsId: string[];
}

export interface ShipmentFilters {
  page?: number;
  limit?: number;
  search?: string; // General search term (ESN, CSN, ISN)
  searchParam?: string; // Backend compatibility
  status?: string;
  csn?: string;
  esn?: string;
  isn?: string;
  destination?: string; // Alias for shipmentDestination
  shipmentDestination?: string;
  method?: string; // Alias for shippingMethod
  shippingMethod?: string;
  isDomestic?: boolean;
  tier?: string;
  from?: string;
  to?: string;
  createdAfter?: string; // Date range start
  createdBefore?: string; // Date range end
  sort?: string;
}

export interface ShipmentStats {
  total: number;
  pending: number;
  inTransit: number;
  delivered: number;
  overdue: number;
  receivedAtWarehouse: number;
  shippedToDestination: number;
  readyForPickUp: number;
  cancelled: number;
  returned: number;
  // Backend compatibility
  totalShipments?: number;
  pendingShipments?: number;
  inTransitShipments?: number;
  deliveredShipments?: number;
  overdueShipments?: number;
}

export interface PriceCalculationPayload {
  weight?: string;
  dimensions?: {
    height: number;
    width: number;
    length: number;
  };
  shippingMethod: string;
  destination: string;
  country: string;
  isDomestic?: boolean;
  tier?: 'A' | 'B' | 'C' | 'D' | 'E';
}

export interface ShipmentsPagination {
  currentPage: number;
  totalPages: number;
  totalDocs: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  nextPage: number | null;
  prevPage: number | null;
}

export interface ShipmentsListResponse {
  success: boolean;
  data: {
    shipments: IShipment[];
    pagination: ShipmentsPagination;
  };
  message: string;
}

export interface ShipmentResponse {
  success: boolean;
  data: IShipment;
  message: string;
}

export interface ShipmentStatsResponse {
  success: boolean;
  data: ShipmentStats;
  message: string;
}
