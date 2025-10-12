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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { processPayment } from '@/utilities/api/invoice.api';
import { getWallet } from '@/utilities/api/wallet.api';
import { processPaymentSchema, type ProcessPaymentInput } from '@/utilities/zod/invoice.schemas';
import type { Invoice, ProcessPaymentRequest } from '@/types/invoice';

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice;
}

export function PaymentDialog({ open, onOpenChange, invoice }: PaymentDialogProps) {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();

  const { data: walletData } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => getWallet(i18n.language),
    enabled: open,
  });

  const form = useForm<ProcessPaymentInput>({
    resolver: zodResolver(processPaymentSchema),
    defaultValues: {
      amount: typeof invoice.userId === 'object' ? invoice.totals.due / 100 : 0,
      source: 'WALLET' as const,
      reference: '',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: ProcessPaymentRequest) => 
      processPayment(invoice._id, data, i18n.language),
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
  });

  const onSubmit = async (data: ProcessPaymentInput) => {
    const paymentData: ProcessPaymentRequest = {
      amount: Math.round(data.amount * 100), // Convert to cents
      source: data.source,
      reference: data.reference,
    };

    mutation.mutate(paymentData);
  };

  const formatCurrency = (amountInCents: number) => {
    const amountInLYD = amountInCents / 100;
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amountInLYD);
  };

  const watchSource = form.watch('source');
  const watchAmount = form.watch('amount');
  const showInsufficientWarning = watchSource === 'WALLET' && walletData && (watchAmount * 100) > walletData.balance;

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
                  <FormLabel>Payment Source</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment source" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="WALLET">Wallet</SelectItem>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                      <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {watchSource === 'WALLET' && walletData && (
                      <span>Current balance: {formatCurrency(walletData.balance)} LYD</span>
                    )}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reference (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter payment reference (e.g., PAY-2024-001)"
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
                disabled={mutation.isPending}
              >
                {t('common.cancel')}
              </Button>
              <Button 
                type="submit" 
                disabled={mutation.isPending || showInsufficientWarning}
              >
                {mutation.isPending ? t('common.processing') : t('invoice.paymentDialog.submit')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
