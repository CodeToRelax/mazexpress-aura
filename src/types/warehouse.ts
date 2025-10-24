/**
 * Warehouse Type Definitions
 * Defines types for warehouse management and operations
 */

export enum WarehouseStatus {
  OPEN = 'open',
  CLOSED = 'closed',
}

export enum Cities {
  // Libya Cities (30+ cities)
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
  KUFFRA = 'kufra',
  AL_MARJ = 'al marj',
  TARHUNA = 'tarhuna',
  UBARI = 'ubari',
  GADAMES = 'gadames',
  GHAT = 'ghat',
  NALUT = 'nalut',
  JALU = 'jalu',
  BREGA = 'brega',
  MISRATA = 'misrata',
  AL_KHUMS = 'al khums',
  DARNAH = 'darnah',
  YAFRAN = 'yafran',
  SHAHAT = 'shahat',
  BAYDA = 'bayda',
  MARSA_BREGA = 'marsa brega',

  // Turkey Cities (15+ major cities)
  ISTANBUL = 'istanbul',
  ANKARA = 'ankara',
  IZMIR = 'izmir',
  BURSA = 'bursa',
  ANTALYA = 'antalya',
  ADANA = 'adana',
  KONYA = 'konya',
  GAZIANTEP = 'gaziantep',
  MERSIN = 'mersin',
  KAYSERI = 'kayseri',
  ESKISEHIR = 'eskisehir',
  DIYARBAKIR = 'diyarbakir',
  SAMSUN = 'samsun',
  DENIZLI = 'denizli',
  MALATYA = 'malatya',
  TRABZON = 'trabzon',
  ERZURUM = 'erzurum',

  // China Cities (15+ major cities)
  HONGKONG = 'hongkong',
  BEIJING = 'beijing',
  SHANGHAI = 'shanghai',
  GUANGZHOU = 'guangzhou',
  SHENZHEN = 'shenzhen',
  CHENGDU = 'chengdu',
  WUHAN = 'wuhan',
  XI_AN = 'xi an',
  NANJING = 'nanjing',
  HANGZHOU = 'hangzhou',
  TIANJIN = 'tianjin',
  QINGDAO = 'qingdao',
  DALIAN = 'dalian',
  SUZHOU = 'suzhou',
  CHONGQING = 'chongqing',
  KUNMING = 'kunming',
  HARBIN = 'harbin',

  // UAE Cities (10+ cities - all 7 Emirates + major cities)
  DUBAI = 'dubai',
  ABU_DHABI = 'abu dhabi',
  SHARJAH = 'sharjah',
  AJMAN = 'ajman',
  RAS_AL_KHAIMAH = 'ras al khaimah',
  FUJAIRAH = 'fujairah',
  UMM_AL_QUWAIN = 'umm al quwain',
  AL_AIN = 'al ain',
  KHOR_FAKKAN = 'khor fakkan',
  DIBBA = 'dibba',
  MADINAT_ZAID = 'madinat zaid',
}

export enum Countries {
  LIBYA = 'libya',
  TURKEY = 'turkey',
  CHINA = 'china',
  UAE = 'uae',
}

// Mapping of countries to their supported cities
export const COUNTRY_CITIES: Record<Countries, Cities[]> = {
  [Countries.LIBYA]: [
    Cities.BENGHAZI,
    Cities.TRIPOLI,
    Cities.MUSRATA,
    Cities.ALBAYDA,
    Cities.ZAWIYA,
    Cities.GHARYAN,
    Cities.TOBRUK,
    Cities.AJDABIYA,
    Cities.ZLITEN,
    Cities.DERNA,
    Cities.SIRTE,
    Cities.SABHA,
    Cities.KHOMS,
    Cities.BANI_WALID,
    Cities.SABRATHA,
    Cities.ZUWARA,
    Cities.KUFFRA,
    Cities.AL_MARJ,
    Cities.TARHUNA,
    Cities.UBARI,
    Cities.GADAMES,
    Cities.GHAT,
    Cities.NALUT,
    Cities.JALU,
    Cities.BREGA,
    Cities.MISRATA,
    Cities.AL_KHUMS,
    Cities.DARNAH,
    Cities.YAFRAN,
    Cities.SHAHAT,
    Cities.BAYDA,
    Cities.MARSA_BREGA,
  ],
  [Countries.TURKEY]: [
    Cities.ISTANBUL,
    Cities.ANKARA,
    Cities.IZMIR,
    Cities.BURSA,
    Cities.ANTALYA,
    Cities.ADANA,
    Cities.KONYA,
    Cities.GAZIANTEP,
    Cities.MERSIN,
    Cities.KAYSERI,
    Cities.ESKISEHIR,
    Cities.DIYARBAKIR,
    Cities.SAMSUN,
    Cities.DENIZLI,
    Cities.MALATYA,
    Cities.TRABZON,
    Cities.ERZURUM,
  ],
  [Countries.UAE]: [
    Cities.DUBAI,
    Cities.ABU_DHABI,
    Cities.SHARJAH,
    Cities.AJMAN,
    Cities.RAS_AL_KHAIMAH,
    Cities.FUJAIRAH,
    Cities.UMM_AL_QUWAIN,
    Cities.AL_AIN,
    Cities.KHOR_FAKKAN,
    Cities.DIBBA,
    Cities.MADINAT_ZAID,
  ],
  [Countries.CHINA]: [
    Cities.HONGKONG,
    Cities.BEIJING,
    Cities.SHANGHAI,
    Cities.GUANGZHOU,
    Cities.SHENZHEN,
    Cities.CHENGDU,
    Cities.WUHAN,
    Cities.XI_AN,
    Cities.NANJING,
    Cities.HANGZHOU,
    Cities.TIANJIN,
    Cities.QINGDAO,
    Cities.DALIAN,
    Cities.SUZHOU,
    Cities.CHONGQING,
    Cities.KUNMING,
    Cities.HARBIN,
  ],
};

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
