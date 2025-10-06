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
  const response = await fetch(`${API_BASE_URL}/api/config`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch system configuration');
  }
  
  const result = await response.json();
  return result.data;
}

export async function getCountryConfig(country: string): Promise<CountryShippingConfig & { country: string }> {
  const response = await fetch(`${API_BASE_URL}/api/config/countries/${country}`);
  
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
