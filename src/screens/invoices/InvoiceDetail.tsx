import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, XCircle, Edit, Package, FileText, Loader2, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getInvoiceById } from '@/utilities/api/invoice.api';
import { shipmentsApi } from '@/utilities/api/shipments.api';
import { ShipmentStatus } from '@/types/shipment';
import { InlineError } from '@/components/feedback/InlineError';
import { PaymentDialog } from './PaymentDialog';
import { CancelInvoiceDialog } from './CancelInvoiceDialog';
import { PaymentHistory } from './PaymentHistory';
import { useACL } from '@/hooks/useACL';
import { formatLYD } from '@/utilities/helpers/currencyHelpers';
import { InvoiceStatusBadge } from '@/components/invoices/InvoiceStatusBadge';
import { InvoiceItemsTable } from '@/components/invoices/InvoiceItemsTable';
import { generateInvoicePDF } from '@/utilities/helpers/invoicePDF';
import { printArabicInvoice } from '@/utilities/helpers/printInvoice';
import { toast } from '@/hooks/use-toast';

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasFlag, acl } = useACL();
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [updatingShipmentId, setUpdatingShipmentId] = useState<string | undefined>();

  const { data: invoice, isLoading, error } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => getInvoiceById(id!, i18n.language),
    enabled: !!id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ shipmentId, status }: { shipmentId: string; status: ShipmentStatus }) =>
      shipmentsApi.updateShipmentStatus(shipmentId, status),
    onSuccess: () => {
      toast({
        title: t('common.success'),
        description: t('shipments.statusUpdateSuccess'),
      });
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
      setUpdatingShipmentId(undefined);
    },
    onError: (error: any) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
      setUpdatingShipmentId(undefined);
    },
  });

  const handleStatusChange = (shipmentId: string, newStatus: ShipmentStatus) => {
    setUpdatingShipmentId(shipmentId);
    updateStatusMutation.mutate({ shipmentId, status: newStatus });
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

  const canManageInvoices = hasFlag('canManageInvoices') || acl?.userType === 'admin';
  const canUpdateShipmentStatus = acl?.userType === 'admin';
  const canPay = canManageInvoices && (invoice.status === 'PENDING' || invoice.status === 'SENT' || invoice.status === 'OVERDUE' || invoice.status === 'PARTIALLY_PAID') && invoice.totals.due > 0;
  const canCancel = canManageInvoices && invoice.status !== 'VOID' && invoice.status !== 'PAID';
  
  const handlePrint = async () => {
    try {
      await printArabicInvoice(invoice);
    } catch (error) {
      toast({
        title: t('common.error'),
        description: 'Failed to open print dialog. Please allow popups for this site.',
        variant: 'destructive',
      });
    }
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

      {/* Payment History */}
      {canManageInvoices && <PaymentHistory invoice={invoice} />}

      {/* Invoice Items */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            {t('invoice.items.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <InvoiceItemsTable 
            items={invoice.items}
            onStatusChange={handleStatusChange}
            canUpdateStatus={canUpdateShipmentStatus}
            updatingShipmentId={updatingShipmentId}
          />
        </CardContent>
      </Card>

      {/* Make Payment Section */}
      {canPay && (
        <Card className="glass-card border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground">{t('invoice.payment.paymentDue')}</h3>
                <p className="text-3xl font-bold text-primary mt-2">
                  {formatLYD(invoice.totals.due || 0)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('invoice.fields.invoiceNumber')}: {invoice.invoiceNumber}
                </p>
              </div>
              <Button 
                size="lg" 
                onClick={() => setPaymentOpen(true)}
                className="gap-2"
              >
                <DollarSign className="h-5 w-5" />
                {t('invoice.payment.makePayment')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <PaymentDialog
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        invoice={invoice}
      />

      <CancelInvoiceDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        invoice={invoice}
      />
    </div>
  );
}
