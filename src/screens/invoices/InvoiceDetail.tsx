import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, CheckCircle, XCircle, Edit, Package, Scale, Box, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getInvoiceById } from '@/utilities/api/invoice.api';
import { PageLoader } from '@/components/feedback/PageLoader';
import { InlineError } from '@/components/feedback/InlineError';
import { PaymentDialog } from './PaymentDialog';
import { MarkAsPaidDialog } from './MarkAsPaidDialog';
import { CancelInvoiceDialog } from './CancelInvoiceDialog';
import { UpdateStatusDialog } from './UpdateStatusDialog';
import { PaymentHistory } from './PaymentHistory';
import { ACLGuard } from '@/components/guards/ACLGuard';
import { useACL } from '@/hooks/useACL';
import { format } from 'date-fns';
import { parseInvoiceItemDescription, formatCurrency } from '@/utilities/helpers/invoiceHelpers';

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { hasFlag, acl } = useACL();
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [markPaidOpen, setMarkPaidOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [updateStatusOpen, setUpdateStatusOpen] = useState(false);

  const { data: invoice, isLoading, error } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => getInvoiceById(id!, i18n.language),
    enabled: !!id,
  });

  const formatCurrencyAmount = (amountInCents: number | undefined) => {
    if (amountInCents === undefined || amountInCents === null || isNaN(amountInCents)) {
      return '0.00';
    }
    return formatCurrency(amountInCents / 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'PENDING':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'SENT':
        return 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20';
      case 'PARTIALLY_PAID':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'OVERDUE':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'VOID':
        return 'bg-muted text-muted-foreground border-muted';
      case 'REFUNDED':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'DISPUTED':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'DRAFT':
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      case 'FAILED':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-muted text-muted-foreground border-muted';
    }
  };

  if (isLoading) return <PageLoader />;
  if (error) return <InlineError message={error.message} />;
  if (!invoice) return <InlineError message={t('invoice.notFound')} />;

  const canPay = invoice.status === 'PENDING' || invoice.status === 'SENT' || invoice.status === 'OVERDUE';
  const canManageInvoices = hasFlag('canManageInvoices') || acl?.userType === 'admin';
  const canMarkAsPaid = canManageInvoices && (invoice.status === 'PENDING' || invoice.status === 'SENT' || invoice.status === 'OVERDUE');
  const canCancel = canManageInvoices && invoice.status !== 'VOID' && invoice.status !== 'PAID';
  
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/invoices')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">{invoice.invoiceNumber}</h1>
          <Badge className={getStatusColor(invoice.status)}>
            {t(`invoice.status.${invoice.status.toLowerCase()}`)}
          </Badge>
        </div>

        {canManageInvoices && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              {t('invoice.actions.print')}
            </Button>
            {canMarkAsPaid && (
              <Button variant="default" size="sm" onClick={() => setMarkPaidOpen(true)}>
                <CheckCircle className="h-4 w-4 mr-2" />
                {t('invoice.actions.markAsPaid')}
              </Button>
            )}
            {canCancel && (
              <Button variant="destructive" size="sm" onClick={() => setCancelOpen(true)}>
                <XCircle className="h-4 w-4 mr-2" />
                {t('invoice.actions.cancelInvoice')}
              </Button>
            )}
            {canManageInvoices && (
              <Button variant="outline" size="sm" onClick={() => setUpdateStatusOpen(true)}>
                <Edit className="h-4 w-4 mr-2" />
                {t('invoice.actions.updateStatus')}
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>{t('invoice.items')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invoice.items.map((item) => {
                const parsed = parseInvoiceItemDescription(item.description);
                
                return (
                  <div key={item._id} className="flex items-start justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                    <div className="flex-1 space-y-2">
                      {/* Shipment Code & Location */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {parsed.shipmentCode && (
                          <Badge variant="outline" className="font-mono text-xs">
                            <Package className="h-3 w-3 mr-1" />
                            {parsed.shipmentCode}
                          </Badge>
                        )}
                        {parsed.location && (
                          <span className="text-sm text-muted-foreground capitalize">
                            {parsed.location}
                          </span>
                        )}
                      </div>
                      
                      {/* Base Description */}
                      <p className="text-sm font-medium">{parsed.baseDescription}</p>
                      
                      {/* Weight & CBM */}
                      {(parsed.weight || parsed.cbm) && (
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          {parsed.weight && (
                            <span className="flex items-center gap-1">
                              <Scale className="h-3 w-3" />
                              Weight: {parsed.weight} kg
                            </span>
                          )}
                          {parsed.cbm && (
                            <span className="flex items-center gap-1">
                              <Box className="h-3 w-3" />
                              CBM: {parsed.cbm} m³
                            </span>
                          )}
                        </div>
                      )}
                      
                      {/* Shipment Link */}
                      {parsed.shipmentCode && item.shipmentId && (
                        <Button
                          variant="link"
                          size="sm"
                          className="p-0 h-auto text-xs"
                          onClick={() => navigate(`/shipments/${item.shipmentId}`)}
                        >
                          View Shipment Details
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
                      )}
                      
                      {/* Quantity & Unit Price */}
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>Qty: {item.quantity}</span>
                        <span>Unit Price: {formatCurrencyAmount(item.unitPrice)} LYD</span>
                      </div>
                    </div>
                    
                    {/* Total Amount */}
                    <div className="text-right">
                      <p className="font-semibold text-lg">
                        {formatCurrencyAmount(item.totalGross || item.totalNet || (item.quantity * item.unitPrice))} LYD
                      </p>
                      {item.taxAmount && item.taxAmount > 0 && (
                        <p className="text-xs text-muted-foreground">
                          (incl. {formatCurrencyAmount(item.taxAmount)} tax)
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <Separator className="my-6" />

            {/* Totals Summary Table */}
            <div className="bg-muted/30 rounded-lg p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('invoice.netAmount')}</span>
                <span className="font-medium">{formatCurrency(invoice.totals.net)} LYD</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('invoice.grossAmount')}</span>
                <span className="font-medium">{formatCurrency(invoice.totals.gross)} LYD</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('invoice.paidAmount')}</span>
                <span className="font-medium text-green-600 dark:text-green-400">{formatCurrency(invoice.totals.paid)} LYD</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-lg font-semibold">{t('invoice.dueAmount')}</span>
                <span className="text-xl font-bold text-red-600 dark:text-red-400">{formatCurrency(invoice.totals.due)} LYD</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('invoice.details')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">{t('invoice.createdAt')}</p>
                <p className="font-medium">{format(new Date(invoice.issueDate || invoice.createdAt), 'MMM dd, yyyy')}</p>
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
            </CardContent>
          </Card>

          {canPay && (
            <Button className="w-full" onClick={() => setPaymentOpen(true)}>
              {t('invoice.payNow')}
            </Button>
          )}
        </div>
      </div>

      {canManageInvoices && <PaymentHistory invoice={invoice} />}

      <PaymentDialog
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        invoice={invoice}
      />

      <MarkAsPaidDialog
        open={markPaidOpen}
        onOpenChange={setMarkPaidOpen}
        invoice={invoice}
      />

      <CancelInvoiceDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        invoice={invoice}
      />

      <UpdateStatusDialog
        open={updateStatusOpen}
        onOpenChange={setUpdateStatusOpen}
        invoice={invoice}
      />
    </div>
  );
}
