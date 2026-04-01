'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { addMachine, getProducts } from '../../../../../lib/store';

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

const NOZZLE_OPTIONS = [1, 2, 3, 4, 6, 8];

export default function AddMachinePage() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ name: '', machineNo: '', productId: '', nozzleCount: '2' });
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Product combobox
  const [productSearch, setProductSearch]     = useState('');
  const [showProductDrop, setShowProductDrop] = useState(false);
  const productRef = useRef(null);
  useEffect(() => {
    const h = (e) => { if (productRef.current && !productRef.current.contains(e.target)) setShowProductDrop(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => { getProducts().then(setProducts); }, []);

  const validate = () => {
    const errs = {};
    if (!form.name.trim())    errs.name       = 'Machine name is required';
    if (!form.machineNo.trim()) errs.machineNo = 'Machine number is required';
    if (!form.productId)      errs.productId  = 'Select a product';
    if (!form.nozzleCount || parseInt(form.nozzleCount) < 1) errs.nozzleCount = 'Select nozzle count';
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
      productId:   form.productId,
      nozzleCount: parseInt(form.nozzleCount),
    });
    setLoading(false);
    setSuccess(true);
    setTimeout(() => router.push('/dashboard/products/machines/manage'), 1200);
  };

  const ch = (field) => (e) => {
    setForm(p => ({ ...p, [field]: e.target.value }));
    setErrors(p => ({ ...p, [field]: '' }));
  };

  const selectedProduct = products.find(p => String(p.id) === String(form.productId));

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
          background: '#FFFBEB', border: '1px solid #FDE68A',
        }}>
          <svg width="15" height="15" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span style={{ fontSize: '12px', color: '#92400E', fontWeight: 500 }}>
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
              background: 'linear-gradient(135deg, #F0A500, #D4920A)',
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

            {/* Row 2: Product + Nozzle chips */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '10px', marginBottom: '10px' }}>

              {/* Product / Fuel Type — searchable combobox */}
              <div>
                <label className="ps-label">
                  Product / Fuel Type <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <div ref={productRef} style={{ position: 'relative' }}>
                  <div style={{ position: 'relative' }}>
                    {/* Left icon */}
                    <span style={{
                      position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)',
                      color: selectedProduct ? '#059669' : '#CBD5E1',
                      display: 'flex', alignItems: 'center', pointerEvents: 'none',
                    }}>
                      <IconDroplet />
                    </span>
                    <input
                      className="ps-input"
                      placeholder="Search or select a fuel product…"
                      value={showProductDrop ? productSearch : (selectedProduct ? selectedProduct.name : '')}
                      onFocus={() => { setShowProductDrop(true); setProductSearch(''); }}
                      onChange={e => setProductSearch(e.target.value)}
                      style={{
                        paddingLeft: '30px',
                        paddingRight: '30px',
                        borderColor: errors.productId ? '#FCA5A5' : selectedProduct ? '#BBF7D0' : undefined,
                        background: errors.productId ? '#FFF5F5' : selectedProduct && !showProductDrop ? '#F0FDF4' : undefined,
                        cursor: 'pointer',
                      }}
                      readOnly={!showProductDrop}
                    />
                    {/* Right chevron */}
                    <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
                      style={{
                        position: 'absolute', right: '10px', top: '50%',
                        transform: `translateY(-50%) rotate(${showProductDrop ? '180deg' : '0deg'})`,
                        pointerEvents: 'none', transition: 'transform 0.2s ease',
                      }}
                    >
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </div>

                  {/* Dropdown */}
                  {showProductDrop && (
                    <div style={{
                      position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                      background: 'white', border: '1.5px solid #E2E8F0',
                      borderRadius: '10px', boxShadow: '0 10px 28px rgba(0,0,0,0.1)',
                      zIndex: 50, overflow: 'hidden', maxHeight: '220px', overflowY: 'auto',
                    }}>
                      {products.length === 0 ? (
                        <div style={{ padding: '14px 14px', fontSize: '12px', color: '#94A3B8', textAlign: 'center' }}>
                          No products found.{' '}
                          <Link href="/dashboard/products/add" style={{ color: '#0D1B3E', fontWeight: 700 }}>Add one →</Link>
                        </div>
                      ) : (
                        (() => {
                          const filtered = products.filter(p =>
                            p.name.toLowerCase().includes(productSearch.toLowerCase())
                          );
                          return filtered.length === 0 ? (
                            <div style={{ padding: '12px 14px', fontSize: '12px', color: '#94A3B8' }}>
                              No match for "{productSearch}"
                            </div>
                          ) : filtered.map(p => {
                            const isSelected = String(form.productId) === String(p.id);
                            return (
                              <button
                                key={p.id}
                                type="button"
                                onMouseDown={() => {
                                  setForm(prev => ({ ...prev, productId: String(p.id) }));
                                  setErrors(prev => ({ ...prev, productId: '' }));
                                  setShowProductDrop(false);
                                  setProductSearch('');
                                }}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: '10px',
                                  width: '100%', padding: '10px 14px',
                                  background: isSelected ? '#F0FDF4' : 'transparent',
                                  border: 'none', borderBottom: '1px solid #F8FAFC',
                                  cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                                }}
                                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#F8FAFC'; }}
                                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                              >
                                {/* Fuel color dot */}
                                <span style={{
                                  width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                                  background: isSelected ? '#059669' : '#CBD5E1',
                                }} />
                                <span style={{
                                  flex: 1,
                                  fontSize: '12.5px', fontWeight: isSelected ? 700 : 500,
                                  color: isSelected ? '#059669' : '#1E293B',
                                }}>
                                  {p.name}
                                </span>
                                {p.unit && (
                                  <span style={{
                                    fontSize: '10px', fontWeight: 600, color: '#94A3B8',
                                    background: '#F1F5F9', padding: '2px 7px', borderRadius: '4px',
                                  }}>
                                    {p.unit === 'Cubic Meter' ? 'Cu.M' : p.unit}
                                  </span>
                                )}
                                {isSelected && (
                                  <span style={{ color: '#059669', display: 'flex', alignItems: 'center' }}>
                                    <IconCheck />
                                  </span>
                                )}
                              </button>
                            );
                          });
                        })()
                      )}
                    </div>
                  )}
                </div>

                {errors.productId && (
                  <p style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10.5px', color: '#DC2626', marginTop: '4px' }}>
                    <IconAlert /> {errors.productId}
                  </p>
                )}
                {selectedProduct && !showProductDrop && (
                  <p style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10.5px', color: '#059669', marginTop: '4px', fontWeight: 600 }}>
                    <IconCheck /> {selectedProduct.name} selected
                  </p>
                )}
              </div>

              {/* Nozzle Count — chip picker */}
              <div>
                <label className="ps-label">
                  Number of Nozzles <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                  {NOZZLE_OPTIONS.map(n => {
                    const isSelected = String(form.nozzleCount) === String(n);
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => { setForm(p => ({ ...p, nozzleCount: String(n) })); setErrors(p => ({ ...p, nozzleCount: '' })); }}
                        style={{
                          display: 'inline-flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                          width: '46px', height: '42px', borderRadius: '8px',
                          border: `1.5px solid ${isSelected ? '#0D1B3E' : '#E2E8F0'}`,
                          background: isSelected ? '#0D1B3E' : 'white',
                          color: isSelected ? 'white' : '#475569',
                          cursor: 'pointer', fontFamily: 'inherit',
                          boxShadow: isSelected ? '0 2px 8px rgba(13,27,62,0.2)' : 'none',
                          transition: 'all 0.15s',
                          gap: '2px',
                        }}
                        onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.borderColor = '#0D1B3E'; e.currentTarget.style.color = '#0D1B3E'; } }}
                        onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.color = '#475569'; } }}
                      >
                        <span style={{ fontSize: '13px', fontWeight: 800, lineHeight: 1 }}>{n}</span>
                        <span style={{ fontSize: '8.5px', fontWeight: 600, opacity: 0.7, lineHeight: 1 }}>
                          {n === 1 ? 'nozzle' : 'nozzles'}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {errors.nozzleCount && (
                  <p style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10.5px', color: '#DC2626', marginTop: '4px' }}>
                    <IconAlert /> {errors.nozzleCount}
                  </p>
                )}
              </div>
            </div>

            {/* Selected config summary */}
            {selectedProduct && form.nozzleCount && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '12px',
                padding: '8px 14px', borderRadius: '8px',
                background: '#EEF2FF', border: '1px solid #C7D2FE',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <IconNozzle />
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#4338CA' }}>
                    {form.name || 'Machine'} — {selectedProduct.name} — {form.nozzleCount} nozzle{parseInt(form.nozzleCount) > 1 ? 's' : ''}
                  </span>
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
