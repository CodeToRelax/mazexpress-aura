import { getFirebaseAuth } from '@/utilities/firebase/firebase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export interface CompanyInfo {
  services: string;
  about: string;
  contact: string;
}

export type CompanyInfoPatch = Partial<CompanyInfo>;

async function getAuthToken(): Promise<string> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!user) throw new Error('Authentication required');
  return user.getIdToken();
}

export async function getCompanyInfo(): Promise<CompanyInfo> {
  const token = await getAuthToken();
  const response = await fetch(`${API_BASE_URL}/api/config/company-info`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to fetch company info');
  const result = await response.json();
  const data = result.data ?? result;
  return {
    services: data.services ?? '',
    about: data.about ?? '',
    contact: data.contact ?? '',
  };
}

/**
 * PATCH /api/config/company-info
 * Backend rejects unknown keys (422). Only send services/about/contact,
 * and only those that have actually changed.
 */
export async function updateCompanyInfo(patch: CompanyInfoPatch): Promise<CompanyInfo> {
  const token = await getAuthToken();

  const allowed: CompanyInfoPatch = {};
  if (typeof patch.services === 'string') allowed.services = patch.services;
  if (typeof patch.about === 'string') allowed.about = patch.about;
  if (typeof patch.contact === 'string') allowed.contact = patch.contact;

  const response = await fetch(`${API_BASE_URL}/api/config/company-info`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(allowed),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || err.error?.message || 'Failed to update company info');
  }
  const result = await response.json();
  const data = result.data ?? result;
  return {
    services: data.services ?? '',
    about: data.about ?? '',
    contact: data.contact ?? '',
  };
}