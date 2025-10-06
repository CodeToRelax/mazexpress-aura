import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NavItemRow } from './NavItemRow';
import type { NavItem } from '@/types/navigation';

interface NavSectionProps {
  items: NavItem[];
  isCollapsed: boolean;
  expandedGroups: Set<string>;
  onToggleGroup: (id: string) => void;
}

export function NavSection({ items, isCollapsed, expandedGroups, onToggleGroup }: NavSectionProps) {
  const [flyoutItem, setFlyoutItem] = useState<string | null>(null);

  return (
    <nav aria-label="Primary navigation" className="space-y-1">
      {items.map((item) => {
        const hasChildren = item.children && item.children.length > 0;
        const isExpanded = expandedGroups.has(item.id);

        return (
          <div key={item.id}>
            <NavItemRow
              item={item}
              isCollapsed={isCollapsed}
              isExpanded={isExpanded}
              onToggle={() => onToggleGroup(item.id)}
              showFlyout={flyoutItem === item.id}
              onFlyoutChange={(show) => setFlyoutItem(show ? item.id : null)}
            />

            {/* Nested children (only in expanded desktop mode) */}
            {hasChildren && !isCollapsed && (
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    id={`nav-group-${item.id}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-1 space-y-1 pl-4">
                      {item.children?.map((child) => (
                        <NavItemRow key={child.id} item={child} isCollapsed={false} depth={1} />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>
        );
      })}
    </nav>
  );
}
