import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { DollarSign, Wallet, Building2, CreditCard, MoreHorizontal } from 'lucide-react';
import type { Invoice, PaymentSource } from '@/types/invoice';
import { formatCurrency } from '@/utilities/helpers/invoiceHelpers';

interface PaymentHistoryProps {
  invoice: Invoice;
}

export function PaymentHistory({ invoice }: PaymentHistoryProps) {
  const { t } = useTranslation();

  const getSourceIcon = (source: PaymentSource) => {
    switch (source) {
      case 'WALLET': return Wallet;
      case 'CASH': return DollarSign;
      case 'BANK_TRANSFER': return Building2;
      case 'CREDIT_CARD': return CreditCard;
      default: return MoreHorizontal;
    }
  };

  const getSourceBadge = (source: string) => {
    const Icon = getSourceIcon(source as PaymentSource);
    return (
      <Badge variant="outline" className="gap-1">
        <Icon className="h-3 w-3" />
        {t(`invoice.paymentSource.${source.toLowerCase()}`, source)}
      </Badge>
    );
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
              <div className="flex items-start justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex-1 space-y-2">
                  {/* Amount & Source */}
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-lg">
                      {formatCurrency(payment.amount / 100)} LYD
                    </p>
                    {getSourceBadge(payment.source)}
                  </div>
                  
                  {/* Date */}
                  <p className="text-sm text-muted-foreground">
                    Processed: {format(new Date(payment.happenedAt || payment.processedAt), 'PPp')}
                  </p>
                  
                  {/* Reference */}
                  {payment.reference && (
                    <p className="text-sm text-muted-foreground">
                      Reference: {payment.reference}
                    </p>
                  )}
                  
                  {/* Created By */}
                  {payment.createdBy && (
                    <p className="text-xs text-muted-foreground">
                      Created by: {payment.createdBy}
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
