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

  // Backend may expose kgBreakdown; fall back to statusBreakdown counts.
  const breakdown = (data as any)?.kgBreakdown ?? data?.statusBreakdown ?? {};
  const isKg = !!(data as any)?.kgBreakdown;
  const unit = isKg ? 'kg' : '';

  // Exclude "delivered" — show in-progress states only
  const rows: { key: string; labelKey: string }[] = [
    { key: 'in transit', labelKey: 'dashboard.status.inTransit' },
    { key: 'received at warehouse', labelKey: 'dashboard.status.atWarehouse' },
    { key: 'shipped to destination', labelKey: 'dashboard.status.shippedToDestination' },
    { key: 'ready for pick up', labelKey: 'dashboard.status.readyPickup' },
  ];

  const formatVal = (v: number) =>
    isKg ? `${(v ?? 0).toLocaleString()} ${unit}` : String(v ?? 0);

  return (
    <StatCard
      title={t('dashboard.cards.airShipments')}
      value={`${(data?.totalKG ?? 0).toLocaleString()} kg`}
      subtitle={t('dashboard.cards.totalAirWeight', { defaultValue: 'Total air weight' })}
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
            {rows.map((row) => (
              <div key={row.key} className="flex justify-between">
                <span className="text-muted-foreground">
                  {t(row.labelKey, { defaultValue: row.key })}
                </span>
                <span className="font-medium">{formatVal(breakdown[row.key] ?? 0)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </StatCard>
  );
}
