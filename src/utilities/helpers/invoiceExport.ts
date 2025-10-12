import { format } from 'date-fns';
import type { InvoiceFilters, Invoice } from '@/types/invoice';
import { getInvoices, getUserInvoices } from '@/utilities/api/invoice.api';
import { formatLYD } from './currencyHelpers';

/**
 * Formats a date to a human-readable string
 */
function formatDate(dateString: string): string {
  try {
    return format(new Date(dateString), 'MMM dd, yyyy');
  } catch {
    return dateString;
  }
}

/**
 * Gets user display name
 */
function getUserName(userId: Invoice['userId']): string {
  if (typeof userId === 'string') return userId;
  return `${userId.firstName} ${userId.lastName}`;
}

/**
 * Gets user email
 */
function getUserEmail(userId: Invoice['userId']): string {
  if (typeof userId === 'string') return '';
  return userId.email;
}

/**
 * Escapes CSV field values
 */
function escapeCSVField(field: string | number | undefined | null): string {
  if (field === undefined || field === null) return '';
  
  const stringField = String(field);
  
  // If field contains comma, newline, or quotes, wrap in quotes and escape quotes
  if (stringField.includes(',') || stringField.includes('\n') || stringField.includes('"')) {
    return `"${stringField.replace(/"/g, '""')}"`;
  }
  
  return stringField;
}

/**
 * Converts invoices array to CSV content
 */
function invoicesToCSV(invoices: Invoice[]): string {
  // CSV Headers
  const headers = [
    'Invoice Number',
    'User Name',
    'User Email',
    'Issue Date',
    'Due Date',
    'Status',
    'Net Amount',
    'Tax Amount',
    'Gross Amount',
    'Paid Amount',
    'Due Amount',
    'Created At',
  ];

  // CSV Rows
  const rows = invoices.map(invoice => [
    escapeCSVField(invoice.invoiceNumber),
    escapeCSVField(getUserName(invoice.userId)),
    escapeCSVField(getUserEmail(invoice.userId)),
    escapeCSVField(invoice.issueDate ? formatDate(invoice.issueDate) : '-'),
    escapeCSVField(formatDate(invoice.dueDate)),
    escapeCSVField(invoice.status),
    escapeCSVField(formatLYD(invoice.totals.net)),
    escapeCSVField(formatLYD(invoice.totals.tax)),
    escapeCSVField(formatLYD(invoice.totals.gross)),
    escapeCSVField(formatLYD(invoice.totals.paid)),
    escapeCSVField(formatLYD(invoice.totals.due)),
    escapeCSVField(formatDate(invoice.createdAt)),
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\r\n');

  // Add UTF-8 BOM for Excel compatibility
  return '\uFEFF' + csvContent;
}

/**
 * Generates filename for the CSV export
 */
function generateFilename(filters: InvoiceFilters, userId?: string): string {
  const timestamp = format(new Date(), 'yyyy-MM-dd-HHmmss');
  const statusFilter = filters.status ? `-${filters.status}` : '';
  const userPrefix = userId ? `user-${userId}-` : '';
  
  return `${userPrefix}invoices-export${statusFilter}-${timestamp}.csv`;
}

/**
 * Triggers browser download of CSV file
 */
function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

/**
 * Main export function - fetches all invoices and exports to CSV
 */
export async function exportInvoicesToCSV(
  filters: InvoiceFilters,
  locale?: string
): Promise<void> {
  try {
    // Fetch all invoices by paginating through results
    let allInvoices: Invoice[] = [];
    let currentPage = 1;
    let hasMore = true;
    const pageLimit = 100; // Use a reasonable page size
    
    while (hasMore) {
      const response = await getInvoices(
        { ...filters, limit: pageLimit, page: currentPage },
        locale
      );
      
      if (response.docs && response.docs.length > 0) {
        allInvoices = [...allInvoices, ...response.docs];
      }
      
      hasMore = response.hasNextPage ?? false;
      currentPage++;
    }
    
    if (allInvoices.length === 0) {
      throw new Error('No invoices found to export');
    }

    // Convert to CSV
    const csvContent = invoicesToCSV(allInvoices);
    
    // Generate filename and download
    const filename = generateFilename(filters);
    downloadCSV(csvContent, filename);
    
  } catch (error) {
    console.error('Failed to export invoices to CSV:', error);
    throw error;
  }
}

/**
 * Export invoices for a specific user
 */
export async function exportUserInvoicesToCSV(
  userId: string,
  filters: InvoiceFilters,
  locale?: string
): Promise<void> {
  try {
    // Fetch all user invoices by paginating through results
    let allInvoices: Invoice[] = [];
    let currentPage = 1;
    let hasMore = true;
    const pageLimit = 100; // Use a reasonable page size
    
    while (hasMore) {
      const response = await getUserInvoices(
        userId,
        { ...filters, limit: pageLimit, page: currentPage },
        locale
      );
      
      if (response.docs && response.docs.length > 0) {
        allInvoices = [...allInvoices, ...response.docs];
      }
      
      hasMore = response.hasNextPage ?? false;
      currentPage++;
    }
    
    if (allInvoices.length === 0) {
      throw new Error('No invoices found to export');
    }

    // Convert to CSV
    const csvContent = invoicesToCSV(allInvoices);
    
    // Generate filename and download
    const filename = generateFilename(filters, userId);
    downloadCSV(csvContent, filename);
    
  } catch (error) {
    console.error('Failed to export user invoices to CSV:', error);
    throw error;
  }
}
