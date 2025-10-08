import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2, Loader2 } from 'lucide-react';
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
import { shipmentsApi } from '@/utilities/api/shipments.api';

interface BulkDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedShipmentIds: string[];
  onSuccess: () => void;
}

export function BulkDeleteDialog({ open, onOpenChange, selectedShipmentIds, onSuccess }: BulkDeleteDialogProps) {
  const { t } = useTranslation();
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleClose = () => {
    setConfirmText('');
    onOpenChange(false);
  };

  const handleConfirm = async () => {
    if (confirmText !== 'DELETE') return;

    try {
      setIsDeleting(true);
      await shipmentsApi.bulkDeleteShipments({ shipmentsId: selectedShipmentIds });
      toast({
        title: t('status.success'),
        description: t('shipments.messages.bulkDeleteSuccess', { count: selectedShipmentIds.length }),
      });
      handleClose();
      onSuccess();
    } catch (error) {
      toast({
        title: t('status.error'),
        description: error instanceof Error ? error.message : t('shipments.messages.error'),
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const isValid = confirmText === 'DELETE';

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <Trash2 className="h-6 w-6 text-destructive" />
            </div>
            <AlertDialogTitle className="text-xl">
              {t('shipments.bulkDelete.title')}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-3">
            <p>{t('shipments.bulkDelete.description', { count: selectedShipmentIds.length })}</p>
            <p className="text-destructive font-medium">{t('shipments.bulkDelete.warning')}</p>
            
            <div className="glass-card p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">
                {selectedShipmentIds.length} {selectedShipmentIds.length === 1 ? 'shipment' : 'shipments'} selected
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <p className="text-sm font-medium text-foreground">
                {t('shipments.bulkDelete.confirm')}
              </p>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
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
          <Button 
            variant="destructive" 
            onClick={handleConfirm}
            disabled={!isValid || isDeleting}
          >
            {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {!isDeleting && <Trash2 className="h-4 w-4 mr-2" />}
            {t('shipments.actions.bulkDelete')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
