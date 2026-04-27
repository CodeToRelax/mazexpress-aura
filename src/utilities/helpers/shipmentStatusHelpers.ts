import { ShipmentStatus } from '@/types/shipment';

export const INTERNATIONAL_STATUSES = [
  ShipmentStatus.RECEIVED_AT_WAREHOUSE,
  ShipmentStatus.SHIPPED_TO_DESTINATION,
  ShipmentStatus.READY_FOR_PICK_UP,
  ShipmentStatus.DELIVERED,
];

export function getAvailableStatuses(): ShipmentStatus[] {
  return INTERNATIONAL_STATUSES;
}

export function isValidStatusForShipmentType(status: ShipmentStatus): boolean {
  return INTERNATIONAL_STATUSES.includes(status);
}
