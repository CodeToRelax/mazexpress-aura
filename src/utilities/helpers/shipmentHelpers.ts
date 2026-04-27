import type { IShipment } from '@/types/shipment';

/**
 * Normalize shipment data from backend
 * Handles various data format inconsistencies
 */
export const normalizeShipment = (shipment: any): IShipment => ({
  ...shipment,
  isn: shipment.isn === '-' ? undefined : shipment.isn,
  updatedBy: shipment.updatedBy || undefined,
  // Backend uses spaces in status values
  status: shipment.status,
});

/**
 * Format status value for display
 * Converts status to title case for better readability
 */
export const formatStatus = (status: string): string => {
  return status
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Get status translation key
 * Converts status with spaces to dot notation for i18n
 */
export const getStatusTranslationKey = (status: string): string => {
  return `shipments.status.${status.toLowerCase().replace(/ /g, '_')}`;
};

/**
 * Get city translation key
 */
export const getCityTranslationKey = (city: string): string => {
  return `shipments.cities.${city.toLowerCase().replace(/ /g, '_')}`;
};

/**
 * Format city name for display
 * Converts enum values to proper title case
 * Examples:
 * - "benghazi" → "Benghazi"
 * - "al bayda" → "Al Bayda"
 * - "ras al khaimah" → "Ras Al Khaimah"
 */
export const formatCityName = (city: string | undefined): string => {
  if (!city) return '-';
  
  return city
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Get shipping method translation key
 */
export const getMethodTranslationKey = (method: string): string => {
  return `shipments.method.${method.toLowerCase()}`;
};

/**
 * Validate ESN format (supports both old and new formats)
 */
export const isValidESN = (esn: string): boolean => {
  // New format: ABC-123456 (alphanumeric)
  // Old format: 1234567890 (10 digits)
  return /^([A-Z]{3}-[A-Z0-9]{6,8}|\d{10})$/.test(esn);
};

/**
 * Format ESN for display
 */
export const formatESN = (esn: string): string => {
  // If it's a 10-digit number, format with dashes for readability
  if (/^\d{10}$/.test(esn)) {
    return `${esn.slice(0, 3)}-${esn.slice(3, 6)}-${esn.slice(6)}`;
  }
  return esn;
};

/**
 * Calculate volumetric weight (dimensional weight)
 * Formula: (L × W × H) / 5000
 */
export const calculateVolumetricWeight = (
  length: number,
  width: number,
  height: number
): number => {
  return Math.round((length * width * height) / 5000 * 100) / 100;
};
