'use client';
import { useState, useEffect } from 'react';
import { getSales, getPurchases, getExpenses, getVouchers, getProducts, getAccounts } from '../../../../lib/store';

const fmt = (n) => new Intl.NumberFormat('en-PK', { minimumFractionDigits: 2 }).format(n || 0);

export default function SummarySheetPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const load = async () => {
      const [sales, purchases, expenses, vouchers, products, accounts] = await Promise.all([
        getSales(), getPurchases(), getExpenses(), getVouchers(), getProducts(), getAccounts(),
      ]);

      const totalSales = sales.reduce((s, v) => s + parseFloat(v.total || 0), 0);
      const cashSales = sales.filter(s => s.paymentMode === 'cash').reduce((s, v) => s + parseFloat(v.total || 0), 0);
      const creditSales = sales.filter(s => s.paymentMode === 'credit').reduce((s, v) => s + parseFloat(v.total || 0), 0);
      const totalPurchases = purchases.reduce((s, v) => s + parseFloat(v.total || 0), 0);
      const totalExpenses = expenses.reduce((s, v) => s + parseFloat(v.amount || 0), 0);
      const receipts = vouchers.filter(v => v.type === 'receipt').reduce((s, v) => s + parseFloat(v.amount || 0), 0);
      const payments = vouchers.filter(v => v.type === 'payment').reduce((s, v) => s + parseFloat(v.amount || 0), 0);
      const grossProfit = totalSales - totalPurchases;
      const netProfit = grossProfit - totalExpenses;
      const totalReceivable = accounts.filter(a => a.type === 'Customer').reduce((s, a) => s + Math.max(0, parseFloat(a.currentBalance || 0)), 0);
      const totalPayable = accounts.filter(a => a.type === 'Supplier').reduce((s, a) => s + Math.max(0, parseFloat(a.currentBalance || 0)), 0);
      const stockValue = products.reduce((s, p) => s + parseFloat(p.stock || 0) * parseFloat(p.rate || 0), 0);

      setData({
        totalSales, cashSales, creditSales, totalPurchases, totalExpenses,
        receipts, payments, grossProfit, netProfit, totalReceivable, totalPayable,
        stockValue, salesCount: sales.length, purchasesCount: purchases.length,
      });
    };
    load();
  }, []);

  if (!data) return <div className="py-20 text-center" style={{ color: '#94a3b8' }}>Loading...</div>;

  const rows = [
    { label: 'Total Sales Revenue', value: data.totalSales, color: '#10b981' },
    { label: 'Cash Sales', value: data.cashSales, color: '#059669', sub: true },
    { label: 'Credit Sales', value: data.creditSales, color: '#475569', sub: true },
    { label: 'Total Purchases', value: data.totalPurchases, color: '#ef4444' },
    { label: 'Gross Profit', value: data.grossProfit, color: data.grossProfit >= 0 ? '#0f1f5c' : '#ef4444', bold: true },
    { label: 'Total Expenses', value: data.totalExpenses, color: '#ef4444' },
    { label: 'Net Profit', value: data.netProfit, color: data.netProfit >= 0 ? '#10b981' : '#ef4444', bold: true },
    { label: 'Cash Receipts', value: data.receipts, color: '#10b981' },
    { label: 'Cash Payments', value: data.payments, color: '#ef4444' },
    { label: 'Total Receivable', value: data.totalReceivable, color: '#3b82f6' },
    { label: 'Total Payable', value: data.totalPayable, color: '#475569' },
    { label: 'Stock Value', value: data.stockValue, color: '#7c3aed' },
  ];

  return (
    <div className="space-y-5">
      <div className="ps-page-header">
        <div>
          <h1 className="ps-page-title">Summary Sheet</h1>
          <p className="ps-page-subtitle">Complete financial overview of your station</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Transactions', value: data.salesCount + data.purchasesCount, color: '#0f1f5c' },
          { label: 'Net Profit', value: `Rs. ${fmt(data.netProfit)}`, color: data.netProfit >= 0 ? '#10b981' : '#ef4444' },
          { label: 'Stock Value', value: `Rs. ${fmt(data.stockValue)}`, color: '#7c3aed' },
          { label: 'Receivable', value: `Rs. ${fmt(data.totalReceivable)}`, color: '#3b82f6' },
        ].map(s => (
          <div key={s.label} className="ps-card p-4">
            <p className="text-xs mb-2" style={{ color: '#94a3b8' }}>{s.label}</p>
            <p className="text-lg font-bold" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="ps-card">
        <div className="px-5 py-3" style={{ borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
          <h2 className="font-semibold" style={{ color: '#0f1f5c' }}>Financial Summary</h2>
        </div>
        <div className="divide-y" style={{ divideColor: '#f1f5f9' }}>
          {rows.map((row, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-5 py-3"
              style={{ background: row.bold ? '#f8fafc' : 'white', borderBottom: '1px solid #f1f5f9' }}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`text-sm ${row.bold ? 'font-bold' : 'font-medium'}`}
                  style={{ color: row.bold ? '#0f1f5c' : '#374151', paddingLeft: row.sub ? '8px' : '0' }}
                >
                  {row.label}
                </span>
              </div>
              <span
                className={`text-sm ${row.bold ? 'text-base font-bold' : 'font-semibold'}`}
                style={{ color: row.color }}
              >
                Rs. {fmt(row.value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
