import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { PageLoader } from '@/components/feedback/PageLoader';
import { appConfig } from '@/app.config';

interface PublicRouteProps {
  children: React.ReactNode;
}

/**
 * Public route wrapper
 * Redirects to dashboard if already authenticated
 */
export function PublicRoute({ children }: PublicRouteProps) {
  const { isAuthenticated, isInitialized } = useAuth();
  
  if (!isInitialized) {
    return <PageLoader />;
  }
  
  if (isAuthenticated) {
    return <Navigate to={appConfig.auth.redirectAfterLogin} replace />;
  }
  
  return <>{children}</>;
}
