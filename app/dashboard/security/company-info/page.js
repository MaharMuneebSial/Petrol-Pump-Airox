'use client';
import { useState, useEffect } from 'react';
import { getCompany, saveCompany } from '../../../../lib/store';

const IconBuilding = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
  </svg>
);
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
const IconPhone = () => (
  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.38 2 2 0 0 1 3.58 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);
const IconMail = () => (
  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);
const IconUser = () => (
  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);
const IconFuel = () => (
  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M3 22V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"/>
    <path d="M3 11h12"/><path d="M13 6l4 4"/>
    <path d="M17 10v6a2 2 0 0 0 4 0v-4l-2-2"/>
  </svg>
);
const IconCalendar = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

export default function CompanyInfoPage() {
  const [form, setForm] = useState({ businessName: '', mobileNo: '', email: '', address: '', ntn: '', owner: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [errors, setErrors] = useState({});
  const [company, setCompany] = useState(null);

  useEffect(() => {
    const c = getCompany();
    if (c) {
      setCompany(c);
      setForm({ businessName: c.businessName || '', mobileNo: c.mobileNo || '', email: c.email || '', address: c.address || '', ntn: c.ntn || '', owner: c.owner || '' });
    }
  }, []);

  const validate = () => {
    const errs = {};
    if (!form.businessName.trim()) errs.businessName = 'Business name is required';
    if (!form.mobileNo.trim()) errs.mobileNo = 'Mobile is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    const updated = { ...company, businessName: form.businessName.trim(), mobileNo: form.mobileNo.trim(), email: form.email.trim().toLowerCase(), address: form.address.trim(), ntn: form.ntn.trim(), owner: form.owner.trim() };
    saveCompany(updated);
    setCompany(updated);
    setTimeout(() => {
      setLoading(false);
      setSuccess('Company information updated successfully!');
      setTimeout(() => setSuccess(''), 4000);
    }, 500);
  };

  const handleChange = (field) => (e) => {
    setForm(p => ({ ...p, [field]: e.target.value }));
    setErrors(p => ({ ...p, [field]: '' }));
  };

  return (
    <div style={{ maxWidth: '680px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="ps-page-header">
        <div>
          <h1 className="ps-page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <IconBuilding /> Company Information
          </h1>
          <p className="ps-page-subtitle">Update your pump station details</p>
        </div>
      </div>

      {success && <div className="alert-success"><IconCheck /> {success}</div>}

      {/* Pump code banner */}
      {company && (
        <div style={{
          borderRadius: '16px',
          padding: '20px 24px',
          background: 'linear-gradient(135deg, #0a1540, #0f1f5c)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: '0 8px 24px rgba(15,31,92,0.3)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', right: '-20px', top: '-20px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(37,99,235,0.08)', pointerEvents: 'none' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #2563EB, #1D4ED8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 4px 16px rgba(37,99,235,0.4)' }}>
              <IconFuel />
            </div>
            <div>
              <p style={{ color: '#93c5fd', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 4px' }}>Your Pump Code</p>
              <p style={{ color: 'white', fontSize: '26px', fontWeight: 800, letterSpacing: '0.2em', margin: 0 }}>{company.pumpCode}</p>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', justifyContent: 'flex-end', marginBottom: '4px' }}>
              <IconCalendar />
              <p style={{ color: '#93c5fd', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Registered</p>
            </div>
            <p style={{ color: 'white', fontSize: '13px', fontWeight: 500, margin: 0 }}>
              {company.createdAt ? new Date(company.createdAt).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>
      )}

      <div className="ps-card">
        <div className="form-section-header">
          <p className="form-section-title">Station Details</p>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Business Name */}
            <div>
              <label className="ps-label">Business Name *</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex', alignItems: 'center' }}><IconBuilding /></span>
                <input className="ps-input" placeholder="Station name" value={form.businessName} onChange={handleChange('businessName')} style={{ paddingLeft: '38px' }} />
              </div>
              {errors.businessName && <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>{errors.businessName}</p>}
            </div>

            {/* Owner */}
            <div>
              <label className="ps-label">Owner Name</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex', alignItems: 'center' }}><IconUser /></span>
                <input className="ps-input" placeholder="Owner full name" value={form.owner} onChange={handleChange('owner')} style={{ paddingLeft: '38px' }} />
              </div>
            </div>

            {/* Mobile */}
            <div>
              <label className="ps-label">Mobile Number *</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex', alignItems: 'center' }}><IconPhone /></span>
                <input className="ps-input" placeholder="03XXXXXXXXX" value={form.mobileNo} onChange={handleChange('mobileNo')} inputMode="numeric" style={{ paddingLeft: '38px' }} />
              </div>
              {errors.mobileNo && <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>{errors.mobileNo}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="ps-label">Email Address *</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex', alignItems: 'center' }}><IconMail /></span>
                <input className="ps-input" type="email" placeholder="email@example.com" value={form.email} onChange={handleChange('email')} style={{ paddingLeft: '38px' }} />
              </div>
              {errors.email && <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>{errors.email}</p>}
            </div>

            {/* NTN */}
            <div>
              <label className="ps-label">NTN Number</label>
              <input className="ps-input" placeholder="National Tax Number" value={form.ntn} onChange={handleChange('ntn')} />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="ps-label">Address</label>
            <textarea className="ps-input" placeholder="Full station address..." value={form.address} onChange={handleChange('address')} rows={3} style={{ resize: 'vertical' }} />
          </div>

          <div style={{ paddingTop: '4px' }}>
            <button type="submit" disabled={loading} className="btn-primary" style={{ opacity: loading ? 0.8 : 1 }}>
              {loading ? <><span className="spinner" /> Saving...</> : <><IconSave /> Save Changes</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
