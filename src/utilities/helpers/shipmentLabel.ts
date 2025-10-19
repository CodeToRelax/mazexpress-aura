import JsBarcode from 'jsbarcode';
import type { IShipment } from '@/types/shipment';
import logoImage from '@/assets/maz-express-logo.png';

// Generate label HTML for a single shipment
function generateLabelHTML(shipment: IShipment): string {
  // Generate barcode from ESN
  const canvas = document.createElement('canvas');
  try {
    JsBarcode(canvas, shipment.esn, {
      format: 'CODE128',
      width: 2,
      height: 100,
      displayValue: true,
      fontSize: 20,
      margin: 10,
      textMargin: 5,
    });
  } catch (error) {
    console.error('Error generating barcode for ESN:', shipment.esn, error);
    return '';
  }

  const barcodeDataUrl = canvas.toDataURL('image/png');

  // Prepare dimensions
  const dimensions = shipment.size?.length && shipment.size?.width && shipment.size?.height
    ? `${shipment.size.length} X ${shipment.size.width} X ${shipment.size.height} CM`
    : '0 X 0 X 0 CM';

  // Prepare weight
  const weight = shipment.size?.weight 
    ? `${shipment.size.weight} KG` 
    : 'Weight: TBD';

  // Prepare destination (lowercase)
  const destination = (shipment.shipmentDestination || 'N/A').toLowerCase().replace(/_/g, ' ');

  return `
    <div class="label-container">
      <div>
        <img src="${logoImage}" alt="MAZ Express" class="logo" />
        <div class="csn">${shipment.csn}</div>
        <hr class="separator" />
        <div class="dimensions">${dimensions}</div>
        <div class="weight">${weight}</div>
        <div class="destination">${destination}</div>
        <hr class="separator" />
      </div>
      <img src="${barcodeDataUrl}" alt="ESN Barcode" class="barcode" />
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
          padding: 0.3in;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          justify-content: space-between;
          page-break-after: always;
        }

        .label-container:last-child {
          page-break-after: auto;
        }

        .logo {
          width: 200px;
          height: auto;
          margin-bottom: 15px;
        }

        .csn {
          font-size: 72px;
          font-weight: bold;
          line-height: 1;
          margin: 10px 0;
          word-break: break-all;
        }

        .separator {
          width: 80%;
          border: 0;
          border-top: 2px solid #000;
          margin: 15px 0;
        }

        .dimensions {
          font-size: 36px;
          font-weight: normal;
          margin: 10px 0;
        }

        .weight {
          font-size: 48px;
          font-weight: bold;
          margin: 10px 0;
        }

        .destination {
          font-size: 56px;
          font-weight: normal;
          margin: 15px 0;
        }

        .barcode {
          width: 100%;
          max-width: 350px;
          height: auto;
          margin-top: 10px;
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
          padding: 0.3in;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          justify-content: space-between;
          page-break-after: always;
        }

        .label-container:last-child {
          page-break-after: auto;
        }

        .logo {
          width: 200px;
          height: auto;
          margin-bottom: 15px;
        }

        .csn {
          font-size: 72px;
          font-weight: bold;
          line-height: 1;
          margin: 10px 0;
          word-break: break-all;
        }

        .separator {
          width: 80%;
          border: 0;
          border-top: 2px solid #000;
          margin: 15px 0;
        }

        .dimensions {
          font-size: 36px;
          font-weight: normal;
          margin: 10px 0;
        }

        .weight {
          font-size: 48px;
          font-weight: bold;
          margin: 10px 0;
        }

        .destination {
          font-size: 56px;
          font-weight: normal;
          margin: 15px 0;
        }

        .barcode {
          width: 100%;
          max-width: 350px;
          height: auto;
          margin-top: 10px;
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
