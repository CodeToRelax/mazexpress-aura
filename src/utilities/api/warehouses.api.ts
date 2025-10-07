/**
 * Warehouse API Layer
 * Handles all warehouse-related API calls
 */

import { getFirebaseAuth } from '@/utilities/firebase/firebase';
import type {
  Warehouse,
  WarehouseFilters,
  WarehouseApiResponse,
  WarehousesApiResponse,
  CreateWarehouseRequest,
  UpdateWarehouseRequest,
  ToggleWarehouseStatusRequest,
} from '@/types/warehouse';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

/**
 * Get authentication token from Firebase
 */
async function getAuthToken(): Promise<string> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }
  return await user.getIdToken();
}

/**
 * Build query string from filters
 */
function buildQueryString(filters: WarehouseFilters): string {
  const params = new URLSearchParams();
  
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.status) params.append('status', filters.status);
  if (filters.city) params.append('city', filters.city);
  if (filters.country) params.append('country', filters.country);
  if (filters.search) params.append('search', filters.search);
  
  return params.toString();
}

/**
 * Get all warehouses with pagination and filters
 */
export async function getWarehouses(
  filters: WarehouseFilters = {}
): Promise<WarehousesApiResponse> {
  try {
    const token = await getAuthToken();
    const queryString = buildQueryString(filters);
    const url = `${API_BASE_URL}/api/warehouses${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to fetch warehouses');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching warehouses:', error);
    throw error;
  }
}

/**
 * Get a single warehouse by ID
 */
export async function getWarehouseById(id: string): Promise<WarehouseApiResponse> {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/api/warehouses/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to fetch warehouse');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching warehouse:', error);
    throw error;
  }
}

/**
 * Create a new warehouse
 */
export async function createWarehouse(
  data: CreateWarehouseRequest
): Promise<WarehouseApiResponse> {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/api/warehouses`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to create warehouse');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating warehouse:', error);
    throw error;
  }
}

/**
 * Update a warehouse by ID
 */
export async function updateWarehouse(
  id: string,
  data: UpdateWarehouseRequest
): Promise<WarehouseApiResponse> {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/api/warehouses/${id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to update warehouse');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating warehouse:', error);
    throw error;
  }
}

/**
 * Toggle warehouse status (open/closed)
 */
export async function toggleWarehouseStatus(
  id: string,
  data: ToggleWarehouseStatusRequest
): Promise<WarehouseApiResponse> {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/api/warehouses/${id}/toggle-status`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to toggle warehouse status');
    }

    return await response.json();
  } catch (error) {
    console.error('Error toggling warehouse status:', error);
    throw error;
  }
}

/**
 * Delete a warehouse by ID
 */
export async function deleteWarehouse(id: string): Promise<{ success: boolean; message: string }> {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/api/warehouses/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to delete warehouse');
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting warehouse:', error);
    throw error;
  }
}
