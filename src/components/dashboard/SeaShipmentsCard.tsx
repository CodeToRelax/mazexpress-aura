import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Ship } from 'lucide-react';
import { analyticsApi } from '@/utilities/api/analytics.api';
import { StatCard } from './StatCard';
import { PeriodSelector } from './PeriodSelector';
import { getDateRangeFromPeriod } from '@/utilities/helpers/dateHelpers';
import type { AnalyticsPeriod } from '@/types/analytics';

export function SeaShipmentsCard() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<AnalyticsPeriod>('month');

  const { startDate, endDate } = getDateRangeFromPeriod(period);

  const { data, isLoading } = useQuery({
    queryKey: ['analytics', 'seaShipments', period],
    queryFn: () => analyticsApi.getSeaShipments(startDate, endDate),
  });

  return (
    <StatCard
      title={t('dashboard.cards.seaShipments')}
      value={data?.totalShipments ?? 0}
      subtitle={`${(data?.totalCBM ?? 0).toLocaleString()} CBM`}
      icon={Ship}
      iconColor="text-blue-500"
      loading={isLoading}
      headerAction={
        <PeriodSelector value={period} onChange={(v) => setPeriod(v as AnalyticsPeriod)} />
      }
    >
      {data && (
        <div className="mt-4 pt-4 border-t border-border/50">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('dashboard.status.inTransit')}</span>
              <span className="font-medium">{(data.cbmBreakdown?.['in transit'] ?? 0).toFixed(2)} CBM</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('dashboard.status.delivered')}</span>
              <span className="font-medium">{(data.cbmBreakdown?.delivered ?? 0).toFixed(2)} CBM</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('dashboard.status.atWarehouse')}</span>
              <span className="font-medium">{(data.cbmBreakdown?.['received at warehouse'] ?? 0).toFixed(2)} CBM</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('dashboard.status.readyPickup')}</span>
              <span className="font-medium">{(data.cbmBreakdown?.['ready for pick up'] ?? 0).toFixed(2)} CBM</span>
            </div>
          </div>
        </div>
      )}
    </StatCard>
  );
}
