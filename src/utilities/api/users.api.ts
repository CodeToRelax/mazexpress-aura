import { getFirebaseAuth } from '@/utilities/firebase/firebase';
import type { User, UsersListResponse, UserFilters, CreateUserData, UpdateUserData } from '@/types/user';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

async function getAuthToken(): Promise<string> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!user) throw new Error('No authenticated user');
  return await user.getIdToken();
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  return response.json();
}

export const usersApi = {
  async getUsers(filters: UserFilters = {}): Promise<UsersListResponse> {
    const token = await getAuthToken();
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });

    const response = await fetch(`${API_BASE_URL}/api/users?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    return handleResponse<UsersListResponse>(response);
  },

  async getUserById(id: string): Promise<{ success: boolean; data: User }> {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/api/users/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    return handleResponse(response);
  },

  async createUser(data: CreateUserData): Promise<{ success: boolean; data: User; message: string }> {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/api/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    return handleResponse(response);
  },

  async updateUser(id: string, data: UpdateUserData): Promise<{ success: boolean; data: User; message: string }> {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/api/users/${id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    return handleResponse(response);
  },

  async deleteUser(id: string): Promise<{ success: boolean; message: string }> {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/api/users/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    return handleResponse(response);
  },

  async toggleUserStatus(id: string, disabled: boolean): Promise<{ success: boolean; data: User; message: string }> {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/api/users/${id}/toggle-status`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ disabled }),
    });

    return handleResponse(response);
  },

  async getStats(): Promise<{
    totalUsers: number;
    totalCustomers: number;
    totalAdmins: number;
    activeUsers: number;
    inactiveUsers: number;
  }> {
    const token = await getAuthToken();
    
    // Fetch counts for each category using minimal data
    const [customersRes, adminsRes, activeRes, inactiveRes] = await Promise.all([
      fetch(`${API_BASE_URL}/api/users?userType=customer&limit=1`, {
        headers: { 'Authorization': `Bearer ${token}` },
      }),
      fetch(`${API_BASE_URL}/api/users?userType=admin&limit=1`, {
        headers: { 'Authorization': `Bearer ${token}` },
      }),
      fetch(`${API_BASE_URL}/api/users?disabled=false&limit=1`, {
        headers: { 'Authorization': `Bearer ${token}` },
      }),
      fetch(`${API_BASE_URL}/api/users?disabled=true&limit=1`, {
        headers: { 'Authorization': `Bearer ${token}` },
      }),
    ]);

    const [customers, admins, active, inactive] = await Promise.all([
      handleResponse<UsersListResponse>(customersRes),
      handleResponse<UsersListResponse>(adminsRes),
      handleResponse<UsersListResponse>(activeRes),
      handleResponse<UsersListResponse>(inactiveRes),
    ]);

    const totalCustomers = customers.data.pagination.totalDocs;
    const totalAdmins = admins.data.pagination.totalDocs;

    return {
      totalUsers: totalCustomers + totalAdmins,
      totalCustomers,
      totalAdmins,
      activeUsers: active.data.pagination.totalDocs,
      inactiveUsers: inactive.data.pagination.totalDocs,
    };
  },
};
