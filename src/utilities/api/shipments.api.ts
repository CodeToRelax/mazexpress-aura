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
        // Normalize shipping method to lowercase for consistent API matching
        if (key === 'method' || key === 'shippingMethod') {
          queryParams.append(backendKey, String(value).toLowerCase());
        } else {
          queryParams.append(backendKey, String(value));
        }
      }
    });

    const response = await this.request<ShipmentsListResponse>(
      `/api/shipments?${queryParams.toString()}`
    );

    // If the primary search returned 0 results and the value looks like a
    // shipping number (e.g. "TRI-I928", "TRI-01K2"), retry against the
    // dedicated single-field filters: isn, then csn, then esn. The backend
    // validates each format strictly and 422s on mismatches, so each retry is
    // wrapped in try/catch so we don't break the page on failed retries.
    const searchVal = (filters as any).search;
    let finalResponse = response;
    if (
      typeof searchVal === 'string' &&
      searchVal.trim() &&
      (response.data?.shipments?.length ?? 0) === 0
    ) {
      const trimmed = searchVal.trim();
      const looksLikePrefixCode = /^[A-Z]+-[A-Z0-9]+$/i.test(trimmed);
      const looksLikeNumeric = /^\d{6,}$/.test(trimmed);

      const buildParams = (fieldKey: string, value: string) => {
        const p = new URLSearchParams();
        Object.entries(filters).forEach(([key, v]) => {
          if (
            key !== 'search' &&
            v !== undefined &&
            v !== null &&
            v !== ''
          ) {
            const backendKey = paramMapping[key] || key;
            if (key === 'method' || key === 'shippingMethod') {
              p.append(backendKey, String(v).toLowerCase());
            } else {
              p.append(backendKey, String(v));
            }
          }
        });
        p.append(fieldKey, value);
        return p;
      };

      // Field candidates by shape: prefix-codes are usually CSN/ISN, pure
      // numeric strings are usually ESN.
      const candidates: string[] = [];
      if (looksLikePrefixCode) candidates.push('csn', 'isn');
      if (looksLikeNumeric) candidates.push('esn');

      for (const field of candidates) {
        try {
          const retryResponse = await this.request<ShipmentsListResponse>(
            `/api/shipments?${buildParams(field, trimmed).toString()}`
          );
          if ((retryResponse.data?.shipments?.length ?? 0) > 0) {
            finalResponse = retryResponse;
            break;
          }
        } catch (err) {
          // Swallow validation errors (e.g. 422 from strict isn/esn format
          // checks) and continue to next candidate.
          if (import.meta.env.DEV) {
            // eslint-disable-next-line no-console
            console.debug(`[shipments] retry ${field}=${trimmed} failed:`, err);
          }
        }
      }
    }

    // Normalize pagination shape: backend sends { page, pages, total }
    // but the frontend expects { currentPage, totalPages, totalDocs, ... }.
    const rawPagination: any = finalResponse.data?.pagination ?? {};
    const limit = Number(rawPagination.limit ?? filters.limit ?? 10);
    const currentPage = Number(
      rawPagination.currentPage ?? rawPagination.page ?? filters.page ?? 1
    );
    const totalDocs = Number(
      rawPagination.totalDocs ?? rawPagination.total ?? 0
    );
    const totalPages = Number(
      rawPagination.totalPages ??
        rawPagination.pages ??
        (limit > 0 ? Math.ceil(totalDocs / limit) : 1)
    );
    const normalizedPagination = {
      currentPage,
      totalPages: Math.max(totalPages, 1),
      totalDocs,
      limit,
      hasNextPage:
        rawPagination.hasNextPage ?? currentPage < Math.max(totalPages, 1),
      hasPrevPage: rawPagination.hasPrevPage ?? currentPage > 1,
      nextPage:
        rawPagination.nextPage ??
        (currentPage < Math.max(totalPages, 1) ? currentPage + 1 : null),
      prevPage:
        rawPagination.prevPage ?? (currentPage > 1 ? currentPage - 1 : null),
    };

    // Normalize shipment data
    return {
      ...finalResponse,
      data: {
        ...finalResponse.data,
        shipments: normalizeShipments(finalResponse.data.shipments),
        pagination: normalizedPagination,
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
