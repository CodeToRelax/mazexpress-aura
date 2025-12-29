import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, AlertTriangle, ArrowLeftRight, FileText, CreditCard, Undo2 } from 'lucide-react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  const { t } = useTranslation();
  const [isDeleting, setIsDeleting] = useState(false);

  const isCompleted = transaction?.status === 'completed';
  const hasInvoice = !!transaction?.invoiceId;
  const isDeduction = transaction?.type === 'deduction';

  const handleDelete = async () => {
    if (!transaction) return;

    setIsDeleting(true);
    try {
      const result = await deleteTransaction(transaction._id, isCompleted);
      
      // Show success with balance change info
      const balanceMsg = result.balanceReversed 
        ? ` ${t('wallet.transaction.balanceAdjusted')} ${formatLYD(result.balanceChange)}`
        : '';
      
      toast({
        title: t('wallet.transaction.deleteSuccess'),
        description: `${t('wallet.transaction.newBalance')}: ${formatLYD(result.newWalletBalance)}${balanceMsg}`,
      });
      onSuccess();
    } catch (error: any) {
      // Handle specific error codes
      const errorMessage = error.message || '';
      
      if (errorMessage.includes('TRANSACTION_DELETE_NEGATIVE_BALANCE') || 
          errorMessage.includes('negative wallet balance')) {
        toast({
          title: t('errors.auth.unknown'),
          description: t('wallet.transaction.negativeBalanceError'),
          variant: 'destructive',
        });
      } else if (errorMessage.includes('TRANSACTION_DELETE_REQUIRES_FORCE')) {
        toast({
          title: t('errors.auth.unknown'),
          description: t('wallet.transaction.forceRequired'),
          variant: 'destructive',
        });
      } else {
        toast({
          title: t('errors.auth.unknown'),
          description: errorMessage || t('wallet.messages.error'),
          variant: 'destructive',
        });
      }
    } finally {
      setIsDeleting(false);
    }
  };

  if (!transaction) return null;

  const getTypeVariant = (type: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      deposit: 'default',
      withdrawal: 'secondary',
      deduction: 'destructive',
      refund: 'default',
      transfer: 'secondary',
    };
    return variants[type.toLowerCase()] || 'default';
  };

  const getStatusVariant = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      completed: 'default',
      pending: 'secondary',
      failed: 'destructive',
      cancelled: 'outline',
    };
    return variants[status] || 'default';
  };

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <AlertDialogTitle>{t('wallet.transaction.deleteConfirmTitle')}</AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            {t('wallet.transaction.deleteConfirmMessage')}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Completed transaction warning */}
        {isCompleted && (
          <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {t('wallet.transaction.completedWarning')}
            </AlertDescription>
          </Alert>
        )}

        {/* Transaction details */}
        <div className="space-y-3 py-4 border-y">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t('wallet.table.columns.transactionNumber')}</span>
            <span className="font-mono text-sm">{transaction.transactionNumber}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t('wallet.table.columns.type')}</span>
            <Badge variant={getTypeVariant(transaction.type)}>
              {t(`wallet.transaction.type.${transaction.type}`)}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t('wallet.table.columns.status')}</span>
            <Badge variant={getStatusVariant(transaction.status)}>
              {t(`wallet.transaction.status.${transaction.status}`)}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t('wallet.table.columns.amount')}</span>
            <span className="font-semibold">{formatLYD(transaction.amount)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t('wallet.table.columns.date')}</span>
            <span className="text-sm">
              {format(new Date(transaction.createdAt), 'MMM dd, yyyy HH:mm')}
            </span>
          </div>
        </div>

        {/* Cascade effects section */}
        <div className="space-y-2">
          <p className="text-sm font-medium">{t('wallet.transaction.cascadeEffects')}</p>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Undo2 className="h-4 w-4 text-orange-500" />
              <span>
                {t('wallet.transaction.reverseBalance')} <strong>{formatLYD(transaction.amount)}</strong>
              </span>
            </div>
            
            {hasInvoice && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <FileText className="h-4 w-4 text-blue-500" />
                <span>{t('wallet.transaction.updateInvoice')}</span>
              </div>
            )}
            
            {isDeduction && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <CreditCard className="h-4 w-4 text-purple-500" />
                <span>{t('wallet.transaction.removePayment')}</span>
              </div>
            )}
          </div>
        </div>

        <AlertDialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            {t('actions.cancel')}
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isCompleted ? t('wallet.transaction.forceDelete') : t('wallet.transaction.delete')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
