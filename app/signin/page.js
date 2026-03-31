'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { setSession, isAuthenticated } from '../../lib/store';

const IconFuel = () => (
  <svg width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M3 22V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"/>
    <path d="M3 11h12"/>
    <path d="M13 6l4 4"/>
    <path d="M17 10v6a2 2 0 0 0 4 0v-4l-2-2"/>
  </svg>
);
const IconHash = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/>
    <line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/>
  </svg>
);
const IconUser = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);
const IconLock = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const IconEye = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);
const IconEyeOff = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);
const IconAlert = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);
const IconArrow = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
  </svg>
);

export default function SignInPage() {
  const router = useRouter();
  const [form, setForm] = useState({ pumpCode: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) router.replace('/dashboard');
  }, []);

  const validate = () => {
    const errs = {};
    if (!form.pumpCode.trim()) errs.pumpCode = 'Pump code is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    if (!form.password) errs.password = 'Password is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);

    try {
      const { data: company, error } = await supabase
        .from('companies')
        .select('*')
        .eq('pump_code', form.pumpCode.trim().toUpperCase())
        .single();

      if (error || !company) {
        setAuthError('No company found with this Pump Code.');
        setLoading(false);
        return;
      }

      const emailMatch = company.email === form.email.trim().toLowerCase();
      const passMatch = company.password === form.password;

      if (!emailMatch || !passMatch) {
        setAuthError('Invalid Email or Password.');
        setLoading(false);
        return;
      }

      setSession(company.pump_code);
      localStorage.setItem('ps_company', JSON.stringify({
        id: company.id,
        pumpCode: company.pump_code,
        businessName: company.business_name,
        mobileNo: company.mobile_no,
        email: company.email,
        ownerName: company.owner_name,
        address: company.address,
      }));

      router.push('/dashboard');
    } catch (err) {
      setAuthError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field) => (e) => {
    setForm(p => ({ ...p, [field]: e.target.value }));
    setErrors(p => ({ ...p, [field]: '' }));
    setAuthError('');
  };

  return (
    <div className="auth-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 16px' }}>
      {/* Floating background shapes */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {[
          { x: '5%',  y: '18%', s: 100, r: 15,  delay: 0 },
          { x: '88%', y: '8%',  s: 70,  r: -20, delay: 1 },
          { x: '2%',  y: '62%', s: 80,  r: 25,  delay: 2 },
          { x: '82%', y: '58%', s: 120, r: -30, delay: 0.5 },
          { x: '45%', y: '86%', s: 60,  r: 5,   delay: 1.5 },
          { x: '62%', y: '2%',  s: 85,  r: -8,  delay: 2.5 },
          { x: '30%', y: '40%', s: 50,  r: 12,  delay: 3 },
        ].map((d, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: d.x, top: d.y,
              width: d.s, height: d.s * 1.45,
              background: `rgba(245,158,11,${0.04 + (i % 3) * 0.02})`,
              borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
              transform: `rotate(${d.r}deg)`,
              animation: `float ${4 + i * 0.7}s ease-in-out ${d.delay}s infinite`,
              '--r': `${d.r}deg`,
            }}
          />
        ))}
        {/* Radial glow */}
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '600px', height: '600px',
          background: 'radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
      </div>

      <div style={{ position: 'relative', width: '100%', maxWidth: '400px', animation: 'fadeIn 0.5s ease' }}>
        {/* Top logo section */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '72px', height: '72px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            marginBottom: '16px',
            boxShadow: '0 8px 32px rgba(245,158,11,0.4)',
            color: 'white',
            animation: 'pulse-ring 2.5s ease-in-out infinite',
          }}>
            <IconFuel />
          </div>
          <h1 style={{ color: '#f59e0b', fontWeight: 800, fontSize: '26px', letterSpacing: '0.06em', margin: 0 }}>
            PETROL PUMP
          </h1>
          <p style={{ color: '#93c5fd', fontSize: '13px', marginTop: '6px', fontWeight: 400 }}>
            Station Management Software
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'white',
          borderRadius: '20px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.1)',
          overflow: 'hidden',
        }}>
          {/* Card header */}
          <div style={{
            background: 'linear-gradient(135deg, #0a1540, #0f1f5c)',
            padding: '20px 28px 18px',
            borderBottom: '3px solid #f59e0b',
          }}>
            <h2 style={{ color: 'white', fontWeight: 700, fontSize: '18px', margin: 0, textAlign: 'center' }}>
              Welcome Back
            </h2>
            <p style={{ color: '#93c5fd', fontSize: '12px', margin: '5px 0 0', textAlign: 'center' }}>
              Sign in to manage your petrol station
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: '24px 28px 28px' }}>
            {/* Auth error */}
            {authError && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '12px 14px',
                background: 'linear-gradient(135deg, #fee2e2, #fecaca)',
                border: '1px solid #fca5a5',
                borderRadius: '10px',
                marginBottom: '18px',
                color: '#b91c1c',
                fontSize: '13px', fontWeight: 500,
                animation: 'fadeIn 0.25s ease',
              }}>
                <IconAlert />
                <span>{authError}</span>
              </div>
            )}

            {/* Pump Code */}
            <div style={{ marginBottom: '16px' }}>
              <label className="ps-label">Pump Code</label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                  color: '#94a3b8', display: 'flex', alignItems: 'center',
                }}>
                  <IconHash />
                </span>
                <input
                  className="ps-input"
                  placeholder="e.g. PS100001"
                  value={form.pumpCode}
                  onChange={handleChange('pumpCode')}
                  style={{ textTransform: 'uppercase', paddingLeft: '38px' }}
                />
              </div>
              {errors.pumpCode && (
                <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <IconAlert /> {errors.pumpCode}
                </p>
              )}
            </div>

            {/* Email */}
            <div style={{ marginBottom: '16px' }}>
              <label className="ps-label">Email</label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                  color: '#94a3b8', display: 'flex', alignItems: 'center',
                }}>
                  <IconUser />
                </span>
                <input
                  className="ps-input"
                  type="email"
                  placeholder="you@email.com"
                  value={form.email}
                  onChange={handleChange('email')}
                  style={{ paddingLeft: '38px' }}
                />
              </div>
              {errors.email && (
                <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <IconAlert /> {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div style={{ marginBottom: '22px' }}>
              <label className="ps-label">Password</label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                  color: '#94a3b8', display: 'flex', alignItems: 'center',
                }}>
                  <IconLock />
                </span>
                <input
                  className="ps-input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange('password')}
                  style={{ paddingLeft: '38px', paddingRight: '42px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#94a3b8', display: 'flex', alignItems: 'center', padding: '2px',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#0f1f5c'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; }}
                >
                  {showPassword ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
              {errors.password && (
                <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <IconAlert /> {errors.password}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '13px 24px',
                background: loading
                  ? 'linear-gradient(135deg, #f59e0b80, #d9770680)'
                  : 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '15px',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 6px 20px rgba(245,158,11,0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                transition: 'all 0.2s',
                fontFamily: 'inherit',
                letterSpacing: '0.02em',
              }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(245,158,11,0.55)'; }}}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(245,158,11,0.45)'; }}
            >
              {loading ? (
                <><span className="spinner" /> Signing In...</>
              ) : (
                <>Sign Me In <IconArrow /></>
              )}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '18px' }}>
          Contact your administrator if you forgot your credentials
        </p>
      </div>
    </div>
  );
}
