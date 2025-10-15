import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { generateInvoice } from '@/utilities/api/invoice.api';
import { UserSearchCombobox } from '@/components/invoices/UserSearchCombobox';
import type { GenerateInvoiceRequest } from '@/types/invoice';

interface GenerateInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId?: string;
  shipmentIds?: string[];
  onSuccess?: () => void;
}

const SHIPMENT_STATUSES = [
  'ready for pick up',
  'received at warehouse',
  'in transit',
  'shipped to destination',
  'delivered',
] as const;

export function GenerateInvoiceDialog({ 
  open, 
  onOpenChange, 
  userId,
  shipmentIds,
  onSuccess,
}: GenerateInvoiceDialogProps) {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState<'filter' | 'specific'>(shipmentIds ? 'specific' : 'filter');
  const [selectedUserId, setSelectedUserId] = useState<string>(userId || '');
  const [selectedStatus, setSelectedStatus] = useState<string>('ready for pick up');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  const generateMutation = useMutation({
    mutationFn: (data: GenerateInvoiceRequest) => generateInvoice(data, i18n.language),
    onSuccess: (invoice) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
      toast({
        title: t('invoice.message-generateSuccess'),
        description: t('invoice.message-invoiceNumber', { number: invoice.invoiceNumber || 'DRAFT' }),
        variant: 'default',
      });
      onSuccess?.();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: t('invoice.message-error'),
        description: error.message,
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const handleGenerate = () => {
    const targetUserId = userId || selectedUserId;
    
    if (!targetUserId) {
      toast({
        title: t('common.error'),
        description: t('invoice.message-userRequired'),
        variant: 'destructive',
      });
      return;
    }
    
    if (mode === 'filter' && !selectedStatus) {
      toast({
        title: t('common.error'),
        description: t('invoice.message-statusRequired'),
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    const payload: GenerateInvoiceRequest = {
      userId: targetUserId,
      ...(mode === 'specific' && shipmentIds ? { shipmentIds } : {}),
      ...(mode === 'filter' ? {
        shipmentStatus: selectedStatus,
        ...(dateFrom ? { dateFrom } : {}),
        ...(dateTo ? { dateTo } : {}),
      } : {}),
    };
    
    generateMutation.mutate(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t('invoice.generate-title')}
          </DialogTitle>
          <DialogDescription>
            {t('invoice.generate-description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {t('invoice.generate-warning')}
            </AlertDescription>
          </Alert>

          {/* User Selection - Required when no userId prop */}
          {!userId && (
            <div className="space-y-2">
              <Label htmlFor="customer">
                {t('invoice.generate-selectCustomer')} <span className="text-destructive">*</span>
              </Label>
              <UserSearchCombobox
                value={selectedUserId}
                onChange={(userId) => setSelectedUserId(userId)}
                disabled={isSubmitting}
                placeholder={t('invoice.generate-selectCustomerPlaceholder')}
              />
            </div>
          )}

          {!shipmentIds && (
            <div className="space-y-3">
              <Label>{t('invoice.generate-modeLabel')}</Label>
              <RadioGroup value={mode} onValueChange={(v) => setMode(v as 'filter' | 'specific')}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="filter" id="filter" />
                  <Label htmlFor="filter" className="font-normal cursor-pointer">
                    {t('invoice.generate-modeFilter')}
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {mode === 'filter' ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="status">{t('invoice.generate-filterStatus')}</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder={t('invoice.generate-filterStatusPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {SHIPMENT_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {t(`shipments.table.status.${status.replace(/ /g, '_')}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateFrom">{t('invoice.generate-filterDateFrom')}</Label>
                  <Input
                    id="dateFrom"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateTo">{t('invoice.generate-filterDateTo')}</Label>
                  <Input
                    id="dateTo"
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('invoice.generate-shipmentCount')}</span>
                <span className="font-medium">{shipmentIds?.length || 0}</span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {t('common.cancel')}
            </Button>
            <Button 
              onClick={handleGenerate}
              disabled={
                isSubmitting || 
                (!userId && !selectedUserId) ||
                (mode === 'specific' && (!shipmentIds || shipmentIds.length === 0)) ||
                (mode === 'filter' && !selectedStatus)
              }
            >
              {isSubmitting ? t('common.processing') : t('invoice.generate-submit')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
