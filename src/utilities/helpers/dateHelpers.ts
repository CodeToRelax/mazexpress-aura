import { format, parse } from 'date-fns';
import { enUS, ar } from 'date-fns/locale';

/**
 * Standard date format constants
 */
export const DATE_FORMATS = {
  DISPLAY: 'dd/MM/yyyy',           // 25/12/2024
  DISPLAY_TIME: 'dd/MM/yyyy HH:mm', // 25/12/2024 14:30
  ISO: "yyyy-MM-dd",                // 2024-12-25 (for API)
  FULL: 'dd/MM/yyyy HH:mm:ss',     // 25/12/2024 14:30:45
} as const;

/**
 * Get date-fns locale based on current language
 */
export const getDateLocale = (locale?: string) => {
  return locale === 'ar' ? ar : enUS;
};

/**
 * Format date to DD/MM/YYYY
 */
export const formatDate = (date: string | Date, locale?: string): string => {
  if (!date) return '';
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, DATE_FORMATS.DISPLAY, { locale: getDateLocale(locale) });
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

/**
 * Format date with time to DD/MM/YYYY HH:mm
 */
export const formatDateTime = (date: string | Date, locale?: string): string => {
  if (!date) return '';
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, DATE_FORMATS.DISPLAY_TIME, { locale: getDateLocale(locale) });
  } catch (error) {
    console.error('Error formatting date time:', error);
    return '';
  }
};

/**
 * Format date to ISO format (for API calls)
 */
export const formatDateISO = (date: Date): string => {
  if (!date) return '';
  try {
    return format(date, DATE_FORMATS.ISO);
  } catch (error) {
    console.error('Error formatting date to ISO:', error);
    return '';
  }
};

/**
 * Parse DD/MM/YYYY string to Date object
 */
export const parseDate = (dateString: string): Date | null => {
  if (!dateString) return null;
  try {
    return parse(dateString, DATE_FORMATS.DISPLAY, new Date());
  } catch (error) {
    console.error('Error parsing date:', error);
    return null;
  }
};

/**
 * Format date for CSV export
 */
export const formatDateForExport = (date: string | Date): string => {
  return formatDateTime(date);
};
