import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { BarChart3 } from 'lucide-react';
import { analyticsApi } from '@/utilities/api/analytics.api';
import { PeriodSelector } from './PeriodSelector';
import { Skeleton } from '@/components/ui/skeleton';
import type { AnalyticsPeriod } from '@/types/analytics';

export function ShipmentsComparisonChart() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<AnalyticsPeriod>('month');

  const { data, isLoading } = useQuery({
    queryKey: ['analytics', 'shipmentsComparison', period],
    queryFn: () => analyticsApi.getShipmentsComparison(period),
  });

  if (isLoading) {
    return (
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-8 w-[120px]" />
        </div>
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="glass-card rounded-2xl p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-muted/50 text-primary">
            <BarChart3 className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-medium text-muted-foreground">
            {t('dashboard.charts.shipmentsComparison')}
          </h3>
        </div>
        <PeriodSelector value={period} onChange={(v) => setPeriod(v as AnalyticsPeriod)} />
      </div>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data?.chartData ?? []} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              className="fill-muted-foreground"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              className="fill-muted-foreground"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Legend />
            <Bar
              dataKey="airShipments"
              name={t('dashboard.charts.air')}
              fill="hsl(var(--chart-1))"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="seaShipments"
              name={t('dashboard.charts.sea')}
              fill="hsl(var(--chart-2))"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {data?.totals && (
        <div className="mt-4 pt-4 border-t border-border/50 flex justify-center gap-8">
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{data.totals.air}</p>
            <p className="text-xs text-muted-foreground">{t('dashboard.charts.totalAir')}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{data.totals.sea}</p>
            <p className="text-xs text-muted-foreground">{t('dashboard.charts.totalSea')}</p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
