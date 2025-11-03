import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import type { IShipment } from '@/types/shipment';
import logoImage from '@/assets/maz-express-logo.png';
import { formatCityName } from './shipmentHelpers';

// Generate domestic label HTML with Arabic text
async function generateDomesticLabelHTML(shipment: IShipment): Promise<string> {
  // Generate QR code from ESN
  let qrCodeDataUrl = '';
  try {
    qrCodeDataUrl = await QRCode.toDataURL(shipment.esn, {
      width: 200,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
  } catch (error) {
    console.error('Error generating QR code for ESN:', shipment.esn, error);
  }

  // Format date as DD.MM.YYYY
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return new Date().toLocaleDateString('en-GB').replace(/\//g, '.');
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const details = shipment.domesticShipmentDetails;
  const senderName = details?.senderName || 'N/A';
  const receiverName = details?.receiverName || 'N/A';
  const receiverPhone = details?.receiverPrimaryPhoneNumber || 'N/A';
  const originCity = details?.originCity ? formatCityName(details.originCity) : 'N/A';
  const destinationCity = formatCityName(shipment.shipmentDestination) || 'N/A';
  const detailedAddress = details?.destination || 'N/A';
  const productPrice = details?.productPrice || 0;
  const productQuantity = details?.productQuantity || 1;
  const note = details?.note || shipment.note || '-';
  const date = formatDate(shipment.createdAt);

  return `
    <div class="label-container domestic">
      <table class="header-table">
        <tr>
          <td class="logo-cell">
            <img src="${logoImage}" alt="MAZ Express" class="logo" />
          </td>
          <td class="qr-cell">
            ${qrCodeDataUrl ? `<img src="${qrCodeDataUrl}" alt="QR Code" class="qr-code" />` : ''}
            <div class="date-box">${date}</div>
          </td>
        </tr>
      </table>
      
      <table class="info-table">
        <tr>
          <td class="label-arabic">اسم المرسل</td>
          <td class="value-text">${senderName}</td>
        </tr>
        <tr>
          <td class="label-arabic">اسم المستلم</td>
          <td class="value-text">${receiverName}</td>
        </tr>
        <tr>
          <td class="label-arabic">هاتف المستلم</td>
          <td class="value-text">${receiverPhone}</td>
        </tr>
        <tr>
          <td class="label-arabic">مدينة المنشأ</td>
          <td class="value-text">${originCity}</td>
        </tr>
        <tr>
          <td class="label-arabic">مدينة الوجهة</td>
          <td class="value-text">${destinationCity}</td>
        </tr>
        <tr>
          <td class="label-arabic">العنوان التفصيلي</td>
          <td class="value-text">${detailedAddress}</td>
        </tr>
        <tr>
          <td class="label-arabic">سعر المنتج</td>
          <td class="value-text">${productPrice}</td>
        </tr>
        <tr>
          <td class="label-arabic">العدد</td>
          <td class="value-text">${productQuantity}</td>
        </tr>
        <tr>
          <td class="label-arabic">ملاحظة</td>
          <td class="value-text">${note}</td>
        </tr>
      </table>
      
      <table class="footer-table">
        <tr>
          <td class="footer-text">mazexpress2020@gmail.com</td>
        </tr>
      </table>
    </div>
  `;
}

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
  // Check if domestic and generate appropriate label
  const labelHTML = shipment.isDomestic 
    ? await generateDomesticLabelHTML(shipment)
    : generateLabelHTML(shipment);
  
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
    <html lang="${shipment.isDomestic ? 'ar' : 'en'}" dir="${shipment.isDomestic ? 'rtl' : 'ltr'}">
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

  // Generate HTML for all shipments (handle both domestic and international)
  const labelPromises = shipments.map(shipment => 
    shipment.isDomestic 
      ? generateDomesticLabelHTML(shipment)
      : Promise.resolve(generateLabelHTML(shipment))
  );
  
  const labels = await Promise.all(labelPromises);
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
