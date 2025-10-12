import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Transaction } from '@/types/wallet';
import { processTransaction } from '@/utilities/api/wallet.api';
import { useToast } from '@/hooks/use-toast';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCcw } from 'lucide-react';
import { formatLYD } from '@/utilities/helpers/currencyHelpers';
import { Badge } from '@/components/ui/badge';

const refundSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  description: z.string().min(1, 'Description is required'),
  reference: z.string().optional(),
});

type RefundFormValues = z.infer<typeof refundSchema>;

interface RefundTransactionDialogProps {
  transaction: Transaction | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function RefundTransactionDialog({
  transaction,
  open,
  onClose,
  onSuccess,
}: RefundTransactionDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<RefundFormValues>({
    resolver: zodResolver(refundSchema),
    defaultValues: {
      amount: transaction?.amount || 0,
      description: `Refund for: ${transaction?.description || ''}`,
      reference: transaction?.reference || '',
    },
  });

  // Reset form when transaction changes
  useState(() => {
    if (transaction) {
      form.reset({
        amount: transaction.amount,
        description: `Refund for: ${transaction.description}`,
        reference: transaction.reference || '',
      });
    }
  });

  const onSubmit = async (data: RefundFormValues) => {
    if (!transaction) return;

    setIsSubmitting(true);
    try {
      const walletId = typeof transaction.walletId === 'string' 
        ? transaction.walletId 
        : transaction.walletId._id;

      await processTransaction({
        walletId,
        type: 'refund',
        amount: data.amount,
        description: data.description,
        reference: data.reference,
      });

      toast({
        title: 'Success',
        description: 'Refund processed successfully',
      });

      form.reset();
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error processing refund:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to process refund',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!transaction) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCcw className="h-5 w-5 text-blue-600" />
            Process Refund
          </DialogTitle>
          <DialogDescription>
            Create a refund for this deduction transaction
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Original Transaction</p>
              <p className="font-mono text-xs mt-1">{transaction.transactionNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Deducted Amount</p>
              <p className="font-semibold text-orange-600">
                -{formatLYD(transaction.amount)}
              </p>
            </div>
          </div>

          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm font-medium mb-1">Original Description</p>
            <p className="text-sm text-muted-foreground">{transaction.description}</p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Refund Amount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter refund amount"
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
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter refund description"
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
                  <FormLabel>Reference (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter reference number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Process Refund
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
