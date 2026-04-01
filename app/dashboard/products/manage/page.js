'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { getProducts, updateProduct, deleteProduct } from '../../../../lib/store';

const fmt = (n) => new Intl.NumberFormat('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);

// ── Icons ──────────────────────────────────────────────────────────────────────
const IconPlus    = () => <svg width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>;
const IconEdit    = () => <svg width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IconTrash   = () => <svg width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>;
const IconCheck   = () => <svg width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>;
const IconX       = () => <svg width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>;
const IconWarning = () => <svg width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const IconPackage = () => <svg width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>;
const IconSearch  = () => <svg width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IconTrend   = () => <svg width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>;
const IconSave    = () => <svg width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>;

// ── Unit options ───────────────────────────────────────────────────────────────
const UNIT_OPTIONS = [
  { value: 'Ltr',         label: 'Ltr',  desc: 'Litre' },
  { value: 'Kg',          label: 'Kg',   desc: 'Kilogram' },
  { value: 'Cubic Meter', label: 'Cu.M', desc: 'Cubic Meter' },
  { value: 'Unit',        label: 'Unit', desc: 'Unit' },
];

// ── Unit badge styles ──────────────────────────────────────────────────────────
const UNIT_STYLE = {
  'Ltr':         { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
  'Kg':          { bg: '#FFFBEB', color: '#B45309', border: '#FDE68A' },
  'Cubic Meter': { bg: '#F0FDF4', color: '#059669', border: '#BBF7D0' },
  'Unit':        { bg: '#F5F3FF', color: '#7C3AED', border: '#DDD6FE' },
};

// ── Edit Modal ─────────────────────────────────────────────────────────────────
function EditModal({ product, onSave, onClose }) {
  const [form, setForm]     = useState({
    name:    product.name    || '',
    unit:    product.unit    || 'Ltr',
    stock:   product.stock   ?? '',
    rate:    product.rate    ?? '',
    hsnCode: product.hsnCode || '',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const [unitSearch, setUnitSearch]     = useState('');
  const [showUnitDrop, setShowUnitDrop] = useState(false);
  const unitRef = useRef(null);
  useEffect(() => {
    const h = (e) => { if (unitRef.current && !unitRef.current.contains(e.target)) setShowUnitDrop(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const unitLabel     = UNIT_OPTIONS.find(o => o.value === form.unit)?.label ?? form.unit;
  const filteredUnits = UNIT_OPTIONS.filter(o =>
    o.label.toLowerCase().includes(unitSearch.toLowerCase()) ||
    o.desc.toLowerCase().includes(unitSearch.toLowerCase())
  );
  const stockValue = parseFloat(form.stock || 0) * parseFloat(form.rate || 0);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Product name is required';
    if (form.stock && isNaN(parseFloat(form.stock))) errs.stock = 'Must be a valid number';
    if (form.rate  && isNaN(parseFloat(form.rate)))  errs.rate  = 'Must be a valid number';
    return errs;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    await onSave({ name: form.name.trim(), unit: form.unit, stock: parseFloat(form.stock || 0), rate: parseFloat(form.rate || 0), hsnCode: form.hsnCode.trim() });
    setSaving(false);
  };

  const ch = (field) => (e) => { setForm(p => ({ ...p, [field]: e.target.value })); setErrors(p => ({ ...p, [field]: '' })); };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
      background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', animation: 'fadeIn 0.2s ease',
    }}>
      <div className="ps-card" style={{ width: '100%', maxWidth: '500px', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{
          padding: '14px 18px', borderBottom: '1px solid #F1F5F9', background: '#FAFBFC',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '30px', height: '30px', borderRadius: '8px',
              background: 'linear-gradient(135deg, #0D1B3E, #122158)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
            }}>
              <IconEdit />
            </div>
            <div>
              <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#0D1B3E' }}>Edit Product</div>
              <div style={{ fontSize: '10.5px', color: '#94A3B8' }}>{product.name}</div>
            </div>
          </div>
          <button onClick={onClose} style={{
            width: '28px', height: '28px', borderRadius: '7px',
            background: '#F1F5F9', border: '1px solid #E2E8F0',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#64748B', cursor: 'pointer',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#E2E8F0'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#F1F5F9'; }}
          >
            <IconX />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '18px' }}>

          {/* Name */}
          <div style={{ marginBottom: '12px' }}>
            <label className="ps-label">Product Name <span style={{ color: '#DC2626' }}>*</span></label>
            <input className="ps-input" placeholder="e.g. Petrol…" value={form.name} onChange={ch('name')} autoFocus
              style={{ borderColor: errors.name ? '#FCA5A5' : undefined, background: errors.name ? '#FFF5F5' : undefined }}
            />
            {errors.name && <p style={{ fontSize: '11px', color: '#DC2626', margin: '3px 0 0' }}>{errors.name}</p>}
          </div>

          {/* Unit + HSN */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
            <div>
              <label className="ps-label">Unit <span style={{ color: '#DC2626' }}>*</span></label>
              <div ref={unitRef} style={{ position: 'relative' }}>
                <input className="ps-input"
                  value={showUnitDrop ? unitSearch : unitLabel}
                  placeholder="Search unit…"
                  onFocus={() => { setShowUnitDrop(true); setUnitSearch(''); }}
                  onChange={e => setUnitSearch(e.target.value)}
                  style={{ paddingRight: '30px', cursor: 'pointer' }}
                  readOnly={!showUnitDrop}
                />
                <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: `translateY(-50%) rotate(${showUnitDrop ? '180deg' : '0deg'})`, pointerEvents: 'none', transition: 'transform 0.2s' }}
                >
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
                {showUnitDrop && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 3px)', left: 0, right: 0,
                    background: 'white', border: '1.5px solid #E2E8F0', borderRadius: '8px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 60, overflow: 'hidden',
                  }}>
                    {filteredUnits.map(opt => (
                      <button key={opt.value} type="button"
                        onMouseDown={() => { setForm(p => ({ ...p, unit: opt.value })); setShowUnitDrop(false); setUnitSearch(''); }}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          width: '100%', padding: '8px 12px',
                          background: form.unit === opt.value ? '#EEF2FF' : 'transparent',
                          border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                          borderBottom: '1px solid #F1F5F9',
                        }}
                        onMouseEnter={e => { if (form.unit !== opt.value) e.currentTarget.style.background = '#F8FAFC'; }}
                        onMouseLeave={e => { if (form.unit !== opt.value) e.currentTarget.style.background = 'transparent'; }}
                      >
                        <span style={{ fontSize: '12px', fontWeight: 600, color: form.unit === opt.value ? '#4338CA' : '#1E293B' }}>{opt.label}</span>
                        <span style={{ fontSize: '10.5px', color: '#94A3B8' }}>{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="ps-label">HSN Code <span style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 400 }}>(opt)</span></label>
              <input className="ps-input" placeholder="e.g. 2710" value={form.hsnCode} onChange={ch('hsnCode')} />
            </div>
          </div>

          {/* Stock + Rate */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
            <div>
              <label className="ps-label">Stock ({form.unit === 'Cubic Meter' ? 'Cu.M' : form.unit})</label>
              <div style={{ position: 'relative' }}>
                <input className="ps-input" placeholder="0.00" value={form.stock} onChange={ch('stock')} inputMode="decimal"
                  style={{ paddingRight: '38px', borderColor: errors.stock ? '#FCA5A5' : undefined, background: errors.stock ? '#FFF5F5' : undefined }}
                />
                <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '10px', color: '#CBD5E1', fontWeight: 700, pointerEvents: 'none' }}>
                  {form.unit === 'Cubic Meter' ? 'Cu.M' : form.unit}
                </span>
              </div>
              {errors.stock && <p style={{ fontSize: '11px', color: '#DC2626', margin: '3px 0 0' }}>{errors.stock}</p>}
            </div>
            <div>
              <label className="ps-label">Rate (Rs./{form.unit === 'Cubic Meter' ? 'Cu.M' : form.unit})</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px', color: '#CBD5E1', fontWeight: 700, pointerEvents: 'none' }}>Rs.</span>
                <input className="ps-input" placeholder="0.00" value={form.rate} onChange={ch('rate')} inputMode="decimal"
                  style={{ paddingLeft: '32px', borderColor: errors.rate ? '#FCA5A5' : undefined, background: errors.rate ? '#FFF5F5' : undefined }}
                />
              </div>
              {errors.rate && <p style={{ fontSize: '11px', color: '#DC2626', margin: '3px 0 0' }}>{errors.rate}</p>}
            </div>
          </div>

          {/* Stock value hint */}
          {stockValue > 0 && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '6px 12px', borderRadius: '7px', marginBottom: '14px',
              background: '#F0FDF4', border: '1px solid #BBF7D0',
            }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#15803D' }}>Stock Value:</span>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#059669' }}>Rs. {fmt(stockValue)}</span>
            </div>
          )}

          <div style={{ height: '1px', background: '#F1F5F9', marginBottom: '14px' }} />

          {/* Actions */}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{
              padding: '7px 18px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
              color: '#64748B', background: 'white', border: '1.5px solid #E2E8F0',
              cursor: 'pointer', fontFamily: 'inherit',
              display: 'inline-flex', alignItems: 'center', gap: '5px',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFC'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'white'; }}
            >
              <IconX /> Cancel
            </button>
            <button type="button" onClick={handleSubmit} disabled={saving} style={{
              padding: '7px 20px', borderRadius: '8px', fontSize: '12px', fontWeight: 700,
              color: 'white', background: '#0D1B3E', border: 'none',
              cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              boxShadow: '0 2px 8px rgba(13,27,62,0.2)', opacity: saving ? 0.8 : 1,
            }}
            onMouseEnter={e => { if (!saving) e.currentTarget.style.background = '#122158'; }}
            onMouseLeave={e => { if (!saving) e.currentTarget.style.background = '#0D1B3E'; }}
            >
              {saving ? <><span className="spinner" /> Saving…</> : <><IconSave /> Save Changes</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Action Button ──────────────────────────────────────────────────────────────
function ActionBtn({ onClick, icon, bg, color, border, title }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} title={title}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ width: '28px', height: '28px', borderRadius: '7px', border: `1.5px solid ${border}`, background: hov ? bg : '#fff', color, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.12s', flexShrink: 0 }}>
      {icon}
    </button>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function ManageProductsPage() {
  const [products, setProducts]       = useState([]);
  const [editProduct, setEditProduct] = useState(null);
  const [deleteId, setDeleteId]       = useState(null);
  const [deleteName, setDeleteName]   = useState('');
  const [search, setSearch]           = useState('');

  const load = async () => setProducts(await getProducts());
  useEffect(() => { load(); }, []);

  const filtered        = products.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()));
  const totalStockValue = products.reduce((s, p) => s + parseFloat(p.stock || 0) * parseFloat(p.rate || 0), 0);
  const lowCount        = products.filter(p => parseFloat(p.stock || 0) < 500).length;
  const outCount        = products.filter(p => parseFloat(p.stock || 0) === 0).length;

  const handleSave = async (data) => {
    await updateProduct(editProduct.id, data);
    setEditProduct(null);
    load();
  };

  const handleDelete = async (id) => {
    await deleteProduct(id);
    load();
    setDeleteId(null);
    setDeleteName('');
  };

  const stockStatus = (stock) => {
    const s = parseFloat(stock || 0);
    if (s === 0) return { label: 'Out of Stock', bg: '#FEF2F2', color: '#B91C1C', border: '#FECACA', dot: '#DC2626' };
    if (s < 500)  return { label: 'Low Stock',    bg: '#FFFBEB', color: '#92400E', border: '#FDE68A', dot: '#D97706' };
    return               { label: 'In Stock',      bg: '#F0FDF4', color: '#15803D', border: '#BBF7D0', dot: '#059669' };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* ── Page Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'linear-gradient(135deg,#0D1B3E,#1e3a8a)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
            <IconPackage />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0D1B3E', letterSpacing: '-0.025em', lineHeight: 1.2 }}>Manage Products</h1>
            <p style={{ margin: 0, fontSize: '11.5px', color: '#94a3b8', marginTop: '1px' }}>View, edit and manage your fuel inventory</p>
          </div>
        </div>
        <Link href="/dashboard/products/add" className="btn-gold" style={{ fontSize: '12.5px', padding: '7px 14px' }}>
          <IconPlus /> Add Product
        </Link>
      </div>

      {/* ── Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px' }}>
        {[
          { label: 'Total Products', value: products.length, sub: `${filtered.length} shown`, Icon: IconPackage, color: '#1e3a8a', accent: '#3b82f6', bg: 'linear-gradient(135deg,#eff6ff,#dbeafe)' },
          { label: 'Low Stock',      value: lowCount,        sub: outCount > 0 ? `${outCount} out of stock` : 'Items below threshold', Icon: IconWarning, color: lowCount > 0 ? '#92400e' : '#065f46', accent: lowCount > 0 ? '#d97706' : '#10b981', bg: lowCount > 0 ? 'linear-gradient(135deg,#fffbeb,#fef3c7)' : 'linear-gradient(135deg,#f0fdf4,#dcfce7)' },
          { label: 'Total Stock Value', value: `Rs. ${fmt(totalStockValue)}`, sub: 'Inventory worth', Icon: IconTrend, color: '#065f46', accent: '#10b981', bg: 'linear-gradient(135deg,#f0fdf4,#dcfce7)' },
        ].map(({ label, value, sub, Icon, color, accent, bg }) => (
          <div key={label} style={{ background: bg, borderRadius: '12px', padding: '12px 14px', border: `1px solid ${accent}22`, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '9px', flexShrink: 0, background: `${accent}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent }}>
              <Icon />
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: '10px', fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.07em', opacity: 0.75 }}>{label}</p>
              <p style={{ margin: '1px 0 0', fontSize: '15px', fontWeight: 800, color, letterSpacing: '-0.02em', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</p>
              <p style={{ margin: 0, fontSize: '10px', color: accent, opacity: 0.75 }}>{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Table Card ── */}
      <div className="ps-card">

        {/* Toolbar */}
        <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', borderBottom: '1px solid #f1f5f9', background: '#fafbfc' }}>
          <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: '260px' }}>
            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex', pointerEvents: 'none' }}><IconSearch /></span>
            <input
              placeholder="Search products…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', padding: '7px 10px 7px 30px', fontSize: '12.5px', fontFamily: 'inherit', border: '1.5px solid #e2e8f0', borderRadius: '8px', background: '#fff', color: '#0D1B3E', outline: 'none' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 11px', background: '#0D1B3E', borderRadius: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#F0A500' }}>{filtered.length}</span>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>product{filtered.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table className="ps-table">
            <thead>
              <tr>
                <th style={{ width: '36px' }}>#</th>
                <th>Product Name</th>
                <th style={{ width: '68px' }}>Unit</th>
                <th style={{ textAlign: 'right' }}>Stock</th>
                <th style={{ textAlign: 'right' }}>Rate</th>
                <th style={{ textAlign: 'right' }}>Stock Value</th>
                <th style={{ textAlign: 'center', width: '100px' }}>Status</th>
                <th style={{ textAlign: 'center', width: '76px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '48px 20px', textAlign: 'center', color: '#94a3b8' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '7px' }}>
                      <span style={{ opacity: 0.25, color: '#0D1B3E' }}><IconPackage /></span>
                      <p style={{ fontWeight: 700, margin: 0, fontSize: '13px', color: '#64748b' }}>{search ? 'No products match your search' : 'No products yet'}</p>
                      {!search && <Link href="/dashboard/products/add" style={{ fontSize: '12px', color: '#0D1B3E', textDecoration: 'none', fontWeight: 600 }}>Add first product →</Link>}
                    </div>
                  </td>
                </tr>
              ) : filtered.map((p, i) => {
                const status    = stockStatus(p.stock);
                const stockVal  = parseFloat(p.stock || 0) * parseFloat(p.rate || 0);
                const noRate    = parseFloat(p.rate || 0) === 0;
                const unitStyle = UNIT_STYLE[p.unit] || UNIT_STYLE['Unit'];
                const unitDisp  = p.unit === 'Cubic Meter' ? 'Cu.M' : p.unit;
                return (
                  <tr key={p.id}>
                    <td style={{ color: '#94a3b8', fontSize: '11.5px', fontWeight: 700 }}>{i + 1}</td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0D1B3E', fontSize: '12.5px' }}>{p.name}</div>
                      {p.hsnCode && <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '1px' }}>HSN: {p.hsnCode}</div>}
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: '5px', fontSize: '10.5px', fontWeight: 700, background: unitStyle.bg, color: unitStyle.color, border: `1px solid ${unitStyle.border}` }}>
                        {unitDisp}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span style={{ fontWeight: 700, fontSize: '12.5px', color: parseFloat(p.stock||0)===0 ? '#DC2626' : parseFloat(p.stock||0)<500 ? '#D97706' : '#059669', fontVariantNumeric: 'tabular-nums' }}>{fmt(p.stock)}</span>
                      <span style={{ fontSize: '9.5px', color: '#CBD5E1', marginLeft: '2px' }}>{unitDisp}</span>
                    </td>
                    <td style={{ textAlign: 'right', fontSize: '12px', fontVariantNumeric: 'tabular-nums' }}>
                      {noRate ? <span style={{ color: '#DC2626', fontWeight: 600, fontSize: '11px' }}>Not set</span>
                        : <><span style={{ color: '#94a3b8', fontSize: '10px' }}>Rs. </span><span style={{ color: '#1E293B', fontWeight: 600 }}>{fmt(p.rate)}</span></>}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, fontSize: '12px', color: stockVal>0 ? '#059669' : '#CBD5E1', fontVariantNumeric: 'tabular-nums' }}>
                      {stockVal > 0 ? `Rs. ${fmt(stockVal)}` : '—'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 9px', borderRadius: '999px', fontSize: '10px', fontWeight: 700, background: status.bg, color: status.color, border: `1px solid ${status.border}` }}>
                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: status.dot, flexShrink: 0 }} />
                        {status.label}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                        <ActionBtn onClick={() => setEditProduct(p)} icon={<IconEdit />} bg="#eff6ff" color="#2563eb" border="#93c5fd" title="Edit product" />
                        <ActionBtn onClick={() => { setDeleteId(p.id); setDeleteName(p.name); }} icon={<IconTrash />} bg="#fef2f2" color="#ef4444" border="#fca5a5" title="Delete product" />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr>
                  <td colSpan={5} style={{ padding: '10px 16px', fontWeight: 700, fontSize: '12px', color: '#0D1B3E' }}>Total Stock Value</td>
                  <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 800, fontSize: '13px', color: '#059669', fontVariantNumeric: 'tabular-nums' }}>Rs. {fmt(totalStockValue)}</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* ── Edit Modal ── */}
      {editProduct && (
        <EditModal product={editProduct} onSave={handleSave} onClose={() => setEditProduct(null)} />
      )}

      {/* ── Delete Modal ── */}
      {deleteId && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
          background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', animation: 'fadeIn 0.2s ease',
        }}>
          <div className="ps-card" style={{ maxWidth: '360px', width: '100%', overflow: 'hidden' }}>
            <div style={{ height: '3px', background: 'linear-gradient(90deg, #DC2626, #EF4444)' }} />
            <div style={{ padding: '20px 22px 22px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '16px' }}>
                <div style={{
                  width: '38px', height: '38px', borderRadius: '10px',
                  background: '#FEF2F2', border: '1px solid #FECACA',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#DC2626', flexShrink: 0,
                }}>
                  <IconWarning />
                </div>
                <div>
                  <h3 style={{ fontWeight: 800, fontSize: '14px', color: '#0D1B3E', margin: '0 0 5px' }}>Delete Product?</h3>
                  <p style={{ fontSize: '12px', color: '#64748B', margin: 0, lineHeight: 1.6 }}>
                    <strong style={{ color: '#DC2626' }}>{deleteName}</strong> will be permanently removed.
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleDelete(deleteId)}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: '5px', padding: '8px',
                    background: '#DC2626', color: 'white', border: 'none', borderRadius: '8px',
                    fontWeight: 700, fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#B91C1C'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#DC2626'; }}
                >
                  <IconTrash /> Delete
                </button>
                <button
                  onClick={() => { setDeleteId(null); setDeleteName(''); }}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '8px', background: 'white', color: '#374151',
                    border: '1.5px solid #E2E8F0', borderRadius: '8px',
                    fontWeight: 600, fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFC'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'white'; }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
