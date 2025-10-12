import { format } from 'date-fns';
import type { TransactionFilters, Transaction } from '@/types/wallet';
import { getTransactions, getUserTransactions } from '@/utilities/api/wallet.api';
import { formatLYD } from './currencyHelpers';

/**
 * Formats a date to a human-readable string
 */
function formatDate(dateString: string): string {
  try {
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
  } catch {
    return dateString;
  }
}

/**
 * Formats transaction type
 */
function formatType(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

/**
 * Formats transaction status
 */
function formatStatus(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
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
 * Converts transactions array to CSV content
 */
function transactionsToCSV(transactions: Transaction[]): string {
  // CSV Headers
  const headers = [
    'Transaction Number',
    'Type',
    'Description',
    'Amount',
    'Balance Before',
    'Balance After',
    'Status',
    'Reference',
    'Date',
  ];

  // CSV Rows
  const rows = transactions.map(transaction => [
    escapeCSVField(transaction.transactionNumber),
    escapeCSVField(formatType(transaction.type)),
    escapeCSVField(transaction.description),
    escapeCSVField(formatLYD(transaction.amount)),
    escapeCSVField(formatLYD(transaction.balanceBefore)),
    escapeCSVField(formatLYD(transaction.balanceAfter)),
    escapeCSVField(formatStatus(transaction.status)),
    escapeCSVField(transaction.reference || '-'),
    escapeCSVField(formatDate(transaction.createdAt)),
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
function generateFilename(filters: TransactionFilters, userId?: string): string {
  const timestamp = format(new Date(), 'yyyy-MM-dd-HHmmss');
  const typeFilter = filters.type ? `-${filters.type}` : '';
  const statusFilter = filters.status ? `-${filters.status}` : '';
  const userPrefix = userId ? `user-${userId}-` : '';
  
  return `${userPrefix}transactions-export${typeFilter}${statusFilter}-${timestamp}.csv`;
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
 * Main export function - fetches all transactions and exports to CSV
 */
export async function exportTransactionsToCSV(
  filters: TransactionFilters,
  locale?: string
): Promise<void> {
  try {
    // Fetch all transactions matching the filters with a high limit
    const allTransactionsResponse = await getTransactions(
      { ...filters, limit: 10000, page: 1 },
      locale
    );
    
    if (!allTransactionsResponse.docs || allTransactionsResponse.docs.length === 0) {
      throw new Error('No transactions found to export');
    }

    // Convert to CSV
    const csvContent = transactionsToCSV(allTransactionsResponse.docs);
    
    // Generate filename and download
    const filename = generateFilename(filters);
    downloadCSV(csvContent, filename);
    
  } catch (error) {
    console.error('Failed to export transactions to CSV:', error);
    throw error;
  }
}

/**
 * Export transactions for a specific user
 */
export async function exportUserTransactionsToCSV(
  userId: string,
  filters: TransactionFilters,
  locale?: string
): Promise<void> {
  try {
    // Fetch all user transactions matching the filters with a high limit
    const allTransactionsResponse = await getUserTransactions(
      userId,
      { ...filters, limit: 10000, page: 1 },
      locale
    );
    
    if (!allTransactionsResponse.docs || allTransactionsResponse.docs.length === 0) {
      throw new Error('No transactions found to export');
    }

    // Convert to CSV
    const csvContent = transactionsToCSV(allTransactionsResponse.docs);
    
    // Generate filename and download
    const filename = generateFilename(filters, userId);
    downloadCSV(csvContent, filename);
    
  } catch (error) {
    console.error('Failed to export user transactions to CSV:', error);
    throw error;
  }
}
