import { useTranslation } from 'react-i18next';
import { Receipt, TrendingUp, TrendingDown, Clock, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatLYD } from '@/utilities/helpers/currencyHelpers';

interface TransactionStats {
  totalTransactions: number;
  totalDeposits: number;
  totalWithdrawals: number;
  pendingCount: number;
  completedCount: number;
  failedCount: number;
  depositAmount: number;
  withdrawalAmount: number;
}

interface TransactionsStatsBarProps {
  stats: TransactionStats;
  onStatClick: (filterType: 'all' | 'deposits' | 'withdrawals' | 'pending' | 'completed' | 'failed') => void;
}

export function TransactionsStatsBar({ stats, onStatClick }: TransactionsStatsBarProps) {
  const { t } = useTranslation();

  const statCards = [
    {
      icon: Receipt,
      label: t('wallet.stats.totalTransactions'),
      value: stats.totalTransactions,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      filterType: 'all' as const,
    },
    {
      icon: TrendingUp,
      label: t('wallet.stats.deposits'),
      value: `${stats.totalDeposits}`,
      subValue: formatLYD(stats.depositAmount),
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-500/10',
      filterType: 'deposits' as const,
    },
    {
      icon: TrendingDown,
      label: t('wallet.stats.withdrawals'),
      value: `${stats.totalWithdrawals}`,
      subValue: formatLYD(stats.withdrawalAmount),
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-500/10',
      filterType: 'withdrawals' as const,
    },
    {
      icon: Clock,
      label: t('wallet.stats.pending'),
      value: stats.pendingCount,
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      filterType: 'pending' as const,
    },
    {
      icon: CheckCircle,
      label: t('wallet.stats.completed'),
      value: stats.completedCount,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-500/10',
      filterType: 'completed' as const,
    },
    {
      icon: XCircle,
      label: t('wallet.stats.failed'),
      value: stats.failedCount,
      color: 'text-gray-600 dark:text-gray-400',
      bgColor: 'bg-gray-500/10',
      filterType: 'failed' as const,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {statCards.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
          onClick={() => onStatClick(stat.filterType)}
          className="glass-card rounded-xl p-4 cursor-pointer hover:bg-accent/20 transition-all duration-150 hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center shrink-0`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground truncate">{stat.label}</p>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              {stat.subValue && (
                <p className="text-xs text-muted-foreground">{stat.subValue}</p>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
