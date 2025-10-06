import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { useACL } from '@/hooks/useACL';
import { cn } from '@/lib/utils';
import type { NavItemWithACL } from '@/data/navigation';

interface TopNavProps {
  items: NavItemWithACL[];
}

export function TopNav({ items }: TopNavProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const { hasFlag, isLoaded } = useACL();

  if (!isLoaded) return null;

  // Filter items based on ACL
  const visibleItems = items.filter((item) => {
    if (!item.aclFlag) return true;
    return hasFlag(item.aclFlag);
  });

  const isActive = (item: NavItemWithACL): boolean => {
    if (!item.href) return false;
    
    if (item.match === 'exact') {
      return location.pathname === item.href;
    }
    
    return location.pathname.startsWith(item.href);
  };

  return (
    <NavigationMenu className="hidden xl:flex">
      <NavigationMenuList>
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);

          // Items with children (dropdown)
          if (item.children && item.children.length > 0) {
            const visibleChildren = item.children.filter((child) => {
              if (!child.aclFlag) return true;
              return hasFlag(child.aclFlag);
            });

            if (visibleChildren.length === 0) return null;

            return (
              <NavigationMenuItem key={item.id}>
                <NavigationMenuTrigger
                  className={cn(
                    'gap-2 bg-transparent hover:bg-accent/50',
                    active && 'bg-accent/30 border-b-2 border-primary'
                  )}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  {t(item.labelKey)}
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[200px] gap-1 p-2">
                    {visibleChildren.map((child) => {
                      const ChildIcon = child.icon;
                      const childActive = isActive(child);
                      
                      return (
                        <li key={child.id}>
                          <NavigationMenuLink asChild>
                            <Link
                              to={child.href || '#'}
                              className={cn(
                                'block select-none rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
                                childActive && 'bg-accent text-accent-foreground font-medium'
                              )}
                            >
                              <div className="flex items-center gap-2">
                                {ChildIcon && <ChildIcon className="h-4 w-4" />}
                                <span className="text-sm">{t(child.labelKey)}</span>
                              </div>
                            </Link>
                          </NavigationMenuLink>
                        </li>
                      );
                    })}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            );
          }

          // Simple nav items (no children)
          return (
            <NavigationMenuItem key={item.id}>
              <NavigationMenuLink asChild>
                <Link
                  to={item.href || '#'}
                  className={cn(
                    'group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent/50 hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 gap-2',
                    active && 'bg-accent/30 border-b-2 border-primary'
                  )}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  {t(item.labelKey)}
                  {item.badge && (
                    <span className={cn(
                      'px-1.5 py-0.5 text-xs rounded-full',
                      item.badge.tone === 'info' && 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                    )}>
                      {item.badge.text}
                    </span>
                  )}
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          );
        })}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
