import JsBarcode from 'jsbarcode';
import type { IShipment } from '@/types/shipment';
import logoImage from '@/assets/maz-express-logo.png';

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

  // Prepare dimensions - compact format
  const dimensions = shipment.size?.length && shipment.size?.width && shipment.size?.height
    ? `${shipment.size.length}×${shipment.size.width}×${shipment.size.height} CM`
    : 'Dimensions: TBD';

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
        <div class="info-row"><span class="label-text">Dimensions:</span> ${dimensions}</div>
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
export function generateShipmentLabel(shipment: IShipment): void {
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
    <html lang="en">
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
          font-family: Arial, sans-serif;
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
export function generateBulkShipmentLabels(shipments: IShipment[]): void {
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
  const labelsHTML = shipments
    .map(shipment => generateLabelHTML(shipment))
    .filter(html => html !== '')
    .join('\n');

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
          font-family: Arial, sans-serif;
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
