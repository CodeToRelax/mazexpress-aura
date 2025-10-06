import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Menu, LogOut, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Sidenav } from '@/components/navigation/Sidenav';
import { MobileSidenav } from '@/components/navigation/MobileSidenav';
import { navigationItems } from '@/data/navigation';
import { useSidenavState } from '@/hooks/useSidenavState';
import { signOut } from '@/utilities/firebase/authHelpers';
import { useAppDispatch } from '@/utilities/redux';
import { logout } from '@/screens/auth/auth.slice';
import { appConfig } from '@/app.config';
import { cn } from '@/lib/utils';

export function AppLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isCollapsed, expandedGroups, toggleGroup } = useSidenavState();
  const isRTL = document.documentElement.dir === 'rtl';

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

  return (
    <div className="glass-background min-h-screen">
      {/* Desktop Sidenav */}
      <Sidenav items={navigationItems} logo={logo} />

      {/* Mobile Sidenav */}
      <MobileSidenav
        items={navigationItems}
        logo={logo}
        isOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        expandedGroups={expandedGroups}
        onToggleGroup={toggleGroup}
      />

      {/* Main content */}
      <div
        className={cn(
          'xl:transition-all xl:duration-300',
          isRTL ? 'xl:pr-20' : 'xl:pl-20',
          !isCollapsed && (isRTL ? 'xl:pr-72' : 'xl:pl-72'),
        )}
      >
        {/* Top header - Mobile and Desktop */}
        <header className="sticky top-0 z-30 border-b border-border/50 backdrop-blur-sm bg-background/80">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
                className="xl:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>
              {logo}
            </div>
            
            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <Button
                onClick={() => navigate('/settings')}
                variant="outline"
                size="sm"
                className="glass-card hover:shadow-glass-hover"
              >
                <Settings className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">{t('nav.settings')}</span>
              </Button>
              
              <Button
                onClick={handleSignOut}
                variant="outline"
                size="sm"
                className="glass-card hover:shadow-glass-hover text-xs sm:text-sm"
              >
                <LogOut className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">{t('actions.signOut')}</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
