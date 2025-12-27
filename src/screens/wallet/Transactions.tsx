import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Receipt, RotateCw, Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { PageLoader } from '@/components/feedback/PageLoader';
import { InlineError } from '@/components/feedback/InlineError';
import type { TransactionFilters } from '@/types/wallet';
import { getTransactions } from '@/utilities/api/wallet.api';
import { TransactionsTable } from '@/components/wallet/TransactionsTable';
import { TransactionsFilters } from './TransactionsFilters';
import { TransactionsPagination } from './TransactionsPagination';
import { TransactionsStatsBar } from './TransactionsStatsBar';
import { TransactionsColumnVisibilityToggle } from './TransactionsColumnVisibilityToggle';
import { EditTransactionDialog } from '../users/EditTransactionDialog';
import { DeleteTransactionDialog } from '../users/DeleteTransactionDialog';
import { AccountStatementDialog } from './AccountStatementDialog';
import { exportTransactionsToCSV } from '@/utilities/helpers/transactionExport';
import type { Transaction } from '@/types/wallet';

// localStorage keys
const STORAGE_KEYS = {
  VISIBLE_COLUMNS: 'transactions-visible-columns',
  FILTERS: 'transactions-filters',
  TABLE_LIMIT: 'transactions-table-limit',
};

export default function Transactions() {
  const { t, i18n } = useTranslation();
  
  // Initialize from localStorage
  const [filters, setFilters] = useState<TransactionFilters>(() => {
    try {
      const savedFilters = localStorage.getItem(STORAGE_KEYS.FILTERS);
      const savedLimit = localStorage.getItem(STORAGE_KEYS.TABLE_LIMIT);
      const parsedFilters = savedFilters ? JSON.parse(savedFilters) : {};
      
      return {
        page: 1,
        limit: savedLimit ? parseInt(savedLimit) : 20,
        type: parsedFilters.type,
        status: parsedFilters.status,
        dateFrom: parsedFilters.dateFrom,
        dateTo: parsedFilters.dateTo,
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
    return new Set(['type', 'description', 'date', 'status']);
  });

  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [statementOpen, setStatementOpen] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['transactions', filters, i18n.language],
    queryFn: () => getTransactions(filters, i18n.language),
  });

  // Calculate stats from transactions
  const transactionStats = {
    totalTransactions: data?.pagination.totalItems || 0,
    totalDeposits: data?.transactions.filter(t => t.type.toLowerCase() === 'deposit').length || 0,
    totalWithdrawals: data?.transactions.filter(t => t.type.toLowerCase() === 'withdrawal').length || 0,
    totalRefunds: data?.transactions.filter(t => t.type.toLowerCase() === 'refund').length || 0,
    totalDeductions: data?.transactions.filter(t => t.type.toLowerCase() === 'deduction').length || 0,
    completedCount: data?.transactions.filter(t => t.status.toLowerCase() === 'completed').length || 0,
    depositAmount: data?.transactions
      .filter(t => t.type.toLowerCase() === 'deposit' && t.status.toLowerCase() === 'completed')
      .reduce((sum, t) => sum + t.amount, 0) || 0,
    withdrawalAmount: data?.transactions
      .filter(t => t.type.toLowerCase() === 'withdrawal' && t.status.toLowerCase() === 'completed')
      .reduce((sum, t) => sum + t.amount, 0) || 0,
    refundAmount: data?.transactions
      .filter(t => t.type.toLowerCase() === 'refund' && t.status.toLowerCase() === 'completed')
      .reduce((sum, t) => sum + t.amount, 0) || 0,
    deductionAmount: data?.transactions
      .filter(t => t.type.toLowerCase() === 'deduction' && t.status.toLowerCase() === 'completed')
      .reduce((sum, t) => sum + t.amount, 0) || 0,
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

  const handleFiltersChange = (newFilters: TransactionFilters) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({
      page: 1,
      limit: filters.limit,
    });
  };

  const handleStatClick = (filterType: 'all' | 'deposits' | 'withdrawals' | 'refunds' | 'deductions' | 'completed') => {
    switch (filterType) {
      case 'all':
        setFilters({
          page: 1,
          limit: filters.limit,
        });
        break;
      case 'deposits':
        setFilters({
          ...filters,
          type: 'deposit',
          page: 1,
        });
        break;
      case 'withdrawals':
        setFilters({
          ...filters,
          type: 'withdrawal',
          page: 1,
        });
        break;
      case 'refunds':
        setFilters({
          ...filters,
          type: 'refund',
          page: 1,
        });
        break;
      case 'deductions':
        setFilters({
          ...filters,
          type: 'deduction',
          page: 1,
        });
        break;
      case 'completed':
        setFilters({
          ...filters,
          status: 'completed',
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
    setVisibleColumns(new Set(['type', 'description', 'date', 'status']));
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setTransactionToEdit(transaction);
  };

  const handleDeleteTransaction = (transaction: Transaction) => {
    setTransactionToDelete(transaction);
  };

  const handleExportCSV = async () => {
    try {
      toast({
        title: t('wallet.messages.exportingCSV'),
      });
      await exportTransactionsToCSV(filters, i18n.language);
      toast({
        title: t('wallet.messages.exportSuccess'),
      });
    } catch (error) {
      toast({
        title: t('wallet.messages.exportError'),
        description: error instanceof Error ? error.message : 'Failed to export',
        variant: 'destructive',
      });
    }
  };

  const handleEditSuccess = () => {
    setTransactionToEdit(null);
    refetch();
    toast({
      title: t('wallet.messages.updateSuccess'),
    });
  };

  const handleDeleteSuccess = () => {
    setTransactionToDelete(null);
    refetch();
    toast({
      title: t('wallet.messages.deleteSuccess'),
    });
  };

  const activeFilterCount = Object.entries(filters).filter(
    ([key, value]) => 
      value !== undefined && 
      value !== null && 
      value !== '' && 
      !['page', 'limit'].includes(key)
  ).length;

  if (isLoading) return <PageLoader />;
  if (error) return <InlineError message={error.message} />;

  const transactions = data?.transactions || [];
  const pagination = {
    currentPage: data?.pagination.currentPage || 1,
    totalPages: data?.pagination.totalPages || 1,
    totalDocs: data?.pagination.totalItems || 0,
    limit: data?.pagination.itemsPerPage || 20,
    hasNextPage: data?.pagination.hasNextPage || false,
    hasPrevPage: data?.pagination.hasPrevPage || false,
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
                {t('wallet.transactions')}
              </h1>
              <p className="text-muted-foreground">
                {t('wallet.transactionHistory')}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mb-6"
        >
          <TransactionsStatsBar stats={transactionStats} onStatClick={handleStatClick} />
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
            <TransactionsFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onClearFilters={handleClearFilters}
              activeFilterCount={activeFilterCount}
            />
          </div>
          <TransactionsColumnVisibilityToggle
            visibleColumns={visibleColumns}
            onToggleColumn={handleToggleColumn}
            onReset={handleResetColumns}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setStatementOpen(true)}
            title={t('wallet.statement.button')}
          >
            <FileText className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleExportCSV}
            title={t('wallet.actions.exportCSV')}
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            title={t('wallet.actions.refresh')}
          >
            <RotateCw className="h-4 w-4" />
          </Button>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <TransactionsTable
            transactions={transactions}
            visibleColumns={visibleColumns}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
            isAdmin={false}
          />
        </motion.div>

        {pagination.totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <TransactionsPagination
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

      {transactionToEdit && (
        <EditTransactionDialog
          transaction={transactionToEdit}
          open={!!transactionToEdit}
          onClose={() => setTransactionToEdit(null)}
          onSuccess={handleEditSuccess}
        />
      )}

      {transactionToDelete && (
        <DeleteTransactionDialog
          transaction={transactionToDelete}
          open={!!transactionToDelete}
          onClose={() => setTransactionToDelete(null)}
          onSuccess={handleDeleteSuccess}
        />
      )}

      <AccountStatementDialog
        open={statementOpen}
        onOpenChange={setStatementOpen}
      />
    </div>
  );
}
