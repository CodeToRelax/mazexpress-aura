import { getFirebaseAuth } from '@/utilities/firebase/firebase';
import { env } from '@/env';
import type {
  ACLApiResponse,
  ACLFlagsResponse,
  PermissionCheckResponse,
  UpdateACLRequest,
  UpdateACLResponse,
  UserACLData,
  ACLPermission,
} from '@/types/acl';

const API_BASE_URL = env.app.apiUrl;

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
 * Handle API response errors
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: 'An error occurred',
    }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  
  return response.json();
}

/**
 * ACL API methods
 */
export const aclApi = {
  /**
   * Get complete ACL information for current user
   */
  async getUserACL(): Promise<UserACLData> {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/api/acl/user`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    const result = await handleResponse<ACLApiResponse>(response);
    return result.data;
  },

  /**
   * Get lightweight frontend flags only
   */
  async getACLFlags(): Promise<ACLFlagsResponse['data']> {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/api/acl/flags`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    const result = await handleResponse<ACLFlagsResponse>(response);
    return result.data;
  },

  /**
   * Check specific permission
   */
  async checkPermission(resource: string, action: string): Promise<boolean> {
    const token = await getAuthToken();
    const response = await fetch(
      `${API_BASE_URL}/api/acl/check?resource=${encodeURIComponent(resource)}&action=${encodeURIComponent(action)}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    const result = await handleResponse<PermissionCheckResponse>(response);
    return result.data.allowed;
  },

  /**
   * Get ACL for a specific user (admin only)
   */
  async getUserACLById(userId: string): Promise<UserACLData> {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/api/acl/user/${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    const result = await handleResponse<ACLApiResponse>(response);
    return result.data;
  },

  /**
   * Update user ACL (admin only)
   */
  async updateUserACL(userId: string, permissions: ACLPermission[]): Promise<UserACLData> {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/api/acl/user/${userId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ permissions } satisfies UpdateACLRequest),
    });
    
    const result = await handleResponse<UpdateACLResponse>(response);
    return result.data;
  },
};
