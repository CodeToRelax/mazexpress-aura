import type { IShipment } from '@/types/shipment';

interface EditShipmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shipment: IShipment;
  onSuccess: () => void;
}

export function EditShipmentDialog(props: EditShipmentDialogProps) {
  return null;
}
