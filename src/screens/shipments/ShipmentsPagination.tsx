import type { ShipmentsPagination as PaginationType } from '@/types/shipment';

interface ShipmentsPaginationProps {
  pagination: PaginationType;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export function ShipmentsPagination(props: ShipmentsPaginationProps) {
  return <div>ShipmentsPagination - Coming in next phase</div>;
}
