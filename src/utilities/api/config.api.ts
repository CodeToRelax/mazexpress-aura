import { getFirebaseAuth } from '@/utilities/firebase/firebase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

interface CountryShippingConfig {
  seaShippingRate: number;
  airShippingRate: number;
  seaShippingFactor: number;
  airShippingFactor: number;
}

interface SystemConfig {
  _id: string;
  lydExchangeRate: number;
  countries: Record<string, CountryShippingConfig>;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

async function getAuthToken(): Promise<string | null> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!user) return null;
  return await user.getIdToken();
}

export async function getSystemConfig(): Promise<SystemConfig> {
  const token = await getAuthToken();
  
  if (!token) {
    throw new Error('Authentication required');
  }
  
  const response = await fetch(`${API_BASE_URL}/api/config`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch system configuration');
  }
  
  const result = await response.json();
  return result.data;
}

export async function getCountryConfig(country: string): Promise<CountryShippingConfig & { country: string }> {
  const token = await getAuthToken();
  
  if (!token) {
    throw new Error('Authentication required');
  }
  
  const response = await fetch(`${API_BASE_URL}/api/config/countries/${country}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch configuration for ${country}`);
  }
  
  const result = await response.json();
  return result.data;
}

export async function updateCountryConfig(
  country: string,
  config: Partial<CountryShippingConfig>
): Promise<CountryShippingConfig & { country: string }> {
  const token = await getAuthToken();
  
  if (!token) {
    throw new Error('Authentication required');
  }
  
  const response = await fetch(`${API_BASE_URL}/api/config/countries/${country}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(config),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to update country configuration');
  }
  
  const result = await response.json();
  return result.data;
}

export async function updateSystemConfig(
  lydExchangeRate: number,
  countries: Record<string, CountryShippingConfig>
): Promise<SystemConfig> {
  const token = await getAuthToken();
  
  if (!token) {
    throw new Error('Authentication required');
  }
  
  const response = await fetch(`${API_BASE_URL}/api/config`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ lydExchangeRate, countries }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to update system configuration');
  }
  
  const result = await response.json();
  return result.data;
}

export async function updateExchangeRate(
  lydExchangeRate: number
): Promise<SystemConfig> {
  const token = await getAuthToken();
  
  if (!token) {
    throw new Error('Authentication required');
  }
  
  const response = await fetch(`${API_BASE_URL}/api/config`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ lydExchangeRate }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to update exchange rate');
  }
  
  const result = await response.json();
  return result.data;
}

// Air International Pricing Tiers (admin)

export type AirInternationalCountryKey = 'turkey' | 'china' | 'uae';

export interface AirInternationalRateBracket {
  minKg: number;
  maxKg?: number;
  ratePerKgUsd: number;
}

export type AirInternationalRates = Partial<
  Record<AirInternationalCountryKey, AirInternationalRateBracket[]>
>;

export async function getAirInternationalRates(): Promise<AirInternationalRates> {
  const token = await getAuthToken();
  if (!token) throw new Error('Authentication required');

  const response = await fetch(`${API_BASE_URL}/api/config/air-international`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch air international rates');
  }

  const result = await response.json();
  return result.data ?? result;
}

export async function updateAirInternationalRates(
  body: AirInternationalRates
): Promise<AirInternationalRates> {
  const token = await getAuthToken();
  if (!token) throw new Error('Authentication required');

  const response = await fetch(`${API_BASE_URL}/api/config/air-international`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || 'Failed to update air international rates');
  }

  const result = await response.json();
  return result.data ?? result;
}

// Item Cost Calculator (FX → LYD)

export type ItemCalculatorRates = Record<string, number>;

export async function getItemCalculatorRates(): Promise<ItemCalculatorRates> {
  const token = await getAuthToken();
  if (!token) throw new Error('Authentication required');

  const response = await fetch(`${API_BASE_URL}/api/config/item-calculator`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to fetch FX rates');
  const result = await response.json();
  const data = result.data ?? result;
  // Backend returns { ratesToLyd: {...} }; tolerate { rates: {...} } or the map directly.
  return (data?.ratesToLyd ?? data?.rates ?? data) as ItemCalculatorRates;
}

export async function updateItemCalculatorRates(
  rates: ItemCalculatorRates
): Promise<ItemCalculatorRates> {
  const token = await getAuthToken();
  if (!token) throw new Error('Authentication required');

  const response = await fetch(`${API_BASE_URL}/api/config/item-calculator`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    // Backend expects { ratesToLyd: {...} }.
    body: JSON.stringify({ ratesToLyd: rates }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || err.message || 'Failed to update FX rates');
  }
  const result = await response.json();
  const data = result.data ?? result;
  return (data?.ratesToLyd ?? data?.rates ?? data) as ItemCalculatorRates;
}

export async function convertItemAmount(body: {
  amount: number;
  currency: string;
}): Promise<number> {
  const token = await getAuthToken();
  if (!token) throw new Error('Authentication required');

  const response = await fetch(`${API_BASE_URL}/api/config/item-calculator/convert`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      amount: body.amount,
      currency: body.currency.toUpperCase(),
    }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || err.message || 'Conversion failed');
  }
  const result = await response.json();
  const data = result.data ?? result;
  // Backend may return { converted, amount, ...} or just a number.
  if (typeof data === 'number') return data;
  return Number(data?.converted ?? data?.amount ?? data?.value ?? 0);
}

export type {
  CountryShippingConfig,
  SystemConfig,
};
