import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { ArrowLeft, Package, MapPin, Truck, Calendar, Weight, Ruler, DollarSign, FileText, Loader2, Edit, Trash2, Printer, Receipt } from 'lucide-react';
import type { IShipment } from '@/types/shipment';
import type { Invoice } from '@/types/invoice';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from '@/components/shipments/StatusBadge';
import { TierBadge } from '@/components/shipments/TierBadge';
import { InvoiceStatusBadge } from '@/components/invoices/InvoiceStatusBadge';
import { EditShipmentDialog } from './EditShipmentDialog';
import { DeleteShipmentDialog } from './DeleteShipmentDialog';
import { shipmentsApi } from '@/utilities/api/shipments.api';
import { getInvoiceByShipmentId } from '@/utilities/api/invoice.api';
import { toast } from '@/hooks/use-toast';
import { useACL } from '@/hooks/useACL';
import { ACLGuard } from '@/components/guards/ACLGuard';
import { generateAngularStyleLabel } from '@/utilities/helpers/shipmentLabel';
import { formatCityName } from '@/utilities/helpers/shipmentHelpers';

export default function ShipmentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { hasFlag } = useACL();
  const canUpdateShipments = hasFlag('canUpdateShipments');
  const canDeleteShipments = hasFlag('canDeleteShipments');
  
  const [shipment, setShipment] = useState<IShipment | null>(null);
  const [relatedInvoices, setRelatedInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const fetchShipment = async () => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      const response = await shipmentsApi.getShipmentById(id);
      setShipment(response.data);
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('shipments.messages.fetchError'),
        variant: 'destructive',
      });
      navigate('/shipments');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShipment();
  }, [id]);

  // Fetch related invoice by shipment ID
  useEffect(() => {
    if (!shipment?._id) return;
    getInvoiceByShipmentId(shipment._id)
      .then(invoice => {
        setRelatedInvoices(invoice ? [invoice] : []);
      })
      .catch(() => { /* silently ignore */ });
  }, [shipment?._id]);

  const handleEditSuccess = () => {
    setIsEditDialogOpen(false);
    fetchShipment();
  };

  const handleDeleteSuccess = () => {
    navigate('/shipments');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!shipment) {
    return null;
  }

  return (
    <div className="relative z-10 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/shipments')}
            className="glass-card hover:shadow-glass-hover"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <Package className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">
                {shipment.esn}
              </h1>
              <StatusBadge status={shipment.status} />
            </div>
            <p className="text-muted-foreground mt-1">
              {t('shipments.detail.subtitle')}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => generateAngularStyleLabel(shipment)}>
            <Printer className="h-4 w-4 mr-2" />
            Print Label
          </Button>
          {canUpdateShipments && (
            <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
              <Edit className="h-4 w-4 mr-2" />
              {t('shipments.actions.edit')}
            </Button>
          )}
          {canDeleteShipments && (
            <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
              <Trash2 className="h-4 w-4 mr-2" />
              {t('shipments.actions.delete')}
            </Button>
          )}
        </div>
      </div>

      {/* Shipment Numbers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-6 rounded-2xl">
          <p className="text-sm text-muted-foreground mb-2">{t('shipments.table.columns.esn')}</p>
          <p className="font-mono font-semibold text-lg">{shipment.esn}</p>
        </div>
        <div className="glass-card p-6 rounded-2xl">
          <p className="text-sm text-muted-foreground mb-2">{t('shipments.table.columns.csn')}</p>
          <p className="font-mono font-semibold text-lg">{shipment.csn}</p>
        </div>
        <div className="glass-card p-6 rounded-2xl">
          <p className="text-sm text-muted-foreground mb-2">{t('shipments.table.columns.isn')}</p>
          <p className="font-mono font-semibold text-lg">{shipment.isn && shipment.isn !== '-' ? shipment.isn : 'N/A'}</p>
        </div>
      </div>

      {/* Delivery Status */}
      <div className="glass-card p-6 rounded-2xl space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Truck className="h-5 w-5" />
          {t('shipments.detail.deliveryStatus')}
        </h3>
        <Separator />
        
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              {t('shipments.detail.currentStatus')}
            </p>
            <div className="flex items-center gap-2">
              <StatusBadge status={shipment.status} className="text-base px-4 py-2" />
            </div>
          </div>
          
          <div className="text-sm text-muted-foreground">
            <p>
              {t('shipments.detail.statusUpdatedAt', {
                date: format(new Date(shipment.updatedAt), 'dd/MM/yyyy HH:mm')
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Shipping Details */}
      <div className="glass-card p-6 rounded-2xl space-y-4">
        <h3 className="text-lg font-semibold">{t('shipments.detail.shippingDetails')}</h3>
        <Separator />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground">{t('shipments.table.columns.destination')}</p>
              <p className="font-medium capitalize">{shipment.shipmentDestination || 'N/A'}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Truck className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground">{t('shipments.table.columns.method')}</p>
              <p className="font-medium capitalize">
                {shipment.shippingMethod ? t(`shipments.table.method.${shipment.shippingMethod}`) : 'N/A'}
              </p>
            </div>
          </div>

          {shipment.originCountry && (
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">{t('shipments.table.columns.originCountry')}</p>
                <p className="font-medium capitalize">
                  {t(`shipments.originCountry.${shipment.originCountry}`)}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3">
            <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground">{t('shipments.table.columns.extraCosts')}</p>
              <p className="font-medium">{shipment.extraCosts || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Size & Weight */}
      {shipment.size && (
        <div className="glass-card p-6 rounded-2xl space-y-4">
          <h3 className="text-lg font-semibold">{t('shipments.detail.sizeWeight')}</h3>
          <Separator />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {shipment.size.weight && (
              <div className="flex items-start gap-3">
                <Weight className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('shipments.table.columns.weight')}</p>
                  <p className="font-medium">{shipment.size.weight} kg</p>
                </div>
              </div>
            )}

            {(shipment.size.height || shipment.size.width || shipment.size.length) && (
              <div className="flex items-start gap-3">
                <Ruler className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('shipments.table.columns.dimensions')}</p>
                  <p className="font-medium">
                    {shipment.size.length || '?'} × {shipment.size.width || '?'} × {shipment.size.height || '?'} cm
                  </p>
                </div>
              </div>
            )}

            {(shipment.size.height && shipment.size.width && shipment.size.length) && (
              <div className="flex items-start gap-3">
                <Weight className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Weight by CBM</p>
                  <p className="font-medium">
                    {((shipment.size.length * shipment.size.width * shipment.size.height) / 1000000).toFixed(4)} m³
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pricing Breakdown (server-computed chargeable quantity) */}
      {shipment.pricingBreakdown && (
        <div className="glass-card p-6 rounded-2xl space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            {t('shipments.detail.pricingBreakdown', { defaultValue: 'Chargeable Quantity' })}
          </h3>
          <Separator />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">
                {t('shipments.detail.chargeable', { defaultValue: 'Chargeable' })}
              </p>
              <p className="font-semibold text-lg">
                {shipment.pricingBreakdown.chargeableQuantity}{' '}
                <span className="text-sm text-muted-foreground">
                  {shipment.pricingBreakdown.chargeableUnit}
                </span>
              </p>
            </div>
            {typeof shipment.pricingBreakdown.cbmM3 === 'number' && (
              <div>
                <p className="text-sm text-muted-foreground">CBM (m³)</p>
                <p className="font-medium">{shipment.pricingBreakdown.cbmM3.toFixed(4)}</p>
              </div>
            )}
            {typeof shipment.pricingBreakdown.airVolumetricWeightKg === 'number' && (
              <div>
                <p className="text-sm text-muted-foreground">
                  {t('shipments.detail.volumetricWeight', { defaultValue: 'Volumetric weight' })}
                </p>
                <p className="font-medium">
                  {shipment.pricingBreakdown.airVolumetricWeightKg.toFixed(2)} kg
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Note */}
      {shipment.note && (
        <div className="glass-card p-6 rounded-2xl space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t('shipments.table.columns.note')}
          </h3>
          <Separator />
          <p className="text-sm">{shipment.note}</p>
        </div>
      )}

      {/* Metadata */}
      <div className="glass-card p-6 rounded-2xl space-y-4">
        <h3 className="text-lg font-semibold">{t('shipments.detail.metadata')}</h3>
        <Separator />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <p className="text-muted-foreground">{t('shipments.table.columns.createdAt')}</p>
            <p className="font-medium">{format(new Date(shipment.createdAt), 'PPP')}</p>
          </div>
          <div>
            <p className="text-muted-foreground">{t('shipments.table.columns.updatedAt')}</p>
            <p className="font-medium">{format(new Date(shipment.updatedAt), 'PPP')}</p>
          </div>
        </div>
      </div>

      {/* Related Invoices */}
      {relatedInvoices.length > 0 && (
        <div className="glass-card p-6 rounded-2xl space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            {t('shipments.detail.relatedInvoices', 'Related Invoices')}
          </h3>
          <Separator />
          <div className="space-y-3">
            {relatedInvoices.map(invoice => {
              const user = typeof invoice.userId === 'object' ? invoice.userId : null;
              return (
                <Link
                  key={invoice._id}
                  to={`/invoices/${invoice._id}`}
                  className="flex items-center justify-between p-4 rounded-xl border hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Receipt className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold font-mono">{invoice.invoiceNumber}</p>
                      {user && (
                        <p className="text-sm text-muted-foreground">
                          {user.firstName} {user.lastName}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold">{invoice.totals?.gross?.toFixed(2)} {invoice.currency || 'LYD'}</p>
                      <p className="text-xs text-muted-foreground">
                        {invoice.createdAt && !isNaN(new Date(invoice.createdAt).getTime())
                          ? format(new Date(invoice.createdAt), 'dd/MM/yyyy')
                          : invoice.issueDate && !isNaN(new Date(invoice.issueDate).getTime())
                            ? format(new Date(invoice.issueDate), 'dd/MM/yyyy')
                            : '—'}
                      </p>
                    </div>
                    <InvoiceStatusBadge status={invoice.status} />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Dialogs */}
      {shipment && (
        <>
          <EditShipmentDialog
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            shipment={shipment}
            onSuccess={handleEditSuccess}
          />
          <DeleteShipmentDialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
            shipment={shipment}
            onSuccess={handleDeleteSuccess}
          />
        </>
      )}
    </div>
  );
}
