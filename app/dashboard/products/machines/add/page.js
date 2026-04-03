'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { addMachine, getProducts } from '../../../../../lib/store';
import { supabase } from '../../../../../lib/supabase';
import { getCompany } from '../../../../../lib/store';

// ── Icons ──────────────────────────────────────────────────────────────────────
const IconGear = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);
const IconBack = () => (
  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
);
const IconSave = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
    <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
  </svg>
);
const IconCheck = () => (
  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IconAlert = () => (
  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);
const IconNozzle = () => (
  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M3 22V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"/>
    <path d="M3 11h12"/><path d="M13 6l4 4"/>
    <path d="M17 10v6a2 2 0 0 0 4 0v-4l-2-2"/>
  </svg>
);
const IconDroplet = () => (
  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
  </svg>
);
const IconGauge = () => (
  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 6v6l4 2"/><circle cx="18" cy="6" r="3"/>
  </svg>
);

const NOZZLE_OPTIONS = [1, 2, 3, 4, 6, 8];

export default function AddMachinePage() {
  const router = useRouter();
  const [products,  setProducts]  = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [form, setForm] = useState({ name: '', machineNo: '', nozzleCount: '2' });
  // nozzleConfig: { n: { staff_id, product_id, initial_reading } }
  const [nozzleConfig, setNozzleConfig] = useState({ 1: { staff_id: '', product_id: '', initial_reading: '' }, 2: { staff_id: '', product_id: '', initial_reading: '' } });
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const productRef = useRef(null);

  useEffect(() => {
    const company = getCompany();
    Promise.all([
      getProducts(),
      company ? supabase.from('staff').select('id, name, role').eq('company_id', company.id).eq('is_active', true) : Promise.resolve({ data: [] }),
    ]).then(([prods, sRes]) => {
      setProducts(prods || []);
      setStaffList(sRes.data || []);
    });
  }, []);

  // Reset nozzle config when nozzle count changes
  useEffect(() => {
    const n = parseInt(form.nozzleCount) || 0;
    setNozzleConfig(prev => {
      const r = {};
      for (let i = 1; i <= n; i++) r[i] = prev[i] || { staff_id: '', product_id: '', initial_reading: '' };
      return r;
    });
    setErrors(p => {
      const next = { ...p };
      for (let i = 1; i <= 8; i++) { delete next[`nozzle_${i}_reading`]; delete next[`nozzle_${i}_staff`]; delete next[`nozzle_${i}_product`]; }
      return next;
    });
  }, [form.nozzleCount]);

  const validate = () => {
    const errs = {};
    if (!form.name.trim())      errs.name      = 'Machine name is required';
    if (!form.machineNo.trim()) errs.machineNo = 'Machine number is required';
    const nc = parseInt(form.nozzleCount);
    if (!form.nozzleCount || nc < 1) errs.nozzleCount = 'Select nozzle count';
    for (let i = 1; i <= nc; i++) {
      const c = nozzleConfig[i] || {};
      if (!c.staff_id)    errs[`nozzle_${i}_staff`]   = 'Required';
      if (!c.product_id)  errs[`nozzle_${i}_product`] = 'Required';
      const v = c.initial_reading;
      if (v === '' || v === undefined) errs[`nozzle_${i}_reading`] = 'Required';
      else if (isNaN(+v) || +v < 0)   errs[`nozzle_${i}_reading`] = 'Invalid';
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    await addMachine({
      name:        form.name.trim(),
      machineNo:   form.machineNo.trim(),
      nozzleCount: parseInt(form.nozzleCount),
      nozzleConfig,
    });
    setLoading(false);
    setSuccess(true);
    setTimeout(() => router.push('/dashboard/products/machines/manage'), 1200);
  };

  const ch = (field) => (e) => {
    setForm(p => ({ ...p, [field]: e.target.value }));
    setErrors(p => ({ ...p, [field]: '' }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '34px', height: '34px', borderRadius: '9px',
            background: 'linear-gradient(135deg, #0D1B3E, #122158)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', flexShrink: 0,
          }}>
            <IconGear />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#94A3B8', marginBottom: '1px' }}>
              <Link href="/dashboard/products/machines/manage" style={{ color: '#0D1B3E', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <IconBack /> Machines
              </Link>
              <span style={{ color: '#CBD5E1' }}>/</span>
              <span>Add Pump Machine</span>
            </div>
            <h1 style={{ fontSize: '15px', fontWeight: 800, color: '#0D1B3E', margin: 0, letterSpacing: '-0.02em' }}>
              Add Pump Machine
            </h1>
          </div>
        </div>
      </div>

      {/* ── Success ── */}
      {success && (
        <div className="alert-success">
          <IconCheck /> Machine added successfully! Redirecting…
        </div>
      )}

      {/* ── No products warning ── */}
      {products.length === 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '10px 14px', borderRadius: '9px',
          background: '#EFF6FF', border: '1px solid #BFDBFE',
        }}>
          <svg width="15" height="15" fill="none" stroke="#1D4ED8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span style={{ fontSize: '12px', color: '#1D4ED8', fontWeight: 500 }}>
            No products found.{' '}
            <Link href="/dashboard/products/add" style={{ color: '#0D1B3E', fontWeight: 700 }}>
              Add a product first →
            </Link>
          </span>
        </div>
      )}

      {/* ── Form Card ── */}
      <form onSubmit={handleSubmit}>
        <div className="ps-card">

          {/* ── Card header ── */}
          <div style={{
            padding: '10px 16px',
            borderBottom: '1px solid #F1F5F9',
            background: '#FAFBFC',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <div style={{
              width: '22px', height: '22px', borderRadius: '6px',
              background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white',
            }}>
              <IconGear />
            </div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#0D1B3E', letterSpacing: '0.02em' }}>
              Machine Details
            </span>
            <span style={{ fontSize: '10.5px', color: '#CBD5E1', marginLeft: '4px' }}>— all fields required</span>
          </div>

          {/* ── Fields ── */}
          <div style={{ padding: '14px 16px' }}>

            {/* Row 1: Name + Machine No */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '10px', marginBottom: '10px' }}>

              {/* Machine Name */}
              <div>
                <label className="ps-label">
                  Machine Name <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  className="ps-input"
                  placeholder="e.g. Dispenser 1"
                  value={form.name}
                  onChange={ch('name')}
                  autoFocus
                  style={{ borderColor: errors.name ? '#FCA5A5' : undefined, background: errors.name ? '#FFF5F5' : undefined }}
                />
                {errors.name && (
                  <p style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10.5px', color: '#DC2626', marginTop: '4px' }}>
                    <IconAlert /> {errors.name}
                  </p>
                )}
              </div>

              {/* Machine Number */}
              <div>
                <label className="ps-label">
                  Machine Number <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  className="ps-input"
                  placeholder="e.g. M-001"
                  value={form.machineNo}
                  onChange={ch('machineNo')}
                  style={{ borderColor: errors.machineNo ? '#FCA5A5' : undefined, background: errors.machineNo ? '#FFF5F5' : undefined }}
                />
                {errors.machineNo && (
                  <p style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10.5px', color: '#DC2626', marginTop: '4px' }}>
                    <IconAlert /> {errors.machineNo}
                  </p>
                )}
              </div>
            </div>

            {/* Row 2: Nozzle count chips */}
            <div style={{ marginBottom: '10px' }}>
              <label className="ps-label">
                Number of Nozzles <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                {NOZZLE_OPTIONS.map(n => {
                  const isSelected = String(form.nozzleCount) === String(n);
                  return (
                    <button key={n} type="button"
                      onClick={() => { setForm(p => ({ ...p, nozzleCount: String(n) })); setErrors(p => ({ ...p, nozzleCount: '' })); }}
                      style={{
                        display: 'inline-flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        width: '46px', height: '42px', borderRadius: '8px',
                        border: `1.5px solid ${isSelected ? '#0D1B3E' : '#E2E8F0'}`,
                        background: isSelected ? '#0D1B3E' : 'white', color: isSelected ? 'white' : '#475569',
                        cursor: 'pointer', fontFamily: 'inherit',
                        boxShadow: isSelected ? '0 2px 8px rgba(13,27,62,0.2)' : 'none', transition: 'all 0.15s', gap: '2px',
                      }}
                      onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.borderColor = '#0D1B3E'; e.currentTarget.style.color = '#0D1B3E'; } }}
                      onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.color = '#475569'; } }}
                    >
                      <span style={{ fontSize: '13px', fontWeight: 800, lineHeight: 1 }}>{n}</span>
                      <span style={{ fontSize: '8.5px', fontWeight: 600, opacity: 0.7, lineHeight: 1 }}>{n === 1 ? 'nozzle' : 'nozzles'}</span>
                    </button>
                  );
                })}
              </div>
              {errors.nozzleCount && <p style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10.5px', color: '#DC2626', marginTop: '4px' }}><IconAlert /> {errors.nozzleCount}</p>}
            </div>

            {/* Nozzle Configuration */}
            {parseInt(form.nozzleCount) > 0 && (
              <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px dashed #E2E8F0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                  <IconGauge />
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Nozzle Configuration
                  </span>
                  <span style={{ fontSize: '10.5px', color: '#94A3B8' }}>— staff, product & initial reading per nozzle</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {Array.from({ length: parseInt(form.nozzleCount) }, (_, i) => i + 1).map(n => {
                    const c = nozzleConfig[n] || {};
                    const hasErr = errors[`nozzle_${n}_staff`] || errors[`nozzle_${n}_product`] || errors[`nozzle_${n}_reading`];
                    return (
                      <div key={n} style={{ background: '#F8FAFC', border: `1.5px solid ${hasErr ? '#FCA5A5' : '#E2E8F0'}`, borderRadius: '10px', padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '10px' }}>
                          <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: 'linear-gradient(135deg, #2563EB, #1D4ED8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '11px', flexShrink: 0 }}>{n}</div>
                          <span style={{ fontWeight: 700, fontSize: '12.5px', color: '#0F172A' }}>Nozzle {n}</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                          {/* Staff */}
                          <div>
                            <label className="ps-label">Default Staff <span style={{ color: '#DC2626' }}>*</span></label>
                            <select value={c.staff_id || ''} onChange={e => { setNozzleConfig(p => ({ ...p, [n]: { ...p[n], staff_id: e.target.value } })); setErrors(p => ({ ...p, [`nozzle_${n}_staff`]: '' })); }}
                              className="ps-input" style={{ cursor: 'pointer', color: c.staff_id ? '#1E293B' : '#94A3B8', borderColor: errors[`nozzle_${n}_staff`] ? '#FCA5A5' : undefined }}>
                              <option value="">Select staff…</option>
                              {staffList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                            {errors[`nozzle_${n}_staff`] && <p style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10.5px', color: '#DC2626', marginTop: '4px' }}><IconAlert /> {errors[`nozzle_${n}_staff`]}</p>}
                          </div>
                          {/* Product */}
                          <div>
                            <label className="ps-label">Product <span style={{ color: '#DC2626' }}>*</span></label>
                            <select value={c.product_id || ''} onChange={e => { setNozzleConfig(p => ({ ...p, [n]: { ...p[n], product_id: e.target.value } })); setErrors(p => ({ ...p, [`nozzle_${n}_product`]: '' })); }}
                              className="ps-input" style={{ cursor: 'pointer', color: c.product_id ? '#1E293B' : '#94A3B8', borderColor: errors[`nozzle_${n}_product`] ? '#FCA5A5' : undefined }}>
                              <option value="">Select product…</option>
                              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                            {errors[`nozzle_${n}_product`] && <p style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10.5px', color: '#DC2626', marginTop: '4px' }}><IconAlert /> {errors[`nozzle_${n}_product`]}</p>}
                          </div>
                          {/* Initial reading */}
                          <div>
                            <label className="ps-label">Initial Reading <span style={{ color: '#DC2626' }}>*</span></label>
                            <input type="number" step="0.01" min="0" placeholder="0.00"
                              value={c.initial_reading ?? ''}
                              onChange={e => { setNozzleConfig(p => ({ ...p, [n]: { ...p[n], initial_reading: e.target.value } })); setErrors(p => ({ ...p, [`nozzle_${n}_reading`]: '' })); }}
                              className="ps-input"
                              style={{ textAlign: 'right', fontWeight: 700, borderColor: errors[`nozzle_${n}_reading`] ? '#FCA5A5' : undefined, background: errors[`nozzle_${n}_reading`] ? '#FFF5F5' : undefined }}
                            />
                            {errors[`nozzle_${n}_reading`] && <p style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10.5px', color: '#DC2626', marginTop: '4px' }}><IconAlert /> {errors[`nozzle_${n}_reading`]}</p>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ── Action Bar ── */}
          <div style={{
            padding: '11px 16px',
            borderTop: '1px solid #F1F5F9',
            background: '#FAFBFC',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: '11px', color: '#CBD5E1' }}>
              <span style={{ color: '#DC2626' }}>*</span> All fields required
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Link
                href="/dashboard/products/machines/manage"
                style={{
                  padding: '7px 16px', borderRadius: '8px',
                  fontSize: '12px', fontWeight: 600,
                  color: '#64748B', textDecoration: 'none',
                  background: 'white', border: '1.5px solid #E2E8F0',
                  display: 'inline-flex', alignItems: 'center',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFC'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'white'; }}
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading || success}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '7px',
                  padding: '7px 20px',
                  background: success ? '#059669' : '#0D1B3E',
                  color: 'white', border: 'none', borderRadius: '8px',
                  fontWeight: 700, fontSize: '12.5px',
                  cursor: loading || success ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  boxShadow: '0 2px 8px rgba(13,27,62,0.18)',
                  opacity: loading ? 0.8 : 1,
                }}
                onMouseEnter={e => { if (!loading && !success) e.currentTarget.style.background = '#122158'; }}
                onMouseLeave={e => { if (!loading && !success) e.currentTarget.style.background = success ? '#059669' : '#0D1B3E'; }}
              >
                {loading  ? <><span className="spinner" /> Saving…</>
                : success ? <><IconCheck /> Saved!</>
                :           <><IconSave /> Save Machine</>}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
