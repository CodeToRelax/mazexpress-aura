import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, CheckCircle, XCircle, Edit, Package, Scale, Box, ExternalLink, FileText, Loader2 } from 'lucide-react';
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
import { InvoiceStatusBadge } from '@/components/invoices/InvoiceStatusBadge';
import { InvoiceItemsTable } from '@/components/invoices/InvoiceItemsTable';

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
    <div className="relative z-10 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/invoices')}
            className="glass-card hover:shadow-glass-hover"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">
                {invoice.invoiceNumber}
              </h1>
              <InvoiceStatusBadge status={invoice.status} showIcon />
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          {canManageInvoices && (
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              {t('invoice.actions.print')}
            </Button>
          )}
          {canManageInvoices && invoice.status !== 'VOID' && (
            <Button variant="outline" onClick={() => setUpdateStatusOpen(true)}>
              <Edit className="h-4 w-4 mr-2" />
              {t('invoice.actions.updateStatus')}
            </Button>
          )}
          {canCancel && (
            <Button 
              variant="destructive" 
              size="icon"
              onClick={() => setCancelOpen(true)}
            >
              <XCircle className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Invoice Items */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            {t('invoice.items.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <InvoiceItemsTable items={invoice.items} />
        </CardContent>
      </Card>

      {/* Payment History */}
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
