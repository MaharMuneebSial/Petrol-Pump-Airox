'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { addProduct } from '../../../../lib/store';

const DEFAULT_PRODUCTS = [
  'Petrol', 'Hi Speed Diesel', 'LPG', 'CNG', 'Super Petrol',
  'Light Diesel Oil', 'Kerosene Oil', 'Hi Octane Petrol',
];

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
const IconZap = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);

export default function AddProductPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', unit: 'Ltr', stock: '', rate: '', hsnCode: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Product name is required';
    if (!form.unit.trim()) errs.unit = 'Unit is required';
    if (form.stock && isNaN(parseFloat(form.stock))) errs.stock = 'Must be a number';
    if (form.rate && isNaN(parseFloat(form.rate))) errs.rate = 'Must be a number';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    await addProduct({
      name: form.name.trim(),
      unit: form.unit.trim(),
      stock: parseFloat(form.stock || 0),
      rate: parseFloat(form.rate || 0),
      hsnCode: form.hsnCode.trim(),
    });
    setLoading(false);
    setSuccess(true);
    setTimeout(() => router.push('/dashboard/products/manage'), 1000);
  };

  const handleChange = (field) => (e) => {
    setForm(p => ({ ...p, [field]: e.target.value }));
    setErrors(p => ({ ...p, [field]: '' }));
  };

  const stockValue = parseFloat(form.stock || 0) * parseFloat(form.rate || 0);

  return (
    <div style={{ maxWidth: '680px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748b' }}>
        <Link href="/dashboard/products/manage" style={{ color: '#0f1f5c', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
          <IconBack /> Products
        </Link>
        <span style={{ color: '#cbd5e1' }}>/</span>
        <span>Add New Product</span>
      </div>

      <div className="ps-page-header">
        <div>
          <h1 className="ps-page-title">Add New Product</h1>
          <p className="ps-page-subtitle">Register a new fuel or product</p>
        </div>
      </div>

      {success && <div className="alert-success"><IconCheck /> Product added successfully! Redirecting...</div>}

      {/* Quick select */}
      <div className="ps-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '14px' }}>
          <IconZap />
          <p className="ps-label" style={{ margin: 0 }}>Quick Select Standard Products</p>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {DEFAULT_PRODUCTS.map(name => {
            const isSelected = form.name === name;
            return (
              <button
                key={name}
                type="button"
                onClick={() => setForm(p => ({ ...p, name, unit: ['LPG', 'CNG'].includes(name) ? 'Kg' : 'Ltr' }))}
                style={{
                  padding: '7px 14px',
                  borderRadius: '8px',
                  fontSize: '12px', fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all 0.2s',
                  background: isSelected ? 'linear-gradient(135deg, #0f1f5c, #1e3a8a)' : '#f1f5f9',
                  color: isSelected ? 'white' : '#374151',
                  border: isSelected ? 'none' : '1px solid #e2e8f0',
                  boxShadow: isSelected ? '0 4px 12px rgba(15,31,92,0.3)' : 'none',
                }}
              >
                {name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="ps-card">
        <div className="form-section-header">
          <p className="form-section-title">Product Information</p>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label className="ps-label">Product Name *</label>
              <input className="ps-input" placeholder="e.g. Petrol" value={form.name} onChange={handleChange('name')} />
              {errors.name && <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>{errors.name}</p>}
            </div>
            <div>
              <label className="ps-label">Unit *</label>
              <select className="ps-input" value={form.unit} onChange={handleChange('unit')}>
                <option value="Ltr">Ltr (Litres)</option>
                <option value="Kg">Kg (Kilograms)</option>
                <option value="Cubic Meter">Cubic Meter</option>
                <option value="Unit">Unit</option>
              </select>
              {errors.unit && <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>{errors.unit}</p>}
            </div>
            <div>
              <label className="ps-label">Current Stock ({form.unit})</label>
              <input className="ps-input" placeholder="0.00" value={form.stock} onChange={handleChange('stock')} inputMode="decimal" />
              {errors.stock && <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>{errors.stock}</p>}
            </div>
            <div>
              <label className="ps-label">Selling Rate (Rs. per {form.unit})</label>
              <input className="ps-input" placeholder="0.00" value={form.rate} onChange={handleChange('rate')} inputMode="decimal" />
              {errors.rate && <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>{errors.rate}</p>}
            </div>
            <div>
              <label className="ps-label">HSN Code (Optional)</label>
              <input className="ps-input" placeholder="e.g. 2710" value={form.hsnCode} onChange={handleChange('hsnCode')} />
            </div>
          </div>

          {form.stock && form.rate && (
            <div style={{
              padding: '14px 18px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
              border: '1px solid #bfdbfe',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <p style={{ fontSize: '13px', color: '#1d4ed8', fontWeight: 600, margin: 0 }}>Calculated Stock Value</p>
              <p style={{ fontSize: '18px', fontWeight: 800, color: '#0f1f5c', margin: 0 }}>
                Rs. {new Intl.NumberFormat('en-PK', { minimumFractionDigits: 2 }).format(stockValue)}
              </p>
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', paddingTop: '4px' }}>
            <button type="submit" disabled={loading} className="btn-primary" style={{ opacity: loading ? 0.8 : 1 }}>
              {loading ? <><span className="spinner" /> Saving...</> : <><IconSave /> Save Product</>}
            </button>
            <Link href="/dashboard/products/manage" className="btn-outline">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
