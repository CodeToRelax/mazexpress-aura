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
  
  console.log('[ACL API] Getting auth token...', {
    hasUser: !!user,
    userEmail: user?.email,
  });
  
  if (!user) {
    console.error('[ACL API] No authenticated user found');
    throw new Error('User not authenticated');
  }
  
  const token = await user.getIdToken();
  console.log('[ACL API] Auth token obtained:', token.substring(0, 20) + '...');
  
  return token;
}

/**
 * Handle API response errors
 */
async function handleResponse<T>(response: Response): Promise<T> {
  console.log('[ACL API] Response status:', response.status, response.statusText);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: 'An error occurred',
    }));
    console.error('[ACL API] Error response:', error);
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  
  const data = await response.json();
  console.log('[ACL API] Response data:', data);
  return data;
}

/**
 * ACL API methods
 */
export const aclApi = {
  /**
   * Get complete ACL information for current user
   */
  async getUserACL(): Promise<UserACLData> {
    console.log('[ACL API] Fetching user ACL...');
    console.log('[ACL API] API Base URL:', API_BASE_URL);
    console.log('[ACL API] Full endpoint:', `${API_BASE_URL}/api/acl/user`);
    
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/api/acl/user`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    const result = await handleResponse<ACLApiResponse>(response);
    console.log('[ACL API] User ACL data received:', {
      userId: result.data.userId,
      userType: result.data.userType,
      permissionsCount: result.data.permissions.length,
      flags: result.data.frontendFlags,
    });
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
