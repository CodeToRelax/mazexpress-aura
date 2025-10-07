import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { toggleWarehouseStatus } from '@/utilities/api/warehouses.api';
import { WarehouseStatus, type Warehouse } from '@/types/warehouse';

interface ToggleStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouse: Warehouse;
  onSuccess: () => void;
}

export function ToggleStatusDialog({
  open,
  onOpenChange,
  warehouse,
  onSuccess,
}: ToggleStatusDialogProps) {
  const { t } = useTranslation();
  const [isUpdating, setIsUpdating] = useState(false);

  const newStatus =
    warehouse.status === WarehouseStatus.OPEN ? WarehouseStatus.CLOSED : WarehouseStatus.OPEN;

  const handleToggle = async () => {
    try {
      setIsUpdating(true);
      await toggleWarehouseStatus(warehouse._id, { status: newStatus });
      toast({
        title: t('status.success'),
        description: t('warehouses.messages.statusToggleSuccess'),
      });
      onSuccess();
    } catch (error) {
      toast({
        title: t('status.error'),
        description: error instanceof Error ? error.message : t('warehouses.messages.error'),
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('warehouses.actions.toggleStatus')}</DialogTitle>
          <DialogDescription>
            Change the status of "{warehouse.name}" from{' '}
            <span className="font-semibold">
              {warehouse.status === WarehouseStatus.OPEN
                ? t('warehouses.table.status.open')
                : t('warehouses.table.status.closed')}
            </span>{' '}
            to{' '}
            <span className="font-semibold">
              {newStatus === WarehouseStatus.OPEN
                ? t('warehouses.table.status.open')
                : t('warehouses.table.status.closed')}
            </span>
            ?
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isUpdating}>
            {t('actions.cancel')}
          </Button>
          <Button onClick={handleToggle} disabled={isUpdating}>
            {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('actions.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
