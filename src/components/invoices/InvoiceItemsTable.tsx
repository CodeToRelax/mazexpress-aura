import { useTranslation } from 'react-i18next';
import { Package, Plus, Minus, DollarSign } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { InvoiceItem, InvoiceItemKind } from '@/types/invoice';
import { IShipment } from '@/types/shipment';
import { calculateCBM, formatDimensions, formatCurrency } from '@/utilities/helpers/invoiceHelpers';

interface InvoiceItemsTableProps {
  items: InvoiceItem[];
}

function getItemKindIcon(kind: InvoiceItemKind) {
  switch (kind) {
    case 'SHIPMENT':
      return Package;
    case 'SURCHARGE':
      return Plus;
    case 'DISCOUNT':
      return Minus;
    case 'ADJUSTMENT':
      return DollarSign;
    default:
      return Package;
  }
}

function getItemKindColor(kind: InvoiceItemKind) {
  switch (kind) {
    case 'SHIPMENT':
      return { bg: 'bg-primary/10', text: 'text-primary' };
    case 'SURCHARGE':
      return { bg: 'bg-orange-500/10', text: 'text-orange-500' };
    case 'DISCOUNT':
      return { bg: 'bg-green-500/10', text: 'text-green-500' };
    case 'ADJUSTMENT':
      return { bg: 'bg-blue-500/10', text: 'text-blue-500' };
    default:
      return { bg: 'bg-primary/10', text: 'text-primary' };
  }
}

function getStatusBadgeVariant(status: string) {
  switch (status?.toUpperCase()) {
    case 'DELIVERED':
      return 'default';
    case 'PENDING':
      return 'secondary';
    case 'IN_TRANSIT':
      return 'outline';
    case 'CANCELLED':
      return 'destructive';
    default:
      return 'secondary';
  }
}

export function InvoiceItemsTable({ items }: InvoiceItemsTableProps) {
  const { t } = useTranslation();

  if (!items || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Package className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">{t('invoice.items.noItems')}</p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('invoice.items.description')}</TableHead>
            <TableHead>{t('invoice.items.quantity')}</TableHead>
            <TableHead>{t('invoice.items.unitPrice')}</TableHead>
            <TableHead>{t('invoice.items.total')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const Icon = getItemKindIcon(item.kind);
            const iconColors = getItemKindColor(item.kind);
            const isShipment = item.kind === 'SHIPMENT' && item.shipmentId && typeof item.shipmentId === 'object';
            const shipment = isShipment ? (item.shipmentId as IShipment) : null;
            const totalAmount = item.totalGross || (item.quantity * item.unitPrice);

            return (
              <TableRow 
                key={item._id}
                className="hover:bg-accent/20 transition-colors duration-150"
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-full ${iconColors.bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`h-5 w-5 ${iconColors.text}`} />
                    </div>
                    <div>
                      {isShipment && shipment ? (
                        <>
                          <div className="font-medium text-foreground">
                            ESN: {shipment.esn} → {shipment.shipmentDestination}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="capitalize">{shipment.shippingMethod?.toLowerCase()}</span>
                            <span>·</span>
                            <Badge 
                              variant={getStatusBadgeVariant(shipment.status)} 
                              className="text-xs"
                            >
                              {shipment.status}
                            </Badge>
                          </div>
                          {shipment.size && (
                            <div className="text-sm text-muted-foreground">
                              {shipment.size.weight && `${shipment.size.weight}kg`}
                              {shipment.size.weight && shipment.size.length && ' · '}
                              {shipment.size.length && shipment.size.width && shipment.size.height && (
                                <>
                                  {formatDimensions(
                                    shipment.size.length,
                                    shipment.size.width,
                                    shipment.size.height
                                  )}
                                  {' · '}
                                  {calculateCBM(
                                    shipment.size.length,
                                    shipment.size.width,
                                    shipment.size.height
                                  )}m³
                                </>
                              )}
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="font-medium text-foreground">
                            {item.description}
                          </div>
                          <div className="text-sm text-muted-foreground capitalize">
                            {item.kind.toLowerCase().replace('_', ' ')}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {item.quantity}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatCurrency(item.unitPrice)} LYD
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatCurrency(totalAmount)} LYD
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
