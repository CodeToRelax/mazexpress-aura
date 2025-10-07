import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ToggleLeft } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
  
  const isOpening = newStatus === WarehouseStatus.OPEN;

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
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              isOpening ? 'bg-primary/10' : 'bg-muted'
            }`}>
              <ToggleLeft className={`h-6 w-6 ${isOpening ? 'text-primary' : 'text-muted-foreground'}`} />
            </div>
            <AlertDialogTitle className="text-xl">
              {t('warehouses.actions.toggleStatus')}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-3">
            <p>
              {t('warehouses.messages.statusToggleConfirm', {
                action: isOpening ? t('warehouses.table.status.open') : t('warehouses.table.status.closed')
              })}
            </p>
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="font-medium text-foreground">{warehouse.name}</p>
              <p className="text-sm text-muted-foreground">
                {t('warehouses.messages.currentStatus')}: {' '}
                <span className="font-semibold">
                  {warehouse.status === WarehouseStatus.OPEN
                    ? t('warehouses.table.status.open')
                    : t('warehouses.table.status.closed')}
                </span>
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isUpdating}>
            {t('actions.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleToggle} disabled={isUpdating}>
            {t('actions.confirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
