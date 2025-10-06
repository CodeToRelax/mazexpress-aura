import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  User,
  AuthError,
  UserCredential,
} from 'firebase/auth';
import { getFirebaseAuth } from './firebase';

/**
 * Firebase error code to user-friendly message mapping
 * Returns i18n key for translation
 */
export function mapAuthErrorToMessage(error: AuthError): string {
  const errorCode = error.code;
  
  const errorMap: Record<string, string> = {
    'auth/invalid-credential': 'errors.auth.invalid',
    'auth/user-not-found': 'errors.auth.invalid',
    'auth/wrong-password': 'errors.auth.invalid',
    'auth/invalid-email': 'errors.email',
    'auth/user-disabled': 'errors.auth.disabled',
    'auth/too-many-requests': 'errors.auth.tooManyRequests',
    'auth/network-request-failed': 'errors.auth.network',
    'auth/operation-not-allowed': 'errors.auth.notAllowed',
  };
  
  return errorMap[errorCode] || 'errors.auth.unknown';
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<{ user: User | null; error: string | null }> {
  try {
    const auth = getFirebaseAuth();
    const userCredential: UserCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    return { user: userCredential.user, error: null };
  } catch (error) {
    const authError = error as AuthError;
    const errorKey = mapAuthErrorToMessage(authError);
    return { user: null, error: errorKey };
  }
}

/**
 * Sign out current user
 */
export async function signOut(): Promise<{ error: string | null }> {
  try {
    const auth = getFirebaseAuth();
    await firebaseSignOut(auth);
    return { error: null };
  } catch (error) {
    const authError = error as AuthError;
    const errorKey = mapAuthErrorToMessage(authError);
    return { error: errorKey };
  }
}

/**
 * Get current user
 */
export function getCurrentUser(): User | null {
  const auth = getFirebaseAuth();
  return auth.currentUser;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return getCurrentUser() !== null;
}
