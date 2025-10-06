import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { NavSection } from './NavSection';
import { useSidenavState } from '@/hooks/useSidenavState';
import { cn } from '@/lib/utils';
import type { NavItem } from '@/types/navigation';

interface SidenavProps {
  items: NavItem[];
  logo?: React.ReactNode;
  footer?: React.ReactNode;
}

export function Sidenav({ items, logo, footer }: SidenavProps) {
  const { t } = useTranslation();
  const { isCollapsed, toggleCollapsed, expandedGroups, toggleGroup } = useSidenavState();
  const isRTL = document.documentElement.dir === 'rtl';

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 80 : 288 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className={cn(
        'hidden xl:flex flex-col fixed top-0 bottom-0 z-40',
        'border-[hsl(var(--sidenav-border))] bg-[hsl(var(--sidenav-bg))]',
        'glass-card shadow-glass',
        isRTL ? 'right-0 border-l' : 'left-0 border-r',
      )}
      role="navigation"
      aria-label={t('nav.primary')}
    >
      {/* Header with logo and toggle */}
      <div className="flex items-center justify-between p-4 border-b border-[hsl(var(--sidenav-border))]">
        {!isCollapsed && <div className="flex-1">{logo}</div>}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapsed}
          aria-expanded={!isCollapsed}
          aria-label={isCollapsed ? t('nav.expand') : t('nav.collapse')}
          className="flex-shrink-0"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Navigation content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3">
        <NavSection
          items={items}
          isCollapsed={isCollapsed}
          expandedGroups={expandedGroups}
          onToggleGroup={toggleGroup}
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
    </motion.aside>
  );
}
