import type { IShipment } from '@/types/shipment';

interface ShipmentsTableProps {
  shipments: IShipment[];
  selectedShipments: Set<string>;
  onSelectShipment: (id: string) => void;
  onSelectAll: (checked: boolean) => void;
  onEdit: (shipment: IShipment) => void;
  onDelete: (shipment: IShipment) => void;
}

export function ShipmentsTable(props: ShipmentsTableProps) {
  return <div>ShipmentsTable - Coming in next phase</div>;
}
