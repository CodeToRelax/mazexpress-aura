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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCancel = async () => {
    if (!notes.trim()) {
      toast({
        title: t('errors.error'),
        description: t('invoice.messages.notesRequired'),
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);
      await updateInvoiceStatus(
        invoice._id,
        { status: 'CANCELLED', notes },
        i18n.language
      );

      toast({
        title: t('invoice.messages.cancelled'),
        description: t('invoice.messages.statusUpdated'),
      });

      await queryClient.invalidateQueries({ queryKey: ['invoice', invoice._id] });
      await queryClient.invalidateQueries({ queryKey: ['invoices'] });
      
      onOpenChange(false);
      setNotes('');
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
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2">
          <Label htmlFor="notes" className="text-destructive">
            {t('invoice.fields.cancellationReason')} *
          </Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('invoice.fields.cancellationReasonPlaceholder')}
            rows={3}
            maxLength={500}
            required
          />
          <p className="text-xs text-muted-foreground">
            {t('invoice.messages.cancellationReasonRequired')}
          </p>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            {t('actions.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleCancel} 
            disabled={isLoading || !notes.trim()}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? t('common.processing') : t('invoice.actions.cancelInvoice')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
