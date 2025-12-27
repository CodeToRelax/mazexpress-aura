import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { navigationItems } from '@/data/navigation';
import { TopNav } from '@/components/navigation/TopNav';
import { MobileSidenav } from '@/components/navigation/MobileSidenav';
import { UserDropdown } from '@/components/navigation/UserDropdown';
// import { ACLDebugPanel } from '@/components/debug/ACLDebugPanel';

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

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
          
          {/* User Dropdown */}
          <UserDropdown />
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
      {/* <ACLDebugPanel /> */}
    </div>
  );
}
