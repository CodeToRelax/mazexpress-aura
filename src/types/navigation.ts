import { LucideIcon } from 'lucide-react';

export type NavItem = {
  id: string;
  labelKey: string;
  icon?: LucideIcon;
  href?: string;
  match?: 'exact' | 'prefix';
  children?: NavItem[];
  disabled?: boolean;
  badge?: {
    text: string;
    tone?: 'info' | 'success' | 'warning' | 'danger';
  };
};
