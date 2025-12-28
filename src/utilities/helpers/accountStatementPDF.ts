import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction, Wallet } from '@/types/wallet';
import { formatLYD } from './currencyHelpers';
import { format as formatDateFns } from 'date-fns';
import LogosText from '@/assets/Logos-text.png';
import Logo2 from '@/assets/logo-2.png';
import CairoFontUrl from '@/assets/fonts/Cairo-Regular.ttf';

// Color palette - matching invoice style #367da3
const colors = {
  primary: [54, 125, 163] as [number, number, number], // #367da3
  primaryLight: [84, 196, 224] as [number, number, number],
  headerBg: [54, 125, 163] as [number, number, number], // #367da3
  textDark: [0, 0, 0] as [number, number, number],
  textMuted: [80, 80, 80] as [number, number, number],
  border: [230, 230, 230] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  black: [0, 0, 0] as [number, number, number],
  depositGreen: [34, 197, 94] as [number, number, number],
  withdrawRed: [239, 68, 68] as [number, number, number],
  refundBlue: [59, 130, 246] as [number, number, number],
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
 * Load image as base64
 */
async function loadImageAsBase64(src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Load image with dimensions for proper aspect ratio calculation
 */
async function loadImageWithDimensions(src: string): Promise<{ base64: string; width: number; height: number } | null> {
  return new Promise((resolve) => {
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
        height: img.height
      });
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
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

  // Load logos
  let logosTextData: { base64: string; width: number; height: number } | null = null;
  let logo2Data: { base64: string; width: number; height: number } | null = null;
  try {
    [logosTextData, logo2Data] = await Promise.all([
      loadImageWithDimensions(LogosText),
      loadImageWithDimensions(Logo2),
    ]);
  } catch (e) {
    console.warn('Could not load logos:', e);
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
  if (logosTextData) {
    doc.saveGraphicsState();
    // @ts-ignore - setGState exists in jsPDF
    doc.setGState(new doc.GState({ opacity: 0.1 }));
    const watermarkWidth = 120;
    const watermarkHeight = watermarkWidth * (logosTextData.height / logosTextData.width);
    doc.addImage(
      logosTextData.base64,
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

  // ===== HEADER SECTION =====
  if (isRTL) {
    // RTL Layout
    // Right: Title
    doc.setFontSize(16);
    doc.setFont(fontFamily, 'bold');
    doc.setTextColor(colors.black[0], colors.black[1], colors.black[2]);
    doc.text(t.title, pageWidth - margin, 25, { align: 'right' });
    
    // Left: Company branding with logo (width-based, auto height)
    if (logo2Data) {
      const logoWidth = 35;
      const logoHeight = logoWidth * (logo2Data.height / logo2Data.width);
      doc.addImage(logo2Data.base64, 'PNG', margin, 12, logoWidth, logoHeight);
    }
  } else {
    // LTR Layout
    // Left: Title
    doc.setFontSize(16);
    doc.setFont(fontFamily, 'bold');
    doc.setTextColor(colors.black[0], colors.black[1], colors.black[2]);
    doc.text(t.title, margin, 25);
    
    // Right: Company branding with logo (width-based, auto height)
    if (logo2Data) {
      const logoWidth = 35;
      const logoHeight = logoWidth * (logo2Data.height / logo2Data.width);
      doc.addImage(logo2Data.base64, 'PNG', pageWidth - margin - logoWidth, 12, logoWidth, logoHeight);
    }
  }
  
  // ===== INFORMATION SECTION (Two columns) =====
  const infoStartY = 45;
  
  if (isRTL) {
    // RTL Layout - Right side: Company info & Account Holder
    doc.setFontSize(9);
    doc.setFont(fontFamily, 'normal');
    doc.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
    doc.text(t.companyName, pageWidth - margin, infoStartY, { align: 'right' });
    doc.text(t.companySubtitle, pageWidth - margin, infoStartY + 5, { align: 'right' });
    
    // Account Holder section
    doc.setFontSize(11);
    doc.setFont(fontFamily, 'bold');
    doc.text(t.accountHolder, pageWidth - margin, infoStartY + 18, { align: 'right' });
    
    doc.setFont(fontFamily, 'normal');
    doc.setFontSize(10);
    let holderY = infoStartY + 25;
    if (customerName) {
      doc.setFont(fontFamily, 'bold');
      doc.text(customerName, pageWidth - margin, holderY, { align: 'right' });
      doc.setFont(fontFamily, 'normal');
      holderY += 6;
    }
    if (customerEmail) {
      doc.text(customerEmail, pageWidth - margin, holderY, { align: 'right' });
      holderY += 6;
    }
    doc.text(`${t.walletId} ${wallet._id}`, pageWidth - margin, holderY, { align: 'right' });
    
    // Left side: Statement details
    doc.setFont(fontFamily, 'bold');
    doc.setFontSize(10);
    
    // Statement Number
    doc.text(t.statementNo, margin + 60, infoStartY, { align: 'right' });
    doc.setFont(fontFamily, 'normal');
    doc.text(`STM-${formatDateFns(dateFrom, 'yyyyMMdd')}`, margin, infoStartY);
    
    // Period
    doc.setFont(fontFamily, 'bold');
    doc.text(t.period, margin + 60, infoStartY + 6, { align: 'right' });
    doc.setFont(fontFamily, 'normal');
    doc.text(
      `${formatDateFns(dateFrom, 'dd/MM/yyyy')} - ${formatDateFns(dateTo, 'dd/MM/yyyy')}`,
      margin,
      infoStartY + 6
    );
    
    // Generated Date
    doc.setFont(fontFamily, 'bold');
    doc.text(t.generated, margin + 60, infoStartY + 12, { align: 'right' });
    doc.setFont(fontFamily, 'normal');
    doc.text(formatDateFns(new Date(), 'dd/MM/yyyy HH:mm'), margin, infoStartY + 12);
    
    // Currency
    doc.setFont(fontFamily, 'bold');
    doc.text(t.currency, margin + 60, infoStartY + 18, { align: 'right' });
    doc.setFont(fontFamily, 'normal');
    doc.text(wallet.currency, margin, infoStartY + 18);
  } else {
    // LTR Layout - Left: Company info & Account Holder
    doc.setFontSize(9);
    doc.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
    doc.text(t.companyName, margin, infoStartY);
    doc.text(t.companySubtitle, margin, infoStartY + 5);
    
    // Account Holder section
    doc.setFontSize(11);
    doc.setFont(fontFamily, 'bold');
    doc.text(t.accountHolder, margin, infoStartY + 18);
    
    doc.setFont(fontFamily, 'normal');
    doc.setFontSize(10);
    let holderY = infoStartY + 25;
    if (customerName) {
      doc.setFont(fontFamily, 'bold');
      doc.text(customerName, margin, holderY);
      doc.setFont(fontFamily, 'normal');
      holderY += 6;
    }
    if (customerEmail) {
      doc.text(customerEmail, margin, holderY);
      holderY += 6;
    }
    doc.text(`${t.walletId} ${wallet._id}`, margin, holderY);
    
    // Right column - Statement details
    doc.setFont(fontFamily, 'bold');
    doc.setFontSize(10);
    
    // Statement Number
    doc.text(t.statementNo, 130, infoStartY);
    doc.setFont(fontFamily, 'normal');
    doc.text(`STM-${formatDateFns(dateFrom, 'yyyyMMdd')}`, 196, infoStartY, { align: 'right' });
    
    // Period
    doc.setFont(fontFamily, 'bold');
    doc.text(t.period, 130, infoStartY + 6);
    doc.setFont(fontFamily, 'normal');
    doc.text(
      `${formatDateFns(dateFrom, 'dd/MM/yyyy')} - ${formatDateFns(dateTo, 'dd/MM/yyyy')}`,
      196,
      infoStartY + 6,
      { align: 'right' }
    );
    
    // Generated Date
    doc.setFont(fontFamily, 'bold');
    doc.text(t.generated, 130, infoStartY + 12);
    doc.setFont(fontFamily, 'normal');
    doc.text(formatDateFns(new Date(), 'dd/MM/yyyy HH:mm'), 196, infoStartY + 12, { align: 'right' });
    
    // Currency
    doc.setFont(fontFamily, 'bold');
    doc.text(t.currency, 130, infoStartY + 18);
    doc.setFont(fontFamily, 'normal');
    doc.text(wallet.currency, 196, infoStartY + 18, { align: 'right' });
  }
  
  // ===== TRANSACTIONS TABLE =====
  const tableStartY = 100;
  
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
  
  // Generate table
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
      cellPadding: 3,
      font: fontFamily,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: colors.textDark,
      cellPadding: 2,
      font: 'Cairo', // Always use Cairo for table body to render Arabic descriptions
    },
    columnStyles,
    styles: {
      lineColor: colors.border,
      lineWidth: 0.1,
      font: fontFamily,
    },
    margin: { left: margin, right: margin },
  });
  
  // ===== TOTALS SECTION =====
  const finalY = (doc as any).lastAutoTable.finalY || 150;
  let yPos = finalY + 15;
  
  doc.setFont(fontFamily, 'normal');
  doc.setFontSize(10);
  doc.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
  
  if (isRTL) {
    const totalsX = pageWidth - margin;
    const valueX = margin + 40;
    
    // Opening Balance
    doc.text(t.openingBalance, totalsX, yPos, { align: 'right' });
    doc.text(formatLYD(summary.openingBalance), valueX, yPos, { align: 'right' });
    yPos += 6;
    
    // Total Debits
    doc.text(t.totalDebits, totalsX, yPos, { align: 'right' });
    doc.setTextColor(colors.withdrawRed[0], colors.withdrawRed[1], colors.withdrawRed[2]);
    doc.text(formatLYD(summary.totalDebits), valueX, yPos, { align: 'right' });
    yPos += 6;
    
    // Total Credits
    doc.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
    doc.text(t.totalCredits, totalsX, yPos, { align: 'right' });
    doc.setTextColor(colors.depositGreen[0], colors.depositGreen[1], colors.depositGreen[2]);
    doc.text(formatLYD(summary.totalCredits), valueX, yPos, { align: 'right' });
    yPos += 8;
    
    // Closing Balance (bold, larger)
    doc.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
    doc.setFont(fontFamily, 'bold');
    doc.setFontSize(12);
    doc.text(t.closingBalance, totalsX, yPos, { align: 'right' });
    doc.text(formatLYD(summary.closingBalance), valueX, yPos, { align: 'right' });
  } else {
    const totalsX = 130;
    const rightColX = 196;
    
    // Opening Balance
    doc.text(t.openingBalance, totalsX, yPos);
    doc.text(formatLYD(summary.openingBalance), rightColX, yPos, { align: 'right' });
    yPos += 6;
    
    // Total Debits
    doc.text(t.totalDebits, totalsX, yPos);
    doc.setTextColor(colors.withdrawRed[0], colors.withdrawRed[1], colors.withdrawRed[2]);
    doc.text(formatLYD(summary.totalDebits), rightColX, yPos, { align: 'right' });
    yPos += 6;
    
    // Total Credits
    doc.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
    doc.text(t.totalCredits, totalsX, yPos);
    doc.setTextColor(colors.depositGreen[0], colors.depositGreen[1], colors.depositGreen[2]);
    doc.text(formatLYD(summary.totalCredits), rightColX, yPos, { align: 'right' });
    yPos += 8;
    
    // Closing Balance (bold, larger)
    doc.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
    doc.setFont(fontFamily, 'bold');
    doc.setFontSize(12);
    doc.text(t.closingBalance, totalsX, yPos);
    doc.text(formatLYD(summary.closingBalance), rightColX, yPos, { align: 'right' });
  }
  
  // Save PDF
  const fromStr = formatDateFns(dateFrom, 'yyyyMMdd');
  const toStr = formatDateFns(dateTo, 'yyyyMMdd');
  const filename = `account-statement-${fromStr}-${toStr}.pdf`;
  doc.save(filename);
}
