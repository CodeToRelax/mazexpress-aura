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

interface MarkAsPaidDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice;
  onSuccess?: () => void;
}

export function MarkAsPaidDialog({ open, onOpenChange, invoice, onSuccess }: MarkAsPaidDialogProps) {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const handleMarkAsPaid = async () => {
    try {
      setIsLoading(true);
      await updateInvoiceStatus(
        invoice._id,
        { status: 'PAID' },
        i18n.language
      );

      toast({
        title: t('invoice.messages.markedAsPaid'),
        description: t('invoice.messages.statusUpdated'),
      });

      await queryClient.invalidateQueries({ queryKey: ['invoice', invoice._id] });
      await queryClient.invalidateQueries({ queryKey: ['invoices'] });
      
      onOpenChange(false);
      onSuccess?.();
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
          <AlertDialogTitle>{t('invoice.actions.markAsPaid')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('invoice.messages.markAsPaidConfirm', { invoiceNumber: invoice.invoiceNumber })}
            <br />
            <span className="text-muted-foreground">
              This will update the invoice status to PAID.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            {t('actions.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleMarkAsPaid} disabled={isLoading}>
            {isLoading ? t('common.processing') : t('actions.confirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
