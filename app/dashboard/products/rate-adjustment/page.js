'use client';
import { useState, useEffect, useRef } from 'react';
import { getProducts, getRateAdjustments, addRateAdjustment, updateRateAdjustment } from '../../../../lib/store';

const fmt     = (n) => new Intl.NumberFormat('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);
const fmtDate = (d) => { try { return new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }); } catch { return d; } };

// ── Icons ──────────────────────────────────────────────────────────────────────
const IconRate    = () => <svg width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
const IconTrendUp = () => <svg width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>;
const IconTrendDn = () => <svg width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>;
const IconSave    = () => <svg width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>;
const IconCheck   = () => <svg width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>;
const IconAlert   = () => <svg width={12} height={12} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const IconHistory = () => <svg width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="12 8 12 12 14 14"/><path d="M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5"/></svg>;
const IconDroplet = () => <svg width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>;
const IconCalendar= () => <svg width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
const IconEye     = () => <svg width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const IconEdit2   = () => <svg width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IconX       = () => <svg width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>;

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

// ── View Modal ─────────────────────────────────────────────────────────────────
function ViewAdjModal({ adj, productName, onClose }) {
  const change = adj.newRate - adj.oldRate;
  const isUp   = change >= 0;
  const fmt2   = (n) => new Intl.NumberFormat('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);
  const fmtD   = (d) => { try { return new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }); } catch { return d; } };
  const Row = ({ label, children }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
      <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: '13px', fontWeight: 700, color: '#0D1B3E' }}>{children}</span>
    </div>
  );
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: 'rgba(10,18,40,0.6)', backdropFilter: 'blur(5px)' }}>
      <div style={{ width: '100%', maxWidth: '440px', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.25)', background: '#fff' }}>
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg,#0D1B3E,#1a3475)', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ margin: 0, fontSize: '9.5px', fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Rate Adjustment</p>
            <p style={{ margin: '3px 0 0', fontSize: '18px', fontWeight: 800, color: '#fff' }}>{productName}</p>
            <p style={{ margin: '3px 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.55)' }}>{fmtD(adj.date)}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0, fontSize: '9.5px', fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>New Rate</p>
            <p style={{ margin: '3px 0 0', fontSize: '22px', fontWeight: 800, color: '#F0A500', fontFamily: 'monospace' }}>Rs. {fmt2(adj.newRate)}</p>
            <button onClick={onClose} style={{ marginTop: '6px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '7px', color: '#fff', cursor: 'pointer', padding: '4px 8px', fontSize: '11px', fontFamily: 'inherit', fontWeight: 600 }}>Close</button>
          </div>
        </div>
        {/* Body */}
        <div style={{ padding: '14px 20px' }}>
          <Row label="Product">{productName}</Row>
          <Row label="Effective Date">{fmtD(adj.date)}</Row>
          <Row label="Previous Rate"><span style={{ color: '#64748b' }}>Rs. {fmt2(adj.oldRate)}</span></Row>
          <Row label="New Rate"><span style={{ color: '#059669', fontFamily: 'monospace' }}>Rs. {fmt2(adj.newRate)}</span></Row>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 500 }}>Change</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 700, background: isUp ? '#f0fdf4' : '#fef2f2', color: isUp ? '#15803d' : '#b91c1c', border: `1px solid ${isUp ? '#bbf7d0' : '#fecaca'}` }}>
              {isUp ? <IconTrendUp /> : <IconTrendDn />} {isUp ? '+' : ''}{fmt2(change)}
            </span>
          </div>
          {adj.reason ? (
            <div style={{ marginTop: '10px', background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: '8px', padding: '9px 12px' }}>
              <p style={{ margin: 0, fontSize: '9.5px', fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '3px' }}>Reason</p>
              <p style={{ margin: 0, fontSize: '12.5px', color: '#78350f' }}>{adj.reason}</p>
            </div>
          ) : (
            <p style={{ margin: '10px 0 0', fontSize: '11.5px', color: '#94a3b8', fontStyle: 'italic' }}>No reason provided</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Edit Modal ─────────────────────────────────────────────────────────────────
function EditAdjModal({ adj, productName, onSave, onClose }) {
  const [form, setForm] = useState({ date: adj.date || '', reason: adj.reason || '' });
  const [saving, setSaving] = useState(false);
  const fmt2 = (n) => new Intl.NumberFormat('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);
  const lbl  = { display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.03em' };
  const inp  = { width: '100%', boxSizing: 'border-box', padding: '8px 11px', fontSize: '13px', fontFamily: 'inherit', border: '1.5px solid #e2e8f0', borderRadius: '8px', background: '#fff', color: '#0D1B3E', outline: 'none' };
  const handleSave = async () => { setSaving(true); await onSave(adj.id, { date: form.date, reason: form.reason }); setSaving(false); };
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: 'rgba(10,18,40,0.6)', backdropFilter: 'blur(5px)' }}>
      <div style={{ width: '100%', maxWidth: '460px', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.25)', background: '#fff' }}>
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg,#0D1B3E,#1a3475)', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ margin: 0, fontSize: '9.5px', fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Edit Adjustment</p>
            <p style={{ margin: '3px 0 0', fontSize: '15px', fontWeight: 800, color: '#fff' }}>{productName}</p>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '7px', color: '#fff', cursor: 'pointer', padding: '5px', display: 'flex' }}><IconX /></button>
        </div>
        {/* Rate info bar */}
        <div style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9', padding: '10px 20px', display: 'flex', gap: '24px' }}>
          <div><p style={{ margin: 0, fontSize: '9.5px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Old Rate</p><p style={{ margin: '2px 0 0', fontSize: '13px', fontWeight: 700, color: '#64748b' }}>Rs. {fmt2(adj.oldRate)}</p></div>
          <div><p style={{ margin: 0, fontSize: '9.5px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>New Rate</p><p style={{ margin: '2px 0 0', fontSize: '13px', fontWeight: 700, color: '#059669' }}>Rs. {fmt2(adj.newRate)}</p></div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}><p style={{ margin: 0, fontSize: '9.5px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Note</p><p style={{ margin: '2px 0 0', fontSize: '10.5px', color: '#94a3b8' }}>Rates are read-only</p></div>
        </div>
        {/* Body */}
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={lbl}>Effective Date</label>
            <input type="date" style={inp} value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
          </div>
          <div>
            <label style={lbl}>Reason <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 400 }}>(optional)</span></label>
            <input style={inp} placeholder="e.g. PSO price revision, Govt. notification…" value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} />
          </div>
        </div>
        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, border: '1.5px solid #e2e8f0', color: '#64748b', background: '#f8fafc', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ padding: '8px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, background: '#0D1B3E', color: '#fff', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', opacity: saving ? 0.75 : 1, fontFamily: 'inherit' }}>
            {saving ? <><span className="spinner" /> Saving…</> : <><IconSave /> Save Changes</>}
          </button>
        </div>
      </div>
    </div>
  );
}

const UNIT_STYLE = {
  'Ltr':         { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
  'Kg':          { bg: '#FFFBEB', color: '#B45309', border: '#FDE68A' },
  'Cubic Meter': { bg: '#F0FDF4', color: '#059669', border: '#BBF7D0' },
  'Unit':        { bg: '#F5F3FF', color: '#7C3AED', border: '#DDD6FE' },
};

export default function RateAdjustmentPage() {
  const [products, setProducts]       = useState([]);
  const [adjustments, setAdjustments] = useState([]);
  const [form, setForm] = useState({
    productId: '', newRate: '', reason: '',
    date: new Date().toISOString().slice(0, 10),
  });
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [viewAdj, setViewAdj] = useState(null);
  const [editAdj, setEditAdj] = useState(null);

  // Product combobox
  const [productSearch, setProductSearch]     = useState('');
  const [showProductDrop, setShowProductDrop] = useState(false);
  const productRef = useRef(null);
  useEffect(() => {
    const h = (e) => { if (productRef.current && !productRef.current.contains(e.target)) setShowProductDrop(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const load = async () => {
    setProducts(await getProducts());
    setAdjustments(await getRateAdjustments());
  };
  useEffect(() => { load(); }, []);

  const selectedProduct  = products.find(p => String(p.id) === String(form.productId));
  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()));

  const oldRate   = parseFloat(selectedProduct?.rate || 0);
  const newRate   = parseFloat(form.newRate || 0);
  const rateChange = newRate - oldRate;
  const isIncrease = rateChange > 0;
  const hasChange  = form.newRate && newRate !== oldRate;

  const validate = () => {
    const errs = {};
    if (!form.productId)                           errs.productId = 'Select a product';
    if (!form.newRate || parseFloat(form.newRate) <= 0) errs.newRate = 'Enter a valid rate';
    if (!form.date)                                errs.date = 'Select a date';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    await addRateAdjustment({
      productId: form.productId,
      oldRate:   parseFloat(selectedProduct?.rate || 0),
      newRate:   parseFloat(form.newRate),
      reason:    form.reason.trim(),
      date:      form.date,
    });
    setLoading(false);
    setSuccess(`Rate updated for ${selectedProduct?.name}`);
    setForm(p => ({ ...p, productId: '', newRate: '', reason: '' }));
    await load();
    setTimeout(() => setSuccess(''), 3500);
  };

  const handleSaveEdit = async (id, updates) => {
    await updateRateAdjustment(id, updates);
    await load();
    setEditAdj(null);
  };

  const getProductName = (id) => products.find(p => String(p.id) === String(id))?.name || 'Unknown';

  const sortedAdj = [...adjustments].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* ── Page Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'linear-gradient(135deg,#0D1B3E,#1e3a8a)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
          <IconRate />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0D1B3E', letterSpacing: '-0.025em', lineHeight: 1.2 }}>Rate Adjustment</h1>
          <p style={{ margin: 0, fontSize: '11.5px', color: '#94a3b8', marginTop: '1px' }}>Update product selling rates</p>
        </div>
      </div>

      {/* ── Success Alert ── */}
      {success && (
        <div className="alert-success">
          <IconCheck /> {success}
        </div>
      )}

      {/* ── Two-column layout ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', alignItems: 'start' }}>

        {/* ── LEFT: Current Product Rates ── */}
        <div className="ps-card">
          {/* Card header */}
          <div style={{
            padding: '10px 16px', borderBottom: '1px solid #F1F5F9',
            background: '#FAFBFC', display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: 'linear-gradient(135deg, #0D1B3E, #122158)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <IconRate />
            </div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#0D1B3E' }}>Current Product Rates</span>
            <span style={{ fontSize: '10.5px', color: '#CBD5E1', marginLeft: '2px' }}>— click to select</span>
          </div>

          {/* Product rate rows */}
          <div>
            {products.length === 0 ? (
              <div style={{ padding: '36px', textAlign: 'center', color: '#94A3B8', fontSize: '12px' }}>
                No products found
              </div>
            ) : products.map(p => {
              const isSelected = String(form.productId) === String(p.id);
              const uStyle = UNIT_STYLE[p.unit] || UNIT_STYLE['Unit'];
              const hasRate = parseFloat(p.rate || 0) > 0;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setForm(prev => ({ ...prev, productId: String(p.id), newRate: '' }));
                    setErrors(prev => ({ ...prev, productId: '' }));
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', width: '100%',
                    padding: '8px 14px', gap: '8px',
                    background: isSelected ? '#EEF2FF' : 'transparent',
                    border: 'none', borderBottom: '1px solid #F8FAFC',
                    cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                    borderLeft: isSelected ? '3px solid #4338CA' : '3px solid transparent',
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#FAFBFC'; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                >
                  {/* Fuel dot */}
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: hasRate ? '#059669' : '#CBD5E1', flexShrink: 0 }} />

                  {/* Name */}
                  <span style={{ flex: 1, fontSize: '12.5px', fontWeight: isSelected ? 700 : 600, color: isSelected ? '#4338CA' : '#0D1B3E' }}>
                    {p.name}
                  </span>

                  {/* Unit badge */}
                  <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '4px', background: uStyle.bg, color: uStyle.color, border: `1px solid ${uStyle.border}` }}>
                    {p.unit === 'Cubic Meter' ? 'Cu.M' : p.unit}
                  </span>

                  {/* Rate */}
                  <span style={{ fontSize: '13px', fontWeight: 800, color: hasRate ? '#059669' : '#DC2626', minWidth: '80px', textAlign: 'right' }}>
                    {hasRate ? `Rs. ${fmt(p.rate)}` : 'Not set'}
                  </span>

                  {isSelected && (
                    <span style={{ color: '#4338CA', display: 'flex', alignItems: 'center' }}><IconCheck /></span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── RIGHT: Update Rate Form ── */}
        <div className="ps-card">
          {/* Card header */}
          <div style={{
            padding: '10px 16px', borderBottom: '1px solid #F1F5F9',
            background: '#FAFBFC', display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: 'linear-gradient(135deg, #F0A500, #D4920A)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <IconTrendUp />
            </div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#0D1B3E' }}>Update Rate</span>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>

              {/* Product — searchable combobox */}
              <div>
                <label className="ps-label">Product <span style={{ color: '#DC2626' }}>*</span></label>
                <div ref={productRef} style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: selectedProduct ? '#059669' : '#CBD5E1', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                    <IconDroplet />
                  </span>
                  <input
                    className="ps-input"
                    placeholder="Search or select a product…"
                    value={showProductDrop ? productSearch : (selectedProduct ? selectedProduct.name : '')}
                    onFocus={() => { setShowProductDrop(true); setProductSearch(''); }}
                    onChange={e => setProductSearch(e.target.value)}
                    style={{ paddingLeft: '30px', paddingRight: '30px', borderColor: errors.productId ? '#FCA5A5' : selectedProduct ? '#BBF7D0' : undefined, background: errors.productId ? '#FFF5F5' : selectedProduct && !showProductDrop ? '#F0FDF4' : undefined, cursor: 'pointer' }}
                    readOnly={!showProductDrop}
                  />
                  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: `translateY(-50%) rotate(${showProductDrop ? '180deg' : '0deg'})`, pointerEvents: 'none', transition: 'transform 0.2s' }}>
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                  {showProductDrop && (
                    <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: 'white', border: '1.5px solid #E2E8F0', borderRadius: '9px', boxShadow: '0 10px 28px rgba(0,0,0,0.1)', zIndex: 50, overflow: 'hidden', maxHeight: '180px', overflowY: 'auto' }}>
                      {filteredProducts.length === 0
                        ? <div style={{ padding: '10px 14px', fontSize: '12px', color: '#94A3B8' }}>No match</div>
                        : filteredProducts.map(p => {
                          const isSel = String(form.productId) === String(p.id);
                          return (
                            <button key={p.id} type="button"
                              onMouseDown={() => { setForm(prev => ({ ...prev, productId: String(p.id), newRate: '' })); setErrors(prev => ({ ...prev, productId: '' })); setShowProductDrop(false); setProductSearch(''); }}
                              style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '8px 14px', background: isSel ? '#F0FDF4' : 'transparent', border: 'none', borderBottom: '1px solid #F8FAFC', cursor: 'pointer', fontFamily: 'inherit' }}
                              onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = '#F8FAFC'; }}
                              onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = 'transparent'; }}
                            >
                              <span style={{ width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0, background: isSel ? '#059669' : '#CBD5E1' }} />
                              <span style={{ flex: 1, fontSize: '12.5px', fontWeight: isSel ? 700 : 500, color: isSel ? '#059669' : '#1E293B' }}>{p.name}</span>
                              <span style={{ fontSize: '11px', fontWeight: 600, color: '#059669' }}>Rs. {fmt(p.rate)}</span>
                              {isSel && <span style={{ color: '#059669', display: 'flex', alignItems: 'center' }}><IconCheck /></span>}
                            </button>
                          );
                        })
                      }
                    </div>
                  )}
                </div>
                {errors.productId && <p style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10.5px', color: '#DC2626', marginTop: '3px' }}><IconAlert /> {errors.productId}</p>}
              </div>

              {/* Current rate pill — only when product selected */}
              {selectedProduct && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 12px', borderRadius: '8px', background: '#EEF2FF', border: '1px solid #C7D2FE' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#4338CA' }}>Current Rate</span>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#0D1B3E' }}>Rs. {fmt(selectedProduct.rate)}</span>
                </div>
              )}

              {/* New Rate + Date in one row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="ps-label">New Rate (Rs.) <span style={{ color: '#DC2626' }}>*</span></label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px', color: '#CBD5E1', fontWeight: 700, pointerEvents: 'none' }}>Rs.</span>
                    <input
                      className="ps-input"
                      placeholder="0.00"
                      value={form.newRate}
                      onChange={e => { setForm(p => ({ ...p, newRate: e.target.value })); setErrors(p => ({ ...p, newRate: '' })); }}
                      inputMode="decimal"
                      style={{ paddingLeft: '34px', borderColor: errors.newRate ? '#FCA5A5' : undefined, background: errors.newRate ? '#FFF5F5' : undefined }}
                    />
                  </div>
                  {errors.newRate && <p style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10.5px', color: '#DC2626', marginTop: '3px' }}><IconAlert /> {errors.newRate}</p>}
                </div>
                <div>
                  <label className="ps-label">Effective Date <span style={{ color: '#DC2626' }}>*</span></label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#CBD5E1', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                      <IconCalendar />
                    </span>
                    <input
                      type="date"
                      className="ps-input"
                      value={form.date}
                      onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                      style={{ paddingLeft: '30px', borderColor: errors.date ? '#FCA5A5' : undefined, background: errors.date ? '#FFF5F5' : undefined }}
                    />
                  </div>
                  {errors.date && <p style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10.5px', color: '#DC2626', marginTop: '3px' }}><IconAlert /> {errors.date}</p>}
                </div>
              </div>

              {/* Rate change indicator */}
              {selectedProduct && hasChange && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 10px', borderRadius: '7px', background: isIncrease ? '#F0FDF4' : '#FEF2F2', border: `1px solid ${isIncrease ? '#BBF7D0' : '#FECACA'}` }}>
                  <span style={{ display: 'flex', alignItems: 'center', color: isIncrease ? '#059669' : '#DC2626' }}>
                    {isIncrease ? <IconTrendUp /> : <IconTrendDn />}
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: isIncrease ? '#15803D' : '#B91C1C' }}>
                    {isIncrease ? 'Increase' : 'Decrease'} of Rs. {fmt(Math.abs(rateChange))}
                  </span>
                  <span style={{ fontSize: '10px', color: '#94A3B8' }}>{fmt(oldRate)} → {fmt(newRate)}</span>
                </div>
              )}

              {/* Reason */}
              <div>
                <label className="ps-label">Reason <span style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 400 }}>(optional)</span></label>
                <input
                  className="ps-input"
                  placeholder="e.g. PSO price revision, Govt. notification…"
                  value={form.reason}
                  onChange={e => setForm(p => ({ ...p, reason: e.target.value }))}
                />
              </div>
            </div>

            {/* Action bar */}
            <div style={{ padding: '11px 16px', borderTop: '1px solid #F1F5F9', background: '#FAFBFC', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '7px',
                  padding: '8px 24px',
                  background: loading ? '#475569' : '#0D1B3E',
                  color: 'white', border: 'none', borderRadius: '8px',
                  fontWeight: 700, fontSize: '12.5px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  boxShadow: '0 2px 8px rgba(13,27,62,0.2)',
                  opacity: loading ? 0.8 : 1,
                }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#122158'; }}
                onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#0D1B3E'; }}
              >
                {loading ? <><span className="spinner" /> Updating…</> : <><IconSave /> Update Rate</>}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ── Rate Adjustment History ── */}
      {sortedAdj.length > 0 && (
        <div className="ps-card">
          <div style={{ padding: '10px 16px', borderBottom: '1px solid #F1F5F9', background: '#FAFBFC', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4338CA' }}>
              <IconHistory />
            </div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#0D1B3E' }}>Rate Adjustment History</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: '999px', fontSize: '10px', fontWeight: 700, background: '#EEF2FF', color: '#4338CA', border: '1px solid #C7D2FE', marginLeft: '4px' }}>
              {sortedAdj.length} records
            </span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="ps-table">
              <thead>
                <tr>
                  <th style={{ width: '32px', textAlign: 'center' }}>#</th>
                  <th>Date</th>
                  <th>Product</th>
                  <th style={{ textAlign: 'right' }}>Old Rate</th>
                  <th style={{ textAlign: 'right' }}>New Rate</th>
                  <th style={{ textAlign: 'center' }}>Change</th>
                  <th>Reason</th>
                  <th style={{ textAlign: 'center', width: '76px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedAdj.map((adj, i) => {
                  const change     = parseFloat(adj.newRate || 0) - parseFloat(adj.oldRate || 0);
                  const isUp       = change >= 0;
                  return (
                    <tr key={adj.id}>
                      <td style={{ color: '#94a3b8', fontSize: '11.5px', fontWeight: 700 }}>{i + 1}</td>
                      <td>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>{fmtDate(adj.date)}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#059669', flexShrink: 0 }} />
                          <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#0D1B3E' }}>{getProductName(adj.productId)}</span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', fontSize: '12px', color: '#94A3B8', fontWeight: 500 }}>
                        Rs. {fmt(adj.oldRate)}
                      </td>
                      <td style={{ textAlign: 'right', fontSize: '12.5px', fontWeight: 700, color: '#0D1B3E' }}>
                        Rs. {fmt(adj.newRate)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '4px',
                          padding: '3px 9px', borderRadius: '999px',
                          fontSize: '10.5px', fontWeight: 700,
                          background: isUp ? '#F0FDF4' : '#FEF2F2',
                          color: isUp ? '#15803D' : '#B91C1C',
                          border: `1px solid ${isUp ? '#BBF7D0' : '#FECACA'}`,
                        }}>
                          {isUp ? <IconTrendUp /> : <IconTrendDn />}
                          {isUp ? '+' : ''}{fmt(change)}
                        </span>
                      </td>
                      <td style={{ fontSize: '12px', color: adj.reason ? '#475569' : '#CBD5E1', fontStyle: adj.reason ? 'normal' : 'italic' }}>
                        {adj.reason || 'No reason given'}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                          <ActionBtn onClick={() => setViewAdj(adj)} icon={<IconEye />} bg="#f0fdf4" color="#059669" border="#bbf7d0" title="View details" />
                          <ActionBtn onClick={() => setEditAdj(adj)} icon={<IconEdit2 />} bg="#eff6ff" color="#2563eb" border="#93c5fd" title="Edit adjustment" />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewAdj && (
        <ViewAdjModal
          adj={viewAdj}
          productName={getProductName(viewAdj.productId)}
          onClose={() => setViewAdj(null)}
        />
      )}
      {editAdj && (
        <EditAdjModal
          adj={editAdj}
          productName={getProductName(editAdj.productId)}
          onSave={handleSaveEdit}
          onClose={() => setEditAdj(null)}
        />
      )}
    </div>
  );
}
