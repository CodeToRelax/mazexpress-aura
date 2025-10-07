import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { NavItem as NavItemType } from '@/types/navigation';

interface NavItemProps {
  item: NavItemType;
  isCollapsed: boolean;
  isExpanded?: boolean;
  onToggle?: () => void;
  onNavigate?: () => void;
  depth?: number;
}

const BADGE_STYLES = {
  info: 'bg-primary/10 text-primary border-primary/20',
  success: 'bg-success/10 text-success border-success/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
  danger: 'bg-destructive/10 text-destructive border-destructive/20',
};

export function NavItem({ item, isCollapsed, isExpanded = false, onToggle, onNavigate, depth = 0 }: NavItemProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const [showSubmenu, setShowSubmenu] = useState(false);
  const hasChildren = item.children && item.children.length > 0;
  const isRTL = document.documentElement.dir === 'rtl';

  const isActive = item.href
    ? item.match === 'exact'
      ? location.pathname === item.href
      : location.pathname.startsWith(item.href)
    : false;

  const Icon = item.icon;

  const baseClasses = cn(
    'group relative flex items-center gap-3 px-3 py-2.5 rounded-xl',
    'transition-all duration-200',
    'hover:bg-[hsl(var(--sidenav-hover))]',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
    isActive && 'bg-[hsl(var(--sidenav-active-bg))] text-[hsl(var(--sidenav-active))]',
    !isActive && 'text-foreground',
    item.disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
    depth > 0 && 'text-sm ml-4',
    isCollapsed && !depth && 'justify-center'
  );

  // Render link item
  if (item.href && !hasChildren) {
    const content = (
      <NavLink
        to={item.href}
        className={baseClasses}
        aria-current={isActive ? 'page' : undefined}
        onClick={onNavigate}
      >
        {/* Active indicator */}
        {isActive && (
          <span
            className={cn(
              'absolute w-1 h-8 bg-[hsl(var(--sidenav-active))] rounded-full',
              isRTL ? 'right-0' : 'left-0'
            )}
          />
        )}

        {/* Icon */}
        {Icon && <Icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />}

        {/* Label and badge */}
        {!isCollapsed && (
          <>
            <span className="flex-1 truncate">{t(item.labelKey)}</span>
            {item.badge && (
              <Badge
                variant="outline"
                className={cn('text-xs', BADGE_STYLES[item.badge.tone || 'info'])}
              >
                {item.badge.text}
              </Badge>
            )}
          </>
        )}
      </NavLink>
    );

    // Wrap with tooltip when collapsed
    if (isCollapsed && depth === 0) {
      return (
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>{content}</TooltipTrigger>
            <TooltipContent side={isRTL ? 'left' : 'right'} className="glass-card">
              {t(item.labelKey)}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return content;
  }

  // Render parent item with children
  if (hasChildren) {
    const content = (
      <div className="relative">
        <button
          type="button"
          className={baseClasses}
          onClick={onToggle}
          onMouseEnter={() => isCollapsed && setShowSubmenu(true)}
          onMouseLeave={() => isCollapsed && setShowSubmenu(false)}
          aria-expanded={isExpanded}
        >
          {Icon && <Icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />}

          {!isCollapsed && (
            <>
              <span className="flex-1 truncate">{t(item.labelKey)}</span>
              <ChevronDown
                className={cn(
                  'h-4 w-4 transition-transform duration-200',
                  isExpanded && 'rotate-180'
                )}
                aria-hidden="true"
              />
            </>
          )}
        </button>

        {/* Submenu for expanded state */}
        {!isCollapsed && isExpanded && (
          <div className="mt-1 space-y-1">
            {item.children?.map((child) => (
              <NavItem
                key={child.id}
                item={child}
                isCollapsed={false}
                onNavigate={onNavigate}
                depth={depth + 1}
              />
            ))}
          </div>
        )}

        {/* Flyout for collapsed state */}
        {isCollapsed && showSubmenu && (
          <div
            className={cn(
              'absolute top-0 z-50 min-w-[200px] rounded-xl',
              'border border-[hsl(var(--sidenav-border))]',
              'bg-[hsl(var(--sidenav-flyout-bg))] shadow-glass',
              'p-2 space-y-1',
              isRTL ? 'right-full mr-2' : 'left-full ml-2'
            )}
            onMouseEnter={() => setShowSubmenu(true)}
            onMouseLeave={() => setShowSubmenu(false)}
          >
            {item.children?.map((child) => (
              <NavItem key={child.id} item={child} isCollapsed={false} onNavigate={onNavigate} depth={0} />
            ))}
          </div>
        )}
      </div>
    );

    // Wrap with tooltip when collapsed
    if (isCollapsed) {
      return (
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>{content}</div>
            </TooltipTrigger>
            <TooltipContent side={isRTL ? 'left' : 'right'} className="glass-card">
              {t(item.labelKey)}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return content;
  }

  return null;
}
