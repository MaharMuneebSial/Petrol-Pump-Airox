'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { addAccount } from '../../../../lib/store';

const IconCheck = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
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
const IconInfo = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
);

export default function AddAccountPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', type: 'Customer', phone: '', address: '', openingBalance: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Account name is required';
    if (!form.type) errs.type = 'Type is required';
    if (form.phone && !/^[0-9]{10,15}$/.test(form.phone.trim())) errs.phone = 'Invalid phone number';
    if (form.openingBalance && isNaN(parseFloat(form.openingBalance))) errs.openingBalance = 'Must be a number';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    await addAccount({
      name: form.name.trim(),
      type: form.type,
      phone: form.phone.trim(),
      address: form.address.trim(),
      openingBalance: parseFloat(form.openingBalance || 0),
    });
    setLoading(false);
    setSuccess(true);
    setTimeout(() => router.push('/dashboard/accounts'), 1000);
  };

  const handleChange = (field) => (e) => {
    setForm(p => ({ ...p, [field]: e.target.value }));
    setErrors(p => ({ ...p, [field]: '' }));
  };

  return (
    <div style={{ maxWidth: '680px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748b' }}>
        <Link href="/dashboard/accounts" style={{ color: '#0f1f5c', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
          <IconBack /> Accounts
        </Link>
        <span style={{ color: '#cbd5e1' }}>/</span>
        <span>Add New Account</span>
      </div>

      {/* Header */}
      <div className="ps-page-header">
        <div>
          <h1 className="ps-page-title">Add New Account</h1>
          <p className="ps-page-subtitle">Create a customer, supplier, or employee account</p>
        </div>
      </div>

      {success && (
        <div className="alert-success">
          <IconCheck /> Account created successfully! Redirecting...
        </div>
      )}

      <div className="ps-card">
        <div className="form-section-header">
          <p className="form-section-title">Account Information</p>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }} className="md:grid-cols-2">
            {/* Name */}
            <div>
              <label className="ps-label">Account Name *</label>
              <input className="ps-input" placeholder="e.g. Ali Hassan" value={form.name} onChange={handleChange('name')} />
              {errors.name && <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>{errors.name}</p>}
            </div>

            {/* Type */}
            <div>
              <label className="ps-label">Account Type *</label>
              <select className="ps-input" value={form.type} onChange={handleChange('type')}>
                <option>Customer</option>
                <option>Supplier</option>
                <option>Employee</option>
                <option>Other</option>
              </select>
              {errors.type && <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>{errors.type}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="ps-label">Phone Number</label>
              <input className="ps-input" placeholder="e.g. 03001234567" value={form.phone} onChange={handleChange('phone')} inputMode="numeric" />
              {errors.phone && <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>{errors.phone}</p>}
            </div>

            {/* Opening Balance */}
            <div>
              <label className="ps-label">Opening Balance (Rs.)</label>
              <input className="ps-input" placeholder="0.00" value={form.openingBalance} onChange={handleChange('openingBalance')} inputMode="decimal" />
              {errors.openingBalance && <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>{errors.openingBalance}</p>}
              <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>Positive = receivable from them</p>
            </div>
          </div>

          {/* Address */}
          <div style={{ marginTop: '20px' }}>
            <label className="ps-label">Address</label>
            <textarea className="ps-input" placeholder="Full address..." value={form.address} onChange={handleChange('address')} rows={2} style={{ resize: 'vertical' }} />
          </div>

          {/* Info box */}
          <div className="info-box" style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '8px' }}>
              <IconInfo />
              <p className="info-box-title" style={{ margin: 0 }}>Account Type Guide</p>
            </div>
            <div className="info-box-text" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <p style={{ margin: 0 }}><strong>Customer:</strong> People who buy fuel/products from you (debtors)</p>
              <p style={{ margin: 0 }}><strong>Supplier:</strong> Companies/people you purchase from (creditors)</p>
              <p style={{ margin: 0 }}><strong>Employee:</strong> Staff members for payroll tracking</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button type="submit" disabled={loading} className="btn-primary" style={{ opacity: loading ? 0.8 : 1 }}>
              {loading ? <><span className="spinner" /> Saving...</> : <><IconSave /> Save Account</>}
            </button>
            <Link href="/dashboard/accounts" className="btn-outline">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
