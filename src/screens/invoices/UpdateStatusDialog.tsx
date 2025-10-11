import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { updateInvoiceStatus } from '@/utilities/api/invoice.api';
import { updateInvoiceStatusSchema } from '@/utilities/zod/invoice.schemas';
import { toast } from '@/hooks/use-toast';
import type { Invoice } from '@/types/invoice';
import type { UpdateInvoiceStatusInput } from '@/utilities/zod/invoice.schemas';

interface UpdateStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice;
}

const statuses = ['DRAFT', 'UNPAID', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED'] as const;

export function UpdateStatusDialog({ open, onOpenChange, invoice }: UpdateStatusDialogProps) {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<UpdateInvoiceStatusInput>({
    resolver: zodResolver(updateInvoiceStatusSchema),
    defaultValues: {
      status: invoice.status,
      notes: '',
    },
  });

  const onSubmit = async (data: UpdateInvoiceStatusInput) => {
    try {
      setIsLoading(true);
      await updateInvoiceStatus(
        invoice._id, 
        { 
          status: data.status as any, 
          notes: data.notes 
        }, 
        i18n.language
      );

      toast({
        title: t('invoice.messages.statusUpdated'),
        description: t('invoice.messages.updateSuccess'),
      });

      await queryClient.invalidateQueries({ queryKey: ['invoice', invoice._id] });
      await queryClient.invalidateQueries({ queryKey: ['invoices'] });
      
      onOpenChange(false);
      form.reset();
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('invoice.actions.updateStatus')}</DialogTitle>
          <DialogDescription>
            {t('invoice.messages.updateStatusDescription', { invoiceNumber: invoice.invoiceNumber })}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('invoice.fields.status')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('invoice.fields.selectStatus')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {statuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {t(`invoice.status.${status.toLowerCase()}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('invoice.fields.notes')}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder={t('invoice.fields.notesPlaceholder')}
                      rows={3}
                      maxLength={500}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    {t('common.optional')}
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                {t('actions.cancel')}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? t('common.processing') : t('invoice.actions.updateStatus')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
