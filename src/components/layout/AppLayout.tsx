import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sidenav } from '@/components/navigation/Sidenav';
import { MobileSidenav } from '@/components/navigation/MobileSidenav';
import { navigationItems } from '@/data/navigation';
import { useSidenavState } from '@/hooks/useSidenavState';
import { cn } from '@/lib/utils';

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isCollapsed, expandedGroups, toggleGroup } = useSidenavState();
  const isRTL = document.documentElement.dir === 'rtl';

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
        {/* Mobile header with menu button */}
        <header className="xl:hidden sticky top-0 z-30 border-b border-border/50 backdrop-blur-sm bg-background/80">
          <div className="flex items-center gap-3 px-4 py-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
            {logo}
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
