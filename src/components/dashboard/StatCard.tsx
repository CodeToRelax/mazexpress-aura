import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  loading?: boolean;
  className?: string;
  children?: React.ReactNode;
  headerAction?: React.ReactNode;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-primary',
  trend,
  loading = false,
  className,
  children,
  headerAction,
}: StatCardProps) {
  if (loading) {
    return (
      <div className={cn('glass-card rounded-2xl p-6', className)}>
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-4 w-24" />
          {headerAction && <Skeleton className="h-8 w-[120px]" />}
        </div>
        <Skeleton className="h-8 w-20 mb-2" />
        <Skeleton className="h-4 w-32" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn('glass-card rounded-2xl p-6', className)}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className={cn('p-2 rounded-lg bg-muted/50', iconColor)}>
              <Icon className="h-5 w-5" />
            </div>
          )}
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        </div>
        {headerAction}
      </div>

      <div className="space-y-1">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-foreground">{value}</span>
          {trend && (
            <span
              className={cn(
                'text-sm font-medium',
                trend.isPositive ? 'text-success' : 'text-destructive'
              )}
            >
              {trend.isPositive ? '+' : ''}
              {trend.value}%
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>

      {children}
    </motion.div>
  );
}
