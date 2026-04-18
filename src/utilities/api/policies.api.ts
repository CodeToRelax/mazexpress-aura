import { getFirebaseAuth } from '@/utilities/firebase/firebase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export interface Policies {
  policies: string;
  prohibitedItems: string;
  extra: string;
}

export type PoliciesPatch = Partial<Policies>;

async function getAuthToken(): Promise<string> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!user) throw new Error('Authentication required');
  return user.getIdToken();
}

export async function getPolicies(): Promise<Policies> {
  const token = await getAuthToken();
  const response = await fetch(`${API_BASE_URL}/api/config/policies`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to fetch policies');
  const result = await response.json();
  const data = result.data ?? result;
  // Ensure 3 canonical keys exist
  return {
    policies: data.policies ?? '',
    prohibitedItems: data.prohibitedItems ?? '',
    extra: data.extra ?? '',
  };
}

/**
 * PATCH /api/config/policies
 * Validation uses stripUnknown: false on the backend — only send the
 * three canonical keys (any subset). Extra keys → 422.
 */
export async function updatePolicies(patch: PoliciesPatch): Promise<Policies> {
  const token = await getAuthToken();

  // Whitelist: never send anything besides these three keys.
  const allowed: PoliciesPatch = {};
  if (typeof patch.policies === 'string') allowed.policies = patch.policies;
  if (typeof patch.prohibitedItems === 'string') allowed.prohibitedItems = patch.prohibitedItems;
  if (typeof patch.extra === 'string') allowed.extra = patch.extra;

  const response = await fetch(`${API_BASE_URL}/api/config/policies`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(allowed),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || err.error?.message || 'Failed to update policies');
  }
  const result = await response.json();
  const data = result.data ?? result;
  return {
    policies: data.policies ?? '',
    prohibitedItems: data.prohibitedItems ?? '',
    extra: data.extra ?? '',
  };
}
