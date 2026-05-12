import JsBarcode from 'jsbarcode';
import logoImage from '@/assets/logo-text.png';
import { titleCaseCity } from '@/data/domesticCities';
import type { DomesticLabelData } from '@/types/domestic';

function fmtMoney(n: number) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(n || 0);
}

function fmtDate(iso: string) {
  try {
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
  } catch {
    return '';
  }
}

const TIER_AR: Record<string, string> = {
  A: 'عادية',
  B: 'سريعة',
  C: 'مميزة',
  D: 'خاصة',
};

function tierLabel(t: string) {
  return TIER_AR[t] || t;
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
      width: 1.6,
      height: 40,
      displayValue: false,
      margin: 0,
      background: '#FFFFFF',
      lineColor: '#000000',
    });
    barcodeDataUrl = canvas.toDataURL('image/png');
  } catch (e) {
    console.error('Domestic label barcode error', e);
  }

  const totalValue = (label.parcel.itemPrice || 0) + (label.shipping.price || 0);
  const altPhoneRow = label.destination.recipientAlternatePhone
    ? `
        <div class="field">
          <span class="field-key">رقم احتياطي</span>
          <span class="field-val phone">${escape(label.destination.recipientAlternatePhone)}</span>
        </div>`
    : '';

  return `
    <div class="label" dir="rtl">
      <!-- HEADER -->
      <div class="header">
        <img src="${logoImage}" alt="MAZ Express" class="brand" />
        <div class="header-divider"></div>
        <div class="contact">
          <div class="contact-title">تواصل معنا</div>
          <div class="contact-line">www.mazexpress.com.ly · 091 123 4567</div>
        </div>
        <div class="ship-no-block">
          <div class="ship-no-label">رقم الشحنة</div>
          <div class="ship-no-value">${escape(label.shipmentNumber)}</div>
        </div>
      </div>

      <!-- MAIN GRID: shipment (right) | recipient (left) -->
      <div class="grid">
        <div class="col">
          <div class="col-title">معلومات الشحنة</div>
          <div class="field">
            <span class="field-key">من مدينة</span>
            <span class="field-val">${escape(titleCaseCity(label.origin.city))}</span>
          </div>
          <div class="field">
            <span class="field-key">إلى مدينة</span>
            <span class="field-val">${escape(titleCaseCity(label.destination.city))}</span>
          </div>
          <div class="field">
            <span class="field-key">اسم المرسل</span>
            <span class="field-val">${escape(label.origin.senderName)}</span>
          </div>
          <div class="field">
            <span class="field-key">قيمة الشحن + المنتج</span>
            <span class="field-val price">${fmtMoney(totalValue)} د.ل</span>
          </div>
        </div>

        <div class="col col-divider">
          <div class="col-title">معلومات المستلم</div>
          <div class="field">
            <span class="field-key">اسم المستلم</span>
            <span class="field-val">${escape(label.destination.recipientName)}</span>
          </div>
          <div class="field">
            <span class="field-key">رقم المستلم</span>
            <span class="field-val phone">${escape(label.destination.recipientPhone)}</span>
          </div>
          ${altPhoneRow}
          <div class="field address">
            <span class="field-key">العنوان</span>
            <span class="field-val">${escape(label.destination.address)}</span>
          </div>
        </div>
      </div>

      <!-- BOTTOM STRIP -->
      <div class="bottom">
        <div class="cell barcode-cell">
          ${
            barcodeDataUrl
              ? `<img src="${barcodeDataUrl}" alt="Barcode" class="barcode" />`
              : `<div class="barcode-fallback">${escape(label.barcode || label.shipmentNumber)}</div>`
          }
          <div class="cell-key">${escape(label.barcode || label.shipmentNumber)}</div>
        </div>
        <div class="cell">
          <div class="cell-key">تاريخ الشحن</div>
          <div class="cell-val">${fmtDate(label.createdAt)}</div>
        </div>
        <div class="cell">
          <div class="cell-key">نوع الشحنة</div>
          <div class="cell-val">${escape(tierLabel(label.tier))}</div>
        </div>
        <div class="cell last">
          <div class="cell-key">عدد القطع</div>
          <div class="cell-val big">${label.parcel.quantity}</div>
        </div>
      </div>
    </div>
  `;
}

function getCSS(): string {
  return `
    *{margin:0;padding:0;box-sizing:border-box;}
    @page{size:15cm 10cm;margin:0;}
    html,body{background:#fff;color:#000;font-family:'Tajawal','Cairo','Segoe UI',Arial,sans-serif;-webkit-font-smoothing:antialiased;}
    .label{width:15cm;height:10cm;padding:3mm;display:flex;flex-direction:column;page-break-after:always;border:1.2pt solid #000;}
    .label:last-child{page-break-after:auto;}

    /* HEADER */
    .header{display:flex;align-items:center;gap:3mm;padding-bottom:2mm;border-bottom:1.2pt solid #000;}
    .brand{height:13mm;width:auto;object-fit:contain;}
    .header-divider{width:0.5pt;height:11mm;background:#000;}
    .contact{flex:1;text-align:center;}
    .contact-title{font-size:8pt;font-weight:700;}
    .contact-line{font-size:7.5pt;margin-top:1mm;letter-spacing:0.2px;}
    .ship-no-block{border:1pt solid #000;padding:1.5mm 3mm;text-align:center;min-width:38mm;}
    .ship-no-label{font-size:7pt;font-weight:700;}
    .ship-no-value{font-family:'Courier New',monospace;font-size:11pt;font-weight:800;letter-spacing:0.5px;margin-top:0.5mm;}

    /* MAIN GRID */
    .grid{flex:1;display:grid;grid-template-columns:1fr 1fr;border-bottom:1.2pt solid #000;}
    .col{display:flex;flex-direction:column;padding:2mm 2mm 1mm;}
    .col-divider{border-left:1pt solid #000;}
    .col-title{background:#000;color:#fff;font-size:8.5pt;font-weight:800;text-align:center;padding:1mm 3mm;border-radius:6mm;margin-bottom:1.5mm;}
    .field{display:flex;justify-content:space-between;align-items:baseline;gap:3mm;padding:1.2mm 1mm;border-bottom:0.5pt solid #000;}
    .field:last-child{border-bottom:none;}
    .field-key{font-size:7.5pt;font-weight:500;color:#000;white-space:nowrap;}
    .field-val{font-size:11pt;font-weight:800;text-align:left;direction:ltr;}
    .field-val.phone{font-family:'Courier New',monospace;letter-spacing:1px;font-size:11pt;}
    .field-val.price{font-size:12pt;}
    .field.address .field-val{font-size:8.5pt;font-weight:700;direction:rtl;text-align:left;line-height:1.3;}

    /* BOTTOM STRIP */
    .bottom{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;align-items:center;min-height:16mm;}
    .cell{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:1mm;border-left:0.8pt solid #000;text-align:center;height:100%;}
    .cell.last{border-left:none;}
    .cell.barcode-cell{padding:1mm 2mm;}
    .cell-key{font-size:7pt;font-weight:700;}
    .cell-val{font-size:11pt;font-weight:800;margin-top:0.5mm;}
    .cell-val.big{font-size:18pt;}
    .barcode{width:100%;max-width:60mm;height:11mm;object-fit:contain;display:block;}
    .barcode-cell .cell-key{font-family:'Courier New',monospace;font-size:7.5pt;margin-top:0.5mm;letter-spacing:0.5px;}
    .barcode-fallback{font-size:11pt;font-weight:800;font-family:'Courier New',monospace;border:0.8pt dashed #000;padding:1.5mm 3mm;}

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
  w.document.write(`<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>Label ${label.shipmentNumber}</title><link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap" rel="stylesheet"><style>${getCSS()}</style></head><body>${html}</body></html>`);
  w.document.close();
  w.onload = () => {
    setTimeout(() => w.print(), 350);
  };
}