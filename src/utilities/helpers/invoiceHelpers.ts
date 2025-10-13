/**
 * Invoice Helper Utilities
 * Functions for parsing and formatting invoice data
 */

export interface ParsedInvoiceItem {
  baseDescription: string;
  shipmentCode?: string;
  location?: string;
  weight?: string;
  cbm?: string;
}

/**
 * Parse invoice item description to extract structured data
 * Example: "Shipment MAZ-ABC123 - tripoli (Weight: 5kg, CBM: 0.024m³)"
 */
export function parseInvoiceItemDescription(description: string): ParsedInvoiceItem {
  const shipmentMatch = description.match(/Shipment\s+([A-Z0-9-]+)/i);
  const locationMatch = description.match(/-\s+([a-zA-Z\s]+)\s*\(/i);
  const weightMatch = description.match(/Weight:\s*([\d.]+)\s*kg/i);
  const cbmMatch = description.match(/CBM:\s*([\d.]+)\s*m³/i);
  
  return {
    baseDescription: description,
    shipmentCode: shipmentMatch?.[1],
    location: locationMatch?.[1]?.trim(),
    weight: weightMatch?.[1],
    cbm: cbmMatch?.[1],
  };
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
