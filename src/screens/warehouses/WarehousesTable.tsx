import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { MoreVertical, Eye, Edit, Trash2, ToggleLeft } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ACLGuard } from '@/components/guards/ACLGuard';
import { EditWarehouseDialog } from './EditWarehouseDialog';
import { DeleteWarehouseDialog } from './DeleteWarehouseDialog';
import { ToggleStatusDialog } from './ToggleStatusDialog';
import { WarehouseStatus, type Warehouse } from '@/types/warehouse';

interface WarehousesTableProps {
  warehouses: Warehouse[];
  onRefetch: () => void;
}

export function WarehousesTable({ warehouses, onRefetch }: WarehousesTableProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isToggleStatusDialogOpen, setIsToggleStatusDialogOpen] = useState(false);

  const handleView = (warehouseId: string) => {
    navigate(`/warehouses/${warehouseId}`);
  };

  const handleEdit = (warehouse: Warehouse) => {
    setSelectedWarehouse(warehouse);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (warehouse: Warehouse) => {
    setSelectedWarehouse(warehouse);
    setIsDeleteDialogOpen(true);
  };

  const handleToggleStatus = (warehouse: Warehouse) => {
    setSelectedWarehouse(warehouse);
    setIsToggleStatusDialogOpen(true);
  };

  const handleSuccess = () => {
    setIsEditDialogOpen(false);
    setIsDeleteDialogOpen(false);
    setIsToggleStatusDialogOpen(false);
    setSelectedWarehouse(null);
    onRefetch();
  };

  if (warehouses.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">{t('warehouses.empty.description')}</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>{t('warehouses.table.columns.name')}</TableHead>
              <TableHead>{t('warehouses.table.columns.city')}</TableHead>
              <TableHead>{t('warehouses.table.columns.country')}</TableHead>
              <TableHead>{t('warehouses.table.columns.phone')}</TableHead>
              <TableHead>{t('warehouses.table.columns.status')}</TableHead>
              <TableHead className="text-right">
                {t('warehouses.table.columns.actions')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {warehouses.map((warehouse) => (
              <TableRow 
                key={warehouse._id} 
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleView(warehouse._id)}
              >
                <TableCell className="font-medium">{warehouse.name}</TableCell>
                <TableCell>{warehouse.address.city}</TableCell>
                <TableCell>{warehouse.address.country}</TableCell>
                <TableCell>{warehouse.phoneNumber || '-'}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      warehouse.status === WarehouseStatus.OPEN ? 'default' : 'secondary'
                    }
                  >
                    {warehouse.status === WarehouseStatus.OPEN
                      ? t('warehouses.table.status.open')
                      : t('warehouses.table.status.closed')}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleView(warehouse._id); }}>
                        <Eye className="h-4 w-4 mr-2" />
                        {t('warehouses.actions.view')}
                      </DropdownMenuItem>
                      <ACLGuard flag="canManageWarehouses">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(warehouse); }}>
                          <Edit className="h-4 w-4 mr-2" />
                          {t('warehouses.actions.edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleToggleStatus(warehouse); }}>
                          <ToggleLeft className="h-4 w-4 mr-2" />
                          {t('warehouses.actions.toggleStatus')}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={(e) => { e.stopPropagation(); handleDelete(warehouse); }}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {t('warehouses.actions.delete')}
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

      {/* Dialogs */}
      {selectedWarehouse && (
        <>
          <EditWarehouseDialog
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            warehouse={selectedWarehouse}
            onSuccess={handleSuccess}
          />
          <DeleteWarehouseDialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
            warehouse={selectedWarehouse}
            onSuccess={handleSuccess}
          />
          <ToggleStatusDialog
            open={isToggleStatusDialogOpen}
            onOpenChange={setIsToggleStatusDialogOpen}
            warehouse={selectedWarehouse}
            onSuccess={handleSuccess}
          />
        </>
      )}
    </>
  );
}
