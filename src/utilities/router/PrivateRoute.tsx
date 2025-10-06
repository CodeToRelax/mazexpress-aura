import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
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
  
  if (!isInitialized) {
    return <PageLoader />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to={appConfig.auth.redirectAfterLogout} replace />;
  }
  
  return <>{children}</>;
}
