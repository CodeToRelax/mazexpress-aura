import { useTranslation } from 'react-i18next';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { NavSection } from './NavSection';
import { cn } from '@/lib/utils';
import type { NavItem } from '@/types/navigation';

interface SidenavProps {
  items: NavItem[];
  logo?: React.ReactNode;
  footer?: React.ReactNode;
  isCollapsed: boolean;
  expandedGroups: Set<string>;
  onToggleGroup: (id: string) => void;
}

export function Sidenav({ items, logo, footer, isCollapsed, expandedGroups, onToggleGroup }: SidenavProps) {
  const { t } = useTranslation();
  const isRTL = document.documentElement.dir === 'rtl';

  return (
    <aside
      className={cn(
        'hidden xl:flex flex-col overflow-hidden',
        'border-[hsl(var(--sidenav-border))] bg-[hsl(var(--sidenav-bg))]',
        'glass-card shadow-glass',
        isRTL ? 'border-l' : 'border-r',
        'h-[calc(100vh-var(--header-height,64px))]',
        isCollapsed ? 'w-20' : 'w-72'
      )}
      role="navigation"
      aria-label={t('nav.primary')}
    >
      {/* Navigation content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3">
        <NavSection
          items={items}
          isCollapsed={isCollapsed}
          expandedGroups={expandedGroups}
          onToggleGroup={onToggleGroup}
        />
      </div>

      {/* Footer with theme and language toggles */}
      <div className={cn(
        'p-3 border-t border-[hsl(var(--sidenav-border))]',
        isCollapsed ? 'flex flex-col gap-2' : 'flex items-center gap-2',
      )}>
        <ThemeToggle />
        <LanguageToggle />
        {!isCollapsed && footer}
      </div>
    </aside>
  );
}
