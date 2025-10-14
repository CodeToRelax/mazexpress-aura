import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">{t('invoice.paymentHistory.amount')}</TableHead>
                <TableHead>{t('invoice.paymentHistory.method')}</TableHead>
                <TableHead>{t('invoice.paymentHistory.date')}</TableHead>
                <TableHead>{t('invoice.paymentHistory.reference')}</TableHead>
                <TableHead className="text-right">{t('invoice.paymentHistory.createdBy')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paymentAllocations.map((payment: any) => {
                const Icon = getSourceIcon(payment.source as PaymentSource);
                return (
                  <TableRow key={payment._id} className="hover:bg-muted/50">
                    <TableCell className="font-semibold">
                      {formatCurrency(payment.amount / 100)} LYD
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1.5">
                        <Icon className="h-3.5 w-3.5" />
                        {String(t(`invoice.paymentSource.${payment.source.toLowerCase()}`, { defaultValue: payment.source }))}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(payment.happenedAt || payment.processedAt), 'MMM dd, yyyy HH:mm')}
                    </TableCell>
                    <TableCell className="text-sm">
                      {payment.reference || '-'}
                    </TableCell>
                    <TableCell className="text-sm text-right text-muted-foreground">
                      {payment.createdBy || '-'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
