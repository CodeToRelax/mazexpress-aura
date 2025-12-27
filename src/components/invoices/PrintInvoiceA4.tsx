import React, { useMemo } from "react";

type Shipment = {
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
  const {
    invoiceNumber,
    date,
    userFullName,
    shipments,
    totalWeight,
    shippingCost,
    extraCosts,
    totalPrice,
  } = props;

  const op = useMemo(() => shipments.slice(0, 12), [shipments]);
  const moreOp = useMemo(() => shipments.slice(12), [shipments]);

  // Angular: date | formatDate
  const formatDate = (d: Props["date"]) => {
    const dt = d instanceof Date ? d : new Date(d);
    return new Intl.DateTimeFormat("ar-LY", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(dt);
  };

  // Angular: totalPrice | currency : ' '
  const formatNumberLikeCurrencyPipe = (n: number) => {
    return new Intl.NumberFormat("ar-LY", {
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

/* -------------------- PAGE SETUP (EXACT) -------------------- */
@page {
  size: 2480px 3508px;
  margin: 0;
  padding: 0;
}

/* Ensure printing doesn't shrink or apply margins */
@media print {
  html, body {
    margin: 0 !important;
    padding: 0 !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
}

/* -------------------- ORIGINAL SCSS (converted) -------------------- */
:root {
  --blue-color: #367da3;
}

* {
  margin: 0;
  padding: 0;
  font-family: Cairo, sans-serif;
}

.outer-wrapper {
  padding: 100px 60px;
  height: 100vh;
  width: 100vw;
  background-color: white;
}

.wrapper {
  border-top: 20px var(--blue-color) solid;
  border-bottom: 20px var(--blue-color) solid;
  position: relative;
  width: 100%;
  height: 100%;
  padding: 30px 60px;
  padding-bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  direction: rtl;
  background-color: white;
  overflow-y: scroll;
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
  font-size: 130px;
}

.wrapper .top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 40px;
}

.wrapper .top .details {
  display: flex;
  flex-direction: column;
  text-align: right;
}

.wrapper .top .details span {
  font-size: 55px;
}

.wrapper .invoice {
  width: 100%;
  display: flex;
  flex-direction: column;
  margin-top: 60px;
}

.wrapper .invoice .head {
  font-size: 55px;
  font-weight: 700;
  text-align: right;
  margin-bottom: 15px;
}

.wrapper .invoice span {
  font-size: 45px;
  text-align: right;
}

.wrapper .invoice div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.wrapper .items {
  margin-top: 60px;
  width: 100%;
  display: flex;
  flex-direction: column;
}

.wrapper .items tr.grey {
  background-color: rgba(128, 128, 128, 0.3);
}

.wrapper .items span {
  font-size: 55px;
  font-weight: 700;
  text-align: right;
  margin-bottom: 15px;
}

.wrapper .items td {
  font-size: 50px;
  text-align: right;
  padding: 15px 35px;
  border-bottom: 2px solid rgba(5, 5, 5, 0.06);
  color: black;
}

.wrapper .items td small {
  font-size: 40px;
}

.wrapper .items th {
  position: relative;
  font-size: 50px;
  text-align: right;
  padding: 35px;
}

.wrapper .items th:not(:last-child)::before {
  position: absolute;
  top: 50%;
  inset-inline-end: 0;
  width: 1.5px;
  height: 1.6em;
  background-color: black;
  transform: translateY(-50%);
  transition: background-color 0.3s;
  content: '';
}

.wrapper .total {
  font-size: 60px;
  font-weight: 700;
  margin-bottom: 50px;
  text-align: right;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
}

.wrapper .total .box {
  width: 500px;
  height: 250px;
  border: 1px solid black;
  margin-left: 30px;
  margin-top: 100px;
}

.wrapper .total div strong {
  font-size: 35px;
  margin-bottom: 25px;
  font-weight: 800;
}
`;

  const PageOne = (
    <div className="outer-wrapper">
      <section className="wrapper">
        <img
          className="bg"
          width="1200"
          src="/assets/images/logo/logo.png"
          alt=""
        />
        <div className="inner-wrapper">
          <div className="top">
            <div className="details">
              <h2>فاتورة</h2>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span>0919497423</span>
              <span>MAZ EXPRESS</span>
              <span>الموقع</span>
              <span>بنغازي, ليبيا</span>
              <span></span>
              <span></span>
              <span></span>
              <div className="invoice">
                <div>
                  <span className="head">التاريخ</span>
                  <span>{formatDate(date)}</span>
                </div>
                <div>
                  <span className="head">الاسم</span>
                  <span>{userFullName}</span>
                </div>
              </div>
            </div>

            <div>
              <h2>#{invoiceNumber}</h2>
              <img
                width="650"
                src="/assets/images/logo/Logos-text.png"
                alt=""
              />
            </div>
          </div>

          <div className="items">
            <table>
              <thead>
                <tr>
                  <th style={{ borderTopRightRadius: 32 }}>رقم</th>
                  <th>وزن الطرد KG</th>
                  <th>ابعاد الطرد CM</th>
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
                    <td>
                      {shipment.size.length} X {shipment.size.width} X{" "}
                      {shipment.size.height}
                    </td>
                    <td>
                      {shipment.size.length *
                        shipment.size.width *
                        shipment.size.height}
                    </td>
                    <td>
                      {(shipment.size.length *
                        shipment.size.width *
                        shipment.size.height) /
                        5000}
                    </td>
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
                <strong>
                  {" "}
                  إجمالي السعر {formatNumberLikeCurrencyPipe(totalPrice)} دينار{" "}
                </strong>
              </div>

              <div>
                <small>يرجى مراعاة ان اقل وزن يمكن احتسابه هو 3 كيلو غرام.</small>
                <small>
                  نؤكد أيًضا أننا نحتسب تكلفة الشحن بناًء على كل من الوزن الفعلي والوزن الحجمي،
                  <br />
                  و يتم احتساب ا لأعلى منهما.
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
          <img
            className="bg"
            width="1200"
            src="/assets/images/logo/logo.png"
            alt=""
          />
          <div className="inner-wrapper">
            <div className="items">
              <table>
                <thead>
                  <tr>
                    <th style={{ borderTopRightRadius: 32 }}>رقم</th>
                    <th>وزن الطرد KG</th>
                    <th>ابعاد الطرد CM</th>
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
                      <td>
                        {shipment.size.length} X {shipment.size.width} X{" "}
                        {shipment.size.height}
                      </td>
                      <td>
                        {shipment.size.length *
                          shipment.size.width *
                          shipment.size.height}
                      </td>
                      <td>
                        {(shipment.size.length *
                          shipment.size.width *
                          shipment.size.height) /
                          5000}
                      </td>
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
                <strong>
                  {" "}
                  إجمالي السعر {formatNumberLikeCurrencyPipe(totalPrice)} دينار{" "}
                </strong>
              </div>

              <div>
                <small>يرجى مراعاة ان اقل وزن يمكن احتسابه هو 3 كيلو غرام.</small>
                <small>
                  نؤكد أيًضا أننا نحتسب تكلفة الشحن بناًء على كل من الوزن الفعلي والوزن الحجمي،
                  <br />
                  و يتم احتساب ا لأعلى منهما.
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
