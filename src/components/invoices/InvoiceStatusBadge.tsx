import { cn } from '@/lib/utils';
import { 
  Edit, Send, Clock, DollarSign, CheckCircle2, 
  AlertCircle, Undo, AlertTriangle, XCircle, X 
} from 'lucide-react';
import type { InvoiceStatus } from '@/types/invoice';

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus;
  className?: string;
  showIcon?: boolean;
}

export function InvoiceStatusBadge({ status, className, showIcon = true }: InvoiceStatusBadgeProps) {
  const statusConfig: Record<InvoiceStatus, { label: string; color: string; icon: any }> = {
    DRAFT: { 
      label: 'Draft', 
      color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200 dark:border-gray-800',
      icon: Edit 
    },
    SENT: { 
      label: 'Sent', 
      color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
      icon: Send 
    },
    PENDING: { 
      label: 'Pending', 
      color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
      icon: Clock 
    },
    PARTIALLY_PAID: { 
      label: 'Partially Paid', 
      color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800',
      icon: DollarSign 
    },
    PAID: { 
      label: 'Paid', 
      color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
      icon: CheckCircle2 
    },
    OVERDUE: { 
      label: 'Overdue', 
      color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
      icon: AlertCircle 
    },
    REFUNDED: { 
      label: 'Refunded', 
      color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800',
      icon: Undo 
    },
    DISPUTED: { 
      label: 'Disputed', 
      color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
      icon: AlertTriangle 
    },
    VOID: { 
      label: 'Void', 
      color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200 dark:border-gray-800',
      icon: XCircle 
    },
    FAILED: { 
      label: 'Failed', 
      color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
      icon: X 
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border',
      config.color,
      className
    )}>
      {showIcon && <Icon className="h-3 w-3" />}
      {config.label}
    </span>
  );
}
