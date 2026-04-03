'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { addAccount } from '../../../../lib/store';

/* ── Icons ── */
const IconSave  = () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>;
const IconBack  = () => <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>;
const IconCheck = () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>;
const IconUser  = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IconTruck = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>;
const IconBadge = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>;
const IconGrid  = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>;

const TYPES = [
  {
    value: 'Customer',
    label: 'Customer',
    icon: <IconUser />,
    color: '#2563EB',
    bg: '#EFF6FF',
    border: '#93C5FD',
    desc: 'Buys fuel / products from you',
    namePlaceholder: 'e.g. Ali Hassan, XYZ Transport',
    balanceHint: 'Amount this customer already owes you before today.',
  },
  {
    value: 'Supplier',
    label: 'Supplier',
    icon: <IconTruck />,
    color: '#D97706',
    bg: '#FFFBEB',
    border: '#FCD34D',
    desc: 'Supplies fuel / goods to you',
    namePlaceholder: 'e.g. PSO, Shell Pakistan',
    balanceHint: 'Outstanding dues already owed to this supplier.',
  },
  {
    value: 'Employee',
    label: 'Employee',
    icon: <IconBadge />,
    color: '#059669',
    bg: '#F0FDF4',
    border: '#6EE7B7',
    desc: 'Staff member / payroll tracking',
    namePlaceholder: 'e.g. Usman Ali (Attendant)',
    balanceHint: 'Advance or loan already paid to this employee.',
  },
  {
    value: 'Other',
    label: 'Other',
    icon: <IconGrid />,
    color: '#7C3AED',
    bg: '#F5F3FF',
    border: '#C4B5FD',
    desc: 'Bank, partner, or other party',
    namePlaceholder: 'e.g. HBL Bank, Partner Name',
    balanceHint: 'Existing balance for this account.',
  },
];

const balanceLabelMap = {
  Customer: 'Owes You (Rs.)',
  Supplier: 'You Owe (Rs.)',
  Employee: 'Advance Given (Rs.)',
  Other:    'Opening Bal. (Rs.)',
};

const nameLabelMap = {
  Customer: 'Customer Name',
  Supplier: 'Supplier / Company Name',
  Employee: 'Employee Name',
  Other:    'Account Name',
};

const ErrMsg = ({ msg }) => msg ? (
  <p style={{ fontSize: '10.5px', color: '#DC2626', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 500 }}>
    <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
    {msg}
  </p>
) : null;

export default function AddAccountPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', type: 'Customer', phone: '', address: '', openingBalance: '', notes: '' });
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const tc = TYPES.find(t => t.value === form.type) || TYPES[0];

  const set = (field, value) => {
    setForm(p => ({ ...p, [field]: value }));
    setErrors(p => ({ ...p, [field]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Account name is required';
    if (form.phone && !/^[0-9]{10,15}$/.test(form.phone.replace(/[-\s]/g, '')))
      errs.phone = 'Enter a valid phone (10–15 digits)';
    if (form.openingBalance && isNaN(parseFloat(form.openingBalance)))
      errs.openingBalance = 'Must be a valid number';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    await addAccount({
      name:           form.name.trim(),
      type:           form.type,
      phone:          form.phone.replace(/[-\s]/g, '').trim() || null,
      address:        form.address.trim() || null,
      openingBalance: parseFloat(form.openingBalance || 0),
      notes:          form.notes.trim() || null,
    });
    setLoading(false);
    setSuccess(true);
    setTimeout(() => router.push('/dashboard/accounts'), 1200);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* ── Header ── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11.5px', marginBottom: '4px' }}>
          <Link href="/dashboard/accounts" style={{ color: '#64748B', textDecoration: 'none', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '3px' }}>
            <IconBack /> Accounts
          </Link>
          <span style={{ color: '#CBD5E1' }}>›</span>
          <span style={{ color: '#475569', fontWeight: 500 }}>Add New Account</span>
        </div>
        <h1 className="ps-page-title">Add New Account</h1>
      </div>

      {success && (
        <div className="alert-success">
          <IconCheck /> Account created successfully! Redirecting…
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="ps-card" style={{ overflow: 'visible' }}>

          {/* ══ Section 1: Account Type ══ */}
          <div className="form-section-header">
            <p className="form-section-title">Account Type</p>
          </div>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-light)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '7px' }}>
              {TYPES.map(t => {
                const active = form.type === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => set('type', t.value)}
                    style={{
                      position: 'relative',
                      padding: '10px 11px',
                      borderRadius: '8px',
                      /* left-accent trick: use outline + left border override */
                      border: `1.5px solid ${active ? t.border : '#E2E8F0'}`,
                      borderLeftWidth: active ? '3px' : '1.5px',
                      borderLeftColor: active ? t.color : '#E2E8F0',
                      background: active ? t.bg : '#FAFBFC',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'border-color 0.15s, background 0.15s, box-shadow 0.15s',
                      boxShadow: active ? `0 2px 8px ${t.color}22` : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '9px',
                    }}
                  >
                    {/* Icon pill */}
                    <span style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '30px', height: '30px',
                      borderRadius: '7px',
                      flexShrink: 0,
                      background: active ? `${t.color}18` : '#F1F5F9',
                      color: active ? t.color : '#94A3B8',
                      transition: 'background 0.15s, color 0.15s',
                    }}>
                      {t.icon}
                    </span>
                    {/* Text */}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '12.5px', color: active ? t.color : '#334155', lineHeight: 1.2 }}>
                        {t.label}
                      </div>
                      <div style={{ fontSize: '10px', color: active ? `${t.color}BB` : '#94A3B8', lineHeight: 1.35, marginTop: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {t.desc}
                      </div>
                    </div>
                    {/* Active dot */}
                    {active && (
                      <span style={{
                        position: 'absolute', top: '7px', right: '8px',
                        width: '6px', height: '6px', borderRadius: '50%',
                        background: t.color,
                      }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ══ Section 2: Account Details ══ */}
          <div className="form-section-header">
            <p className="form-section-title">Account Details</p>
          </div>
          <div style={{ padding: '14px 14px 16px' }}>

            {/* Row 1 — Name · Phone · Balance */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.1fr 1fr', gap: '11px', marginBottom: '11px' }}>

              {/* Name */}
              <div>
                <label className="ps-label">
                  {nameLabelMap[form.type]}&nbsp;<span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  className="ps-input"
                  style={errors.name ? { borderColor: '#DC2626', background: '#FFF8F8' } : {}}
                  placeholder={tc.namePlaceholder}
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  autoFocus
                />
                <ErrMsg msg={errors.name} />
              </div>

              {/* Phone */}
              <div>
                <label className="ps-label">Phone Number</label>
                <input
                  className="ps-input"
                  style={errors.phone ? { borderColor: '#DC2626', background: '#FFF8F8' } : {}}
                  placeholder="03XX-XXXXXXX"
                  value={form.phone}
                  onChange={e => set('phone', e.target.value)}
                  inputMode="numeric"
                  maxLength={15}
                />
                {errors.phone
                  ? <ErrMsg msg={errors.phone} />
                  : <p style={{ fontSize: '10px', color: '#94A3B8', marginTop: '3px' }}>Pakistani 11-digit format</p>
                }
              </div>

              {/* Opening Balance */}
              <div>
                <label className="ps-label">{balanceLabelMap[form.type]}</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <span style={{
                    position: 'absolute', left: 0,
                    height: '100%', width: '36px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '11px', fontWeight: 700, color: '#64748B',
                    background: '#F1F5F9',
                    borderRadius: '8px 0 0 8px',
                    borderRight: '1.5px solid #E2E8F0',
                    pointerEvents: 'none',
                    flexShrink: 0,
                  }}>Rs.</span>
                  <input
                    className="ps-input"
                    style={{
                      paddingLeft: '44px',
                      ...(errors.openingBalance ? { borderColor: '#DC2626', background: '#FFF8F8' } : {}),
                    }}
                    placeholder="0.00"
                    value={form.openingBalance}
                    onChange={e => set('openingBalance', e.target.value)}
                    inputMode="decimal"
                  />
                </div>
                {errors.openingBalance
                  ? <ErrMsg msg={errors.openingBalance} />
                  : <p style={{ fontSize: '10px', color: '#94A3B8', marginTop: '3px' }}>{tc.balanceHint}</p>
                }
              </div>
            </div>

            {/* Row 2 — Address · Notes */}
            <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '11px' }}>

              {/* Address */}
              <div>
                <label className="ps-label">Address</label>
                <input
                  className="ps-input"
                  placeholder={
                    form.type === 'Supplier' ? 'e.g. PSO House, Clifton, Karachi' :
                    form.type === 'Employee' ? 'e.g. House 12, Street 5, Lahore' :
                    'Street, area, city'
                  }
                  value={form.address}
                  onChange={e => set('address', e.target.value)}
                />
              </div>

              {/* Notes */}
              <div>
                <label className="ps-label">Notes / Remarks</label>
                <input
                  className="ps-input"
                  placeholder={
                    form.type === 'Supplier' ? 'e.g. 30-day credit, PSO OMC' :
                    form.type === 'Employee' ? 'e.g. Attendant, Morning shift' :
                    'Optional notes'
                  }
                  value={form.notes}
                  onChange={e => set('notes', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* ══ Footer ══ */}
          <div style={{
            padding: '10px 14px',
            borderTop: '1px solid var(--border-light)',
            background: '#F8FAFC',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: '11px', color: '#94A3B8' }}>
              <span style={{ color: '#DC2626' }}>*</span> Required field
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Link href="/dashboard/accounts" className="btn-ghost">Cancel</Link>
              <button
                type="submit"
                disabled={loading || success}
                className="btn-primary"
                style={{ opacity: loading ? 0.75 : 1, minWidth: '126px', justifyContent: 'center' }}
              >
                {loading  ? <><span className="spinner" /> Saving…</> :
                 success  ? <><IconCheck /> Saved!</> :
                 <><IconSave /> Save {form.type}</>}
              </button>
            </div>
          </div>

        </div>
      </form>
    </div>
  );
}
