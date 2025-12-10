import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { analyticsApi } from '@/utilities/api/analytics.api';
import { StatCard } from './StatCard';
import { formatCurrency } from '@/utilities/helpers/currencyHelpers';

export function WalletBalanceCard() {
  const { t } = useTranslation();

  const { data, isLoading } = useQuery({
    queryKey: ['analytics', 'walletSummary'],
    queryFn: () => analyticsApi.getWalletSummary(),
  });

  const total = (data?.positiveBalanceCount ?? 0) + (data?.negativeBalanceCount ?? 0) + (data?.zeroBalanceCount ?? 0);
  const positivePercent = total > 0 ? ((data?.positiveBalanceCount ?? 0) / total) * 100 : 0;
  const negativePercent = total > 0 ? ((data?.negativeBalanceCount ?? 0) / total) * 100 : 0;

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
        <div className="mt-4 pt-4 border-t border-border/50 space-y-3">
          {/* Balance bar */}
          <div className="h-2 rounded-full bg-muted overflow-hidden flex">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${positivePercent}%` }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-success h-full"
            />
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${negativePercent}%` }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-destructive h-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-success" />
              <div>
                <p className="text-muted-foreground">{t('dashboard.cards.positive')}</p>
                <p className="font-medium text-success">{formatCurrency(data.totalPositiveBalance, 'USD')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-destructive" />
              <div>
                <p className="text-muted-foreground">{t('dashboard.cards.negative')}</p>
                <p className="font-medium text-destructive">{formatCurrency(Math.abs(data.totalNegativeBalance), 'USD')}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </StatCard>
  );
}
