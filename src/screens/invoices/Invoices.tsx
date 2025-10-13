import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Receipt, RotateCw, Download, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import type { InvoiceFilters, Invoice } from '@/types/invoice';
import { getAllInvoices } from '@/utilities/api/invoice.api';
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
  const navigate = useNavigate();
  const { hasFlag } = useACL();
  
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    totalDocs: 0,
    limit: 10,
    totalPages: 0,
    currentPage: 1,
    hasPrevPage: false,
    hasNextPage: false,
    nextPage: null as number | null,
    prevPage: null as number | null,
  });
  
  // Initialize from localStorage
  const [filters, setFilters] = useState<InvoiceFilters>(() => {
    try {
      const savedFilters = localStorage.getItem(STORAGE_KEYS.FILTERS);
      const savedLimit = localStorage.getItem(STORAGE_KEYS.TABLE_LIMIT);
      const parsedFilters = savedFilters ? JSON.parse(savedFilters) : {};
      
      return {
        page: 1,
        limit: savedLimit ? parseInt(savedLimit) : 10,
        sortBy: parsedFilters.sortBy || 'createdAt',
        sortOrder: parsedFilters.sortOrder || 'desc',
        status: parsedFilters.status,
        from: parsedFilters.from,
        to: parsedFilters.to,
      };
    } catch {
      return {
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
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
    return new Set(['user', 'issueDate', 'dueDate', 'status', 'grossAmount', 'paidAmount', 'dueAmount']);
  });

  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [invoiceToMarkAsPaid, setInvoiceToMarkAsPaid] = useState<Invoice | null>(null);
  const [invoiceToVoid, setInvoiceToVoid] = useState<Invoice | null>(null);
  const [invoiceToUpdateStatus, setInvoiceToUpdateStatus] = useState<Invoice | null>(null);

  // Calculate stats from invoices
  const invoiceStats = {
    totalInvoices: pagination.totalDocs,
    draftCount: invoices.filter(i => i.status === 'DRAFT').length,
    sentCount: invoices.filter(i => i.status === 'SENT').length,
    pendingCount: invoices.filter(i => ['PENDING', 'OVERDUE'].includes(i.status)).length,
    partiallyPaidCount: invoices.filter(i => i.status === 'PARTIALLY_PAID').length,
    paidCount: invoices.filter(i => i.status === 'PAID').length,
    totalGrossAmount: invoices.reduce((sum, i) => sum + i.totals.gross, 0),
    totalDueAmount: invoices.reduce((sum, i) => sum + i.totals.due, 0),
  };

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAllInvoices(filters, i18n.language);
      setInvoices(response.docs);
      setPagination({
        totalDocs: response.totalDocs,
        limit: response.limit,
        totalPages: response.totalPages,
        currentPage: response.page,
        hasPrevPage: response.hasPrevPage,
        hasNextPage: response.hasNextPage,
        nextPage: response.hasNextPage ? response.page + 1 : null,
        prevPage: response.hasPrevPage ? response.page - 1 : null,
      });
    } catch (error) {
      toast({
        title: t('errors.error'),
        description: error instanceof Error ? error.message : 'Failed to load invoices',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [filters, i18n.language, t]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // Persist filters to localStorage
  useEffect(() => {
    try {
      const { page, search, limit, ...persistableFilters } = filters;
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
    setFilters({ ...newFilters, page: 1 });
  };

  const handleClearFilters = () => {
    setFilters({
      page: 1,
      limit: filters.limit,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  };

  const handleStatClick = (filterType: string) => {
    if (filterType === 'all') {
      handleClearFilters();
    } else if (filterType === 'draft') {
      setFilters({ ...filters, status: 'DRAFT', page: 1 });
    } else if (filterType === 'sent') {
      setFilters({ ...filters, status: 'SENT', page: 1 });
    } else if (filterType === 'pending') {
      setFilters({ ...filters, status: 'PENDING', page: 1 });
    } else if (filterType === 'partiallyPaid') {
      setFilters({ ...filters, status: 'PARTIALLY_PAID', page: 1 });
    } else if (filterType === 'paid') {
      setFilters({ ...filters, status: 'PAID', page: 1 });
    }
  };

  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page });
  };

  const handleLimitChange = (limit: number) => {
    setFilters({ ...filters, limit, page: 1 });
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
    setVisibleColumns(new Set(['user', 'issueDate', 'dueDate', 'status', 'grossAmount', 'paidAmount', 'dueAmount']));
  };

  const handleSort = (column: string) => {
    const columnMap: Record<string, string> = {
      invoiceNumber: 'invoiceNumber',
      issueDate: 'issueDate',
      dueDate: 'dueDate',
      status: 'status',
      createdAt: 'createdAt',
    };

    const apiColumn = columnMap[column];
    if (!apiColumn) return;

    setFilters(prev => {
      if (prev.sortBy === apiColumn) {
        return {
          ...prev,
          sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc',
        };
      }
      return {
        ...prev,
        sortBy: apiColumn,
        sortOrder: 'asc',
      };
    });
  };

  const handleRowClick = (invoice: Invoice) => {
    navigate(`/invoices/${invoice._id}`);
  };

  const handleMarkAsPaid = (invoice: Invoice) => {
    setInvoiceToMarkAsPaid(invoice);
  };

  const handleUpdateStatus = (invoice: Invoice) => {
    setInvoiceToUpdateStatus(invoice);
  };

  const handleVoid = (invoice: Invoice) => {
    setInvoiceToVoid(invoice);
  };

  const handleExportCSV = async () => {
    try {
      await exportInvoicesToCSV(filters, i18n.language);
      toast({
        title: 'Export successful',
      });
    } catch (error) {
      toast({
        title: 'Export failed',
        description: error instanceof Error ? error.message : 'Failed to export',
        variant: 'destructive',
      });
    }
  };

  const handleSuccess = () => {
    fetchInvoices();
  };

  const activeFilterCount = Object.entries(filters).filter(
    ([key, value]) => 
      value !== undefined && 
      value !== null && 
      value !== '' && 
      !['page', 'limit', 'sortBy', 'sortOrder'].includes(key)
  ).length;

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
                {t('invoice.subtitle')}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={handleExportCSV}
            >
              <Download className="h-4 w-4" />
              {t('invoice.actions.export')}
            </Button>
            {hasFlag('canCreateInvoices') && (
              <Button className="gap-2" onClick={() => setShowGenerateDialog(true)}>
                <Plus className="h-4 w-4" />
                {t('invoice.actions.generate')}
              </Button>
            )}
          </div>
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
            onClick={fetchInvoices}
          >
            <RotateCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <InvoicesTable
              invoices={invoices}
              visibleColumns={visibleColumns}
              sortBy={filters.sortBy}
              sortOrder={filters.sortOrder}
              onSort={handleSort}
              onRowClick={handleRowClick}
              onMarkAsPaid={handleMarkAsPaid}
              onUpdateStatus={handleUpdateStatus}
              onVoid={handleVoid}
              isAdmin={hasFlag('canManageInvoices')}
            />
          )}
        </motion.div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <InvoicesPagination
              pagination={pagination}
              onPageChange={handlePageChange}
              onLimitChange={handleLimitChange}
            />
          </motion.div>
        )}
      </motion.div>

      {/* Dialogs */}
      <GenerateInvoiceDialog
        open={showGenerateDialog}
        onOpenChange={setShowGenerateDialog}
        onSuccess={handleSuccess}
      />

      {invoiceToMarkAsPaid && (
        <MarkAsPaidDialog
          invoice={invoiceToMarkAsPaid}
          open={!!invoiceToMarkAsPaid}
          onOpenChange={(open) => !open && setInvoiceToMarkAsPaid(null)}
          onSuccess={handleSuccess}
        />
      )}

      {invoiceToUpdateStatus && (
        <UpdateStatusDialog
          invoice={invoiceToUpdateStatus}
          open={!!invoiceToUpdateStatus}
          onOpenChange={(open) => !open && setInvoiceToUpdateStatus(null)}
          onSuccess={handleSuccess}
        />
      )}

      {invoiceToVoid && (
        <CancelInvoiceDialog
          invoice={invoiceToVoid}
          open={!!invoiceToVoid}
          onOpenChange={(open) => !open && setInvoiceToVoid(null)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
