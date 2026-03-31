'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { addPurchase, getProducts, getAccounts } from '../../../../lib/store';

const IconSave = () => (
  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
    <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
  </svg>
);
const IconBack = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
);
const IconCheck = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

export default function AddPurchasePage() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [form, setForm] = useState({
    productId: '', quantity: '', rate: '', total: '', supplierId: '',
    date: new Date().toISOString().slice(0, 10), note: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const load = async () => {
      const prods = await getProducts();
      const accs = await getAccounts();
      setProducts(prods);
      setSuppliers(accs.filter(a => a.type === 'Supplier'));
    };
    load();
  }, []);

  const handleChange = (field) => (e) => {
    const val = e.target.value;
    setForm(p => {
      const updated = { ...p, [field]: val };
      if (field === 'quantity' || field === 'rate') {
        const qty = parseFloat(field === 'quantity' ? val : p.quantity) || 0;
        const rate = parseFloat(field === 'rate' ? val : p.rate) || 0;
        updated.total = (qty * rate).toFixed(2);
      }
      if (field === 'productId') {
        // Use products already loaded in state
        const prod = products.find(pr => pr.id === val);
        if (prod) updated.rate = prod.rate?.toString() || '';
        const qty = parseFloat(p.quantity) || 0;
        updated.total = (qty * parseFloat(prod?.rate || 0)).toFixed(2);
      }
      return updated;
    });
    setErrors(p => ({ ...p, [field]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.productId) errs.productId = 'Select a product';
    if (!form.quantity || parseFloat(form.quantity) <= 0) errs.quantity = 'Enter valid quantity';
    if (!form.rate || parseFloat(form.rate) <= 0) errs.rate = 'Enter valid rate';
    if (!form.date) errs.date = 'Select date';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    await addPurchase({
      productId: form.productId,
      quantity: parseFloat(form.quantity),
      rate: parseFloat(form.rate),
      total: parseFloat(form.total),
      supplierId: form.supplierId || null,
      date: form.date,
      note: form.note.trim(),
    });
    setLoading(false);
    setSuccess(true);
    setTimeout(() => router.push('/dashboard/purchase'), 1000);
  };

  return (
    <div style={{ maxWidth: '680px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748b' }}>
        <Link href="/dashboard/purchase" style={{ color: '#0f1f5c', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
          <IconBack /> Purchase
        </Link>
        <span style={{ color: '#cbd5e1' }}>/</span>
        <span>Add Purchase</span>
      </div>

      <div className="ps-page-header">
        <div>
          <h1 className="ps-page-title">Add Purchase</h1>
          <p className="ps-page-subtitle">Record a new fuel or product purchase</p>
        </div>
      </div>

      {success && (
        <div className="alert-success"><IconCheck /> Purchase recorded successfully! Redirecting...</div>
      )}

      <div className="ps-card">
        <div className="form-section-header">
          <p className="form-section-title">Purchase Details</p>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label className="ps-label">Product *</label>
              <select className="ps-input" value={form.productId} onChange={handleChange('productId')}>
                <option value="">— Select Product —</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>)}
              </select>
              {errors.productId && <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>{errors.productId}</p>}
              {products.length === 0 && (
                <p style={{ fontSize: '11px', color: '#f59e0b', marginTop: '4px' }}>
                  No products. <Link href="/dashboard/products/add" style={{ color: '#0f1f5c' }}>Add products →</Link>
                </p>
              )}
            </div>

            <div>
              <label className="ps-label">Purchase Date *</label>
              <input type="date" className="ps-input" value={form.date} onChange={handleChange('date')} />
              {errors.date && <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>{errors.date}</p>}
            </div>

            <div>
              <label className="ps-label">Quantity (Litres) *</label>
              <input className="ps-input" placeholder="0.00" value={form.quantity} onChange={handleChange('quantity')} inputMode="decimal" />
              {errors.quantity && <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>{errors.quantity}</p>}
            </div>

            <div>
              <label className="ps-label">Rate per Litre (Rs.) *</label>
              <input className="ps-input" placeholder="0.00" value={form.rate} onChange={handleChange('rate')} inputMode="decimal" />
              {errors.rate && <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>{errors.rate}</p>}
            </div>
          </div>

          {/* Total */}
          <div className="total-box">
            <div>
              <p style={{ color: '#93c5fd', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 4px' }}>Total Amount</p>
              <p style={{ color: 'white', fontSize: '13px', margin: 0 }}>Quantity × Rate</p>
            </div>
            <p style={{ fontSize: '28px', fontWeight: 800, color: '#fcd34d', margin: 0, letterSpacing: '-0.02em' }}>
              Rs. {new Intl.NumberFormat('en-PK', { minimumFractionDigits: 2 }).format(parseFloat(form.total) || 0)}
            </p>
          </div>

          <div>
            <label className="ps-label">Supplier (Optional)</label>
            <select className="ps-input" value={form.supplierId} onChange={handleChange('supplierId')}>
              <option value="">— Cash Purchase (No Supplier) —</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            {suppliers.length === 0 && (
              <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                Add supplier accounts in <Link href="/dashboard/accounts/add" style={{ color: '#0f1f5c' }}>Accounts</Link> for credit tracking
              </p>
            )}
          </div>

          <div>
            <label className="ps-label">Note (Optional)</label>
            <textarea className="ps-input" placeholder="Any additional notes..." value={form.note} onChange={handleChange('note')} rows={2} style={{ resize: 'vertical' }} />
          </div>

          <div style={{ display: 'flex', gap: '12px', paddingTop: '4px' }}>
            <button type="submit" disabled={loading} className="btn-primary" style={{ opacity: loading ? 0.8 : 1 }}>
              {loading ? <><span className="spinner" /> Saving...</> : <><IconSave /> Save Purchase</>}
            </button>
            <Link href="/dashboard/purchase" className="btn-outline">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
