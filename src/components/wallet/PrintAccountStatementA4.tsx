import React from "react";
import { format } from "date-fns";
import { Transaction, Wallet } from "@/types/wallet";
import { formatLYD } from "@/utilities/helpers/currencyHelpers";

interface PrintAccountStatementProps {
  wallet: Wallet;
  transactions: Transaction[];
  dateFrom: Date;
  dateTo: Date;
  customerName?: string;
  customerEmail?: string;
  locale?: string;
}

// Translations
const translations = {
  en: {
    title: 'ACCOUNT STATEMENT',
    accountHolder: 'ACCOUNT HOLDER',
    statementNo: 'Statement No:',
    period: 'Period:',
    generated: 'Generated:',
    currency: 'Currency:',
    walletId: 'Wallet ID:',
    date: 'DATE',
    reference: 'REFERENCE',
    type: 'TYPE',
    description: 'DESCRIPTION',
    debit: 'DEBIT',
    credit: 'CREDIT',
    balance: 'BALANCE',
    openingBalance: 'Opening Balance:',
    totalDebits: 'Total Debits:',
    totalCredits: 'Total Credits:',
    closingBalance: 'Closing Balance:',
    noTransactions: 'No transactions in this period',
    companyName: 'MazExpress',
    companySubtitle: 'Shipping & Logistics',
  },
  ar: {
    title: 'كشف الحساب',
    accountHolder: 'بيانات الحساب',
    statementNo: 'رقم الكشف:',
    period: 'الفترة:',
    generated: 'تاريخ الإنشاء:',
    currency: 'العملة:',
    walletId: 'رقم المحفظة:',
    date: 'التاريخ',
    reference: 'المرجع',
    type: 'النوع',
    description: 'الوصف',
    debit: 'مدين',
    credit: 'دائن',
    balance: 'الرصيد',
    openingBalance: 'الرصيد الافتتاحي:',
    totalDebits: 'إجمالي المدين:',
    totalCredits: 'إجمالي الدائن:',
    closingBalance: 'الرصيد الختامي:',
    noTransactions: 'لا توجد معاملات في هذه الفترة',
    companyName: 'ماز إكسبريس',
    companySubtitle: 'للشحن والتوصيل',
  },
};

// Transaction type translations
const typeTranslations = {
  en: {
    deposit: 'Deposit',
    withdrawal: 'Withdrawal',
    deduction: 'Deduction',
    refund: 'Refund',
  },
  ar: {
    deposit: 'إيداع',
    withdrawal: 'سحب',
    deduction: 'خصم',
    refund: 'استرداد',
  },
};

function formatType(type: string, locale: string): string {
  const normalizedLocale: 'en' | 'ar' = locale?.startsWith('ar') ? 'ar' : 'en';
  const key = type.toLowerCase() as keyof typeof typeTranslations.en;
  return typeTranslations[normalizedLocale][key] || type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
}

function calculateSummary(transactions: Transaction[], openingBalance: number) {
  const deposits = transactions
    .filter(t => t.type.toLowerCase() === 'deposit' && t.status.toLowerCase() === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const withdrawals = transactions
    .filter(t => t.type.toLowerCase() === 'withdrawal' && t.status.toLowerCase() === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const deductions = transactions
    .filter(t => t.type.toLowerCase() === 'deduction' && t.status.toLowerCase() === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const refunds = transactions
    .filter(t => t.type.toLowerCase() === 'refund' && t.status.toLowerCase() === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const closingBalance = openingBalance + deposits + refunds - withdrawals - deductions;
  
  return {
    openingBalance,
    deposits,
    withdrawals,
    deductions,
    refunds,
    closingBalance,
    totalCredits: deposits + refunds,
    totalDebits: withdrawals + deductions,
  };
}

export default function PrintAccountStatementA4(props: PrintAccountStatementProps) {
  const { wallet, transactions, dateFrom, dateTo, customerName, customerEmail, locale = 'ar' } = props;
  
  const normalizedLocale: 'en' | 'ar' = locale?.startsWith('ar') ? 'ar' : 'en';
  const t = translations[normalizedLocale];
  const isRTL = normalizedLocale === 'ar';
  
  // Calculate opening balance
  const openingBalance = transactions.length > 0 
    ? transactions[transactions.length - 1].balanceBefore 
    : wallet.balance;
  
  const summary = calculateSummary(transactions, openingBalance);
  
  // Sort transactions by date (newest first)
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  
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

/* -------------------- STYLES -------------------- */
:root {
  --blue-color: #367da3;
  --text-dark: #000000;
  --text-muted: #505050;
  --border-color: #e6e6e6;
  --deposit-green: #22c55e;
  --withdraw-red: #ef4444;
}

* {
  margin: 0;
  padding: 0;
  font-family: Cairo, sans-serif;
  box-sizing: border-box;
}

.outer-wrapper {
  width: 210mm;
  min-height: 297mm;
  padding: 8mm 5mm;
  background-color: white;
}

.wrapper {
  border-top: 6px var(--blue-color) solid;
  border-bottom: 6px var(--blue-color) solid;
  position: relative;
  width: 100%;
  min-height: calc(297mm - 16mm);
  padding: 15px 20px;
  display: flex;
  flex-direction: column;
  direction: ${isRTL ? 'rtl' : 'ltr'};
  background-color: white;
  overflow: hidden;
}

.wrapper .bg {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  opacity: 0.1;
  pointer-events: none;
}

/* Header Section */
.header-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.title-section {
  display: flex;
  flex-direction: column;
}

.title {
  font-size: 20px;
  font-weight: bold;
  color: var(--text-dark);
  margin-bottom: 10px;
}

.logo-section img {
  width: 120px;
  height: auto;
}

/* Info Section */
.info-section {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  gap: 20px;
}

.company-info {
  flex: 1;
}

.company-name {
  font-size: 11px;
  color: var(--text-dark);
  margin-bottom: 2px;
}

.company-subtitle {
  font-size: 10px;
  color: var(--text-muted);
  margin-bottom: 12px;
}

.account-holder-title {
  font-size: 13px;
  font-weight: bold;
  color: var(--text-dark);
  margin-bottom: 8px;
}

.customer-name {
  font-size: 12px;
  font-weight: bold;
  color: var(--text-dark);
  margin-bottom: 4px;
}

.customer-email, .wallet-id {
  font-size: 11px;
  color: var(--text-dark);
  margin-bottom: 3px;
}

.statement-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

.detail-row {
  display: flex;
  justify-content: flex-start;
  gap: 8px;
  margin-bottom: 4px;
  font-size: 11px;
}

.detail-label {
  font-weight: bold;
  color: var(--text-dark);
}

.detail-value {
  color: var(--text-dark);
}

/* Transactions Table */
.transactions-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
  font-size: 10px;
}

.transactions-table th {
  background-color: var(--blue-color);
  color: white;
  padding: 8px 6px;
  text-align: ${isRTL ? 'right' : 'left'};
  font-size: 9px;
  font-weight: bold;
}

.transactions-table td {
  padding: 6px;
  border-bottom: 1px solid var(--border-color);
  text-align: ${isRTL ? 'right' : 'left'};
  color: var(--text-dark);
}

.transactions-table .credit {
  color: var(--deposit-green);
  font-weight: 500;
}

.transactions-table .debit {
  color: var(--withdraw-red);
  font-weight: 500;
}

.transactions-table .balance {
  font-weight: bold;
}

.transactions-table .no-transactions {
  text-align: center;
  color: var(--text-muted);
  padding: 20px;
}

/* Summary Section */
.summary-section {
  margin-top: 20px;
  padding-top: 15px;
}

.summary-row {
  display: flex;
  justify-content: flex-end;
  gap: 40px;
  margin-bottom: 6px;
  font-size: 11px;
}

.summary-label {
  color: var(--text-dark);
  min-width: 120px;
  text-align: ${isRTL ? 'right' : 'left'};
}

.summary-value {
  color: var(--text-dark);
  min-width: 80px;
  text-align: ${isRTL ? 'left' : 'right'};
}

.summary-value.debit {
  color: var(--withdraw-red);
}

.summary-value.credit {
  color: var(--deposit-green);
}

.summary-row.closing {
  margin-top: 8px;
  font-size: 13px;
  font-weight: bold;
}
`;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="outer-wrapper">
        <section className="wrapper">
          {/* Watermark */}
          <img className="bg" width="300" src="/assets/images/logo/logo-text.png" alt="" />
          
          {/* Header */}
          <div className="header-section">
            {isRTL ? (
              <>
                <div className="title-section">
                  <span className="title">{t.title}</span>
                </div>
                <div className="logo-section">
                  <img src="/assets/images/logo/logo-text.png" alt="MazExpress" />
                </div>
              </>
            ) : (
              <>
                <div className="title-section">
                  <span className="title">{t.title}</span>
                </div>
                <div className="logo-section">
                  <img src="/assets/images/logo/logo-text.png" alt="MazExpress" />
                </div>
              </>
            )}
          </div>
          
          {/* Info Section */}
          <div className="info-section">
            <div className="company-info">
              <div className="company-name">{t.companyName}</div>
              <div className="company-subtitle">{t.companySubtitle}</div>
              <div className="account-holder-title">{t.accountHolder}</div>
              {customerName && <div className="customer-name">{customerName}</div>}
              {customerEmail && <div className="customer-email">{customerEmail}</div>}
              <div className="wallet-id">{t.walletId} {wallet._id}</div>
            </div>
            
            <div className="statement-details">
              <div className="detail-row">
                <span className="detail-label">{t.statementNo}</span>
                <span className="detail-value">STM-{format(dateFrom, 'yyyyMMdd')}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">{t.period}</span>
                <span className="detail-value">{format(dateFrom, 'dd/MM/yyyy')} - {format(dateTo, 'dd/MM/yyyy')}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">{t.generated}</span>
                <span className="detail-value">{format(new Date(), 'dd/MM/yyyy HH:mm')}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">{t.currency}</span>
                <span className="detail-value">{wallet.currency}</span>
              </div>
            </div>
          </div>
          
          {/* Transactions Table */}
          <table className="transactions-table">
            <thead>
              <tr>
                {isRTL ? (
                  <>
                    <th>{t.balance}</th>
                    <th>{t.credit}</th>
                    <th>{t.debit}</th>
                    <th>{t.description}</th>
                    <th>{t.type}</th>
                    <th>{t.reference}</th>
                    <th>{t.date}</th>
                  </>
                ) : (
                  <>
                    <th>{t.date}</th>
                    <th>{t.reference}</th>
                    <th>{t.type}</th>
                    <th>{t.description}</th>
                    <th>{t.debit}</th>
                    <th>{t.credit}</th>
                    <th>{t.balance}</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {sortedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="no-transactions">{t.noTransactions}</td>
                </tr>
              ) : (
                sortedTransactions.map((tx, index) => {
                  const isCredit = ['deposit', 'refund'].includes(tx.type.toLowerCase());
                  const debit = isCredit ? '' : formatLYD(tx.amount);
                  const credit = isCredit ? formatLYD(tx.amount) : '';
                  
                  return (
                    <tr key={tx._id || index}>
                      {isRTL ? (
                        <>
                          <td className="balance">{formatLYD(tx.balanceAfter)}</td>
                          <td className="credit">{credit}</td>
                          <td className="debit">{debit}</td>
                          <td>{tx.description || '-'}</td>
                          <td>{formatType(tx.type, locale)}</td>
                          <td>{tx.transactionNumber}</td>
                          <td>{format(new Date(tx.createdAt), 'dd/MM/yyyy')}</td>
                        </>
                      ) : (
                        <>
                          <td>{format(new Date(tx.createdAt), 'dd/MM/yyyy')}</td>
                          <td>{tx.transactionNumber}</td>
                          <td>{formatType(tx.type, locale)}</td>
                          <td>{tx.description || '-'}</td>
                          <td className="debit">{debit}</td>
                          <td className="credit">{credit}</td>
                          <td className="balance">{formatLYD(tx.balanceAfter)}</td>
                        </>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          
          {/* Summary Section */}
          <div className="summary-section">
            <div className="summary-row">
              <span className="summary-label">{t.openingBalance}</span>
              <span className="summary-value">{formatLYD(summary.openingBalance)}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">{t.totalDebits}</span>
              <span className="summary-value debit">{formatLYD(summary.totalDebits)}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">{t.totalCredits}</span>
              <span className="summary-value credit">{formatLYD(summary.totalCredits)}</span>
            </div>
            <div className="summary-row closing">
              <span className="summary-label">{t.closingBalance}</span>
              <span className="summary-value">{formatLYD(summary.closingBalance)}</span>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

export type { PrintAccountStatementProps };
