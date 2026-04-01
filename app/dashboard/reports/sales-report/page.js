'use client';
import { useState, useEffect } from 'react';
import { getSales, getProducts, getAccounts } from '../../../../lib/store';

const fmt = (n) => new Intl.NumberFormat('en-PK', { minimumFractionDigits: 2 }).format(n || 0);

export default function SalesReportPage() {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [modeFilter, setModeFilter] = useState('');

  useEffect(() => {
    const load = async () => {
      const [s, p, a] = await Promise.all([getSales(), getProducts(), getAccounts()]);
      setSales(s); setProducts(p); setAccounts(a);
    };
    load();
  }, []);

  const getProductName = (id) => products.find(p => p.id === id)?.name || 'Unknown';
  const getCustomerName = (id) => id ? (accounts.find(a => a.id === id)?.name || 'Unknown') : 'Cash';

  const filtered = sales.filter(s => {
    const date = s.date || '';
    const matchFrom = !dateFrom || date >= dateFrom;
    const matchTo = !dateTo || date <= dateTo;
    const matchProd = !productFilter || s.productId === productFilter;
    const matchMode = !modeFilter || s.paymentMode === modeFilter;
    return matchFrom && matchTo && matchProd && matchMode;
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  const totalAmt = filtered.reduce((s, p) => s + parseFloat(p.total || 0), 0);
  const totalQty = filtered.reduce((s, p) => s + parseFloat(p.quantity || 0), 0);
  const cashAmt = filtered.filter(s => s.paymentMode === 'cash').reduce((s, p) => s + parseFloat(p.total || 0), 0);
  const creditAmt = filtered.filter(s => s.paymentMode === 'credit').reduce((s, p) => s + parseFloat(p.total || 0), 0);

  const byProduct = {};
  filtered.forEach(s => {
    const name = getProductName(s.productId);
    if (!byProduct[name]) byProduct[name] = { qty: 0, amt: 0 };
    byProduct[name].qty += parseFloat(s.quantity || 0);
    byProduct[name].amt += parseFloat(s.total || 0);
  });

  const modeColors = { cash: 'badge-success', credit: 'badge-danger', card: 'badge-info', online: 'badge-warning' };

  return (
    <div className="space-y-5">
      <div className="ps-page-header">
        <div>
          <h1 className="ps-page-title">💰 Sales Report</h1>
          <p className="ps-page-subtitle">Detailed sales analysis</p>
        </div>
      </div>

      {/* Filters */}
      <div className="ps-card px-4 py-3 flex flex-wrap gap-3">
        <div>
          <label className="ps-label text-xs">From Date</label>
          <input type="date" className="ps-input" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ maxWidth: '160px' }} />
        </div>
        <div>
          <label className="ps-label text-xs">To Date</label>
          <input type="date" className="ps-input" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ maxWidth: '160px' }} />
        </div>
        <div>
          <label className="ps-label text-xs">Product</label>
          <select className="ps-input" value={productFilter} onChange={e => setProductFilter(e.target.value)} style={{ maxWidth: '200px' }}>
            <option value="">All Products</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="ps-label text-xs">Payment Mode</label>
          <select className="ps-input" value={modeFilter} onChange={e => setModeFilter(e.target.value)} style={{ maxWidth: '150px' }}>
            <option value="">All Modes</option>
            <option value="cash">Cash</option>
            <option value="credit">Credit</option>
            <option value="card">Card</option>
            <option value="online">Online</option>
          </select>
        </div>
        <button onClick={() => { setDateFrom(''); setDateTo(''); setProductFilter(''); setModeFilter(''); }}
          className="self-end px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: '#f1f5f9', color: '#374151', border: 'none', cursor: 'pointer' }}>
          Clear
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="ps-card px-4 py-3"><p className="text-xs" style={{ color: '#94a3b8' }}>Records</p><p className="text-xl font-bold" style={{ color: '#0f1f5c' }}>{filtered.length}</p></div>
        <div className="ps-card px-4 py-3"><p className="text-xs" style={{ color: '#94a3b8' }}>Quantity</p><p className="text-xl font-bold" style={{ color: '#7c3aed' }}>{fmt(totalQty)} Ltr</p></div>
        <div className="ps-card px-4 py-3"><p className="text-xs" style={{ color: '#94a3b8' }}>Cash Sales</p><p className="text-xl font-bold" style={{ color: '#10b981' }}>Rs. {fmt(cashAmt)}</p></div>
        <div className="ps-card px-4 py-3"><p className="text-xs" style={{ color: '#94a3b8' }}>Credit Sales</p><p className="text-xl font-bold" style={{ color: '#ef4444' }}>Rs. {fmt(creditAmt)}</p></div>
      </div>

      {/* Product summary */}
      {Object.keys(byProduct).length > 0 && (
        <div className="ps-card">
          <div className="px-5 py-3" style={{ borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
            <h2 className="font-semibold text-sm" style={{ color: '#0f1f5c' }}>Product-wise Summary</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="ps-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th className="text-right">Quantity (Ltr)</th>
                  <th className="text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(byProduct).map(([name, d]) => (
                  <tr key={name}>
                    <td className="font-medium text-sm" style={{ color: '#0f1f5c' }}>{name}</td>
                    <td className="text-right text-sm font-semibold" style={{ color: '#7c3aed' }}>{fmt(d.qty)}</td>
                    <td className="text-right text-sm font-bold" style={{ color: '#10b981' }}>Rs. {fmt(d.amt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail */}
      <div className="ps-card">
        <div className="px-5 py-3" style={{ borderBottom: '1px solid #f1f5f9' }}>
          <h2 className="font-semibold text-sm" style={{ color: '#0f1f5c' }}>Sales Details — Total: Rs. {fmt(totalAmt)}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="ps-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Product</th>
                <th className="text-right">Qty</th>
                <th className="text-right">Rate</th>
                <th className="text-right">Total</th>
                <th>Mode</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="py-12 text-center" style={{ color: '#94a3b8' }}>No records found</td></tr>
              ) : filtered.map((s, i) => (
                <tr key={s.id}>
                  <td className="text-sm" style={{ color: '#94a3b8' }}>{i + 1}</td>
                  <td className="text-sm" style={{ color: '#475569' }}>{s.date}</td>
                  <td className="text-sm" style={{ color: '#374151' }}>{getCustomerName(s.customerId)}</td>
                  <td className="font-medium text-sm" style={{ color: '#0f1f5c' }}>{getProductName(s.productId)}</td>
                  <td className="text-right text-sm" style={{ color: '#7c3aed' }}>{fmt(s.quantity)}</td>
                  <td className="text-right text-sm" style={{ color: '#475569' }}>Rs. {fmt(s.rate)}</td>
                  <td className="text-right text-sm font-semibold" style={{ color: '#10b981' }}>Rs. {fmt(s.total)}</td>
                  <td><span className={`badge ${modeColors[s.paymentMode] || 'badge-gray'}`}>{s.paymentMode}</span></td>
                </tr>
              ))}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr style={{ background: '#f8fafc', borderTop: '2px solid #e2e8f0' }}>
                  <td colSpan={4} className="py-3 px-4 font-bold text-sm" style={{ color: '#0f1f5c' }}>Total</td>
                  <td className="py-3 px-4 text-right font-bold text-sm" style={{ color: '#7c3aed' }}>{fmt(totalQty)}</td>
                  <td />
                  <td className="py-3 px-4 text-right font-bold text-sm" style={{ color: '#10b981' }}>Rs. {fmt(totalAmt)}</td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
