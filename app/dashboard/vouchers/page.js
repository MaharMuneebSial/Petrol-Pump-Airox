'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getVouchers, addVoucher, deleteVoucher, getAccounts } from '../../../lib/store';

const fmt = (n) => new Intl.NumberFormat('en-PK', { minimumFractionDigits: 2 }).format(n || 0);

const IconPlus = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const IconX = () => (
  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IconSave = () => (
  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
    <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
  </svg>
);
const IconTrash = () => (
  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);
const IconWarning = () => (
  <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);
const IconReceipt = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);

function VouchersContent() {
  const searchParams = useSearchParams();
  const typeParam = searchParams.get('type') || 'receipt';
  const [activeType, setActiveType] = useState(typeParam);
  const [vouchers, setVouchers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ accountId: '', amount: '', date: new Date().toISOString().slice(0, 10), description: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const load = async () => {
    const [v, a] = await Promise.all([getVouchers(), getAccounts()]);
    setVouchers(v); setAccounts(a);
  };
  useEffect(() => { load(); }, []);
  useEffect(() => setActiveType(typeParam), [typeParam]);

  const filtered = vouchers.filter(v => v.type === activeType)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const totalAmt = filtered.reduce((s, v) => s + parseFloat(v.amount || 0), 0);
  const getAccountName = (id) => accounts.find(a => a.id === id)?.name || 'Unknown';

  const validate = () => {
    const errs = {};
    if (!form.accountId) errs.accountId = 'Select an account';
    if (!form.amount || parseFloat(form.amount) <= 0) errs.amount = 'Enter valid amount';
    if (!form.date) errs.date = 'Select date';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    await addVoucher({ type: activeType, accountId: form.accountId, amount: parseFloat(form.amount), date: form.date, description: form.description.trim() });
    setLoading(false);
    setShowForm(false);
    setForm({ accountId: '', amount: '', date: new Date().toISOString().slice(0, 10), description: '' });
    await load();
  };

  const handleDelete = async (id) => { await deleteVoucher(id); await load(); setDeleteId(null); };

  const isReceipt = activeType === 'receipt';
  const accentColor = isReceipt ? '#10b981' : '#ef4444';
  const accentBg = isReceipt ? '#f0fdf4' : '#fef2f2';
  const accentBorder = isReceipt ? '#86efac' : '#fca5a5';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      <div className="ps-page-header">
        <div>
          <h1 className="ps-page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <IconReceipt /> Vouchers
          </h1>
          <p className="ps-page-subtitle">Cash receipt and payment vouchers</p>
        </div>
        <button
          onClick={() => setShowForm(p => !p)}
          className={showForm ? 'btn-outline' : 'btn-primary'}
        >
          {showForm ? <><IconX /> Cancel</> : <><IconPlus /> New {isReceipt ? 'Receipt' : 'Payment'}</>}
        </button>
      </div>

      {/* Type Tabs */}
      <div style={{ display: 'flex', gap: '4px', padding: '4px', borderRadius: '12px', background: '#e2e8f0', maxWidth: '340px' }}>
        {[
          { val: 'receipt', label: 'Cash Receipt',  color: '#15803d' },
          { val: 'payment', label: 'Cash Payment',  color: '#b91c1c' },
        ].map(t => (
          <button
            key={t.val}
            onClick={() => setActiveType(t.val)}
            style={{
              flex: 1, padding: '9px 12px', borderRadius: '9px', fontSize: '13px', fontWeight: 600,
              border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
              background: activeType === t.val ? 'white' : 'transparent',
              color: activeType === t.val ? t.color : '#64748b',
              boxShadow: activeType === t.val ? '0 2px 8px rgba(0,0,0,0.12)' : 'none',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <div className="ps-card" style={{ animation: 'fadeIn 0.25s ease' }}>
          <div style={{
            padding: '14px 20px',
            borderBottom: `2px solid ${accentColor}`,
            background: accentBg,
          }}>
            <p style={{ fontWeight: 700, fontSize: '13px', color: isReceipt ? '#15803d' : '#b91c1c', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {isReceipt ? 'New Cash Receipt' : 'New Cash Payment'}
            </p>
          </div>
          <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label className="ps-label">Account *</label>
                <select className="ps-input" value={form.accountId} onChange={e => { setForm(p => ({ ...p, accountId: e.target.value })); setErrors(p => ({ ...p, accountId: '' })); }}>
                  <option value="">— Select Account —</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.type})</option>)}
                </select>
                {errors.accountId && <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>{errors.accountId}</p>}
              </div>
              <div>
                <label className="ps-label">Amount (Rs.) *</label>
                <input className="ps-input" placeholder="0.00" value={form.amount} onChange={e => { setForm(p => ({ ...p, amount: e.target.value })); setErrors(p => ({ ...p, amount: '' })); }} inputMode="decimal" />
                {errors.amount && <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>{errors.amount}</p>}
              </div>
              <div>
                <label className="ps-label">Date *</label>
                <input type="date" className="ps-input" value={form.date} onChange={e => { setForm(p => ({ ...p, date: e.target.value })); setErrors(p => ({ ...p, date: '' })); }} />
                {errors.date && <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>{errors.date}</p>}
              </div>
              <div>
                <label className="ps-label">Description</label>
                <input className="ps-input" placeholder="Reason for payment/receipt..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="submit" disabled={loading} className="btn-primary" style={{ opacity: loading ? 0.8 : 1 }}>
                {loading ? <><span className="spinner" /> Saving...</> : <><IconSave /> Save {isReceipt ? 'Receipt' : 'Payment'}</>}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-outline">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        <div className="ps-card" style={{ padding: '18px 20px', background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', border: 'none' }}>
          <p style={{ fontSize: '11px', fontWeight: 600, color: '#0f1f5c', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 4px', opacity: 0.8 }}>Total Vouchers</p>
          <p style={{ fontSize: '26px', fontWeight: 800, color: '#0f1f5c', margin: 0 }}>{filtered.length}</p>
        </div>
        <div className="ps-card" style={{ padding: '18px 20px', background: isReceipt ? 'linear-gradient(135deg, #f0fdf4, #dcfce7)' : 'linear-gradient(135deg, #fef2f2, #fee2e2)', border: 'none' }}>
          <p style={{ fontSize: '11px', fontWeight: 600, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 4px', opacity: 0.8 }}>Total Amount</p>
          <p style={{ fontSize: '22px', fontWeight: 800, color: accentColor, margin: 0 }}>Rs. {fmt(totalAmt)}</p>
        </div>
      </div>

      {/* Table */}
      <div className="ps-card">
        <div style={{
          padding: '14px 20px', borderBottom: `3px solid ${accentColor}`,
          background: accentBg,
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '7px',
            background: accentColor,
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
          }}>
            <IconReceipt />
          </div>
          <h2 style={{ fontWeight: 700, fontSize: '14px', color: isReceipt ? '#15803d' : '#b91c1c', margin: 0 }}>
            {isReceipt ? 'Cash Receipt Vouchers' : 'Cash Payment Vouchers'}
          </h2>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="ps-table">
            <thead>
              <tr>
                <th>#</th><th>Date</th><th>Account</th><th>Description</th>
                <th style={{ textAlign: 'right' }}>Amount (Rs.)</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '60px 20px', textAlign: 'center', color: '#94a3b8' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <span style={{ opacity: 0.3, color: '#0f1f5c' }}><IconReceipt /></span>
                      <p style={{ fontWeight: 600, margin: 0 }}>No {isReceipt ? 'receipts' : 'payments'} found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((v, i) => (
                  <tr key={v.id}>
                    <td style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 600 }}>{i + 1}</td>
                    <td style={{ color: '#475569', fontSize: '13px' }}>{v.date}</td>
                    <td style={{ fontWeight: 600, color: '#0f1f5c', fontSize: '13px' }}>{getAccountName(v.accountId)}</td>
                    <td style={{ color: '#475569', fontSize: '13px' }}>{v.description || '—'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, fontSize: '13px', color: accentColor }}>
                      Rs. {fmt(v.amount)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button onClick={() => setDeleteId(v.id)} className="btn-danger btn-sm"><IconTrash /> Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr>
                  <td colSpan={4} style={{ padding: '12px 16px', fontWeight: 700, fontSize: '13px', color: '#0f1f5c' }}>Total</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 800, fontSize: '14px', color: accentColor }}>Rs. {fmt(totalAmt)}</td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {deleteId && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}>
          <div className="ps-card" style={{ maxWidth: '360px', width: '100%', padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', flexShrink: 0 }}><IconWarning /></div>
              <div>
                <h3 style={{ fontWeight: 700, fontSize: '16px', color: '#0f1f5c', margin: '0 0 6px' }}>Delete Voucher?</h3>
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: 1.5 }}>This will affect account balances. Cannot be undone.</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '22px' }}>
              <button onClick={() => handleDelete(deleteId)} className="btn-danger" style={{ flex: 1, justifyContent: 'center', padding: '10px' }}><IconTrash /> Delete</button>
              <button onClick={() => setDeleteId(null)} className="btn-outline" style={{ flex: 1, justifyContent: 'center', padding: '10px' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VouchersPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ width: '28px', height: '28px', borderTopColor: '#0f1f5c', borderColor: '#e2e8f0', borderWidth: '3px', margin: '0 auto 10px' }} />
          <p style={{ color: '#94a3b8', fontSize: '13px' }}>Loading...</p>
        </div>
      </div>
    }>
      <VouchersContent />
    </Suspense>
  );
}
