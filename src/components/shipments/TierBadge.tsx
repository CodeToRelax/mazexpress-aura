import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';

interface TierBadgeProps {
  tier: 'A' | 'B' | 'C' | 'D' | 'E';
  className?: string;
}

const tierConfig = {
  A: {
    label: 'Standard',
    variant: 'default' as const,
    className: 'bg-slate-500/20 text-slate-700 dark:text-slate-300 border-slate-500/30',
  },
  B: {
    label: 'Premium',
    variant: 'default' as const,
    className: 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30',
  },
  C: {
    label: 'VIP',
    variant: 'default' as const,
    className: 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/30',
  },
  D: {
    label: 'Enterprise',
    variant: 'default' as const,
    className: 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30',
  },
  E: {
    label: 'Ultimate',
    variant: 'default' as const,
    className: 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/30',
  },
};

export function TierBadge({ tier, className }: TierBadgeProps) {
  const { t } = useTranslation();
  const config = tierConfig[tier] || tierConfig.A;

  return (
    <Badge
      variant={config.variant}
      className={cn(
        'font-semibold',
        config.className,
        className
      )}
    >
      {t(`shipments.tier.${tier.toLowerCase()}`, { defaultValue: `${tier} - Standard` })}
    </Badge>
  );
}
