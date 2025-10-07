import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { deleteWarehouse } from '@/utilities/api/warehouses.api';
import type { Warehouse } from '@/types/warehouse';

interface DeleteWarehouseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouse: Warehouse;
  onSuccess: () => void;
}

export function DeleteWarehouseDialog({
  open,
  onOpenChange,
  warehouse,
  onSuccess,
}: DeleteWarehouseDialogProps) {
  const { t } = useTranslation();
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const handleClose = () => {
    setConfirmText('');
    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (confirmText !== 'Delete') return;

    try {
      setIsDeleting(true);
      await deleteWarehouse(warehouse._id);
      toast({
        title: t('status.success'),
        description: t('warehouses.messages.deleteSuccess'),
      });
      setConfirmText('');
      onSuccess();
    } catch (error) {
      toast({
        title: t('status.error'),
        description: error instanceof Error ? error.message : t('warehouses.messages.error'),
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const isValid = confirmText === 'Delete';

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <Trash2 className="h-6 w-6 text-destructive" />
            </div>
            <AlertDialogTitle className="text-xl">
              {t('warehouses.actions.delete')}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-3">
            <p>{t('warehouses.messages.deleteConfirm')}</p>
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="font-medium text-foreground">{warehouse.name}</p>
              <p className="text-sm text-muted-foreground">
                {warehouse.address.city}, {warehouse.address.country}
              </p>
            </div>
            <div className="space-y-2 pt-2">
              <p className="text-sm font-medium text-foreground">
                {t('warehouses.messages.typeDeleteToConfirm')} <span className="font-bold text-destructive">Delete</span>:
              </p>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Delete"
                className="font-mono"
                disabled={isDeleting}
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isDeleting}>
            {t('actions.cancel')}
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={!isValid || isDeleting}>
            <Trash2 className="h-4 w-4 mr-2" />
            {t('warehouses.actions.delete')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
