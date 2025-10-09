import { useTranslation } from 'react-i18next';
import { Package, Clock, Truck, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import type { ShipmentStats } from '@/types/shipment';

interface ShipmentsStatsBarProps {
  stats: ShipmentStats;
  onStatClick: (filterType: 'all' | 'pending' | 'in transit' | 'delivered') => void;
}

export function ShipmentsStatsBar({ stats, onStatClick }: ShipmentsStatsBarProps) {
  const { t } = useTranslation();

  const statCards = [
    {
      icon: Package,
      label: t('shipments.stats.total'),
      value: stats.total,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      filterType: 'all' as const,
    },
    {
      icon: Clock,
      label: t('shipments.stats.pending'),
      value: stats.pending,
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      filterType: 'pending' as const,
    },
    {
      icon: Truck,
      label: t('shipments.stats.inTransit'),
      value: stats.inTransit,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-500/10',
      filterType: 'in transit' as const,
    },
    {
      icon: CheckCircle2,
      label: t('shipments.stats.delivered'),
      value: stats.delivered,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-500/10',
      filterType: 'delivered' as const,
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
