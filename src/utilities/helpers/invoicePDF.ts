import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Invoice } from '@/types/invoice';
import { formatCurrency, parseInvoiceItemDescription } from './invoiceHelpers';
import { format } from 'date-fns';

/**
 * Generate PDF for a single invoice
 */
export async function generateInvoicePDF(invoice: Invoice): Promise<void> {
  const doc = new jsPDF();
  
  // Company header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('MazExpress', 14, 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Shipping & Logistics', 14, 26);
  
  // Invoice title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(invoice.invoiceNumber || 'DRAFT INVOICE', 14, 40);
  
  // Status badge
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  const statusX = 150;
  doc.text(`Status: ${invoice.status}`, statusX, 40);
  
  // Customer information
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', 14, 55);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const userId = typeof invoice.userId === 'object' ? invoice.userId : null;
  if (userId) {
    doc.text(`${userId.firstName} ${userId.lastName}`, 14, 62);
    doc.text(userId.email, 14, 68);
    doc.text(`Shipping #: ${userId.uniqueShippingNumber}`, 14, 74);
  }
  
  // Invoice details
  doc.setFont('helvetica', 'bold');
  doc.text('Invoice Details:', 150, 55);
  doc.setFont('helvetica', 'normal');
  
  const details = [
    `Issue Date: ${invoice.issueDate ? format(new Date(invoice.issueDate), 'PP') : 'N/A'}`,
    `Due Date: ${format(new Date(invoice.dueDate), 'PP')}`,
    `Currency: ${invoice.currency || 'LYD'}`,
  ];
  
  let yPos = 62;
  details.forEach(detail => {
    doc.text(detail, 150, yPos);
    yPos += 6;
  });
  
  // Invoice items table
  const tableData = invoice.items.map(item => {
    const parsed = parseInvoiceItemDescription(item.description);
    return [
      parsed.shipmentCode || '-',
      parsed.baseDescription,
      item.quantity.toString(),
      formatCurrency(item.unitPrice / 100),
      formatCurrency((item.totalGross || item.totalNet || 0) / 100),
    ];
  });
  
  autoTable(doc, {
    startY: 85,
    head: [['Shipment', 'Description', 'Qty', 'Unit Price (LYD)', 'Total (LYD)']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246], textColor: 255 },
    styles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 80 },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 30, halign: 'right' },
    },
  });
  
  // Totals section
  const finalY = (doc as any).lastAutoTable.finalY || 150;
  const totalsX = 140;
  let totalsY = finalY + 10;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  
  const totals = [
    ['Net Amount:', formatCurrency(invoice.totals.net / 100)],
    ['Tax:', formatCurrency(invoice.totals.tax / 100)],
    ['Gross Amount:', formatCurrency(invoice.totals.gross / 100)],
    ['Paid:', formatCurrency(invoice.totals.paid / 100)],
  ];
  
  totals.forEach(([label, value]) => {
    doc.text(label, totalsX, totalsY);
    doc.text(`${value} LYD`, totalsX + 50, totalsY, { align: 'right' });
    totalsY += 6;
  });
  
  // Due amount (highlighted)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Amount Due:', totalsX, totalsY + 2);
  doc.text(`${formatCurrency(invoice.totals.due / 100)} LYD`, totalsX + 50, totalsY + 2, { align: 'right' });
  
  // Notes
  if (invoice.notes) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Notes:', 14, totalsY + 15);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const splitNotes = doc.splitTextToSize(invoice.notes, 180);
    doc.text(splitNotes, 14, totalsY + 21);
  }
  
  // Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
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
    
    // Similar content as single invoice, but in a loop
    // Simplified version for batch
    doc.setFontSize(16);
    doc.text(`Invoice: ${invoice.invoiceNumber || 'DRAFT'}`, 14, 20);
    
    const userId = typeof invoice.userId === 'object' ? invoice.userId : null;
    if (userId) {
      doc.setFontSize(10);
      doc.text(`Customer: ${userId.firstName} ${userId.lastName}`, 14, 30);
    }
    
    doc.text(`Status: ${invoice.status}`, 14, 36);
    doc.text(`Due: ${format(new Date(invoice.dueDate), 'PP')}`, 14, 42);
    doc.text(`Amount Due: ${formatCurrency(invoice.totals.due / 100)} LYD`, 14, 48);
  });
  
  const filename = `invoices-batch-${format(new Date(), 'yyyyMMdd')}.pdf`;
  doc.save(filename);
}
