/**
 * Centralized error handler for API calls
 * Provides user-friendly error messages for common error scenarios
 */

interface APIError {
  message: string;
  statusCode?: number;
  data?: any;
}

/**
 * Handle API errors and return user-friendly messages
 */
export function handleAPIError(error: unknown): string {
  if (error instanceof Response) {
    // Handle HTTP response errors
    if (error.status === 403) {
      return 'You don\'t have permission to access this resource. This may be due to country-based access restrictions.';
    }
    if (error.status === 401) {
      return 'Your session has expired. Please log in again.';
    }
    if (error.status === 404) {
      return 'The requested resource was not found.';
    }
    if (error.status === 500) {
      return 'A server error occurred. Please try again later.';
    }
    return `Request failed with status ${error.status}`;
  }

  if (error instanceof Error) {
    // Check for specific error messages from backend
    if (error.message.includes('country-based access restriction')) {
      return 'You don\'t have access to shipments in this status due to country-based restrictions.';
    }
    if (error.message.includes('not authorized')) {
      return 'You are not authorized to perform this action.';
    }
    return error.message;
  }

  return 'An unexpected error occurred. Please try again.';
}

/**
 * Check if error is a country-based access restriction
 */
export function isCountryRestrictionError(error: unknown): boolean {
  if (error instanceof Response && error.status === 403) {
    return true;
  }
  if (error instanceof Error) {
    return error.message.toLowerCase().includes('country') || 
           error.message.toLowerCase().includes('access restriction');
  }
  return false;
}

/**
 * Extract error message from various error types
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
}
