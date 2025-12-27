import { Invoice, InvoiceItem } from '@/types/invoice';
import ReactDOMServer from 'react-dom/server';
import React from 'react';
import PrintInvoiceA4 from '@/components/invoices/PrintInvoiceA4';

interface ShipmentData {
  size: {
    weight: number;
    length: number;
    width: number;
    height: number;
  };
  extraCosts: number;
}

/**
 * Extract shipment data from invoice items
 */
function extractShipmentData(items: InvoiceItem[]): ShipmentData[] {
  return items
    .filter(item => item.kind === 'SHIPMENT' && item.shipmentId)
    .map(item => {
      const shipment = item.shipmentId;
      const size = shipment?.size || {};
      
      return {
        size: {
          weight: size.weight || 0,
          length: size.length || 0,
          width: size.width || 0,
          height: size.height || 0,
        },
        extraCosts: shipment?.extraCosts || 0,
      };
    });
}

/**
 * Calculate total weight from shipments
 */
function calculateTotalWeight(shipments: ShipmentData[]): number {
  return shipments.reduce((sum, s) => sum + s.size.weight, 0);
}

/**
 * Get user full name from invoice
 */
function getUserFullName(invoice: Invoice): string {
  if (typeof invoice.userId === 'object' && invoice.userId) {
    return `${invoice.userId.firstName || ''} ${invoice.userId.lastName || ''}`.trim();
  }
  return 'Unknown Customer';
}

/**
 * Print Arabic invoice using browser print dialog
 * Opens a new window with the invoice and triggers print
 */
export async function printArabicInvoice(
  invoice: Invoice,
  options?: { shippingCost?: number }
): Promise<void> {
  // Extract data from invoice
  const shipments = extractShipmentData(invoice.items || []);
  const totalWeight = calculateTotalWeight(shipments);
  const userFullName = getUserFullName(invoice);
  
  // Calculate totals
  const shippingCost = options?.shippingCost || 0;
  const extraCosts = shipments.reduce((sum, s) => sum + (Number(s.extraCosts) || 0), 0);
  const totalPrice = invoice.totals?.gross || 0;

  // Create the React element
  const element = React.createElement(PrintInvoiceA4, {
    invoiceNumber: invoice.invoiceNumber,
    date: invoice.issueDate || invoice.createdAt,
    userFullName,
    shipments,
    totalWeight,
    shippingCost,
    extraCosts,
    totalPrice,
  });

  // Render to HTML string
  const html = ReactDOMServer.renderToStaticMarkup(element);

  // Open new window
  const printWindow = window.open('', '_blank', 'width=1200,height=800');
  
  if (!printWindow) {
    throw new Error('Failed to open print window. Please allow popups for this site.');
  }

  // Write the HTML content
  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invoice #${invoice.invoiceNumber}</title>
    </head>
    <body>
      ${html}
    </body>
    </html>
  `);
  
  printWindow.document.close();

  // Wait for fonts and images to load
  await new Promise<void>((resolve) => {
    printWindow.onload = () => {
      // Additional delay for font rendering
      setTimeout(() => {
        resolve();
      }, 500);
    };
    
    // Fallback timeout in case onload doesn't fire
    setTimeout(resolve, 2000);
  });

  // Trigger print dialog
  printWindow.print();
}

/**
 * Generate Arabic invoice PDF using browser print-to-PDF
 * This replaces the jsPDF-based approach for better Arabic support
 */
export async function generateArabicShipmentInvoicePDFPrint(
  invoice: Invoice,
  options?: { shippingCost?: number }
): Promise<void> {
  return printArabicInvoice(invoice, options);
}
