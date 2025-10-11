import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TransactionCard } from '@/components/wallet/TransactionCard';
import { getTransactions } from '@/utilities/api/wallet.api';
import { PageLoader } from '@/components/feedback/PageLoader';
import { InlineError } from '@/components/feedback/InlineError';
import type { TransactionFilters } from '@/types/wallet';

export default function Transactions() {
  const { t, i18n } = useTranslation();
  const [filters, setFilters] = useState<TransactionFilters>({
    page: 1,
    limit: 20,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['transactions', filters],
    queryFn: () => getTransactions(filters, i18n.language),
  });

  const handleFilterChange = (key: keyof TransactionFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  if (isLoading) return <PageLoader />;
  if (error) return <InlineError message={error.message} />;

  const transactions = data?.transactions || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1 };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t('wallet.transactions')}</h1>

      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-4 mb-6">
            <Select
              value={filters.type || 'all'}
              onValueChange={(value) => handleFilterChange('type', value === 'all' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('wallet.filter.type')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('wallet.filter.allTypes')}</SelectItem>
                <SelectItem value="DEPOSIT">{t('wallet.transaction.type.deposit')}</SelectItem>
                <SelectItem value="WITHDRAWAL">{t('wallet.transaction.type.withdrawal')}</SelectItem>
                <SelectItem value="DEDUCTION">{t('wallet.transaction.type.deduction')}</SelectItem>
                <SelectItem value="REFUND">{t('wallet.transaction.type.refund')}</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.status || 'all'}
              onValueChange={(value) => handleFilterChange('status', value === 'all' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('wallet.filter.status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('wallet.filter.allStatuses')}</SelectItem>
                <SelectItem value="PENDING">{t('wallet.transaction.status.pending')}</SelectItem>
                <SelectItem value="COMPLETED">{t('wallet.transaction.status.completed')}</SelectItem>
                <SelectItem value="FAILED">{t('wallet.transaction.status.failed')}</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              placeholder={t('wallet.filter.dateFrom')}
              value={filters.dateFrom || ''}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            />

            <Input
              type="date"
              placeholder={t('wallet.filter.dateTo')}
              value={filters.dateTo || ''}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            />
          </div>

          <div className="space-y-3">
            {transactions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {t('wallet.noTransactions')}
              </p>
            ) : (
              transactions.map((transaction) => (
                <TransactionCard key={transaction._id} transaction={transaction} />
              ))
            )}
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === 1}
                onClick={() => handlePageChange(pagination.page - 1)}
              >
                {t('common.previous')}
              </Button>
              <span className="flex items-center px-4 text-sm">
                {t('common.pageInfo', { current: pagination.page, total: pagination.totalPages })}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === pagination.totalPages}
                onClick={() => handlePageChange(pagination.page + 1)}
              >
                {t('common.next')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
