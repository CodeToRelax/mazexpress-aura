import type { ShipmentStats } from '@/types/shipment';

interface ShipmentsStatsBarProps {
  stats: ShipmentStats;
  onStatClick: (type: 'all' | 'pending' | 'inTransit' | 'delivered' | 'overdue') => void;
}

export function ShipmentsStatsBar(props: ShipmentsStatsBarProps) {
  return <div>ShipmentsStatsBar - Coming in next phase</div>;
}
