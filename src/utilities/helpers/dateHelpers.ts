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
 * Format date to DD/MM/YYYY for birthdate API submissions
 * Backend requires this specific format for birthdate fields
 */
export const formatDateForBirthdate = (date: Date): string => {
  if (!date) return '';
  try {
    return format(date, 'dd/MM/yyyy'); // DD/MM/YYYY format
  } catch (error) {
    console.error('Error formatting birthdate:', error);
    return '';
  }
};

/**
 * Format date for CSV export
 */
export const formatDateForExport = (date: string | Date): string => {
  return formatDateTime(date);
};

/**
 * Get date range from period (week, month, year)
 */
export const getDateRangeFromPeriod = (period: 'week' | 'month' | 'year' | 'today'): { startDate: string; endDate: string } => {
  const now = new Date();
  const endDate = formatDateISO(now);
  
  let startDate: Date;
  
  switch (period) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      break;
    case 'year':
      startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  }
  
  return {
    startDate: formatDateISO(startDate),
    endDate,
  };
};
