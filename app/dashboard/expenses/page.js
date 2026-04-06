'use client';
import { useState, useEffect } from 'react';
import {
  getExpenses, addExpense, updateExpense, deleteExpense,
  getExpenseCategories, addExpenseCategory,
} from '../../../lib/store';

const fmt     = (n) => new Intl.NumberFormat('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);
const fmtDate = (d) => { try { return new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }); } catch { return d; } };
const todayStr = () => new Date().toISOString().slice(0, 10);

// ── Preset colour palette for new categories ───────────────────────────────────
const PRESET_COLORS = [
  { label: 'Blue',   color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  { label: 'Amber',  color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  { label: 'Green',  color: '#059669', bg: '#f0fdf4', border: '#bbf7d0' },
  { label: 'Violet', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  { label: 'Cyan',   color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc' },
  { label: 'Slate',  color: '#475569', bg: '#f8fafc', border: '#e2e8f0' },
  { label: 'Orange', color: '#ea580c', bg: '#fff7ed', border: '#fed7aa' },
  { label: 'Purple', color: '#9333ea', bg: '#faf5ff', border: '#e9d5ff' },
  { label: 'Navy',   color: '#0D1B3E', bg: '#eef2f7', border: '#c7d2fe' },
  { label: 'Red',    color: '#dc2626', bg: '#fef2f2', border: '#fecdd3' },
  { label: 'Teal',   color: '#0d9488', bg: '#f0fdfa', border: '#99f6e4' },
  { label: 'Pink',   color: '#db2777', bg: '#fdf2f8', border: '#fbcfe8' },
];

// Derive colour from category position — no colour stored in DB
const getCat = (name, cats) => {
  const idx = (cats || []).findIndex(c => c.name === name);
  const palette = idx >= 0 ? PRESET_COLORS[idx % PRESET_COLORS.length] : PRESET_COLORS[PRESET_COLORS.length - 1];
  return { ...(cats || []).find(c => c.name === name), color: palette.color, bg: palette.bg, border: palette.border };
};

const PAYMENT_MODES = [
  { value: 'cash',          label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'jazzcash',      label: 'JazzCash' },
  { value: 'easypaisa',     label: 'EasyPaisa' },
];

const PERIODS = [
  { label: 'Today',      key: 'today' },
  { label: 'Yesterday',  key: 'yesterday' },
  { label: 'This Week',  key: 'week' },
  { label: 'This Month', key: 'month' },
  { label: 'Last Month', key: 'lastmonth' },
  { label: 'This Year',  key: 'year' },
  { label: 'All Time',   key: 'all' },
];

function getPeriodRange(key) {
  const now = new Date();
  const d   = (x) => x.toISOString().slice(0, 10);
  if (key === 'today')     { const t = d(now); return { from: t, to: t }; }
  if (key === 'yesterday') { const y = new Date(now); y.setDate(y.getDate() - 1); const yd = d(y); return { from: yd, to: yd }; }
  if (key === 'week')      { const s = new Date(now); s.setDate(now.getDate() - now.getDay()); return { from: d(s), to: d(now) }; }
  if (key === 'month')     { return { from: `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`, to: d(now) }; }
  if (key === 'lastmonth') { const f = new Date(now.getFullYear(), now.getMonth()-1, 1); const l = new Date(now.getFullYear(), now.getMonth(), 0); return { from: d(f), to: d(l) }; }
  if (key === 'year')      { return { from: `${now.getFullYear()}-01-01`, to: d(now) }; }
  return { from: '', to: '' };
}

// ── Icons ──────────────────────────────────────────────────────────────────────
const IconReceipt  = () => <svg width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16l3-2 2 2 2-2 2 2 2-2 3 2V4a2 2 0 0 0-2-2z"/><line x1="8" y1="9" x2="16" y2="9"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="12" y2="17"/></svg>;
const IconPlus     = () => <svg width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconEye      = () => <svg width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const IconEdit     = () => <svg width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IconTrash    = () => <svg width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>;
const IconX        = () => <svg width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IconSave     = () => <svg width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>;
const IconSearch   = () => <svg width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IconCalendar = () => <svg width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
const IconAlert    = () => <svg width={11} height={11} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const IconTag      = () => <svg width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>;
const IconCheck    = () => <svg width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>;

// ── Action Button ──────────────────────────────────────────────────────────────
function ActionBtn({ onClick, icon, bg, color, border, title }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} title={title}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ width: 28, height: 28, borderRadius: 7, border: `1.5px solid ${border}`, background: hov ? bg : '#fff', color, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {icon}
    </button>
  );
}

// ── Stat Card ──────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent, topColor }) {
  return (
    <div className="ps-stat-card" style={{ borderTop: `3px solid ${topColor}`, padding: '14px 18px' }}>
      <p style={{ margin: 0, fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
      <p style={{ margin: '5px 0 3px', fontSize: '19px', fontWeight: 800, color: accent, letterSpacing: '-0.025em', fontVariantNumeric: 'tabular-nums', lineHeight: 1.2 }}>{value}</p>
      <p style={{ margin: 0, fontSize: '10.5px', color: '#b0b8c9', fontWeight: 500 }}>{sub}</p>
    </div>
  );
}

// ── Add Category Modal ─────────────────────────────────────────────────────────
function AddCategoryModal({ onSave, onClose, existingCount = 0 }) {
  const [name,   setName]   = useState('');
  const [saving, setSaving] = useState(false);
  const [err,    setErr]    = useState('');

  // Colour derived from position — not saved to DB
  const autoColor = PRESET_COLORS[existingCount % PRESET_COLORS.length];

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) { setErr('Category name is required'); return; }
    setSaving(true);
    const result = await onSave({ name: trimmed });
    setSaving(false);
    if (!result) { setErr('Failed to save — name may already exist.'); return; }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'rgba(10,18,40,0.65)', backdropFilter: 'blur(6px)' }}>
      <div style={{ width: '100%', maxWidth: 380, borderRadius: 14, overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.3)', background: '#fff' }}>
        <div style={{ background: 'linear-gradient(135deg,#0D1B3E,#1a3475)', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ margin: 0, fontSize: '9.5px', fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Categories</p>
            <p style={{ margin: '3px 0 0', fontSize: 15, fontWeight: 800, color: '#fff' }}>Add New Category</p>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 7, color: '#fff', cursor: 'pointer', padding: 5, display: 'flex' }}><IconX /></button>
        </div>

        <div style={{ padding: '20px 20px' }}>
          <label className="ps-label">Category Name <span style={{ color: '#dc2626' }}>*</span></label>
          <input className="ps-input" style={{ borderColor: err ? '#fca5a5' : undefined }}
            placeholder="e.g. Marketing, Insurance…"
            autoFocus
            value={name} onChange={e => { setName(e.target.value); setErr(''); }}
            onKeyDown={e => { if (e.key === 'Enter') handleSave(); }} />
          {err && <p style={{ fontSize: '11px', color: '#dc2626', marginTop: 6, display: 'flex', alignItems: 'center', gap: 3 }}><IconAlert /> {err}</p>}

          {/* Live preview badge */}
          {name.trim() && (
            <div style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 999, background: autoColor.bg, border: `1.5px solid ${autoColor.border}`, color: autoColor.color, fontSize: '12px', fontWeight: 700 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: autoColor.color }} />
              {name.trim()}
            </div>
          )}
        </div>

        <div style={{ padding: '12px 20px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn-ghost">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ opacity: saving ? 0.75 : 1 }}>
            {saving ? 'Saving…' : <><IconSave /> Save Category</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Generic Searchable Select ──────────────────────────────────────────────────
// options: [{ value, label }]
function SearchableSelect({ value, options, onChange, placeholder = 'Select…', zIndex = 100 }) {
  const [open,    setOpen]    = useState(false);
  const [query,   setQuery]   = useState('');
  const [hovered, setHovered] = useState(null);
  const [refEl,   setRefEl]   = useState(null);
  const [inputEl, setInputEl] = useState(null);

  const filtered = query.trim()
    ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  const selectedOpt = options.find(o => o.value === value) || null;

  const open_  = () => { setOpen(true); setQuery(''); setTimeout(() => inputEl && inputEl.focus(), 0); };
  const close_ = () => { setOpen(false); setQuery(''); setHovered(null); };
  const pick   = (val) => { onChange(val); close_(); };

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (refEl && !refEl.contains(e.target)) close_(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, refEl]);

  return (
    <div style={{ position: 'relative', flexShrink: 0 }} ref={setRefEl}>

      {/* ── Trigger / Search field ── */}
      <div onClick={open ? undefined : open_}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '9px 12px', borderRadius: 8, cursor: open ? 'default' : 'pointer',
          border: `1.5px solid ${open ? '#0D1B3E' : '#e2e8f0'}`,
          background: '#fff', minWidth: 140,
          boxShadow: open ? '0 0 0 3px rgba(13,27,62,0.07)' : 'none',
        }}>
        <span style={{ color: '#94a3b8', display: 'flex', flexShrink: 0 }}><IconCalendar /></span>

        {open ? (
          <input ref={setInputEl} autoFocus
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, fontFamily: 'inherit', background: 'transparent', color: '#0D1B3E', minWidth: 0 }}
            placeholder="Type to search…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Escape') close_();
              if (e.key === 'Enter' && filtered.length === 1) pick(filtered[0].value);
            }}
          />
        ) : (
          <span style={{ flex: 1, fontSize: 13, fontWeight: selectedOpt ? 600 : 400, color: selectedOpt ? '#0D1B3E' : '#94a3b8', whiteSpace: 'nowrap' }}>
            {selectedOpt ? selectedOpt.label : placeholder}
          </span>
        )}

        {open && query
          ? <button type="button" onClick={() => setQuery('')} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', padding: 2, flexShrink: 0 }}><IconX /></button>
          : <svg width={13} height={13} fill="none" stroke="#94a3b8" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}><polyline points="6 9 12 15 18 9"/></svg>
        }
      </div>

      {/* ── Dropdown ── */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex,
          minWidth: '100%', background: '#fff', borderRadius: 10,
          border: '1.5px solid #e2e8f0',
          boxShadow: '0 8px 32px rgba(13,27,62,0.12), 0 2px 8px rgba(0,0,0,0.06)',
          overflow: 'hidden', animation: 'fadeIn 0.1s ease',
        }}>
          {/* Header */}
          <div style={{ padding: '7px 12px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>
              {query ? `${filtered.length} result${filtered.length !== 1 ? 's' : ''}` : `${options.length} options`}
            </span>
          </div>

          {/* Options */}
          <div style={{ maxHeight: 220, overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '16px 14px', textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>No match for <strong>"{query}"</strong></p>
              </div>
            ) : filtered.map((o, idx) => {
              const active = value === o.value;
              const isHov  = hovered === o.value;
              return (
                <button key={o.value} type="button"
                  onClick={() => pick(o.value)}
                  onMouseEnter={() => setHovered(o.value)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px', border: 'none',
                    borderBottom: idx < filtered.length - 1 ? '1px solid #f8fafc' : 'none',
                    background: active ? '#f0f4ff' : isHov ? '#f8fafc' : '#fff',
                    cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                  }}>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: active ? 700 : 500, color: active ? '#0D1B3E' : '#374151' }}>
                    {o.label}
                  </span>
                  {active && (
                    <svg width={15} height={15} fill="none" stroke="#0D1B3E" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Searchable Category Combobox ───────────────────────────────────────────────
function CategoryCombobox({ value, categories, onChange, error, onAddNew, placeholder = 'Search or select category…', zIndex = 100 }) {
  const [open,    setOpen]    = useState(false);
  const [query,   setQuery]   = useState('');
  const [hovered, setHovered] = useState(null);
  const [refEl,   setRefEl]   = useState(null);
  const [inputEl, setInputEl] = useState(null);

  const filtered = query.trim()
    ? categories.filter(c => c.name.toLowerCase().includes(query.toLowerCase()))
    : categories;

  const open_ = () => { setOpen(true); setQuery(''); setTimeout(() => inputEl && inputEl.focus(), 0); };
  const close_ = () => { setOpen(false); setQuery(''); setHovered(null); };
  const pick  = (name) => { onChange(name); close_(); };

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (refEl && !refEl.contains(e.target)) close_(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, refEl]);

  return (
    <div style={{ width: '100%', position: 'relative' }} ref={setRefEl}>

      {/* ── Field ── */}
      <div onClick={open ? undefined : open_}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '9px 12px', borderRadius: 8, cursor: open ? 'default' : 'pointer',
          border: `1.5px solid ${error ? '#fca5a5' : open ? '#0D1B3E' : '#e2e8f0'}`,
          background: '#fff',
          boxShadow: open ? '0 0 0 3px rgba(13,27,62,0.07)' : error ? '0 0 0 3px rgba(220,38,38,0.08)' : 'none',
        }}>
        <span style={{ color: '#94a3b8', display: 'flex', flexShrink: 0 }}><IconSearch /></span>

        {open ? (
          <input ref={setInputEl} autoFocus
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, fontFamily: 'inherit', background: 'transparent', color: '#0D1B3E' }}
            placeholder="Type to search…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Escape') close_();
              if (e.key === 'Enter' && filtered.length === 1) pick(filtered[0].name);
            }}
          />
        ) : (
          <span style={{ flex: 1, fontSize: 13, fontWeight: value ? 600 : 400, color: value ? '#0D1B3E' : '#94a3b8' }}>
            {value || placeholder}
          </span>
        )}

        {open && query
          ? <button type="button" onClick={() => setQuery('')} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', padding: 2, flexShrink: 0 }}><IconX /></button>
          : <svg width={13} height={13} fill="none" stroke="#94a3b8" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}><polyline points="6 9 12 15 18 9"/></svg>
        }
      </div>

      {/* ── Dropdown ── */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex,
          background: '#fff', borderRadius: 10,
          border: '1.5px solid #e2e8f0',
          boxShadow: '0 8px 32px rgba(13,27,62,0.12), 0 2px 8px rgba(0,0,0,0.06)',
          overflow: 'hidden', animation: 'fadeIn 0.1s ease',
        }}>

          {/* Results count header */}
          <div style={{ padding: '7px 12px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>
              {query ? `${filtered.length} result${filtered.length !== 1 ? 's' : ''} for "${query}"` : `${categories.length} categories`}
            </span>
            {value && (
              <button type="button" onClick={() => pick('')}
                style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 11, color: '#dc2626', fontWeight: 600, padding: 0, fontFamily: 'inherit' }}>
                Clear
              </button>
            )}
          </div>

          {/* Options — 3 items visible, rest scrollable */}
          <div style={{ maxHeight: 129, overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '20px 14px', textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>No match for <strong>"{query}"</strong></p>
              </div>
            ) : filtered.map((c, idx) => {
              const active = value === c.name;
              const isHov  = hovered === c.name;
              return (
                <button key={c.id || c.name} type="button"
                  onClick={() => pick(c.name)}
                  onMouseEnter={() => setHovered(c.name)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px', border: 'none',
                    borderBottom: idx < filtered.length - 1 ? '1px solid #f8fafc' : 'none',
                    background: active ? '#f0f4ff' : isHov ? '#f8fafc' : '#fff',
                    cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                  }}>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: active ? 700 : 500, color: active ? '#0D1B3E' : '#374151' }}>
                    {c.name}
                  </span>
                  {active && (
                    <svg width={15} height={15} fill="none" stroke="#0D1B3E" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </button>
              );
            })}
          </div>

          {/* Add New Category — always visible below the list */}
          {onAddNew && (
            <div style={{ padding: '8px 10px', borderTop: '1.5px solid #e2e8f0', background: '#fff' }}>
              <button type="button" onClick={() => { close_(); onAddNew(); }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '9px 12px', borderRadius: 8, border: 'none', background: '#f8fafc', cursor: 'pointer', fontFamily: 'inherit', color: '#0D1B3E', fontSize: 13, fontWeight: 700 }}
                onMouseEnter={e => { e.currentTarget.style.background = '#0D1B3E'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#0D1B3E'; }}>
                <IconPlus /> Add New Category
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Add / Edit Expense Modal ───────────────────────────────────────────────────
function ExpenseModal({ initial, categories, onSave, onClose, onCategoryAdded }) {
  const isEdit = !!initial?.id;
  const [form, setForm] = useState({
    category:    initial?.category    || (categories[0]?.name || ''),
    amount:      initial?.amount      ? String(initial.amount) : '',
    paymentMode: initial?.paymentMode || 'cash',
    description: initial?.description || '',
    date:        initial?.date        || todayStr(),
  });
  const [errors,     setErrors]     = useState({});
  const [saving,     setSaving]     = useState(false);
  const [showAddCat, setShowAddCat] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.category) e.category = 'Select a category';
    if (!form.amount || parseFloat(form.amount) <= 0) e.amount = 'Enter a valid amount';
    if (!form.date) e.date = 'Select a date';
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    await onSave({ ...form, amount: parseFloat(form.amount) });
    setSaving(false);
  };

  const sel = (field, val) => setForm(p => ({ ...p, [field]: val }));

  const handleNewCategory = async (cat) => {
    const saved = await onCategoryAdded(cat);
    if (saved) { setForm(p => ({ ...p, category: saved.name })); setShowAddCat(false); }
    return saved;
  };

  const amtNum     = parseFloat(form.amount) || 0;
  const selectedCat = getCat(form.category, categories);

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: 'rgba(10,18,40,0.65)', backdropFilter: 'blur(6px)' }}>
        <div style={{ width: '100%', maxWidth: 660, borderRadius: 16, overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.3)', background: '#fff', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>

          {/* ── Header with live amount preview ── */}
          <div style={{ background: 'linear-gradient(135deg,#0D1B3E 0%,#1a3475 100%)', padding: '18px 24px', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
            {/* decorative circle */}
            <div style={{ position: 'absolute', right: -30, top: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative' }}>
              <div>
                <p style={{ margin: 0, fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.14em' }}>
                  {isEdit ? 'Editing Record' : 'New Expense'}
                </p>
                <p style={{ margin: '4px 0 0', fontSize: 26, fontWeight: 800, color: amtNum > 0 ? '#F0A500' : 'rgba(255,255,255,0.3)', fontFamily: 'monospace', letterSpacing: '-0.02em', transition: 'color 0.2s' }}>
                  Rs. {fmt(amtNum)}
                </p>
                {form.category && (
                  <div style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: selectedCat.color }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.75)' }}>{form.category}</span>
                  </div>
                )}
              </div>
              <button onClick={onClose}
                style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, color: '#fff', cursor: 'pointer', padding: '6px', display: 'flex', flexShrink: 0 }}>
                <IconX />
              </button>
            </div>
          </div>

          {/* ── Body ── */}
          <div style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 18, overflowY: 'auto' }}>

            {/* Row 1: Category (full width) */}
            <div>
              <label className="ps-label">Category <span style={{ color: '#dc2626' }}>*</span></label>
              <CategoryCombobox
                value={form.category}
                categories={categories}
                onChange={v => { sel('category', v); setErrors(p => ({ ...p, category: '' })); }}
                error={errors.category}
                onAddNew={() => setShowAddCat(true)}
              />
              {errors.category && <p style={{ fontSize: '11px', color: '#dc2626', marginTop: 4, display: 'flex', alignItems: 'center', gap: 3 }}><IconAlert /> {errors.category}</p>}
            </div>

            {/* Row 2: Amount + Date */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label className="ps-label">Amount (Rs.) <span style={{ color: '#dc2626' }}>*</span></label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', fontSize: '11px', color: '#94a3b8', fontWeight: 700, pointerEvents: 'none', userSelect: 'none' }}>Rs.</span>
                  <input className="ps-input"
                    style={{ paddingLeft: 36, fontSize: 15, fontWeight: 700, borderColor: errors.amount ? '#fca5a5' : undefined, color: amtNum > 0 ? '#0D1B3E' : undefined }}
                    placeholder="0.00" inputMode="decimal" value={form.amount}
                    onChange={e => { setForm(p => ({ ...p, amount: e.target.value })); setErrors(p => ({ ...p, amount: '' })); }} />
                </div>
                {errors.amount && <p style={{ fontSize: '11px', color: '#dc2626', marginTop: 3, display: 'flex', alignItems: 'center', gap: 3 }}><IconAlert /> {errors.amount}</p>}
              </div>
              <div>
                <label className="ps-label">Date <span style={{ color: '#dc2626' }}>*</span></label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}><IconCalendar /></span>
                  <input type="date" className="ps-input" style={{ paddingLeft: 30, borderColor: errors.date ? '#fca5a5' : undefined }}
                    value={form.date} onChange={e => { setForm(p => ({ ...p, date: e.target.value })); setErrors(p => ({ ...p, date: '' })); }} />
                </div>
                {errors.date && <p style={{ fontSize: '11px', color: '#dc2626', marginTop: 3, display: 'flex', alignItems: 'center', gap: 3 }}><IconAlert /> {errors.date}</p>}
              </div>
            </div>

            {/* Row 3: Payment Method — card tiles */}
            <div>
              <label className="ps-label">Payment Method</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {PAYMENT_MODES.map(m => {
                  const active = form.paymentMode === m.value;
                  return (
                    <button key={m.value} type="button" onClick={() => sel('paymentMode', m.value)}
                      style={{ padding: '10px 8px', borderRadius: 10, border: `1.5px solid ${active ? '#0D1B3E' : '#e2e8f0'}`, background: active ? '#0D1B3E' : '#fafbfc', color: active ? '#fff' : '#475569', fontFamily: 'inherit', fontSize: '12px', fontWeight: active ? 700 : 500, cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s' }}>
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Row 4: Notes */}
            <div>
              <label className="ps-label">
                Notes &nbsp;<span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 400, textTransform: 'none' }}>(optional)</span>
              </label>
              <input className="ps-input" placeholder="e.g. Paid to LESCO, Driver salary for March…"
                value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            </div>
          </div>

          {/* ── Footer ── */}
          <div style={{ padding: '14px 24px', borderTop: '1px solid #f1f5f9', background: '#fafbfc', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>
              {form.category && amtNum > 0
                ? <><span style={{ color: selectedCat.color, fontWeight: 700 }}>{form.category}</span> · Rs. {fmt(amtNum)}</>
                : 'Fill in the details above'
              }
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={onClose} className="btn-ghost">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ opacity: saving ? 0.75 : 1 }}>
                {saving ? 'Saving…' : <><IconSave /> {isEdit ? 'Update Expense' : 'Save Expense'}</>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showAddCat && <AddCategoryModal onSave={handleNewCategory} onClose={() => setShowAddCat(false)} existingCount={categories.length} />}
    </>
  );
}

// ── View Modal ─────────────────────────────────────────────────────────────────
function ViewModal({ exp, categories, onClose }) {
  const cat = getCat(exp.category, categories);
  const pm  = PAYMENT_MODES.find(m => m.value === exp.paymentMode)?.label || exp.paymentMode;
  const Row = ({ label, children }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid #f1f5f9' }}>
      <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: '13px', fontWeight: 700, color: '#0D1B3E' }}>{children}</span>
    </div>
  );
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'rgba(10,18,40,0.6)', backdropFilter: 'blur(5px)' }}>
      <div style={{ width: '100%', maxWidth: 440, borderRadius: 14, overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.25)', background: '#fff' }}>
        <div style={{ background: 'linear-gradient(135deg,#0D1B3E,#1a3475)', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ margin: 0, fontSize: '9.5px', fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Expense Details</p>
            <p style={{ margin: '3px 0 0', fontSize: 22, fontWeight: 800, color: '#F0A500', fontFamily: 'monospace' }}>Rs. {fmt(exp.amount)}</p>
            <p style={{ margin: '3px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>{fmtDate(exp.date)}</p>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 7, color: '#fff', cursor: 'pointer', padding: 5, display: 'flex' }}><IconX /></button>
        </div>
        <div style={{ padding: '14px 20px' }}>
          <Row label="Category">
            <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 999, fontSize: '11px', fontWeight: 700, background: cat.bg, color: cat.color, border: `1px solid ${cat.border}` }}>{exp.category}</span>
          </Row>
          <Row label="Date">{fmtDate(exp.date)}</Row>
          <Row label="Payment Method">{pm}</Row>
          <Row label="Amount"><span style={{ color: '#dc2626' }}>Rs. {fmt(exp.amount)}</span></Row>
          {exp.description && (
            <div style={{ marginTop: 10, background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: 8, padding: '9px 12px' }}>
              <p style={{ margin: 0, fontSize: '9.5px', fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Notes</p>
              <p style={{ margin: 0, fontSize: '12.5px', color: '#78350f' }}>{exp.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Delete Confirm ─────────────────────────────────────────────────────────────
function DeleteConfirm({ exp, onConfirm, onClose }) {
  const [busy, setBusy] = useState(false);
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'rgba(10,18,40,0.6)', backdropFilter: 'blur(4px)' }}>
      <div style={{ width: '100%', maxWidth: 380, borderRadius: 14, overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.22)', background: '#fff' }}>
        <div style={{ background: 'linear-gradient(135deg,#dc2626,#ef4444)', padding: '14px 20px' }}>
          <p style={{ margin: 0, fontSize: '9.5px', fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Confirm Delete</p>
          <p style={{ margin: '3px 0 0', fontSize: 15, fontWeight: 800, color: '#fff' }}>Delete Expense Record?</p>
        </div>
        <div style={{ padding: '16px 20px' }}>
          <p style={{ margin: 0, fontSize: 13, color: '#475569' }}>
            This will permanently delete the <strong>{exp.category}</strong> expense of <strong style={{ color: '#dc2626' }}>Rs. {fmt(exp.amount)}</strong> on {fmtDate(exp.date)}. This cannot be undone.
          </p>
        </div>
        <div style={{ padding: '12px 20px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn-ghost">Cancel</button>
          <button disabled={busy} onClick={async () => { setBusy(true); await onConfirm(); setBusy(false); }}
            className="btn-danger" style={{ opacity: busy ? 0.75 : 1 }}>
            {busy ? 'Deleting…' : 'Yes, Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function ExpensesPage() {
  const [expenses,   setExpenses]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [addModal,   setAddModal]   = useState(false);
  const [viewExp,    setViewExp]    = useState(null);
  const [editExp,    setEditExp]    = useState(null);
  const [delExp,     setDelExp]     = useState(null);
  const [period,     setPeriod]     = useState('month');
  const [catFilter,  setCatFilter]  = useState('');
  const [search,     setSearch]     = useState('');
  const [success,    setSuccess]    = useState('');

  const loadAll = async () => {
    const [exps, cats] = await Promise.all([getExpenses(), getExpenseCategories()]);
    setExpenses(exps);
    setCategories(cats);
  };
  useEffect(() => { loadAll(); }, []);

  // ── Filter ──────────────────────────────────────────────────────────────────
  const { from, to } = getPeriodRange(period);
  const filtered = expenses.filter(e => {
    const d          = e.date || '';
    const matchPeriod = (!from || d >= from) && (!to || d <= to);
    const matchCat    = !catFilter || e.category === catFilter;
    const q           = search.toLowerCase();
    const matchSearch = !q || e.category.toLowerCase().includes(q) || (e.description || '').toLowerCase().includes(q) || String(e.amount).includes(q);
    return matchPeriod && matchCat && matchSearch;
  });

  const total      = filtered.reduce((s, e) => s + e.amount, 0);
  const count      = filtered.length;
  const topCat     = (() => { const m = {}; filtered.forEach(e => { m[e.category] = (m[e.category]||0) + e.amount; }); return Object.entries(m).sort((a,b)=>b[1]-a[1])[0]?.[0] || '—'; })();
  const avgAmt     = count > 0 ? total / count : 0;
  const periodLabel = PERIODS.find(p => p.key === period)?.label || 'Selected';

  const byCat      = {};
  filtered.forEach(e => { byCat[e.category] = (byCat[e.category] || 0) + e.amount; });
  const catEntries = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
  const maxCat     = catEntries[0]?.[1] || 1;

  // ── Handlers ────────────────────────────────────────────────────────────────
  const flash = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); };

  const handleAdd = async (form) => {
    await addExpense(form); await loadAll(); setAddModal(false); flash('Expense added successfully');
  };
  const handleEdit = async (form) => {
    await updateExpense(editExp.id, form); await loadAll(); setEditExp(null); flash('Expense updated successfully');
  };
  const handleDelete = async () => {
    await deleteExpense(delExp.id); await loadAll(); setDelExp(null); flash('Expense deleted');
  };
  const handleCategoryAdded = async (cat) => {
    const saved = await addExpenseCategory(cat);
    if (saved) setCategories(prev => [...prev, saved].sort((a, b) => a.name.localeCompare(b.name)));
    return saved;
  };

  const pmLabel = (v) => PAYMENT_MODES.find(m => m.value === v)?.label || v;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Page Header ── */}
      <div className="ps-page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: 'linear-gradient(135deg,#0D1B3E,#1a3475)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F0A500', flexShrink: 0 }}>
            <IconReceipt />
          </div>
          <div>
            <h1 className="ps-page-title">Expenses</h1>
            <p className="ps-page-subtitle">Track &amp; manage all station expenses</p>
          </div>
        </div>
        <button onClick={() => setAddModal(true)} className="btn-primary">
          <IconPlus /> Add Expense
        </button>
      </div>

      {/* ── Success toast ── */}
      {success && (
        <div className="alert-success animate-fade-in">
          <IconCheck /> {success}
        </div>
      )}

      {/* ── Stat Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <StatCard label={`Total — ${periodLabel}`} value={`Rs. ${fmt(total)}`}  sub="Sum of all expenses"  accent="#dc2626" topColor="#dc2626" />
        <StatCard label="Transactions"             value={count}                sub="Records in period"    accent="#2563eb" topColor="#2563eb" />
        <StatCard label="Avg per Transaction"      value={`Rs. ${fmt(avgAmt)}`} sub="Per expense record"   accent="#d97706" topColor="#d97706" />
        <StatCard label="Top Category"             value={topCat}               sub="Highest spend"        accent="#7c3aed" topColor="#7c3aed" />
      </div>

      {/* ── Filter Toolbar ── */}
      <div className="ps-card" style={{ overflow: 'visible' }}>
        <div className="ps-toolbar" style={{ flexWrap: 'nowrap' }}>
          {/* Period — searchable */}
          <SearchableSelect
            value={period}
            options={PERIODS.map(p => ({ value: p.key, label: p.label }))}
            onChange={v => setPeriod(v)}
            placeholder="Select period"
            zIndex={55}
          />

          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
            <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}><IconSearch /></span>
            <input className="ps-input" style={{ width: '100%', paddingLeft: 28, padding: '7px 10px 7px 28px' }}
              placeholder="Search expenses…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          {/* Category filter — searchable */}
          <div style={{ width: 180, flexShrink: 0 }}>
            <CategoryCombobox
              value={catFilter}
              categories={categories}
              onChange={v => setCatFilter(v)}
              placeholder="All Categories"
              zIndex={55}
            />
          </div>

          {/* Record count */}
          <span className="badge badge-info" style={{ flexShrink: 0 }}>{filtered.length} records</span>
        </div>
      </div>

      {/* ── Category Breakdown ── */}
      {catEntries.length > 0 && (
        <div className="ps-card">
          <div className="ps-card-header">
            <h3 className="ps-card-title"><IconTag /> Category Breakdown</h3>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#dc2626' }}>Total: Rs. {fmt(total)}</span>
          </div>
          <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 9 }}>
            {catEntries.map(([cat, amt]) => {
              const c   = getCat(cat, categories);
              const pct = Math.round((amt / total) * 100);
              return (
                <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 90, fontSize: '11.5px', fontWeight: 600, color: '#475569', flexShrink: 0 }}>{cat}</span>
                  <div style={{ flex: 1, height: 6, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ width: `${(amt / maxCat) * 100}%`, height: '100%', background: c.color, borderRadius: 999, transition: 'width 0.6s ease' }} />
                  </div>
                  <span style={{ width: 36, fontSize: '10.5px', fontWeight: 700, color: '#94a3b8', textAlign: 'right', flexShrink: 0 }}>{pct}%</span>
                  <span style={{ width: 96, fontSize: '12px', fontWeight: 700, color: c.color, textAlign: 'right', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>Rs. {fmt(amt)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Expense Table ── */}
      <div className="ps-card">
        <div className="ps-card-header">
          <h3 className="ps-card-title">
            <IconReceipt /> {periodLabel} Expenses
          </h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="ps-table">
            <thead>
              <tr>
                <th style={{ width: 36, textAlign: 'center' }}>#</th>
                <th>Date</th>
                <th>Category</th>
                <th>Notes</th>
                <th>Payment</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                <th style={{ textAlign: 'center', width: 96 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '48px 20px', color: '#94a3b8' }}>
                    No expenses found for this period
                  </td>
                </tr>
              ) : filtered.map((e, i) => {
                const cat = getCat(e.category, categories);
                return (
                  <tr key={e.id}>
                    <td style={{ color: '#94a3b8', fontSize: '11.5px', fontWeight: 700, textAlign: 'center' }}>{i + 1}</td>
                    <td style={{ fontSize: '12px', fontWeight: 600, color: '#475569', whiteSpace: 'nowrap' }}>{fmtDate(e.date)}</td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 999, fontSize: '10.5px', fontWeight: 700, background: cat.bg, color: cat.color, border: `1px solid ${cat.border}` }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: cat.color, flexShrink: 0 }} />
                        {e.category}
                      </span>
                    </td>
                    <td style={{ fontSize: '12px', color: e.description ? '#475569' : '#cbd5e1', fontStyle: e.description ? 'normal' : 'italic', maxWidth: 200 }}>
                      {e.description || 'No notes'}
                    </td>
                    <td>
                      <span className="badge badge-gray">{pmLabel(e.paymentMode)}</span>
                    </td>
                    <td style={{ textAlign: 'right', fontSize: '13px', fontWeight: 800, color: '#dc2626', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                      Rs. {fmt(e.amount)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                        <ActionBtn onClick={() => setViewExp(e)} icon={<IconEye />}   bg="#f0fdf4" color="#059669" border="#bbf7d0" title="View details" />
                        <ActionBtn onClick={() => setEditExp(e)} icon={<IconEdit />}  bg="#eff6ff" color="#2563eb" border="#93c5fd" title="Edit expense" />
                        <ActionBtn onClick={() => setDelExp(e)}  icon={<IconTrash />} bg="#fef2f2" color="#dc2626" border="#fecdd3" title="Delete expense" />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr>
                  <td colSpan={5} style={{ fontWeight: 700, fontSize: '12px', color: '#0D1B3E' }}>Total — {filtered.length} records</td>
                  <td style={{ textAlign: 'right', fontWeight: 800, color: '#dc2626', fontSize: '14px', fontVariantNumeric: 'tabular-nums' }}>Rs. {fmt(total)}</td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* ── Modals ── */}
      {addModal && <ExpenseModal categories={categories} onSave={handleAdd} onClose={() => setAddModal(false)} onCategoryAdded={handleCategoryAdded} />}
      {editExp  && <ExpenseModal initial={editExp} categories={categories} onSave={handleEdit} onClose={() => setEditExp(null)} onCategoryAdded={handleCategoryAdded} />}
      {viewExp  && <ViewModal exp={viewExp} categories={categories} onClose={() => setViewExp(null)} />}
      {delExp   && <DeleteConfirm exp={delExp} onConfirm={handleDelete} onClose={() => setDelExp(null)} />}
    </div>
  );
}
