import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { getInvoices } from '@/utilities/api/invoice.api';
import { PageLoader } from '@/components/feedback/PageLoader';
import { InlineError } from '@/components/feedback/InlineError';
import type { InvoiceFilters } from '@/types/invoice';
import { format } from 'date-fns';

export default function Invoices() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [filters, setFilters] = useState<InvoiceFilters>({
    page: 1,
    limit: 20,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['invoices', filters],
    queryFn: () => getInvoices(filters, i18n.language),
  });

  const handleFilterChange = (key: keyof InvoiceFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const formatCurrency = (amountInCents: number) => {
    const amountInLYD = amountInCents / 100;
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amountInLYD);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'UNPAID':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'PARTIALLY_PAID':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'OVERDUE':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'CANCELLED':
        return 'bg-muted text-muted-foreground border-muted';
      default:
        return 'bg-muted text-muted-foreground border-muted';
    }
  };

  if (isLoading) return <PageLoader />;
  if (error) return <InlineError message={error.message} />;

  const invoices = data?.docs || [];
  const pagination = {
    page: data?.page || 1,
    totalPages: data?.totalPages || 1,
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t('invoice.title')}</h1>

      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <Select
              value={filters.status || 'all'}
              onValueChange={(value) => handleFilterChange('status', value === 'all' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('invoice.filter.status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('invoice.filter.allStatuses')}</SelectItem>
                <SelectItem value="UNPAID">{t('invoice.status.unpaid')}</SelectItem>
                <SelectItem value="PARTIALLY_PAID">{t('invoice.status.partially_paid')}</SelectItem>
                <SelectItem value="PAID">{t('invoice.status.paid')}</SelectItem>
                <SelectItem value="OVERDUE">{t('invoice.status.overdue')}</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              placeholder={t('invoice.filter.dateFrom')}
              value={filters.dateFrom || ''}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            />

            <Input
              type="date"
              placeholder={t('invoice.filter.dateTo')}
              value={filters.dateTo || ''}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            />
          </div>

          <div className="space-y-3">
            {invoices.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {t('invoice.noInvoices')}
              </p>
            ) : (
              invoices.map((invoice) => (
                <Card
                  key={invoice._id}
                  className="cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => navigate(`/invoices/${invoice._id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-semibold">{invoice.invoiceNumber}</span>
                          <Badge className={getStatusColor(invoice.status)}>
                            {t(`invoice.status.${invoice.status.toLowerCase()}`)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {t('invoice.dueDate')}: {format(new Date(invoice.dueDate), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">{formatCurrency(invoice.totals.gross)} LYD</p>
                        {invoice.totals.due > 0 && (
                          <p className="text-sm text-red-500">
                            {t('invoice.due')}: {formatCurrency(invoice.totals.due)} LYD
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
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
