import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { getFirebaseAuth } from '@/utilities/firebase/firebase';
import { useAppDispatch, useAppSelector } from '@/utilities/redux';
import { setUser } from '@/screens/auth/auth.slice';
import { setGlobalLoading } from '@/utilities/redux/ui.slice';

/**
 * Hook to manage authentication state
 * Sets up Firebase auth listener and syncs with Redux
 */
export function useAuth() {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, isInitialized } = useAppSelector((state) => state.auth);
  
  useEffect(() => {
    const auth = getFirebaseAuth();
    
    // Set up auth state listener
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      dispatch(setUser(firebaseUser));
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
