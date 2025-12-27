import React, { useMemo } from "react";

type Shipment = {
  esn?: string;
  size: {
    weight: number;
    length: number;
    width: number;
    height: number;
  };
  extraCosts: number | string;
};

type Props = {
  invoiceNumber: string | number;
  date: Date | string | number;
  userFullName: string;
  userAddress?: string;
  shipments: Shipment[];
  totalWeight: number;
  shippingCost: number | string;
  extraCosts: number | string;
  totalPrice: number;
};

/**
 * EXACT Angular → React port of:
 * - print-invoice.component.html
 * - print-invoice.component.scss
 *
 * Print approach:
 * - This component renders HTML + print CSS.
 * - Your existing print function can print the container that includes this component.
 */
export default function PrintInvoiceA4(props: Props) {
  const { invoiceNumber, date, userFullName, userAddress, shipments, totalWeight, shippingCost, extraCosts, totalPrice } = props;

  const op = useMemo(() => shipments.slice(0, 12), [shipments]);
  const moreOp = useMemo(() => shipments.slice(12), [shipments]);

  // Format date with dash separator (YYYY-MM-DD)
  const formatDate = (d: Props["date"]) => {
    const dt = d instanceof Date ? d : new Date(d);
    const year = dt.getFullYear();
    const month = String(dt.getMonth() + 1).padStart(2, '0');
    const day = String(dt.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Angular: totalPrice | currency : ' '
  const formatNumberLikeCurrencyPipe = (n: number) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);
  };

  const css = `
/* -------------------- FONT: Cairo -------------------- */
@font-face {
  font-family: "Cairo";
  src: url("/fonts/Cairo-Regular.ttf") format("truetype");
  font-weight: 400;
  font-style: normal;
}
@font-face {
  font-family: "Cairo";
  src: url("/fonts/Cairo-Regular.ttf") format("truetype");
  font-weight: 700;
  font-style: normal;
}
@font-face {
  font-family: "Cairo";
  src: url("/fonts/Cairo-Regular.ttf") format("truetype");
  font-weight: 800;
  font-style: normal;
}

/* -------------------- PAGE SETUP (A4 Standard) -------------------- */
@page {
  size: A4 portrait;
  margin: 0;
}

@media print {
  html, body {
    margin: 0 !important;
    padding: 0 !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  .outer-wrapper {
    page-break-after: always;
    page-break-inside: avoid;
  }
  .outer-wrapper:last-child {
    page-break-after: auto;
  }
}

/* -------------------- STYLES (A4 scaled) -------------------- */
:root {
  --blue-color: #367da3;
}

* {
  margin: 0;
  padding: 0;
  font-family: Cairo, sans-serif;
  box-sizing: border-box;
}

.outer-wrapper {
  width: 210mm;
  height: 297mm;
  padding: 8mm 5mm;
  background-color: white;
}

.wrapper {
  border-top: 6px var(--blue-color) solid;
  border-bottom: 6px var(--blue-color) solid;
  position: relative;
  width: 100%;
  height: 100%;
  padding: 8px 15px;
  padding-bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  direction: rtl;
  background-color: white;
  overflow: hidden;
}

.wrapper .bg {
  position: absolute;
  top: 50%;
  right: 50%;
  transform: translate(50%, -50%);
  opacity: 0.1;
}

.wrapper .header {
  display: flex;
  align-items: center;
  justify-content: center;
}

.wrapper .inner-wrapper {
  display: flex;
  flex-direction: column;
  z-index: 1;
}

.wrapper h2,
.wrapper span {
  color: var(--blue-color);
}

.wrapper h2 {
  margin: 0;
  font-size: 32px;
  word-break: break-word;
  overflow-wrap: break-word;
}

.wrapper img {
  max-width: 100%;
  height: auto;
}

.wrapper .top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 15px;
  border-bottom: 2px solid var(--blue-color);
  margin-bottom: 10px;
}

.wrapper .top .details {
  display: flex;
  flex-direction: column;
  text-align: right;
}

.wrapper .top .details h2 {
  margin-bottom: 8px;
}

.wrapper .top .details span {
  font-size: 14px;
}

.wrapper .top .company-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 12px;
}

.wrapper .top .company-info .company-name {
  font-size: 16px;
  font-weight: 700;
  color: var(--blue-color);
}

.wrapper .top .logo-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.wrapper .top .logo-section h2 {
  font-size: 24px;
  margin-top: 8px;
}

.wrapper .invoice {
  width: 100%;
  display: flex;
  flex-direction: column;
  margin-top: 12px;
  background: rgba(54, 125, 163, 0.05);
  padding: 8px 12px;
  border-radius: 8px;
}

.wrapper .invoice .head {
  font-size: 13px;
  font-weight: 700;
  text-align: right;
  margin-bottom: 2px;
}

.wrapper .invoice span {
  font-size: 12px;
  text-align: right;
}

.wrapper .invoice div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.wrapper .items {
  margin-top: 15px;
  width: 100%;
  display: flex;
  flex-direction: column;
}

.wrapper .items table {
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
}

.wrapper .items tr.grey {
  background-color: rgba(128, 128, 128, 0.3);
}

.wrapper .items span {
  font-size: 14px;
  font-weight: 700;
  text-align: right;
  margin-bottom: 4px;
}

.wrapper .items td,
.wrapper .items th {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.wrapper .items td {
  font-size: 11px;
  text-align: right;
  padding: 4px 8px;
  border-bottom: 1px solid rgba(5, 5, 5, 0.06);
  color: black;
}

.wrapper .items td small {
  font-size: 10px;
}

.wrapper .items th {
  position: relative;
  font-size: 11px;
  text-align: right;
  padding: 8px;
}

.wrapper .items th:not(:last-child)::before {
  position: absolute;
  top: 50%;
  inset-inline-end: 0;
  width: 1px;
  height: 1.6em;
  background-color: black;
  transform: translateY(-50%);
  transition: background-color 0.3s;
  content: '';
}

.wrapper .total {
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 10px;
  text-align: right;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
}

.wrapper .total .box {
  width: 120px;
  height: 60px;
  border: 1px solid black;
  margin-left: 8px;
  margin-top: 20px;
}

.wrapper .total div strong {
  font-size: 12px;
  margin-bottom: 6px;
  font-weight: 800;
}

.wrapper .total div small {
  font-size: 9px;
  display: block;
  margin-bottom: 2px;
}
`;

  const PageOne = (
    <div className="outer-wrapper">
      <section className="wrapper">
        <img className="bg" width="300" src="/assets/images/logo/logo.png" alt="" />
        <div className="inner-wrapper">
          <div className="top">
            <div
              style={{
                direction: "rtl",
                textAlign: "right",
                width: 320,
                padding: "16px 18px",
                border: "1px solid #111",
                borderRadius: 12,
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: 20,
                  fontWeight: 800,
                  letterSpacing: 0.3,
                }}
              >
                فاتورة
              </h2>

              {/* Company info */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  lineHeight: 1.3,
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 800 }}>MAZEXPRESS</span>
                <span style={{ fontSize: 12 }}>بنغازي, ليبيا</span>
                <span style={{ fontSize: 12, direction: "ltr" }}>0919497423</span>
              </div>

              {/* Divider */}
              <div style={{ borderTop: "1px solid #111", marginTop: 6 }} />

              {/* Invoice meta */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  marginTop: 4,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    gap: 12,
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 700 }}>التاريخ</span>
                  <span style={{ fontSize: 12, fontWeight: 600, direction: "ltr" }}>{formatDate(date)}</span>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    gap: 12,
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 700 }}>الاسم</span>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{userFullName}</span>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    gap: 12,
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 700 }}>العنوان</span>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{userAddress || '-'}</span>
                </div>
              </div>
            </div>
            <div className="logo-section">
              <img width="160" src="/assets/images/logo/Logos-text.png" alt="MAZ Express" />
              <h2>#{String(invoiceNumber).slice(-6)}</h2>
            </div>
          </div>

          <div className="items">
            <table>
              <thead>
                <tr>
                  <th style={{ borderTopRightRadius: 32 }}>رقم</th>
                  <th>وزن الطرد KG</th>
                  <th>رقم التتبع</th>
                  <th>CBM</th>
                  <th>الوزن بالابعاد</th>
                  <th style={{ borderTopLeftRadius: 32 }}>تكاليف إضافية</th>
                </tr>
              </thead>
              <tbody>
                {op.map((shipment, index) => (
                  <tr key={index} className={index % 2 === 1 ? "grey" : ""}>
                    <td>{index + 1}</td>
                    <td>{shipment.size.weight}</td>
                    <td>{shipment.esn || "-"}</td>
                    <td>{shipment.size.length * shipment.size.width * shipment.size.height}</td>
                    <td>{(shipment.size.length * shipment.size.width * shipment.size.height) / 5000}</td>
                    <td>{shipment.extraCosts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* EXACT Angular behavior: summary appears on page 1 only if shipments.length < 13 */}
        {shipments.length < 13 && (
          <div className="items">
            <table>
              <thead>
                <tr>
                  <th style={{ borderTopRightRadius: 32 }}>عدد الطرود</th>
                  <th>إجمالي الوزن KG</th>
                  <th>سعر الكيلو بالدولار</th>
                  <th style={{ borderTopLeftRadius: 32 }}>تكاليف إضافية</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{shipments.length}</td>
                  <td>{totalWeight.toFixed(2)} KG</td>
                  <td>{shippingCost}</td>
                  <td>{extraCosts}</td>
                </tr>
              </tbody>
            </table>

            <div className="total">
              <div>
                <strong> إجمالي السعر {formatNumberLikeCurrencyPipe(totalPrice)} دينار </strong>
              </div>

              <div>
                <small>يرجى مراعاة ان اقل وزن يمكن احتسابه هو 3 كيلو غرام.</small>
                <small>
                  نؤكد أيًضا أننا نحتسب تكلفة الشحن بناًء على كل من الوزن الفعلي والوزن الحجمي،
                  <br />و يتم احتساب ا لأعلى منهما.
                </small>
                <small>يرجى مراعاة ان شركة ماز اكسبريس غير مسؤولة عن البضائع القابلة للكسر.</small>
                <small>نوصي بفحص الشحنة عند ا لاستلام.</small>
                <small>نتطلع إلى خدمتكم مرة أخرى في ا لمستقبل</small>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );

  // EXACT Angular behavior: page 2 exists only if shipments.length > 12
  const PageTwo =
    shipments.length > 12 ? (
      <div className="outer-wrapper">
        <section className="wrapper">
          <img className="bg" width="300" src="/assets/images/logo/logo.png" alt="" />
          <div className="inner-wrapper">
            <div className="items">
              <table>
                <thead>
                  <tr>
                    <th style={{ borderTopRightRadius: 32 }}>رقم</th>
                    <th>وزن الطرد KG</th>
                    <th>رقم التتبع</th>
                    <th>CBM</th>
                    <th>الوزن بالابعاد</th>
                    <th style={{ borderTopLeftRadius: 32 }}>تكاليف إضافية</th>
                  </tr>
                </thead>
                <tbody>
                  {moreOp.map((shipment, index) => (
                    <tr key={index} className={index % 2 === 1 ? "grey" : ""}>
                      <td>{index + 1 + op.length}</td>
                      <td>{shipment.size.weight}</td>
                      <td>{shipment.esn || "-"}</td>
                      <td>{shipment.size.length * shipment.size.width * shipment.size.height}</td>
                      <td>{(shipment.size.length * shipment.size.width * shipment.size.height) / 5000}</td>
                      <td>{shipment.extraCosts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="items">
            <table>
              <thead>
                <tr>
                  <th style={{ borderTopRightRadius: 32 }}>عدد الطرود</th>
                  <th>إجمالي الوزن KG</th>
                  <th>سعر الكيلو بالدولار</th>
                  <th style={{ borderTopLeftRadius: 32 }}>تكاليف إضافية</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{shipments.length}</td>
                  <td>{totalWeight.toFixed(2)} KG</td>
                  <td>{shippingCost}</td>
                  <td>{extraCosts}</td>
                </tr>
              </tbody>
            </table>

            <div className="total">
              <div>
                <strong> إجمالي السعر {formatNumberLikeCurrencyPipe(totalPrice)} دينار </strong>
              </div>

              <div>
                <small>يرجى مراعاة ان اقل وزن يمكن احتسابه هو 3 كيلو غرام.</small>
                <small>
                  نؤكد أيًضا أننا نحتسب تكلفة الشحن بناًء على كل من الوزن الفعلي والوزن الحجمي،
                  <br />و يتم احتساب ا لأعلى منهما.
                </small>
                <small>يرجى مراعاة ان شركة ماز اكسبريس غير مسؤولة عن البضائع القابلة للكسر.</small>
                <small>نوصي بفحص الشحنة عند ا لاستلام.</small>
                <small>نتطلع إلى خدمتكم مرة أخرى في ا لمستقبل</small>
              </div>
            </div>
          </div>
        </section>
      </div>
    ) : null;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      {PageOne}
      {PageTwo}
    </>
  );
}

export type { Shipment, Props as PrintInvoiceProps };
