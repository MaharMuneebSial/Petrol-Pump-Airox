'use client';
import { useState, useEffect } from 'react';
import { getProducts, getRateAdjustments, addRateAdjustment } from '../../../../lib/store';

const fmt = (n) => new Intl.NumberFormat('en-PK', { minimumFractionDigits: 2 }).format(n || 0);

export default function RateAdjustmentPage() {
  const [products, setProducts] = useState([]);
  const [adjustments, setAdjustments] = useState([]);
  const [form, setForm] = useState({ productId: '', newRate: '', reason: '', date: new Date().toISOString().slice(0, 10) });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const load = async () => {
    setProducts(await getProducts());
    setAdjustments(await getRateAdjustments());
  };
  useEffect(() => { load(); }, []);

  const selectedProduct = products.find(p => p.id === form.productId);

  const validate = () => {
    const errs = {};
    if (!form.productId) errs.productId = 'Select a product';
    if (!form.newRate || parseFloat(form.newRate) <= 0) errs.newRate = 'Enter valid rate';
    if (!form.date) errs.date = 'Select date';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);

    await addRateAdjustment({
      productId: form.productId,
      oldRate: parseFloat(selectedProduct?.rate || 0),
      newRate: parseFloat(form.newRate),
      reason: form.reason.trim(),
      date: form.date,
    });

    setLoading(false);
    setSuccess(`Rate updated successfully for ${selectedProduct?.name}`);
    setForm(p => ({ ...p, productId: '', newRate: '', reason: '' }));
    await load();
    setTimeout(() => setSuccess(''), 3000);
  };

  const getProductName = (id) => products.find(p => p.id === id)?.name || 'Unknown';

  return (
    <div className="space-y-5">
      <div className="ps-page-header">
        <div>
          <h1 className="ps-page-title">💱 Rate Adjustment</h1>
          <p className="ps-page-subtitle">Update product selling rates</p>
        </div>
      </div>

      {success && (
        <div className="flex items-center gap-2 p-4 rounded-xl" style={{ background: '#d1fae5', color: '#065f46' }}>
          ✅ {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Current Rates */}
        <div className="ps-card">
          <div className="px-5 py-3" style={{ borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
            <h2 className="font-semibold text-sm" style={{ color: '#0f1f5c' }}>Current Product Rates</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="ps-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Unit</th>
                  <th className="text-right">Current Rate</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr><td colSpan={3} className="py-10 text-center" style={{ color: '#94a3b8' }}>No products found</td></tr>
                ) : products.map(p => (
                  <tr key={p.id} style={{ background: form.productId === p.id ? '#eff6ff' : 'white' }}>
                    <td className="font-medium text-sm" style={{ color: '#0f1f5c' }}>{p.name}</td>
                    <td className="text-sm" style={{ color: '#475569' }}>{p.unit}</td>
                    <td className="text-right">
                      <span className="font-bold text-sm" style={{ color: '#0f1f5c' }}>Rs. {fmt(p.rate)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Update Rate Form */}
        <div className="ps-card">
          <div className="px-5 py-3" style={{ borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
            <h2 className="font-semibold text-sm" style={{ color: '#0f1f5c' }}>Update Rate</h2>
          </div>
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div>
              <label className="ps-label">Product *</label>
              <select
                className="ps-input"
                value={form.productId}
                onChange={e => { setForm(p => ({ ...p, productId: e.target.value, newRate: '' })); setErrors(p => ({ ...p, productId: '' })); }}
              >
                <option value="">— Select Product —</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name} (Current: Rs. {fmt(p.rate)})</option>)}
              </select>
              {errors.productId && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.productId}</p>}
            </div>

            {selectedProduct && (
              <div className="p-3 rounded-lg flex justify-between" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                <span className="text-sm" style={{ color: '#1d4ed8' }}>Current Rate:</span>
                <span className="font-bold text-sm" style={{ color: '#1d4ed8' }}>Rs. {fmt(selectedProduct.rate)}</span>
              </div>
            )}

            <div>
              <label className="ps-label">New Rate (Rs.) *</label>
              <input
                className="ps-input"
                placeholder="0.00"
                value={form.newRate}
                onChange={e => { setForm(p => ({ ...p, newRate: e.target.value })); setErrors(p => ({ ...p, newRate: '' })); }}
                inputMode="decimal"
              />
              {errors.newRate && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.newRate}</p>}
              {selectedProduct && form.newRate && (
                <p className="text-xs mt-1" style={{ color: parseFloat(form.newRate) > parseFloat(selectedProduct.rate) ? '#10b981' : '#ef4444' }}>
                  {parseFloat(form.newRate) > parseFloat(selectedProduct.rate) ? '↑' : '↓'} Change: Rs. {fmt(Math.abs(parseFloat(form.newRate || 0) - parseFloat(selectedProduct.rate || 0)))}
                </p>
              )}
            </div>

            <div>
              <label className="ps-label">Date *</label>
              <input type="date" className="ps-input" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
            </div>

            <div>
              <label className="ps-label">Reason (Optional)</label>
              <input
                className="ps-input"
                placeholder="e.g. PSO price revision"
                value={form.reason}
                onChange={e => setForm(p => ({ ...p, reason: e.target.value }))}
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 text-sm" style={{ opacity: loading ? 0.8 : 1 }}>
              {loading ? '⏳ Updating...' : '💱 Update Rate'}
            </button>
          </form>
        </div>
      </div>

      {/* Adjustment History */}
      {adjustments.length > 0 && (
        <div className="ps-card">
          <div className="px-5 py-3" style={{ borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
            <h2 className="font-semibold text-sm" style={{ color: '#0f1f5c' }}>Rate Adjustment History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="ps-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Date</th>
                  <th>Product</th>
                  <th className="text-right">Old Rate</th>
                  <th className="text-right">New Rate</th>
                  <th className="text-right">Change</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {[...adjustments].sort((a, b) => new Date(b.date) - new Date(a.date)).map((adj, i) => {
                  const change = parseFloat(adj.newRate || 0) - parseFloat(adj.oldRate || 0);
                  return (
                    <tr key={adj.id}>
                      <td className="text-sm" style={{ color: '#94a3b8' }}>{i + 1}</td>
                      <td className="text-sm" style={{ color: '#475569' }}>{adj.date}</td>
                      <td className="font-medium text-sm" style={{ color: '#0f1f5c' }}>{getProductName(adj.productId)}</td>
                      <td className="text-right text-sm" style={{ color: '#475569' }}>Rs. {fmt(adj.oldRate)}</td>
                      <td className="text-right text-sm font-semibold" style={{ color: '#0f1f5c' }}>Rs. {fmt(adj.newRate)}</td>
                      <td className="text-right text-sm font-semibold" style={{ color: change >= 0 ? '#10b981' : '#ef4444' }}>
                        {change >= 0 ? '+' : ''}{fmt(change)}
                      </td>
                      <td className="text-sm" style={{ color: '#475569' }}>{adj.reason || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
