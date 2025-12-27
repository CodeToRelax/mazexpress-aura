import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction, Wallet } from '@/types/wallet';
import { formatLYD } from './currencyHelpers';
import { format as formatDateFns } from 'date-fns';
import LogosText from '@/assets/Logos-text.png';
import Logo2 from '@/assets/logo-2.png';
import CairoFontUrl from '@/assets/fonts/Cairo-Regular.ttf';

// Color palette - modern style with #367da3 primary
const colors = {
  primary: [54, 125, 163] as [number, number, number], // #367da3
  primaryLight: [84, 196, 224] as [number, number, number],
  headerBg: [54, 125, 163] as [number, number, number], // #367da3
  textDark: [30, 30, 30] as [number, number, number],
  textMuted: [100, 100, 100] as [number, number, number],
  border: [220, 220, 220] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  black: [0, 0, 0] as [number, number, number],
  depositGreen: [34, 197, 94] as [number, number, number],
  withdrawRed: [239, 68, 68] as [number, number, number],
  refundBlue: [59, 130, 246] as [number, number, number],
  rowAlt: [249, 250, 251] as [number, number, number], // #f9fafb - alternating row color
  divider: [200, 200, 200] as [number, number, number],
};

// Translations
const translations = {
  en: {
    title: 'ACCOUNT STATEMENT',
    accountHolder: 'ACCOUNT HOLDER',
    statementNo: 'Statement No:',
    period: 'Period:',
    generated: 'Generated:',
    currency: 'Currency:',
    walletId: 'Wallet ID:',
    date: 'DATE',
    reference: 'REFERENCE',
    type: 'TYPE',
    description: 'DESCRIPTION',
    debit: 'DEBIT',
    credit: 'CREDIT',
    balance: 'BALANCE',
    openingBalance: 'Opening Balance:',
    totalDebits: 'Total Debits:',
    totalCredits: 'Total Credits:',
    closingBalance: 'Closing Balance:',
    noTransactions: 'No transactions in this period',
    companyName: 'MazExpress',
    companySubtitle: 'Shipping & Logistics',
  },
  ar: {
    title: 'كشف الحساب',
    accountHolder: 'صاحب الحساب',
    statementNo: 'رقم الكشف:',
    period: 'الفترة:',
    generated: 'تاريخ الإنشاء:',
    currency: 'العملة:',
    walletId: 'رقم المحفظة:',
    date: 'التاريخ',
    reference: 'المرجع',
    type: 'النوع',
    description: 'الوصف',
    debit: 'مدين',
    credit: 'دائن',
    balance: 'الرصيد',
    openingBalance: 'الرصيد الافتتاحي:',
    totalDebits: 'إجمالي المدين:',
    totalCredits: 'إجمالي الدائن:',
    closingBalance: 'الرصيد الختامي:',
    noTransactions: 'لا توجد معاملات في هذه الفترة',
    companyName: 'ماز إكسبريس',
    companySubtitle: 'شحن و خدمات لوجستية',
  },
};

// Transaction type translations
const typeTranslations = {
  en: {
    deposit: 'Deposit',
    withdrawal: 'Withdrawal',
    deduction: 'Deduction',
    refund: 'Refund',
  },
  ar: {
    deposit: 'إيداع',
    withdrawal: 'سحب',
    deduction: 'خصم',
    refund: 'استرداد',
  },
};

interface StatementData {
  wallet: Wallet;
  transactions: Transaction[];
  dateFrom: Date;
  dateTo: Date;
  customerName?: string;
  customerEmail?: string;
  locale?: string;
}

/**
 * Load font file as ArrayBuffer and convert to Base64
 */
async function loadFontAsBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Load image as base64 with dimensions
 */
async function loadImageAsBase64WithDimensions(src: string): Promise<{ base64: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0);
      resolve({
        base64: canvas.toDataURL('image/png'),
        width: img.width,
        height: img.height,
      });
    };
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Load image as base64 (simple version)
 */
async function loadImageAsBase64(src: string): Promise<string> {
  const result = await loadImageAsBase64WithDimensions(src);
  return result.base64;
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
function formatType(type: string, locale: string): string {
  const normalizedLocale: 'en' | 'ar' = locale?.startsWith('ar') ? 'ar' : 'en';
  const key = type.toLowerCase() as keyof typeof typeTranslations.en;
  return typeTranslations[normalizedLocale][key] || type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
}

/**
 * Generate professional account statement PDF with localization
 */
export async function generateAccountStatementPDF(data: StatementData): Promise<void> {
  const { wallet, transactions, dateFrom, dateTo, customerName, customerEmail, locale = 'en' } = data;
  // Normalize locale to 'en' or 'ar', defaulting to 'en' if unrecognized (handles 'en-US', 'ar-LY', etc.)
  const normalizedLocale: 'en' | 'ar' = locale?.startsWith('ar') ? 'ar' : 'en';
  const t = translations[normalizedLocale];
  const isRTL = normalizedLocale === 'ar';
  
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const margin = 14;

  // Always load Cairo font to handle Arabic text in descriptions
  try {
    const cairoBase64 = await loadFontAsBase64(CairoFontUrl);
    doc.addFileToVFS('Cairo-Regular.ttf', cairoBase64);
    doc.addFont('Cairo-Regular.ttf', 'Cairo', 'normal');
    doc.addFont('Cairo-Regular.ttf', 'Cairo', 'bold');
  } catch (e) {
    console.error('Could not load Cairo font:', e);
  }

  // Load logos with dimensions for proper aspect ratio
  let logosTextBase64: string | null = null;
  let logo2Data: { base64: string; width: number; height: number } | null = null;
  try {
    const [logosResult, logo2Result] = await Promise.all([
      loadImageAsBase64(LogosText),
      loadImageAsBase64WithDimensions(Logo2),
    ]);
    logosTextBase64 = logosResult;
    logo2Data = logo2Result;
  } catch (e) {
    console.warn('Could not load logos:', e);
  }
  
  // Calculate logo dimensions - width-based (35mm width, auto height)
  const logoMaxWidth = 35;
  let logoWidth = logoMaxWidth;
  let logoHeight = 12; // fallback
  if (logo2Data) {
    const aspectRatio = logo2Data.height / logo2Data.width;
    logoHeight = logoMaxWidth * aspectRatio;
  }
  
  // Calculate opening balance (balance before first transaction or current balance if no transactions)
  const openingBalance = transactions.length > 0 
    ? transactions[transactions.length - 1].balanceBefore 
    : wallet.balance;
  
  const summary = calculateSummary(transactions, openingBalance);
  
  // ===== BLUE BORDERS (Top & Bottom) =====
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.rect(0, 0, pageWidth, 5, 'F'); // Top border
  doc.rect(0, pageHeight - 5, pageWidth, 5, 'F'); // Bottom border

  // ===== WATERMARK (Center background) =====
  if (logosTextBase64) {
    doc.saveGraphicsState();
    // @ts-ignore - setGState exists in jsPDF
    doc.setGState(new doc.GState({ opacity: 0.1 }));
    const watermarkWidth = 120;
    const watermarkHeight = 40;
    doc.addImage(
      logosTextBase64,
      'PNG',
      (pageWidth - watermarkWidth) / 2,
      (pageHeight - watermarkHeight) / 2,
      watermarkWidth,
      watermarkHeight
    );
    doc.restoreGraphicsState();
  }
  
  // Set font based on locale
  const fontFamily = isRTL ? 'Cairo' : 'helvetica';
  doc.setFont(fontFamily, 'normal');

  // ===== HEADER SECTION (Modern Clean Design) =====
  const headerY = 18;
  
  if (isRTL) {
    // RTL Layout - Title on right, Logo on left
    doc.setFontSize(14);
    doc.setFont(fontFamily, 'bold');
    doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.text(t.title, pageWidth - margin, headerY, { align: 'right' });
    
    // Logo with proper proportions
    if (logo2Data) {
      doc.addImage(logo2Data.base64, 'PNG', margin, headerY - 6, logoWidth, logoHeight);
    }
  } else {
    // LTR Layout - Title on left, Logo on right
    doc.setFontSize(14);
    doc.setFont(fontFamily, 'bold');
    doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.text(t.title, margin, headerY);
    
    // Logo with proper proportions
    if (logo2Data) {
      doc.addImage(logo2Data.base64, 'PNG', pageWidth - margin - logoWidth, headerY - 6, logoWidth, logoHeight);
    }
  }
  
  // Header divider line
  const dividerY = headerY + 10;
  doc.setDrawColor(colors.divider[0], colors.divider[1], colors.divider[2]);
  doc.setLineWidth(0.3);
  doc.line(margin, dividerY, pageWidth - margin, dividerY);
  
  // ===== INFORMATION SECTION (Two columns with modern spacing) =====
  const infoStartY = 38;
  
  if (isRTL) {
    // RTL Layout - Account Holder on right, Statement details on left
    
    // Account Holder section with subtle background
    doc.setFillColor(colors.rowAlt[0], colors.rowAlt[1], colors.rowAlt[2]);
    doc.roundedRect(pageWidth / 2 + 5, infoStartY - 4, pageWidth / 2 - margin - 5, 32, 2, 2, 'F');
    
    doc.setFontSize(8);
    doc.setFont(fontFamily, 'bold');
    doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
    doc.text(t.accountHolder, pageWidth - margin - 3, infoStartY + 2, { align: 'right' });
    
    doc.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
    doc.setFontSize(10);
    let holderY = infoStartY + 10;
    if (customerName) {
      doc.setFont(fontFamily, 'bold');
      doc.text(customerName, pageWidth - margin - 3, holderY, { align: 'right' });
      doc.setFont(fontFamily, 'normal');
      holderY += 5;
    }
    if (customerEmail) {
      doc.setFontSize(9);
      doc.text(customerEmail, pageWidth - margin - 3, holderY, { align: 'right' });
      holderY += 5;
    }
    doc.setFontSize(8);
    doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
    doc.text(`${t.walletId} ${wallet._id}`, pageWidth - margin - 3, holderY, { align: 'right' });
    
    // Left side: Statement details
    doc.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
    doc.setFontSize(9);
    let detailY = infoStartY + 2;
    
    // Statement Number
    doc.setFont(fontFamily, 'normal');
    doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
    doc.text(t.statementNo, margin, detailY);
    doc.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
    doc.text(`STM-${formatDateFns(dateFrom, 'yyyyMMdd')}`, margin + 35, detailY);
    detailY += 6;
    
    // Period
    doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
    doc.text(t.period, margin, detailY);
    doc.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
    doc.text(`${formatDateFns(dateFrom, 'dd/MM/yyyy')} - ${formatDateFns(dateTo, 'dd/MM/yyyy')}`, margin + 35, detailY);
    detailY += 6;
    
    // Generated Date
    doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
    doc.text(t.generated, margin, detailY);
    doc.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
    doc.text(formatDateFns(new Date(), 'dd/MM/yyyy HH:mm'), margin + 35, detailY);
    detailY += 6;
    
    // Currency
    doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
    doc.text(t.currency, margin, detailY);
    doc.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
    doc.text(wallet.currency, margin + 35, detailY);
  } else {
    // LTR Layout - Account Holder on left, Statement details on right
    
    // Account Holder section with subtle background
    doc.setFillColor(colors.rowAlt[0], colors.rowAlt[1], colors.rowAlt[2]);
    doc.roundedRect(margin, infoStartY - 4, pageWidth / 2 - margin - 5, 32, 2, 2, 'F');
    
    doc.setFontSize(8);
    doc.setFont(fontFamily, 'bold');
    doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
    doc.text(t.accountHolder, margin + 3, infoStartY + 2);
    
    doc.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
    doc.setFontSize(10);
    let holderY = infoStartY + 10;
    if (customerName) {
      doc.setFont(fontFamily, 'bold');
      doc.text(customerName, margin + 3, holderY);
      doc.setFont(fontFamily, 'normal');
      holderY += 5;
    }
    if (customerEmail) {
      doc.setFontSize(9);
      doc.text(customerEmail, margin + 3, holderY);
      holderY += 5;
    }
    doc.setFontSize(8);
    doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
    doc.text(`${t.walletId} ${wallet._id}`, margin + 3, holderY);
    
    // Right column - Statement details
    doc.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
    doc.setFontSize(9);
    let detailY = infoStartY + 2;
    const rightColStart = pageWidth / 2 + 10;
    const rightColValue = pageWidth - margin;
    
    // Statement Number
    doc.setFont(fontFamily, 'normal');
    doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
    doc.text(t.statementNo, rightColStart, detailY);
    doc.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
    doc.text(`STM-${formatDateFns(dateFrom, 'yyyyMMdd')}`, rightColValue, detailY, { align: 'right' });
    detailY += 6;
    
    // Period
    doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
    doc.text(t.period, rightColStart, detailY);
    doc.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
    doc.text(`${formatDateFns(dateFrom, 'dd/MM/yyyy')} - ${formatDateFns(dateTo, 'dd/MM/yyyy')}`, rightColValue, detailY, { align: 'right' });
    detailY += 6;
    
    // Generated Date
    doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
    doc.text(t.generated, rightColStart, detailY);
    doc.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
    doc.text(formatDateFns(new Date(), 'dd/MM/yyyy HH:mm'), rightColValue, detailY, { align: 'right' });
    detailY += 6;
    
    // Currency
    doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
    doc.text(t.currency, rightColStart, detailY);
    doc.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
    doc.text(wallet.currency, rightColValue, detailY, { align: 'right' });
  }
  
  // ===== TRANSACTIONS TABLE =====
  const tableStartY = 80;
  
  // Sort transactions by date (newest first)
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  
  // Prepare table headers based on locale
  const headers = isRTL
    ? [[t.balance, t.credit, t.debit, t.description, t.type, t.reference, t.date]]
    : [[t.date, t.reference, t.type, t.description, t.debit, t.credit, t.balance]];
  
  // Prepare table data
  const tableData = sortedTransactions.map(tx => {
    const isCredit = ['deposit', 'refund'].includes(tx.type.toLowerCase());
    const debit = isCredit ? '' : formatLYD(tx.amount);
    const credit = isCredit ? formatLYD(tx.amount) : '';
    
    const row = [
      formatDateFns(new Date(tx.createdAt), 'dd/MM/yyyy'),
      tx.transactionNumber,
      formatType(tx.type, locale),
      tx.description || '-',
      debit,
      credit,
      formatLYD(tx.balanceAfter),
    ];
    
    return isRTL ? row.reverse() : row;
  });
  
  // Add empty state message if no transactions
  if (tableData.length === 0) {
    const emptyRow = ['-', '-', '-', t.noTransactions, '-', '-', '-'];
    tableData.push(isRTL ? emptyRow.reverse() : emptyRow);
  }
  
  // Column styles based on layout direction
  const columnStyles = isRTL ? {
    0: { cellWidth: 24, halign: 'right' as const, fontStyle: 'bold' as const },  // Balance
    1: { cellWidth: 22, halign: 'right' as const, textColor: colors.depositGreen }, // Credit
    2: { cellWidth: 22, halign: 'right' as const, textColor: colors.withdrawRed },  // Debit
    3: { cellWidth: 48, halign: 'right' as const },  // Description
    4: { cellWidth: 20, halign: 'center' as const }, // Type
    5: { cellWidth: 28, halign: 'right' as const },  // Reference
    6: { cellWidth: 22, halign: 'right' as const },  // Date
  } : {
    0: { cellWidth: 22, halign: 'left' as const },     // Date
    1: { cellWidth: 28, halign: 'left' as const },     // Reference
    2: { cellWidth: 20, halign: 'center' as const },   // Type
    3: { cellWidth: 48, halign: 'left' as const },     // Description
    4: { cellWidth: 22, halign: 'right' as const, textColor: colors.withdrawRed },  // Debit
    5: { cellWidth: 22, halign: 'right' as const, textColor: colors.depositGreen }, // Credit
    6: { cellWidth: 24, halign: 'right' as const, fontStyle: 'bold' as const },     // Balance
  };
  
  // Generate table with modern styling
  autoTable(doc, {
    startY: tableStartY,
    head: headers,
    body: tableData,
    theme: 'plain',
    headStyles: { 
      fillColor: colors.headerBg,
      textColor: colors.white,
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
      cellPadding: 4,
      font: 'Cairo', // Use Cairo for headers too
    },
    bodyStyles: {
      fontSize: 8,
      textColor: colors.textDark,
      cellPadding: 3.5,
      font: 'Cairo', // Always use Cairo for table body to render Arabic descriptions
    },
    alternateRowStyles: {
      fillColor: colors.rowAlt, // Alternating row colors
    },
    columnStyles,
    styles: {
      lineColor: colors.border,
      lineWidth: 0.1,
      font: 'Cairo', // Default to Cairo for all text
      overflow: 'linebreak',
    },
    margin: { left: margin, right: margin },
    didParseCell: function(data) {
      // Ensure Cairo font is used for all cells
      data.cell.styles.font = 'Cairo';
    },
  });
  
  // ===== TOTALS SECTION (Modern boxed summary) =====
  const finalY = (doc as any).lastAutoTable.finalY || 150;
  const totalsBoxY = finalY + 10;
  const totalsBoxWidth = 80;
  const totalsBoxHeight = 38;
  
  // Draw totals box background
  const totalsBoxX = isRTL ? margin : pageWidth - margin - totalsBoxWidth;
  doc.setFillColor(colors.rowAlt[0], colors.rowAlt[1], colors.rowAlt[2]);
  doc.roundedRect(totalsBoxX, totalsBoxY, totalsBoxWidth, totalsBoxHeight, 2, 2, 'F');
  
  doc.setFont('Cairo', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
  
  let yPos = totalsBoxY + 7;
  const labelX = isRTL ? totalsBoxX + totalsBoxWidth - 3 : totalsBoxX + 3;
  const valueX = isRTL ? totalsBoxX + 3 : totalsBoxX + totalsBoxWidth - 3;
  const labelAlign = isRTL ? 'right' as const : 'left' as const;
  const valueAlign = isRTL ? 'left' as const : 'right' as const;
  
  // Opening Balance
  doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  doc.text(t.openingBalance, labelX, yPos, { align: labelAlign });
  doc.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
  doc.text(formatLYD(summary.openingBalance), valueX, yPos, { align: valueAlign });
  yPos += 6;
  
  // Total Debits
  doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  doc.text(t.totalDebits, labelX, yPos, { align: labelAlign });
  doc.setTextColor(colors.withdrawRed[0], colors.withdrawRed[1], colors.withdrawRed[2]);
  doc.text(formatLYD(summary.totalDebits), valueX, yPos, { align: valueAlign });
  yPos += 6;
  
  // Total Credits
  doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  doc.text(t.totalCredits, labelX, yPos, { align: labelAlign });
  doc.setTextColor(colors.depositGreen[0], colors.depositGreen[1], colors.depositGreen[2]);
  doc.text(formatLYD(summary.totalCredits), valueX, yPos, { align: valueAlign });
  yPos += 8;
  
  // Closing Balance (bold, highlighted)
  doc.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.setLineWidth(0.5);
  doc.line(totalsBoxX + 3, yPos - 3, totalsBoxX + totalsBoxWidth - 3, yPos - 3);
  
  doc.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
  doc.setFont('Cairo', 'bold');
  doc.setFontSize(10);
  doc.text(t.closingBalance, labelX, yPos + 2, { align: labelAlign });
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.text(formatLYD(summary.closingBalance), valueX, yPos + 2, { align: valueAlign });
  
  // Save PDF
  const fromStr = formatDateFns(dateFrom, 'yyyyMMdd');
  const toStr = formatDateFns(dateTo, 'yyyyMMdd');
  const filename = `account-statement-${fromStr}-${toStr}.pdf`;
  doc.save(filename);
}
