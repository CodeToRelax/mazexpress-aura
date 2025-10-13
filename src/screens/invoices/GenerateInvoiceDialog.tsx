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
import type { User } from '@/types/user';

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
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('ready for pick up');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  const generateMutation = useMutation({
    mutationFn: (data: GenerateInvoiceRequest) => generateInvoice(data, i18n.language),
    onSuccess: (invoice) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
      toast({
        title: t('invoice.messages.generateSuccess'),
        description: t('invoice.messages.invoiceNumber', { number: invoice.invoiceNumber || 'DRAFT' }),
        variant: 'default',
      });
      onSuccess?.();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: t('invoice.messages.error'),
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
        description: t('invoice.messages.userRequired'),
        variant: 'destructive',
      });
      return;
    }
    
    if (mode === 'filter' && !selectedStatus) {
      toast({
        title: t('common.error'),
        description: t('invoice.messages.statusRequired'),
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
            {t('invoice.generateDialog.title')}
          </DialogTitle>
          <DialogDescription>
            {t('invoice.generateDialog.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {t('invoice.generateDialog.warning')}
            </AlertDescription>
          </Alert>

          {/* User Selection - Required when no userId prop */}
          {!userId && (
            <div className="space-y-2">
              <Label htmlFor="customer">
                {t('invoice.generateDialog.selectCustomer')} <span className="text-destructive">*</span>
              </Label>
              <UserSearchCombobox
                value={selectedUserId}
                onChange={(userId, user) => {
                  setSelectedUserId(userId);
                  setSelectedUser(user || null);
                }}
                disabled={isSubmitting}
                placeholder={t('invoice.generateDialog.selectCustomerPlaceholder')}
              />
              {selectedUser && (
                <p className="text-sm text-muted-foreground">
                  {selectedUser.email} • {selectedUser.uniqueShippingNumber}
                </p>
              )}
            </div>
          )}

          {!shipmentIds && (
            <div className="space-y-3">
              <Label>{t('invoice.generateDialog.mode.label')}</Label>
              <RadioGroup value={mode} onValueChange={(v) => setMode(v as 'filter' | 'specific')}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="filter" id="filter" />
                  <Label htmlFor="filter" className="font-normal cursor-pointer">
                    {t('invoice.generateDialog.mode.filter')}
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {mode === 'filter' ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="status">{t('invoice.generateDialog.filters.status')}</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder={t('invoice.generateDialog.filters.statusPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {SHIPMENT_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {t(`shipments.table.status.${status}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateFrom">{t('invoice.generateDialog.filters.dateFrom')}</Label>
                  <Input
                    id="dateFrom"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateTo">{t('invoice.generateDialog.filters.dateTo')}</Label>
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
                <span className="text-muted-foreground">{t('invoice.generateDialog.shipmentCount')}</span>
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
              {isSubmitting ? t('common.processing') : t('invoice.generateDialog.submit')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
