import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
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
import { updateInvoiceStatus } from '@/utilities/api/invoice.api';
import { toast } from '@/hooks/use-toast';
import type { Invoice } from '@/types/invoice';

interface CancelInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice;
}

export function CancelInvoiceDialog({ open, onOpenChange, invoice }: CancelInvoiceDialogProps) {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const handleCancel = async () => {
    try {
      setIsLoading(true);
      await updateInvoiceStatus(
        invoice._id,
        { status: 'VOID' },
        i18n.language
      );

      toast({
        title: t('invoice.messages.cancelled'),
        description: t('invoice.messages.statusUpdated'),
      });

      await queryClient.invalidateQueries({ queryKey: ['invoice', invoice._id] });
      await queryClient.invalidateQueries({ queryKey: ['invoices'] });
      
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: t('errors.error'),
        description: error.message || t('invoice.messages.updateError'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('invoice.actions.cancel')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('invoice.messages.cancelConfirm', { invoiceNumber: invoice.invoiceNumber })}
            <br />
            <span className="text-destructive font-medium">
              This action will void the invoice and cannot be undone.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            {t('actions.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleCancel} 
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? t('common.processing') : t('invoice.actions.cancelInvoice')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
