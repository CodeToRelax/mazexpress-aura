import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { PackageCheck } from 'lucide-react';
import { analyticsApi } from '@/utilities/api/analytics.api';
import { StatCard } from './StatCard';
import { PeriodSelector } from './PeriodSelector';
import type { DeliveredPeriod } from '@/types/analytics';

export function DeliveredPackagesCard() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<DeliveredPeriod>('month');

  const { data, isLoading } = useQuery({
    queryKey: ['analytics', 'deliveredTotal', period],
    queryFn: () => analyticsApi.getDeliveredTotal(period),
  });

  return (
    <StatCard
      title={t('dashboard.cards.deliveredPackages')}
      value={data?.totalDelivered ?? 0}
      subtitle={t('dashboard.cards.vsPreviousPeriod', { count: data?.previousPeriodDelivered ?? 0 })}
      icon={PackageCheck}
      iconColor="text-green-500"
      trend={
        data
          ? {
              value: data.changePercentage,
              isPositive: data.changePercentage >= 0,
            }
          : undefined
      }
      loading={isLoading}
      headerAction={
        <PeriodSelector
          value={period}
          onChange={(v) => setPeriod(v as DeliveredPeriod)}
          includeToday
        />
      }
    />
  );
}
