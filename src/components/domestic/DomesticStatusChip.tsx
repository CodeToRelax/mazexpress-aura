import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { DomesticStatus } from '@/types/domestic';

const STATUS_COLORS: Record<DomesticStatus, string> = {
  awaiting_approval: 'bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-800',
  awaiting_shipping: 'bg-blue-100 text-blue-900 border-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-800',
  in_transit: 'bg-indigo-100 text-indigo-900 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-200 dark:border-indigo-800',
  delivered: 'bg-emerald-100 text-emerald-900 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-800',
  delivery_failed: 'bg-rose-100 text-rose-900 border-rose-200 dark:bg-rose-900/30 dark:text-rose-200 dark:border-rose-800',
  returned: 'bg-slate-200 text-slate-900 border-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600',
  cancelled: 'bg-zinc-200 text-zinc-700 border-zinc-300 dark:bg-zinc-700 dark:text-zinc-200 dark:border-zinc-600',
};

interface Props {
  status: DomesticStatus;
  size?: 'sm' | 'md';
  className?: string;
}

export function DomesticStatusChip({ status, size = 'md', className }: Props) {
  const { t } = useTranslation();
  const sizeClass = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1';
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-medium whitespace-nowrap',
        sizeClass,
        STATUS_COLORS[status] || 'bg-muted text-muted-foreground border-border',
        className
      )}
    >
      {t(`domestic.status.${status}`, status)}
    </span>
  );
}