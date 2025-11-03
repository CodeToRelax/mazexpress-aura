import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import { shipmentsApi } from '@/utilities/api/shipments.api';
import { ShipmentStatus } from '@/types/shipment';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

interface QuickStatusUpdateProps {
  shipmentId: string;
  currentStatus: string;
  isDomestic: boolean;
  onSuccess?: () => void;
  className?: string;
}

export function QuickStatusUpdate({ shipmentId, currentStatus, isDomestic, onSuccess, className }: QuickStatusUpdateProps) {
  const { t } = useTranslation();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === currentStatus) return;

    try {
      setIsUpdating(true);
      await shipmentsApi.updateShipmentStatus(shipmentId, newStatus as ShipmentStatus);
      
      toast({
        title: t('status.success'),
        description: t('shipments.messages.updateSuccess', { defaultValue: 'Status updated successfully' }),
      });

      onSuccess?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update status';
      toast({
        title: t('status.error'),
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const statuses = isDomestic
    ? [
        ShipmentStatus.RECEIVED_AT_WAREHOUSE,
        ShipmentStatus.IN_TRANSIT,
        ShipmentStatus.SHIPPED_TO_DESTINATION,
        ShipmentStatus.READY_FOR_PICK_UP,
        ShipmentStatus.DELIVERED,
        ShipmentStatus.CANCELLED,
        ShipmentStatus.RETURNED,
      ]
    : [
        ShipmentStatus.RECEIVED_AT_WAREHOUSE,
        ShipmentStatus.SHIPPED_TO_DESTINATION,
        ShipmentStatus.READY_FOR_PICK_UP,
        ShipmentStatus.DELIVERED,
      ];

  return (
    <Select
      value={currentStatus}
      onValueChange={handleStatusChange}
      disabled={isUpdating}
    >
      <SelectTrigger className={cn('w-[200px]', className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {statuses.map((status) => (
          <SelectItem key={status} value={status}>
            <div className="flex items-center">
              {status === currentStatus && <Check className="h-4 w-4 mr-2 text-primary" />}
              <span className={cn(status !== currentStatus && 'ml-6')}>
                {t(`shipments.table.status.${status.replace(/ /g, '_')}`)}
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
