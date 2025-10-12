/**
 * Currency Formatting Helpers
 * Centralizes currency formatting logic for consistent display
 */

/**
 * Formats an amount in cents to LYD display format
 * @param amountInCents - The amount in cents (e.g., 500000 = 5,000.00 LYD)
 * @returns Formatted string with LYD suffix
 */
export function formatLYD(amountInCents: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amountInCents) + ' LYD';
}

/**
 * Converts LYD amount to cents for API
 * @param amountInLYD - The amount in LYD (e.g., 5000.00)
 * @returns Amount in cents
 */
export function toCents(amountInLYD: number): number {
  return Math.round(amountInLYD * 100);
}

/**
 * Converts cents to LYD amount
 * @param amountInCents - The amount in cents
 * @returns Amount in LYD
 */
export function fromCents(amountInCents: number): number {
  return amountInCents / 100;
}
