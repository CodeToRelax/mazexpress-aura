import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowUpDown,
  MoreVertical,
  Edit,
  XCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import type { Invoice } from '@/types/invoice';
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

interface InvoicesTableProps {
  invoices: Invoice[];
  onMarkAsPaid?: (invoice: Invoice) => void;
  onUpdateStatus?: (invoice: Invoice) => void;
  onVoid?: (invoice: Invoice) => void;
  isAdmin?: boolean;
  visibleColumns: Set<string>;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (column: string) => void;
  onRowClick?: (invoice: Invoice) => void;
}

export function InvoicesTable({ 
  invoices, 
  onMarkAsPaid, 
  onUpdateStatus,
  onVoid,
  isAdmin = false,
  visibleColumns,
  sortBy,
  sortOrder,
  onSort,
  onRowClick,
}: InvoicesTableProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleRowClick = (invoice: Invoice, e: React.MouseEvent) => {
    // Don't navigate if clicking on action buttons
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    if (onRowClick) {
      onRowClick(invoice);
    } else {
      navigate(`/invoices/${invoice._id}`);
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'PAID': return 'default';
      case 'SENT': return 'outline';
      case 'PENDING': return 'secondary';
      case 'PARTIALLY_PAID': return 'secondary';
      case 'OVERDUE': return 'destructive';
      case 'DRAFT': return 'outline';
      case 'VOID': return 'destructive';
      case 'FAILED': return 'destructive';
      case 'REFUNDED': return 'outline';
      case 'DISPUTED': return 'destructive';
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
        onClick={(e) => {
          e.stopPropagation();
          onSort(column);
        }}
      >
        <ArrowUpDown className={`h-4 w-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
      </Button>
    );
  };

  const getUserDisplay = (userId: Invoice['userId']) => {
    if (typeof userId === 'string') return '-';
    return `${userId.firstName} ${userId.lastName}`;
  };

  const getUserEmail = (userId: Invoice['userId']) => {
    if (typeof userId === 'string') return '';
    return userId.email;
  };

  if (invoices.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{t('invoice.empty.title')}</p>
        <p className="text-sm text-muted-foreground mt-2">{t('invoice.empty.description')}</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[150px]">{t('invoice.table.invoiceNumber')}</TableHead>
            {visibleColumns.has('user') && (
              <TableHead className="min-w-[200px]">{t('invoice.table.user')}</TableHead>
            )}
            {visibleColumns.has('issueDate') && (
              <TableHead>
                {t('invoice.table.issueDate')}
                {renderSortIcon('issueDate')}
              </TableHead>
            )}
            {visibleColumns.has('dueDate') && (
              <TableHead>
                {t('invoice.table.dueDate')}
                {renderSortIcon('dueDate')}
              </TableHead>
            )}
            {visibleColumns.has('status') && (
              <TableHead>
                {t('invoice.table.status')}
                {renderSortIcon('status')}
              </TableHead>
            )}
            {visibleColumns.has('netAmount') && (
              <TableHead className="text-right">{t('invoice.table.netAmount')}</TableHead>
            )}
            {visibleColumns.has('taxAmount') && (
              <TableHead className="text-right">{t('invoice.table.taxAmount')}</TableHead>
            )}
            {visibleColumns.has('grossAmount') && (
              <TableHead className="text-right">
                {t('invoice.table.grossAmount')}
                {renderSortIcon('totals.gross')}
              </TableHead>
            )}
            {visibleColumns.has('paidAmount') && (
              <TableHead className="text-right">{t('invoice.table.paidAmount')}</TableHead>
            )}
            {visibleColumns.has('dueAmount') && (
              <TableHead className="text-right">
                {t('invoice.table.dueAmount')}
                {renderSortIcon('totals.due')}
              </TableHead>
            )}
            {isAdmin && <TableHead className="w-[50px]" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow 
              key={invoice._id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={(e) => handleRowClick(invoice, e)}
            >
              <TableCell className="font-mono text-xs">
                {invoice.invoiceNumber}
              </TableCell>
              {visibleColumns.has('user') && (
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{getUserDisplay(invoice.userId)}</span>
                    <span className="text-xs text-muted-foreground">{getUserEmail(invoice.userId)}</span>
                  </div>
                </TableCell>
              )}
              {visibleColumns.has('issueDate') && (
                <TableCell>
                  {invoice.issueDate ? format(new Date(invoice.issueDate), 'MMM dd, yyyy') : '-'}
                </TableCell>
              )}
              {visibleColumns.has('dueDate') && (
                <TableCell>
                  {format(new Date(invoice.dueDate), 'MMM dd, yyyy')}
                </TableCell>
              )}
              {visibleColumns.has('status') && (
                <TableCell>
                  <Badge variant={getStatusVariant(invoice.status)}>
                    {invoice.status}
                  </Badge>
                </TableCell>
              )}
              {visibleColumns.has('netAmount') && (
                <TableCell className="text-right">
                  {formatLYD(invoice.totals.net)}
                </TableCell>
              )}
              {visibleColumns.has('taxAmount') && (
                <TableCell className="text-right">
                  {formatLYD(invoice.totals.tax)}
                </TableCell>
              )}
              {visibleColumns.has('grossAmount') && (
                <TableCell className="text-right font-semibold">
                  {formatLYD(invoice.totals.gross)}
                </TableCell>
              )}
              {visibleColumns.has('paidAmount') && (
                <TableCell className="text-right text-green-600 dark:text-green-400 font-semibold">
                  {formatLYD(invoice.totals.paid)}
                </TableCell>
              )}
              {visibleColumns.has('dueAmount') && (
                <TableCell className="text-right text-red-600 dark:text-red-400 font-semibold">
                  {formatLYD(invoice.totals.due)}
                </TableCell>
              )}
              {isAdmin && (onMarkAsPaid || onUpdateStatus || onVoid) && (
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-background">
                      {onMarkAsPaid && invoice.status !== 'PAID' && invoice.status !== 'VOID' && (
                        <DropdownMenuItem onClick={() => onMarkAsPaid(invoice)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Mark as Paid
                        </DropdownMenuItem>
                      )}
                      {onUpdateStatus && (
                        <DropdownMenuItem onClick={() => onUpdateStatus(invoice)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Update Status
                        </DropdownMenuItem>
                      )}
                      {onVoid && invoice.status !== 'VOID' && (
                        <DropdownMenuItem onClick={() => onVoid(invoice)}>
                          <XCircle className="h-4 w-4 mr-2" />
                          Void Invoice
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
