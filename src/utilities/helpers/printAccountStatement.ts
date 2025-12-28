import ReactDOMServer from 'react-dom/server';
import React from 'react';
import PrintAccountStatementA4, { PrintAccountStatementProps } from '@/components/wallet/PrintAccountStatementA4';

/**
 * Print account statement using browser print dialog
 * Opens a new window with the statement and triggers print
 */
export async function printAccountStatement(data: PrintAccountStatementProps): Promise<void> {
  const { dateFrom, dateTo } = data;
  
  // Create the React element
  const element = React.createElement(PrintAccountStatementA4, data);

  // Render to HTML string
  const html = ReactDOMServer.renderToStaticMarkup(element);

  // Open new window
  const printWindow = window.open('', '_blank', 'width=1200,height=800');
  
  if (!printWindow) {
    throw new Error('Failed to open print window. Please allow popups for this site.');
  }

  // Get locale for direction
  const isRTL = data.locale?.startsWith('ar');

  // Write the HTML content
  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="${isRTL ? 'ar' : 'en'}" dir="${isRTL ? 'rtl' : 'ltr'}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Account Statement ${dateFrom.toISOString().slice(0, 10)} - ${dateTo.toISOString().slice(0, 10)}</title>
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
