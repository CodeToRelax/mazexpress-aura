import { useTranslation } from 'react-i18next';
import { Package, Clock, Truck, CheckCircle2, PackageCheck, Ship, MapPin, XCircle, Undo2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useACL } from '@/hooks/useACL';
import type { ShipmentStats } from '@/types/shipment';

interface ShipmentsStatsBarProps {
  stats: ShipmentStats;
  onStatClick: (filterType: 'all' | 'pending' | 'in transit' | 'delivered' | 'received at warehouse' | 'shipped to destination' | 'ready for pick up' | 'cancelled' | 'returned') => void;
}

export function ShipmentsStatsBar({ stats, onStatClick }: ShipmentsStatsBarProps) {
  const { t } = useTranslation();
  const { accessibleStatuses, isSuperAdmin } = useACL();

  const fmtKg = (n: number) =>
    `${(n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 1 })} kg`;

  const statCards = [
    {
      icon: Package,
      label: t('shipments.stats.total', 'Total weight'),
      value: fmtKg(stats.total),
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      filterType: 'all' as const,
      status: null,
    },
    {
      icon: Clock,
      label: t('shipments.stats.pending', 'Pending weight'),
      value: fmtKg(stats.pending),
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      filterType: 'pending' as const,
      status: 'pending',
    },
    {
      icon: Truck,
      label: t('shipments.stats.inTransit', 'In transit weight'),
      value: fmtKg(stats.inTransit),
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-500/10',
      filterType: 'in transit' as const,
      status: 'in_transit',
    },
    {
      icon: CheckCircle2,
      label: t('shipments.stats.delivered', 'Delivered weight'),
      value: fmtKg(stats.delivered),
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-500/10',
      filterType: 'delivered' as const,
      status: 'delivered',
    },
    {
      icon: PackageCheck,
      label: t('shipments.stats.receivedAtWarehouse', 'Received weight'),
      value: fmtKg(stats.receivedAtWarehouse),
      color: 'text-cyan-600 dark:text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      filterType: 'received at warehouse' as const,
      status: 'received_at_warehouse',
    },
    {
      icon: Ship,
      label: t('shipments.stats.shippedToDestination', 'Shipped weight'),
      value: fmtKg(stats.shippedToDestination),
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-500/10',
      filterType: 'shipped to destination' as const,
      status: 'shipped_to_destination',
    },
    {
      icon: MapPin,
      label: t('shipments.stats.readyForPickUp', 'Ready for pickup weight'),
      value: fmtKg(stats.readyForPickUp),
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-500/10',
      filterType: 'ready for pick up' as const,
      status: 'ready_for_pick_up',
    },
    {
      icon: XCircle,
      label: t('shipments.stats.cancelled', 'Cancelled weight'),
      value: fmtKg(stats.cancelled),
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-500/10',
      filterType: 'cancelled' as const,
      status: 'cancelled',
    },
    {
      icon: Undo2,
      label: t('shipments.stats.returned', 'Returned weight'),
      value: fmtKg(stats.returned),
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-500/10',
      filterType: 'returned' as const,
      status: 'returned',
    },
  ];

  // Filter stat cards based on accessible statuses
  const visibleStatCards = isSuperAdmin 
    ? statCards 
    : statCards.filter(card => 
        card.status === null || accessibleStatuses.includes(card.status)
      );

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {visibleStatCards.map((stat, index) => (
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
