import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Users } from 'lucide-react';
import { analyticsApi } from '@/utilities/api/analytics.api';
import { StatCard } from './StatCard';
import { PeriodSelector } from './PeriodSelector';
import type { AnalyticsPeriod } from '@/types/analytics';

export function CustomerGrowthCard() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<AnalyticsPeriod>('month');

  const { data, isLoading } = useQuery({
    queryKey: ['analytics', 'customerGrowth', period],
    queryFn: () => analyticsApi.getCustomerGrowth(period),
  });

  return (
    <StatCard
      title={t('dashboard.cards.totalCustomers')}
      value={data?.totalCustomers ?? 0}
      subtitle={t('dashboard.cards.newThisPeriod', { count: data?.newCustomers ?? 0 })}
      icon={Users}
      iconColor="text-emerald-500"
      trend={
        data
          ? {
              value: data.growthPercentage,
              isPositive: data.growthPercentage >= 0,
            }
          : undefined
      }
      loading={isLoading}
      headerAction={
        <PeriodSelector value={period} onChange={(v) => setPeriod(v as AnalyticsPeriod)} />
      }
    />
  );
}
