'use client';
import { useEffect, useState } from 'react';
import { getSales, getPurchases, getExpenses } from '../../../../lib/store';

const fmt = (n) => new Intl.NumberFormat('en-PK', { minimumFractionDigits: 2 }).format(n || 0);

export default function DatewiseSummaryPage() {
  const [rows, setRows] = useState([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    const load = async () => {
      const [sales, purchases, expenses] = await Promise.all([getSales(), getPurchases(), getExpenses()]);

      const dateMap = {};
      const addEntry = (date, type, amount) => {
        if (!date) return;
        const d = date.slice(0, 10);
        if (!dateMap[d]) dateMap[d] = { sales: 0, purchases: 0, expenses: 0 };
        dateMap[d][type] += parseFloat(amount || 0);
      };

      sales.forEach(s => addEntry(s.date, 'sales', s.total));
      purchases.forEach(p => addEntry(p.date, 'purchases', p.total));
      expenses.forEach(e => addEntry(e.date, 'expenses', e.amount));

      const sorted = Object.entries(dateMap)
        .sort((a, b) => new Date(b[0]) - new Date(a[0]))
        .map(([date, d]) => ({ date, ...d, profit: d.sales - d.purchases - d.expenses }));

      setRows(sorted);
    };
    load();
  }, []);

  const filtered = rows.filter(r => {
    const matchFrom = !dateFrom || r.date >= dateFrom;
    const matchTo = !dateTo || r.date <= dateTo;
    return matchFrom && matchTo;
  });

  const totals = filtered.reduce((s, r) => ({
    sales: s.sales + r.sales,
    purchases: s.purchases + r.purchases,
    expenses: s.expenses + r.expenses,
    profit: s.profit + r.profit,
  }), { sales: 0, purchases: 0, expenses: 0, profit: 0 });

  return (
    <div className="space-y-5">
      <div className="ps-page-header">
        <div>
          <h1 className="ps-page-title">📅 Datewise Summary</h1>
          <p className="ps-page-subtitle">Day-by-day financial summary</p>
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
                <th className="text-right">Sales (Rs.)</th>
                <th className="text-right">Purchases (Rs.)</th>
                <th className="text-right">Expenses (Rs.)</th>
                <th className="text-right">Net Profit (Rs.)</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="py-12 text-center" style={{ color: '#94a3b8' }}>No data for selected period</td></tr>
              ) : filtered.map(r => (
                <tr key={r.date}>
                  <td className="text-sm font-medium" style={{ color: '#374151' }}>{r.date}</td>
                  <td className="text-right text-sm font-semibold" style={{ color: '#10b981' }}>{fmt(r.sales)}</td>
                  <td className="text-right text-sm" style={{ color: '#ef4444' }}>{fmt(r.purchases)}</td>
                  <td className="text-right text-sm" style={{ color: '#f59e0b' }}>{fmt(r.expenses)}</td>
                  <td className="text-right text-sm font-bold" style={{ color: r.profit >= 0 ? '#0f1f5c' : '#ef4444' }}>{fmt(r.profit)}</td>
                </tr>
              ))}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr style={{ background: '#f8fafc', borderTop: '2px solid #e2e8f0' }}>
                  <td className="py-3 px-4 font-bold text-sm" style={{ color: '#0f1f5c' }}>Total</td>
                  <td className="py-3 px-4 text-right font-bold text-sm" style={{ color: '#10b981' }}>{fmt(totals.sales)}</td>
                  <td className="py-3 px-4 text-right font-bold text-sm" style={{ color: '#ef4444' }}>{fmt(totals.purchases)}</td>
                  <td className="py-3 px-4 text-right font-bold text-sm" style={{ color: '#f59e0b' }}>{fmt(totals.expenses)}</td>
                  <td className="py-3 px-4 text-right font-bold text-sm" style={{ color: totals.profit >= 0 ? '#10b981' : '#ef4444' }}>{fmt(totals.profit)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
