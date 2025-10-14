import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Invoice } from '@/types/invoice';
import { formatCurrency, parseInvoiceItemDescription } from './invoiceHelpers';
import { format } from 'date-fns';

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
};

/**
 * Generate professional invoice PDF matching platform design
 */
export async function generateInvoicePDF(invoice: Invoice): Promise<void> {
  const doc = new jsPDF();
  
  // ===== HEADER SECTION =====
  // Left: "INVOICE" title
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(colors.black[0], colors.black[1], colors.black[2]);
  doc.text('INVOICE', 14, 25);
  
  // Right: Company branding in cyan
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.text('MazExpress', 196, 20, { align: 'right' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  doc.text('Shipping & Logistics', 196, 27, { align: 'right' });
  
  // ===== INFORMATION SECTION (Two columns) =====
  const infoStartY = 45;
  
  // Left column - Company info
  doc.setFontSize(9);
  doc.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
  doc.text('MazExpress', 14, infoStartY);
  doc.text('Shipping & Logistics Solutions', 14, infoStartY + 5);
  
  // Bill To section
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
  doc.text('BILL TO', 14, infoStartY + 18);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const userId = typeof invoice.userId === 'object' ? invoice.userId : null;
  if (userId) {
    doc.setFont('helvetica', 'bold');
    doc.text(`${userId.firstName} ${userId.lastName}`, 14, infoStartY + 25);
    doc.setFont('helvetica', 'normal');
    doc.text(userId.email, 14, infoStartY + 31);
    doc.text(`Shipping #: ${userId.uniqueShippingNumber}`, 14, infoStartY + 37);
  }
  
  // Right column - Invoice details
  const rightColX = 140;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
  
  // Invoice Number
  doc.text('Invoice No:', rightColX, infoStartY);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.invoiceNumber || 'DRAFT', 196, infoStartY, { align: 'right' });
  
  // Issue Date
  doc.setFont('helvetica', 'bold');
  doc.text('Issue date:', rightColX, infoStartY + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(
    invoice.issueDate ? format(new Date(invoice.issueDate), 'dd/MM/yyyy') : 'N/A',
    196,
    infoStartY + 6,
    { align: 'right' }
  );
  
  // Due Date
  doc.setFont('helvetica', 'bold');
  doc.text('Due date:', rightColX, infoStartY + 12);
  doc.setFont('helvetica', 'normal');
  doc.text(
    format(new Date(invoice.dueDate), 'dd/MM/yyyy'),
    196,
    infoStartY + 12,
    { align: 'right' }
  );
  
  // ===== ITEMS TABLE =====
  const tableStartY = 100;
  
  // Prepare table data
  const tableData = invoice.items.map(item => {
    const parsed = parseInvoiceItemDescription(item.description);
    const description = parsed.shipmentCode 
      ? `Shipment ${parsed.shipmentCode} - ${parsed.location || 'N/A'}`
      : parsed.baseDescription;
    
    return [
      description,
      item.quantity.toString(),
      formatCurrency(item.unitPrice / 100),
      formatCurrency((item.totalGross || item.totalNet || 0) / 100),
    ];
  });
  
  // Generate clean table
  autoTable(doc, {
    startY: tableStartY,
    head: [['DESCRIPTION', 'QUANTITY', 'UNIT PRICE (LYD)', 'AMOUNT (LYD)']],
    body: tableData,
    theme: 'plain',
    headStyles: { 
      fillColor: colors.headerBg,
      textColor: colors.textDark,
      fontSize: 10,
      fontStyle: 'bold',
      halign: 'left',
      cellPadding: 3,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: colors.textDark,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 100, halign: 'left' },
      1: { cellWidth: 25, halign: 'center' },
      2: { cellWidth: 30, halign: 'right' },
      3: { cellWidth: 30, halign: 'right', fontStyle: 'bold' },
    },
    styles: {
      lineColor: colors.border,
      lineWidth: 0.1,
    },
  });
  
  // ===== TOTALS SECTION =====
  const finalY = (doc as any).lastAutoTable.finalY || 150;
  const totalsX = 130;
  let yPos = finalY + 15;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
  
  // Show subtotal only if different from gross
  if (invoice.totals.net !== invoice.totals.gross) {
    doc.text('Subtotal (LYD):', totalsX, yPos);
    doc.text(formatCurrency(invoice.totals.net / 100), 196, yPos, { align: 'right' });
    yPos += 6;
  }
  
  // Show tax only if > 0
  if (invoice.totals.tax > 0) {
    doc.text('Tax (LYD):', totalsX, yPos);
    doc.text(formatCurrency(invoice.totals.tax / 100), 196, yPos, { align: 'right' });
    yPos += 6;
  }
  
  // Total
  doc.setFont('helvetica', 'bold');
  doc.text('Total (LYD):', totalsX, yPos);
  doc.text(formatCurrency(invoice.totals.gross / 100), 196, yPos, { align: 'right' });
  yPos += 10;
  
  // Cyan highlighted box for TOTAL DUE
  const boxHeight = 12;
  const boxWidth = 66;
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.roundedRect(totalsX, yPos - 5, boxWidth, boxHeight, 2, 2, 'F');
  
  doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL DUE (LYD):', totalsX + 3, yPos + 3);
  doc.text(formatCurrency(invoice.totals.due / 100), 193, yPos + 3, { align: 'right' });
  
  // ===== NOTES SECTION =====
  if (invoice.notes) {
    doc.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Notes:', 14, yPos + 20);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const splitNotes = doc.splitTextToSize(invoice.notes, 180);
    doc.text(splitNotes, 14, yPos + 26);
  }
  
  // ===== FOOTER =====
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  doc.text('Thank you for your business!', 105, 280, { align: 'center' });
  
  // Save PDF
  const filename = `invoice-${invoice.invoiceNumber || 'draft'}-${format(new Date(), 'yyyyMMdd')}.pdf`;
  doc.save(filename);
}

/**
 * Generate batch PDF for multiple invoices
 */
export async function generateBatchInvoicesPDF(invoices: Invoice[]): Promise<void> {
  const doc = new jsPDF();
  
  invoices.forEach((invoice, index) => {
    if (index > 0) {
      doc.addPage();
    }
    
    // Simplified batch version
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
    doc.text(`Invoice: ${invoice.invoiceNumber || 'DRAFT'}`, 14, 20);
    
    const userId = typeof invoice.userId === 'object' ? invoice.userId : null;
    if (userId) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Customer: ${userId.firstName} ${userId.lastName}`, 14, 30);
    }
    
    doc.text(`Status: ${invoice.status}`, 14, 36);
    doc.text(`Due: ${format(new Date(invoice.dueDate), 'dd/MM/yyyy')}`, 14, 42);
    doc.text(`Amount Due: ${formatCurrency(invoice.totals.due / 100)} LYD`, 14, 48);
  });
  
  const filename = `invoices-batch-${format(new Date(), 'yyyyMMdd')}.pdf`;
  doc.save(filename);
}
