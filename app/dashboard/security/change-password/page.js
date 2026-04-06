'use client';
import { useState } from 'react';
import { getCompany, saveCompany } from '../../../../lib/store';

const IconLock = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const IconEye = () => (
  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);
const IconEyeOff = () => (
  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);
const IconCheck = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IconShield = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);
const IconSave = () => (
  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
    <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
  </svg>
);

function PasswordField({ label, placeholder, value, onChange, error }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="ps-label">{label}</label>
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
          <IconLock />
        </span>
        <input
          className="ps-input"
          type={show ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          style={{ paddingLeft: '38px', paddingRight: '42px' }}
        />
        <button
          type="button"
          onClick={() => setShow(p => !p)}
          style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', padding: '2px' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#0f1f5c'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; }}
        >
          {show ? <IconEyeOff /> : <IconEye />}
        </button>
      </div>
      {error && <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>{error}</p>}
    </div>
  );
}

export default function ChangePasswordPage() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const validate = () => {
    const errs = {};
    const company = getCompany();
    if (!form.currentPassword) errs.currentPassword = 'Enter current password';
    else if (company?.password !== form.currentPassword) errs.currentPassword = 'Current password is incorrect';
    if (!form.newPassword) errs.newPassword = 'Enter new password';
    else if (form.newPassword.length < 6) errs.newPassword = 'Minimum 6 characters';
    if (!form.confirmPassword) errs.confirmPassword = 'Confirm new password';
    else if (form.newPassword !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    const company = getCompany();
    saveCompany({ ...company, password: form.newPassword });
    setTimeout(() => {
      setLoading(false);
      setSuccess('Password changed successfully!');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setSuccess(''), 4000);
    }, 500);
  };

  const handleChange = (field) => (e) => {
    setForm(p => ({ ...p, [field]: e.target.value }));
    setErrors(p => ({ ...p, [field]: '' }));
  };

  return (
    <div style={{ maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="ps-page-header">
        <div>
          <h1 className="ps-page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <IconShield /> Change Password
          </h1>
          <p className="ps-page-subtitle">Update your account security password</p>
        </div>
      </div>

      {success && <div className="alert-success"><IconCheck /> {success}</div>}

      <div className="ps-card">
        <div className="form-section-header">
          <p className="form-section-title">Password Settings</p>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <PasswordField
            label="Current Password *"
            placeholder="••••••••"
            value={form.currentPassword}
            onChange={handleChange('currentPassword')}
            error={errors.currentPassword}
          />
          <PasswordField
            label="New Password *"
            placeholder="Minimum 6 characters"
            value={form.newPassword}
            onChange={handleChange('newPassword')}
            error={errors.newPassword}
          />
          <PasswordField
            label="Confirm New Password *"
            placeholder="••••••••"
            value={form.confirmPassword}
            onChange={handleChange('confirmPassword')}
            error={errors.confirmPassword}
          />

          {/* Security tips */}
          <div style={{ padding: '14px 16px', borderRadius: '12px', background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '8px' }}>
              <IconShield />
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#1D4ED8', margin: 0 }}>Security Tips</p>
            </div>
            <ul style={{ fontSize: '12px', color: '#1D4ED8', margin: 0, paddingLeft: '16px', lineHeight: 1.7 }}>
              <li>Use at least 8 characters for stronger security</li>
              <li>Mix uppercase, lowercase letters and numbers</li>
              <li>Never share your password with anyone</li>
            </ul>
          </div>

          <button type="submit" disabled={loading} className="btn-primary" style={{ opacity: loading ? 0.8 : 1 }}>
            {loading ? <><span className="spinner" /> Updating...</> : <><IconSave /> Change Password</>}
          </button>
        </form>
      </div>
    </div>
  );
}
