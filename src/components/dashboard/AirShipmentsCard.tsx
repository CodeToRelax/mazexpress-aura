import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Plane } from 'lucide-react';
import { analyticsApi } from '@/utilities/api/analytics.api';
import { StatCard } from './StatCard';
import { PeriodSelector } from './PeriodSelector';
import { getDateRangeFromPeriod } from '@/utilities/helpers/dateHelpers';
import type { AnalyticsPeriod } from '@/types/analytics';

export function AirShipmentsCard() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<AnalyticsPeriod>('month');

  const { startDate, endDate } = getDateRangeFromPeriod(period);

  const { data, isLoading } = useQuery({
    queryKey: ['analytics', 'airShipments', period],
    queryFn: () => analyticsApi.getAirShipments(startDate, endDate),
  });

  return (
    <StatCard
      title={t('dashboard.cards.airShipments')}
      value={data?.totalShipments ?? 0}
      subtitle={`${(data?.totalKG ?? 0).toLocaleString()} KG`}
      icon={Plane}
      iconColor="text-sky-500"
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
              <span className="font-medium">{data.statusBreakdown['in transit'] ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('dashboard.status.delivered')}</span>
              <span className="font-medium">{data.statusBreakdown.delivered ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('dashboard.status.atWarehouse')}</span>
              <span className="font-medium">{data.statusBreakdown['received at warehouse'] ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('dashboard.status.readyPickup')}</span>
              <span className="font-medium">{data.statusBreakdown['ready for pick up'] ?? 0}</span>
            </div>
          </div>
        </div>
      )}
    </StatCard>
  );
}
