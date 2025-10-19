import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Wallet as WalletIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { processPayment } from '@/utilities/api/invoice.api';
import { getWalletByUserId } from '@/utilities/api/wallet.api';
import type { Invoice, ProcessPaymentRequest, PaymentSource } from '@/types/invoice';
import { formatLYD } from '@/utilities/helpers/currencyHelpers';

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice;
}

export function PaymentDialog({ open, onOpenChange, invoice }: PaymentDialogProps) {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [amount, setAmount] = useState<string>(invoice.totals.due.toString());
  const [reference, setReference] = useState<string>('');
  const [notes, setNotes] = useState('');

  // Extract customer user ID from invoice
  const customerId = typeof invoice.userId === 'string' 
    ? invoice.userId 
    : invoice.userId._id;

  const { data: walletData, isLoading: walletLoading, error: walletError } = useQuery({
    queryKey: ['wallet', customerId],
    queryFn: () => getWalletByUserId(customerId, i18n.language),
    enabled: open && !!customerId,
  });

  // Debug wallet query state
  console.log('PaymentDialog - Wallet Query:', {
    open,
    walletData,
    walletLoading,
    walletError,
    balance: walletData?.balance,
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
      setAmount(invoice.totals.due.toString());
      setReference('');
      setNotes('');
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

  const totalDue = invoice.totals.due;
  const paymentAmount = parseFloat(amount) || 0;
  const walletBalance = walletData?.balance || 0;
  const hasFullBalance = paymentAmount <= walletBalance;
  const isPartialPayment = !hasFullBalance && paymentAmount > 0;

  // Validation - allow partial payments
  const isValid = paymentAmount > 0 && paymentAmount <= totalDue;

  const handleSubmit = async () => {
    if (!isValid) return;
    
    setIsProcessing(true);
    try {
      const payload: ProcessPaymentRequest = {
        totalAmount: paymentAmount,
        paymentMethods: [{
          source: 'WALLET',
          amount: paymentAmount,
          reference: reference || undefined,
        }],
        notes: notes || undefined,
      };
      
      await mutation.mutateAsync(payload);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Process Payment</DialogTitle>
          <DialogDescription>
            Invoice #{invoice.invoiceNumber} - Total Due: {formatLYD(totalDue)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Wallet Balance Card */}
          <Card className="p-4 bg-primary/5">
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <WalletIcon className="h-5 w-5 text-primary" />
                <Label className="text-base font-semibold">Wallet Balance</Label>
              </div>
              <div className="flex justify-between text-sm">
                <span>Available Balance:</span>
                <span className="font-semibold text-lg">{formatLYD(walletBalance)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Invoice Amount Due:</span>
                <span className="font-semibold">{formatLYD(totalDue)}</span>
              </div>
              {isPartialPayment && (
                <div className="flex justify-between text-sm pt-2 border-t">
                  <span className="text-yellow-600">Will Process:</span>
                  <span className="font-semibold text-yellow-600">
                    Partial Payment ({formatLYD(Math.min(paymentAmount, walletBalance))})
                  </span>
                </div>
              )}
            </div>
          </Card>

          {/* Payment Amount Input */}
          <div className="space-y-2">
            <Label>Payment Amount (LYD)</Label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              max={totalDue}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
            />
            <p className="text-xs text-muted-foreground">
              Maximum: {formatLYD(totalDue)}
            </p>
          </div>

          {/* Reference Input */}
          <div className="space-y-2">
            <Label>Reference (Optional)</Label>
            <Input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g., Payment confirmation #123"
              maxLength={100}
            />
          </div>

          {/* Wallet Error Warning */}
          {walletError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Wallet Error</AlertTitle>
              <AlertDescription>
                Failed to load wallet balance. Please refresh and try again.
              </AlertDescription>
            </Alert>
          )}

          {/* Partial Payment Info */}
          {isPartialPayment && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Partial Payment</AlertTitle>
              <AlertDescription>
                Your wallet balance ({formatLYD(walletBalance)}) is less than the payment amount 
                ({formatLYD(paymentAmount)}). A partial payment of {formatLYD(Math.min(paymentAmount, walletBalance))} 
                will be processed.
              </AlertDescription>
            </Alert>
          )}

          {/* Notes Section */}
          <div className="space-y-2">
            <Label>Payment Notes (Optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this payment..."
              maxLength={500}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              {notes.length}/500 characters
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid || isProcessing || walletLoading || !!walletError}
          >
            {isProcessing 
              ? 'Processing...' 
              : hasFullBalance 
                ? `Process Full Payment (${formatLYD(paymentAmount)})`
                : `Process Partial Payment (${formatLYD(Math.min(paymentAmount, walletBalance))})`
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
