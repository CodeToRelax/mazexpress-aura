import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Receipt, RotateCw, Download, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { PageLoader } from '@/components/feedback/PageLoader';
import { InlineError } from '@/components/feedback/InlineError';
import type { InvoiceFilters, Invoice } from '@/types/invoice';
import { getInvoices } from '@/utilities/api/invoice.api';
import { InvoicesTable } from '@/components/invoices/InvoicesTable';
import { InvoicesFilters } from './InvoicesFilters';
import { InvoicesPagination } from './InvoicesPagination';
import { InvoicesStatsBar } from './InvoicesStatsBar';
import { InvoicesColumnVisibilityToggle } from './InvoicesColumnVisibilityToggle';
import { GenerateInvoiceDialog } from './GenerateInvoiceDialog';
import { MarkAsPaidDialog } from './MarkAsPaidDialog';
import { CancelInvoiceDialog } from './CancelInvoiceDialog';
import { UpdateStatusDialog } from './UpdateStatusDialog';
import { exportInvoicesToCSV } from '@/utilities/helpers/invoiceExport';
import { useACL } from '@/hooks/useACL';

// localStorage keys
const STORAGE_KEYS = {
  VISIBLE_COLUMNS: 'invoices-visible-columns',
  FILTERS: 'invoices-filters',
  TABLE_LIMIT: 'invoices-table-limit',
};

export default function Invoices() {
  const { t, i18n } = useTranslation();
  const { hasPermission } = useACL();
  
  // Initialize from localStorage
  const [filters, setFilters] = useState<InvoiceFilters>(() => {
    try {
      const savedFilters = localStorage.getItem(STORAGE_KEYS.FILTERS);
      const savedLimit = localStorage.getItem(STORAGE_KEYS.TABLE_LIMIT);
      const parsedFilters = savedFilters ? JSON.parse(savedFilters) : {};
      
      return {
        page: 1,
        limit: savedLimit ? parseInt(savedLimit) : 20,
        status: parsedFilters.status,
        from: parsedFilters.from,
        to: parsedFilters.to,
      };
    } catch {
      return {
        page: 1,
        limit: 20,
      };
    }
  });

  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.VISIBLE_COLUMNS);
      if (saved) {
        const parsed = JSON.parse(saved);
        return new Set(parsed);
      }
    } catch {}
    return new Set(['user', 'dueDate', 'status', 'grossAmount', 'paidAmount', 'dueAmount']);
  });

  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [invoiceToMarkAsPaid, setInvoiceToMarkAsPaid] = useState<Invoice | null>(null);
  const [invoiceToVoid, setInvoiceToVoid] = useState<Invoice | null>(null);
  const [invoiceToUpdateStatus, setInvoiceToUpdateStatus] = useState<Invoice | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['invoices', filters, i18n.language],
    queryFn: () => getInvoices(filters, i18n.language),
  });

  // Calculate stats from invoices
  const invoiceStats = {
    totalInvoices: data?.totalDocs || 0,
    draftCount: data?.docs?.filter(i => i.status === 'DRAFT').length || 0,
    sentCount: data?.docs?.filter(i => i.status === 'SENT').length || 0,
    pendingCount: data?.docs?.filter(i => ['PENDING', 'OVERDUE'].includes(i.status)).length || 0,
    partiallyPaidCount: data?.docs?.filter(i => i.status === 'PARTIALLY_PAID').length || 0,
    paidCount: data?.docs?.filter(i => i.status === 'PAID').length || 0,
    totalGrossAmount: data?.docs?.reduce((sum, i) => sum + i.totals.gross, 0) || 0,
    totalDueAmount: data?.docs?.reduce((sum, i) => sum + i.totals.due, 0) || 0,
  };

  // Persist filters to localStorage
  useEffect(() => {
    try {
      const { page, limit, ...persistableFilters } = filters;
      localStorage.setItem(STORAGE_KEYS.FILTERS, JSON.stringify(persistableFilters));
      if (limit) {
        localStorage.setItem(STORAGE_KEYS.TABLE_LIMIT, limit.toString());
      }
    } catch (err) {
      console.error('Failed to persist filters:', err);
    }
  }, [filters]);

  // Persist column visibility to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.VISIBLE_COLUMNS, JSON.stringify(Array.from(visibleColumns)));
    } catch (err) {
      console.error('Failed to persist column visibility:', err);
    }
  }, [visibleColumns]);

  const handleFiltersChange = (newFilters: InvoiceFilters) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({
      page: 1,
      limit: filters.limit,
    });
  };

  const handleStatClick = (filterType: 'all' | 'draft' | 'sent' | 'pending' | 'partiallyPaid' | 'paid') => {
    switch (filterType) {
      case 'all':
        setFilters({
          page: 1,
          limit: filters.limit,
        });
        break;
      case 'draft':
        setFilters({
          ...filters,
          status: 'DRAFT',
          page: 1,
        });
        break;
      case 'sent':
        setFilters({
          ...filters,
          status: 'SENT',
          page: 1,
        });
        break;
      case 'pending':
        setFilters({
          ...filters,
          status: 'PENDING',
          page: 1,
        });
        break;
      case 'partiallyPaid':
        setFilters({
          ...filters,
          status: 'PARTIALLY_PAID',
          page: 1,
        });
        break;
      case 'paid':
        setFilters({
          ...filters,
          status: 'PAID',
          page: 1,
        });
        break;
    }
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleLimitChange = (limit: number) => {
    setFilters(prev => ({ ...prev, limit, page: 1 }));
  };

  const handleToggleColumn = (column: string) => {
    setVisibleColumns(prev => {
      const next = new Set(prev);
      if (next.has(column)) {
        next.delete(column);
      } else {
        next.add(column);
      }
      return next;
    });
  };

  const handleResetColumns = () => {
    setVisibleColumns(new Set(['user', 'dueDate', 'status', 'grossAmount', 'paidAmount', 'dueAmount']));
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const handleExportCSV = async () => {
    try {
      toast({
        title: t('invoice.messages.exportingCSV'),
      });
      await exportInvoicesToCSV(filters, i18n.language);
      toast({
        title: t('invoice.messages.exportSuccess'),
      });
    } catch (error) {
      toast({
        title: t('invoice.messages.exportError'),
        description: error instanceof Error ? error.message : 'Failed to export',
        variant: 'destructive',
      });
    }
  };

  const handleMarkAsPaidSuccess = () => {
    setInvoiceToMarkAsPaid(null);
    refetch();
    toast({
      title: t('invoice.messages.markAsPaidSuccess'),
    });
  };

  const handleVoidSuccess = () => {
    setInvoiceToVoid(null);
    refetch();
    toast({
      title: t('invoice.messages.voidSuccess'),
    });
  };

  const handleUpdateStatusSuccess = () => {
    setInvoiceToUpdateStatus(null);
    refetch();
    toast({
      title: t('invoice.messages.updateSuccess'),
    });
  };

  const handleGenerateSuccess = () => {
    setShowGenerateDialog(false);
    refetch();
    toast({
      title: t('invoice.messages.generateSuccess'),
    });
  };

  const activeFilterCount = Object.entries(filters).filter(
    ([key, value]) => 
      value !== undefined && 
      value !== null && 
      value !== '' && 
      !['page', 'limit'].includes(key)
  ).length;

  const canManageInvoices = hasPermission('invoices', 'update');

  if (isLoading) return <PageLoader />;
  if (error) return <InlineError message={error.message} />;

  const invoices = data?.docs || [];
  const pagination = {
    currentPage: data?.page || 1,
    totalPages: data?.totalPages || 1,
    totalDocs: data?.totalDocs || 0,
    limit: data?.limit || 20,
    hasNextPage: data?.hasNextPage || false,
    hasPrevPage: data?.hasPrevPage || false,
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Receipt className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {t('invoice.title')}
              </h1>
              <p className="text-muted-foreground">
                {t('invoice.myInvoices')}
              </p>
            </div>
          </div>
          {canManageInvoices && (
            <Button onClick={() => setShowGenerateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t('invoice.actions.generate')}
            </Button>
          )}
        </div>

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mb-6"
        >
          <InvoicesStatsBar stats={invoiceStats} onStatClick={handleStatClick} />
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="space-y-4"
      >
        <div className="flex items-center gap-2 relative z-20">
          <div className="flex-1">
            <InvoicesFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onClearFilters={handleClearFilters}
              activeFilterCount={activeFilterCount}
            />
          </div>
          <InvoicesColumnVisibilityToggle
            visibleColumns={visibleColumns}
            onToggleColumn={handleToggleColumn}
            onReset={handleResetColumns}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleExportCSV}
            title={t('invoice.actions.exportCSV')}
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            title={t('invoice.actions.refresh')}
          >
            <RotateCw className="h-4 w-4" />
          </Button>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <InvoicesTable
            invoices={invoices}
            onMarkAsPaid={canManageInvoices ? setInvoiceToMarkAsPaid : undefined}
            onUpdateStatus={canManageInvoices ? setInvoiceToUpdateStatus : undefined}
            onVoid={canManageInvoices ? setInvoiceToVoid : undefined}
            isAdmin={canManageInvoices}
            visibleColumns={visibleColumns}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
          />
        </motion.div>

        {pagination.totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <InvoicesPagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              totalDocs={pagination.totalDocs}
              limit={pagination.limit}
              hasNextPage={pagination.hasNextPage}
              hasPrevPage={pagination.hasPrevPage}
              onPageChange={handlePageChange}
              onLimitChange={handleLimitChange}
            />
          </motion.div>
        )}
      </motion.div>

      {invoiceToMarkAsPaid && (
        <MarkAsPaidDialog
          invoice={invoiceToMarkAsPaid}
          open={!!invoiceToMarkAsPaid}
          onOpenChange={(open) => !open && setInvoiceToMarkAsPaid(null)}
          onSuccess={handleMarkAsPaidSuccess}
        />
      )}

      {invoiceToVoid && (
        <CancelInvoiceDialog
          invoice={invoiceToVoid}
          open={!!invoiceToVoid}
          onOpenChange={(open) => !open && setInvoiceToVoid(null)}
          onSuccess={handleVoidSuccess}
        />
      )}

      {invoiceToUpdateStatus && (
        <UpdateStatusDialog
          invoice={invoiceToUpdateStatus}
          open={!!invoiceToUpdateStatus}
          onOpenChange={(open) => !open && setInvoiceToUpdateStatus(null)}
          onSuccess={handleUpdateStatusSuccess}
        />
      )}
    </div>
  );
}
