/**
 * Currency Formatting Helpers
 * Centralizes currency formatting logic for consistent display
 * 
 * 📊 IMPORTANT NOTES:
 * ✅ All amounts are in WHOLE CURRENCY UNITS (not cents)
 * ✅ 12500 = 12,500.00 LYD (not 125.00 or 12500 cents)
 * ✅ 9900 = 9,900.00 LYD (not 99.00 or 9900 cents)
 * ✅ 5000 = 5,000.00 LYD (not 50.00 or 5000 cents)
 */

/**
 * Formats a whole unit amount to display with decimals
 * @param wholeUnits - Amount in whole units (e.g., 12500 = 12,500.00 LYD)
 * @returns Formatted string with LYD suffix
 */
export function formatLYD(wholeUnits: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(wholeUnits / 100) + ' LYD';
}

/**
 * @deprecated Use formatLYD() - Backend uses whole units, not cents
 * Kept for backward compatibility during migration
 */
export function formatLYDFromCents(wholeUnits: number): string {
  return formatLYD(wholeUnits);
}

/**
 * Converts user decimal input to whole units for backend
 * @param userInput - User-entered amount like 125.50
 * @returns Whole units (12550)
 */
export function parseInputToWholeUnits(userInput: number): number {
  return Math.round(userInput * 100);
}

/**
 * Converts whole units to decimal for display/editing
 * @param wholeUnits - Amount in whole units (12550)
 * @returns Decimal amount (125.50)
 */
export function parseWholeUnitsToInput(wholeUnits: number): number {
  return wholeUnits / 100;
}

/**
 * @deprecated Backend uses whole units, not cents
 */
export function toCents(amountInLYD: number): number {
  return Math.round(amountInLYD * 100);
}

/**
 * @deprecated Backend uses whole units, not cents
 */
export function fromCents(amountInCents: number): number {
  return amountInCents / 100;
}
