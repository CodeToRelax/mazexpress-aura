import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
import { toast } from '@/hooks/use-toast';
import { deposit } from '@/utilities/api/wallet.api';
import { depositSchema, type DepositInput } from '@/utilities/zod/wallet.schemas';
import type { Wallet } from '@/types/wallet';
import { formatLYD, parseInputToWholeUnits } from '@/utilities/helpers/currencyHelpers';

interface DepositDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wallet: Wallet | null;
}

export function DepositDialog({ open, onOpenChange, wallet }: DepositDialogProps) {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<DepositInput>({
    resolver: zodResolver(depositSchema),
    defaultValues: {
      amount: 100,
      description: '',
      reference: '',
    },
  });

  const depositMutation = useMutation({
    mutationFn: (data: { amount: number; description: string }) => deposit(data, i18n.language),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast({
        title: t('wallet.messages.depositSuccess'),
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

  const onSubmit = (data: DepositInput) => {
    setIsSubmitting(true);
    depositMutation.mutate({
      amount: parseInputToWholeUnits(data.amount),
      description: data.description,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('wallet.form.depositTitle')}</DialogTitle>
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
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t('wallet.form.saving') : t('wallet.form.submit')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
