'use client';
import { useEffect, useState } from 'react';
import { getSales, getPurchases, getProducts } from '../../../../lib/store';

const fmt = (n) => new Intl.NumberFormat('en-PK', { minimumFractionDigits: 2 }).format(n || 0);

export default function ProfitOnSalesPage() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    const load = async () => {
      const [sales, purchases, products] = await Promise.all([getSales(), getPurchases(), getProducts()]);
      const profitMap = {};

      sales.forEach(s => {
        const p = products.find(pr => pr.id === s.productId);
        if (!p) return;
        const purchasesForProduct = purchases.filter(pu => pu.productId === s.productId);
        const avgCostPerLtr = purchasesForProduct.length > 0
          ? purchasesForProduct.reduce((sum, pu) => sum + parseFloat(pu.rate || 0), 0) / purchasesForProduct.length
          : parseFloat(p.rate || 0) * 0.85;
        const profit = (parseFloat(s.rate || 0) - avgCostPerLtr) * parseFloat(s.quantity || 0);
        if (!profitMap[p.name]) profitMap[p.name] = { revenue: 0, cost: 0, profit: 0, qty: 0 };
        profitMap[p.name].revenue += parseFloat(s.total || 0);
        profitMap[p.name].cost += avgCostPerLtr * parseFloat(s.quantity || 0);
        profitMap[p.name].profit += profit;
        profitMap[p.name].qty += parseFloat(s.quantity || 0);
      });

      setRows(Object.entries(profitMap).map(([name, d]) => ({
        name, ...d,
        margin: d.revenue > 0 ? (d.profit / d.revenue * 100) : 0,
      })));
    };
    load();
  }, []);

  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
  const totalProfit = rows.reduce((s, r) => s + r.profit, 0);

  return (
    <div className="space-y-5">
      <div className="ps-page-header">
        <div>
          <h1 className="ps-page-title">💹 Profit on Sales</h1>
          <p className="ps-page-subtitle">Product-wise profitability analysis</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 max-w-md">
        <div className="ps-card px-4 py-3">
          <p className="text-xs" style={{ color: '#94a3b8' }}>Total Revenue</p>
          <p className="text-xl font-bold" style={{ color: '#10b981' }}>Rs. {fmt(totalRevenue)}</p>
        </div>
        <div className="ps-card px-4 py-3">
          <p className="text-xs" style={{ color: '#94a3b8' }}>Est. Net Profit</p>
          <p className="text-xl font-bold" style={{ color: totalProfit >= 0 ? '#0f1f5c' : '#ef4444' }}>Rs. {fmt(totalProfit)}</p>
        </div>
      </div>

      <div className="ps-card">
        <div className="overflow-x-auto">
          <table className="ps-table">
            <thead>
              <tr>
                <th>Product</th>
                <th className="text-right">Qty Sold (Ltr)</th>
                <th className="text-right">Revenue</th>
                <th className="text-right">Est. Cost</th>
                <th className="text-right">Est. Profit</th>
                <th className="text-right">Margin %</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center" style={{ color: '#94a3b8' }}>No sales data available</td>
                </tr>
              ) : rows.map(r => (
                <tr key={r.name}>
                  <td className="font-medium text-sm" style={{ color: '#0f1f5c' }}>{r.name}</td>
                  <td className="text-right text-sm" style={{ color: '#7c3aed' }}>{fmt(r.qty)}</td>
                  <td className="text-right text-sm font-semibold" style={{ color: '#10b981' }}>Rs. {fmt(r.revenue)}</td>
                  <td className="text-right text-sm" style={{ color: '#ef4444' }}>Rs. {fmt(r.cost)}</td>
                  <td className="text-right text-sm font-bold" style={{ color: r.profit >= 0 ? '#10b981' : '#ef4444' }}>Rs. {fmt(r.profit)}</td>
                  <td className="text-right text-sm font-semibold" style={{ color: r.margin >= 10 ? '#10b981' : '#f59e0b' }}>{r.margin.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="p-4 rounded-lg" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
        <p className="text-xs font-semibold" style={{ color: '#92400e' }}>Note</p>
        <p className="text-xs mt-1" style={{ color: '#92400e' }}>Profit estimates are based on average purchase costs. Actual profit may vary.</p>
      </div>
    </div>
  );
}
