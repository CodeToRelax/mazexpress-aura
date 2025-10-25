import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { getFirebaseAuth } from '@/utilities/firebase/firebase';
import { useAppDispatch, useAppSelector } from '@/utilities/redux';
import { setUser, setError } from '@/screens/auth/auth.slice';
import { setGlobalLoading } from '@/utilities/redux/ui.slice';
import { setACL, clearACL, setACLError } from '@/utilities/redux/acl.slice';
import { aclApi } from '@/utilities/api/acl.api';
import { signOut } from '@/utilities/firebase/authHelpers';

/**
 * Hook to manage authentication state
 * Sets up Firebase auth listener and syncs with Redux
 * Fetches ACL data after authentication
 */
export function useAuth() {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, isInitialized } = useAppSelector((state) => state.auth);
  
  useEffect(() => {
    const auth = getFirebaseAuth();
    
    // Set up auth state listener
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('[useAuth] Auth state changed:', {
        hasUser: !!firebaseUser,
        email: firebaseUser?.email,
        uid: firebaseUser?.uid,
      });
      
      dispatch(setUser(firebaseUser));
      
      if (firebaseUser) {
        // Fetch ACL data after successful authentication
        console.log('[useAuth] Fetching ACL data for authenticated user...');
        try {
          const aclData = await aclApi.getUserACL();
          console.log('[useAuth] ACL data fetched successfully:', {
            userId: aclData.userId,
            userType: aclData.userType,
            flags: aclData.frontendFlags,
          });
          
          // Block customer accounts from accessing the dashboard
          if (aclData.userType === 'customer') {
            console.warn('[useAuth] Customer login blocked:', aclData.userId);
            
            // Sign out the customer immediately
            await signOut();
            
            // Set error in auth state
            dispatch(setError('errors.auth.customerNotAllowed'));
            
            // Clear ACL and user data
            dispatch(clearACL());
            dispatch(setUser(null));
            
            return; // Stop execution
          }
          
          // Only admins reach here
          dispatch(setACL(aclData));
        } catch (error) {
          console.error('[useAuth] Failed to fetch ACL data:', error);
          dispatch(setACLError(error instanceof Error ? error.message : 'Failed to load permissions'));
        }
      } else {
        // Clear ACL data on logout
        console.log('[useAuth] User logged out, clearing ACL');
        dispatch(clearACL());
      }
      
      dispatch(setGlobalLoading(false));
    });
    
    return () => unsubscribe();
  }, [dispatch]);
  
  return {
    user,
    isAuthenticated,
    isInitialized,
  };
}
