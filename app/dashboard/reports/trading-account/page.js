'use client';
import { useEffect, useState } from 'react';
import { getSales, getPurchases, getProducts } from '../../../../lib/store';

const fmt = (n) => new Intl.NumberFormat('en-PK', { minimumFractionDigits: 2 }).format(n || 0);

export default function TradingAccountPage() {
  const [data, setData] = useState(null);
  useEffect(() => {
    const load = async () => {
      const [sales, purchases, products] = await Promise.all([getSales(), getPurchases(), getProducts()]);
      const totalSales = sales.reduce((s, v) => s + parseFloat(v.total || 0), 0);
      const totalPurchases = purchases.reduce((s, v) => s + parseFloat(v.total || 0), 0);
      const stockValue = products.reduce((s, p) => s + parseFloat(p.stock || 0) * parseFloat(p.rate || 0), 0);
      const grossProfit = totalSales - totalPurchases;
      setData({ totalSales, totalPurchases, stockValue, grossProfit });
    };
    load();
  }, []);

  if (!data) return <div className="py-20 text-center" style={{ color: '#94a3b8' }}>Loading...</div>;

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="ps-page-header">
        <div><h1 className="ps-page-title">Trading Account</h1><p className="ps-page-subtitle">Gross profit/loss calculation</p></div>
      </div>
      <div className="ps-card overflow-hidden">
        <div className="px-5 py-3" style={{ background: '#0f1f5c', borderBottom: '3px solid #2563EB' }}>
          <h2 className="font-bold text-white">Trading Account Statement</h2>
        </div>
        <div className="grid grid-cols-2 divide-x" style={{ divideColor: '#e2e8f0' }}>
          <div className="p-5">
            <h3 className="font-bold text-sm mb-4 pb-2" style={{ color: '#ef4444', borderBottom: '1px solid #f1f5f9' }}>DEBIT (Expenses)</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm"><span style={{ color: '#374151' }}>Purchases</span><span className="font-semibold" style={{ color: '#ef4444' }}>Rs. {fmt(data.totalPurchases)}</span></div>
              <div className="flex justify-between text-sm font-bold pt-2" style={{ borderTop: '2px solid #e2e8f0', color: '#0f1f5c' }}>
                <span>Gross Profit c/d</span>
                <span style={{ color: '#10b981' }}>Rs. {fmt(Math.max(0, data.grossProfit))}</span>
              </div>
            </div>
          </div>
          <div className="p-5">
            <h3 className="font-bold text-sm mb-4 pb-2" style={{ color: '#10b981', borderBottom: '1px solid #f1f5f9' }}>CREDIT (Income)</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm"><span style={{ color: '#374151' }}>Sales Revenue</span><span className="font-semibold" style={{ color: '#10b981' }}>Rs. {fmt(data.totalSales)}</span></div>
              <div className="flex justify-between text-sm"><span style={{ color: '#374151' }}>Closing Stock</span><span className="font-semibold" style={{ color: '#10b981' }}>Rs. {fmt(data.stockValue)}</span></div>
            </div>
          </div>
        </div>
        <div className="mx-5 mb-5 p-4 rounded-xl text-center" style={{ background: data.grossProfit >= 0 ? '#f0fdf4' : '#fef2f2' }}>
          <p className="text-sm font-semibold" style={{ color: data.grossProfit >= 0 ? '#065f46' : '#991b1b' }}>
            {data.grossProfit >= 0 ? 'Gross Profit' : 'Gross Loss'}
          </p>
          <p className="text-3xl font-bold mt-1" style={{ color: data.grossProfit >= 0 ? '#10b981' : '#ef4444' }}>
            Rs. {fmt(Math.abs(data.grossProfit))}
          </p>
        </div>
      </div>
    </div>
  );
}
