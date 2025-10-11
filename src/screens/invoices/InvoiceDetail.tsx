import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getInvoiceById } from '@/utilities/api/invoice.api';
import { PageLoader } from '@/components/feedback/PageLoader';
import { InlineError } from '@/components/feedback/InlineError';
import { PaymentDialog } from './PaymentDialog';
import { format } from 'date-fns';

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [paymentOpen, setPaymentOpen] = useState(false);

  const { data: invoice, isLoading, error } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => getInvoiceById(id!, i18n.language),
    enabled: !!id,
  });

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
  if (!invoice) return <InlineError message={t('invoice.notFound')} />;

  const canPay = invoice.status === 'UNPAID' || invoice.status === 'PARTIALLY_PAID';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/invoices')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold">{invoice.invoiceNumber}</h1>
        <Badge className={getStatusColor(invoice.status)}>
          {t(`invoice.status.${invoice.status.toLowerCase()}`)}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>{t('invoice.items')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invoice.items.map((item) => (
                <div key={item._id} className="flex justify-between items-start p-3 bg-muted/50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{item.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {t('invoice.quantity')}: {item.quantity} × {formatCurrency(item.unitPrice)} LYD
                    </p>
                  </div>
                  <p className="font-semibold">{formatCurrency(item.totalPrice)} LYD</p>
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('invoice.netAmount')}</span>
                <span>{formatCurrency(invoice.totals.net)} LYD</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('invoice.grossAmount')}</span>
                <span>{formatCurrency(invoice.totals.gross)} LYD</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('invoice.paidAmount')}</span>
                <span className="text-green-500">{formatCurrency(invoice.totals.paid)} LYD</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between text-lg font-bold">
                <span>{t('invoice.dueAmount')}</span>
                <span className="text-red-500">{formatCurrency(invoice.totals.due)} LYD</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('invoice.details')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">{t('invoice.createdAt')}</p>
                <p className="font-medium">{format(new Date(invoice.createdAt), 'MMM dd, yyyy')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('invoice.dueDate')}</p>
                <p className="font-medium">{format(new Date(invoice.dueDate), 'MMM dd, yyyy')}</p>
              </div>
              {invoice.closedAt && (
                <div>
                  <p className="text-sm text-muted-foreground">{t('invoice.closedAt')}</p>
                  <p className="font-medium">{format(new Date(invoice.closedAt), 'MMM dd, yyyy')}</p>
                </div>
              )}
              {invoice.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">{t('invoice.notes')}</p>
                  <p className="text-sm">{invoice.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {canPay && (
            <Button className="w-full" onClick={() => setPaymentOpen(true)}>
              {t('invoice.payNow')}
            </Button>
          )}
        </div>
      </div>

      <PaymentDialog
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        invoice={invoice}
      />
    </div>
  );
}
