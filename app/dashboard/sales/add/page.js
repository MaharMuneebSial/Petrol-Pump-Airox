'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCompany, addSale } from '../../../../lib/store';
import { supabase } from '../../../../lib/supabase';

// ── Icons ──────────────────────────────────────────────────────────────────
const IconBack   = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>;
const IconAlert  = () => <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const IconCheck  = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>;
const IconBox    = () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>;
const IconCash   = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/><path d="M6 12h.01M18 12h.01"/></svg>;
const IconWallet = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/></svg>;
const IconCredit = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;

const lbl  = { fontSize: '11px', fontWeight: 600, color: '#64748B', marginBottom: '4px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' };
const inp  = { width: '100%', padding: '9px 12px', border: '1.5px solid #E2E8F0', borderRadius: '9px', fontSize: '13px', color: '#1E293B', background: 'white', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };
const errS = { fontSize: '10.5px', color: '#ef4444', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '3px' };

const fmt    = n => new Intl.NumberFormat('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);
const fmtPKR = n => `Rs. ${fmt(n)}`;

export default function CounterSalePage() {
  const router  = useRouter();
  const [products,  setProducts]  = useState([]);
  const [accounts,  setAccounts]  = useState([]);
  const [selProd,   setSelProd]   = useState(null);
  const [form,      setForm]      = useState({
    date:        new Date().toISOString().split('T')[0],
    productId:   '',
    quantity:    '',
    rate:        '',
    paymentMode: 'cash',
    customerId:  '',
    walletPhone: '',
    walletTxn:   '',
    note:        '',
  });
  const [errors,    setErrors]    = useState({});
  const [saving,    setSaving]    = useState(false);
  const [globalErr, setGlobalErr] = useState('');

  useEffect(() => {
    const company = getCompany();
    if (!company) return;
    Promise.all([
      supabase.from('products').select('id, name, unit, selling_rate, current_stock').eq('company_id', company.id).eq('is_active', true).order('name'),
      supabase.from('accounts').select('id, name, type').eq('company_id', company.id).eq('is_active', true).order('name'),
    ]).then(([pRes, aRes]) => {
      setProducts(pRes.data || []);
      setAccounts(aRes.data || []);
    });
  }, []);

  const set = (field, value) => {
    setForm(p => ({ ...p, [field]: value }));
    setErrors(p => { const n = { ...p }; delete n[field]; return n; });
    setGlobalErr('');
  };

  const handleProductChange = (productId) => {
    const prod = products.find(p => p.id === productId) || null;
    setSelProd(prod);
    setForm(p => ({ ...p, productId, rate: prod ? String(prod.selling_rate || '') : '' }));
    setErrors(p => { const n = { ...p }; delete n.productId; delete n.rate; delete n.quantity; return n; });
  };

  const qty   = parseFloat(form.quantity || 0);
  const rate  = parseFloat(form.rate || 0);
  const total = isNaN(qty) || isNaN(rate) ? 0 : qty * rate;
  const stock = parseFloat(selProd?.current_stock || 0);
  const stockOk = !selProd || qty <= stock;

  const validate = () => {
    const e = {};
    if (!form.date)                           e.date       = 'Required';
    if (!form.productId)                      e.productId  = 'Select a product';
    if (!form.quantity || qty <= 0)           e.quantity   = 'Enter valid quantity';
    if (!stockOk)                             e.quantity   = `Only ${stock} ${selProd?.unit || ''} in stock`;
    if (!form.rate || rate <= 0)              e.rate       = 'Enter valid rate';
    if (form.paymentMode === 'credit' && !form.customerId) e.customerId = 'Select customer account';
    return e;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    setGlobalErr('');
    const result = await addSale({
      date:        form.date,
      productId:   form.productId,
      customerId:  form.paymentMode === 'credit' ? form.customerId : null,
      quantity:    qty,
      rate,
      total,
      paymentMode: form.paymentMode,
      note:        form.note.trim() || null,
    });
    if (!result) {
      setGlobalErr('Failed to save. Please try again.');
      setSaving(false);
      return;
    }
    router.push('/dashboard/sales');
  };

  const payModes = [
    { key: 'cash',   label: 'Cash',   Icon: IconCash,   color: '#059669', bg: '#F0FDF4', border: '#BBF7D0' },
    { key: 'wallet', label: 'Wallet', Icon: IconWallet, color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' },
    { key: 'credit', label: 'Credit', Icon: IconCredit, color: '#DC2626', bg: '#FFF5F5', border: '#FECACA' },
  ];

  return (
    <div style={{ maxWidth: '660px' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '22px' }}>
        <button onClick={() => router.back()} style={{ width: '34px', height: '34px', borderRadius: '9px', background: 'white', border: '1.5px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569', flexShrink: 0 }}>
          <IconBack />
        </button>
        <div>
          <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#0F172A' }}>Counter Sale</h2>
          <p style={{ margin: 0, fontSize: '12px', color: '#64748B', marginTop: '2px' }}>Mobile oil, filters &amp; other shop items</p>
        </div>
      </div>

      {globalErr && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '9px', marginBottom: '14px', color: '#B91C1C', fontSize: '12.5px' }}>
          <IconAlert /> {globalErr}
        </div>
      )}

      {/* ── Date ── */}
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '14px 16px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ flex: 1 }}>
          <label style={lbl}>Date</label>
          <input type="date" value={form.date} onChange={e => set('date', e.target.value)} style={inp} />
          {errors.date && <p style={errS}><IconAlert />{errors.date}</p>}
        </div>
        {total > 0 && (
          <div style={{ textAlign: 'right', paddingTop: '14px' }}>
            <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#059669', letterSpacing: '-0.5px' }}>{fmtPKR(total)}</div>
          </div>
        )}
      </div>

      {/* ── Product ── */}
      <div style={{ background: 'white', borderRadius: '12px', border: `1.5px solid ${errors.productId ? '#FECACA' : '#E2E8F0'}`, padding: '14px 16px', marginBottom: '12px' }}>
        <label style={lbl}>Product</label>
        <select
          value={form.productId}
          onChange={e => handleProductChange(e.target.value)}
          style={{ ...inp, color: form.productId ? '#1E293B' : '#94A3B8', cursor: 'pointer' }}
        >
          <option value="">Select product…</option>
          {products.map(p => (
            <option key={p.id} value={p.id}>
              {p.name}  —  Rs. {p.selling_rate}/{p.unit}  (Stock: {p.current_stock} {p.unit})
            </option>
          ))}
        </select>
        {errors.productId && <p style={errS}><IconAlert />{errors.productId}</p>}

        {/* Product info strip */}
        {selProd && (
          <div style={{ display: 'flex', gap: '12px', marginTop: '10px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 10px', background: '#F0FDF4', borderRadius: '7px', border: '1px solid #BBF7D0' }}>
              <IconBox />
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#059669' }}>
                Stock: {fmt(selProd.current_stock)} {selProd.unit}
              </span>
            </div>
            <div style={{ padding: '5px 10px', background: '#EFF6FF', borderRadius: '7px', border: '1px solid #BFDBFE', fontSize: '12px', fontWeight: 600, color: '#1D4ED8' }}>
              Rate: Rs. {selProd.selling_rate}/{selProd.unit}
            </div>
            {qty > 0 && !stockOk && (
              <div style={{ padding: '5px 10px', background: '#FEF2F2', borderRadius: '7px', border: '1px solid #FECACA', fontSize: '12px', fontWeight: 600, color: '#DC2626' }}>
                Insufficient stock
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Qty / Rate / Total ── */}
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '14px 16px', marginBottom: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
        <div>
          <label style={lbl}>Quantity {selProd && <span style={{ color: '#94A3B8', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>({selProd.unit})</span>}</label>
          <input
            type="number" min="0" step="0.01" placeholder="0"
            value={form.quantity}
            onChange={e => set('quantity', e.target.value)}
            style={{ ...inp, textAlign: 'right', fontWeight: 700, borderColor: errors.quantity ? '#FCA5A5' : undefined }}
          />
          {errors.quantity && <p style={errS}><IconAlert />{errors.quantity}</p>}
        </div>
        <div>
          <label style={lbl}>Rate (Rs.)</label>
          <input
            type="number" min="0" step="0.01" placeholder="0.00"
            value={form.rate}
            onChange={e => set('rate', e.target.value)}
            style={{ ...inp, textAlign: 'right', fontWeight: 700, borderColor: errors.rate ? '#FCA5A5' : undefined }}
          />
          {errors.rate && <p style={errS}><IconAlert />{errors.rate}</p>}
        </div>
        <div>
          <label style={lbl}>Total (Rs.)</label>
          <div style={{ ...inp, textAlign: 'right', fontWeight: 800, fontSize: '15px', color: total > 0 ? '#059669' : '#94A3B8', background: '#F8FAFC', borderColor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
            {total > 0 ? fmt(total) : '—'}
          </div>
        </div>
      </div>

      {/* ── Payment Mode ── */}
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '14px 16px', marginBottom: '12px' }}>
        <label style={{ ...lbl, marginBottom: '10px' }}>Payment Method</label>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {payModes.map(({ key, label, Icon, color, bg, border }) => {
            const active = form.paymentMode === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => { set('paymentMode', key); set('customerId', ''); }}
                style={{
                  flex: 1, minWidth: '100px', padding: '10px 14px', borderRadius: '9px',
                  border: `1.5px solid ${active ? border : '#E2E8F0'}`,
                  background: active ? bg : 'white',
                  color: active ? color : '#64748B',
                  fontWeight: 700, fontSize: '13px', cursor: 'pointer',
                  fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  transition: 'all 0.15s',
                }}
              >
                <Icon /> {label}
                {active && <IconCheck />}
              </button>
            );
          })}
        </div>

        {/* Credit — customer selector */}
        {form.paymentMode === 'credit' && (
          <div style={{ marginTop: '12px' }}>
            <label style={lbl}>Customer Account <span style={{ color: '#DC2626' }}>*</span></label>
            <select
              value={form.customerId}
              onChange={e => set('customerId', e.target.value)}
              style={{ ...inp, color: form.customerId ? '#1E293B' : '#94A3B8', cursor: 'pointer', borderColor: errors.customerId ? '#FCA5A5' : undefined }}
            >
              <option value="">Select customer…</option>
              {accounts.filter(a => a.type === 'Customer' || a.type === 'customer').map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
              {accounts.filter(a => a.type !== 'Customer' && a.type !== 'customer').length > 0 && (
                <>
                  <option disabled>── Other accounts ──</option>
                  {accounts.filter(a => a.type !== 'Customer' && a.type !== 'customer').map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({a.type})</option>
                  ))}
                </>
              )}
            </select>
            {errors.customerId && <p style={errS}><IconAlert />{errors.customerId}</p>}
          </div>
        )}

        {/* Wallet — optional details */}
        {form.paymentMode === 'wallet' && (
          <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '12px 14px', background: '#F5F3FF', borderRadius: '10px', border: '1px solid #DDD6FE' }}>
            <div>
              <label style={{ ...lbl, color: '#7C3AED' }}>Phone No. (optional)</label>
              <input type="text" placeholder="03XX-XXXXXXX" value={form.walletPhone} onChange={e => set('walletPhone', e.target.value)} style={inp} />
            </div>
            <div>
              <label style={{ ...lbl, color: '#7C3AED' }}>Transaction ID (optional)</label>
              <input type="text" placeholder="TXN-XXXX" value={form.walletTxn} onChange={e => set('walletTxn', e.target.value)} style={inp} />
            </div>
          </div>
        )}
      </div>

      {/* ── Note ── */}
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '14px 16px', marginBottom: '16px' }}>
        <label style={lbl}>Note <span style={{ color: '#94A3B8', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
        <input
          type="text"
          placeholder="e.g. Castrol 20W50 — walk-in customer"
          value={form.note}
          onChange={e => set('note', e.target.value)}
          style={inp}
        />
      </div>

      {/* ── Submit ── */}
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          {total > 0 ? (
            <>
              <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {selProd?.name} · {qty} {selProd?.unit} · {payModes.find(m => m.key === form.paymentMode)?.label}
              </div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#059669', marginTop: '2px' }}>{fmtPKR(total)}</div>
            </>
          ) : (
            <div style={{ fontSize: '13px', color: '#94A3B8' }}>Fill in sale details above</div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={() => router.back()}
            style={{ padding: '10px 20px', borderRadius: '9px', border: '1.5px solid #E2E8F0', background: 'white', color: '#475569', fontWeight: 600, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || !form.productId || qty <= 0 || rate <= 0 || !stockOk}
            style={{
              padding: '10px 28px', borderRadius: '9px', border: 'none',
              background: (saving || !form.productId || qty <= 0 || rate <= 0 || !stockOk)
                ? 'rgba(5,150,105,0.4)'
                : 'linear-gradient(135deg, #059669, #047857)',
              color: 'white', fontWeight: 700, fontSize: '13px',
              cursor: (saving || !form.productId || qty <= 0 || rate <= 0 || !stockOk) ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              boxShadow: saving ? 'none' : '0 3px 10px rgba(5,150,105,0.3)',
            }}
          >
            {saving ? 'Saving…' : 'Record Sale'}
          </button>
        </div>
      </div>
    </div>
  );
}
