import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useACL } from '@/hooks/useACL';
import { PageLoader } from '@/components/feedback/PageLoader';
import { appConfig } from '@/app.config';

interface PrivateRouteProps {
  children: React.ReactNode;
}

/**
 * Protected route wrapper
 * Redirects to login if not authenticated
 */
export function PrivateRoute({ children }: PrivateRouteProps) {
  const { isAuthenticated, isInitialized } = useAuth();
  const { isAdmin, isLoaded } = useACL();
  
  // Step 1: Wait for auth initialization
  if (!isInitialized) {
    return <PageLoader />;
  }
  
  // Step 2: If not authenticated, redirect immediately (don't wait for ACL)
  if (!isAuthenticated) {
    return <Navigate to={appConfig.auth.redirectAfterLogout} replace />;
  }
  
  // Step 3: Only wait for ACL if user is authenticated
  if (!isLoaded) {
    return <PageLoader />;
  }
  
  // Step 4: Block if authenticated but not admin
  if (!isAdmin) {
    return <Navigate to={appConfig.auth.redirectAfterLogout} replace />;
  }
  
  return <>{children}</>;
}
