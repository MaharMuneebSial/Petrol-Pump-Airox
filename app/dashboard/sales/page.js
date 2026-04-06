'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { getSales, getProducts, getAccounts, deleteSale, updateSale, getSalePayments } from '../../../lib/store';

const fmt = (n) => new Intl.NumberFormat('en-PK', { minimumFractionDigits: 2 }).format(n || 0);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

// ─── Icons ────────────────────────────────────────────────────────────────────
const IconPlus    = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconSearch  = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IconTrending= () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>;
const IconTrash   = () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>;
const IconWarning = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const IconHash    = () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>;
const IconDroplet = () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>;
const IconCash    = () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>;
const IconCredit  = () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>;
const IconCalendar= () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
const IconX       = () => <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IconEye     = () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const IconEdit    = () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IconSave    = () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>;
const IconCheck   = () => <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>;
const IconUser    = () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IconChevron = () => <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>;
const IconPhone   = () => <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>;
const IconBank    = () => <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7"/></svg>;
const IconSplit   = () => <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M16 3h5v5"/><path d="M8 3H3v5"/><path d="M21 3l-7 7-4-4-7 7"/></svg>;

// ─── Payment config ───────────────────────────────────────────────────────────
const PAYMENT_FILTER = [
  { value: '',          label: 'All Payment Modes' },
  { value: 'cash',      label: 'Cash',      color: '#059669', bg: '#dcfce7', border: '#6ee7b7' },
  { value: 'credit',    label: 'Credit',    color: '#dc2626', bg: '#fee2e2', border: '#fca5a5' },
  { value: 'card',      label: 'Card',      color: '#2563eb', bg: '#dbeafe', border: '#93c5fd' },
  { value: 'online',    label: 'Online',    color: '#d97706', bg: '#fef3c7', border: '#fcd34d' },
  { value: 'jazzcash',  label: 'JazzCash',  color: '#be185d', bg: '#fce7f3', border: '#f9a8d4' },
  { value: 'easypaisa', label: 'EasyPaisa', color: '#15803d', bg: '#dcfce7', border: '#86efac' },
  { value: 'bank',      label: 'Bank Transfer', color: '#1d4ed8', bg: '#dbeafe', border: '#93c5fd' },
  { value: 'split',     label: 'Split Payment', color: '#4338ca', bg: '#ede9fe', border: '#c4b5fd' },
];

const MODE_CONFIG = {
  cash:      { label: 'Cash',      color: '#059669', bg: '#f0fdf4', border: '#6ee7b7', Icon: IconCash    },
  credit:    { label: 'Credit',    color: '#dc2626', bg: '#fef2f2', border: '#fca5a5', Icon: IconCredit  },
  card:      { label: 'Card',      color: '#2563eb', bg: '#eff6ff', border: '#93c5fd', Icon: IconCredit  },
  online:    { label: 'Online',    color: '#0891B2', bg: '#ECFEFF', border: '#A5F3FC', Icon: IconCash    },
  jazzcash:  { label: 'JazzCash',  color: '#be185d', bg: '#fdf2f8', border: '#f9a8d4', Icon: IconPhone   },
  easypaisa: { label: 'EasyPaisa', color: '#15803d', bg: '#f0fdf4', border: '#86efac', Icon: IconPhone   },
  bank:      { label: 'Bank',      color: '#1d4ed8', bg: '#eff6ff', border: '#93c5fd', Icon: IconBank    },
  split:     { label: 'Split',     color: '#4338ca', bg: '#f5f3ff', border: '#c4b5fd', Icon: IconSplit   },
};

const PayBadge = ({ mode }) => {
  const c = MODE_CONFIG[mode] || { label: mode, color: '#64748b', bg: '#f1f5f9', border: '#e2e8f0' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10.5px', fontWeight: 700, color: c.color, background: c.bg, border: `1px solid ${c.border}`, borderRadius: '6px', padding: '2px 7px', whiteSpace: 'nowrap' }}>
      {c.Icon && <c.Icon />} {c.label}
    </span>
  );
};

// ─── Action button ────────────────────────────────────────────────────────────
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

// ─── Info Row ─────────────────────────────────────────────────────────────────
function InfoRow({ label, value, accent }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid #f1f5f9' }}>
      <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: '13px', fontWeight: 700, color: accent || '#0D1B3E' }}>{value}</span>
    </div>
  );
}

// ─── View Modal ───────────────────────────────────────────────────────────────
function ViewModal({ sale, productName, customerName, payments, onClose }) {
  if (!sale) return null;
  const cfg = MODE_CONFIG[sale.paymentMode] || MODE_CONFIG.cash;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: 'rgba(10,18,40,0.65)', backdropFilter: 'blur(6px)' }}>
      <div style={{ width: '100%', maxWidth: '760px', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.28)', background: '#fff' }}>

        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #0D1B3E 0%, #1a3475 100%)', padding: '16px 22px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: '-20px', top: '-20px', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div>
                <p style={{ margin: 0, fontSize: '9.5px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Sale Receipt</p>
                <p style={{ margin: '3px 0 4px', fontSize: '18px', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>{fmtDate(sale.date)}</p>
                <PayBadge mode={sale.paymentMode} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: 0, fontSize: '9.5px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Total Amount</p>
                <p style={{ margin: '3px 0 0', fontSize: '24px', fontWeight: 800, color: '#F0A500', fontFamily: 'monospace', letterSpacing: '-0.02em' }}>Rs.&nbsp;{fmt(sale.total)}</p>
              </div>
              <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff', cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <IconX />
              </button>
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '16px 22px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Info row — 4 cells in one line */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.2fr 0.8fr 1fr', gap: '1px', background: '#eef2f7', border: '1.5px solid #eef2f7', borderRadius: '10px', overflow: 'hidden' }}>
            {[
              { label: 'Product',  value: productName,                                      color: '#0D1B3E' },
              { label: 'Customer', value: customerName,                                     color: '#0D1B3E' },
              { label: 'Quantity', value: `${fmt(sale.quantity)} ${sale.unit || 'Ltr'}`,    color: '#7c3aed' },
              { label: 'Rate',     value: `Rs. ${fmt(sale.rate)} / ${sale.unit || 'Ltr'}`,  color: '#0D1B3E' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: '#fff', padding: '10px 14px' }}>
                <p style={{ margin: 0, fontSize: '9.5px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '3px' }}>{label}</p>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Payment breakdown */}
          {payments.length > 0 && (
            <div style={{ border: '1.5px solid #e8ecf2', borderRadius: '10px', overflow: 'hidden' }}>
              {/* breakdown header */}
              <div style={{ padding: '8px 14px', background: '#f8fafc', borderBottom: '1px solid #eef2f7', display: 'flex', alignItems: 'center', gap: '7px' }}>
                <IconSplit />
                <span style={{ fontSize: '10px', fontWeight: 800, color: '#0D1B3E', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.55 }}>Payment Breakdown</span>
                <span style={{ marginLeft: 'auto', fontSize: '10.5px', fontWeight: 600, color: '#94a3b8' }}>{payments.length} method{payments.length > 1 ? 's' : ''}</span>
              </div>
              {/* breakdown rows */}
              {payments.map((p, i) => {
                const pc = MODE_CONFIG[p.mode] || { color: '#64748b' };
                const isLast = i === payments.length - 1;
                const meta = [];
                if (p.meta?.phone)    meta.push(<span key="ph"  style={{ display:'inline-flex', alignItems:'center', gap:'4px' }}><IconPhone />{p.meta.phone}{p.meta.txnId ? <span style={{ color:'#94a3b8' }}>&nbsp;· TXN: {p.meta.txnId}</span> : ''}</span>);
                if (p.meta?.bankName) meta.push(<span key="bk"  style={{ display:'inline-flex', alignItems:'center', gap:'4px' }}><IconBank />{p.meta.bankName} · {p.meta.accountNo}{p.meta.ref ? <span style={{ color:'#94a3b8' }}>&nbsp;· Ref: {p.meta.ref}</span> : ''}</span>);
                if (p.meta?.lastFour) meta.push(<span key="cc"  style={{ display:'inline-flex', alignItems:'center', gap:'4px' }}><IconCredit />••••&nbsp;{p.meta.lastFour}{p.meta.ref ? <span style={{ color:'#94a3b8' }}>&nbsp;· Ref: {p.meta.ref}</span> : ''}</span>);
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 14px', borderBottom: isLast ? 'none' : '1px solid #f1f5f9', background: '#fff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                      <PayBadge mode={p.mode} />
                      {meta.length > 0 && (
                        <span style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          {meta}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: pc.color, fontFamily: 'monospace', flexShrink: 0, marginLeft: '16px' }}>Rs.&nbsp;{fmt(p.amount)}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Note */}
          {sale.note && (
            <div style={{ background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: '8px', padding: '9px 14px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.08em', paddingTop: '1px', flexShrink: 0 }}>Note</span>
              <span style={{ fontSize: '12.5px', color: '#78350f', lineHeight: 1.5 }}>{sale.note}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '10px 22px 16px', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 24px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, border: '1.5px solid #e2e8f0', color: '#475569', background: '#f8fafc', cursor: 'pointer', fontFamily: 'inherit' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────
const SIMPLE_MODES = [
  { value: 'cash',      label: 'Cash',      solid: '#059669', bg: '#f0fdf4', border: '#6ee7b7' },
  { value: 'credit',    label: 'Credit',    solid: '#dc2626', bg: '#fef2f2', border: '#fca5a5' },
  { value: 'card',      label: 'Card',      solid: '#2563eb', bg: '#eff6ff', border: '#93c5fd' },
  { value: 'online',    label: 'Online',    solid: '#0891B2', bg: '#ECFEFF', border: '#A5F3FC' },
  { value: 'jazzcash',  label: 'JazzCash',  solid: '#db2777', bg: '#fdf2f8', border: '#f9a8d4' },
  { value: 'easypaisa', label: 'EasyPaisa', solid: '#16a34a', bg: '#f0fdf4', border: '#86efac' },
  { value: 'bank',      label: 'Bank',      solid: '#2563eb', bg: '#eff6ff', border: '#93c5fd' },
];

function EditModal({ sale, productName, customers, onSave, onClose }) {
  const [form, setForm] = useState({
    date:        sale.date        || '',
    quantity:    sale.quantity?.toString() || '',
    rate:        sale.rate?.toString()     || '',
    total:       sale.total?.toString()    || '',
    paymentMode: sale.paymentMode === 'split' ? 'cash' : (sale.paymentMode || 'cash'),
    customerId:  sale.customerId  || '',
    note:        sale.note        || '',
  });
  const [saving, setSaving] = useState(false);

  // Customer combobox
  const [custSearch, setCustSearch]   = useState(() => customers.find(c => c.id === sale.customerId)?.name || '');
  const [showCustDrop, setShowCustDrop] = useState(false);
  const custRef = useRef(null);

  useEffect(() => {
    const h = (e) => { if (custRef.current && !custRef.current.contains(e.target)) setShowCustDrop(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const filteredCusts = customers.filter(c => c.name?.toLowerCase().includes(custSearch.toLowerCase()));

  const recalc = (qty, rate) => {
    const t = ((parseFloat(qty) || 0) * (parseFloat(rate) || 0)).toFixed(2);
    setForm(p => ({ ...p, total: t }));
  };

  const handleChange = (field) => (e) => {
    const val = e.target.value;
    setForm(p => {
      const up = { ...p, [field]: val };
      if (field === 'quantity') recalc(val, p.rate);
      if (field === 'rate')     recalc(p.quantity, val);
      return up;
    });
  };

  const total = parseFloat(form.total) || 0;

  const handleSave = async () => {
    setSaving(true);
    await onSave(sale.id, {
      date:        form.date,
      quantity:    parseFloat(form.quantity),
      rate:        parseFloat(form.rate),
      total:       parseFloat(form.total),
      paymentMode: form.paymentMode,
      customerId:  form.customerId || null,
      note:        form.note.trim(),
    });
    setSaving(false);
  };

  const inp = (extra = {}) => ({
    width: '100%', boxSizing: 'border-box', padding: '8px 11px', fontSize: '13px',
    fontFamily: 'inherit', border: '1.5px solid #e2e8f0', borderRadius: '8px',
    background: '#fff', color: '#0D1B3E', outline: 'none', ...extra,
  });
  const lbl = { display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.03em' };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}>
      <div className="ps-card" style={{ width: '100%', maxWidth: '720px', overflow: 'visible' }}>
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #0D1B3E, #1e3a8a)', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ margin: 0, fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Edit Sale</p>
            <p style={{ margin: '2px 0 0', fontSize: '14px', fontWeight: 700, color: '#fff' }}>{productName}</p>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconX />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '18px 24px', display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '70vh', overflowY: 'auto' }}>

          {sale.paymentMode === 'split' && (
            <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '8px', padding: '9px 12px', fontSize: '12px', color: '#1D4ED8' }}>
              Note: This sale used split payment. You can change it to a single mode below, but split breakdown will be kept in records.
            </div>
          )}

          {/* Date + Qty + Rate in one row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr 1fr 1.2fr', gap: '12px', alignItems: 'end' }}>
            <div>
              <label style={lbl}>Sale Date *</label>
              <input type="date" style={inp()} value={form.date} onChange={handleChange('date')} />
            </div>
            <div>
              <label style={lbl}>Quantity *</label>
              <input style={inp()} placeholder="0.00" value={form.quantity} onChange={handleChange('quantity')} inputMode="decimal" />
            </div>
            <div>
              <label style={lbl}>Rate (Rs.) *</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px', fontWeight: 700, color: '#94a3b8', pointerEvents: 'none' }}>Rs.</span>
                <input style={inp({ paddingLeft: '34px' })} placeholder="0.00" value={form.rate} onChange={handleChange('rate')} inputMode="decimal" />
              </div>
            </div>
            {/* Total inline */}
            <div style={{ background: 'linear-gradient(135deg, #0D1B3E, #1e3a8a)', borderRadius: '10px', padding: '9px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <span style={{ fontSize: '9.5px', color: 'rgba(255,255,255,0.45)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total</span>
              <span style={{ fontSize: '16px', fontWeight: 800, color: total > 0 ? '#F0A500' : 'rgba(255,255,255,0.2)', fontFamily: 'monospace', marginTop: '1px' }}>Rs.&nbsp;{fmt(total)}</span>
            </div>
          </div>

          {/* Payment Mode */}
          <div>
            <label style={lbl}>Payment Mode *</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {SIMPLE_MODES.map(({ value, label, solid, bg, border }) => {
                const sel = form.paymentMode === value;
                return (
                  <button key={value} type="button" onClick={() => setForm(p => ({ ...p, paymentMode: value }))}
                    style={{ padding: '6px 12px', borderRadius: '7px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.12s', background: sel ? solid : bg, color: sel ? '#fff' : solid, border: `1.5px solid ${sel ? solid : border}` }}>
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Customer */}
          <div>
            <label style={lbl}>Customer {form.paymentMode === 'credit' ? '* (required)' : '(Optional)'}</label>
            <div ref={custRef} style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex', zIndex: 1 }}><IconUser /></span>
              <input style={inp({ paddingLeft: '30px', paddingRight: '28px', cursor: 'pointer' })}
                placeholder="Walk-in / Cash Customer"
                value={custSearch}
                readOnly={!showCustDrop}
                onClick={() => { setShowCustDrop(true); setCustSearch(''); }}
                onChange={(e) => setCustSearch(e.target.value)}
              />
              <span style={{ position: 'absolute', right: '9px', top: '50%', transform: `translateY(-50%) rotate(${showCustDrop ? 180 : 0}deg)`, transition: 'transform 0.2s', color: '#94a3b8', display: 'flex', pointerEvents: 'none' }}><IconChevron /></span>
              {showCustDrop && (
                <div style={{ position: 'absolute', top: 'calc(100% + 3px)', left: 0, right: 0, zIndex: 300, background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.10)', maxHeight: '160px', overflowY: 'auto' }}>
                  <div onClick={() => { setForm(p => ({ ...p, customerId: '' })); setCustSearch(''); setShowCustDrop(false); }}
                    style={{ padding: '9px 14px', cursor: 'pointer', fontSize: '13px', borderBottom: '1px solid #f1f5f9', color: '#94a3b8', fontStyle: 'italic' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    Walk-in / Cash Customer
                  </div>
                  {filteredCusts.map(c => (
                    <div key={c.id}
                      onClick={() => { setForm(p => ({ ...p, customerId: c.id })); setCustSearch(c.name); setShowCustDrop(false); }}
                      style={{ padding: '9px 14px', cursor: 'pointer', fontSize: '13px', borderBottom: '1px solid #f1f5f9', color: '#0D1B3E', fontWeight: 500 }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      {c.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Note */}
          <div>
            <label style={lbl}>Note (Optional)</label>
            <textarea style={{ ...inp(), resize: 'vertical', lineHeight: 1.5 }} rows={2} placeholder="Additional notes..." value={form.note} onChange={handleChange('note')} />
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, border: '1.5px solid #e2e8f0', color: '#64748b', background: '#f8fafc', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving}
            style={{ padding: '8px 22px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, background: '#0D1B3E', color: '#fff', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', opacity: saving ? 0.75 : 1, fontFamily: 'inherit' }}>
            {saving ? <><span className="spinner" /> Saving...</> : <><IconSave /> Save Changes</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SalesPage() {
  const [sales,    setSales]    = useState([]);
  const [products, setProducts] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [search,     setSearch]     = useState('');
  const [dateFrom,   setDateFrom]   = useState('');
  const [dateTo,     setDateTo]     = useState('');
  const [filterMode, setFilterMode] = useState('');

  // Searchable payment filter dropdown
  const [showPayDrop,  setShowPayDrop]  = useState(false);
  const [paySearch,    setPaySearch]    = useState('');
  const payDropRef = useRef(null);

  const [deleteId,   setDeleteId]   = useState(null);
  const [viewSale,   setViewSale]   = useState(null);   // { sale, payments }
  const [editSale,   setEditSale]   = useState(null);   // sale object

  const load = async () => {
    const [s, p, a] = await Promise.all([getSales(), getProducts(), getAccounts()]);
    setSales(s); setProducts(p); setAccounts(a);
  };
  useEffect(() => { load(); }, []);

  useEffect(() => {
    const h = (e) => { if (payDropRef.current && !payDropRef.current.contains(e.target)) { setShowPayDrop(false); setPaySearch(''); } };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);


  const getProductName  = (id) => products.find(p => p.id === id)?.name  || 'Unknown';
  const getCustomerName = (id) => id ? (accounts.find(a => a.id === id)?.name || 'Unknown') : 'Cash Customer';
  const customers = accounts.filter(a => a.type === 'Customer');

  const filtered = sales.filter(s => {
    const prod = getProductName(s.productId);
    const cust = getCustomerName(s.customerId);
    const matchSearch = prod.toLowerCase().includes(search.toLowerCase()) || cust.toLowerCase().includes(search.toLowerCase());
    const date = s.date || '';
    return matchSearch && (!dateFrom || date >= dateFrom) && (!dateTo || date <= dateTo) && (!filterMode || s.paymentMode === filterMode);
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  const totalAmt    = filtered.reduce((s, p) => s + parseFloat(p.total    || 0), 0);
  const totalQty    = filtered.reduce((s, p) => s + parseFloat(p.quantity || 0), 0);
  const cashSales   = filtered.filter(s => s.paymentMode === 'cash').reduce((s, p) => s + parseFloat(p.total || 0), 0);
  const creditSales = filtered.filter(s => s.paymentMode === 'credit').reduce((s, p) => s + parseFloat(p.total || 0), 0);

  const handleDelete = async (id) => { await deleteSale(id); await load(); setDeleteId(null); };

  const handleView = async (sale) => {
    const payments = await getSalePayments(sale.id);
    setViewSale({ sale, payments });
  };

  const handleSaveEdit = async (id, updates) => {
    await updateSale(id, updates);
    await load();
    setEditSale(null);
  };

  const hasFilters = search || dateFrom || dateTo || filterMode;
  const clearFilters = () => { setSearch(''); setDateFrom(''); setDateTo(''); setFilterMode(''); };

  const STATS = [
    { label: 'Total Records', value: sales.length,            sub: `${filtered.length} filtered`, Icon: IconHash,    color: '#1e3a8a', accent: '#3b82f6', bg: 'linear-gradient(135deg,#eff6ff,#dbeafe)' },
    { label: 'Volume',        value: `${fmt(totalQty)} Ltr`,  sub: 'Total quantity',              Icon: IconDroplet, color: '#6b21a8', accent: '#9333ea', bg: 'linear-gradient(135deg,#faf5ff,#ede9fe)' },
    { label: 'Cash Sales',    value: `Rs. ${fmt(cashSales)}`, sub: 'Cash payments',               Icon: IconCash,    color: '#065f46', accent: '#10b981', bg: 'linear-gradient(135deg,#f0fdf4,#dcfce7)' },
    { label: 'Credit Sales',  value: `Rs. ${fmt(creditSales)}`,sub: 'On account',                Icon: IconCredit,  color: '#991b1b', accent: '#ef4444', bg: 'linear-gradient(135deg,#fff1f2,#fee2e2)' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '10px', flexShrink: 0, background: 'linear-gradient(135deg,#0D1B3E,#1e3a8a)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <IconTrending />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0D1B3E', letterSpacing: '-0.025em', lineHeight: 1.2 }}>Sales List</h1>
            <p style={{ margin: 0, fontSize: '11.5px', color: '#94a3b8', marginTop: '1px' }}>All fuel and product sales</p>
          </div>
        </div>
        <Link href="/dashboard/sales/add" className="btn-gold" style={{ fontSize: '12.5px', padding: '7px 14px' }}>
          <IconPlus /> Add Sale
        </Link>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px' }}>
        {STATS.map(({ label, value, sub, Icon, color, accent, bg }) => (
          <div key={label} style={{ background: bg, borderRadius: '12px', padding: '12px 14px', border: `1px solid ${accent}22`, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '9px', flexShrink: 0, background: `${accent}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent }}>
              <Icon />
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: '10px', fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.07em', opacity: 0.75 }}>{label}</p>
              <p style={{ margin: '1px 0 0', fontSize: '14px', fontWeight: 800, color, letterSpacing: '-0.02em', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</p>
              <p style={{ margin: 0, fontSize: '10px', color: accent, opacity: 0.75 }}>{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Card */}
      <div className="ps-card">

        {/* Toolbar */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', background: '#fafbfc' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>

            {/* Search */}
            <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: '260px' }}>
              <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex', pointerEvents: 'none' }}><IconSearch /></span>
              <input
                placeholder="Search product or customer…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', paddingLeft: '32px', paddingRight: search ? '28px' : '10px', padding: '7px 10px 7px 32px', fontSize: '12.5px', fontFamily: 'inherit', border: '1.5px solid #e2e8f0', borderRadius: '8px', background: '#fff', color: '#0D1B3E', outline: 'none' }}
              />
              {search && (
                <button onClick={() => setSearch('')} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', padding: 0 }}><IconX /></button>
              )}
            </div>

            {/* Divider */}
            <div style={{ width: '1px', height: '28px', background: '#e2e8f0', flexShrink: 0 }} />

            {/* Date range */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: '0 0 auto' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>Date</span>
              <input type="date"
                value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                style={{ width: '132px', fontSize: '12px', fontFamily: 'inherit', padding: '7px 8px', border: '1.5px solid #e2e8f0', borderRadius: '8px', background: dateFrom ? '#eff6ff' : '#fff', color: dateFrom ? '#1d4ed8' : '#64748b', outline: 'none', borderColor: dateFrom ? '#93c5fd' : '#e2e8f0' }}
              />
              <span style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 700 }}>→</span>
              <input type="date"
                value={dateTo} onChange={e => setDateTo(e.target.value)}
                style={{ width: '132px', fontSize: '12px', fontFamily: 'inherit', padding: '7px 8px', border: '1.5px solid #e2e8f0', borderRadius: '8px', background: dateTo ? '#eff6ff' : '#fff', color: dateTo ? '#1d4ed8' : '#64748b', outline: 'none', borderColor: dateTo ? '#93c5fd' : '#e2e8f0' }}
              />
            </div>

            {/* Divider */}
            <div style={{ width: '1px', height: '28px', background: '#e2e8f0', flexShrink: 0 }} />

            {/* Searchable payment filter */}
            {(() => {
              const active = PAYMENT_FILTER.find(f => f.value === filterMode);
              const filtered_pay = PAYMENT_FILTER.filter(f =>
                f.label.toLowerCase().includes(paySearch.toLowerCase())
              );
              return (
                <div ref={payDropRef} style={{ position: 'relative', flex: '0 0 auto' }}>
                  {/* Trigger: plain search input */}
                  <div style={{ position: 'relative' }}>
                    {filterMode && active?.color && !showPayDrop && (
                      <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: '7px', height: '7px', borderRadius: '50%', background: active.color, flexShrink: 0, pointerEvents: 'none' }} />
                    )}
                    {!showPayDrop && (
                      <span style={{ position: 'absolute', left: filterMode ? '24px' : '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex', pointerEvents: 'none' }}>
                        {!filterMode && <IconSearch />}
                      </span>
                    )}
                    {showPayDrop && (
                      <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex', pointerEvents: 'none' }}><IconSearch /></span>
                    )}
                    <input
                      value={showPayDrop ? paySearch : (filterMode ? (active?.label || '') : '')}
                      placeholder="All Payment Modes"
                      onChange={e => setPaySearch(e.target.value)}
                      onFocus={() => { setShowPayDrop(true); setPaySearch(''); }}
                      readOnly={!showPayDrop}
                      style={{
                        width: '175px', boxSizing: 'border-box',
                        padding: '7px 28px 7px ' + (filterMode && !showPayDrop ? '24px' : '30px'),
                        fontSize: '12.5px', fontFamily: 'inherit',
                        fontWeight: !showPayDrop && filterMode ? 600 : 400,
                        color: !showPayDrop && filterMode ? (active?.color || '#0D1B3E') : '#64748b',
                        background: '#fff',
                        border: filterMode ? `1.5px solid ${active?.border || '#e2e8f0'}` : '1.5px solid #e2e8f0',
                        borderRadius: '8px', outline: 'none', cursor: 'pointer',
                      }}
                    />
                    <span style={{ position: 'absolute', right: '9px', top: '50%', transform: `translateY(-50%) rotate(${showPayDrop ? 180 : 0}deg)`, transition: 'transform 0.18s', display: 'flex', color: '#94a3b8', pointerEvents: 'none' }}>
                      <IconChevron />
                    </span>
                  </div>

                  {/* Dropdown */}
                  {showPayDrop && (
                    <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 300, width: '220px', background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.11)', overflow: 'hidden' }}>
                      {/* Options */}
                      <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
                        {filtered_pay.length === 0 ? (
                          <div style={{ padding: '12px 14px', fontSize: '12px', color: '#94a3b8', textAlign: 'center' }}>No match</div>
                        ) : filtered_pay.map(({ value, label, color, border }) => {
                          const sel = filterMode === value;
                          return (
                            <div key={value}
                              onClick={() => { setFilterMode(value); setShowPayDrop(false); setPaySearch(''); }}
                              style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '8px 14px', cursor: 'pointer', background: sel ? '#f8fafc' : 'transparent', borderLeft: sel ? `3px solid ${color || '#0D1B3E'}` : '3px solid transparent' }}
                              onMouseEnter={e => { if (!sel) e.currentTarget.style.background = '#f8fafc'; }}
                              onMouseLeave={e => { if (!sel) e.currentTarget.style.background = 'transparent'; }}
                            >
                              {value
                                ? <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: color, flexShrink: 0 }} />
                                : <span style={{ width: '7px', height: '7px', borderRadius: '50%', border: '1.5px solid #cbd5e1', flexShrink: 0 }} />
                              }
                              <span style={{ flex: 1, fontSize: '12.5px', fontWeight: sel ? 700 : 500, color: sel ? (color || '#0D1B3E') : '#374151' }}>{label}</span>
                              {sel && (
                                <svg width="13" height="13" fill="none" stroke={color || '#0D1B3E'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                                  <polyline points="20 6 9 17 4 12"/>
                                </svg>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Right: active filter tags + record count */}
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {hasFilters && (
                <button onClick={clearFilters}
                  style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px', borderRadius: '7px', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer', background: '#fff', color: '#64748b', border: '1.5px solid #e2e8f0', fontFamily: 'inherit', transition: 'all 0.12s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.borderColor = '#fca5a5'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                >
                  <IconX /> Clear filters
                </button>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 11px', background: '#0D1B3E', borderRadius: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#F0A500', fontVariantNumeric: 'tabular-nums' }}>{filtered.length}</span>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>record{filtered.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table className="ps-table">
            <thead>
              <tr>
                <th style={{ width: '36px' }}>#</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Product</th>
                <th style={{ textAlign: 'right' }}>Qty</th>
                <th style={{ textAlign: 'right' }}>Rate</th>
                <th style={{ textAlign: 'right' }}>Total (Rs.)</th>
                <th>Payment</th>
                <th style={{ textAlign: 'center', width: '96px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: '50px 20px', textAlign: 'center', color: '#94a3b8' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '7px' }}>
                      <span style={{ opacity: 0.25, color: '#0D1B3E' }}><IconTrending /></span>
                      <p style={{ fontWeight: 700, margin: 0, fontSize: '13px', color: '#64748b' }}>No sales found</p>
                      {hasFilters
                        ? <button onClick={clearFilters} style={{ fontSize: '12px', color: '#0D1B3E', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}>Clear filters →</button>
                        : <Link href="/dashboard/sales/add" style={{ fontSize: '12px', color: '#0D1B3E', textDecoration: 'none', fontWeight: 600 }}>Record first sale →</Link>
                      }
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((s, i) => (
                  <tr key={s.id}>
                    <td style={{ color: '#94a3b8', fontSize: '11.5px', fontWeight: 700 }}>{i + 1}</td>
                    <td style={{ color: '#475569', fontSize: '12px', whiteSpace: 'nowrap' }}>{fmtDate(s.date)}</td>
                    <td style={{ color: '#374151', fontSize: '12.5px', fontWeight: 500 }}>{getCustomerName(s.customerId)}</td>
                    <td style={{ fontWeight: 700, color: '#0D1B3E', fontSize: '12.5px' }}>{getProductName(s.productId)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#7c3aed', fontSize: '12.5px', fontVariantNumeric: 'tabular-nums' }}>{fmt(s.quantity)}</td>
                    <td style={{ textAlign: 'right', color: '#475569', fontSize: '12px', fontVariantNumeric: 'tabular-nums' }}>Rs.&nbsp;{fmt(s.rate)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#059669', fontSize: '12.5px', fontVariantNumeric: 'tabular-nums' }}>Rs.&nbsp;{fmt(s.total)}</td>
                    <td><PayBadge mode={s.paymentMode} /></td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                        <ActionBtn onClick={() => handleView(s)} icon={<IconEye />}   bg="#f0fdf4" color="#059669" border="#6ee7b7" title="View details" />
                        <ActionBtn onClick={() => setEditSale(s)} icon={<IconEdit />} bg="#eff6ff" color="#2563eb" border="#93c5fd" title="Edit sale" />
                        <ActionBtn onClick={() => setDeleteId(s.id)} icon={<IconTrash />} bg="#fef2f2" color="#ef4444" border="#fca5a5" title="Delete sale" />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr>
                  <td colSpan={4} style={{ padding: '10px 16px', fontWeight: 700, fontSize: '12px', color: '#0D1B3E' }}>Totals ({filtered.length} records)</td>
                  <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 800, color: '#7c3aed', fontSize: '12.5px', fontVariantNumeric: 'tabular-nums' }}>{fmt(totalQty)}</td>
                  <td />
                  <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 800, color: '#059669', fontSize: '12.5px', fontVariantNumeric: 'tabular-nums' }}>Rs.&nbsp;{fmt(totalAmt)}</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* ── View Modal ── */}
      {viewSale && (
        <ViewModal
          sale={viewSale.sale}
          productName={getProductName(viewSale.sale.productId)}
          customerName={getCustomerName(viewSale.sale.customerId)}
          payments={viewSale.payments}
          onClose={() => setViewSale(null)}
        />
      )}

      {/* ── Edit Modal ── */}
      {editSale && (
        <EditModal
          sale={editSale}
          productName={getProductName(editSale.productId)}
          customers={customers}
          onSave={handleSaveEdit}
          onClose={() => setEditSale(null)}
        />
      )}

      {/* ── Delete Modal ── */}
      {deleteId && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)' }}>
          <div className="ps-card" style={{ maxWidth: '340px', width: '100%', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', flexShrink: 0 }}><IconWarning /></div>
              <div>
                <h3 style={{ fontWeight: 700, fontSize: '15px', color: '#0D1B3E', margin: '0 0 5px' }}>Delete Sale?</h3>
                <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0, lineHeight: 1.5 }}>This action cannot be undone. Stock changes will not be reversed automatically.</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
              <button onClick={() => handleDelete(deleteId)} className="btn-danger" style={{ flex: 1, justifyContent: 'center', padding: '8px' }}><IconTrash /> Delete</button>
              <button onClick={() => setDeleteId(null)} className="btn-outline" style={{ flex: 1, justifyContent: 'center', padding: '8px' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
