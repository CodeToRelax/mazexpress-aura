import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { NavItem } from '@/types/navigation';

interface NavItemRowProps {
  item: NavItem;
  isCollapsed: boolean;
  depth?: number;
  isExpanded?: boolean;
  onToggle?: () => void;
  showFlyout?: boolean;
  onFlyoutChange?: (show: boolean) => void;
}

const BADGE_STYLES = {
  info: 'bg-primary/10 text-primary border-primary/20',
  success: 'bg-success/10 text-success border-success/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
  danger: 'bg-destructive/10 text-destructive border-destructive/20',
};

export function NavItemRow({
  item,
  isCollapsed,
  depth = 0,
  isExpanded,
  onToggle,
  showFlyout,
  onFlyoutChange,
}: NavItemRowProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const hasChildren = item.children && item.children.length > 0;

  const isActive = item.href
    ? item.match === 'exact'
      ? location.pathname === item.href
      : location.pathname.startsWith(item.href)
    : false;

  const Icon = item.icon;
  const isRTL = document.documentElement.dir === 'rtl';
  const ChevronIcon = isRTL ? ChevronRight : ChevronDown;

  const baseClasses = cn(
    'group relative flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
    'hover:bg-[hsl(var(--sidenav-hover))]',
    isActive && 'bg-[hsl(var(--sidenav-active-bg))] text-[hsl(var(--sidenav-active))]',
    !isActive && 'text-foreground',
    item.disabled && 'opacity-50 cursor-not-allowed',
    depth > 0 && 'text-sm',
  );

  const content = (
    <>
      {/* Active indicator */}
      {isActive && (
        <div
          className={cn(
            'absolute top-1/2 -translate-y-1/2 w-1 h-8 bg-[hsl(var(--sidenav-active))] rounded-full',
            isRTL ? 'right-0' : 'left-0',
          )}
        />
      )}

      {/* Icon */}
      {Icon && (
        <Icon
          className={cn('h-5 w-5 flex-shrink-0', isCollapsed && 'mx-auto')}
          aria-hidden="true"
        />
      )}

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
          {hasChildren && (
            <ChevronIcon 
              className={cn(
                'h-4 w-4 transition-transform duration-200',
                isExpanded && 'rotate-180'
              )} 
              aria-hidden="true" 
            />
          )}
        </>
      )}
    </>
  );

  // If item has href, render as link
  if (item.href && !hasChildren) {
    const linkContent = (
      <NavLink
        to={item.href}
        className={baseClasses}
        aria-current={isActive ? 'page' : undefined}
        aria-disabled={item.disabled}
        style={{ pointerEvents: item.disabled ? 'none' : 'auto' }}
      >
        {content}
      </NavLink>
    );

    if (isCollapsed) {
      return (
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
            <TooltipContent side={isRTL ? 'left' : 'right'} className="glass-card">
              {t(item.labelKey)}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return linkContent;
  }

  // If item has children, render as button
  if (hasChildren) {
    const buttonContent = (
      <button
        type="button"
        className={baseClasses}
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-controls={`nav-group-${item.id}`}
        disabled={item.disabled}
        onMouseEnter={() => isCollapsed && onFlyoutChange?.(true)}
        onMouseLeave={() => isCollapsed && onFlyoutChange?.(false)}
      >
        {content}
      </button>
    );

    if (isCollapsed) {
      return (
        <div className="relative">
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
              <TooltipContent side={isRTL ? 'left' : 'right'} className="glass-card">
                {t(item.labelKey)}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Flyout submenu */}
          {showFlyout && (
            <div
              className={cn(
                'absolute top-0 z-50 min-w-[200px] rounded-2xl border border-[hsl(var(--sidenav-border))]',
                'bg-[hsl(var(--sidenav-flyout-bg))] shadow-glass p-2 space-y-1',
                isRTL ? 'right-full mr-2' : 'left-full ml-2',
              )}
              onMouseEnter={() => onFlyoutChange?.(true)}
              onMouseLeave={() => onFlyoutChange?.(false)}
            >
              {item.children?.map((child) => (
                <NavItemRow key={child.id} item={child} isCollapsed={false} depth={depth + 1} />
              ))}
            </div>
          )}
        </div>
      );
    }

    return buttonContent;
  }

  // Fallback for items without href or children
  return null;
}
