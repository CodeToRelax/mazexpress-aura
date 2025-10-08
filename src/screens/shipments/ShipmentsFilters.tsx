import type { ShipmentFilters } from '@/types/shipment';

interface ShipmentsFiltersProps {
  filters: ShipmentFilters;
  onFiltersChange: (filters: ShipmentFilters) => void;
  onClearFilters: () => void;
  activeFilterCount: number;
}

export function ShipmentsFilters(props: ShipmentsFiltersProps) {
  return <div>ShipmentsFilters - Coming in next phase</div>;
}
