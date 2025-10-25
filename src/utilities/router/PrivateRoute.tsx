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
  
  if (!isInitialized || !isLoaded) {
    return <PageLoader />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to={appConfig.auth.redirectAfterLogout} replace />;
  }
  
  // Block if authenticated but not admin (fallback protection)
  if (isAuthenticated && !isAdmin) {
    return <Navigate to={appConfig.auth.redirectAfterLogout} replace />;
  }
  
  return <>{children}</>;
}
