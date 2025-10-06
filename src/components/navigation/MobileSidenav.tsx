import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { NavSection } from './NavSection';
import { cn } from '@/lib/utils';
import type { NavItem } from '@/types/navigation';

interface MobileSidenavProps {
  items: NavItem[];
  logo?: React.ReactNode;
  footer?: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  expandedGroups: Set<string>;
  onToggleGroup: (id: string) => void;
}

export function MobileSidenav({
  items,
  logo,
  footer,
  isOpen,
  onClose,
  expandedGroups,
  onToggleGroup,
}: MobileSidenavProps) {
  const { t } = useTranslation();
  const isRTL = document.documentElement.dir === 'rtl';

  // Prevent background scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm xl:hidden"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.aside
            initial={{ x: isRTL ? '100%' : '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: isRTL ? '100%' : '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={cn(
              'fixed top-0 bottom-0 z-50 w-72 flex flex-col',
              'border-[hsl(var(--sidenav-border))] bg-[hsl(var(--sidenav-bg))]',
              'glass-card shadow-glass xl:hidden',
              isRTL ? 'right-0 border-l' : 'left-0 border-r',
            )}
            role="dialog"
            aria-label={t('nav.mobile')}
            aria-modal="true"
          >
            {/* Header with logo and close button */}
            <div className="flex items-center justify-between p-4 border-b border-[hsl(var(--sidenav-border))]">
              <div className="flex-1">{logo}</div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                aria-label={t('nav.close')}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Navigation content */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-3">
              <NavSection
                items={items}
                isCollapsed={false}
                expandedGroups={expandedGroups}
                onToggleGroup={onToggleGroup}
              />
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-[hsl(var(--sidenav-border))] flex items-center gap-2">
              <ThemeToggle />
              <LanguageToggle />
              {footer}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
