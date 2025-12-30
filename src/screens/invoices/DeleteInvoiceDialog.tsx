import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Invoice } from '@/types/invoice';
import { deleteInvoice } from '@/utilities/api/invoice.api';
import { formatLYD } from '@/utilities/helpers/currencyHelpers';

interface DeleteInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice;
  onSuccess?: () => void;
}

export function DeleteInvoiceDialog({
  open,
  onOpenChange,
  invoice,
  onSuccess,
}: DeleteInvoiceDialogProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [confirmText, setConfirmText] = useState('');

  const isPaidInvoice = invoice.status === 'PAID';

  const deleteMutation = useMutation({
    mutationFn: () => deleteInvoice(invoice._id, { force: isPaidInvoice }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', invoice._id] });
      toast({
        title: t('invoice.messages.deleteSuccess'),
        description: isPaidInvoice && result?.cascade?.totalBalanceReversed
          ? t('invoice.delete.forceDeleteSuccess', { 
              reversed: formatLYD(result.cascade.totalBalanceReversed) 
            })
          : undefined,
        variant: 'default',
      });
      onSuccess?.();
      onOpenChange(false);
      setConfirmText('');
    },
    onError: (error: Error) => {
      toast({
        title: t('invoice.messages.deleteError'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleDelete = () => {
    if (confirmText.toLowerCase() === 'delete') {
      deleteMutation.mutate();
    }
  };

  const canDelete = confirmText.toLowerCase() === 'delete';

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <AlertDialogTitle>{t('invoice.delete.title')}</AlertDialogTitle>
              <AlertDialogDescription className="mt-1">
                {t('invoice.delete.description')}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          {/* Invoice details */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('invoice.fields.invoiceNumber')}:</span>
              <span className="font-medium">{invoice.invoiceNumber || t('invoice.status.DRAFT')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('invoice.fields.status')}:</span>
              <span className="font-medium">{invoice.status}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('invoice.fields.totalAmount')}:</span>
              <span className="font-medium">{formatLYD(invoice.totals.gross)}</span>
            </div>
          </div>

          {/* Warning for paid invoices - show cascade effects */}
          {isPaidInvoice && (
            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-lg space-y-2">
              <p className="text-sm text-amber-600 dark:text-amber-500 font-medium">
                {t('invoice.delete.paidWarningForce')}
              </p>
              <ul className="text-xs text-amber-600/80 dark:text-amber-500/80 list-disc list-inside space-y-1">
                <li>{t('invoice.delete.cascadeTransactions')}</li>
                <li>{t('invoice.delete.cascadeBalance')}</li>
                <li>{t('invoice.delete.cascadeShipments')}</li>
              </ul>
            </div>
          )}

          {/* Confirmation input - shown for all invoices */}
          <div className="space-y-2">
            <Label htmlFor="confirm">{t('invoice.delete.confirmLabel')}</Label>
            <Input
              id="confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={t('invoice.delete.confirmPlaceholder')}
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground">
              {t('invoice.delete.confirmHelp')}
            </p>
          </div>
        </div>

        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setConfirmText('');
            }}
            disabled={deleteMutation.isPending}
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!canDelete || deleteMutation.isPending}
          >
            {deleteMutation.isPending ? t('invoice.delete.deleting') : t('invoice.delete.confirm')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
