import type { IShipment } from '@/types/shipment';

interface DeleteShipmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shipment: IShipment;
  onSuccess: () => void;
}

export function DeleteShipmentDialog(props: DeleteShipmentDialogProps) {
  return null;
}
