'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { addPurchase, getProducts, getAccounts } from '../../../../lib/store';

/* ─── Searchable Select ──────────────────────────────────────────────────── */
function SearchSelect({ options, value, onChange, placeholder, error, clearable }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [focusedIdx, setFocusedIdx] = useState(-1);
  const ref = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const selected = options.find(o => o.value === value);
  const filtered = query
    ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false); setQuery(''); setFocusedIdx(-1);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Scroll focused item into view
  useEffect(() => {
    if (focusedIdx >= 0 && listRef.current) {
      const item = listRef.current.children[focusedIdx];
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [focusedIdx]);

  const handleSelect = (val) => {
    onChange(val); setQuery(''); setOpen(false); setFocusedIdx(-1);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) { setOpen(true); return; }
    if (e.key === 'Escape') { setOpen(false); setQuery(''); setFocusedIdx(-1); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setFocusedIdx(i => Math.min(i + 1, filtered.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setFocusedIdx(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && focusedIdx >= 0) { e.preventDefault(); handleSelect(filtered[focusedIdx].value); }
  };

  const displayValue = open ? query : (selected?.label || '');
  const showClear = clearable && value && !open;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          ref={inputRef}
          value={displayValue}
          onChange={e => { setQuery(e.target.value); setOpen(true); setFocusedIdx(-1); }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          style={{
            width: '100%', padding: `8px ${showClear ? '52px' : '32px'} 8px 12px`,
            borderRadius: '8px',
            border: `1px solid ${error ? '#ef4444' : open ? '#0f1f5c' : '#e2e8f0'}`,
            fontSize: '13px', outline: 'none', color: '#0f172a', background: 'white',
            boxShadow: open ? '0 0 0 3px rgba(15,31,92,0.08)' : 'none',
            transition: 'border-color 0.15s, box-shadow 0.15s',
            boxSizing: 'border-box',
          }}
        />
        {/* Clear button */}
        {showClear && (
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); handleSelect(''); }}
            style={{ position: 'absolute', right: '28px', background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: '#94a3b8', display: 'flex', alignItems: 'center' }}
          >
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        )}
        {/* Chevron */}
        <svg width="12" height="12" fill="none" stroke="#94a3b8" strokeWidth="2.5" viewBox="0 0 24 24"
          style={{ position: 'absolute', right: '10px', pointerEvents: 'none', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 200, overflow: 'hidden',
        }}>
          <div ref={listRef} style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {filtered.length === 0
              ? <p style={{ padding: '12px 14px', fontSize: '12px', color: '#94a3b8', margin: 0 }}>No results</p>
              : filtered.map((o, i) => (
                <div
                  key={o.value}
                  onMouseDown={e => { e.preventDefault(); handleSelect(o.value); }}
                  onMouseEnter={() => setFocusedIdx(i)}
                  style={{
                    padding: '9px 14px', fontSize: '13px', cursor: 'pointer',
                    background: i === focusedIdx ? '#eff6ff' : o.value === value ? '#f0f9ff' : 'white',
                    color: i === focusedIdx || o.value === value ? '#0f1f5c' : '#334155',
                    fontWeight: o.value === value ? 600 : 400,
                    borderLeft: o.value === value ? '3px solid #0f1f5c' : '3px solid transparent',
                  }}
                >
                  {o.label}
                </div>
              ))
            }
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Styled Select (for Payment Mode — few options, no search needed) ───── */
function StyledSelect({ options, value, onChange }) {
  return (
    <div style={{ position: 'relative' }}>
      <select
        value={value}
        onChange={onChange}
        style={{
          width: '100%', padding: '8px 32px 8px 12px', borderRadius: '8px',
          border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none',
          color: '#0f172a', background: 'white', cursor: 'pointer',
          appearance: 'none', WebkitAppearance: 'none',
          transition: 'border-color 0.15s, box-shadow 0.15s',
          boxSizing: 'border-box',
        }}
        onFocus={e => { e.target.style.borderColor = '#0f1f5c'; e.target.style.boxShadow = '0 0 0 3px rgba(15,31,92,0.08)'; }}
        onBlur={e  => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <svg width="12" height="12" fill="none" stroke="#94a3b8" strokeWidth="2.5" viewBox="0 0 24 24"
        style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
        <polyline points="6 9 12 15 18 9"/>
      </svg>
    </div>
  );
}

/* ─── Icons ──────────────────────────────────────────────────────────────── */
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
const IconInfo = () => (
  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

const fmt = (n) => new Intl.NumberFormat('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);

function Field({ label, hint, error, span, children }) {
  return (
    <div style={{ gridColumn: span ? `span ${span}` : undefined }}>
      <label className="ps-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span>{label}</span>
        {hint && <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px', color: '#0f1f5c', fontWeight: 500, background: '#eff6ff', padding: '2px 6px', borderRadius: '4px' }}><IconInfo />{hint}</span>}
      </label>
      {children}
      {error && <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>{error}</p>}
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function AddPurchasePage() {
  const router = useRouter();
  const [products, setProducts]   = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [form, setForm] = useState({
    productId: '', quantity: '', rate: '', total: '',
    supplierId: '', date: new Date().toISOString().slice(0, 10),
    note: '', paymentMode: 'cash', invoiceNo: '',
  });
  const [errors, setErrors]           = useState({});
  const [loading, setLoading]         = useState(false);
  const [success, setSuccess]         = useState(false);
  const [rateAutoFilled, setRateAutoFilled] = useState(false);

  useEffect(() => {
    (async () => {
      const [prods, accs] = await Promise.all([getProducts(), getAccounts()]);
      setProducts(prods);
      setSuppliers(accs.filter(a => a.type === 'Supplier'));
    })();
  }, []);

  const selectedProduct = products.find(p => p.id === form.productId);
  const unitLabel = selectedProduct?.unit || 'Unit';

  const handleChange = (field) => (e) => {
    const val = typeof e === 'string' ? e : e.target.value;
    setForm(p => {
      const u = { ...p, [field]: val };
      if (field === 'quantity' || field === 'rate') {
        const qty  = parseFloat(field === 'quantity' ? val : p.quantity) || 0;
        const rate = parseFloat(field === 'rate'     ? val : p.rate)     || 0;
        u.total = (qty * rate).toFixed(2);
      }
      if (field === 'rate') setRateAutoFilled(false);
      if (field === 'productId') {
        const prod = products.find(pr => pr.id === val);
        if (prod?.purchaseRate > 0) { u.rate = prod.purchaseRate.toString(); setRateAutoFilled(true); }
        else                        { u.rate = '';                           setRateAutoFilled(false); }
        u.total = ((parseFloat(p.quantity) || 0) * parseFloat(prod?.purchaseRate || 0)).toFixed(2);
      }
      // Auto-switch payment mode when supplier changes
      if (field === 'supplierId') {
        u.paymentMode = val ? 'credit' : 'cash';
      }
      return u;
    });
    setErrors(p => ({ ...p, [field]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.productId)                          e.productId = 'Select a product';
    if (!form.quantity || parseFloat(form.quantity) <= 0) e.quantity  = 'Enter valid quantity';
    if (!form.rate     || parseFloat(form.rate)     <= 0) e.rate      = 'Enter valid rate';
    if (!form.date)                               e.date     = 'Select date';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    await addPurchase({
      productId:   form.productId,
      quantity:    parseFloat(form.quantity),
      rate:        parseFloat(form.rate),
      total:       parseFloat(form.total),
      supplierId:  form.supplierId || null,
      date:        form.date,
      note:        form.note.trim(),
      paymentMode: form.paymentMode,
      invoiceNo:   form.invoiceNo.trim(),
    });
    setLoading(false);
    setSuccess(true);
    setTimeout(() => router.push('/dashboard/purchase'), 1500);
  };

  const totalVal = parseFloat(form.total) || 0;
  const hasTotal = totalVal > 0;
  const supplierName = suppliers.find(s => s.id === form.supplierId)?.name;

  return (
    <div style={{ maxWidth: '960px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748b' }}>
        <Link href="/dashboard/purchase" style={{ color: '#0f1f5c', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
          <IconBack /> Purchase
        </Link>
        <span style={{ color: '#cbd5e1' }}>/</span>
        <span>Add Purchase</span>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="ps-page-title">Add Purchase</h1>
          <p className="ps-page-subtitle">Record a new fuel or product purchase</p>
        </div>
        <p style={{ fontSize: '11px', color: '#94a3b8' }}>* Required</p>
      </div>

      {success && (
        <div className="alert-success"><IconCheck /> Purchase recorded successfully! Redirecting...</div>
      )}

      {/* Form Card */}
      <div className="ps-card" style={{ overflow: 'hidden' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ padding: '24px 24px 20px', display: 'flex', flexDirection: 'column', gap: '0' }}>

            {/* ── Section label: What ── */}
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 14px' }}>What was purchased</p>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '14px', marginBottom: '20px' }}>

              <Field label="Product *" error={errors.productId}>
                <SearchSelect
                  options={products.map(p => ({ value: p.id, label: `${p.name} (${p.unit})` }))}
                  value={form.productId}
                  onChange={val => handleChange('productId')(val)}
                  placeholder="Type to search product..."
                  error={errors.productId}
                />
                {products.length === 0 && (
                  <p style={{ fontSize: '11px', color: '#f59e0b', marginTop: '4px' }}>
                    No products. <Link href="/dashboard/products/add" style={{ color: '#0f1f5c' }}>Add →</Link>
                  </p>
                )}
              </Field>

              <Field label="Date *" error={errors.date}>
                <input
                  type="date"
                  className="ps-input"
                  value={form.date}
                  onChange={handleChange('date')}
                  style={{ borderColor: errors.date ? '#ef4444' : undefined }}
                />
              </Field>

              <Field label={`Quantity${form.productId ? ` (${unitLabel})` : ''} *`} error={errors.quantity}>
                <input
                  className="ps-input"
                  placeholder="0.00"
                  value={form.quantity}
                  onChange={handleChange('quantity')}
                  inputMode="decimal"
                  style={{ borderColor: errors.quantity ? '#ef4444' : undefined }}
                />
              </Field>

              <Field
                label={`Rate / ${form.productId ? unitLabel : 'Unit'} (Rs.) *`}
                hint={rateAutoFilled ? 'Last rate' : null}
                error={errors.rate}
              >
                <input
                  className="ps-input"
                  placeholder="0.00"
                  value={form.rate}
                  onChange={handleChange('rate')}
                  inputMode="decimal"
                  style={{ borderColor: errors.rate ? '#ef4444' : undefined }}
                />
              </Field>
            </div>

            {/* Divider */}
            <div style={{ borderTop: '1px solid #f1f5f9', margin: '0 0 20px' }} />

            {/* ── Section label: How ── */}
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 14px' }}>Supplier & payment</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '14px' }}>

              <Field label="Supplier">
                <SearchSelect
                  clearable
                  options={suppliers.map(s => ({ value: s.id, label: s.name }))}
                  value={form.supplierId}
                  onChange={val => handleChange('supplierId')(val)}
                  placeholder="Cash purchase"
                />
                {suppliers.length === 0 && (
                  <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                    <Link href="/dashboard/accounts/add" style={{ color: '#0f1f5c' }}>Add suppliers →</Link>
                  </p>
                )}
              </Field>

              <Field
                label={
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    Payment Mode
                    {form.supplierId && form.paymentMode === 'cash' && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px', color: '#f59e0b', fontWeight: 500 }}>
                        <IconInfo /> Confirm cash?
                      </span>
                    )}
                  </span>
                }
              >
                <StyledSelect
                  value={form.paymentMode}
                  onChange={handleChange('paymentMode')}
                  options={[
                    { value: 'cash',   label: 'Cash' },
                    { value: 'credit', label: 'Credit (OMC / Supplier)' },
                    { value: 'card',   label: 'Card' },
                    { value: 'online', label: 'Bank / Online Transfer' },
                  ]}
                />
              </Field>

              <Field label={<span>Invoice No <span style={{ color: '#94a3b8', fontWeight: 400 }}>(Optional)</span></span>}>
                <input className="ps-input" placeholder="e.g. INV-001" value={form.invoiceNo} onChange={handleChange('invoiceNo')} />
              </Field>

              <Field label={<span>Note <span style={{ color: '#94a3b8', fontWeight: 400 }}>(Optional)</span></span>}>
                <input className="ps-input" placeholder="Any remarks..." value={form.note} onChange={handleChange('note')} />
              </Field>

            </div>
          </div>

          {/* ── Footer: Total + Actions ── */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 24px',
            borderTop: '1px solid #e2e8f0',
            background: hasTotal ? 'linear-gradient(135deg, #0f1f5c, #1e3a8a)' : '#f8fafc',
            transition: 'background 0.3s',
          }}>
            <div>
              <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 2px', color: hasTotal ? '#93c5fd' : '#94a3b8' }}>Total Amount</p>
              <p style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 2px', letterSpacing: '-0.02em', color: hasTotal ? '#fcd34d' : '#cbd5e1' }}>
                Rs. {fmt(totalVal)}
              </p>
              <p style={{ fontSize: '11px', margin: 0, color: hasTotal ? '#93c5fd' : '#94a3b8' }}>
                {form.quantity || '0'} {unitLabel} × Rs. {form.rate || '0'}
                {supplierName && <> &nbsp;·&nbsp; Payable to <strong style={{ color: hasTotal ? 'white' : '#475569' }}>{supplierName}</strong></>}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <Link href="/dashboard/purchase" className="btn-outline">Cancel</Link>
              <button type="submit" disabled={loading} className="btn-primary"
                style={{ opacity: loading ? 0.8 : 1, minWidth: '150px', justifyContent: 'center' }}>
                {loading ? <><span className="spinner" /> Saving...</> : <><IconSave /> Save Purchase</>}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
