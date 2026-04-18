import type { IShipment, IShipmentSize } from '@/types/shipment';

/**
 * Normalizes shipment data from the API to handle old and new data formats
 * - Converts ISN "-" to undefined
 * - Handles missing optional fields
 * - Normalizes size data (0 dimensions -> undefined)
 */
export function normalizeShipment(raw: any): IShipment {
  return {
    ...raw,
    // Normalize ISN: "-" means no ISN
    isn: raw.isn === '-' || !raw.isn ? undefined : raw.isn,
    
    // Handle optional fields
    isDomestic: raw.isDomestic ?? undefined,
    updatedBy: raw.updatedBy ?? undefined,
    extraCosts: raw.extraCosts ?? 0,
    note: raw.note ?? undefined,
    estimatedArrival: raw.estimatedArrival ?? undefined,
    
    // Normalize tier: default to 'A' if not specified
    tier: raw.tier || 'A',
    
    // Normalize domestic shipment details
    domesticShipmentDetails: raw.domesticShipmentDetails || undefined,

    // Pass through optional pricingBreakdown from backend
    pricingBreakdown: raw.pricingBreakdown || undefined,

    // Normalize size data
    size: normalizeShipmentSize(raw.size),
  };
}

/**
 * Normalizes shipment size data
 * Converts 0 values to undefined for optional fields
 */
function normalizeShipmentSize(size: any): IShipmentSize {
  if (!size) {
    return {
      weight: 0,
      height: 0,
      width: 0,
      length: 0,
    };
  }

  return {
    weight: size.weight || undefined,
    height: size.height || undefined,
    width: size.width || undefined,
    length: size.length || undefined,
  } as IShipmentSize;
}

/**
 * Normalizes an array of shipments
 */
export function normalizeShipments(shipments: any[]): IShipment[] {
  return shipments.map(normalizeShipment);
}
