import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { processPayment } from '@/utilities/api/invoice.api';
import { getWallet } from '@/utilities/api/wallet.api';
import { processPaymentSchema, type ProcessPaymentInput } from '@/utilities/zod/invoice.schemas';
import type { Invoice } from '@/types/invoice';

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice;
}

export function PaymentDialog({ open, onOpenChange, invoice }: PaymentDialogProps) {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: wallet } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => getWallet(i18n.language),
    enabled: open,
  });

  const form = useForm<ProcessPaymentInput>({
    resolver: zodResolver(processPaymentSchema),
    defaultValues: {
      amount: invoice.totals.due,
      source: 'wallet',
      paymentMethod: '',
      notes: '',
    },
  });

  const paymentMutation = useMutation({
    mutationFn: (data: ProcessPaymentInput) => processPayment(invoice._id, {
      amount: data.amount,
      source: data.source,
      paymentMethod: data.paymentMethod,
      notes: data.notes,
    }, i18n.language),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', invoice._id] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      toast({
        title: t('invoice.messages.paymentSuccess'),
        variant: 'default',
      });
      form.reset();
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

  const onSubmit = (data: ProcessPaymentInput) => {
    setIsSubmitting(true);
    paymentMutation.mutate(data);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const watchAmount = form.watch('amount');
  const watchSource = form.watch('source');
  const showInsufficientWarning = wallet && watchSource === 'wallet' && watchAmount > wallet.balance;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('invoice.paymentDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('invoice.paymentDialog.description', { 
              number: invoice.invoiceNumber,
              amount: formatCurrency(invoice.totals.due)
            })}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {showInsufficientWarning && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {t('wallet.messages.insufficientBalance')}
                </AlertDescription>
              </Alert>
            )}

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('invoice.paymentDialog.amount')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder={t('invoice.paymentDialog.amountPlaceholder')}
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="source"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('invoice.paymentDialog.source')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('invoice.paymentDialog.selectSource')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="wallet">
                        {t('invoice.paymentDialog.sourceWallet')}
                        {wallet && ` (${formatCurrency(wallet.balance)} LYD)`}
                      </SelectItem>
                      <SelectItem value="cash">{t('invoice.paymentDialog.sourceCash')}</SelectItem>
                      <SelectItem value="bank_transfer">{t('invoice.paymentDialog.sourceBankTransfer')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('invoice.paymentDialog.paymentMethod')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('invoice.paymentDialog.paymentMethodPlaceholder')}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('invoice.paymentDialog.notes')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('invoice.paymentDialog.notesPlaceholder')}
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                type="submit" 
                disabled={isSubmitting || showInsufficientWarning}
              >
                {isSubmitting ? t('common.processing') : t('invoice.paymentDialog.submit')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
