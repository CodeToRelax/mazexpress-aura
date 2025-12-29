import { Invoice, InvoiceItem } from '@/types/invoice';
import ReactDOMServer from 'react-dom/server';
import React from 'react';
import PrintInvoiceA4 from '@/components/invoices/PrintInvoiceA4';
import { getSystemConfig } from '@/utilities/api/config.api';

interface ShipmentData {
  esn?: string;
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
        esn: shipment?.esn || '',
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
 * Get shipping info from invoice items
 */
function getShippingInfo(items: InvoiceItem[]): { 
  originCountry: string | null; 
  shippingMethod: string | null; 
} {
  const shipmentItem = items.find(item => item.kind === 'SHIPMENT' && item.shipmentId);
  if (!shipmentItem?.shipmentId) {
    return { originCountry: null, shippingMethod: null };
  }
  
  return {
    originCountry: (shipmentItem.shipmentId as any).originCountry || null,
    shippingMethod: (shipmentItem.shipmentId as any).shippingMethod || null,
  };
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
  
  // Fetch current exchange rate and shipping rates from system config
  let exchangeRate = 0;
  let shippingCostPerKilo = 0;

  try {
    const config = await getSystemConfig();
    exchangeRate = config.lydExchangeRate || 0;
    
    // Get shipping rate based on origin country and shipping method
    const { originCountry, shippingMethod } = getShippingInfo(invoice.items || []);
    
    if (originCountry && shippingMethod && config.countries?.[originCountry]) {
      const countryConfig = config.countries[originCountry];
      if (shippingMethod === 'air') {
        shippingCostPerKilo = countryConfig.airShippingRate || 0;
      } else if (shippingMethod === 'sea') {
        shippingCostPerKilo = countryConfig.seaShippingRate || 0;
      }
    }
  } catch (error) {
    console.error('Failed to fetch exchange rate:', error);
  }
  
  // Calculate totals - use calculated shipping rate or fallback to options
  const shippingCost = shippingCostPerKilo || options?.shippingCost || 0;
  const extraCosts = shipments.reduce((sum, s) => sum + (Number(s.extraCosts) || 0), 0);
  const totalPrice = invoice.totals?.gross || 0;
  
  // Calculate dollar equivalent
  const totalPriceInDollars = exchangeRate > 0 ? totalPrice / exchangeRate : 0;

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
    exchangeRate,
    totalPriceInDollars,
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
      <title>Invoice #${String(invoice.invoiceNumber).slice(-6)}</title>
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
