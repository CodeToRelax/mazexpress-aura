import JsBarcode from 'jsbarcode';
import type { IShipment } from '@/types/shipment';
import logoImage from '@/assets/maz-express-logo.png';

export function generateShipmentLabel(shipment: IShipment): void {
  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    alert('Please allow pop-ups to print labels');
    return;
  }

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
    console.error('Error generating barcode:', error);
    alert('Invalid ESN format for barcode generation');
    printWindow.close();
    return;
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

  // Build the HTML for the label
  const labelHTML = `
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
          width: 4in;
          height: 6in;
          padding: 0.3in;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          background: white;
          color: black;
        }

        .label-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          height: 100%;
          justify-content: space-between;
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
    </body>
    </html>
  `;

  // Write the HTML to the new window
  printWindow.document.write(labelHTML);
  printWindow.document.close();

  // Wait for the window to load, then trigger print
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };
}
