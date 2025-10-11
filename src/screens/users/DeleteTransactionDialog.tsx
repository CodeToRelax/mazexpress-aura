import { useState } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Transaction } from '@/types/wallet';
import { deleteTransaction } from '@/utilities/api/wallet.api';
import { toast } from '@/hooks/use-toast';
import { formatLYD } from '@/utilities/helpers/currencyHelpers';
import { format } from 'date-fns';

interface DeleteTransactionDialogProps {
  open: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  onSuccess: () => void;
}

export function DeleteTransactionDialog({
  open,
  onClose,
  transaction,
  onSuccess,
}: DeleteTransactionDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!transaction) return;

    setIsDeleting(true);
    try {
      await deleteTransaction(transaction._id);
      toast({
        title: 'Success',
        description: 'Transaction deleted successfully',
      });
      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete transaction',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
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
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            Are you sure you want to delete this transaction? This action cannot be undone and may affect financial records.
          </AlertDialogDescription>
        </AlertDialogHeader>

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
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Date</span>
            <span className="text-sm">
              {format(new Date(transaction.createdAt), 'MMM dd, yyyy HH:mm')}
            </span>
          </div>
          <div className="space-y-1">
            <span className="text-sm text-muted-foreground">Description</span>
            <p className="text-sm">{transaction.description}</p>
          </div>
        </div>

        <AlertDialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete Transaction
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
