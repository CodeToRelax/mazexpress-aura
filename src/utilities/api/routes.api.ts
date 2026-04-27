import { getFirebaseAuth } from '@/utilities/firebase/firebase';
import {
  Route,
  RouteCreateBody,
  RouteUpdateBody,
  RouteListFilters,
  PaginatedDocs,
  RouteDuplicateError,
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
    if (response.status === 409 && body?.errorCode === 'ROUTE_DUPLICATE') {
      throw new RouteDuplicateError(body?.message);
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

export async function listRoutes(filters: RouteListFilters = {}): Promise<PaginatedDocs<Route>> {
  const headers = await authHeaders();
  const response = await fetch(`${API_BASE_URL}/api/routes${qs(filters as Record<string, unknown>)}`, { headers });
  return unwrap<PaginatedDocs<Route>>(response);
}

export async function getRoute(id: string): Promise<Route> {
  const headers = await authHeaders();
  const response = await fetch(`${API_BASE_URL}/api/routes/${id}`, { headers });
  return unwrap<Route>(response);
}

export async function createRoute(body: RouteCreateBody): Promise<Route> {
  const headers = await authHeaders();
  const response = await fetch(`${API_BASE_URL}/api/routes`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  return unwrap<Route>(response);
}

export async function updateRoute(id: string, body: RouteUpdateBody): Promise<Route> {
  const headers = await authHeaders();
  const response = await fetch(`${API_BASE_URL}/api/routes/${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body),
  });
  return unwrap<Route>(response);
}

export async function deleteRoute(id: string): Promise<void> {
  const headers = await authHeaders();
  const response = await fetch(`${API_BASE_URL}/api/routes/${id}`, {
    method: 'DELETE',
    headers,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body?.message || `Failed to delete route`);
  }
}

/** Returns the route or null on 404 (used for live tier-price lookup). */
export async function lookupRoute(
  origin: string,
  destination: string
): Promise<Route | null> {
  const headers = await authHeaders();
  const response = await fetch(
    `${API_BASE_URL}/api/routes/lookup?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`,
    { headers }
  );
  if (response.status === 404) return null;
  return unwrap<Route>(response);
}

/** Resolve the LYD price for a given route + tier. */
export function priceForTier(route: Route, tier: 'A' | 'B' | 'C' | 'D'): number {
  switch (tier) {
    case 'A':
      return route.priceTierA;
    case 'B':
      return route.priceTierB;
    case 'C':
      return route.priceTierC;
    case 'D':
      return route.priceTierD;
  }
}