/**
 * Warehouse Type Definitions
 * Defines types for warehouse management and operations
 */

export enum WarehouseStatus {
  OPEN = 'open',
  CLOSED = 'closed',
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

export enum Countries {
  LIBYA = 'libya',
  TURKEY = 'turkey',
  CHINA = 'china',
  UAE = 'uae',
}

export interface WarehouseCoordinates {
  latitude: number;
  longitude: number;
}

export interface WarehouseAddress {
  doorNumber?: string;
  buildingNumber?: string;
  street?: string;
  neighborhood?: string;
  district?: string;
  city: Cities;
  country: Countries;
  googleMapsUrl: string;
  zipCode: string;
  coordinates: WarehouseCoordinates;
}

export interface WarehouseDayHours {
  isOpen: boolean;
  openTime?: string; // Format: "HH:MM" (24-hour)
  closeTime?: string; // Format: "HH:MM" (24-hour)
  breakStartTime?: string; // Format: "HH:MM" (24-hour)
  breakEndTime?: string; // Format: "HH:MM" (24-hour)
}

export interface WarehouseOperatingHours {
  monday: WarehouseDayHours;
  tuesday: WarehouseDayHours;
  wednesday: WarehouseDayHours;
  thursday: WarehouseDayHours;
  friday: WarehouseDayHours;
  saturday: WarehouseDayHours;
  sunday: WarehouseDayHours;
}

export interface Warehouse {
  _id: string;
  name: string;
  address: WarehouseAddress;
  phoneNumber?: string;
  email?: string;
  youtubeUrl?: string;
  imageUrl?: string;
  status: WarehouseStatus;
  operatingHours: WarehouseOperatingHours;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WarehouseFilters {
  page?: number;
  limit?: number;
  status?: WarehouseStatus;
  city?: string;
  country?: string;
  search?: string;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedWarehousesResponse {
  warehouses: Warehouse[];
  pagination: PaginationInfo;
}

export interface WarehouseApiResponse {
  success: boolean;
  data: Warehouse;
  message: string;
}

export interface WarehousesApiResponse {
  success: boolean;
  data: PaginatedWarehousesResponse;
  message: string;
}

export interface CreateWarehouseRequest {
  name: string;
  address: WarehouseAddress;
  phoneNumber?: string;
  email?: string;
  youtubeUrl?: string;
  imageUrl?: string;
  status: WarehouseStatus;
  operatingHours: WarehouseOperatingHours;
}

export interface UpdateWarehouseRequest extends Partial<CreateWarehouseRequest> {}

export interface ToggleWarehouseStatusRequest {
  status: WarehouseStatus;
}
