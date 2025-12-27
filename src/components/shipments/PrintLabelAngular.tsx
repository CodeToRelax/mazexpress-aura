import React, { useEffect, useRef, useMemo } from "react";
import JsBarcode from "jsbarcode";

/**
 * Shipment data shape for Angular-matching label
 */
export type LabelShipment = {
  csn: string | number;
  esn: string;
  shipmentDestination: string;
  size: {
    length: number | string;
    width: number | string;
    height: number | string;
    weight: number | string;
  };
};

type Props = {
  shipments: LabelShipment[];
  stampSrc?: string;
};

function BarcodeCodabar({
  value,
  widthPx,
  heightPx,
}: {
  value: string;
  widthPx: number;
  heightPx: number;
}) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    JsBarcode(svgRef.current, value, {
      format: "codabar",
      displayValue: false,
      margin: 0,
      width: 2,
      height: Math.max(10, heightPx),
    });
  }, [value, heightPx]);

  return (
    <svg
      ref={svgRef}
      width={widthPx}
      height={heightPx}
      style={{ display: "block" }}
    />
  );
}

export default function PrintLabelAngular({ shipments, stampSrc }: Props) {
  const css = useMemo(
    () => `
/* ====== PRINT PAGE SIZE (MUST MATCH ANGULAR) ====== */
@page {
  size: 768px 1153px;
  margin: 0;
  padding: 0;
}

/* Reset */
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }

body {
  direction: ltr;
  font-family: Cairo, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
}

@media print {
  html, body { width: 768px; height: 1153px; }
}

/* One shipment = one page */
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

/* Logo positioning copied from Angular inline styles */
.print-label-stamp {
  width: 300px;
  margin-bottom: -125px;
  transform: translateY(-40px);
  display: block;
}

/* === رقم الحساب (CSN) ===
   Requirement:
   - smaller
   - ONLY 1 line (no wrapping)
*/
.print-label-csn {
  font-size: 110px;
  line-height: 1;
  font-weight: 800;

  white-space: nowrap;
  overflow: hidden;
  text-overflow: clip;
  max-width: 740px;
}

/* Box with borders (same as Angular: top+bottom border) */
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

/* Dimensions line (matches Angular large sizing) */
.print-label-dims {
  font-size: 80px;
  line-height: 1.1;
  font-weight: 700;
  text-align: center;
}

/* Weight line (Arabic only) */
.print-label-weight {
  font-size: 90px;
  line-height: 1.1;
  font-weight: 800;
  text-align: center;

  direction: rtl;
}

/* Destination (same size as Angular) */
.print-label-dest {
  font-size: 90px;
  line-height: 1.1;
  font-weight: 800;
  text-align: center;

  direction: rtl;
}

/* Barcode area */
.print-label-barcode-wrap {
  width: 740px;
  margin-top: 28px;

  display: flex;
  flex-direction: column;
  align-items: center;
}

/* Tracking under barcode */
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

.cdk-live-announcer-element ~ div {
  visibility: hidden;
}
`,
    []
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />

      {shipments.map((shipment, idx) => {
        const dims = `${shipment.size.length} X ${shipment.size.width} X ${shipment.size.height} CM`;
        const weightText = `الوزن ${shipment.size.weight} KG`;

        return (
          <div key={idx} className="print-label-page">
            {stampSrc && (
              <img src={stampSrc} alt="STAMP" className="print-label-stamp" />
            )}

            {/* رقم الحساب */}
            <div className="print-label-csn">{shipment.csn}</div>

            <div className="print-label-box">
              <div className="print-label-dims">{dims}</div>
              <div className="print-label-weight">{weightText}</div>
              <div className="print-label-dest">{shipment.shipmentDestination}</div>
            </div>

            <div className="print-label-barcode-wrap">
              {/* Barcode matches Angular: width=500px, height=150px */}
              <BarcodeCodabar value={shipment.esn} widthPx={500} heightPx={150} />

              {/* Tracking number under barcode — same width, bigger */}
              <div className="print-label-tracking">{shipment.esn}</div>
            </div>
          </div>
        );
      })}
    </>
  );
}

// Export the component's label generation functions
export function generateAngularLabelHTML(shipment: LabelShipment, stampSrc?: string): string {
  const dims = `${shipment.size.length} X ${shipment.size.width} X ${shipment.size.height} CM`;
  const weightText = `الوزن ${shipment.size.weight} KG`;

  // Generate barcode as canvas data URL
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
        <div class="print-label-dest">${shipment.shipmentDestination}</div>
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

export function getAngularLabelCSS(): string {
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
