import { getFirebaseAuth } from '@/utilities/firebase/firebase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

interface CountryShippingConfig {
  seaShippingRate: number;
  airShippingRate: number;
  seaShippingFactor: number;
  airShippingFactor: number;
}

interface TiersConfig {
  A: number;
  B: number;
  C: number;
  D: number;
  E: number;
}

interface DomesticCitiesResponse {
  domestic: Record<string, TiersConfig>;
  cities: string[];
}

interface CityConfigResponse {
  city: string;
  A: number;
  B: number;
  C: number;
  D: number;
  E: number;
}

interface SystemConfig {
  _id: string;
  lydExchangeRate: number;
  domestic: Record<string, TiersConfig>;
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

// Domestic Cities API Functions

export async function getDomesticCities(): Promise<DomesticCitiesResponse> {
  const token = await getAuthToken();
  
  if (!token) {
    throw new Error('Authentication required');
  }
  
  const response = await fetch(`${API_BASE_URL}/api/config/domestic`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch domestic cities configuration');
  }
  
  const result = await response.json();
  return result.data;
}

export async function getDomesticCityConfig(city: string): Promise<CityConfigResponse> {
  const token = await getAuthToken();
  
  if (!token) {
    throw new Error('Authentication required');
  }
  
  const response = await fetch(`${API_BASE_URL}/api/config/domestic/${encodeURIComponent(city)}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`City "${city}" not found`);
    }
    throw new Error(`Failed to fetch configuration for ${city}`);
  }
  
  const result = await response.json();
  return result.data;
}

export async function addDomesticCity(
  city: string,
  tiers: TiersConfig
): Promise<CityConfigResponse> {
  const token = await getAuthToken();
  
  if (!token) {
    throw new Error('Authentication required');
  }
  
  const response = await fetch(`${API_BASE_URL}/api/config/domestic/${encodeURIComponent(city)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(tiers),
  });
  
  if (!response.ok) {
    const error = await response.json();
    if (response.status === 409) {
      throw new Error(`City "${city}" already exists`);
    }
    throw new Error(error.error?.message || 'Failed to add city');
  }
  
  const result = await response.json();
  return result.data;
}

export async function updateDomesticCity(
  city: string,
  tiers: Partial<TiersConfig>
): Promise<CityConfigResponse> {
  const token = await getAuthToken();
  
  if (!token) {
    throw new Error('Authentication required');
  }
  
  const response = await fetch(`${API_BASE_URL}/api/config/domestic/${encodeURIComponent(city)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(tiers),
  });
  
  if (!response.ok) {
    const error = await response.json();
    if (response.status === 404) {
      throw new Error(`City "${city}" not found`);
    }
    throw new Error(error.error?.message || 'Failed to update city configuration');
  }
  
  const result = await response.json();
  return result.data;
}

export async function deleteDomesticCity(city: string): Promise<void> {
  const token = await getAuthToken();
  
  if (!token) {
    throw new Error('Authentication required');
  }
  
  const response = await fetch(`${API_BASE_URL}/api/config/domestic/${encodeURIComponent(city)}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    const error = await response.json();
    if (response.status === 400) {
      throw new Error('Cannot delete the last city');
    }
    if (response.status === 404) {
      throw new Error(`City "${city}" not found`);
    }
    throw new Error(error.error?.message || 'Failed to delete city');
  }
}

export type { TiersConfig, DomesticCitiesResponse, CityConfigResponse, CountryShippingConfig, SystemConfig };
