import { useTranslation } from 'react-i18next';
import { Users, UserCheck, UserX, Shield, UsersRound } from 'lucide-react';
import { motion } from 'framer-motion';

interface UsersStatsBarProps {
  stats: {
    totalUsers: number;
    totalCustomers: number;
    totalAdmins: number;
    activeUsers: number;
    inactiveUsers: number;
  };
  onStatClick: (filterType: 'all' | 'customers' | 'admins' | 'active' | 'inactive') => void;
}

export function UsersStatsBar({ stats, onStatClick }: UsersStatsBarProps) {
  const { t } = useTranslation();

  const statCards = [
    {
      icon: Users,
      label: t('users.stats.totalUsers'),
      value: stats.totalUsers,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      filterType: 'all' as const,
    },
    {
      icon: UsersRound,
      label: t('users.stats.customers'),
      value: stats.totalCustomers,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-500/10',
      filterType: 'customers' as const,
    },
    {
      icon: Shield,
      label: t('users.stats.admins'),
      value: stats.totalAdmins,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-500/10',
      filterType: 'admins' as const,
    },
    {
      icon: UserCheck,
      label: t('users.stats.active'),
      value: stats.activeUsers,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-500/10',
      filterType: 'active' as const,
    },
    {
      icon: UserX,
      label: t('users.stats.inactive'),
      value: stats.inactiveUsers,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-500/10',
      filterType: 'inactive' as const,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
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
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
