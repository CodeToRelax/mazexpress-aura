import { ArrowDownCircle, ArrowUpCircle, MinusCircle, RefreshCcw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Transaction } from '@/types/wallet';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';

interface TransactionCardProps {
  transaction: Transaction;
  onClick?: () => void;
  className?: string;
}

export function TransactionCard({ transaction, onClick, className = '' }: TransactionCardProps) {
  const { t } = useTranslation();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getTypeIcon = () => {
    switch (transaction.type) {
      case 'deposit':
        return <ArrowDownCircle className="h-5 w-5 text-green-500" />;
      case 'withdrawal':
        return <ArrowUpCircle className="h-5 w-5 text-red-500" />;
      case 'deduction':
        return <MinusCircle className="h-5 w-5 text-orange-500" />;
      case 'refund':
        return <RefreshCcw className="h-5 w-5 text-blue-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = () => {
    const statusColors = {
      pending: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
      completed: 'bg-green-500/10 text-green-700 dark:text-green-400',
      failed: 'bg-red-500/10 text-red-700 dark:text-red-400',
    };

    return (
      <Badge variant="secondary" className={statusColors[transaction.status]}>
        {t(`wallet.transaction.status.${transaction.status}`)}
      </Badge>
    );
  };

  const getAmountColor = () => {
    switch (transaction.type) {
      case 'deposit':
      case 'refund':
        return 'text-green-600 dark:text-green-400';
      case 'withdrawal':
      case 'deduction':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-foreground';
    }
  };

  const getAmountSign = () => {
    return ['deposit', 'refund'].includes(transaction.type) ? '+' : '-';
  };

  return (
    <Card 
      className={`cursor-pointer transition-colors hover:bg-accent/50 ${className}`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex-shrink-0">
              {getTypeIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-medium text-sm">
                  {t(`wallet.transaction.type.${transaction.type}`)}
                </p>
                {getStatusBadge()}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {transaction.description}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {format(new Date(transaction.createdAt), 'MMM dd, yyyy HH:mm')}
              </p>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className={`font-semibold ${getAmountColor()}`}>
              {getAmountSign()}{formatCurrency(transaction.amount)}
            </p>
            <p className="text-xs text-muted-foreground">
              {typeof transaction.walletId === 'object' 
                ? transaction.walletId.currency 
                : 'LYD'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
