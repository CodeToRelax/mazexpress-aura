import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, UserCheck, UserX, Shield, MapPin, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import type { User } from '@/types/user';

interface UsersStatsBarProps {
  users: User[];
  totalCount: number;
}

export function UsersStatsBar({ users, totalCount }: UsersStatsBarProps) {
  const { t } = useTranslation();

  const stats = useMemo(() => {
    const active = users.filter(u => !u.disabled).length;
    const inactive = users.filter(u => u.disabled).length;
    const admins = users.filter(u => u.userType === 'admin').length;

    // Count by city (top 3)
    const cityCount = users.reduce((acc, user) => {
      const city = user.address?.city || 'Unknown';
      acc[city] = (acc[city] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topCities = Object.entries(cityCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([city, count]) => ({ city, count }));

    // Count by country (top 3)
    const countryCount = users.reduce((acc, user) => {
      const country = user.address?.country || 'Unknown';
      acc[country] = (acc[country] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topCountries = Object.entries(countryCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([country, count]) => ({ country, count }));

    return {
      total: totalCount,
      active,
      inactive,
      admins,
      topCities,
      topCountries,
    };
  }, [users, totalCount]);

  const statCards = [
    {
      icon: Users,
      label: t('users.stats.total'),
      value: stats.total,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      icon: UserCheck,
      label: t('users.stats.active'),
      value: stats.active,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-500/10',
    },
    {
      icon: UserX,
      label: t('users.stats.inactive'),
      value: stats.inactive,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-500/10',
    },
    {
      icon: Shield,
      label: t('users.stats.admins'),
      value: stats.admins,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="glass-card rounded-xl p-4"
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Top Cities */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="glass-card rounded-xl p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <MapPin className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
            <h3 className="font-semibold text-foreground">{t('users.stats.byCity')}</h3>
          </div>
          <div className="space-y-2">
            {stats.topCities.length > 0 ? (
              stats.topCities.map(({ city, count }) => (
                <div key={city} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground capitalize">{city}</span>
                  <span className="text-sm font-medium text-foreground">{count}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No data</p>
            )}
          </div>
        </motion.div>

        {/* Top Countries */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.25 }}
          className="glass-card rounded-xl p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Globe className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="font-semibold text-foreground">{t('users.stats.byCountry')}</h3>
          </div>
          <div className="space-y-2">
            {stats.topCountries.length > 0 ? (
              stats.topCountries.map(({ country, count }) => (
                <div key={country} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground capitalize">{country}</span>
                  <span className="text-sm font-medium text-foreground">{count}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No data</p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
