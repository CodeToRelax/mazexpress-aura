import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { LogOut, Menu } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { signOut } from '@/utilities/firebase/authHelpers';
import { useAppDispatch } from '@/utilities/redux';
import { logout } from '@/screens/auth/auth.slice';
import { clearACL } from '@/utilities/redux/acl.slice';
import { appConfig } from '@/app.config';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { SettingsToggle } from '@/components/ui/SettingsToggle';
import { navigationItems } from '@/data/navigation';
import { TopNav } from '@/components/navigation/TopNav';
import { MobileSidenav } from '@/components/navigation/MobileSidenav';
import { ACLDebugPanel } from '@/components/debug/ACLDebugPanel';

export function AppLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const handleSignOut = async () => {
    const { error } = await signOut();
    
    if (error) {
      toast.error(t(error));
    } else {
      dispatch(logout());
      dispatch(clearACL());
      toast.success(t('status.success'));
      navigate(appConfig.auth.redirectAfterLogout);
    }
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
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
    <div className="glass-background min-h-screen flex flex-col">
      {/* Top header */}
      <header className="sticky top-0 z-30 border-b border-border backdrop-blur-sm bg-background/80">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo and Mobile Menu */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="xl:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            {logo}
          </div>

          {/* Desktop Navigation */}
          <TopNav items={navigationItems} />
          
          {/* Desktop Actions */}
          <div className="hidden xl:flex items-center gap-2">
            <ThemeToggle />
            <LanguageToggle />
            <SettingsToggle />
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-2">
              <LogOut className="h-4 w-4" />
              {t('actions.signOut')}
            </Button>
          </div>

          {/* Mobile Actions */}
          <div className="flex xl:hidden items-center gap-2">
            <ThemeToggle />
            <SettingsToggle />
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar */}
      <MobileSidenav
        items={navigationItems}
        isOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        expandedGroups={expandedGroups}
        onToggleGroup={toggleGroup}
      />

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto p-6">
          <Outlet />
        </div>
      </main>

      {/* ACL Debug Panel */}
      <ACLDebugPanel />
    </div>
  );
}
