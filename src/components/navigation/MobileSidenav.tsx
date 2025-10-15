import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { NavItem } from './NavItem';
import { useACL } from '@/hooks/useACL';
import { cn } from '@/lib/utils';
import type { NavItemWithACL } from '@/data/navigation';

interface MobileSidenavProps {
  items: NavItemWithACL[];
  logo?: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  expandedGroups: Set<string>;
  onToggleGroup: (id: string) => void;
}

export function MobileSidenav({
  items,
  logo,
  isOpen,
  onClose,
  expandedGroups,
  onToggleGroup,
}: MobileSidenavProps) {
  const { t } = useTranslation();
  const { hasFlag, isLoaded } = useACL();
  const isRTL = document.documentElement.dir === 'rtl';

  // Filter items based on ACL
  const visibleItems = items.filter((item) => {
    if (!item.aclFlag) return true;
    return hasFlag(item.aclFlag);
  });

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 xl:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className={cn(
          'fixed top-0 bottom-0 z-50 w-72',
          'bg-[hsl(var(--sidenav-bg))] glass-card shadow-glass',
          'flex flex-col xl:hidden',
          'transition-transform duration-300',
          isRTL ? 'right-0' : 'left-0'
        )}
        role="dialog"
        aria-modal="true"
        aria-label={t('nav.primary')}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[hsl(var(--sidenav-border))]">
          {logo}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close menu"
            className="glass-card hover:shadow-glass-hover"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoaded && (
            <nav className="space-y-1">
              {visibleItems.map((item) => (
                <NavItem
                  key={item.id}
                  item={item}
                  isCollapsed={false}
                  isExpanded={expandedGroups.has(item.id)}
                  onToggle={() => onToggleGroup(item.id)}
                  onNavigate={onClose}
                />
              ))}
            </nav>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[hsl(var(--sidenav-border))] flex items-center gap-2">
          {/* <ThemeToggle /> */}
          {/* <LanguageToggle /> */}
        </div>
      </aside>
    </>
  );
}
