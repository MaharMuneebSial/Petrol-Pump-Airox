'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { addProduct } from '../../../../lib/store';

const fmt = (n) => new Intl.NumberFormat('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);

// ── Fuel SVG icons (14×14, stroke-based) ──────────────────────────────────────
const IcoPetrol = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M3 22V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"/>
    <path d="M3 11h12"/><path d="M13 6l4 4"/>
    <path d="M17 10v6a2 2 0 0 0 4 0v-4l-2-2"/>
  </svg>
);
const IcoDiesel = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M12 2C6.5 2 2 4.5 2 7v10c0 2.5 4.5 5 10 5s10-2.5 10-5V7c0-2.5-4.5-5-10-5z"/>
    <path d="M2 7c0 2.5 4.5 5 10 5s10-2.5 10-5"/>
    <path d="M2 12c0 2.5 4.5 5 10 5s10-2.5 10-5"/>
  </svg>
);
const IcoLPG = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <rect x="7" y="3" width="10" height="14" rx="5"/>
    <path d="M9 17v2a3 3 0 0 0 6 0v-2"/>
    <line x1="12" y1="3" x2="12" y2="1"/>
    <line x1="9" y1="8" x2="15" y2="8"/>
  </svg>
);
const IcoCNG = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <ellipse cx="12" cy="12" rx="9" ry="6"/>
    <line x1="3" y1="12" x2="21" y2="12"/>
    <path d="M12 6c2 1.5 3 3 3 6s-1 4.5-3 6"/>
    <path d="M12 6c-2 1.5-3 3-3 6s1 4.5 3 6"/>
  </svg>
);
const IcoSuperPetrol = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);
const IcoLightDiesel = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
  </svg>
);
const IcoKerosene = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
  </svg>
);
const IcoHiOctane = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);

// ── Unit options ──────────────────────────────────────────────────────────────
const UNIT_OPTIONS = [
  { value: 'Ltr',          label: 'Ltr',  desc: 'Litre' },
  { value: 'Kg',           label: 'Kg',   desc: 'Kilogram' },
  { value: 'Cubic Meter',  label: 'Cu.M', desc: 'Cubic Meter' },
  { value: 'Unit',         label: 'Unit', desc: 'Unit' },
];

// ── Quick-select fuel catalogue ────────────────────────────────────────────────
const FUELS = [
  { name: 'Petrol',          unit: 'Ltr', color: '#059669', bg: '#F0FDF4', border: '#BBF7D0', Icon: IcoPetrol },
  { name: 'Hi Speed Diesel', unit: 'Ltr', color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', Icon: IcoDiesel },
  { name: 'LPG',             unit: 'Kg',  color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', Icon: IcoLPG },
  { name: 'CNG',             unit: 'Kg',  color: '#0891B2', bg: '#ECFEFF', border: '#A5F3FC', Icon: IcoCNG },
  { name: 'Super Petrol',    unit: 'Ltr', color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE', Icon: IcoSuperPetrol },
  { name: 'Light Diesel Oil',unit: 'Ltr', color: '#0D1B3E', bg: '#EEF2FF', border: '#C7D2FE', Icon: IcoLightDiesel },
  { name: 'Kerosene Oil',    unit: 'Ltr', color: '#B45309', bg: '#FEF3C7', border: '#FDE68A', Icon: IcoKerosene },
  { name: 'Hi Octane Petrol',unit: 'Ltr', color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', Icon: IcoHiOctane },
];

// ── Icons ──────────────────────────────────────────────────────────────────────
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
  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IconZap = () => (
  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);
const IconTag = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
    <line x1="7" y1="7" x2="7.01" y2="7"/>
  </svg>
);
const IconBox = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
    <line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
);
const IconAlert = () => (
  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

export default function AddProductPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', unit: 'Ltr', stock: '', rate: '', hsnCode: '' });
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Unit combobox
  const [unitSearch, setUnitSearch]         = useState('');
  const [showUnitDrop, setShowUnitDrop]     = useState(false);
  const unitRef = useRef(null);
  useEffect(() => {
    const handler = (e) => {
      if (unitRef.current && !unitRef.current.contains(e.target)) setShowUnitDrop(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  const unitLabel   = UNIT_OPTIONS.find(o => o.value === form.unit)?.label ?? form.unit;
  const filteredUnits = UNIT_OPTIONS.filter(o =>
    o.label.toLowerCase().includes(unitSearch.toLowerCase()) ||
    o.desc.toLowerCase().includes(unitSearch.toLowerCase())
  );

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Product name is required';
    if (!form.unit.trim()) errs.unit = 'Unit is required';
    if (form.stock && isNaN(parseFloat(form.stock))) errs.stock = 'Must be a valid number';
    if (form.rate  && isNaN(parseFloat(form.rate)))  errs.rate  = 'Must be a valid number';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    await addProduct({
      name:    form.name.trim(),
      unit:    form.unit.trim(),
      stock:   parseFloat(form.stock || 0),
      rate:    parseFloat(form.rate  || 0),
      hsnCode: form.hsnCode.trim(),
    });
    setLoading(false);
    setSuccess(true);
    setTimeout(() => router.push('/dashboard/products/manage'), 1200);
  };

  const handleChange = (field) => (e) => {
    setForm(p => ({ ...p, [field]: e.target.value }));
    setErrors(p => ({ ...p, [field]: '' }));
  };

  const selectFuel = (fuel) => {
    setForm(p => ({ ...p, name: fuel.name, unit: fuel.unit }));
    setErrors({});
  };

  const stockValue = parseFloat(form.stock || 0) * parseFloat(form.rate || 0);
  const selectedFuel = FUELS.find(f => f.name === form.name);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* ── Breadcrumb + Header (one line) ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '34px', height: '34px', borderRadius: '9px',
            background: 'linear-gradient(135deg, #0D1B3E, #122158)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', flexShrink: 0,
          }}>
            <IconBox />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: '#94A3B8', marginBottom: '1px' }}>
              <Link href="/dashboard/products/manage" style={{ color: '#0D1B3E', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <IconBack /> Products
              </Link>
              <span style={{ color: '#CBD5E1' }}>/</span>
              <span>Add New Product</span>
            </div>
            <h1 style={{ fontSize: '15px', fontWeight: 800, color: '#0D1B3E', margin: 0, letterSpacing: '-0.02em' }}>
              Add New Product
            </h1>
          </div>
        </div>
      </div>

      {/* ── Success Alert ── */}
      {success && (
        <div className="alert-success" style={{ padding: '9px 14px' }}>
          <IconCheck /> Product added successfully! Redirecting…
        </div>
      )}

      {/* ── Single Card: Quick Select + Form ── */}
      <form onSubmit={handleSubmit}>
        <div className="ps-card">

          {/* ── Row 1: Quick Select label + all chips ── */}
          <div style={{
            padding: '10px 16px',
            borderBottom: '1px solid #F1F5F9',
            background: '#FAFBFC',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            overflow: 'hidden',
          }}>
            {/* Label */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
              <div style={{
                width: '22px', height: '22px', borderRadius: '6px',
                background: 'linear-gradient(135deg, #F0A500, #D4920A)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white',
              }}>
                <IconZap />
              </div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#0D1B3E' }}>Quick Select</span>
            </div>

            {/* Divider */}
            <div style={{ width: '1px', height: '16px', background: '#E2E8F0', flexShrink: 0 }} />

            {/* All 8 chips — justify-content: space-between so they fill the row evenly */}
            <div style={{
              display: 'flex',
              flex: 1,
              gap: '6px',
              justifyContent: 'space-between',
            }}>
              {FUELS.map(fuel => {
                const isSelected = form.name === fuel.name;
                return (
                  <button
                    key={fuel.name}
                    type="button"
                    onClick={() => selectFuel(fuel)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                      flex: 1,
                      padding: '5px 8px',
                      borderRadius: '7px',
                      fontSize: '11px', fontWeight: 600,
                      cursor: 'pointer', fontFamily: 'inherit',
                      whiteSpace: 'nowrap',
                      border: `1.5px solid ${isSelected ? fuel.color : fuel.border}`,
                      background: isSelected ? fuel.color : fuel.bg,
                      color: isSelected ? 'white' : fuel.color,
                      boxShadow: isSelected ? `0 2px 8px ${fuel.color}35` : 'none',
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) {
                        e.currentTarget.style.background = fuel.color;
                        e.currentTarget.style.color = 'white';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) {
                        e.currentTarget.style.background = fuel.bg;
                        e.currentTarget.style.color = fuel.color;
                      }
                    }}
                  >
                    <fuel.Icon />
                    {fuel.name}
                    {isSelected && <IconCheck />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── All 5 Fields + Actions in one compact section ── */}
          <div style={{ padding: '14px 16px' }}>

            {/* Field labels row */}
            <div style={{ display: 'grid', gridTemplateColumns: '2.2fr 0.9fr 1fr 1fr 0.9fr', gap: '10px', marginBottom: '6px' }}>
              {[
                { label: 'Product Name', req: true },
                { label: 'Unit', req: true },
                { label: `Stock (${form.unit})`, req: false },
                { label: `Rate (Rs./${form.unit})`, req: false },
                { label: 'HSN Code', req: false, opt: true },
              ].map(({ label, req, opt }) => (
                <label key={label} className="ps-label" style={{ margin: 0 }}>
                  {label}
                  {req && <span style={{ color: '#DC2626', marginLeft: '2px' }}>*</span>}
                  {opt && <span style={{ color: '#94A3B8', fontWeight: 400, fontSize: '10px', marginLeft: '4px' }}>(opt)</span>}
                </label>
              ))}
            </div>

            {/* Fields row */}
            <div style={{ display: 'grid', gridTemplateColumns: '2.2fr 0.9fr 1fr 1fr 0.9fr', gap: '10px', alignItems: 'start' }}>

              {/* Product Name */}
              <div>
                <input
                  className="ps-input"
                  placeholder="e.g. Petrol, Hi Speed Diesel…"
                  value={form.name}
                  onChange={handleChange('name')}
                  autoFocus
                  style={{
                    borderColor: errors.name ? '#FCA5A5' : undefined,
                    background: errors.name ? '#FFF5F5' : undefined,
                  }}
                />
                {errors.name && (
                  <p style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10.5px', color: '#DC2626', marginTop: '4px' }}>
                    <IconAlert /> {errors.name}
                  </p>
                )}
              </div>

              {/* Unit — searchable combobox */}
              <div ref={unitRef} style={{ position: 'relative' }}>
                <div style={{ position: 'relative' }}>
                  <input
                    className="ps-input"
                    value={showUnitDrop ? unitSearch : unitLabel}
                    placeholder="Search unit…"
                    onFocus={() => { setShowUnitDrop(true); setUnitSearch(''); }}
                    onChange={e => setUnitSearch(e.target.value)}
                    style={{ paddingRight: '28px', cursor: 'pointer' }}
                    readOnly={!showUnitDrop}
                  />
                  <svg
                    width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    style={{
                      position: 'absolute', right: '10px', top: '50%',
                      transform: `translateY(-50%) rotate(${showUnitDrop ? '180deg' : '0deg'})`,
                      pointerEvents: 'none', transition: 'transform 0.2s ease',
                      flexShrink: 0,
                    }}
                  >
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </div>
                {showUnitDrop && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                    background: 'white', border: '1.5px solid #E2E8F0',
                    borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                    zIndex: 50, overflow: 'hidden',
                  }}>
                    {filteredUnits.length === 0 ? (
                      <div style={{ padding: '10px 12px', fontSize: '12px', color: '#94A3B8' }}>No match</div>
                    ) : filteredUnits.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onMouseDown={() => {
                          setForm(p => ({ ...p, unit: opt.value }));
                          setShowUnitDrop(false);
                          setUnitSearch('');
                          setErrors(p => ({ ...p, unit: '' }));
                        }}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          width: '100%', padding: '9px 12px',
                          background: form.unit === opt.value ? '#EEF2FF' : 'transparent',
                          border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                          borderBottom: '1px solid #F1F5F9',
                        }}
                        onMouseEnter={e => { if (form.unit !== opt.value) e.currentTarget.style.background = '#F8FAFC'; }}
                        onMouseLeave={e => { if (form.unit !== opt.value) e.currentTarget.style.background = 'transparent'; }}
                      >
                        <span style={{ fontSize: '12.5px', fontWeight: 600, color: form.unit === opt.value ? '#4338CA' : '#1E293B' }}>{opt.label}</span>
                        <span style={{ fontSize: '10.5px', color: '#94A3B8' }}>{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Stock */}
              <div>
                <div style={{ position: 'relative' }}>
                  <input
                    className="ps-input"
                    placeholder="0.00"
                    value={form.stock}
                    onChange={handleChange('stock')}
                    inputMode="decimal"
                    style={{
                      paddingRight: '36px',
                      borderColor: errors.stock ? '#FCA5A5' : undefined,
                      background: errors.stock ? '#FFF5F5' : undefined,
                    }}
                  />
                  <span style={{
                    position: 'absolute', right: '9px', top: '50%', transform: 'translateY(-50%)',
                    fontSize: '10px', color: '#CBD5E1', fontWeight: 700, pointerEvents: 'none',
                  }}>{form.unit}</span>
                </div>
                {errors.stock && (
                  <p style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10.5px', color: '#DC2626', marginTop: '4px' }}>
                    <IconAlert /> {errors.stock}
                  </p>
                )}
              </div>

              {/* Rate */}
              <div>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)',
                    fontSize: '11px', color: '#CBD5E1', fontWeight: 700, pointerEvents: 'none',
                  }}>Rs.</span>
                  <input
                    className="ps-input"
                    placeholder="0.00"
                    value={form.rate}
                    onChange={handleChange('rate')}
                    inputMode="decimal"
                    style={{
                      paddingLeft: '32px',
                      borderColor: errors.rate ? '#FCA5A5' : undefined,
                      background: errors.rate ? '#FFF5F5' : undefined,
                    }}
                  />
                </div>
                {errors.rate && (
                  <p style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10.5px', color: '#DC2626', marginTop: '4px' }}>
                    <IconAlert /> {errors.rate}
                  </p>
                )}
              </div>

              {/* HSN */}
              <div>
                <input
                  className="ps-input"
                  placeholder="e.g. 2710"
                  value={form.hsnCode}
                  onChange={handleChange('hsnCode')}
                />
              </div>
            </div>

            {/* Stock value inline hint */}
            {stockValue > 0 && (
              <div style={{
                marginTop: '10px',
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '6px 12px',
                borderRadius: '7px',
                background: '#EEF2FF',
                border: '1px solid #C7D2FE',
              }}>
                <span style={{ fontSize: '10.5px', fontWeight: 600, color: '#4338CA' }}>Stock Value:</span>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#0D1B3E' }}>Rs. {fmt(stockValue)}</span>
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
              <span style={{ color: '#DC2626' }}>*</span> Required
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Link
                href="/dashboard/products/manage"
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
              >
                {loading  ? <><span className="spinner" /> Saving…</>
                : success ? <><IconCheck /> Saved!</>
                :           <><IconSave /> Save Product</>}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
