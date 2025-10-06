import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Settings, Users, LayoutDashboard, BarChart3, Package } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { signOut } from '@/utilities/firebase/authHelpers';
import { useAppDispatch } from '@/utilities/redux';
import { logout } from '@/screens/auth/auth.slice';
import { appConfig } from '@/app.config';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LanguageToggle } from '@/components/ui/LanguageToggle';

export function AppLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const location = useLocation();

  const handleSignOut = async () => {
    const { error } = await signOut();
    
    if (error) {
      toast.error(t(error));
    } else {
      dispatch(logout());
      toast.success(t('status.success'));
      navigate(appConfig.auth.redirectAfterLogout);
    }
  };

  const logo = (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
        <span className="text-primary font-bold text-sm">MA</span>
      </div>
      <span className="font-semibold text-foreground">MazExpress</span>
    </div>
  );

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="glass-background min-h-screen flex flex-col">
      {/* Top header */}
      <header className="sticky top-0 z-30 border-b border-border backdrop-blur-sm bg-background/80">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo */}
          <div className="flex items-center gap-3">
            {logo}
          </div>
          
          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1 mx-4 flex-1">
            <Button
              onClick={() => navigate('/dashboard')}
              variant={isActive('/dashboard') ? 'secondary' : 'ghost'}
              size="sm"
              className="gap-2"
            >
              <LayoutDashboard className="h-4 w-4" />
              {t('nav.dashboard')}
            </Button>
            <Button
              onClick={() => navigate('/users')}
              variant={isActive('/users') ? 'secondary' : 'ghost'}
              size="sm"
              className="gap-2"
            >
              <Users className="h-4 w-4" />
              {t('nav.users')}
            </Button>
            <Button
              onClick={() => navigate('/reports')}
              variant="ghost"
              size="sm"
              className="gap-2"
              disabled
              title="Coming soon"
            >
              <BarChart3 className="h-4 w-4" />
              {t('nav.reports')}
            </Button>
            <Button
              onClick={() => navigate('/inventory')}
              variant="ghost"
              size="sm"
              className="gap-2"
              disabled
              title="Coming soon"
            >
              <Package className="h-4 w-4" />
              {t('nav.inventory')}
            </Button>
          </nav>
          
          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageToggle />
            
            <Button
              onClick={handleSignOut}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">{t('actions.signOut')}</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-4 lg:p-6">
        <Outlet />
      </main>
    </div>
  );
}
