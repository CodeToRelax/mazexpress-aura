import * as XLSX from 'xlsx';
import { Invoice } from '@/types/invoice';
import { format } from 'date-fns';
import { formatCurrency } from './invoiceHelpers';

/**
 * Export invoices to Excel file
 */
export function exportInvoicesToExcel(invoices: Invoice[], filename?: string): void {
  // Prepare data for Excel
  const excelData = invoices.map(invoice => {
    const userId = typeof invoice.userId === 'object' ? invoice.userId : null;
    
    return {
      'Invoice Number': invoice.invoiceNumber || 'DRAFT',
      'Customer Name': userId ? `${userId.firstName} ${userId.lastName}` : 'N/A',
      'Customer Email': userId?.email || 'N/A',
      'Shipping Number': userId?.uniqueShippingNumber || 'N/A',
      'Status': invoice.status,
      'Issue Date': invoice.issueDate ? format(new Date(invoice.issueDate), 'yyyy-MM-dd') : 'N/A',
      'Due Date': format(new Date(invoice.dueDate), 'yyyy-MM-dd'),
      'Currency': invoice.currency || 'LYD',
      'Net Amount': invoice.totals.net / 100,
      'Tax Amount': invoice.totals.tax / 100,
      'Gross Amount': invoice.totals.gross / 100,
      'Paid Amount': invoice.totals.paid / 100,
      'Due Amount': invoice.totals.due / 100,
      'Items Count': invoice.items?.length || 0,
      'Notes': invoice.notes || '',
      'Created At': format(new Date(invoice.createdAt), 'yyyy-MM-dd HH:mm'),
    };
  });
  
  // Create workbook and worksheet
  const worksheet = XLSX.utils.json_to_sheet(excelData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Invoices');
  
  // Set column widths
  const columnWidths = [
    { wch: 15 }, // Invoice Number
    { wch: 20 }, // Customer Name
    { wch: 25 }, // Customer Email
    { wch: 15 }, // Shipping Number
    { wch: 15 }, // Status
    { wch: 12 }, // Issue Date
    { wch: 12 }, // Due Date
    { wch: 10 }, // Currency
    { wch: 12 }, // Net Amount
    { wch: 12 }, // Tax Amount
    { wch: 12 }, // Gross Amount
    { wch: 12 }, // Paid Amount
    { wch: 12 }, // Due Amount
    { wch: 10 }, // Items Count
    { wch: 30 }, // Notes
    { wch: 18 }, // Created At
  ];
  worksheet['!cols'] = columnWidths;
  
  // Generate filename
  const exportFilename = filename || `invoices-export-${format(new Date(), 'yyyyMMdd-HHmmss')}.xlsx`;
  
  // Write file
  XLSX.writeFile(workbook, exportFilename);
}

/**
 * Export invoice items to Excel
 */
export function exportInvoiceItemsToExcel(invoice: Invoice): void {
  const itemsData = invoice.items.map(item => ({
    'Item ID': item._id,
    'Type': item.kind,
    'Description': item.description,
    'Quantity': item.quantity,
    'Unit Price': item.unitPrice / 100,
    'Tax Rate': item.taxRate || 0,
    'Tax Amount': (item.taxAmount || 0) / 100,
    'Net Total': (item.totalNet || 0) / 100,
    'Gross Total': (item.totalGross || 0) / 100,
  }));
  
  const worksheet = XLSX.utils.json_to_sheet(itemsData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Invoice Items');
  
  const filename = `invoice-${invoice.invoiceNumber || 'draft'}-items-${format(new Date(), 'yyyyMMdd')}.xlsx`;
  XLSX.writeFile(workbook, filename);
}
