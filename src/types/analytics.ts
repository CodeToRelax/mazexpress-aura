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
  statusBreakdown: ShipmentStatusBreakdown;
  chartData: ShipmentChartDataPoint[];
}

// Sea Shipments Analytics
export interface SeaShipmentsAnalytics {
  totalShipments: number;
  totalCBM: number;
  statusBreakdown: ShipmentStatusBreakdown;
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
export interface WalletBalanceSummary {
  totalWallets: number;
  positiveBalanceCount: number;
  negativeBalanceCount: number;
  zeroBalanceCount: number;
  totalPositiveBalance: number;
  totalNegativeBalance: number;
  netBalance: number;
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
