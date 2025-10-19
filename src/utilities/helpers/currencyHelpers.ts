/**
 * Currency Formatting Helpers
 * Centralizes currency formatting logic for consistent display
 */

/**
 * Formats an amount in LYD to display format with thousand separators
 * @param amountInLYD - The amount in LYD (e.g., 5000.55 = 5,000.55 LYD)
 * @returns Formatted string with LYD suffix
 */
export function formatLYD(amountInLYD: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountInLYD) + ' LYD';
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

/**
 * Converts cents to LYD and formats for display
 * @param amountInCents - The amount in cents
 * @returns Formatted string with LYD suffix
 */
export function formatLYDFromCents(amountInCents: number): string {
  return formatLYD(fromCents(amountInCents));
}
