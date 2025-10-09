import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Package, MapPin, Truck, Calendar, Weight, Ruler, DollarSign, FileText } from 'lucide-react';
import type { IShipment } from '@/types/shipment';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface ShipmentDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shipment: IShipment;
}

export function ShipmentDetailDialog({ open, onOpenChange, shipment }: ShipmentDetailDialogProps) {
  const { t } = useTranslation();

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, 'default' | 'secondary' | 'destructive'> = {
      'pending': 'secondary',
      'in transit': 'default',
      'ready for pick up': 'default',
      'delivered': 'default',
      'cancelled': 'destructive',
      'returned': 'secondary',
      'received at warehouse': 'default',
      'shipped to destination': 'default'
    };

    return (
      <Badge variant={statusMap[status] || 'secondary'}>
        {t(`shipments.table.status.${status.replace(/ /g, '_')}`)}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              {t('shipments.detail.title')}
            </DialogTitle>
            {getStatusBadge(shipment.status)}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Shipment Numbers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass-card p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">{t('shipments.table.columns.esn')}</p>
              <p className="font-mono font-semibold">{shipment.esn}</p>
            </div>
            <div className="glass-card p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">{t('shipments.table.columns.csn')}</p>
              <p className="font-mono font-semibold">{shipment.csn}</p>
            </div>
            <div className="glass-card p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">{t('shipments.table.columns.isn')}</p>
              <p className="font-mono font-semibold">{shipment.isn && shipment.isn !== '-' ? shipment.isn : 'N/A'}</p>
            </div>
          </div>

          <Separator />

          {/* Shipping Details */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{t('shipments.detail.shippingDetails')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('shipments.table.columns.estimatedArrival')}</p>
                  <p className="font-medium">
                    {shipment.estimatedArrival 
                      ? format(new Date(shipment.estimatedArrival), 'MMM dd, yyyy')
                      : 'N/A'
                    }
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('shipments.table.columns.extraCosts')}</p>
                  <p className="font-medium">{shipment.extraCosts || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Size & Weight */}
          {shipment.size && (
            <>
              <div>
                <h3 className="text-lg font-semibold mb-4">{t('shipments.detail.sizeWeight')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Note */}
          {shipment.note && (
            <>
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {t('shipments.table.columns.note')}
                </h3>
                <div className="glass-card p-4 rounded-lg">
                  <p className="text-sm">{shipment.note}</p>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Metadata */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{t('shipments.detail.metadata')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">{t('shipments.table.columns.createdAt')}</p>
                <p className="font-medium">{format(new Date(shipment.createdAt), 'PPP')}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{t('shipments.table.columns.updatedAt')}</p>
                <p className="font-medium">{format(new Date(shipment.updatedAt), 'PPP')}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{t('shipments.detail.domestic')}</p>
                <p className="font-medium">{shipment.isDomestic ? t('common.yes') : t('common.no')}</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
