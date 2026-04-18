import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { analyticsApi } from '@/utilities/api/analytics.api';
import { StatCard } from './StatCard';
import { formatCurrency } from '@/utilities/helpers/currencyHelpers';

export function WalletBalanceCard() {
  const { t } = useTranslation();

  const { data, isLoading } = useQuery({
    queryKey: ['analytics', 'walletSummary'],
    queryFn: () => analyticsApi.getWalletSummary(),
  });

  // Prefer new pre-computed donut segments when present, fall back to legacy fields.
  const segments = data?.balanceDonut?.segments;
  const positiveSeg = segments?.find((s) => s.key === 'positive');
  const negativeSeg = segments?.find((s) => s.key === 'negative');

  const positiveCount = positiveSeg?.walletCount ?? data?.positiveBalanceCount ?? 0;
  const negativeCount = negativeSeg?.walletCount ?? data?.negativeBalanceCount ?? 0;
  const positiveSum = positiveSeg?.sumBalance ?? data?.totalPositiveBalance ?? 0;
  const negativeSum = negativeSeg?.sumBalance ?? data?.totalNegativeBalance ?? 0;
  const total = positiveCount + negativeCount;

  const chartData = [
    { name: t('dashboard.cards.positive', { defaultValue: 'Positive' }), value: positiveCount, fill: 'hsl(var(--success))' },
    { name: t('dashboard.cards.negative', { defaultValue: 'Negative' }), value: negativeCount, fill: 'hsl(var(--destructive))' },
  ];

  return (
    <StatCard
      title={t('dashboard.cards.walletBalances')}
      value={data?.totalWallets ?? 0}
      subtitle={t('dashboard.cards.totalWallets')}
      icon={Wallet}
      iconColor="text-violet-500"
      loading={isLoading}
    >
      {data && (
        <div className="mt-4 pt-4 border-t border-border/50 space-y-4">
          <div className="relative h-[160px]">
            {total > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="hsl(var(--background))"
                      strokeWidth={2}
                    >
                      {chartData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '0.5rem',
                        fontSize: '0.75rem',
                      }}
                      formatter={(value: number, name: string) => [`${value} wallets`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-2xl font-bold leading-none">{total}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-1">
                    {t('dashboard.cards.tracked', { defaultValue: 'Tracked' })}
                  </p>
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                {t('dashboard.cards.noWalletData', { defaultValue: 'No wallet data' })}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-start gap-2">
              <TrendingUp className="h-4 w-4 text-success mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-muted-foreground">
                  {t('dashboard.cards.positive')} ({positiveCount})
                </p>
                <p className="font-semibold text-success truncate">
                  {formatCurrency(positiveSum, 'USD')}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <TrendingDown className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-muted-foreground">
                  {t('dashboard.cards.negative')} ({negativeCount})
                </p>
                <p className="font-semibold text-destructive truncate">
                  {formatCurrency(Math.abs(negativeSum), 'USD')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </StatCard>
  );
}
