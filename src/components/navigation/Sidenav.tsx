import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { NavItem } from './NavItem';
import { cn } from '@/lib/utils';
import { useACL } from '@/hooks/useACL';
import type { NavItemWithACL } from '@/data/navigation';

interface SidenavProps {
  items: NavItemWithACL[];
  logo?: React.ReactNode;
  isCollapsed: boolean;
  expandedGroups: Set<string>;
  onToggleGroup: (id: string) => void;
}

export function Sidenav({ items, isCollapsed, expandedGroups, onToggleGroup }: SidenavProps) {
  const { t } = useTranslation();
  const { hasFlag } = useACL();
  const isRTL = document.documentElement.dir === 'rtl';

  // Filter navigation items based on ACL permissions
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // If item has ACL flag, check permission
      if (item.aclFlag) {
        return hasFlag(item.aclFlag);
      }
      // No ACL flag means visible to all
      return true;
    });
  }, [items, hasFlag]);

  return (
    <aside
      className={cn(
        'hidden xl:flex flex-col',
        'border-[hsl(var(--sidenav-border))] bg-[hsl(var(--sidenav-bg))]',
        'glass-card shadow-glass transition-all duration-300',
        isRTL ? 'border-l' : 'border-r',
        'h-[calc(100vh-64px)]',
        isCollapsed ? 'w-20' : 'w-72'
      )}
      role="navigation"
      aria-label={t('nav.primary')}
    >
      {/* Navigation content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3">
        <nav className="space-y-1">
          {filteredItems.map((item) => (
            <NavItem
              key={item.id}
              item={item}
              isCollapsed={isCollapsed}
              isExpanded={expandedGroups.has(item.id)}
              onToggle={() => onToggleGroup(item.id)}
            />
          ))}
        </nav>
      </div>

      {/* Footer with theme and language toggles */}
      <div className={cn(
        'p-3 border-t border-[hsl(var(--sidenav-border))]',
        isCollapsed ? 'flex flex-col gap-2' : 'flex items-center gap-2'
      )}>
        <ThemeToggle />
        <LanguageToggle />
      </div>
    </aside>
  );
}
