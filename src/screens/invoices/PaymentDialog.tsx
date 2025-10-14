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
import {
  AlertCircle, Plus, Trash2, DollarSign, Wallet as WalletIcon,
  Building2, CreditCard, MoreHorizontal, ArrowDownToLine, Split
} from 'lucide-react';
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

interface PaymentMethodRow {
  id: string;
  source: PaymentSource;
  amount: string;
  reference: string;
}

export function PaymentDialog({ open, onOpenChange, invoice }: PaymentDialogProps) {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [methods, setMethods] = useState<PaymentMethodRow[]>([
    { id: uuidv4(), source: 'CASH', amount: '', reference: '' }
  ]);
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
      setMethods([{ id: uuidv4(), source: 'CASH', amount: '', reference: '' }]);
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
  const currentTotal = methods.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0);
  const remaining = totalDue - currentTotal;

  // Get sources that are already used by other payment methods
  const getUsedSources = (excludeId?: string): PaymentSource[] => {
    return methods
      .filter(m => m.id !== excludeId)
      .map(m => m.source);
  };

  // Get available sources for a specific payment method row
  const getAvailableSources = (currentMethodId: string): PaymentSource[] => {
    const usedSources = getUsedSources(currentMethodId);
    const allSources: PaymentSource[] = ['CASH', 'WALLET', 'BANK_TRANSFER'];
    return allSources.filter(source => !usedSources.includes(source));
  };

  // Check if a specific source is available (not used by other rows)
  const isSourceAvailable = (source: PaymentSource, currentMethodId: string): boolean => {
    const usedSources = getUsedSources(currentMethodId);
    return !usedSources.includes(source);
  };

  const addPaymentMethod = () => {
    const usedSources = getUsedSources();
    const allSources: PaymentSource[] = ['CASH', 'WALLET', 'BANK_TRANSFER'];
    const availableSources = allSources.filter(source => !usedSources.includes(source));
    
    // Can't add if all 3 sources are used
    if (availableSources.length === 0) return;
    
    // Auto-select the first available source
    const newSource = availableSources[0];
    setMethods([...methods, { id: uuidv4(), source: newSource, amount: '', reference: '' }]);
  };

  const removePaymentMethod = (id: string) => {
    if (methods.length === 1) return;
    setMethods(methods.filter(m => m.id !== id));
  };

  const updatePaymentMethod = (id: string, field: keyof PaymentMethodRow, value: any) => {
    setMethods(methods.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const distributeEqually = () => {
    const perMethod = (totalDue / methods.length).toFixed(0);
    setMethods(methods.map(m => ({ ...m, amount: perMethod })));
  };

  const fillRemaining = (id: string) => {
    const otherTotal = methods
      .filter(m => m.id !== id)
      .reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0);
    
    const remainingAmount = Math.max(0, totalDue - otherTotal).toFixed(0);
    updatePaymentMethod(id, 'amount', remainingAmount);
  };

  const walletAmount = methods
    .filter(m => m.source === 'WALLET')
    .reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0);
  
  const walletBalance = walletData?.balance || 0;
  const showInsufficientWarning = walletAmount > walletBalance;
  
  const isValid = 
    Math.abs(remaining) < 1 && 
    !showInsufficientWarning && 
    methods.every(m => parseFloat(m.amount) > 0);

  const handleSubmit = async () => {
    if (!isValid) return;
    
    setIsProcessing(true);
    try {
      const payload: ProcessPaymentRequest = {
        totalAmount: totalDue,
        paymentMethods: methods.map(m => ({
          source: m.source,
          amount: parseFloat(m.amount),
          reference: m.reference || undefined,
        })),
        notes: notes || undefined,
      };
      
      await mutation.mutateAsync(payload);
    } finally {
      setIsProcessing(false);
    }
  };

  const getPaymentSourceIcon = (source: PaymentSource) => {
    switch (source) {
      case 'CASH': return DollarSign;
      case 'WALLET': return WalletIcon;
      case 'BANK_TRANSFER': return Building2;
      default: return DollarSign;
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
          {/* Payment Methods Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Payment Methods</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={distributeEqually}
                disabled={methods.length === 0}
              >
                <Split className="h-4 w-4 mr-2" />
                Distribute Equally
              </Button>
            </div>

            {methods.map((method) => (
              <Card key={method.id} className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  {/* Payment Source Selector */}
                  <div className="md:col-span-4">
                    <Label>Payment Source</Label>
                    <Select
                      value={method.source}
                      onValueChange={(value) => updatePaymentMethod(method.id, 'source', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-background">
                        <SelectItem 
                          value="CASH" 
                          disabled={!isSourceAvailable('CASH', method.id)}
                        >
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            Cash
                            {!isSourceAvailable('CASH', method.id) && (
                              <span className="text-xs text-muted-foreground">(Already used)</span>
                            )}
                          </div>
                        </SelectItem>
                        <SelectItem 
                          value="WALLET" 
                          disabled={!isSourceAvailable('WALLET', method.id) || walletLoading || !!walletError}
                        >
                          <div className="flex items-center gap-2">
                            <WalletIcon className="h-4 w-4" />
                            Wallet
                            {!isSourceAvailable('WALLET', method.id) ? (
                              <span className="text-xs text-muted-foreground">(Already used)</span>
                            ) : walletLoading ? (
                              <span className="text-xs text-muted-foreground">
                                (Loading...)
                              </span>
                            ) : walletError ? (
                              <span className="text-xs text-destructive">
                                (Error)
                              </span>
                            ) : walletData ? (
                              <span className="text-xs text-muted-foreground">
                                (Balance: {formatLYD(walletBalance)})
                              </span>
                            ) : null}
                          </div>
                        </SelectItem>
                        <SelectItem 
                          value="BANK_TRANSFER"
                          disabled={!isSourceAvailable('BANK_TRANSFER', method.id)}
                        >
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            Bank Transfer
                            {!isSourceAvailable('BANK_TRANSFER', method.id) && (
                              <span className="text-xs text-muted-foreground">(Already used)</span>
                            )}
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Amount Input */}
                  <div className="md:col-span-3">
                    <Label>Amount (LYD)</Label>
                    <div className="flex gap-1">
                      <Input
                        type="number"
                        step="1"
                        min="0"
                        value={method.amount}
                        onChange={(e) => updatePaymentMethod(method.id, 'amount', e.target.value)}
                        placeholder="0"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => fillRemaining(method.id)}
                        title="Fill remaining amount"
                      >
                        <ArrowDownToLine className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Reference Input */}
                  <div className="md:col-span-4">
                    <Label>Reference (Optional)</Label>
                    <Input
                      value={method.reference}
                      onChange={(e) => updatePaymentMethod(method.id, 'reference', e.target.value)}
                      placeholder="e.g., Receipt #123"
                      maxLength={100}
                    />
                  </div>

                  {/* Remove Button */}
                  <div className="md:col-span-1 flex items-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removePaymentMethod(method.id)}
                      disabled={methods.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={addPaymentMethod}
              className="w-full"
              disabled={getUsedSources().length >= 3}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Payment Method {getUsedSources().length >= 3 && '(All sources used)'}
            </Button>
          </div>

          {/* Total Summary */}
          <Card className={cn(
            "p-4",
            Math.abs(remaining) < 1 ? "border-green-500" : "border-yellow-500"
          )}>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Total Due:</span>
                <span className="font-semibold">{formatLYD(totalDue)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Current Total:</span>
                <span className={cn(
                  "font-semibold",
                  Math.abs(remaining) < 1 ? "text-green-600" : "text-yellow-600"
                )}>
                  {formatLYD(currentTotal)}
                </span>
              </div>
              {Math.abs(remaining) >= 1 && (
                <div className="flex justify-between text-sm">
                  <span>Remaining:</span>
                  <span className="font-semibold text-yellow-600">
                    {formatLYD(Math.abs(remaining))} {remaining > 0 ? '(underpaid)' : '(overpaid)'}
                  </span>
                </div>
              )}
            </div>
          </Card>

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

          {/* Wallet Insufficient Warning */}
          {showInsufficientWarning && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Insufficient Wallet Balance</AlertTitle>
              <AlertDescription>
                Wallet payment amount ({formatLYD(walletAmount)}) exceeds available balance 
                ({formatLYD(walletBalance)})
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
            disabled={!isValid || isProcessing}
          >
            {isProcessing ? 'Processing...' : `Process Payment (${formatLYD(totalDue)})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
