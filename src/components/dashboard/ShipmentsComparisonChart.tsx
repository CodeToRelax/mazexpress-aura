import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';
import { shipmentsApi } from '@/utilities/api/shipments.api';
import { Skeleton } from '@/components/ui/skeleton';

const COLORS = {
  air: 'hsl(var(--chart-1))',
  sea: 'hsl(var(--chart-2))',
};

export function ShipmentsComparisonChart() {
  const { t } = useTranslation();

  const { data, isLoading } = useQuery({
    queryKey: ['shipments', 'all-for-pie-chart'],
    queryFn: () => shipmentsApi.getShipments({ limit: 10000 }),
  });

  const chartData = useMemo(() => {
    if (!data?.data?.shipments) return [];

    const counts = { air: 0, sea: 0 };
    data.data.shipments.forEach((shipment) => {
      const method = shipment.shippingMethod?.toLowerCase();
      if (method === 'air') counts.air++;
      else if (method === 'sea') counts.sea++;
    });

    return [
      { name: t('dashboard.charts.air'), value: counts.air, color: COLORS.air },
      { name: t('dashboard.charts.sea'), value: counts.sea, color: COLORS.sea },
    ].filter((item) => item.value > 0);
  }, [data, t]);

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  if (isLoading) {
    return (
      <div className="glass-card rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-[160px] w-full" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="glass-card rounded-2xl p-4"
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 rounded-lg bg-muted/50 text-primary">
          <PieChartIcon className="h-4 w-4" />
        </div>
        <h3 className="text-sm font-medium text-muted-foreground">
          {t('dashboard.charts.shipmentsComparison')}
        </h3>
      </div>

      <div className="h-[160px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={35}
              outerRadius={55}
              paddingAngle={2}
              dataKey="value"
              label={({ value }) => value}
              labelLine={false}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={24}
              iconSize={8}
              formatter={(value) => (
                <span className="text-xs text-muted-foreground">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="text-center mt-1">
        <p className="text-lg font-bold text-foreground">{total}</p>
        <p className="text-xs text-muted-foreground">{t('dashboard.charts.totalShipments')}</p>
      </div>
    </motion.div>
  );
}
