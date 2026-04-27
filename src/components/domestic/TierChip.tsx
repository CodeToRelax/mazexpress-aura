import { cn } from '@/lib/utils';
import type { DomesticTier } from '@/types/domestic';

interface Props {
  tier: DomesticTier;
  size?: 'sm' | 'md';
  className?: string;
}

export function TierChip({ tier, size = 'md', className }: Props) {
  const isOther = tier === 'OTHER';
  const sizeClass = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1';
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border font-semibold tracking-wide',
        sizeClass,
        isOther
          ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-700'
          : 'bg-secondary text-secondary-foreground border-border',
        className
      )}
      title={isOther ? 'Custom (admin-set) shipping price' : `Tier ${tier}`}
    >
      {isOther ? 'OTHER' : `Tier ${tier}`}
    </span>
  );
}