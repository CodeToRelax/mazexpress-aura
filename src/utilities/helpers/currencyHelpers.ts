/**
 * Currency Formatting Helpers
 * 
 * 📊 IMPORTANT NOTES:
 * ✅ Backend sends amounts as decimal numbers: 973.52 = 973.52 LYD
 * ✅ NO conversion needed - display values as-is with formatting
 * ✅ User enters: 125.50 → Send to backend: 125.50 (no conversion)
 */

/**
 * Formats amount for display with thousand separators
 * @param amount - Amount as decimal (e.g., 973.52)
 * @returns Formatted string with LYD suffix (e.g., "973.52 LYD")
 */
export function formatLYD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + ' LYD';
}

// Legacy alias for backward compatibility
export const formatLYDFromCents = formatLYD;
