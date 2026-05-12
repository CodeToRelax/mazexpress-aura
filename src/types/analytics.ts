// Period types for analytics filters
export type AnalyticsPeriod = 'week' | 'month' | 'year';
export type DeliveredPeriod = 'today' | 'week' | 'month' | 'year';

// Status breakdown for shipments
export interface ShipmentStatusBreakdown {
  pending: number;
  'in transit': number;
  delivered: number;
  'received at warehouse': number;
  'shipped to destination': number;
  'ready for pick up': number;
}

// Chart data point for shipments
export interface ShipmentChartDataPoint {
  date: string;
  shipments: number;
  kg?: number;
  cbm?: number;
}

// Air Shipments Analytics
export interface AirShipmentsAnalytics {
  totalShipments: number;
  totalKG: number;
  /** Active pipeline (excludes delivered) — new field. */
  totalShipmentsExcludingDelivered?: number;
  /** Active pipeline KG (excludes delivered) — new field. */
  totalKGExcludingDelivered?: number;
  statusBreakdown: ShipmentStatusBreakdown;
  /** Per-status weight in kg. When present, UI shows kg instead of counts. */
  kgBreakdown?: ShipmentStatusBreakdown;
  chartData: ShipmentChartDataPoint[];
}

// Sea Shipments Analytics
export interface SeaShipmentsAnalytics {
  totalShipments: number;
  totalCBM: number;
  statusBreakdown: ShipmentStatusBreakdown;
  cbmBreakdown: ShipmentStatusBreakdown;
  chartData: ShipmentChartDataPoint[];
}

// Customer Growth Analytics
export interface CustomerGrowthDataPoint {
  date: string;
  newCustomers: number;
  totalCustomers: number;
}

export interface CustomerGrowthAnalytics {
  totalCustomers: number;
  newCustomers: number;
  growthPercentage: number;
  chartData: CustomerGrowthDataPoint[];
}

// Wallet Balance Summary

export type WalletDonutSegmentKey = 'positive' | 'negative' | 'zero';

export interface WalletBalanceDonutSegment {
  key: WalletDonutSegmentKey;
  walletCount: number;
  percentOfWallets: number;
  sumBalance: number;
  distribution?: unknown;
}

export interface WalletBalanceDonut {
  segments: WalletBalanceDonutSegment[];
}

export interface WalletBalanceSummary {
  totalWallets: number;
  positiveBalanceCount: number;
  negativeBalanceCount: number;
  zeroBalanceCount: number;
  totalPositiveBalance: number;
  totalNegativeBalance: number;
  netBalance: number;
  /** New: pre-computed donut segments. Prefer this when present. */
  balanceDonut?: WalletBalanceDonut;
}

// Invoice Summary
export interface InvoiceSummary {
  totalInvoices: number;
  totalDueAmount: number;
  paidInvoices: number;
  unpaidInvoices: number;
  overdueInvoices: number;
  currency: string;
}

// Shipments Comparison
export interface ShipmentsComparisonDataPoint {
  date: string;
  airShipments: number;
  seaShipments: number;
}

export interface ShipmentsComparison {
  period: AnalyticsPeriod;
  chartData: ShipmentsComparisonDataPoint[];
  totals: {
    air: number;
    sea: number;
  };
}

// Delivered Packages Total
export interface DeliveredPackagesTotal {
  period: DeliveredPeriod;
  totalDelivered: number;
  previousPeriodDelivered: number;
  changePercentage: number;
}

// API Response wrappers
export interface AnalyticsApiResponse<T> {
  success: boolean;
  data: T;
}
