import { getFirebaseAuth } from '@/utilities/firebase/firebase';
import {
  AdminCreateBody,
  AdminEditBody,
  BulkStatusResponse,
  ChangeStatusBody,
  DomesticLabelData,
  DomesticStatus,
  DomesticShipment,
  InvalidTransitionError,
  PaginatedDocs,
  ShipmentDetailResponse,
  ShipmentListFilters,
  WalletTransaction,
} from '@/types/domestic';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

async function authHeaders(): Promise<HeadersInit> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!user) throw new Error('Authentication required');
  const token = await user.getIdToken();
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

async function unwrap<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 409 && body?.errorCode === 'DOMESTIC_SHIPMENT_INVALID_TRANSITION') {
      throw new InvalidTransitionError(body?.message || 'Invalid transition', body?.details);
    }
    throw new Error(body?.message || `Request failed with status ${response.status}`);
  }
  return (body?.data ?? body) as T;
}

function qs(filters: Record<string, unknown>): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') params.append(k, String(v));
  });
  const s = params.toString();
  return s ? `?${s}` : '';
}

export async function listAdminShipments(
  filters: ShipmentListFilters = {}
): Promise<PaginatedDocs<DomesticShipment>> {
  const headers = await authHeaders();
  const response = await fetch(
    `${API_BASE_URL}/api/domestic-shipments/admin/all${qs(filters as Record<string, unknown>)}`,
    { headers }
  );
  return unwrap<PaginatedDocs<DomesticShipment>>(response);
}

export async function getAdminShipment(id: string): Promise<ShipmentDetailResponse> {
  const headers = await authHeaders();
  const response = await fetch(`${API_BASE_URL}/api/domestic-shipments/admin/${id}`, { headers });
  return unwrap<ShipmentDetailResponse>(response);
}

export async function createWalkIn(body: AdminCreateBody): Promise<DomesticShipment> {
  const headers = await authHeaders();
  const response = await fetch(`${API_BASE_URL}/api/domestic-shipments/admin`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  return unwrap<DomesticShipment>(response);
}

export async function updateAdminShipment(id: string, body: AdminEditBody): Promise<DomesticShipment> {
  const headers = await authHeaders();
  const response = await fetch(`${API_BASE_URL}/api/domestic-shipments/admin/${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body),
  });
  return unwrap<DomesticShipment>(response);
}

export async function changeStatus(id: string, body: ChangeStatusBody): Promise<DomesticShipment> {
  const headers = await authHeaders();
  const response = await fetch(`${API_BASE_URL}/api/domestic-shipments/admin/${id}/status`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body),
  });
  return unwrap<DomesticShipment>(response);
}

export async function softDeleteShipment(id: string): Promise<void> {
  const headers = await authHeaders();
  const response = await fetch(`${API_BASE_URL}/api/domestic-shipments/admin/${id}`, {
    method: 'DELETE',
    headers,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body?.message || 'Failed to delete shipment');
  }
}

export async function bulkUpdateStatus(
  ids: string[],
  toStatus: DomesticStatus,
  note?: string
): Promise<BulkStatusResponse> {
  const headers = await authHeaders();
  const response = await fetch(`${API_BASE_URL}/api/domestic-shipments/admin/bulk-status`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ ids, toStatus, ...(note ? { note } : {}) }),
  });
  return unwrap<BulkStatusResponse>(response);
}

export async function getShipmentLabel(id: string): Promise<DomesticLabelData> {
  const headers = await authHeaders();
  const response = await fetch(`${API_BASE_URL}/api/domestic-shipments/admin/${id}/label`, {
    headers,
  });
  return unwrap<DomesticLabelData>(response);
}

/** Wallet transactions tied to a single shipment (server-side filter). */
export async function getShipmentTransactions(
  senderUserId: string,
  shipmentId: string,
  limit = 10
): Promise<PaginatedDocs<WalletTransaction>> {
  const headers = await authHeaders();
  const response = await fetch(
    `${API_BASE_URL}/api/wallet/admin/user/${senderUserId}/transactions?domesticShipmentId=${encodeURIComponent(
      shipmentId
    )}&limit=${limit}`,
    { headers }
  );
  return unwrap<PaginatedDocs<WalletTransaction>>(response);
}