import { getFirebaseAuth } from '@/utilities/firebase/firebase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

interface CountryShippingConfig {
  seaShippingRate: number;
  airShippingRate: number;
  seaShippingFactor: number;
  airShippingFactor: number;
}

// New city-to-city routing types
interface DomesticRoutesResponse {
  domestic: Record<string, Record<string, number>>; // { originCity: { destCity: price } }
  originCities: string[];
}

interface OriginCityRoutesResponse {
  originCity: string;
  routes: Record<string, number>;
  destinationCities: string[];
}

interface RoutePrice {
  originCity: string;
  destinationCity: string;
  price: number;
  currency: string;
}

interface SystemConfig {
  _id: string;
  lydExchangeRate: number;
  domestic: Record<string, Record<string, number>>;
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

// Domestic Routes API Functions (City-to-City Pricing)

export async function getDomesticRoutes(): Promise<DomesticRoutesResponse> {
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
    throw new Error('Failed to fetch domestic routes');
  }
  
  const result = await response.json();
  return result.data;
}

export async function getOriginCityRoutes(originCity: string): Promise<OriginCityRoutesResponse> {
  const token = await getAuthToken();
  
  if (!token) {
    throw new Error('Authentication required');
  }
  
  const response = await fetch(`${API_BASE_URL}/api/config/domestic/${encodeURIComponent(originCity)}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Origin city "${originCity}" not found`);
    }
    throw new Error(`Failed to fetch routes for ${originCity}`);
  }
  
  const result = await response.json();
  return result.data;
}

export async function getRoutePrice(originCity: string, destinationCity: string): Promise<RoutePrice> {
  const token = await getAuthToken();
  
  if (!token) {
    throw new Error('Authentication required');
  }
  
  const response = await fetch(
    `${API_BASE_URL}/api/config/domestic/${encodeURIComponent(originCity)}/${encodeURIComponent(destinationCity)}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Route from "${originCity}" to "${destinationCity}" not found`);
    }
    throw new Error('Failed to fetch route price');
  }
  
  const result = await response.json();
  return result.data;
}

export async function addOriginCity(
  originCity: string,
  routes: Record<string, number>
): Promise<OriginCityRoutesResponse> {
  const token = await getAuthToken();
  
  if (!token) {
    throw new Error('Authentication required');
  }
  
  const response = await fetch(`${API_BASE_URL}/api/config/domestic/${encodeURIComponent(originCity)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(routes),
  });
  
  if (!response.ok) {
    const error = await response.json();
    if (response.status === 409) {
      throw new Error(`Origin city "${originCity}" already exists`);
    }
    throw new Error(error.error?.message || 'Failed to add origin city');
  }
  
  const result = await response.json();
  return result.data;
}

export async function updateOriginCityRoutes(
  originCity: string,
  routes: Record<string, number>
): Promise<OriginCityRoutesResponse> {
  const token = await getAuthToken();
  
  if (!token) {
    throw new Error('Authentication required');
  }
  
  const response = await fetch(`${API_BASE_URL}/api/config/domestic/${encodeURIComponent(originCity)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(routes),
  });
  
  if (!response.ok) {
    const error = await response.json();
    if (response.status === 404) {
      throw new Error(`Origin city "${originCity}" not found`);
    }
    throw new Error(error.error?.message || 'Failed to update routes');
  }
  
  const result = await response.json();
  return result.data;
}

export async function setRoutePrice(
  originCity: string,
  destinationCity: string,
  price: number
): Promise<RoutePrice> {
  const token = await getAuthToken();
  
  if (!token) {
    throw new Error('Authentication required');
  }
  
  const response = await fetch(
    `${API_BASE_URL}/api/config/domestic/${encodeURIComponent(originCity)}/${encodeURIComponent(destinationCity)}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ price }),
    }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to set route price');
  }
  
  const result = await response.json();
  return result.data;
}

export async function deleteRoute(originCity: string, destinationCity: string): Promise<void> {
  const token = await getAuthToken();
  
  if (!token) {
    throw new Error('Authentication required');
  }
  
  const response = await fetch(
    `${API_BASE_URL}/api/config/domestic/${encodeURIComponent(originCity)}/${encodeURIComponent(destinationCity)}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );
  
  if (!response.ok) {
    const error = await response.json();
    if (response.status === 404) {
      throw new Error(`Route not found`);
    }
    throw new Error(error.error?.message || 'Failed to delete route');
  }
}

export async function deleteOriginCity(originCity: string): Promise<void> {
  const token = await getAuthToken();
  
  if (!token) {
    throw new Error('Authentication required');
  }
  
  const response = await fetch(`${API_BASE_URL}/api/config/domestic/${encodeURIComponent(originCity)}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    const error = await response.json();
    if (response.status === 400) {
      throw new Error('Cannot delete the last origin city');
    }
    if (response.status === 404) {
      throw new Error(`Origin city "${originCity}" not found`);
    }
    throw new Error(error.error?.message || 'Failed to delete origin city');
  }
}

export type { 
  DomesticRoutesResponse, 
  OriginCityRoutesResponse, 
  RoutePrice, 
  CountryShippingConfig, 
  SystemConfig 
};
