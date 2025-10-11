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

interface MarkAsPaidDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice;
}

export function MarkAsPaidDialog({ open, onOpenChange, invoice }: MarkAsPaidDialogProps) {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleMarkAsPaid = async () => {
    try {
      setIsLoading(true);
      await updateInvoiceStatus(
        invoice._id,
        { status: 'PAID', notes: notes || undefined },
        i18n.language
      );

      toast({
        title: t('invoice.messages.markedAsPaid'),
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
          <AlertDialogTitle>{t('invoice.actions.markAsPaid')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('invoice.messages.markAsPaidConfirm', { invoiceNumber: invoice.invoiceNumber })}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2">
          <Label htmlFor="notes">{t('invoice.fields.notes')}</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('invoice.fields.notesPlaceholder')}
            rows={3}
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground">
            {t('common.optional')}
          </p>
        </div>

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
