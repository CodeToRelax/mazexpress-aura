import { useTranslation } from 'react-i18next';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { AnalyticsPeriod, DeliveredPeriod } from '@/types/analytics';

interface PeriodSelectorProps {
  value: AnalyticsPeriod | DeliveredPeriod;
  onChange: (value: AnalyticsPeriod | DeliveredPeriod) => void;
  includeToday?: boolean;
  className?: string;
}

export function PeriodSelector({ value, onChange, includeToday = false, className }: PeriodSelectorProps) {
  const { t } = useTranslation();

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className || 'w-[120px] h-8 text-xs'}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {includeToday && (
          <SelectItem value="today">{t('dashboard.periods.today')}</SelectItem>
        )}
        <SelectItem value="week">{t('dashboard.periods.week')}</SelectItem>
        <SelectItem value="month">{t('dashboard.periods.month')}</SelectItem>
        <SelectItem value="year">{t('dashboard.periods.year')}</SelectItem>
      </SelectContent>
    </Select>
  );
}
