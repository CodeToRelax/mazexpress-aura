import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
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

// Generate domestic 10x10 cm label HTML with Arabic text and QR code
async function generateDomesticLabel10x10HTML(shipment: IShipment): Promise<string> {
  // Generate QR code from ESN
  let qrCodeDataUrl = '';
  try {
    qrCodeDataUrl = await QRCode.toDataURL(shipment.esn, {
      width: 150,
      margin: 1,
      color: { dark: '#000000', light: '#FFFFFF' }
    });
  } catch (error) {
    console.error('Error generating QR code for ESN:', shipment.esn, error);
  }

  const details = shipment.domesticShipmentDetails;
  const senderName = details?.senderName || 'N/A';
  const receiverName = details?.receiverName || 'N/A';
  const receiverPhone = details?.receiverPrimaryPhoneNumber || 'N/A';
  const originCity = shipment.originCity ? formatCityName(shipment.originCity) : 'N/A';
  const destinationCity = formatCityName(shipment.shipmentDestination) || 'N/A';
  const productPrice = details?.productPrice || 0;
  const productQuantity = details?.productQuantity || 1;
  const note = details?.note || shipment.note || '';

  return `
    <div class="label domestic-label">
      <div class="domestic-header">
        <img src="${stampImage}" alt="MAZ Express" class="domestic-logo" />
        <div class="qr-container">
          ${qrCodeDataUrl ? `<img src="${qrCodeDataUrl}" alt="QR" class="qr-code" />` : ''}
        </div>
      </div>
      
      <div class="domestic-info">
        <div class="info-row-ar">
          <span class="label-ar">المرسل:</span>
          <span class="value-ar">${senderName}</span>
        </div>
        <div class="info-row-ar">
          <span class="label-ar">المستلم:</span>
          <span class="value-ar">${receiverName}</span>
        </div>
        <div class="info-row-ar">
          <span class="label-ar">الهاتف:</span>
          <span class="value-ar">${receiverPhone}</span>
        </div>
        <div class="info-row-ar cities-row">
          <span class="city-tag">${originCity}</span>
          <span class="arrow">←</span>
          <span class="city-tag highlight">${destinationCity}</span>
        </div>
        <div class="info-row-ar price-row">
          <span class="price-box">${productPrice} د.ل</span>
          <span class="qty-box">العدد: ${productQuantity}</span>
        </div>
        ${note ? `<div class="note-row">${note}</div>` : ''}
      </div>
      
      <div class="domestic-footer">
        <span class="esn-text">${shipment.esn}</span>
      </div>
    </div>
  `;
}

// Get CSS for domestic 10x10 cm labels
function getDomesticLabel10x10CSS(): string {
  return `
    .domestic-label {
      direction: rtl;
      text-align: right;
      font-family: 'Cairo', 'Segoe UI', Arial, sans-serif;
    }

    .domestic-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 2mm;
      border-bottom: 1px solid #000;
    }

    .domestic-logo {
      height: 16mm;
      width: auto;
      object-fit: contain;
    }

    .qr-container {
      display: flex;
      align-items: center;
    }

    .qr-code {
      width: 20mm;
      height: 20mm;
      object-fit: contain;
    }

    .domestic-info {
      padding: 2mm 0;
      display: flex;
      flex-direction: column;
      gap: 1.5mm;
    }

    .info-row-ar {
      display: flex;
      align-items: center;
      gap: 2mm;
      font-size: 11pt;
    }

    .label-ar {
      font-weight: 700;
      min-width: 18mm;
      color: #333;
    }

    .value-ar {
      font-weight: 600;
    }

    .cities-row {
      justify-content: center;
      gap: 3mm;
      padding: 2mm 0;
      border-top: 1px dashed #999;
      border-bottom: 1px dashed #999;
    }

    .city-tag {
      font-size: 12pt;
      font-weight: 700;
      padding: 1mm 3mm;
      background: #f0f0f0;
      border-radius: 2mm;
    }

    .city-tag.highlight {
      background: #000;
      color: #fff;
    }

    .arrow {
      font-size: 14pt;
      font-weight: bold;
    }

    .price-row {
      justify-content: center;
      gap: 4mm;
      padding-top: 2mm;
    }

    .price-box {
      font-size: 14pt;
      font-weight: 800;
      padding: 1mm 4mm;
      background: #000;
      color: #fff;
      border-radius: 2mm;
    }

    .qty-box {
      font-size: 11pt;
      font-weight: 700;
      padding: 1mm 3mm;
      border: 1px solid #000;
      border-radius: 2mm;
    }

    .note-row {
      font-size: 9pt;
      color: #555;
      text-align: center;
      padding: 1mm;
      background: #f9f9f9;
      border-radius: 1mm;
      margin-top: 1mm;
    }

    .domestic-footer {
      display: flex;
      justify-content: center;
      padding-top: 2mm;
      border-top: 1px solid #000;
    }

    .esn-text {
      font-size: 10pt;
      font-weight: 700;
      font-family: 'Courier New', monospace;
      letter-spacing: 0.5px;
    }
  `;
}

// Print multiple 10x10 cm labels (smart: detects domestic vs international)
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

  // Separate domestic and international shipments
  const domesticShipments = shipments.filter(s => s.isDomestic);
  const internationalShipments = shipments.filter(s => !s.isDomestic);

  // Generate labels for each type
  const domesticLabelsPromises = domesticShipments.map(s => generateDomesticLabel10x10HTML(s));
  const domesticLabels = await Promise.all(domesticLabelsPromises);
  const internationalLabels = internationalShipments.map(s => generateLabel10x10HTML(s));

  // Combine all labels
  const allLabelsHTML = [...internationalLabels, ...domesticLabels].join('\n');

  const fullHTML = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Labels (${shipments.length})</title>
      <style>
        ${getLabel10x10CSS()}
        ${getDomesticLabel10x10CSS()}
      </style>
    </head>
    <body>
      ${allLabelsHTML}
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
