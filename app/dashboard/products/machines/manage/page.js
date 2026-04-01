'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { getMachines, getProducts, deleteMachine, updateMachine } from '../../../../../lib/store';

// ── Icons ──────────────────────────────────────────────────────────────────────
const IconGear    = () => <svg width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
const IconPlus    = () => <svg width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>;
const IconTrash   = () => <svg width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>;
const IconEdit    = () => <svg width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IconEye     = () => <svg width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const IconWarning = () => <svg width={18} height={18} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const IconSearch  = () => <svg width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IconNozzle  = () => <svg width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M3 22V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"/><path d="M3 11h12"/><path d="M13 6l4 4"/><path d="M17 10v6a2 2 0 0 0 4 0v-4l-2-2"/></svg>;
const IconHash    = () => <svg width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>;
const IconX       = () => <svg width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>;
const IconCheck   = () => <svg width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>;
const IconSave    = () => <svg width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>;
const IconAlert   = () => <svg width={12} height={12} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const IconDroplet = () => <svg width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>;

const NOZZLE_OPTIONS = [1, 2, 3, 4, 6, 8];
const UNIT_OPTIONS   = [
  { value: 'Ltr', label: 'Ltr', desc: 'Litre' },
  { value: 'Kg',  label: 'Kg',  desc: 'Kilogram' },
  { value: 'Cubic Meter', label: 'Cu.M', desc: 'Cubic Meter' },
  { value: 'Unit', label: 'Unit', desc: 'Unit' },
];

// ── Icon-only action button ────────────────────────────────────────────────────
function ActionBtn({ onClick, icon, bg, color, border, hoverBg, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: '30px', height: '30px', borderRadius: '7px',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        background: bg, color, border: `1px solid ${border}`,
        cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
      }}
      onMouseEnter={e => { e.currentTarget.style.background = hoverBg; }}
      onMouseLeave={e => { e.currentTarget.style.background = bg; }}
    >
      {icon}
    </button>
  );
}

// ── View Modal ─────────────────────────────────────────────────────────────────
function ViewModal({ machine, productName, onClose }) {
  const nozzles = parseInt(machine.nozzleCount || 0);
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
      background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', animation: 'fadeIn 0.2s ease',
    }}>
      <div className="ps-card" style={{ width: '100%', maxWidth: '400px', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #0D1B3E, #1a2f72)',
          padding: '16px 18px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <IconGear />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: 'white', letterSpacing: '-0.01em' }}>{machine.name}</div>
              <div style={{ fontSize: '10.5px', color: '#93C5FD', marginTop: '1px', fontFamily: 'monospace' }}>#{machine.machineNo}</div>
            </div>
          </div>
          <button onClick={onClose} style={{
            width: '28px', height: '28px', borderRadius: '7px',
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', cursor: 'pointer',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.18)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
          >
            <IconX />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '18px' }}>
          {/* Info rows */}
          {[
            { label: 'Machine Name',   value: machine.name },
            { label: 'Machine Number', value: `#${machine.machineNo}`, mono: true },
            { label: 'Product / Fuel', value: productName, green: true },
            { label: 'Status',         value: 'Active', badge: true },
          ].map(row => (
            <div key={row.label} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '9px 0', borderBottom: '1px solid #F1F5F9',
            }}>
              <span style={{ fontSize: '11.5px', color: '#94A3B8', fontWeight: 500 }}>{row.label}</span>
              {row.badge ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 9px', borderRadius: '999px', fontSize: '10px', fontWeight: 700, background: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0' }}>
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#059669' }} /> Active
                </span>
              ) : (
                <span style={{
                  fontSize: '12.5px', fontWeight: 700,
                  color: row.green ? '#059669' : '#0D1B3E',
                  fontFamily: row.mono ? 'monospace' : 'inherit',
                }}>
                  {row.value}
                </span>
              )}
            </div>
          ))}

          {/* Nozzles visual */}
          <div style={{ padding: '9px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '11.5px', color: '#94A3B8', fontWeight: 500 }}>Nozzles</span>
              <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#1D4ED8' }}>{nozzles} total</span>
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[...Array(nozzles)].map((_, i) => (
                <div key={i} style={{
                  width: '32px', height: '32px', borderRadius: '8px',
                  background: '#EFF6FF', border: '1.5px solid #BFDBFE',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', fontWeight: 800, color: '#1D4ED8',
                }}>
                  {i + 1}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Edit Modal ─────────────────────────────────────────────────────────────────
function EditModal({ machine, products, onSave, onClose }) {
  const [form, setForm]     = useState({
    name:        machine.name        || '',
    machineNo:   machine.machineNo   || '',
    productId:   String(machine.productId || ''),
    nozzleCount: String(machine.nozzleCount || '2'),
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Product combobox
  const [productSearch, setProductSearch]     = useState('');
  const [showProductDrop, setShowProductDrop] = useState(false);
  const productRef = useRef(null);
  useEffect(() => {
    const h = (e) => { if (productRef.current && !productRef.current.contains(e.target)) setShowProductDrop(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const selectedProduct  = products.find(p => String(p.id) === form.productId);
  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()));

  const validate = () => {
    const errs = {};
    if (!form.name.trim())    errs.name      = 'Required';
    if (!form.machineNo.trim()) errs.machineNo = 'Required';
    if (!form.productId)      errs.productId  = 'Select a product';
    return errs;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    await onSave({ name: form.name.trim(), machineNo: form.machineNo.trim(), productId: form.productId, nozzleCount: parseInt(form.nozzleCount) });
    setSaving(false);
  };

  const ch = (field) => (e) => { setForm(p => ({ ...p, [field]: e.target.value })); setErrors(p => ({ ...p, [field]: '' })); };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
      background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', animation: 'fadeIn 0.2s ease',
    }}>
      <div className="ps-card" style={{ width: '100%', maxWidth: '480px', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #F1F5F9', background: '#FAFBFC', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'linear-gradient(135deg, #0D1B3E, #122158)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <IconEdit />
            </div>
            <div>
              <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#0D1B3E' }}>Edit Machine</div>
              <div style={{ fontSize: '10.5px', color: '#94A3B8' }}>{machine.name}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ width: '28px', height: '28px', borderRadius: '7px', background: '#F1F5F9', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#E2E8F0'; }} onMouseLeave={e => { e.currentTarget.style.background = '#F1F5F9'; }}>
            <IconX />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '18px' }}>

          {/* Name + Machine No */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
            <div>
              <label className="ps-label">Machine Name <span style={{ color: '#DC2626' }}>*</span></label>
              <input className="ps-input" value={form.name} onChange={ch('name')} placeholder="e.g. Dispenser 1"
                style={{ borderColor: errors.name ? '#FCA5A5' : undefined, background: errors.name ? '#FFF5F5' : undefined }} autoFocus />
              {errors.name && <p style={{ fontSize: '10.5px', color: '#DC2626', margin: '3px 0 0', display: 'flex', alignItems: 'center', gap: '3px' }}><IconAlert />{errors.name}</p>}
            </div>
            <div>
              <label className="ps-label">Machine No. <span style={{ color: '#DC2626' }}>*</span></label>
              <input className="ps-input" value={form.machineNo} onChange={ch('machineNo')} placeholder="e.g. M-001"
                style={{ borderColor: errors.machineNo ? '#FCA5A5' : undefined, background: errors.machineNo ? '#FFF5F5' : undefined }} />
              {errors.machineNo && <p style={{ fontSize: '10.5px', color: '#DC2626', margin: '3px 0 0', display: 'flex', alignItems: 'center', gap: '3px' }}><IconAlert />{errors.machineNo}</p>}
            </div>
          </div>

          {/* Product combobox */}
          <div style={{ marginBottom: '12px' }}>
            <label className="ps-label">Product / Fuel Type <span style={{ color: '#DC2626' }}>*</span></label>
            <div ref={productRef} style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: selectedProduct ? '#059669' : '#CBD5E1', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                <IconDroplet />
              </span>
              <input className="ps-input"
                placeholder="Search or select a fuel product…"
                value={showProductDrop ? productSearch : (selectedProduct ? selectedProduct.name : '')}
                onFocus={() => { setShowProductDrop(true); setProductSearch(''); }}
                onChange={e => setProductSearch(e.target.value)}
                style={{ paddingLeft: '30px', paddingRight: '30px', borderColor: errors.productId ? '#FCA5A5' : selectedProduct ? '#BBF7D0' : undefined, background: errors.productId ? '#FFF5F5' : selectedProduct && !showProductDrop ? '#F0FDF4' : undefined, cursor: 'pointer' }}
                readOnly={!showProductDrop}
              />
              <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
                style={{ position: 'absolute', right: '10px', top: '50%', transform: `translateY(-50%) rotate(${showProductDrop ? '180deg' : '0deg'})`, pointerEvents: 'none', transition: 'transform 0.2s' }}>
                <polyline points="6 9 12 15 18 9"/>
              </svg>
              {showProductDrop && (
                <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: 'white', border: '1.5px solid #E2E8F0', borderRadius: '9px', boxShadow: '0 10px 28px rgba(0,0,0,0.1)', zIndex: 60, overflow: 'hidden', maxHeight: '200px', overflowY: 'auto' }}>
                  {filteredProducts.length === 0
                    ? <div style={{ padding: '12px 14px', fontSize: '12px', color: '#94A3B8' }}>No match</div>
                    : filteredProducts.map(p => {
                      const isSel = form.productId === String(p.id);
                      return (
                        <button key={p.id} type="button"
                          onMouseDown={() => { setForm(prev => ({ ...prev, productId: String(p.id) })); setErrors(prev => ({ ...prev, productId: '' })); setShowProductDrop(false); setProductSearch(''); }}
                          style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '9px 14px', background: isSel ? '#F0FDF4' : 'transparent', border: 'none', borderBottom: '1px solid #F8FAFC', cursor: 'pointer', fontFamily: 'inherit' }}
                          onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = '#F8FAFC'; }}
                          onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = 'transparent'; }}
                        >
                          <span style={{ width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0, background: isSel ? '#059669' : '#CBD5E1' }} />
                          <span style={{ flex: 1, fontSize: '12.5px', fontWeight: isSel ? 700 : 500, color: isSel ? '#059669' : '#1E293B' }}>{p.name}</span>
                          {p.unit && <span style={{ fontSize: '10px', fontWeight: 600, color: '#94A3B8', background: '#F1F5F9', padding: '2px 6px', borderRadius: '4px' }}>{p.unit === 'Cubic Meter' ? 'Cu.M' : p.unit}</span>}
                          {isSel && <span style={{ color: '#059669', display: 'flex', alignItems: 'center' }}><IconCheck /></span>}
                        </button>
                      );
                    })
                  }
                </div>
              )}
            </div>
            {errors.productId && <p style={{ fontSize: '10.5px', color: '#DC2626', margin: '3px 0 0', display: 'flex', alignItems: 'center', gap: '3px' }}><IconAlert />{errors.productId}</p>}
            {selectedProduct && !showProductDrop && <p style={{ fontSize: '10.5px', color: '#059669', margin: '4px 0 0', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}><IconCheck />{selectedProduct.name} selected</p>}
          </div>

          {/* Nozzle chips */}
          <div style={{ marginBottom: '16px' }}>
            <label className="ps-label">Number of Nozzles <span style={{ color: '#DC2626' }}>*</span></label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {NOZZLE_OPTIONS.map(n => {
                const isSel = String(form.nozzleCount) === String(n);
                return (
                  <button key={n} type="button"
                    onClick={() => setForm(p => ({ ...p, nozzleCount: String(n) }))}
                    style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '46px', height: '42px', borderRadius: '8px', border: `1.5px solid ${isSel ? '#0D1B3E' : '#E2E8F0'}`, background: isSel ? '#0D1B3E' : 'white', color: isSel ? 'white' : '#475569', cursor: 'pointer', fontFamily: 'inherit', boxShadow: isSel ? '0 2px 8px rgba(13,27,62,0.2)' : 'none', gap: '2px' }}
                    onMouseEnter={e => { if (!isSel) { e.currentTarget.style.borderColor = '#0D1B3E'; e.currentTarget.style.color = '#0D1B3E'; } }}
                    onMouseLeave={e => { if (!isSel) { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.color = '#475569'; } }}
                  >
                    <span style={{ fontSize: '13px', fontWeight: 800, lineHeight: 1 }}>{n}</span>
                    <span style={{ fontSize: '8px', fontWeight: 600, opacity: 0.7 }}>{n === 1 ? 'nozzle' : 'nozzles'}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ height: '1px', background: '#F1F5F9', marginBottom: '14px' }} />

          {/* Actions */}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '7px 18px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, color: '#64748B', background: 'white', border: '1.5px solid #E2E8F0', cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFC'; }} onMouseLeave={e => { e.currentTarget.style.background = 'white'; }}>
              <IconX /> Cancel
            </button>
            <button type="button" onClick={handleSubmit} disabled={saving} style={{ padding: '7px 20px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, color: 'white', background: '#0D1B3E', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 8px rgba(13,27,62,0.2)', opacity: saving ? 0.8 : 1 }}
              onMouseEnter={e => { if (!saving) e.currentTarget.style.background = '#122158'; }} onMouseLeave={e => { if (!saving) e.currentTarget.style.background = '#0D1B3E'; }}>
              {saving ? <><span className="spinner" /> Saving…</> : <><IconSave /> Save Changes</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function ManageMachinesPage() {
  const [machines, setMachines]     = useState([]);
  const [products, setProducts]     = useState([]);
  const [viewMachine, setViewMachine] = useState(null);
  const [editMachine, setEditMachine] = useState(null);
  const [deleteId, setDeleteId]     = useState(null);
  const [deleteName, setDeleteName] = useState('');
  const [search, setSearch]         = useState('');

  const load = async () => {
    setMachines(await getMachines());
    setProducts(await getProducts());
  };
  useEffect(() => { load(); }, []);

  const getProductName = (id) => products.find(p => String(p.id) === String(id))?.name || 'Unknown';

  const handleDelete = async (id) => {
    await deleteMachine(id);
    await load();
    setDeleteId(null);
    setDeleteName('');
  };

  const handleSave = async (data) => {
    await updateMachine(editMachine.id, data);
    setEditMachine(null);
    load();
  };

  const filtered = machines.filter(m =>
    m.name?.toLowerCase().includes(search.toLowerCase()) ||
    m.machineNo?.toLowerCase().includes(search.toLowerCase()) ||
    getProductName(m.productId)?.toLowerCase().includes(search.toLowerCase())
  );

  const totalNozzles = machines.reduce((s, m) => s + parseInt(m.nozzleCount || 0), 0);

  const fuelTypes = new Set(machines.map(m => m.productId)).size;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* ── Page Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'linear-gradient(135deg,#0D1B3E,#1e3a8a)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
            <IconGear />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0D1B3E', letterSpacing: '-0.025em', lineHeight: 1.2 }}>Manage Machines</h1>
            <p style={{ margin: 0, fontSize: '11.5px', color: '#94a3b8', marginTop: '1px' }}>All registered pump dispensers</p>
          </div>
        </div>
        <Link href="/dashboard/products/machines/add" className="btn-gold" style={{ fontSize: '12.5px', padding: '7px 14px' }}>
          <IconPlus /> Add Machine
        </Link>
      </div>

      {/* ── Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px' }}>
        {[
          { label: 'Total Machines', value: machines.length, sub: `${filtered.length} shown`,        Icon: IconGear,    color: '#1e3a8a', accent: '#3b82f6', bg: 'linear-gradient(135deg,#eff6ff,#dbeafe)' },
          { label: 'Total Nozzles',  value: totalNozzles,    sub: 'Across all dispensers',           Icon: IconNozzle,  color: '#065f46', accent: '#10b981', bg: 'linear-gradient(135deg,#f0fdf4,#dcfce7)' },
          { label: 'Fuel Types',     value: fuelTypes,       sub: 'Distinct fuel products',          Icon: IconHash,    color: '#92400e', accent: '#d97706', bg: 'linear-gradient(135deg,#fffbeb,#fef3c7)' },
        ].map(({ label, value, sub, Icon, color, accent, bg }) => (
          <div key={label} style={{ background: bg, borderRadius: '12px', padding: '12px 14px', border: `1px solid ${accent}22`, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '9px', flexShrink: 0, background: `${accent}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent }}>
              <Icon />
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: '10px', fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.07em', opacity: 0.75 }}>{label}</p>
              <p style={{ margin: '1px 0 0', fontSize: '15px', fontWeight: 800, color, letterSpacing: '-0.02em', lineHeight: 1.2 }}>{value}</p>
              <p style={{ margin: 0, fontSize: '10px', color: accent, opacity: 0.75 }}>{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Table Card ── */}
      <div className="ps-card">

        {/* Toolbar */}
        <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', borderBottom: '1px solid #f1f5f9', background: '#fafbfc' }}>
          <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: '260px' }}>
            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex', pointerEvents: 'none' }}><IconSearch /></span>
            <input
              placeholder="Search machines…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', padding: '7px 10px 7px 30px', fontSize: '12.5px', fontFamily: 'inherit', border: '1.5px solid #e2e8f0', borderRadius: '8px', background: '#fff', color: '#0D1B3E', outline: 'none' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 11px', background: '#0D1B3E', borderRadius: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#F0A500' }}>{filtered.length}</span>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>machine{filtered.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table className="ps-table">
            <thead>
              <tr>
                <th style={{ width: '36px' }}>#</th>
                <th>Machine Name</th>
                <th>Machine No.</th>
                <th>Product / Fuel</th>
                <th style={{ textAlign: 'center' }}>Nozzles</th>
                <th style={{ textAlign: 'center', width: '90px' }}>Status</th>
                <th style={{ textAlign: 'center', width: '96px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '48px 20px', textAlign: 'center', color: '#94a3b8' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '7px' }}>
                      <span style={{ opacity: 0.25, color: '#0D1B3E' }}><IconGear /></span>
                      <p style={{ fontWeight: 700, margin: 0, fontSize: '13px', color: '#64748b' }}>{search ? 'No machines match your search' : 'No machines registered yet'}</p>
                      {!search && <Link href="/dashboard/products/machines/add" style={{ fontSize: '12px', color: '#0D1B3E', textDecoration: 'none', fontWeight: 600 }}>Add first machine →</Link>}
                    </div>
                  </td>
                </tr>
              ) : filtered.map((m, i) => {
                const productName = getProductName(m.productId);
                const nozzles     = parseInt(m.nozzleCount || 0);
                return (
                  <tr key={m.id}>
                    <td style={{ color: '#94a3b8', fontSize: '11.5px', fontWeight: 700 }}>{i + 1}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: 'linear-gradient(135deg,#0D1B3E,#1e3a8a)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}><IconGear /></div>
                        <span style={{ fontWeight: 700, color: '#0D1B3E', fontSize: '12.5px' }}>{m.name}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: '5px', fontSize: '11px', fontWeight: 700, background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0', fontFamily: 'monospace', letterSpacing: '0.04em' }}>
                        #{m.machineNo}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#059669', flexShrink: 0 }} />
                        <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#1E293B' }}>{productName}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '999px', fontSize: '10.5px', fontWeight: 700, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
                        <IconNozzle /> {nozzles} {nozzles === 1 ? 'Nozzle' : 'Nozzles'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 9px', borderRadius: '999px', fontSize: '10px', fontWeight: 700, background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }}>
                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#059669' }} /> Active
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                        <ActionBtn onClick={() => setViewMachine(m)}                          icon={<IconEye />}   bg="#f0fdf4" color="#059669" border="#bbf7d0" hoverBg="#dcfce7" title="View Details" />
                        <ActionBtn onClick={() => setEditMachine(m)}                          icon={<IconEdit />}  bg="#eff6ff" color="#1d4ed8" border="#bfdbfe" hoverBg="#dbeafe" title="Edit Machine" />
                        <ActionBtn onClick={() => { setDeleteId(m.id); setDeleteName(m.name); }} icon={<IconTrash />} bg="#fef2f2" color="#dc2626" border="#fecaca" hoverBg="#fee2e2" title="Delete Machine" />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr>
                  <td colSpan={4} style={{ padding: '10px 16px', fontWeight: 700, fontSize: '12px', color: '#0D1B3E' }}>Total</td>
                  <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 800, fontSize: '12.5px', color: '#1d4ed8' }}>{totalNozzles} Nozzles</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* ── View Modal ── */}
      {viewMachine && (
        <ViewModal machine={viewMachine} productName={getProductName(viewMachine.productId)} onClose={() => setViewMachine(null)} />
      )}

      {/* ── Edit Modal ── */}
      {editMachine && (
        <EditModal machine={editMachine} products={products} onSave={handleSave} onClose={() => setEditMachine(null)} />
      )}

      {/* ── Delete Modal ── */}
      {deleteId && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', animation: 'fadeIn 0.2s ease' }}>
          <div className="ps-card" style={{ maxWidth: '360px', width: '100%', overflow: 'hidden' }}>
            <div style={{ height: '3px', background: 'linear-gradient(90deg, #DC2626, #EF4444)' }} />
            <div style={{ padding: '20px 22px 22px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '16px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#FEF2F2', border: '1px solid #FECACA', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626', flexShrink: 0 }}><IconWarning /></div>
                <div>
                  <h3 style={{ fontWeight: 800, fontSize: '14px', color: '#0D1B3E', margin: '0 0 5px' }}>Delete Machine?</h3>
                  <p style={{ fontSize: '12px', color: '#64748B', margin: 0, lineHeight: 1.6 }}>
                    <strong style={{ color: '#DC2626' }}>{deleteName}</strong> will be permanently removed from your system.
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => handleDelete(deleteId)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', padding: '8px', background: '#DC2626', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#B91C1C'; }} onMouseLeave={e => { e.currentTarget.style.background = '#DC2626'; }}>
                  <IconTrash /> Delete
                </button>
                <button onClick={() => { setDeleteId(null); setDeleteName(''); }} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', background: 'white', color: '#374151', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontWeight: 600, fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFC'; }} onMouseLeave={e => { e.currentTarget.style.background = 'white'; }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
