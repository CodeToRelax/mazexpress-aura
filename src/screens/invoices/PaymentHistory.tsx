import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import type { Invoice } from '@/types/invoice';

interface PaymentHistoryProps {
  invoice: Invoice;
}

export function PaymentHistory({ invoice }: PaymentHistoryProps) {
  const { t } = useTranslation();

  const formatCurrency = (amountInCents: number) => {
    const amountInLYD = amountInCents / 100;
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amountInLYD);
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'WALLET':
        return <Badge variant="secondary">{t('invoice.paymentSource.wallet')}</Badge>;
      case 'CASH':
        return <Badge variant="outline">{t('invoice.paymentSource.cash')}</Badge>;
      case 'BANK_TRANSFER':
        return <Badge variant="outline">{t('invoice.paymentSource.bankTransfer')}</Badge>;
      default:
        return <Badge variant="outline">{source}</Badge>;
    }
  };

  // Extract payment allocations from invoice (if they exist)
  const paymentAllocations = (invoice as any).paymentAllocations || [];

  if (paymentAllocations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('invoice.paymentHistory.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            {t('invoice.paymentHistory.empty')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('invoice.paymentHistory.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {paymentAllocations.map((payment: any, index: number) => (
            <div key={payment._id || index}>
              {index > 0 && <Separator className="my-4" />}
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">
                      {formatCurrency(payment.amount)} LYD
                    </p>
                    {getSourceBadge(payment.source)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(payment.processedAt), 'MMM dd, yyyy HH:mm')}
                  </p>
                  {payment.description && (
                    <p className="text-sm text-muted-foreground">
                      {payment.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
