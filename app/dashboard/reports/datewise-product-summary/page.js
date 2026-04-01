'use client';
import { useEffect, useState } from 'react';
import { getSales, getProducts } from '../../../../lib/store';

const fmt = (n) => new Intl.NumberFormat('en-PK', { minimumFractionDigits: 2 }).format(n || 0);

export default function DatewiseProductSummaryPage() {
  const [rows, setRows] = useState([]);
  const [products, setProducts] = useState([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    const load = async () => {
      const [sales, prods] = await Promise.all([getSales(), getProducts()]);
      setProducts(prods);

      const dateProductMap = {};
      sales.forEach(s => {
        const date = s.date;
        if (!date) return;
        const prod = prods.find(p => p.id === s.productId);
        const prodName = prod?.name || 'Unknown';
        const key = `${date}__${prodName}`;
        if (!dateProductMap[key]) dateProductMap[key] = { date, product: prodName, qty: 0, amt: 0 };
        dateProductMap[key].qty += parseFloat(s.quantity || 0);
        dateProductMap[key].amt += parseFloat(s.total || 0);
      });

      setRows(Object.values(dateProductMap).sort((a, b) => new Date(b.date) - new Date(a.date)));
    };
    load();
  }, []);

  const filtered = rows.filter(r => {
    const matchFrom = !dateFrom || r.date >= dateFrom;
    const matchTo = !dateTo || r.date <= dateTo;
    return matchFrom && matchTo;
  });

  return (
    <div className="space-y-5">
      <div className="ps-page-header">
        <div>
          <h1 className="ps-page-title">📦 Datewise Product Summary</h1>
          <p className="ps-page-subtitle">Product sales breakdown by date</p>
        </div>
      </div>

      <div className="ps-card px-4 py-3 flex flex-wrap gap-3">
        <div>
          <label className="ps-label text-xs">From</label>
          <input type="date" className="ps-input" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ maxWidth: '160px' }} />
        </div>
        <div>
          <label className="ps-label text-xs">To</label>
          <input type="date" className="ps-input" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ maxWidth: '160px' }} />
        </div>
        <button onClick={() => { setDateFrom(''); setDateTo(''); }} className="self-end px-4 py-2 rounded-lg text-sm font-medium" style={{ background: '#f1f5f9', color: '#374151', border: 'none', cursor: 'pointer' }}>Clear</button>
      </div>

      <div className="ps-card">
        <div className="overflow-x-auto">
          <table className="ps-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Product</th>
                <th className="text-right">Quantity (Ltr)</th>
                <th className="text-right">Amount (Rs.)</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={4} className="py-12 text-center" style={{ color: '#94a3b8' }}>No sales data for selected period</td></tr>
              ) : filtered.map((r, i) => (
                <tr key={i}>
                  <td className="text-sm font-medium" style={{ color: '#374151' }}>{r.date}</td>
                  <td className="text-sm font-semibold" style={{ color: '#0f1f5c' }}>{r.product}</td>
                  <td className="text-right text-sm" style={{ color: '#7c3aed' }}>{fmt(r.qty)}</td>
                  <td className="text-right text-sm font-semibold" style={{ color: '#10b981' }}>Rs. {fmt(r.amt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
