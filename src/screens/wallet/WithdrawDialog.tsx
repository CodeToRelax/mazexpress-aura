import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle } from 'lucide-react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { withdraw } from '@/utilities/api/wallet.api';
import { withdrawalSchema, type WithdrawalInput } from '@/utilities/zod/wallet.schemas';
import type { Wallet } from '@/types/wallet';
import { formatLYD } from '@/utilities/helpers/currencyHelpers';

interface WithdrawDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wallet: Wallet | null;
}

export function WithdrawDialog({ open, onOpenChange, wallet }: WithdrawDialogProps) {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<WithdrawalInput>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: {
      amount: 100,
      description: '',
      reference: '',
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: (data: { amount: number; description: string }) => withdraw(data, i18n.language),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast({
        title: t('wallet.messages.withdrawSuccess'),
        variant: 'default',
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: t('wallet.messages.error'),
        description: error.message,
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const onSubmit = (data: WithdrawalInput) => {
    if (wallet && data.amount > wallet.balance) {
      toast({
        title: t('wallet.messages.insufficientBalance'),
        variant: 'destructive',
      });
      return;
    }
    setIsSubmitting(true);
    withdrawMutation.mutate({
      amount: data.amount,
      description: data.description,
    });
  };

  const watchAmount = form.watch('amount');
  const showInsufficientWarning = wallet && watchAmount > wallet.balance;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('wallet.form.withdrawTitle')}</DialogTitle>
          <DialogDescription>
            {wallet && (
              <span className="text-sm">
                {t('wallet.form.currentBalance', { 
                  balance: formatLYD(wallet.balance).replace(' LYD', '')
                })}
              </span>
            )}
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
                  <FormLabel>{t('wallet.form.amount')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder={t('wallet.form.amountPlaceholder')}
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('wallet.form.description')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('wallet.form.descriptionPlaceholder')}
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('wallet.form.reference')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('wallet.form.referencePlaceholder')}
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
                {t('wallet.form.cancel')}
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || showInsufficientWarning}
              >
                {isSubmitting ? t('wallet.form.saving') : t('wallet.form.submit')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
