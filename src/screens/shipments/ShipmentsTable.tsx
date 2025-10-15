import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  MoreVertical, 
  Edit, 
  Trash2, 
  Eye, 
  Package,
  ChevronsUpDown,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import type { IShipment } from '@/types/shipment';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ACLGuard } from '@/components/guards/ACLGuard';
import { StatusBadge } from '@/components/shipments/StatusBadge';
import { TierBadge } from '@/components/shipments/TierBadge';

interface ShipmentsTableProps {
  shipments: IShipment[];
  selectedShipments: Set<string>;
  onSelectShipment: (shipmentId: string) => void;
  onSelectAll: (checked: boolean) => void;
  onEdit: (shipment: IShipment) => void;
  onDelete: (shipment: IShipment) => void;
  visibleColumns: Set<string>;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (column: string) => void;
}

export function ShipmentsTable({
  shipments,
  selectedShipments,
  onSelectShipment,
  onSelectAll,
  onEdit,
  onDelete,
  visibleColumns,
  sortBy,
  sortOrder,
  onSort,
}: ShipmentsTableProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const getSortIcon = (column: string) => {
    if (sortBy !== column) {
      return <ChevronsUpDown className="h-4 w-4 ml-1 text-muted-foreground" />;
    }
    return sortOrder === 'asc' ? (
      <ChevronUp className="h-4 w-4 ml-1 text-primary" />
    ) : (
      <ChevronDown className="h-4 w-4 ml-1 text-primary" />
    );
  };

  const renderSortableHeader = (column: string, label: string) => {
    const isSortable = onSort && ['esn', 'csn', 'status', 'tier', 'createdAt'].includes(column);
    
    if (!isSortable) {
      return label;
    }

    return (
      <button
        onClick={() => onSort(column)}
        className="flex items-center gap-1 hover:text-foreground transition-colors"
        aria-label={t('shipments.table.sortBy', { column: label })}
      >
        <span>{label}</span>
        {getSortIcon(column)}
      </button>
    );
  };

  const getStatusBadge = (status: string) => {
    return <StatusBadge status={status} />;
  };

  const allSelected = shipments.length > 0 && shipments.every(s => selectedShipments.has(s._id));
  const someSelected = shipments.some(s => selectedShipments.has(s._id)) && !allSelected;

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected || someSelected}
                onCheckedChange={onSelectAll}
                aria-label={t('shipments.table.selectAll')}
              />
            </TableHead>
            <TableHead>{renderSortableHeader('esn', t('shipments.table.columns.esn'))}</TableHead>
            <TableHead>{renderSortableHeader('csn', t('shipments.table.columns.csn'))}</TableHead>
            {visibleColumns.has('isn') && <TableHead>{t('shipments.table.columns.isn')}</TableHead>}
            {visibleColumns.has('destination') && <TableHead>{t('shipments.table.columns.destination')}</TableHead>}
            {visibleColumns.has('method') && <TableHead>{t('shipments.table.columns.method')}</TableHead>}
            {visibleColumns.has('status') && <TableHead>{renderSortableHeader('status', t('shipments.table.columns.status'))}</TableHead>}
            {visibleColumns.has('tier') && <TableHead>{renderSortableHeader('tier', t('shipments.table.columns.tier'))}</TableHead>}
            {visibleColumns.has('weight') && <TableHead>{t('shipments.table.columns.weight')}</TableHead>}
            {visibleColumns.has('estimatedArrival') && <TableHead>{t('shipments.table.columns.estimatedArrival')}</TableHead>}
            <TableHead>{renderSortableHeader('createdAt', t('shipments.table.columns.createdAt'))}</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {shipments.map((shipment) => (
            <TableRow 
              key={shipment._id}
              className="cursor-pointer hover:bg-accent/20 transition-colors duration-150"
              onClick={() => navigate(`/shipments/${shipment._id}`)}
            >
              <TableCell onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={selectedShipments.has(shipment._id)}
                  onCheckedChange={() => onSelectShipment(shipment._id)}
                />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="font-mono text-sm">{shipment.esn}</span>
                </div>
              </TableCell>
              <TableCell>
                <span className="font-mono text-sm">{shipment.csn}</span>
              </TableCell>
              {visibleColumns.has('isn') && (
                <TableCell className="text-muted-foreground">
                  {shipment.isn && shipment.isn !== '-' ? shipment.isn : 'N/A'}
                </TableCell>
              )}
              {visibleColumns.has('destination') && (
                <TableCell className="capitalize">
                  {shipment.shipmentDestination || 'N/A'}
                </TableCell>
              )}
              {visibleColumns.has('method') && (
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {shipment.shippingMethod ? t(`shipments.table.method.${shipment.shippingMethod}`) : 'N/A'}
                  </Badge>
                </TableCell>
              )}
              {visibleColumns.has('status') && (
                <TableCell>{getStatusBadge(shipment.status)}</TableCell>
              )}
              {visibleColumns.has('tier') && (
                <TableCell>
                  <TierBadge tier={shipment.tier || 'A'} />
                </TableCell>
              )}
              {visibleColumns.has('weight') && (
                <TableCell className="text-muted-foreground">
                  {shipment.size?.weight ? `${shipment.size.weight} kg` : 'N/A'}
                </TableCell>
              )}
              {visibleColumns.has('estimatedArrival') && (
                <TableCell className="text-muted-foreground">
                  {shipment.estimatedArrival 
                    ? format(new Date(shipment.estimatedArrival), 'MMM dd, yyyy')
                    : 'N/A'
                  }
                </TableCell>
              )}
              <TableCell className="text-muted-foreground">
                {format(new Date(shipment.createdAt), 'MMM dd, yyyy')}
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>{t('shipments.table.columns.actions')}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate(`/shipments/${shipment._id}`)}>
                      <Eye className="h-4 w-4 mr-2" />
                      {t('shipments.actions.view')}
                    </DropdownMenuItem>
                    <ACLGuard flag="canUpdateShipments">
                      <DropdownMenuItem onClick={() => onEdit(shipment)}>
                        <Edit className="h-4 w-4 mr-2" />
                        {t('shipments.actions.edit')}
                      </DropdownMenuItem>
                    </ACLGuard>
                    <ACLGuard flag="canDeleteShipments">
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => onDelete(shipment)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {t('shipments.actions.delete')}
                      </DropdownMenuItem>
                    </ACLGuard>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
