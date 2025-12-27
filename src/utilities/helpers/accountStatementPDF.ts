import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction, Wallet } from '@/types/wallet';
import { formatLYD } from './currencyHelpers';
import { format as formatDateFns } from 'date-fns';

/**
 * Platform color palette (from index.css)
 * Primary: HSL(193, 98%, 44%) = RGB(2, 181, 224) - Cyan/Turquoise
 */
const colors = {
  primary: [2, 181, 224] as [number, number, number],
  primaryLight: [84, 196, 224] as [number, number, number],
  headerBg: [243, 244, 246] as [number, number, number],
  textDark: [31, 41, 55] as [number, number, number],
  textMuted: [107, 114, 128] as [number, number, number],
  border: [229, 231, 235] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  black: [0, 0, 0] as [number, number, number],
  depositGreen: [34, 197, 94] as [number, number, number],
  withdrawRed: [239, 68, 68] as [number, number, number],
  refundBlue: [59, 130, 246] as [number, number, number],
};

interface StatementData {
  wallet: Wallet;
  transactions: Transaction[];
  dateFrom: Date;
  dateTo: Date;
  customerName?: string;
  customerEmail?: string;
}

/**
 * Calculate statement summary
 */
function calculateSummary(transactions: Transaction[], openingBalance: number) {
  const deposits = transactions
    .filter(t => t.type.toLowerCase() === 'deposit' && t.status.toLowerCase() === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const withdrawals = transactions
    .filter(t => t.type.toLowerCase() === 'withdrawal' && t.status.toLowerCase() === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const deductions = transactions
    .filter(t => t.type.toLowerCase() === 'deduction' && t.status.toLowerCase() === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const refunds = transactions
    .filter(t => t.type.toLowerCase() === 'refund' && t.status.toLowerCase() === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const closingBalance = openingBalance + deposits + refunds - withdrawals - deductions;
  
  return {
    openingBalance,
    deposits,
    withdrawals,
    deductions,
    refunds,
    closingBalance,
    totalCredits: deposits + refunds,
    totalDebits: withdrawals + deductions,
  };
}

/**
 * Format transaction type for display
 */
function formatType(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
}

/**
 * Generate professional account statement PDF
 */
export async function generateAccountStatementPDF(data: StatementData): Promise<void> {
  const { wallet, transactions, dateFrom, dateTo, customerName, customerEmail } = data;
  
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  // Calculate opening balance (balance before first transaction or current balance if no transactions)
  const openingBalance = transactions.length > 0 
    ? transactions[transactions.length - 1].balanceBefore 
    : wallet.balance;
  
  const summary = calculateSummary(transactions, openingBalance);
  
  // ===== HEADER SECTION =====
  // Left: "ACCOUNT STATEMENT" title
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(colors.black[0], colors.black[1], colors.black[2]);
  doc.text('ACCOUNT STATEMENT', 14, 25);
  
  // Right: Company branding in cyan
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.text('MazExpress', 196, 20, { align: 'right' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  doc.text('Shipping & Logistics', 196, 27, { align: 'right' });
  
  // Statement period
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  doc.text(`Statement Period: ${formatDateFns(dateFrom, 'dd/MM/yyyy')} - ${formatDateFns(dateTo, 'dd/MM/yyyy')}`, 14, 35);
  doc.text(`Generated: ${formatDateFns(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 41);
  
  // ===== ACCOUNT INFORMATION SECTION =====
  const infoStartY = 52;
  
  // Left column - Account holder
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
  doc.text('ACCOUNT HOLDER', 14, infoStartY);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  if (customerName) {
    doc.setFont('helvetica', 'bold');
    doc.text(customerName, 14, infoStartY + 7);
    doc.setFont('helvetica', 'normal');
  }
  if (customerEmail) {
    doc.text(customerEmail, 14, infoStartY + 13);
  }
  doc.text(`Wallet ID: ${wallet._id}`, 14, infoStartY + 19);
  doc.text(`Currency: ${wallet.currency}`, 14, infoStartY + 25);
  
  // Right column - Account summary box
  doc.setFillColor(colors.headerBg[0], colors.headerBg[1], colors.headerBg[2]);
  doc.roundedRect(110, infoStartY - 3, 86, 34, 2, 2, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
  
  // Opening Balance
  doc.text('Opening Balance:', 114, infoStartY + 5);
  doc.text(formatLYD(summary.openingBalance), 192, infoStartY + 5, { align: 'right' });
  
  // Total Credits
  doc.setTextColor(colors.depositGreen[0], colors.depositGreen[1], colors.depositGreen[2]);
  doc.text('Total Credits:', 114, infoStartY + 13);
  doc.text(`+${formatLYD(summary.totalCredits)}`, 192, infoStartY + 13, { align: 'right' });
  
  // Total Debits
  doc.setTextColor(colors.withdrawRed[0], colors.withdrawRed[1], colors.withdrawRed[2]);
  doc.text('Total Debits:', 114, infoStartY + 21);
  doc.text(`-${formatLYD(summary.totalDebits)}`, 192, infoStartY + 21, { align: 'right' });
  
  // Closing Balance
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.setFontSize(11);
  doc.text('Closing Balance:', 114, infoStartY + 29);
  doc.text(formatLYD(summary.closingBalance), 192, infoStartY + 29, { align: 'right' });
  
  // ===== TRANSACTIONS TABLE =====
  const tableStartY = infoStartY + 42;
  
  // Sort transactions by date (newest first)
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  
  // Prepare table data
  const tableData = sortedTransactions.map(tx => {
    const isCredit = ['deposit', 'refund'].includes(tx.type.toLowerCase());
    const debit = isCredit ? '' : formatLYD(tx.amount);
    const credit = isCredit ? formatLYD(tx.amount) : '';
    
    return [
      formatDateFns(new Date(tx.createdAt), 'dd/MM/yyyy'),
      tx.transactionNumber,
      formatType(tx.type),
      tx.description || '-',
      debit,
      credit,
      formatLYD(tx.balanceAfter),
    ];
  });
  
  // Add empty state message if no transactions
  if (tableData.length === 0) {
    tableData.push(['-', '-', '-', 'No transactions in this period', '-', '-', '-']);
  }
  
  // Generate table
  autoTable(doc, {
    startY: tableStartY,
    head: [['DATE', 'REFERENCE', 'TYPE', 'DESCRIPTION', 'DEBIT', 'CREDIT', 'BALANCE']],
    body: tableData,
    theme: 'plain',
    headStyles: { 
      fillColor: colors.headerBg,
      textColor: colors.textDark,
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
      cellPadding: 2,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: colors.textDark,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 22, halign: 'left' },     // Date
      1: { cellWidth: 28, halign: 'left' },     // Reference
      2: { cellWidth: 20, halign: 'center' },   // Type
      3: { cellWidth: 48, halign: 'left' },     // Description
      4: { cellWidth: 22, halign: 'right', textColor: colors.withdrawRed },  // Debit
      5: { cellWidth: 22, halign: 'right', textColor: colors.depositGreen }, // Credit
      6: { cellWidth: 24, halign: 'right', fontStyle: 'bold' },              // Balance
    },
    styles: {
      lineColor: colors.border,
      lineWidth: 0.1,
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250],
    },
  });
  
  // ===== FOOTER =====
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  doc.text('This is a computer-generated statement and does not require a signature.', 105, 280, { align: 'center' });
  doc.text('Thank you for banking with MazExpress!', 105, 285, { align: 'center' });
  
  // Save PDF
  const fromStr = formatDateFns(dateFrom, 'yyyyMMdd');
  const toStr = formatDateFns(dateTo, 'yyyyMMdd');
  const filename = `account-statement-${fromStr}-${toStr}.pdf`;
  doc.save(filename);
}
