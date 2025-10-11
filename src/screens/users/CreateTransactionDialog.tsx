import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { adminTransactionSchema, type AdminTransactionInput } from '@/utilities/zod/wallet.schemas';
import { processTransaction } from '@/utilities/api/wallet.api';
import { toast } from '@/hooks/use-toast';

interface CreateTransactionDialogProps {
  open: boolean;
  onClose: () => void;
  walletId?: string;
  onSuccess: () => void;
}

export function CreateTransactionDialog({
  open,
  onClose,
  walletId,
  onSuccess,
}: CreateTransactionDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AdminTransactionInput>({
    resolver: zodResolver(adminTransactionSchema),
    defaultValues: {
      walletId: walletId || '',
      type: 'DEPOSIT',
      amount: '' as any,
      description: '',
      reference: '',
    },
  });

  const onSubmit = async (data: AdminTransactionInput) => {
    if (!walletId) {
      toast({
        title: 'Error',
        description: 'Wallet ID is missing',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        walletId,
        type: data.type,
        amount: data.amount,
        description: data.description,
        reference: data.reference,
      };
      await processTransaction(payload);
      toast({
        title: 'Success',
        description: 'Transaction created successfully',
      });
      form.reset();
      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create transaction',
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
          <DialogDescription>
            Create a new transaction for this wallet (deposit, withdrawal, deduction, or refund)
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select transaction type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="DEPOSIT">Deposit</SelectItem>
                      <SelectItem value="WITHDRAWAL">Withdrawal</SelectItem>
                      <SelectItem value="DEDUCTION">Deduction</SelectItem>
                      <SelectItem value="REFUND">Refund</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (LYD)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
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
                Create Transaction
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
