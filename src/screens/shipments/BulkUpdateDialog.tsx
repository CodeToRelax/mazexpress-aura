import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, PackageCheck } from 'lucide-react';
import { useACL } from '@/hooks/useACL';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { shipmentsApi } from '@/utilities/api/shipments.api';
import { ShipmentStatus } from '@/types/shipment';
import { INTERNATIONAL_STATUSES } from '@/utilities/helpers/shipmentStatusHelpers';

interface BulkUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedShipmentIds: string[];
  onSuccess: () => void;
  isInternationalOnly?: boolean;
}

export function BulkUpdateDialog({ open, onOpenChange, selectedShipmentIds, onSuccess, isInternationalOnly = false }: BulkUpdateDialogProps) {
  const { t } = useTranslation();
  const { accessibleStatuses, isSuperAdmin } = useACL();
  const [selectedStatus, setSelectedStatus] = useState<ShipmentStatus | ''>('');
  const [selectedTier, setSelectedTier] = useState<'A' | 'B' | 'C' | 'D' | 'E' | ''>('');
  const [selectedOriginCountry, setSelectedOriginCountry] = useState<'libya' | 'turkey' | 'china' | 'uae' | ''>('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Filter statuses based on ACL and shipment type
  const availableStatuses = isInternationalOnly
    ? INTERNATIONAL_STATUSES
    : isSuperAdmin 
      ? Object.values(ShipmentStatus)
      : Object.values(ShipmentStatus).filter(status => accessibleStatuses.includes(status));

  const handleClose = () => {
    setSelectedStatus('');
    setSelectedTier('');
    setSelectedOriginCountry('');
    onOpenChange(false);
  };

  const handleConfirm = async () => {
    if (!selectedStatus && !selectedTier && !selectedOriginCountry) return;

    try {
      setIsUpdating(true);
      const payload: any = {
        shipmentsId: selectedShipmentIds,
      };
      
      if (selectedStatus) {
        payload.shipmentStatus = selectedStatus;
      }
      
      if (selectedTier) {
        payload.tier = selectedTier;
      }

      if (selectedOriginCountry) {
        payload.originCountry = selectedOriginCountry;
      }
      
      await shipmentsApi.bulkUpdateShipments(payload);
      toast({
        title: t('status.success'),
        description: t('shipments.messages.bulkUpdateSuccess', { count: selectedShipmentIds.length }),
      });
      handleClose();
      onSuccess();
    } catch (error) {
      toast({
        title: t('status.error'),
        description: error instanceof Error ? error.message : t('shipments.messages.error'),
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <PackageCheck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle>{t('shipments.bulkUpdate.title')}</DialogTitle>
              <DialogDescription>
                {t('shipments.bulkUpdate.description', { count: selectedShipmentIds.length })}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="status">{t('shipments.bulkUpdate.selectStatus')}</Label>
            <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as ShipmentStatus)}>
              <SelectTrigger id="status">
                <SelectValue placeholder={t('shipments.filters.allStatuses')} />
              </SelectTrigger>
              <SelectContent>
                {availableStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {t(`shipments.table.status.${status.replace(/ /g, '_')}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isInternationalOnly ? (
              <p className="text-xs text-muted-foreground">
                {t('shipments.bulkUpdate.internationalOnly')}
              </p>
            ) : !isSuperAdmin && availableStatuses.length < Object.values(ShipmentStatus).length && (
              <p className="text-xs text-muted-foreground">
                {t('acl.onlyAccessibleStatuses', { defaultValue: 'Showing only statuses you can set' })}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tier">{t('shipments.bulkUpdate.selectTier', { defaultValue: 'Update Tier (Optional)' })}</Label>
            <Select value={selectedTier} onValueChange={(value) => setSelectedTier(value as 'A' | 'B' | 'C' | 'D' | 'E')}>
              <SelectTrigger id="tier">
                <SelectValue placeholder={t('shipments.form.placeholders.tier', { defaultValue: 'Select tier' })} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A">{t('shipments.tier.a', { defaultValue: 'A - Standard' })}</SelectItem>
                <SelectItem value="B">{t('shipments.tier.b', { defaultValue: 'B - Premium' })}</SelectItem>
                <SelectItem value="C">{t('shipments.tier.c', { defaultValue: 'C - VIP' })}</SelectItem>
                <SelectItem value="D">{t('shipments.tier.d', { defaultValue: 'D - Enterprise' })}</SelectItem>
                <SelectItem value="E">{t('shipments.tier.e', { defaultValue: 'E - Ultimate' })}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="originCountry">{t('shipments.bulkUpdate.selectOriginCountry', { defaultValue: 'Update Origin Country (Optional)' })}</Label>
            <Select value={selectedOriginCountry} onValueChange={(value) => setSelectedOriginCountry(value as 'libya' | 'turkey' | 'china' | 'uae')}>
              <SelectTrigger id="originCountry">
                <SelectValue placeholder={t('shipments.form.placeholders.originCountry', { defaultValue: 'Select origin country' })} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="libya">{t('shipments.originCountry.libya', { defaultValue: 'Libya' })}</SelectItem>
                <SelectItem value="turkey">{t('shipments.originCountry.turkey', { defaultValue: 'Turkey' })}</SelectItem>
                <SelectItem value="china">{t('shipments.originCountry.china', { defaultValue: 'China' })}</SelectItem>
                <SelectItem value="uae">{t('shipments.originCountry.uae', { defaultValue: 'UAE' })}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="glass-card p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">
              {selectedShipmentIds.length} {selectedShipmentIds.length === 1 ? 'shipment' : 'shipments'} selected
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isUpdating}>
            {t('actions.cancel')}
          </Button>
          <Button onClick={handleConfirm} disabled={(!selectedStatus && !selectedTier && !selectedOriginCountry) || isUpdating}>
            {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {t('shipments.actions.bulkUpdate')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
