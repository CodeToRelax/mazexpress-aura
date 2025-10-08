/**
 * Shipment Type Definitions
 * Defines types for shipment management
 */

export enum ShipmentStatus {
  PENDING = 'pending',
  IN_TRANSIT = 'in_transit',
  READY_FOR_PICKUP = 'ready_for_pick_up',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  RETURNED = 'returned',
}

export enum ShippingMethod {
  AIR = 'air',
  SEA = 'sea',
  LAND = 'land',
}

export enum ShipmentDestination {
  LIBYA = 'libya',
  TURKEY = 'turkey',
  CHINA = 'china',
  UAE = 'uae',
  USA = 'usa',
  UK = 'uk',
  GERMANY = 'germany',
  FRANCE = 'france',
  ITALY = 'italy',
  SPAIN = 'spain',
  CANADA = 'canada',
  AUSTRALIA = 'australia',
  JAPAN = 'japan',
  SOUTH_KOREA = 'south_korea',
  INDIA = 'india',
  BRAZIL = 'brazil',
  MEXICO = 'mexico',
  RUSSIA = 'russia',
  SAUDI_ARABIA = 'saudi_arabia',
  EGYPT = 'egypt',
  MOROCCO = 'morocco',
  TUNISIA = 'tunisia',
  ALGERIA = 'algeria',
  SUDAN = 'sudan',
  ETHIOPIA = 'ethiopia',
  KENYA = 'kenya',
  NIGERIA = 'nigeria',
  SOUTH_AFRICA = 'south_africa',
}

export interface IShipmentSize {
  weight?: number;
  height?: number;
  width?: number;
  length?: number;
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
}

export interface BulkUpdatePayload {
  shipmentsId: string[];
  shipmentStatus: string;
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
  searchParam?: string;
  status?: string;
  csn?: string;
  esn?: string;
  isn?: string;
  shipmentDestination?: string;
  shippingMethod?: string;
  isDomestic?: boolean;
  from?: string;
  to?: string;
  sort?: string;
}

export interface ShipmentStats {
  totalShipments: number;
  pendingShipments: number;
  inTransitShipments: number;
  deliveredShipments: number;
  overdueShipments: number;
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
