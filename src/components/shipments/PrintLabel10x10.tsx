import JsBarcode from 'jsbarcode';
import type { IShipment } from '@/types/shipment';
import stampImage from '@/assets/maz-express-stamp.png';
import { formatCityName } from '@/utilities/helpers/shipmentHelpers';

// Generate 10x10 cm label HTML
function generateLabel10x10HTML(shipment: IShipment): string {
  // Generate barcode from ESN
  const canvas = document.createElement('canvas');
  let barcodeDataUrl = '';
  
  try {
    JsBarcode(canvas, shipment.esn, {
      format: 'CODE128',
      width: 2,
      height: 60,
      displayValue: false,
      margin: 0,
      background: '#FFFFFF',
      lineColor: '#000000',
    });
    barcodeDataUrl = canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Error generating barcode for ESN:', shipment.esn, error);
  }

  // Prepare data
  const csn = (shipment.csn || 'N/A').toUpperCase();
  const weight = shipment.size?.weight ? `${shipment.size.weight} KG` : 'N/A';
  const destination = formatCityName(shipment.shipmentDestination) || 'N/A';
  const esn = shipment.esn || 'N/A';

  return `
    <div class="label">
      <div class="logo-section">
        <img src="${stampImage}" alt="MAZ Express" class="logo" />
      </div>
      
      <div class="csn-section">
        <span class="csn">${csn}</span>
      </div>
      
      <div class="info-section">
        <div class="info-row">${weight}</div>
        <div class="info-row">${destination.toUpperCase()}</div>
      </div>
      
      <div class="barcode-section">
        ${barcodeDataUrl 
          ? `<img src="${barcodeDataUrl}" alt="Barcode" class="barcode" />`
          : `<div class="barcode-fallback">${esn}</div>`
        }
        <div class="tracking">TRACKING: ${esn}</div>
      </div>
    </div>
  `;
}

// Get CSS for 10x10 cm labels
function getLabel10x10CSS(): string {
  return `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    @page {
      size: 10cm 10cm;
      margin: 0;
    }

    body {
      font-family: Arial, Helvetica, sans-serif;
      background: white;
      color: black;
      -webkit-font-smoothing: antialiased;
    }

    .label {
      width: 10cm;
      height: 10cm;
      padding: 6mm;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      page-break-after: always;
      background: white;
    }

    .label:last-child {
      page-break-after: auto;
    }

    /* Logo Section */
    .logo-section {
      width: 100%;
      display: flex;
      justify-content: center;
      padding-bottom: 3mm;
    }

    .logo {
      height: 20mm;
      width: auto;
      object-fit: contain;
    }

    /* CSN Section */
    .csn-section {
      width: 100%;
      text-align: center;
      padding: 4mm 0;
      border-top: 1px solid #000;
      border-bottom: 1px solid #000;
    }

    .csn {
      font-size: 26pt;
      font-weight: 700;
      letter-spacing: 1px;
      line-height: 1.1;
    }

    /* Info Section */
    .info-section {
      width: 100%;
      padding: 4mm 0;
      display: flex;
      flex-direction: column;
      gap: 3mm;
    }

    .info-row {
      display: flex;
      justify-content: center;
      align-items: baseline;
      font-size: 14pt;
      font-weight: 700;
    }

    /* Barcode Section */
    .barcode-section {
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding-top: 3mm;
      border-top: 1px solid #000;
    }

    .barcode {
      width: 70mm;
      height: 18mm;
      object-fit: contain;
    }

    .barcode-fallback {
      font-size: 18pt;
      font-weight: bold;
      font-family: 'Courier New', monospace;
      padding: 4mm 6mm;
      background: #f5f5f5;
      border: 1px dashed #000;
    }

    .tracking {
      margin-top: 2mm;
      font-size: 11pt;
      font-weight: 700;
      font-family: 'Courier New', monospace;
      letter-spacing: 0.5px;
    }

    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  `;
}

// Print single 10x10 cm label
export async function generateLabel10x10(shipment: IShipment): Promise<void> {
  const labelHTML = generateLabel10x10HTML(shipment);
  
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
      <title>Label - ${shipment.csn}</title>
      <style>${getLabel10x10CSS()}</style>
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

// Print multiple 10x10 cm labels
export async function generateBulkLabels10x10(shipments: IShipment[]): Promise<void> {
  if (shipments.length === 0) {
    alert('No shipments selected');
    return;
  }

  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    alert('Please allow pop-ups to print labels');
    return;
  }

  const labelsHTML = shipments.map(shipment => generateLabel10x10HTML(shipment)).join('\n');

  const fullHTML = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Labels (${shipments.length})</title>
      <style>${getLabel10x10CSS()}</style>
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
