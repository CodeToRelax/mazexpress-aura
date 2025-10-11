import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Badge } from '@/components/ui/badge';
import type { Transaction } from '@/types/wallet';
import { updateTransaction } from '@/utilities/api/wallet.api';
import { toast } from '@/hooks/use-toast';
import { formatLYD } from '@/utilities/helpers/currencyHelpers';

const editTransactionSchema = z.object({
  description: z.string().min(3, 'Description must be at least 3 characters').max(200),
  reference: z.string().optional(),
});

type EditTransactionInput = z.infer<typeof editTransactionSchema>;

interface EditTransactionDialogProps {
  open: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  onSuccess: () => void;
}

export function EditTransactionDialog({
  open,
  onClose,
  transaction,
  onSuccess,
}: EditTransactionDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<EditTransactionInput>({
    resolver: zodResolver(editTransactionSchema),
    defaultValues: {
      description: '',
      reference: '',
    },
  });

  useEffect(() => {
    if (transaction) {
      form.reset({
        description: transaction.description,
        reference: transaction.reference || '',
      });
    }
  }, [transaction, form]);

  const onSubmit = async (data: EditTransactionInput) => {
    if (!transaction) return;

    setIsSubmitting(true);
    try {
      await updateTransaction(transaction._id, data);
      toast({
        title: 'Success',
        description: 'Transaction updated successfully',
      });
      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update transaction',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  if (!transaction) return null;

  const getTypeVariant = (type: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      DEPOSIT: 'default',
      WITHDRAWAL: 'secondary',
      DEDUCTION: 'destructive',
      REFUND: 'default',
    };
    return variants[type] || 'default';
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Transaction</DialogTitle>
          <DialogDescription>
            Update the description and reference for this transaction
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4 border-y">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Transaction Number</span>
            <span className="font-mono text-sm">{transaction.transactionNumber}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Type</span>
            <Badge variant={getTypeVariant(transaction.type)}>{transaction.type}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Amount</span>
            <span className="font-semibold">
              {formatLYD(transaction.amount)}
            </span>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter transaction description"
                      className="resize-none"
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
                    <Input placeholder="Reference number or ID" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
