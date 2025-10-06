import { Home, Users, Settings, BarChart, Package, FileText, HelpCircle } from 'lucide-react';
import type { NavItem } from '@/types/navigation';

export const navigationItems: NavItem[] = [
  {
    id: 'dashboard',
    labelKey: 'nav.dashboard',
    icon: Home,
    href: '/',
    match: 'exact',
  },
  {
    id: 'users',
    labelKey: 'nav.users',
    icon: Users,
    href: '/users',
    match: 'prefix',
  },
  {
    id: 'reports',
    labelKey: 'nav.reports',
    icon: BarChart,
    children: [
      {
        id: 'reports-sales',
        labelKey: 'nav.reports.sales',
        icon: FileText,
        href: '/reports/sales',
        match: 'exact',
      },
      {
        id: 'reports-analytics',
        labelKey: 'nav.reports.analytics',
        icon: BarChart,
        href: '/reports/analytics',
        match: 'exact',
      },
    ],
  },
  {
    id: 'inventory',
    labelKey: 'nav.inventory',
    icon: Package,
    href: '/inventory',
    match: 'prefix',
    badge: {
      text: 'Beta',
      tone: 'info',
    },
  },
  {
    id: 'help',
    labelKey: 'nav.help',
    icon: HelpCircle,
    href: '/help',
    match: 'exact',
  },
];
