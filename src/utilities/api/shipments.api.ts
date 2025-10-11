import { getFirebaseAuth } from '../firebase/firebase';
import { normalizeShipment, normalizeShipments } from '../helpers/shipmentNormalizer';
import i18n from '../localization';
import type {
  IShipment,
  CreateShipmentPayload,
  UpdateShipmentPayload,
  BulkUpdatePayload,
  BulkUpdateEsnPayload,
  BulkDeletePayload,
  ShipmentFilters,
  ShipmentsListResponse,
  ShipmentResponse,
  ShipmentStatsResponse,
  ShipmentStats,
  PriceCalculationPayload,
  ShipmentStatus,
} from '@/types/shipment';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

class ShipmentsApi {
  private async getAuthToken(): Promise<string> {
    const auth = getFirebaseAuth();
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No authenticated user');
    }
    return user.getIdToken();
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getAuthToken();
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Accept-Language': i18n.language, // Add localization support
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Request failed with status ${response.status}`);
    }

    return response.json();
  }

  async getShipments(filters: ShipmentFilters): Promise<ShipmentsListResponse> {
    const queryParams = new URLSearchParams();
    
    // Map frontend filter names to backend parameter names
    const paramMapping: Record<string, string> = {
      search: 'searchParam',
      destination: 'shipmentDestination',
      method: 'shippingMethod',
      createdAfter: 'from',
      createdBefore: 'to',
    };
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        const backendKey = paramMapping[key] || key;
        queryParams.append(backendKey, String(value));
      }
    });

    const response = await this.request<ShipmentsListResponse>(
      `/api/shipments?${queryParams.toString()}`
    );
    
    // Normalize shipment data
    return {
      ...response,
      data: {
        ...response.data,
        shipments: normalizeShipments(response.data.shipments),
      },
    };
  }

  async getShipmentById(id: string): Promise<ShipmentResponse> {
    const response = await this.request<ShipmentResponse>(`/api/shipments/${id}`);
    return {
      ...response,
      data: normalizeShipment(response.data),
    };
  }

  async createShipment(payload: CreateShipmentPayload): Promise<ShipmentResponse> {
    const response = await this.request<ShipmentResponse>('/api/shipments', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return {
      ...response,
      data: normalizeShipment(response.data),
    };
  }

  async updateShipment(
    id: string,
    payload: UpdateShipmentPayload
  ): Promise<ShipmentResponse> {
    const response = await this.request<ShipmentResponse>(`/api/shipments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return {
      ...response,
      data: normalizeShipment(response.data),
    };
  }

  async updateShipmentStatus(
    id: string,
    status: ShipmentStatus
  ): Promise<ShipmentResponse> {
    const response = await this.request<ShipmentResponse>(`/api/shipments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return {
      ...response,
      data: normalizeShipment(response.data),
    };
  }

  async bulkUpdateShipments(payload: BulkUpdatePayload): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/api/shipments/bulk', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  async bulkUpdateShipmentsByEsn(payload: BulkUpdateEsnPayload): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/api/shipments/bulk/esn', {
      method: 'PATCH',
      body: JSON.stringify({
        esns: payload.shipmentsEsn, // Map to correct field name
        status: payload.shipmentStatus,
      }),
    });
  }

  async bulkDeleteShipments(payload: BulkDeletePayload): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/api/shipments/bulk', {
      method: 'DELETE',
      body: JSON.stringify(payload),
    });
  }

  async getStats(): Promise<ShipmentStats> {
    const response = await this.request<ShipmentStatsResponse>('/api/shipments/stats');
    return response.data;
  }

  // Public endpoints (no authentication required)
  async trackShipment(esn: string): Promise<ShipmentResponse> {
    const response = await fetch(`${API_BASE_URL}/api/shipments/track/${esn}`, {
      headers: {
        'Accept-Language': i18n.language,
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Request failed with status ${response.status}`);
    }

    const data = await response.json();
    return {
      ...data,
      data: normalizeShipment(data.data),
    };
  }

  async calculatePrice(payload: PriceCalculationPayload): Promise<{ success: boolean; data: any; message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/shipments/calculate-price`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': i18n.language,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Request failed with status ${response.status}`);
    }

    return response.json();
  }
}

export const shipmentsApi = new ShipmentsApi();
