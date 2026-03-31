'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { addSale, getProducts, getAccounts } from '../../../../lib/store';

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
const IconAlert = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

const paymentModes = [
  { value: 'cash',   label: 'Cash',   color: '#10b981', bg: '#f0fdf4', border: '#86efac', active: '#10b981' },
  { value: 'credit', label: 'Credit', color: '#ef4444', bg: '#fef2f2', border: '#fca5a5', active: '#ef4444' },
  { value: 'card',   label: 'Card',   color: '#3b82f6', bg: '#eff6ff', border: '#93c5fd', active: '#3b82f6' },
  { value: 'online', label: 'Online', color: '#f59e0b', bg: '#fffbeb', border: '#fcd34d', active: '#f59e0b' },
];

export default function AddSalePage() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState({
    customerId: '', productId: '', quantity: '', rate: '', total: '',
    paymentMode: 'cash', date: new Date().toISOString().slice(0, 10), note: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const load = async () => {
      const prods = await getProducts();
      const accs = await getAccounts();
      setProducts(prods);
      setCustomers(accs.filter(a => a.type === 'Customer'));
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
    if (form.paymentMode === 'credit' && !form.customerId) errs.customerId = 'Select customer for credit sale';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    await addSale({
      customerId: form.customerId || null,
      productId: form.productId,
      quantity: parseFloat(form.quantity),
      rate: parseFloat(form.rate),
      total: parseFloat(form.total),
      paymentMode: form.paymentMode,
      date: form.date,
      note: form.note.trim(),
    });
    setLoading(false);
    setSuccess(true);
    setTimeout(() => router.push('/dashboard/sales'), 1000);
  };

  return (
    <div style={{ maxWidth: '680px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748b' }}>
        <Link href="/dashboard/sales" style={{ color: '#0f1f5c', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
          <IconBack /> Sales
        </Link>
        <span style={{ color: '#cbd5e1' }}>/</span>
        <span>Add Sale</span>
      </div>

      <div className="ps-page-header">
        <div>
          <h1 className="ps-page-title">Add Sale</h1>
          <p className="ps-page-subtitle">Record a new fuel or product sale</p>
        </div>
      </div>

      {success && (
        <div className="alert-success"><IconCheck /> Sale recorded successfully! Redirecting...</div>
      )}

      <div className="ps-card">
        <div className="form-section-header">
          <p className="form-section-title">Sale Details</p>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label className="ps-label">Product *</label>
              <select className="ps-input" value={form.productId} onChange={handleChange('productId')}>
                <option value="">— Select Product —</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name} — Stock: {p.stock} {p.unit}</option>)}
              </select>
              {errors.productId && <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>{errors.productId}</p>}
            </div>
            <div>
              <label className="ps-label">Sale Date *</label>
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
          <div style={{
            background: 'linear-gradient(135deg, #065f46, #047857)',
            borderRadius: '14px', padding: '16px 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <p style={{ color: '#6ee7b7', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 4px' }}>Total Amount</p>
              <p style={{ color: '#a7f3d0', fontSize: '13px', margin: 0 }}>Quantity × Rate</p>
            </div>
            <p style={{ fontSize: '28px', fontWeight: 800, color: '#a7f3d0', margin: 0, letterSpacing: '-0.02em' }}>
              Rs. {new Intl.NumberFormat('en-PK', { minimumFractionDigits: 2 }).format(parseFloat(form.total) || 0)}
            </p>
          </div>

          {/* Payment Mode */}
          <div>
            <label className="ps-label">Payment Mode *</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {paymentModes.map(opt => {
                const isSelected = form.paymentMode === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { setForm(p => ({ ...p, paymentMode: opt.value })); setErrors(p => ({ ...p, paymentMode: '' })); }}
                    style={{
                      padding: '9px 18px',
                      borderRadius: '10px',
                      fontSize: '13px', fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      transition: 'all 0.2s',
                      background: isSelected ? opt.active : opt.bg,
                      color: isSelected ? 'white' : opt.color,
                      border: `2px solid ${isSelected ? opt.active : opt.border}`,
                      boxShadow: isSelected ? `0 4px 12px ${opt.active}40` : 'none',
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Customer */}
          <div>
            <label className="ps-label">Customer {form.paymentMode === 'credit' ? '*' : '(Optional)'}</label>
            <select className="ps-input" value={form.customerId} onChange={handleChange('customerId')}>
              <option value="">— Cash / Walk-in Customer —</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {errors.customerId && <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>{errors.customerId}</p>}
            {form.paymentMode === 'credit' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '6px' }}>
                <IconAlert />
                <p style={{ fontSize: '12px', color: '#f59e0b', margin: 0 }}>Credit sales require a customer account for balance tracking</p>
              </div>
            )}
          </div>

          <div>
            <label className="ps-label">Note (Optional)</label>
            <textarea className="ps-input" placeholder="Any additional notes..." value={form.note} onChange={handleChange('note')} rows={2} style={{ resize: 'vertical' }} />
          </div>

          <div style={{ display: 'flex', gap: '12px', paddingTop: '4px' }}>
            <button type="submit" disabled={loading} className="btn-gold" style={{ opacity: loading ? 0.8 : 1 }}>
              {loading ? <><span className="spinner" /> Saving...</> : <><IconSave /> Save Sale</>}
            </button>
            <Link href="/dashboard/sales" className="btn-outline">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
