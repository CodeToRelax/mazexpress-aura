import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowUpDown,
  MoreVertical,
  Edit,
  XCircle,
  Eye,
  Trash2,
  Printer,
  Download,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';
import { format, isPast } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Invoice, InvoiceStatus } from '@/types/invoice';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatLYD } from '@/utilities/helpers/currencyHelpers';
import { InvoiceStatusBadge } from './InvoiceStatusBadge';

interface InvoicesTableProps {
  invoices: Invoice[];
  selectedInvoices?: Set<string>;
  onSelectInvoice?: (invoiceId: string, selected: boolean) => void;
  onSelectAll?: (selected: boolean) => void;
  onMakePayment?: (invoice: Invoice) => void;
  onUpdateStatus?: (invoice: Invoice) => void;
  onVoid?: (invoice: Invoice) => void;
  onEdit?: (invoice: Invoice) => void;
  onDelete?: (invoice: Invoice) => void;
  onPrint?: (invoice: Invoice) => void;
  onDownloadPDF?: (invoice: Invoice) => void;
  isAdmin?: boolean;
  visibleColumns: Set<string>;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (column: string) => void;
  onRowClick?: (invoice: Invoice) => void;
}

export function InvoicesTable({
  invoices,
  selectedInvoices = new Set(),
  onSelectInvoice,
  onSelectAll,
  onMakePayment,
  onUpdateStatus,
  onVoid,
  onEdit,
  onDelete,
  onPrint,
  onDownloadPDF,
  isAdmin = false,
  visibleColumns,
  sortBy,
  sortOrder,
  onSort,
  onRowClick,
}: InvoicesTableProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const allSelected = invoices.length > 0 && invoices.every(inv => selectedInvoices.has(inv._id));
  const someSelected = invoices.some(inv => selectedInvoices.has(inv._id)) && !allSelected;

  const handleRowClick = (invoice: Invoice, e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    if (onRowClick) {
      onRowClick(invoice);
    } else {
      navigate(`/invoices/${invoice._id}`);
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
  
  const getUniqueShippingNumber = (userId: Invoice['userId']): string => {
    if (typeof userId === 'object' && userId !== null) {
      return userId.uniqueShippingNumber || 'N/A';
    }
    return 'N/A';
  };
  
  const isOverdue = (dueDate: string, status: InvoiceStatus): boolean => {
    return isPast(new Date(dueDate)) && status !== 'PAID' && status !== 'VOID';
  };

  if (invoices.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{t('invoice.empty-title')}</p>
        <p className="text-sm text-muted-foreground mt-2">{t('invoice.empty-description')}</p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            {isAdmin && onSelectAll && (
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={(checked) => onSelectAll(!!checked)}
                  aria-label={t('common.selectAll')}
                  className={cn(someSelected && "data-[state=checked]:bg-primary/50")}
                />
              </TableHead>
            )}
            
            <TableHead className="w-[150px]">{t('invoice.table-invoiceNumber')}</TableHead>
            
            {visibleColumns.has('user') && (
              <TableHead className="min-w-[200px]">{t('invoice.table-user')}</TableHead>
            )}
            
            {visibleColumns.has('shippingNumber') && (
              <TableHead>{t('invoice.table-shippingNumber')}</TableHead>
            )}
            
            {visibleColumns.has('issueDate') && (
              <TableHead>
                {t('invoice.table-issueDate')}
                {renderSortIcon('issueDate')}
              </TableHead>
            )}
            
            {visibleColumns.has('dueDate') && (
              <TableHead>
                {t('invoice.table-dueDate')}
                {renderSortIcon('dueDate')}
              </TableHead>
            )}
            
            {visibleColumns.has('status') && (
              <TableHead>
                {t('invoice.table-status')}
                {renderSortIcon('status')}
              </TableHead>
            )}
            
            {visibleColumns.has('netAmount') && (
              <TableHead className="text-right">{t('invoice.table-netAmount')}</TableHead>
            )}
            
            {visibleColumns.has('taxAmount') && (
              <TableHead className="text-right">{t('invoice.table-taxAmount')}</TableHead>
            )}
            
            {visibleColumns.has('grossAmount') && (
              <TableHead className="text-right">
                {t('invoice.table-grossAmount')}
                {renderSortIcon('totals.gross')}
              </TableHead>
            )}
            
            {visibleColumns.has('paidAmount') && (
              <TableHead className="text-right">{t('invoice.table-paidAmount')}</TableHead>
            )}
            
            {visibleColumns.has('dueAmount') && (
              <TableHead className="text-right">
                {t('invoice.table-dueAmount')}
                {renderSortIcon('totals.due')}
              </TableHead>
            )}
            
            {visibleColumns.has('itemsCount') && (
              <TableHead className="text-center">{t('invoice.table-itemsCount')}</TableHead>
            )}
            
            {isAdmin && <TableHead className="w-[50px]" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => {
            const overdue = isOverdue(invoice.dueDate, invoice.status);
            
            return (
              <TableRow 
                key={invoice._id}
                className={cn(
                  "cursor-pointer hover:bg-muted/50 transition-colors",
                  overdue && "bg-destructive/5 hover:bg-destructive/10"
                )}
                onClick={(e) => handleRowClick(invoice, e)}
              >
                {isAdmin && onSelectInvoice && (
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedInvoices.has(invoice._id)}
                      onCheckedChange={(checked) => onSelectInvoice(invoice._id, !!checked)}
                      aria-label={`Select invoice ${invoice.invoiceNumber}`}
                    />
                  </TableCell>
                )}
                
                <TableCell className="font-mono text-xs">
                  {invoice.invoiceNumber || (
                    <Badge variant="secondary" className="font-normal">
                      {t('invoice.status.DRAFT')}
                    </Badge>
                  )}
                </TableCell>
                
                {visibleColumns.has('user') && (
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{getUserDisplay(invoice.userId)}</span>
                      <span className="text-xs text-muted-foreground">{getUserEmail(invoice.userId)}</span>
                    </div>
                  </TableCell>
                )}
                
                {visibleColumns.has('shippingNumber') && (
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs">
                      {getUniqueShippingNumber(invoice.userId)}
                    </Badge>
                  </TableCell>
                )}
                
                {visibleColumns.has('issueDate') && (
                  <TableCell>
                    {invoice.issueDate ? format(new Date(invoice.issueDate), 'MMM dd, yyyy') : '-'}
                  </TableCell>
                )}
                
                {visibleColumns.has('dueDate') && (
                  <TableCell>
                    <div className={cn(
                      "flex items-center gap-2",
                      overdue && "text-destructive font-medium"
                    )}>
                      {format(new Date(invoice.dueDate), 'MMM dd, yyyy')}
                      {overdue && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          {t('invoice.status.overdue')}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                )}
                
                {visibleColumns.has('status') && (
                  <TableCell>
                    <InvoiceStatusBadge status={invoice.status} />
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
                    {invoice.totals.paid > 0 ? formatLYD(invoice.totals.paid) : '-'}
                  </TableCell>
                )}
                
                {visibleColumns.has('dueAmount') && (
                  <TableCell className="text-right text-red-600 dark:text-red-400 font-semibold">
                    {invoice.totals.due > 0 ? formatLYD(invoice.totals.due) : '-'}
                  </TableCell>
                )}
                
                {visibleColumns.has('itemsCount') && (
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="font-mono">
                      {invoice.items?.length || 0}
                    </Badge>
                  </TableCell>
                )}
                
                {isAdmin && (
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-background w-48">
                        <DropdownMenuItem 
                          onClick={() => navigate(`/invoices/${invoice._id}`)}
                          className="cursor-pointer"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          {t('invoice.actions.view')}
                        </DropdownMenuItem>
                        
                        {onEdit && (
                          <DropdownMenuItem 
                            onClick={() => onEdit(invoice)}
                            className="cursor-pointer"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            {t('invoice.actions.edit')}
                          </DropdownMenuItem>
                        )}
                        
                        {onDownloadPDF && (
                          <DropdownMenuItem 
                            onClick={() => onDownloadPDF(invoice)}
                            className="cursor-pointer"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            {t('invoice.actions.downloadPDF')}
                          </DropdownMenuItem>
                        )}
                        
                        {onPrint && (
                          <DropdownMenuItem 
                            onClick={() => onPrint(invoice)}
                            className="cursor-pointer"
                          >
                            <Printer className="h-4 w-4 mr-2" />
                            {t('invoice.actions.print')}
                          </DropdownMenuItem>
                        )}
                        
                        <DropdownMenuSeparator />
                        
                        {onMakePayment && invoice.status !== 'PAID' && invoice.status !== 'VOID' && invoice.totals.due > 0 && (
                          <DropdownMenuItem 
                            onClick={() => onMakePayment(invoice)}
                            className="cursor-pointer"
                          >
                            <DollarSign className="h-4 w-4 mr-2" />
                            {t('invoice.actions.makePayment')}
                          </DropdownMenuItem>
                        )}
                        
                        {onUpdateStatus && (
                          <DropdownMenuItem 
                            onClick={() => onUpdateStatus(invoice)}
                            className="cursor-pointer"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            {t('invoice.actions.updateStatus')}
                          </DropdownMenuItem>
                        )}
                        
                        {onVoid && invoice.status !== 'VOID' && (
                          <DropdownMenuItem 
                            onClick={() => onVoid(invoice)}
                            className="cursor-pointer"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            {t('invoice.actions.void')}
                          </DropdownMenuItem>
                        )}
                        
                        {onDelete && invoice.status !== 'PAID' && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => onDelete(invoice)}
                              className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              {t('invoice.actions.delete')}
                            </DropdownMenuItem>
                          </>
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
