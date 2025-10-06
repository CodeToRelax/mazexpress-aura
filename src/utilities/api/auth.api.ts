import type { User } from '@/types/user';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  return response.json();
}

export interface SignupData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string;
  birthdate: string;
  address: {
    street?: string;
    specificDescription?: string;
    city: string;
    country: 'libya' | 'turkey' | 'china' | 'uae';
  };
  gender: 'male' | 'female';
  privacyPolicy: {
    usageAgreement: boolean;
  };
  userType?: 'admin' | 'customer';
}

export const authApi = {
  /**
   * Create a new user account
   * Requires authentication token from the admin creating the user
   */
  async signup(data: SignupData, token: string): Promise<{ success: boolean; data: User; message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    return handleResponse(response);
  },
};
