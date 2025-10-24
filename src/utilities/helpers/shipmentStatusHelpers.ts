import { ShipmentStatus } from '@/types/shipment';

export const INTERNATIONAL_STATUSES = [
  ShipmentStatus.RECEIVED_AT_WAREHOUSE,
  ShipmentStatus.SHIPPED_TO_DESTINATION,
  ShipmentStatus.READY_FOR_PICK_UP,
  ShipmentStatus.DELIVERED,
];

export const ALL_STATUSES: ShipmentStatus[] = Object.values(ShipmentStatus);

export function getAvailableStatuses(isDomestic: boolean): ShipmentStatus[] {
  return isDomestic ? ALL_STATUSES : [...INTERNATIONAL_STATUSES];
}

export function isValidStatusForShipmentType(
  status: ShipmentStatus,
  isDomestic: boolean
): boolean {
  const availableStatuses = getAvailableStatuses(isDomestic);
  return availableStatuses.includes(status);
}
