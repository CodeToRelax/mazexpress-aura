import { useTranslation } from 'react-i18next';
import { Package, Plus, Minus, DollarSign } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { InvoiceItem, InvoiceItemKind } from '@/types/invoice';
import { IShipment } from '@/types/shipment';
import { calculateCBM, formatDimensions } from '@/utilities/helpers/invoiceHelpers';
import { formatLYD } from '@/utilities/helpers/currencyHelpers';

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
            <TableHead>{t('invoice.items.item')}</TableHead>
            <TableHead>{t('invoice.items.destination')}</TableHead>
            <TableHead>{t('invoice.items.method')}</TableHead>
            <TableHead>{t('invoice.items.status')}</TableHead>
            <TableHead>{t('invoice.items.weight')}</TableHead>
            <TableHead>{t('invoice.items.dimensions')}</TableHead>
            <TableHead>{t('invoice.items.cbm')}</TableHead>
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
                {/* Item Column */}
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-full ${iconColors.bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`h-5 w-5 ${iconColors.text}`} />
                    </div>
                    <div className="font-medium text-foreground">
                      {isShipment && shipment ? shipment.esn : item.description}
                    </div>
                  </div>
                </TableCell>

                {/* Destination Column */}
                <TableCell className="text-muted-foreground">
                  {isShipment && shipment 
                    ? shipment.shipmentDestination 
                    : <span className="capitalize">{item.kind.toLowerCase().replace('_', ' ')}</span>
                  }
                </TableCell>

                {/* Method Column */}
                <TableCell className="text-muted-foreground capitalize">
                  {isShipment && shipment ? shipment.shippingMethod?.toLowerCase() : '-'}
                </TableCell>

                {/* Status Column */}
                <TableCell>
                  {isShipment && shipment ? (
                    <Badge 
                      variant={getStatusBadgeVariant(shipment.status)} 
                      className="text-xs"
                    >
                      {shipment.status}
                    </Badge>
                  ) : '-'}
                </TableCell>

                {/* Weight Column */}
                <TableCell className="text-muted-foreground">
                  {isShipment && shipment?.size?.weight ? `${shipment.size.weight}kg` : '-'}
                </TableCell>

                {/* Dimensions Column */}
                <TableCell className="text-muted-foreground">
                  {isShipment && shipment?.size 
                    ? formatDimensions(shipment.size.length, shipment.size.width, shipment.size.height) 
                    : '-'
                  }
                </TableCell>

                {/* CBM Column */}
                <TableCell className="text-muted-foreground">
                  {isShipment && shipment?.size?.length && shipment?.size?.width && shipment?.size?.height
                    ? calculateCBM(shipment.size.length, shipment.size.width, shipment.size.height) + 'm³'
                    : '-'
                  }
                </TableCell>

                {/* Quantity Column */}
                <TableCell className="text-muted-foreground">
                  {item.quantity}
                </TableCell>

                {/* Unit Price Column */}
                <TableCell className="text-muted-foreground">
                  {formatLYD(item.unitPrice)}
                </TableCell>

                {/* Total Column */}
                <TableCell className="text-muted-foreground">
                  {formatLYD(totalAmount)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
