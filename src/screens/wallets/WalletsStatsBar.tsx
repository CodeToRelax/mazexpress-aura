import { useTranslation } from 'react-i18next';
import { Wallet, UserCheck, UserX } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatLYD } from '@/utilities/helpers/currencyHelpers';

interface WalletsStatsBarProps {
  stats: {
    totalWallets: number;
    activeWallets: number;
    inactiveWallets: number;
    totalBalance: number;
  };
  onStatClick: (filterType: 'all' | 'active' | 'inactive') => void;
}

export function WalletsStatsBar({ stats, onStatClick }: WalletsStatsBarProps) {
  const { t } = useTranslation();

  const statCards = [
    {
      icon: Wallet,
      label: t('wallets.stats.totalWallets'),
      value: stats.totalWallets,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      filterType: 'all' as const,
    },
    {
      icon: UserCheck,
      label: t('wallets.stats.activeWallets'),
      value: stats.activeWallets,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-500/10',
      filterType: 'active' as const,
    },
    {
      icon: UserX,
      label: t('wallets.stats.inactiveWallets'),
      value: stats.inactiveWallets,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-500/10',
      filterType: 'inactive' as const,
    },
    {
      icon: Wallet,
      label: t('wallets.stats.totalBalance'),
      value: formatLYD(stats.totalBalance),
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-500/10',
      filterType: null,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {statCards.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
          onClick={stat.filterType ? () => onStatClick(stat.filterType) : undefined}
          className={`glass-card rounded-xl p-4 ${stat.filterType ? 'cursor-pointer hover:bg-accent/20' : ''} transition-all duration-150 hover:shadow-md`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center shrink-0`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground truncate">{stat.label}</p>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
