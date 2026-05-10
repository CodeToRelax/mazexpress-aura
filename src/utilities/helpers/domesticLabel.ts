import JsBarcode from 'jsbarcode';
import stampImage from '@/assets/maz-express-stamp.png';
import { titleCaseCity } from '@/data/domesticCities';
import type { DomesticLabelData } from '@/types/domestic';

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
    n || 0
  );
}

function escape(s: string | null | undefined) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function generateLabelHTML(label: DomesticLabelData): string {
  const canvas = document.createElement('canvas');
  let barcodeDataUrl = '';
  try {
    JsBarcode(canvas, label.barcode || label.shipmentNumber, {
      format: 'CODE128',
      width: 2,
      height: 50,
      displayValue: false,
      margin: 0,
      background: '#FFFFFF',
      lineColor: '#000000',
    });
    barcodeDataUrl = canvas.toDataURL('image/png');
  } catch (e) {
    console.error('Domestic label barcode error', e);
  }

  const altPhoneRow = label.destination.recipientAlternatePhone
    ? `<div class="row"><span class="lbl">Alt</span><span>${escape(
        label.destination.recipientAlternatePhone
      )}</span></div>`
    : '';

  return `
    <div class="label">
      <div class="head">
        <img src="${stampImage}" alt="MAZ Express" class="logo" />
        <div class="head-meta">
          <div class="num">#${escape(label.shipmentNumber)}</div>
          <div class="tier">Tier ${escape(label.tier)}</div>
        </div>
      </div>

      <div class="block">
        <div class="block-title">FROM</div>
        <div class="row"><span class="lbl">Name</span><span>${escape(label.origin.senderName)}</span></div>
        <div class="row"><span class="lbl">Phone</span><span>${escape(label.origin.senderPhone)}</span></div>
        <div class="row"><span class="lbl">City</span><span>${escape(titleCaseCity(label.origin.city))}</span></div>
      </div>

      <div class="block to">
        <div class="block-title">TO</div>
        <div class="row"><span class="lbl">Name</span><span>${escape(label.destination.recipientName)}</span></div>
        <div class="row"><span class="lbl">Phone</span><span>${escape(label.destination.recipientPhone)}</span></div>
        ${altPhoneRow}
        <div class="row"><span class="lbl">City</span><span>${escape(titleCaseCity(label.destination.city))}</span></div>
        <div class="row"><span class="lbl">Address</span><span>${escape(label.destination.address)}</span></div>
      </div>

      <div class="block">
        <div class="row"><span class="lbl">Item</span><span>${escape(label.parcel.description)}</span></div>
        <div class="row"><span class="lbl">Qty</span><span>${label.parcel.quantity}</span></div>
        <div class="row"><span class="lbl">Shipping</span><span>${fmt(label.shipping.price)} ${escape(
          label.shipping.currency || 'LYD'
        )}</span></div>
      </div>

      <div class="barcode-section">
        ${
          barcodeDataUrl
            ? `<img src="${barcodeDataUrl}" alt="Barcode" class="barcode" />`
            : `<div class="barcode-fallback">${escape(label.barcode || label.shipmentNumber)}</div>`
        }
        <div class="tracking">${escape(label.barcode || label.shipmentNumber)}</div>
      </div>
    </div>
  `;
}

function getCSS(): string {
  return `
    *{margin:0;padding:0;box-sizing:border-box;}
    @page{size:10cm 15cm;margin:0;}
    body{font-family:Arial,Helvetica,sans-serif;background:#fff;color:#000;-webkit-font-smoothing:antialiased;}
    .label{width:10cm;height:15cm;padding:5mm;display:flex;flex-direction:column;gap:2mm;page-break-after:always;}
    .label:last-child{page-break-after:auto;}
    .head{display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #000;padding-bottom:2mm;}
    .logo{height:14mm;width:auto;object-fit:contain;}
    .head-meta{text-align:right;}
    .num{font-size:12pt;font-weight:700;font-family:'Courier New',monospace;}
    .tier{font-size:9pt;font-weight:700;margin-top:1mm;}
    .block{padding:2mm 0;border-bottom:1px dashed #999;}
    .block-title{font-size:8pt;font-weight:700;letter-spacing:1px;color:#555;margin-bottom:1mm;}
    .to .block-title{color:#000;font-size:9pt;}
    .to{background:#f5f5f5;padding:2mm;border:1px solid #000;border-radius:1mm;}
    .row{display:flex;gap:2mm;font-size:9pt;line-height:1.3;margin-bottom:0.5mm;}
    .lbl{min-width:14mm;color:#666;font-weight:600;}
    .barcode-section{margin-top:auto;display:flex;flex-direction:column;align-items:center;border-top:1px solid #000;padding-top:2mm;}
    .barcode{width:80mm;height:14mm;object-fit:contain;}
    .barcode-fallback{font-size:14pt;font-weight:700;font-family:'Courier New',monospace;padding:2mm 4mm;border:1px dashed #000;}
    .tracking{margin-top:1mm;font-size:9pt;font-weight:700;font-family:'Courier New',monospace;letter-spacing:0.5px;}
    @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}
  `;
}

export async function printDomesticLabel(label: DomesticLabelData): Promise<void> {
  const html = generateLabelHTML(label);
  const w = window.open('', '_blank');
  if (!w) {
    alert('Please allow pop-ups to print labels');
    return;
  }
  w.document.write(`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Label ${label.shipmentNumber}</title><style>${getCSS()}</style></head><body>${html}</body></html>`);
  w.document.close();
  w.onload = () => {
    setTimeout(() => w.print(), 250);
  };
}