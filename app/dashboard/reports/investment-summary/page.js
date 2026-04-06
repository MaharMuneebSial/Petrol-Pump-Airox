'use client';
import { useEffect, useState } from 'react';
import { getProducts, getPurchases, getAccounts } from '../../../../lib/store';

const fmt = (n) => new Intl.NumberFormat('en-PK', { minimumFractionDigits: 2 }).format(n || 0);

export default function InvestmentSummaryPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const load = async () => {
      const [products, purchases, accounts] = await Promise.all([getProducts(), getPurchases(), getAccounts()]);
      const stockValue = products.reduce((s, p) => s + parseFloat(p.stock || 0) * parseFloat(p.rate || 0), 0);
      const totalPurchased = purchases.reduce((s, p) => s + parseFloat(p.total || 0), 0);
      const totalReceivable = accounts.filter(a => parseFloat(a.currentBalance || 0) > 0).reduce((s, a) => s + parseFloat(a.currentBalance || 0), 0);
      const totalInvestment = stockValue + totalReceivable;
      setData({ stockValue, totalPurchased, totalReceivable, totalInvestment, products });
    };
    load();
  }, []);

  if (!data) return <div className="py-20 text-center" style={{ color: '#94a3b8' }}>Loading...</div>;

  return (
    <div className="space-y-5">
      <div className="ps-page-header">
        <div>
          <h1 className="ps-page-title">Investment Summary</h1>
          <p className="ps-page-subtitle">Capital and asset overview</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Stock Value', value: `Rs. ${fmt(data.stockValue)}`, color: '#7c3aed' },
          { label: 'Total Purchased', value: `Rs. ${fmt(data.totalPurchased)}`, color: '#ef4444' },
          { label: 'Receivable', value: `Rs. ${fmt(data.totalReceivable)}`, color: '#10b981' },
          { label: 'Total Investment', value: `Rs. ${fmt(data.totalInvestment)}`, color: '#0f1f5c' },
        ].map(s => (
          <div key={s.label} className="ps-card p-4">
            <p className="text-xs" style={{ color: '#94a3b8' }}>{s.label}</p>
            <p className="text-lg font-bold mt-0.5" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="ps-card">
        <div className="px-5 py-3" style={{ borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
          <h2 className="font-semibold text-sm" style={{ color: '#0f1f5c' }}>Product-wise Stock Investment</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="ps-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Unit</th>
                <th className="text-right">Stock Qty</th>
                <th className="text-right">Rate</th>
                <th className="text-right">Stock Value</th>
              </tr>
            </thead>
            <tbody>
              {data.products.length === 0 ? (
                <tr><td colSpan={5} className="py-10 text-center" style={{ color: '#94a3b8' }}>No products found</td></tr>
              ) : data.products.map(p => (
                <tr key={p.id}>
                  <td className="font-medium text-sm" style={{ color: '#0f1f5c' }}>{p.name}</td>
                  <td className="text-sm" style={{ color: '#475569' }}>{p.unit}</td>
                  <td className="text-right text-sm" style={{ color: '#475569' }}>{fmt(p.stock)}</td>
                  <td className="text-right text-sm" style={{ color: '#475569' }}>Rs. {fmt(p.rate)}</td>
                  <td className="text-right text-sm font-bold" style={{ color: '#7c3aed' }}>Rs. {fmt(parseFloat(p.stock || 0) * parseFloat(p.rate || 0))}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: '#f8fafc', borderTop: '2px solid #e2e8f0' }}>
                <td colSpan={4} className="py-3 px-4 font-bold text-sm" style={{ color: '#0f1f5c' }}>Total Stock Value</td>
                <td className="py-3 px-4 text-right font-bold" style={{ color: '#7c3aed' }}>Rs. {fmt(data.stockValue)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
