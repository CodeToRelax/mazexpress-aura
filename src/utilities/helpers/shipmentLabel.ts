import JsBarcode from 'jsbarcode';
import type { IShipment } from '@/types/shipment';
import logoImage from '@/assets/maz-express-logo.png';
import { formatCityName } from './shipmentHelpers';

// Re-export 10x10 cm label functions
export { generateLabel10x10, generateBulkLabels10x10 } from '@/components/shipments/PrintLabel10x10';

// Generate label HTML for a single shipment
function generateLabelHTML(shipment: IShipment): string {
  // Generate barcode from ESN
  const canvas = document.createElement('canvas');
  let barcodeDataUrl = '';
  
  try {
    JsBarcode(canvas, shipment.esn, {
      format: 'CODE128',
      width: 3,
      height: 120,
      displayValue: true,
      fontSize: 24,
      margin: 10,
      textMargin: 8,
      background: '#FFFFFF',
      lineColor: '#000000',
    });
    barcodeDataUrl = canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Error generating barcode for ESN:', shipment.esn, error);
    // Fallback: show ESN as text if barcode fails
    barcodeDataUrl = '';
  }

  // Prepare weight
  const weight = shipment.size?.weight 
    ? `${shipment.size.weight} KG` 
    : 'TBD';

  // Prepare destination (UPPERCASE for clarity)
  const destination = (shipment.shipmentDestination || 'N/A').toUpperCase().replace(/_/g, ' ');

  return `
    <div class="label-container">
      <div class="label-header">
        <img src="${logoImage}" alt="MAZ Express" class="logo" />
      </div>
      
      <div class="label-main">
        <div class="csn">${shipment.csn}</div>
      </div>
      
      <div class="label-info">
        <div class="info-row weight"><span class="label-text">Weight:</span> ${weight}</div>
        <div class="info-row destination">${destination}</div>
      </div>
      
      <div class="label-barcode">
        ${barcodeDataUrl 
          ? `<img src="${barcodeDataUrl}" alt="ESN Barcode" class="barcode" />`
          : `<div class="barcode-fallback">${shipment.esn}</div>`
        }
      </div>
    </div>
  `;
}

// Print single shipment label
export async function generateShipmentLabel(shipment: IShipment): Promise<void> {
  const labelHTML = generateLabelHTML(shipment);
  
  if (!labelHTML) {
    alert('Failed to generate label for this shipment');
    return;
  }

  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    alert('Please allow pop-ups to print labels');
    return;
  }

  const fullHTML = `
    <!DOCTYPE html>
    <html lang="en" dir="ltr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Shipment Label - ${shipment.csn}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        @page {
          size: 4in 6in;
          margin: 0;
        }

        body {
          font-family: Arial, Tahoma, sans-serif;
          background: white;
          color: black;
          padding: 0;
          margin: 0;
        }

        .label-container {
          width: 4in;
          height: 6in;
          padding: 0.25in;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          page-break-after: always;
        }

        .label-container:last-child {
          page-break-after: auto;
        }

        /* International Label Styles */
        .label-header {
          text-align: center;
          padding-bottom: 0.1in;
          border-bottom: 2px solid #000;
        }

        .logo {
          width: 2.8in;
          height: auto;
          max-height: 0.8in;
          object-fit: contain;
        }

        .label-main {
          text-align: center;
          padding: 0.15in 0;
        }

        .csn {
          font-size: 84px;
          font-weight: bold;
          line-height: 1;
          letter-spacing: -2px;
          word-break: break-all;
        }

        .label-info {
          text-align: center;
          padding: 0.1in 0;
          border-top: 2px solid #000;
          border-bottom: 2px solid #000;
        }

        .info-row {
          font-size: 32px;
          margin: 8px 0;
        }

        .info-row.weight {
          font-size: 52px;
          font-weight: bold;
          margin: 12px 0;
        }

        .info-row.destination {
          font-size: 48px;
          font-weight: 600;
          margin: 10px 0;
          letter-spacing: 1px;
        }

        .label-text {
          font-weight: normal;
          font-size: 0.7em;
        }

        .label-barcode {
          text-align: center;
          padding-top: 0.1in;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .barcode {
          width: 100%;
          max-width: 3.5in;
          height: auto;
        }

        .barcode-fallback {
          font-size: 36px;
          font-weight: bold;
          font-family: 'Courier New', monospace;
          padding: 20px;
          background: #f0f0f0;
          border: 2px dashed #000;
        }

        /* Header Table */
        .header-table {
          width: 100%;
          table-layout: fixed;
          border-collapse: collapse;
          border-bottom: 2px solid #000;
          margin-bottom: 0.15in;
        }

        .logo-cell {
          width: 60%;
          padding: 8px;
          vertical-align: middle;
        }

        .qr-cell {
          width: 40%;
          padding: 8px;
          text-align: center;
          vertical-align: top;
        }

        .logo {
          width: 100%;
          max-width: 2in;
          height: auto;
          max-height: 0.6in;
          object-fit: contain;
        }

        .qr-code {
          width: 1in;
          height: 1in;
          display: block;
          margin: 0 auto 8px auto;
        }

        .date-box {
          border: 2px solid #000;
          padding: 4px 8px;
          font-size: 14px;
          font-weight: bold;
          text-align: center;
          display: inline-block;
          min-width: 1in;
        }

        /* Info Table */
        .info-table {
          width: 100%;
          border-collapse: collapse;
          margin: 0.15in 0;
        }

        .info-table td {
          border: 1px solid #000;
          padding: 8px 12px;
          vertical-align: middle;
          min-height: 0.45in;
        }

        .label-arabic {
          width: 35%;
          font-size: 18px;
          font-weight: bold;
          text-align: right;
          direction: rtl;
        }

        .value-text {
          width: 65%;
          font-size: 16px;
          text-align: left;
          direction: ltr;
          word-break: break-word;
        }

        /* Footer Table */
        .footer-table {
          width: 100%;
          border-collapse: collapse;
          border-top: 2px solid #000;
          margin-top: 0.1in;
        }

        .footer-text {
          padding: 8px;
          text-align: center;
          font-size: 14px;
          font-weight: 500;
        }

        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      </style>
    </head>
    <body>
      ${labelHTML}
    </body>
    </html>
  `;

  printWindow.document.write(fullHTML);
  printWindow.document.close();

  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };
}

// Print multiple shipment labels
export async function generateBulkShipmentLabels(shipments: IShipment[]): Promise<void> {
  if (shipments.length === 0) {
    alert('No shipments selected');
    return;
  }

  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    alert('Please allow pop-ups to print labels');
    return;
  }

  // Generate HTML for all shipments
  const labels = shipments.map(shipment => generateLabelHTML(shipment));
  const labelsHTML = labels.filter(html => html !== '').join('\n');

  if (!labelsHTML) {
    alert('Failed to generate labels');
    printWindow.close();
    return;
  }

  const fullHTML = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Shipment Labels (${shipments.length} labels)</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        @page {
          size: 4in 6in;
          margin: 0;
        }

        body {
          font-family: Arial, Tahoma, sans-serif;
          background: white;
          color: black;
          padding: 0;
          margin: 0;
        }

        .label-container {
          width: 4in;
          height: 6in;
          padding: 0.25in;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          page-break-after: always;
          page-break-before: always;
          page-break-inside: avoid;
          break-inside: avoid;
          break-after: page;
          break-before: page;
          overflow: hidden;
          position: relative;
        }

        .label-container:first-child {
          page-break-before: auto;
          break-before: auto;
        }

        .label-container:last-child {
          page-break-after: auto;
          break-after: auto;
        }

        /* International Label Styles */
        .label-header {
          text-align: center;
          padding-bottom: 0.1in;
          border-bottom: 2px solid #000;
        }

        .logo {
          width: 2.8in;
          height: auto;
          max-height: 0.8in;
          object-fit: contain;
        }

        .label-main {
          text-align: center;
          padding: 0.15in 0;
        }

        .csn {
          font-size: 84px;
          font-weight: bold;
          line-height: 1;
          letter-spacing: -2px;
          word-break: break-all;
        }

        .label-info {
          text-align: center;
          padding: 0.1in 0;
          border-top: 2px solid #000;
          border-bottom: 2px solid #000;
        }

        .info-row {
          font-size: 32px;
          margin: 8px 0;
        }

        .info-row.weight {
          font-size: 52px;
          font-weight: bold;
          margin: 12px 0;
        }

        .info-row.destination {
          font-size: 48px;
          font-weight: 600;
          margin: 10px 0;
          letter-spacing: 1px;
        }

        .label-text {
          font-weight: normal;
          font-size: 0.7em;
        }

        .label-barcode {
          text-align: center;
          padding-top: 0.1in;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .barcode {
          width: 100%;
          max-width: 3.5in;
          height: auto;
        }

        .barcode-fallback {
          font-size: 36px;
          font-weight: bold;
          font-family: 'Courier New', monospace;
          padding: 20px;
          background: #f0f0f0;
          border: 2px dashed #000;
        }

        /* Domestic Label Styles */
        .label-container.domestic {
          padding: 0.2in;
        }

        /* Header Table */
        .header-table {
          width: 100%;
          table-layout: fixed;
          border-collapse: collapse;
          border-bottom: 2px solid #000;
          margin-bottom: 0.15in;
        }

        .logo-cell {
          width: 60%;
          padding: 8px;
          vertical-align: middle;
        }

        .qr-cell {
          width: 40%;
          padding: 8px;
          text-align: center;
          vertical-align: top;
        }

        .logo {
          width: 100%;
          max-width: 2in;
          height: auto;
          max-height: 0.6in;
          object-fit: contain;
        }

        .qr-code {
          width: 1in;
          height: 1in;
          display: block;
          margin: 0 auto 8px auto;
        }

        .date-box {
          border: 2px solid #000;
          padding: 4px 8px;
          font-size: 14px;
          font-weight: bold;
          text-align: center;
          display: inline-block;
          min-width: 1in;
        }

        /* Info Table */
        .info-table {
          width: 100%;
          border-collapse: collapse;
          margin: 0.15in 0;
        }

        .info-table td {
          border: 1px solid #000;
          padding: 8px 12px;
          vertical-align: middle;
          min-height: 0.45in;
        }

        .label-arabic {
          width: 35%;
          font-size: 18px;
          font-weight: bold;
          text-align: right;
          direction: rtl;
        }

        .value-text {
          width: 65%;
          font-size: 16px;
          text-align: left;
          direction: ltr;
          word-break: break-word;
        }

        /* Footer Table */
        .footer-table {
          width: 100%;
          border-collapse: collapse;
          border-top: 2px solid #000;
          margin-top: 0.1in;
        }

        .footer-text {
          padding: 8px;
          text-align: center;
          font-size: 14px;
          font-weight: 500;
        }

        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          .label-container {
            page-break-before: always !important;
            page-break-after: always !important;
            page-break-inside: avoid !important;
          }
          
          .label-container:first-child {
            page-break-before: avoid !important;
          }
        }
      </style>
    </head>
    <body>
      ${labelsHTML}
    </body>
    </html>
  `;

  printWindow.document.write(fullHTML);
  printWindow.document.close();

  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };
}

// ============================================
// ANGULAR-STYLE LABELS (768x1153px page size)
// ============================================

// Generate Angular-style label HTML for a single shipment
function generateAngularLabelHTML(shipment: IShipment, stampSrc?: string): string {
  const size = shipment.size || { length: 0, width: 0, height: 0, weight: 0 };
  const dims = `${size.length || 0} X ${size.width || 0} X ${size.height || 0} CM`;
  const weightText = `الوزن ${size.weight || 0} KG`;
  const destination = formatCityName(shipment.shipmentDestination) || shipment.shipmentDestination || 'N/A';

  // Generate Codabar barcode
  const canvas = document.createElement('canvas');
  let barcodeDataUrl = '';
  
  try {
    JsBarcode(canvas, shipment.esn, {
      format: 'codabar',
      displayValue: false,
      margin: 0,
      width: 2,
      height: 150,
    });
    barcodeDataUrl = canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Error generating Codabar barcode for ESN:', shipment.esn, error);
  }

  return `
    <div class="print-label-page">
      ${stampSrc ? `<img src="${stampSrc}" alt="STAMP" class="print-label-stamp" />` : ''}
      <div class="print-label-csn">${shipment.csn}</div>
      <div class="print-label-box">
        <div class="print-label-dims">${dims}</div>
        <div class="print-label-weight">${weightText}</div>
        <div class="print-label-dest">${destination}</div>
      </div>
      <div class="print-label-barcode-wrap">
        ${barcodeDataUrl 
          ? `<img src="${barcodeDataUrl}" alt="Barcode" style="width: 500px; height: 150px; display: block;" />`
          : `<div style="font-size: 36px; font-weight: bold; font-family: monospace;">${shipment.esn}</div>`
        }
        <div class="print-label-tracking">${shipment.esn}</div>
      </div>
    </div>
  `;
}

// Get CSS for Angular-style labels
function getAngularLabelCSS(): string {
  return `
/* ====== PRINT PAGE SIZE (MUST MATCH ANGULAR) ====== */
@page {
  size: 768px 1153px;
  margin: 0;
  padding: 0;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  direction: ltr;
  font-family: Cairo, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
}

@media print {
  html, body { width: 768px; height: 1153px; }
}

.print-label-page {
  width: 768px;
  height: 1153px;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  page-break-after: always;
  break-after: page;
}

.print-label-stamp {
  width: 300px;
  margin-bottom: -125px;
  transform: translateY(-40px);
  display: block;
}

.print-label-csn {
  font-size: 110px;
  line-height: 1;
  font-weight: 800;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: clip;
  max-width: 740px;
}

.print-label-box {
  width: 740px;
  display: flex;
  flex-direction: column;
  align-items: center;
  border-top: 1px solid #000;
  border-bottom: 1px solid #000;
  margin-top: 10px;
  padding: 18px 10px;
  gap: 10px;
}

.print-label-dims {
  font-size: 80px;
  line-height: 1.1;
  font-weight: 700;
  text-align: center;
}

.print-label-weight {
  font-size: 90px;
  line-height: 1.1;
  font-weight: 800;
  text-align: center;
  direction: rtl;
}

.print-label-dest {
  font-size: 90px;
  line-height: 1.1;
  font-weight: 800;
  text-align: center;
  direction: rtl;
}

.print-label-barcode-wrap {
  width: 740px;
  margin-top: 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.print-label-tracking {
  width: 500px;
  font-size: 48px;
  line-height: 1.1;
  font-weight: 800;
  text-align: center;
  margin-top: 12px;
  direction: ltr;
}

@media print {
  .print-label-page {
    overflow: hidden;
  }
}
`;
}

// Print single shipment with Angular-style label
export async function generateAngularStyleLabel(shipment: IShipment, stampSrc?: string): Promise<void> {
  const labelHTML = generateAngularLabelHTML(shipment, stampSrc);
  
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    alert('Please allow pop-ups to print labels');
    return;
  }

  const fullHTML = `
    <!DOCTYPE html>
    <html lang="ar" dir="ltr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Shipment Label - ${shipment.csn}</title>
      <style>${getAngularLabelCSS()}</style>
    </head>
    <body>
      ${labelHTML}
    </body>
    </html>
  `;

  printWindow.document.write(fullHTML);
  printWindow.document.close();

  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };
}

// Print multiple shipments with Angular-style labels
export async function generateBulkAngularStyleLabels(shipments: IShipment[], stampSrc?: string): Promise<void> {
  if (shipments.length === 0) {
    alert('No shipments selected');
    return;
  }

  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    alert('Please allow pop-ups to print labels');
    return;
  }

  const labelsHTML = shipments
    .map(shipment => generateAngularLabelHTML(shipment, stampSrc))
    .join('\n');

  const fullHTML = `
    <!DOCTYPE html>
    <html lang="ar" dir="ltr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Shipment Labels (${shipments.length} labels)</title>
      <style>${getAngularLabelCSS()}</style>
    </head>
    <body>
      ${labelsHTML}
    </body>
    </html>
  `;

  printWindow.document.write(fullHTML);
  printWindow.document.close();

  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };
}
