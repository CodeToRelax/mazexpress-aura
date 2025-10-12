import { useTranslation } from 'react-i18next';
import { 
  ArrowUp, 
  ArrowDown, 
  MinusCircle, 
  RefreshCcw,
  MoreVertical,
  Edit,
  Trash2,
  ArrowUpDown
} from 'lucide-react';
import { format } from 'date-fns';
import type { Transaction } from '@/types/wallet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatLYD } from '@/utilities/helpers/currencyHelpers';

interface TransactionsTableProps {
  transactions: Transaction[];
  onEdit?: (transaction: Transaction) => void;
  onRefund?: (transaction: Transaction) => void;
  isAdmin?: boolean;
  visibleColumns: Set<string>;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (column: string) => void;
}

export function TransactionsTable({ 
  transactions, 
  onEdit, 
  onRefund,
  isAdmin = false,
  visibleColumns,
  sortBy,
  sortOrder,
  onSort
}: TransactionsTableProps) {
  const { t } = useTranslation();

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'deposit': return ArrowUp;
      case 'withdrawal': return ArrowDown;
      case 'deduction': return MinusCircle;
      case 'refund': return RefreshCcw;
      default: return ArrowUp;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'deposit': return 'text-green-600 dark:text-green-400';
      case 'withdrawal': return 'text-red-600 dark:text-red-400';
      case 'deduction': return 'text-orange-600 dark:text-orange-400';
      case 'refund': return 'text-blue-600 dark:text-blue-400';
      default: return 'text-foreground';
    }
  };

  const getTypeVariant = (type: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (type.toLowerCase()) {
      case 'deposit': return 'default';
      case 'withdrawal': return 'destructive';
      case 'deduction': return 'secondary';
      case 'refund': return 'outline';
      default: return 'default';
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status.toLowerCase()) {
      case 'completed': return 'default';
      case 'pending': return 'secondary';
      case 'failed': return 'destructive';
      default: return 'outline';
    }
  };

  const renderSortIcon = (column: string) => {
    if (!onSort) return null;
    const isActive = sortBy === column;
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-8 px-2 ml-2"
        onClick={() => onSort(column)}
      >
        <ArrowUpDown className={`h-4 w-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
      </Button>
    );
  };

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{t('wallet.empty.title')}</p>
        <p className="text-sm text-muted-foreground mt-2">{t('wallet.empty.description')}</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[150px]">{t('wallet.transaction.transactionNumber')}</TableHead>
            {visibleColumns.has('type') && (
              <TableHead>
                {t('wallet.transaction.type')}
                {renderSortIcon('type')}
              </TableHead>
            )}
            {visibleColumns.has('description') && (
              <TableHead className="min-w-[200px]">{t('wallet.transaction.description')}</TableHead>
            )}
            {visibleColumns.has('date') && (
              <TableHead>
                {t('wallet.transaction.date')}
                {renderSortIcon('createdAt')}
              </TableHead>
            )}
            <TableHead className="text-right">
              {t('wallet.transaction.amount')}
              {renderSortIcon('amount')}
            </TableHead>
            {visibleColumns.has('status') && (
              <TableHead>
                {t('wallet.transaction.status')}
                {renderSortIcon('status')}
              </TableHead>
            )}
            {visibleColumns.has('reference') && (
              <TableHead>{t('wallet.transaction.reference')}</TableHead>
            )}
            {visibleColumns.has('balanceBefore') && (
              <TableHead className="text-right">{t('wallet.transaction.balanceBefore')}</TableHead>
            )}
            {visibleColumns.has('balanceAfter') && (
              <TableHead className="text-right">{t('wallet.transaction.balanceAfter')}</TableHead>
            )}
            {isAdmin && <TableHead className="w-[50px]" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => {
            const TypeIcon = getTypeIcon(transaction.type);
            return (
              <TableRow key={transaction._id}>
                <TableCell className="font-mono text-xs">
                  {transaction.transactionNumber}
                </TableCell>
                {visibleColumns.has('type') && (
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <TypeIcon className={`h-4 w-4 ${getTypeColor(transaction.type)}`} />
                      <Badge variant={getTypeVariant(transaction.type)}>
                        {t(`wallet.transaction.type.${transaction.type.toLowerCase()}`)}
                      </Badge>
                    </div>
                  </TableCell>
                )}
                {visibleColumns.has('description') && (
                  <TableCell className="max-w-[300px] truncate">
                    {transaction.description}
                  </TableCell>
                )}
                {visibleColumns.has('date') && (
                  <TableCell>
                    {format(new Date(transaction.createdAt), 'MMM dd, yyyy HH:mm')}
                  </TableCell>
                )}
                <TableCell className={`text-right font-semibold ${getTypeColor(transaction.type)}`}>
                  {transaction.type.toLowerCase() === 'withdrawal' || transaction.type.toLowerCase() === 'deduction' ? '-' : '+'}
                  {formatLYD(transaction.amount)}
                </TableCell>
                {visibleColumns.has('status') && (
                  <TableCell>
                    <Badge variant={getStatusVariant(transaction.status)}>
                      {t(`wallet.transaction.status.${transaction.status.toLowerCase()}`)}
                    </Badge>
                  </TableCell>
                )}
                {visibleColumns.has('reference') && (
                  <TableCell className="text-muted-foreground">
                    {transaction.reference || '-'}
                  </TableCell>
                )}
                {visibleColumns.has('balanceBefore') && (
                  <TableCell className="text-right text-muted-foreground">
                    {formatLYD(transaction.balanceBefore)}
                  </TableCell>
                )}
                {visibleColumns.has('balanceAfter') && (
                  <TableCell className="text-right text-muted-foreground">
                    {formatLYD(transaction.balanceAfter)}
                  </TableCell>
                )}
                {isAdmin && (onEdit || onRefund) && (
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-background">
                        {onEdit && (
                          <DropdownMenuItem onClick={() => onEdit(transaction)}>
                            <Edit className="h-4 w-4 mr-2" />
                            {t('common.edit')}
                          </DropdownMenuItem>
                        )}
                        {transaction.type.toLowerCase() === 'deduction' && onRefund && (
                          <DropdownMenuItem onClick={() => onRefund(transaction)}>
                            <RefreshCcw className="h-4 w-4 mr-2" />
                            Refund
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
