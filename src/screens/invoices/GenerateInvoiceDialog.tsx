import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { generateInvoice } from '@/utilities/api/invoice.api';
import type { GenerateInvoiceRequest } from '@/types/invoice';
import { useAppSelector } from '@/utilities/redux';

interface GenerateInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shipmentIds: string[];
}

export function GenerateInvoiceDialog({ 
  open, 
  onOpenChange, 
  shipmentIds 
}: GenerateInvoiceDialogProps) {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const acl = useAppSelector((state) => state.acl.acl);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const generateMutation = useMutation({
    mutationFn: (data: GenerateInvoiceRequest) => generateInvoice(data, i18n.language),
    onSuccess: (invoice) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
      toast({
        title: t('invoice.messages.generateSuccess'),
        description: t('invoice.messages.invoiceNumber', { number: invoice.invoiceNumber }),
        variant: 'default',
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: t('invoice.messages.error'),
        description: error.message,
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const handleGenerate = () => {
    if (!acl?.userId) {
      toast({
        title: t('common.error'),
        description: t('invoice.messages.userRequired'),
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    generateMutation.mutate({
      userId: acl.userId,
      shipmentIds,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t('invoice.generateDialog.title')}
          </DialogTitle>
          <DialogDescription>
            {t('invoice.generateDialog.description', { count: shipmentIds.length })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {t('invoice.generateDialog.warning')}
            </AlertDescription>
          </Alert>

          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('invoice.generateDialog.shipmentCount')}</span>
              <span className="font-medium">{shipmentIds.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('invoice.generateDialog.status')}</span>
              <span className="font-medium">{t('invoice.status.unpaid')}</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {t('common.cancel')}
            </Button>
            <Button 
              onClick={handleGenerate}
              disabled={isSubmitting || shipmentIds.length === 0}
            >
              {isSubmitting ? t('common.processing') : t('invoice.generateDialog.submit')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
