import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Receipt, FileText, Send, Clock, CheckCircle, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { formatLYDFromCents } from '@/utilities/helpers/currencyHelpers';

interface InvoiceStats {
  totalInvoices: number;
  draftCount: number;
  sentCount: number;
  pendingCount: number;
  partiallyPaidCount?: number;
  paidCount: number;
  totalGrossAmount: number;
  totalDueAmount: number;
}

interface InvoicesStatsBarProps {
  stats: InvoiceStats;
  onStatClick: (filterType: 'all' | 'draft' | 'sent' | 'pending' | 'partially_paid' | 'paid') => void;
}

export function InvoicesStatsBar({ stats, onStatClick }: InvoicesStatsBarProps) {
  const { t } = useTranslation();

  const statCards = [
    {
      label: t('invoice.stats-totalInvoices'),
      value: stats.totalInvoices,
      icon: Receipt,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      filterType: 'all' as const,
    },
    {
      label: t('invoice.stats-draft'),
      value: stats.draftCount,
      icon: FileText,
      color: 'text-gray-600 dark:text-gray-400',
      bgColor: 'bg-gray-100 dark:bg-gray-800',
      filterType: 'draft' as const,
    },
    {
      label: t('invoice.stats-sent'),
      value: stats.sentCount,
      icon: Send,
      color: 'text-cyan-600 dark:text-cyan-400',
      bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
      filterType: 'sent' as const,
    },
    {
      label: t('invoice.stats-pending'),
      value: stats.pendingCount,
      icon: Clock,
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
      filterType: 'pending' as const,
    },
    {
      label: t('invoice.stats-paid'),
      value: stats.paidCount,
      icon: CheckCircle,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      filterType: 'paid' as const,
    },
    {
      label: t('invoice.stats-totalDue'),
      value: formatLYDFromCents(stats.totalDueAmount),
      subValue: formatLYDFromCents(stats.totalGrossAmount),
      icon: TrendingUp,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      filterType: null,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <Card
              className={`p-4 cursor-pointer transition-all hover:shadow-md hover:scale-105 ${
                stat.filterType ? 'hover:border-primary' : 'cursor-default'
              }`}
              onClick={() => stat.filterType && onStatClick(stat.filterType)}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground truncate">{stat.label}</p>
                  <p className="text-lg font-bold text-foreground">{stat.value}</p>
                  {stat.subValue && (
                    <p className="text-xs text-muted-foreground">{stat.subValue}</p>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
