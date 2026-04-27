import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { DOMESTIC_STATUSES, type DomesticStatus } from '@/types/domestic';

interface Props {
  value: DomesticStatus | 'all';
  onChange: (v: DomesticStatus | 'all') => void;
}

const ORDER: (DomesticStatus | 'all')[] = ['all', ...DOMESTIC_STATUSES];

export function StatusTabs({ value, onChange }: Props) {
  const { t } = useTranslation();
  return (
    <div className="overflow-x-auto -mx-1 px-1">
      <div className="inline-flex gap-1 rounded-lg border bg-muted/40 p-1 min-w-max">
        {ORDER.map((s) => {
          const active = value === s;
          const label =
            s === 'all'
              ? t('domestic.admin.shipments.tabs.all', 'All')
              : t(`domestic.status.${s}`, s);
          return (
            <button
              key={s}
              type="button"
              onClick={() => onChange(s)}
              className={cn(
                'whitespace-nowrap px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                active
                  ? 'bg-background text-foreground shadow-sm border border-border'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              aria-pressed={active}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}