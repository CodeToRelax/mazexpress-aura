import { Home, Users, Settings, BarChart, Package, FileText, Warehouse, Wallet } from 'lucide-react';
import type { NavItem } from '@/types/navigation';
import type { ACLFlags } from '@/types/acl';

// Extend NavItem type to include ACL flag
export interface NavItemWithACL extends NavItem {
  aclFlag?: keyof ACLFlags;
  children?: NavItemWithACL[];
}

export const navigationItems: NavItemWithACL[] = [
  {
    id: 'dashboard',
    labelKey: 'nav.dashboard',
    icon: Home,
    href: '/',
    match: 'exact',
    aclFlag: 'canViewDashboard',
  },
  {
    id: 'users',
    labelKey: 'nav.users',
    icon: Users,
    href: '/users',
    match: 'prefix',
    aclFlag: 'canViewUsers',
  },
  {
    id: 'shipments',
    labelKey: 'nav.shipments',
    icon: Package,
    href: '/shipments',
    match: 'prefix',
    aclFlag: 'canViewShipments',
  },
  {
    id: 'warehouses',
    labelKey: 'nav.warehouses',
    icon: Warehouse,
    href: '/warehouses',
    match: 'prefix',
    aclFlag: 'canViewWarehouses',
  },
  {
    id: 'reports',
    labelKey: 'nav.reports',
    icon: BarChart,
    aclFlag: 'canViewReports',
    children: [
      {
        id: 'reports-sales',
        labelKey: 'nav.reports.sales',
        icon: FileText,
        href: '/reports/sales',
        match: 'exact',
        aclFlag: 'canViewReports',
      },
      {
        id: 'reports-analytics',
        labelKey: 'nav.reports.analytics',
        icon: BarChart,
        href: '/reports/analytics',
        match: 'exact',
        aclFlag: 'canViewReports',
      },
    ],
  },
  {
    id: 'wallet',
    labelKey: 'nav.wallet',
    icon: Warehouse,
    href: '/wallet',
    match: 'prefix',
    aclFlag: 'canViewWallet',
  },
  {
    id: 'invoices',
    labelKey: 'nav.invoices',
    icon: FileText,
    href: '/invoices',
    match: 'prefix',
    aclFlag: 'canViewInvoices',
  },
  {
    id: 'settings',
    labelKey: 'nav.settings',
    icon: Settings,
    href: '/settings',
    match: 'exact',
  },
];
