import { getFirebaseAuth } from '@/utilities/firebase/firebase';
import type {
  AirShipmentsAnalytics,
  SeaShipmentsAnalytics,
  CustomerGrowthAnalytics,
  WalletBalanceSummary,
  InvoiceSummary,
  ShipmentsComparison,
  DeliveredPackagesTotal,
  AnalyticsPeriod,
  DeliveredPeriod,
  AnalyticsApiResponse,
} from '@/types/analytics';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

async function getAuthToken(): Promise<string> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!user) throw new Error('No authenticated user');
  return await user.getIdToken();
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  return response.json();
}

export const analyticsApi = {
  async getAirShipments(startDate?: string, endDate?: string): Promise<AirShipmentsAnalytics> {
    const token = await getAuthToken();
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await fetch(`${API_BASE_URL}/api/analytics/shipments/air?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const result = await handleResponse<AnalyticsApiResponse<AirShipmentsAnalytics>>(response);
    return result.data;
  },

  async getSeaShipments(startDate?: string, endDate?: string): Promise<SeaShipmentsAnalytics> {
    const token = await getAuthToken();
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await fetch(`${API_BASE_URL}/api/analytics/shipments/sea?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const result = await handleResponse<AnalyticsApiResponse<SeaShipmentsAnalytics>>(response);
    return result.data;
  },

  async getCustomerGrowth(period: AnalyticsPeriod = 'month'): Promise<CustomerGrowthAnalytics> {
    const token = await getAuthToken();
    const params = new URLSearchParams();
    params.append('period', period);

    const response = await fetch(`${API_BASE_URL}/api/analytics/customers/growth?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const result = await handleResponse<AnalyticsApiResponse<CustomerGrowthAnalytics>>(response);
    return result.data;
  },

  async getWalletSummary(): Promise<WalletBalanceSummary> {
    const token = await getAuthToken();

    const response = await fetch(`${API_BASE_URL}/api/analytics/wallets/balance-summary`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const result = await handleResponse<AnalyticsApiResponse<WalletBalanceSummary>>(response);
    return result.data;
  },

  async getInvoiceSummary(startDate?: string, endDate?: string): Promise<InvoiceSummary> {
    const token = await getAuthToken();
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await fetch(`${API_BASE_URL}/api/analytics/invoices/summary?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const result = await handleResponse<AnalyticsApiResponse<InvoiceSummary>>(response);
    return result.data;
  },

  async getShipmentsComparison(period: AnalyticsPeriod = 'month'): Promise<ShipmentsComparison> {
    const token = await getAuthToken();
    const params = new URLSearchParams();
    params.append('period', period);

    const response = await fetch(`${API_BASE_URL}/api/analytics/shipments/comparison?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const result = await handleResponse<AnalyticsApiResponse<ShipmentsComparison>>(response);
    return result.data;
  },

  async getDeliveredTotal(period: DeliveredPeriod = 'month'): Promise<DeliveredPackagesTotal> {
    const token = await getAuthToken();
    const params = new URLSearchParams();
    params.append('period', period);

    const response = await fetch(`${API_BASE_URL}/api/analytics/shipments/delivered?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const result = await handleResponse<AnalyticsApiResponse<DeliveredPackagesTotal>>(response);
    return result.data;
  },
};
