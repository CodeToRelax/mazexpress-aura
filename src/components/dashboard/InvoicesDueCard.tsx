import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { FileText, AlertCircle } from 'lucide-react';
import { analyticsApi } from '@/utilities/api/analytics.api';
import { StatCard } from './StatCard';
import { formatCurrency } from '@/utilities/helpers/currencyHelpers';

export function InvoicesDueCard() {
  const { t } = useTranslation();

  const { data, isLoading } = useQuery({
    queryKey: ['analytics', 'invoiceSummary'],
    queryFn: () => analyticsApi.getInvoiceSummary(),
  });

  return (
    <StatCard
      title={t('dashboard.cards.invoicesDue')}
      value={data?.unpaidInvoices ?? 0}
      subtitle={formatCurrency(data?.totalDueAmount ?? 0, data?.currency || 'USD')}
      icon={FileText}
      iconColor="text-amber-500"
      loading={isLoading}
    >
      {data && data.overdueInvoices > 0 && (
        <div className="mt-4 pt-4 border-t border-border/50">
          <div className="flex items-center gap-2 text-xs text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>{t('dashboard.cards.overdueCount', { count: data.overdueInvoices })}</span>
          </div>
        </div>
      )}
    </StatCard>
  );
}
