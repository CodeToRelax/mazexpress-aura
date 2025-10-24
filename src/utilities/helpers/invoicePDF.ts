import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Invoice } from '@/types/invoice';
import { calculateCBM, formatDimensions } from './invoiceHelpers';
import { formatLYD } from './currencyHelpers';
import { formatDate, formatDateTime } from './dateHelpers';
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
};

/**
 * Generate professional invoice PDF matching platform design
 */
export async function generateInvoicePDF(invoice: Invoice): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
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
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
  
  // Invoice Number
  doc.text('Invoice No:', 130, infoStartY);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.invoiceNumber || 'DRAFT', 196, infoStartY, { align: 'right' });
  
  // Issue Date
  doc.setFont('helvetica', 'bold');
  doc.text('Issue date:', 130, infoStartY + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(
    invoice.issueDate ? formatDate(invoice.issueDate) : 'N/A',
    196,
    infoStartY + 6,
    { align: 'right' }
  );
  
  // Due Date
  doc.setFont('helvetica', 'bold');
  doc.text('Due date:', 130, infoStartY + 12);
  doc.setFont('helvetica', 'normal');
  doc.text(
    formatDate(invoice.dueDate),
    196,
    infoStartY + 12,
    { align: 'right' }
  );
  
  // ===== ITEMS TABLE =====
  const tableStartY = 100;
  
  // Prepare table data matching UI table exactly
  const tableData = invoice.items.map(item => {
    const isShipment = item.kind === 'SHIPMENT' && item.shipmentId && typeof item.shipmentId === 'object';
    const shipment = isShipment ? item.shipmentId : null;
    const totalAmount = item.totalGross || (item.quantity * item.unitPrice);
    
    return [
      // ITEM
      isShipment && shipment ? shipment.esn : item.description,
      
      // DESTINATION
      isShipment && shipment ? shipment.shipmentDestination : item.kind.toLowerCase().replace('_', ' '),
      
      // METHOD
      isShipment && shipment ? shipment.shippingMethod?.toLowerCase() || '-' : '-',
      
      // STATUS
      isShipment && shipment ? shipment.status : '-',
      
      // WEIGHT
      isShipment && shipment?.size?.weight ? `${shipment.size.weight}kg` : '-',
      
      // DIMENSIONS
      isShipment && shipment?.size 
        ? formatDimensions(shipment.size.length, shipment.size.width, shipment.size.height) 
        : '-',
      
      // CBM
      isShipment && shipment?.size?.length && shipment?.size?.width && shipment?.size?.height
        ? calculateCBM(shipment.size.length, shipment.size.width, shipment.size.height) + 'm³'
        : '-',
      
      // TOTAL
      formatLYD(totalAmount),
    ];
  });
  
  // Generate table with 10 columns matching UI
  autoTable(doc, {
    startY: tableStartY,
    head: [['ITEM', 'DESTINATION', 'METHOD', 'STATUS', 'WEIGHT', 'DIMENSIONS', 'CBM', 'TOTAL']],
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
      0: { cellWidth: 22, halign: 'left', fontSize: 8 },    // Item (ESN)
      1: { cellWidth: 22, halign: 'left', fontSize: 8 },    // Destination
      2: { cellWidth: 16, halign: 'center', fontSize: 7 },  // Method
      3: { cellWidth: 18, halign: 'center', fontSize: 7 },  // Status
      4: { cellWidth: 14, halign: 'right', fontSize: 7 },   // Weight
      5: { cellWidth: 22, halign: 'center', fontSize: 7 },  // Dimensions
      6: { cellWidth: 14, halign: 'right', fontSize: 7 },   // CBM
      7: { cellWidth: 24, halign: 'right', fontSize: 8, fontStyle: 'bold' },  // Total
    },
    styles: {
      lineColor: colors.border,
      lineWidth: 0.1,
    },
  });
  
  // ===== TOTALS SECTION =====
  const finalY = (doc as any).lastAutoTable.finalY || 150;
  let yPos = finalY + 15;
  const totalsX = 130;
  const rightColX = 196;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
  
  // Show subtotal only if different from gross
  if (invoice.totals.net !== invoice.totals.gross) {
    doc.text('Subtotal:', totalsX, yPos);
    doc.text(formatLYD(invoice.totals.net), rightColX, yPos, { align: 'right' });
    yPos += 6;
  }
  
  // Show tax only if > 0
  if (invoice.totals.tax > 0) {
    doc.text('Tax:', totalsX, yPos);
    doc.text(formatLYD(invoice.totals.tax), rightColX, yPos, { align: 'right' });
    yPos += 6;
  }
  
  // Total (simplified, no highlighted box)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Total:', totalsX, yPos);
  doc.text(formatLYD(invoice.totals.gross), rightColX, yPos, { align: 'right' });
  
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
  doc.text('Thank you for your business!', 105, 200, { align: 'center' });
  
  // Save PDF
  const filename = `invoice-${invoice.invoiceNumber || 'draft'}-${formatDateFns(new Date(), 'yyyyMMdd')}.pdf`;
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
    doc.text(`Due: ${formatDate(invoice.dueDate)}`, 14, 42);
    doc.text(`Amount Due: ${formatLYD(invoice.totals.due)}`, 14, 48);
  });
  
  const filename = `invoices-batch-${formatDateFns(new Date(), 'yyyyMMdd')}.pdf`;
  doc.save(filename);
}
