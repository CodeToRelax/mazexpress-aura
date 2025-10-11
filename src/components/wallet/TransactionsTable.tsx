import { format } from 'date-fns';
import { MoreVertical, Pencil, Trash2, ArrowDownCircle, ArrowUpCircle, MinusCircle, RefreshCcw } from 'lucide-react';
import type { Transaction } from '@/types/wallet';
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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatLYD } from '@/utilities/helpers/currencyHelpers';

interface TransactionsTableProps {
  transactions: Transaction[];
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (transaction: Transaction) => void;
  isAdmin?: boolean;
}

export function TransactionsTable({
  transactions,
  onEdit,
  onDelete,
  isAdmin = true,
}: TransactionsTableProps) {
  const getTypeIcon = (type: string) => {
    const icons: Record<string, any> = {
      DEPOSIT: ArrowDownCircle,
      WITHDRAWAL: ArrowUpCircle,
      DEDUCTION: MinusCircle,
      REFUND: RefreshCcw,
    };
    const Icon = icons[type] || ArrowDownCircle;
    return <Icon className="h-4 w-4" />;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      DEPOSIT: 'text-green-600 dark:text-green-400',
      WITHDRAWAL: 'text-orange-600 dark:text-orange-400',
      DEDUCTION: 'text-red-600 dark:text-red-400',
      REFUND: 'text-blue-600 dark:text-blue-400',
    };
    return colors[type] || 'text-foreground';
  };

  const getTypeVariant = (type: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      DEPOSIT: 'default',
      WITHDRAWAL: 'secondary',
      DEDUCTION: 'destructive',
      REFUND: 'default',
    };
    return variants[type] || 'default';
  };

  const getStatusVariant = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      COMPLETED: 'default',
      PENDING: 'secondary',
      FAILED: 'destructive',
    };
    return variants[status] || 'secondary';
  };

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]"></TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Status</TableHead>
            {isAdmin && <TableHead className="w-[70px]">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={isAdmin ? 7 : 6} className="text-center py-8 text-muted-foreground">
                No transactions found
              </TableCell>
            </TableRow>
          ) : (
            transactions.map((transaction) => (
              <TableRow key={transaction._id}>
                <TableCell>
                  <div className={getTypeColor(transaction.type)}>
                    {getTypeIcon(transaction.type)}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getTypeVariant(transaction.type)}>
                    {transaction.type}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-[200px]">
                  <div className="space-y-1">
                    <p className="text-sm font-medium truncate">{transaction.description}</p>
                    {transaction.reference && (
                      <p className="text-xs text-muted-foreground font-mono">
                        Ref: {transaction.reference}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  {format(new Date(transaction.createdAt), 'MMM dd, yyyy')}
                  <br />
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(transaction.createdAt), 'HH:mm')}
                  </span>
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {formatLYD(transaction.amount)}
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(transaction.status)}>
                    {transaction.status}
                  </Badge>
                </TableCell>
                {isAdmin && (
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit?.(transaction)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => onDelete?.(transaction)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
