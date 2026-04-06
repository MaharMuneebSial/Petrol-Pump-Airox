'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { getCompany } from '../../../lib/store';

const fmt    = n => new Intl.NumberFormat('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);
const fmtPKR = n => `Rs. ${fmt(n)}`;

// ── Icons ─────────────────────────────────────────────────────────────────────
const IconPlus     = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconGauge    = () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 6v6l4 2"/><circle cx="18" cy="6" r="3"/></svg>;
const IconAlert    = () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const IconBolt     = () => <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
const IconTrash    = () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>;
const IconClock    = () => <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const IconChevron  = ({ up }) => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{ transform: up ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><polyline points="6 9 12 15 18 9"/></svg>;
const IconUsers    = () => <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const IconDroplet  = () => <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>;
const IconSearch   = () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IconCalendar = () => <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
const IconX        = () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IconMachine  = () => <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>;

// ── Styles ────────────────────────────────────────────────────────────────────
const lbl  = { fontSize: '10.5px', fontWeight: 700, color: '#64748B', marginBottom: '4px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' };
const inp  = { width: '100%', padding: '8px 10px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '13px', color: '#1E293B', background: 'white', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', transition: 'border-color 0.15s' };
const errS = { fontSize: '10.5px', color: '#ef4444', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '3px', margin: '3px 0 0' };

// ── Helpers ───────────────────────────────────────────────────────────────────
function getProductStyle(name = '') {
  const n = name.toLowerCase();
  if (n.includes('hi octane') || n.includes('high octane')) return { bg: '#F5F3FF', color: '#7C3AED', border: '#DDD6FE' };
  if (n.includes('hi speed') || n.includes('hsd'))          return { bg: '#FFFBEB', color: '#D97706', border: '#FDE68A' };
  if (n.includes('diesel'))                                  return { bg: '#FFF7ED', color: '#EA580C', border: '#FDBA74' };
  if (n.includes('petrol'))                                  return { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE' };
  return { bg: '#F1F5F9', color: '#64748B', border: '#E2E8F0' };
}

function groupByStaff(nozzles) {
  const groups = {};
  for (const nz of nozzles) {
    const sid = nz.staff_id || '__unassigned__';
    if (!groups[sid]) groups[sid] = { staff: nz.staff, nozzles: [] };
    groups[sid].nozzles.push(nz);
  }
  return groups;
}

function groupByMachine(nozzles) {
  const groups = {};
  for (const nz of nozzles) {
    const mid = nz.machine_id || '__none__';
    if (!groups[mid]) groups[mid] = { machine: nz.machines, nozzles: [] };
    groups[mid].nozzles.push(nz);
  }
  return groups;
}

function useElapsed(startTime) {
  const [elapsed, setElapsed] = useState('');
  useEffect(() => {
    if (!startTime) return;
    const update = () => {
      const ms = Date.now() - new Date(startTime).getTime();
      if (ms < 0) { setElapsed(''); return; }
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      setElapsed(h > 0 ? `${h}h ${m}m` : `${m}m`);
    };
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, [startTime]);
  return elapsed;
}

// ── Delete Confirmation Modal ─────────────────────────────────────────────────
function DeleteModal({ shift, onConfirm, onCancel }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px', backdropFilter: 'blur(3px)' }}>
      <div style={{ background: 'white', borderRadius: '14px', padding: '18px 20px 16px', maxWidth: '320px', width: '100%', boxShadow: '0 12px 32px rgba(0,0,0,0.18)', border: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#FEF2F2', border: '1px solid #FECACA', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444', flexShrink: 0 }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#0F172A' }}>Delete Shift?</div>
            <div style={{ fontSize: '11.5px', color: '#94A3B8', marginTop: '1px' }}>This cannot be undone</div>
          </div>
        </div>
        <div style={{ fontSize: '12.5px', color: '#64748B', lineHeight: '1.5', marginBottom: '14px', paddingLeft: '42px' }}>
          Permanently deletes <strong style={{ color: '#334155' }}>{shift?.shift_name || 'this shift'}</strong> and all its nozzle readings.
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1.5px solid #E2E8F0', background: 'white', color: '#475569', fontWeight: 600, fontSize: '12.5px', cursor: 'pointer', fontFamily: 'inherit' }}>
            Cancel
          </button>
          <button onClick={onConfirm} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: '#DC2626', color: 'white', fontWeight: 700, fontSize: '12.5px', cursor: 'pointer', fontFamily: 'inherit' }}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Skeleton loader ───────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {[160, 120].map((h, i) => (
        <div key={i} style={{ height: h, borderRadius: '14px', background: 'linear-gradient(90deg, #F1F5F9 0%, #E8EFF7 50%, #F1F5F9 100%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
      ))}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ShiftsPage() {
  const router = useRouter();
  const [shifts,      setShifts]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [filter,      setFilter]      = useState({ date: '', search: '' });
  const [closing,     setClosing]     = useState(null);
  const [closeData,   setCloseData]   = useState({});
  const [closeErr,    setCloseErr]    = useState({});
  const [meterReset,  setMeterReset]  = useState({});
  const [closeNote,   setCloseNote]   = useState('');
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState('');
  const [deleteModal, setDeleteModal] = useState(null);
  const [showClosed,  setShowClosed]  = useState(false);

  const load = useCallback(async () => {
    const company = getCompany();
    if (!company) return;
    setLoading(true);
    const { data } = await supabase
      .from('shifts')
      .select(`
        id, shift_name, shift_date, shift_duration, status, total_liters, total_amount, note, opened_at, closed_at,
        shift_nozzles(id, nozzle_number, nozzle_name, machine_id, staff_id, product_id, opening_reading, closing_reading, liters_sold, rate, amount, payment_mode, payment_meta, account_id,
          machines(id, name, machine_no),
          staff(id, name, role),
          products(id, name, unit, selling_rate)
        )
      `)
      .eq('company_id', company.id)
      .order('shift_date', { ascending: false })
      .order('created_at', { ascending: false });

    setShifts((data || []).map(s => ({
      ...s,
      shift_nozzles: (s.shift_nozzles || []).sort((a, b) => a.nozzle_number - b.nozzle_number),
    })));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const startClose = (shift) => {
    const cd = {};
    for (const nz of (shift.shift_nozzles || []))
      cd[nz.id] = { opening_reading: nz.opening_reading != null ? String(nz.opening_reading) : '', closing_reading: '' };
    setCloseData(cd); setCloseErr({}); setMeterReset({}); setCloseNote(''); setError('');
    setClosing(shift.id);
  };

  const handleDeleteShift = (shift) => setDeleteModal(shift);
  const confirmDelete = async () => {
    if (!deleteModal) return;
    await supabase.from('shift_nozzles').delete().eq('shift_id', deleteModal.id);
    await supabase.from('shifts').delete().eq('id', deleteModal.id);
    if (closing === deleteModal.id) setClosing(null);
    setDeleteModal(null);
    load();
  };

  const handleActivate = (shift) => router.push(`/dashboard/shifts/${shift.id}/activate`);

  const setNozzleClose = (nozzleId, field, value) => {
    setCloseData(p => ({ ...p, [nozzleId]: { ...p[nozzleId], [field]: value } }));
    setCloseErr(p => ({ ...p, [`${nozzleId}_${field}`]: '' }));
  };

  const validateClose = (shift) => {
    const e = {};
    for (const nz of (shift.shift_nozzles || [])) {
      const ov = closeData[nz.id]?.opening_reading;
      if (ov === '' || ov === undefined) e[`${nz.id}_opening`] = 'Required';
      else if (isNaN(+ov) || +ov < 0)   e[`${nz.id}_opening`] = 'Invalid';
      const cv = closeData[nz.id]?.closing_reading;
      if (cv === '' || cv === undefined) {
        e[`${nz.id}_reading`] = 'Required';
      } else if (isNaN(+cv) || +cv < 0) {
        e[`${nz.id}_reading`] = 'Invalid';
      } else if (!meterReset[nz.id] && ov !== '' && ov !== undefined && !isNaN(+ov) && +cv < +ov) {
        e[`${nz.id}_reading`] = `Must be ≥ ${fmt(+ov)} — or tick "Meter Reset"`;
      }
    }
    return e;
  };

  const handleSaveReadings = async (shift) => {
    const errs = validateClose(shift);
    if (Object.keys(errs).length) { setCloseErr(errs); return; }
    setSaving(true); setError('');
    for (const nz of (shift.shift_nozzles || [])) {
      const openingReading = parseFloat(closeData[nz.id].opening_reading);
      const closingReading = parseFloat(closeData[nz.id].closing_reading);
      const rate   = nz.rate || nz.products?.selling_rate || 0;
      const liters = meterReset[nz.id] ? Math.max(0, closingReading) : Math.max(0, closingReading - openingReading);
      const amount = parseFloat((liters * rate).toFixed(2));
      const { error: nErr } = await supabase.from('shift_nozzles').update({
        opening_reading: openingReading, closing_reading: closingReading,
        liters_sold: parseFloat(liters.toFixed(2)), rate, amount,
      }).eq('id', nz.id);
      if (nErr) { setError('Failed to save readings. Try again.'); setSaving(false); return; }
    }
    if (closeNote.trim()) await supabase.from('shifts').update({ note: closeNote.trim() }).eq('id', shift.id);
    setSaving(false);
    router.push(`/dashboard/shifts/${shift.id}/payment`);
  };

  const draftShifts  = shifts.filter(s => s.status === 'draft');
  const openShifts   = shifts.filter(s => s.status === 'open');
  const closedShifts = shifts.filter(s => s.status === 'closed');

  const todayStr     = new Date().toISOString().slice(0, 10);
  const todayRevenue = closedShifts.filter(s => s.shift_date === todayStr).reduce((sum, s) => sum + (s.total_amount || 0), 0);
  const todayLiters  = closedShifts.filter(s => s.shift_date === todayStr).reduce((sum, s) => sum + (s.total_liters || 0), 0);
  const todayCount   = closedShifts.filter(s => s.shift_date === todayStr).length;

  const filteredClosed = closedShifts.filter(s => {
    if (filter.date   && s.shift_date !== filter.date) return false;
    if (filter.search) {
      const q = filter.search.toLowerCase();
      return (s.shift_name || '').toLowerCase().includes(q) || (s.shift_date || '').includes(q);
    }
    return true;
  });

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {deleteModal && <DeleteModal shift={deleteModal} onConfirm={confirmDelete} onCancel={() => setDeleteModal(null)} />}

      {/* ── Page Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '19px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>Shifts</h2>
          <p  style={{ margin: '3px 0 0', fontSize: '12px', color: '#94A3B8' }}>Manage active and upcoming shifts</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Today's summary chips */}
          {todayRevenue > 0 && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ padding: '7px 13px', background: '#F0FDF4', border: '1.5px solid #BBF7D0', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '10px', color: '#059669', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Today · {todayCount} shifts</span>
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#065F46', letterSpacing: '-0.01em' }}>{fmtPKR(todayRevenue)}</span>
              </div>
              <div style={{ padding: '7px 13px', background: '#EFF6FF', border: '1.5px solid #BFDBFE', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <IconDroplet />
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#1D4ED8', letterSpacing: '-0.01em' }}>{fmt(todayLiters)} L</span>
              </div>
            </div>
          )}
          {draftShifts.length === 0 && openShifts.length === 0 && !loading && (
            <button onClick={() => router.push('/dashboard/shifts/open')} style={{
              display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 18px', borderRadius: '10px', border: 'none',
              background: 'linear-gradient(135deg, #0D1B3E, #122158)', color: 'white', fontWeight: 700, fontSize: '13px',
              cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 3px 12px rgba(13,27,62,0.3)',
            }}>
              <IconPlus /> New Shift
            </button>
          )}
        </div>
      </div>

      {loading ? <Skeleton /> : (
        <>
          {/* ── Active Shift ── */}
          <section style={{ marginBottom: '28px' }}>
            <SectionLabel dot={openShifts.length > 0 ? '#059669' : '#CBD5E1'} pulse={openShifts.length > 0}>
              Active Shift {openShifts.length === 0 && <span style={{ color: '#CBD5E1', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>— none running</span>}
            </SectionLabel>
            {openShifts.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {openShifts.map(shift => (
                  <ShiftCard key={shift.id} shift={shift}
                    isClosing={closing === shift.id}
                    closeData={closeData} setNozzleClose={setNozzleClose}
                    closeErr={closeErr} meterReset={meterReset} setMeterReset={setMeterReset}
                    closeNote={closeNote} setCloseNote={setCloseNote}
                    saving={saving} error={error}
                    onClose={() => startClose(shift)}
                    onSubmit={() => handleSaveReadings(shift)}
                    onCancel={() => setClosing(null)}
                    onDelete={() => handleDeleteShift(shift)}
                  />
                ))}
              </div>
            ) : (
              <div style={{ padding: '20px', background: 'white', borderRadius: '14px', border: '1.5px dashed #E2E8F0', color: '#94A3B8', fontSize: '13px', textAlign: 'center', lineHeight: '1.6' }}>
                {draftShifts.length > 0
                  ? 'Activate the draft shift below when your team is ready.'
                  : 'No active shift. Click "New Shift" to get started.'}
              </div>
            )}
          </section>

          {/* ── Draft Shifts ── */}
          {draftShifts.length > 0 && (
            <section style={{ marginBottom: '28px' }}>
              <SectionLabel dot="#D97706">Draft ({draftShifts.length})</SectionLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {draftShifts.map(shift => (
                  <ShiftCard key={shift.id} shift={shift}
                    onActivate={() => handleActivate(shift)}
                    onDelete={() => handleDeleteShift(shift)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* ── Closed Shifts ── */}
          {closedShifts.length > 0 && (
            <section>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flex: 1 }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#94A3B8', flexShrink: 0 }} />
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    Closed ({filteredClosed.length}{(filter.date || filter.search) ? ` of ${closedShifts.length}` : ''})
                  </span>
                </div>
                <button onClick={() => setShowClosed(p => !p)} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 12px', borderRadius: '8px', border: '1.5px solid #E2E8F0', background: showClosed ? '#F8FAFC' : 'white', color: '#64748B', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  <IconChevron up={showClosed} /> {showClosed ? 'Hide' : 'Show all'}
                </button>
              </div>

              {showClosed && (
                <>
                  {/* Filters */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '160px', position: 'relative' }}>
                      <div style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }}><IconSearch /></div>
                      <input placeholder="Search shifts…" value={filter.search}
                        onChange={e => setFilter(p => ({ ...p, search: e.target.value }))}
                        style={{ ...inp, paddingLeft: '32px' }}
                      />
                    </div>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <div style={{ position: 'absolute', left: '10px', color: '#94A3B8', pointerEvents: 'none', top: '50%', transform: 'translateY(-50%)' }}><IconCalendar /></div>
                      <input type="date" value={filter.date}
                        onChange={e => setFilter(p => ({ ...p, date: e.target.value }))}
                        style={{ ...inp, paddingLeft: '30px', width: 'auto' }}
                      />
                    </div>
                    {(filter.date || filter.search) && (
                      <button onClick={() => setFilter({ date: '', search: '' })} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #E2E8F0', background: 'white', color: '#64748B', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                        <IconX /> Clear
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {filteredClosed.length === 0 ? (
                      <div style={{ padding: '20px', background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', color: '#94A3B8', fontSize: '13px', textAlign: 'center' }}>No shifts match your filter.</div>
                    ) : filteredClosed.map(shift => (
                      <ShiftCard key={shift.id} shift={shift} onDelete={() => handleDeleteShift(shift)} />
                    ))}
                  </div>
                </>
              )}
            </section>
          )}

          {shifts.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '16px', border: '1.5px dashed #E2E8F0' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#2563EB' }}><IconGauge /></div>
              <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '15px', marginBottom: '6px' }}>No shifts yet</div>
              <div style={{ color: '#94A3B8', fontSize: '13px', marginBottom: '20px', lineHeight: '1.6' }}>Set up your dispensers, assign staff, and start tracking fuel sales.</div>
              <button onClick={() => router.push('/dashboard/shifts/open')} style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '10px 20px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #0D1B3E, #122158)', color: 'white', fontWeight: 700, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 3px 12px rgba(13,27,62,0.3)' }}>
                <IconPlus /> Setup First Shift
              </button>
            </div>
          )}
        </>
      )}

      <style>{`
        @keyframes pulse { 0%,100% { box-shadow: 0 0 0 2px rgba(5,150,105,0.25); } 50% { box-shadow: 0 0 0 5px rgba(5,150,105,0.1); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
      `}</style>
    </div>
  );
}

// ── Section Label ─────────────────────────────────────────────────────────────
function SectionLabel({ children, dot, pulse }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '10px' }}>
      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: dot, flexShrink: 0, animation: pulse ? 'pulse 2s infinite' : 'none' }} />
      <span style={{ fontSize: '11px', fontWeight: 700, color: dot, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{children}</span>
    </div>
  );
}

// ── Shift Card ────────────────────────────────────────────────────────────────
function ShiftCard({ shift, isClosing, closeData, setNozzleClose, closeErr, meterReset, setMeterReset, closeNote, setCloseNote, saving, error, onClose, onSubmit, onCancel, onActivate, onDelete }) {
  const isDraft  = shift.status === 'draft';
  const isOpen   = shift.status === 'open';
  const isClosed = shift.status === 'closed';
  const [expanded, setExpanded] = useState(!isClosed);

  const nozzles     = (shift.shift_nozzles || []).sort((a, b) => a.nozzle_number - b.nozzle_number);
  const machineMap  = {};
  for (const nz of nozzles) { if (nz.machine_id && !machineMap[nz.machine_id]) machineMap[nz.machine_id] = nz.machines; }
  const machineList = Object.values(machineMap);
  const multiMachine = machineList.length > 1;
  const staffGroups  = groupByStaff(nozzles);
  const staffCount   = Object.keys(staffGroups).length;

  const shiftTitle  = shift.shift_name || (machineList.map(m => m?.name).filter(Boolean).join(' · ') || 'Shift');
  const elapsed     = useElapsed(isOpen ? shift.opened_at : null);

  const borderColor = isDraft ? '#FDE68A' : isOpen ? '#6EE7B7' : '#E2E8F0';
  const headerBg    = isDraft ? '#FEFCE8' : isOpen ? '#F0FDF4' : '#F8FAFC';

  // Live total from closing form
  const liveTotal = isClosing ? (nozzles.reduce((sum, nz) => {
    const cd  = closeData?.[nz.id] || {};
    const lit = meterReset?.[nz.id]
      ? parseFloat(cd.closing_reading || 0)
      : parseFloat(cd.closing_reading || 0) - parseFloat(cd.opening_reading || 0);
    const rate = nz.rate || nz.products?.selling_rate || 0;
    return sum + (!isNaN(lit) && lit > 0 ? lit * rate : 0);
  }, 0)) : 0;

  return (
    <div style={{ background: 'white', borderRadius: '14px', border: `1.5px solid ${borderColor}`, overflow: 'hidden', boxShadow: isOpen ? '0 4px 20px rgba(5,150,105,0.1)' : '0 1px 4px rgba(0,0,0,0.05)', animation: 'fadeIn 0.2s ease' }}>

      {/* ── Header ── */}
      <div style={{ padding: '14px 18px', background: headerBg, borderBottom: `1px solid ${borderColor}` }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>

          {/* Left: icon + title + meta */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '11px', background: isDraft ? '#FEF3C7' : isOpen ? '#DCFCE7' : '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDraft ? '#D97706' : isOpen ? '#059669' : '#64748B', flexShrink: 0, marginTop: '1px' }}>
              <IconGauge />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '14px', color: '#0F172A', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {shiftTitle}
                {shift.shift_duration && (
                  <span style={{ padding: '2px 8px', borderRadius: '999px', background: '#EFF6FF', color: '#2563EB', fontWeight: 700, fontSize: '10.5px' }}>{shift.shift_duration}h</span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11.5px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <IconCalendar /> {shift.shift_date}
                </span>
                {staffCount > 0 && (
                  <span style={{ fontSize: '11px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <IconUsers /> {staffCount} staff
                  </span>
                )}
                {nozzles.length > 0 && (
                  <span style={{ fontSize: '11px', color: '#94A3B8' }}>{nozzles.length} nozzle{nozzles.length !== 1 ? 's' : ''}</span>
                )}
                {machineList.length > 0 && (
                  <span style={{ fontSize: '11px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <IconMachine /> {machineList.length} machine{machineList.length !== 1 ? 's' : ''}
                  </span>
                )}
                {isOpen && elapsed && (
                  <span style={{ fontSize: '11px', color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', background: '#DCFCE7', padding: '2px 8px', borderRadius: '5px' }}>
                    <IconClock /> {elapsed} running
                  </span>
                )}
                {isClosed && shift.opened_at && shift.closed_at && (
                  <span style={{ fontSize: '11px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <IconClock />
                    {new Date(shift.opened_at).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}
                    {' → '}
                    {new Date(shift.closed_at).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {isDraft && (
              <>
                <span style={{ padding: '3px 10px', borderRadius: '999px', background: '#FEF3C7', color: '#D97706', fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.05em' }}>DRAFT</span>
                <button onClick={onDelete} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 11px', borderRadius: '8px', border: '1.5px solid #FECACA', background: 'white', color: '#EF4444', fontWeight: 600, fontSize: '11.5px', cursor: 'pointer', fontFamily: 'inherit' }}>
                  <IconTrash /> Delete
                </button>
                <button onClick={onActivate} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '9px', border: 'none', background: 'linear-gradient(135deg, #059669, #047857)', color: 'white', fontWeight: 700, fontSize: '12.5px', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 2px 10px rgba(5,150,105,0.3)' }}>
                  <IconBolt /> Activate
                </button>
              </>
            )}
            {isOpen && !isClosing && (
              <>
                <span style={{ padding: '3px 10px', borderRadius: '999px', background: '#DCFCE7', color: '#059669', fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#059669', display: 'inline-block', animation: 'pulse 2s infinite' }} /> ACTIVE
                </span>
                <button onClick={onDelete} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 11px', borderRadius: '8px', border: '1.5px solid #FECACA', background: 'white', color: '#EF4444', fontWeight: 600, fontSize: '11.5px', cursor: 'pointer', fontFamily: 'inherit' }}>
                  <IconTrash /> Delete
                </button>
                <button onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '9px', border: 'none', background: 'linear-gradient(135deg, #1D4ED8, #2563EB)', color: 'white', fontWeight: 700, fontSize: '12.5px', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 2px 10px rgba(37,99,235,0.3)' }}>
                  Close Shift →
                </button>
              </>
            )}
            {isClosed && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button onClick={onDelete} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 11px', borderRadius: '8px', border: '1.5px solid #FECACA', background: 'white', color: '#EF4444', fontWeight: 600, fontSize: '11.5px', cursor: 'pointer', fontFamily: 'inherit' }}>
                  <IconTrash /> Delete
                </button>
                <div style={{ textAlign: 'right', minWidth: '90px' }}>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#059669', letterSpacing: '-0.02em' }}>{fmtPKR(shift.total_amount)}</div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>{fmt(shift.total_liters)} L</div>
                </div>
                <button onClick={() => setExpanded(p => !p)} style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1.5px solid #E2E8F0', background: expanded ? '#F1F5F9' : 'white', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit' }}>
                  <IconChevron up={expanded} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Per-machine summary (closed only) ── */}
        {isClosed && machineList.length > 1 && (
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px', paddingTop: '12px', borderTop: `1px solid ${borderColor}`, flexWrap: 'wrap' }}>
            {machineList.map(m => {
              if (!m) return null;
              const mNozzles = nozzles.filter(nz => nz.machine_id === m.id);
              const mAmount  = mNozzles.reduce((s, nz) => s + (nz.amount || 0), 0);
              const mLiters  = mNozzles.reduce((s, nz) => s + (nz.liters_sold || 0), 0);
              return (
                <div key={m.id} style={{ padding: '5px 10px', background: 'white', border: '1px solid #E2E8F0', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <span style={{ fontSize: '11px', color: '#334155', fontWeight: 700 }}>{m.name}</span>
                  <span style={{ width: '1px', height: '12px', background: '#E2E8F0' }} />
                  <span style={{ fontSize: '11px', color: '#64748B' }}>{fmt(mLiters)} L</span>
                  <span style={{ fontSize: '11.5px', color: '#059669', fontWeight: 700 }}>{fmtPKR(mAmount)}</span>
                </div>
              );
            })}
            {shift.note && (
              <div style={{ marginLeft: 'auto', fontSize: '11px', color: '#94A3B8', fontStyle: 'italic', maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', alignSelf: 'center' }}>
                "{shift.note}"
              </div>
            )}
          </div>
        )}
        {isClosed && shift.note && machineList.length <= 1 && (
          <div style={{ marginTop: '8px', fontSize: '11.5px', color: '#94A3B8', fontStyle: 'italic' }}>"{shift.note}"</div>
        )}
      </div>

      {/* ── Nozzle rows (collapsible for closed) ── */}
      {(expanded || !isClosed) && (
        <div style={{ padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {Object.entries(staffGroups).map(([sid, { staff, nozzles: sNozzles }]) => {
            const personLiters = sNozzles.reduce((s, nz) => s + (nz.liters_sold || 0), 0);
            const personAmount = sNozzles.reduce((s, nz) => s + (nz.amount || 0), 0);
            const hasClosed    = sNozzles.some(nz => nz.closing_reading != null);
            const hasStarted   = sNozzles.some(nz => nz.opening_reading != null);
            const machineGroups = groupByMachine(sNozzles);

            return (
              <div key={sid} style={{ border: '1.5px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden' }}>
                {/* Person header */}
                <div style={{ padding: '9px 14px', background: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #F1F5F9' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '9px', background: 'linear-gradient(135deg, #0D1B3E, #122158)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '12px', flexShrink: 0 }}>
                    {(staff?.name || 'U')[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: 700, fontSize: '13px', color: '#0F172A' }}>{staff?.name || 'Unassigned'}</span>
                    {staff?.role && <span style={{ fontSize: '11px', color: '#94A3B8', marginLeft: '6px' }}>{staff.role}</span>}
                  </div>
                  {hasClosed ? (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: '#059669' }}>{fmtPKR(personAmount)}</div>
                      <div style={{ fontSize: '10.5px', color: '#64748B' }}>{fmt(personLiters)} L</div>
                    </div>
                  ) : (
                    <span style={{ fontSize: '11px', color: hasStarted ? '#D97706' : '#94A3B8', background: hasStarted ? '#FEF3C7' : '#F1F5F9', padding: '2px 8px', borderRadius: '5px', fontWeight: 600 }}>
                      {hasStarted ? 'In progress' : 'Not started'}
                    </span>
                  )}
                </div>

                {/* Nozzles grouped by machine */}
                <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {Object.entries(machineGroups).map(([mid, { machine, nozzles: mNozzles }]) => (
                    <div key={mid}>
                      {multiMachine && machine && (
                        <div style={{ fontSize: '10px', fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '5px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <IconMachine /> {machine.name}
                        </div>
                      )}
                      {mNozzles.map(nz => {
                        const ps = getProductStyle(nz.products?.name);
                        const done = nz.closing_reading != null;
                        return (
                          <div key={nz.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', background: done ? '#FAFFFE' : 'white', borderRadius: '8px', border: `1px solid ${done ? '#D1FAE5' : '#F1F5F9'}`, flexWrap: 'wrap' }}>
                            <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: 'linear-gradient(135deg, #2563EB, #1D4ED8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '10px', flexShrink: 0 }}>
                              {nz.nozzle_number}
                            </div>
                            <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#1E293B', minWidth: '58px' }}>{nz.nozzle_name || `Nozzle ${nz.nozzle_number}`}</span>
                            <span style={{ fontSize: '11px', color: ps.color, background: ps.bg, border: `1px solid ${ps.border}`, padding: '1px 7px', borderRadius: '5px', fontWeight: 600 }}>{nz.products?.name || '—'}</span>
                            {nz.opening_reading != null && (
                              <span style={{ fontSize: '11px', color: '#64748B' }}>
                                Open <strong style={{ color: '#334155' }}>{fmt(nz.opening_reading)}</strong>
                              </span>
                            )}
                            {done ? (
                              <>
                                <span style={{ color: '#CBD5E1', fontSize: '12px' }}>→</span>
                                <span style={{ fontSize: '11px', color: '#64748B' }}>
                                  Close <strong style={{ color: '#334155' }}>{fmt(nz.closing_reading)}</strong>
                                </span>
                                <span style={{ fontSize: '12px', color: '#059669', fontWeight: 700, marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <IconDroplet /> {fmt(nz.liters_sold)} L &nbsp;·&nbsp; {fmtPKR(nz.amount)}
                                </span>
                              </>
                            ) : nz.opening_reading == null ? (
                              <span style={{ fontSize: '11px', color: '#CBD5E1', marginLeft: '2px' }}>No reading yet</span>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Closing form ── */}
      {isClosing && (
        <div style={{ borderTop: '2px solid #E2E8F0', padding: '18px', background: '#FAFBFC', animation: 'fadeIn 0.2s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px', flexWrap: 'wrap' }}>
            <div style={{ fontWeight: 800, fontSize: '14px', color: '#0F172A' }}>Enter Closing Readings</div>
            <div style={{ flex: 1 }} />
            {liveTotal > 0 && (
              <div style={{ padding: '5px 14px', background: '#F0FDF4', border: '1.5px solid #BBF7D0', borderRadius: '8px', fontSize: '15px', fontWeight: 800, color: '#059669', letterSpacing: '-0.01em' }}>
                {fmtPKR(liveTotal)}
              </div>
            )}
          </div>

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '9px', marginBottom: '16px', color: '#B91C1C', fontSize: '12.5px' }}>
              <IconAlert /> {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '18px' }}>
            {Object.entries(groupByStaff(nozzles)).map(([sid, { staff, nozzles: sNozzles }]) => {
              const pTotal = sNozzles.reduce((sum, nz) => {
                const cd  = closeData?.[nz.id] || {};
                const lit = meterReset?.[nz.id]
                  ? parseFloat(cd.closing_reading || 0)
                  : parseFloat(cd.closing_reading || 0) - parseFloat(cd.opening_reading || 0);
                const rate = nz.rate || nz.products?.selling_rate || 0;
                return sum + (!isNaN(lit) && lit > 0 ? lit * rate : 0);
              }, 0);
              const machineGroupsForm = groupByMachine(sNozzles);

              return (
                <div key={sid} style={{ background: 'white', border: '1.5px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden' }}>
                  <div style={{ padding: '10px 14px', background: '#F8FAFC', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'linear-gradient(135deg, #0D1B3E, #122158)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '12px' }}>
                      {(staff?.name || 'U')[0].toUpperCase()}
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '13px', color: '#0F172A', flex: 1 }}>{staff?.name || 'Unassigned'}</span>
                    {pTotal > 0 && <span style={{ fontWeight: 800, fontSize: '14px', color: '#059669' }}>{fmtPKR(pTotal)}</span>}
                  </div>

                  <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {Object.entries(machineGroupsForm).map(([mid, { machine, nozzles: mNozzles }]) => (
                      <div key={mid}>
                        {multiMachine && machine && (
                          <div style={{ fontSize: '10px', fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <IconMachine /> {machine.name}
                          </div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {mNozzles.map(nz => {
                            const cd   = closeData?.[nz.id] || {};
                            const lit  = meterReset?.[nz.id]
                              ? parseFloat(cd.closing_reading || 0)
                              : parseFloat(cd.closing_reading || 0) - parseFloat(cd.opening_reading || 0);
                            const validL = !isNaN(lit) && lit > 0;
                            const rate   = nz.rate || nz.products?.selling_rate || 0;
                            const amount = validL ? lit * rate : 0;
                            const ps     = getProductStyle(nz.products?.name);

                            return (
                              <div key={nz.id} style={{ padding: '12px', background: '#FAFAFA', borderRadius: '10px', border: '1px solid #F1F5F9' }}>
                                {/* Nozzle label row */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
                                  <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: 'linear-gradient(135deg, #2563EB, #1D4ED8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '10px' }}>
                                    {nz.nozzle_number}
                                  </div>
                                  <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#0F172A' }}>{nz.nozzle_name || `Nozzle ${nz.nozzle_number}`}</span>
                                  <span style={{ fontSize: '11px', color: ps.color, background: ps.bg, border: `1px solid ${ps.border}`, padding: '1px 7px', borderRadius: '5px', fontWeight: 600 }}>{nz.products?.name}</span>
                                  {rate > 0 && <span style={{ fontSize: '11px', color: '#94A3B8', marginLeft: '2px' }}>Rs. {fmt(rate)}/L</span>}
                                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '11.5px', color: meterReset?.[nz.id] ? '#D97706' : '#94A3B8', userSelect: 'none', marginLeft: 'auto', fontWeight: meterReset?.[nz.id] ? 700 : 400 }}>
                                    <input type="checkbox"
                                      checked={!!meterReset?.[nz.id]}
                                      onChange={e => {
                                        setMeterReset(p => ({ ...p, [nz.id]: e.target.checked }));
                                        setCloseErr(p => { const n = { ...p }; delete n[`${nz.id}_reading`]; delete n[`${nz.id}_opening`]; return n; });
                                      }}
                                    />
                                    Meter Reset
                                  </label>
                                </div>
                                {/* 3-column input grid */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                                  <div>
                                    <label style={lbl}>Opening Reading</label>
                                    <input type="number" step="0.01" min="0" placeholder="0.00"
                                      value={cd.opening_reading ?? ''}
                                      onChange={e => setNozzleClose(nz.id, 'opening_reading', e.target.value)}
                                      style={{ ...inp, textAlign: 'right', fontWeight: 700, borderColor: closeErr?.[`${nz.id}_opening`] ? '#FCA5A5' : undefined }}
                                    />
                                    {closeErr?.[`${nz.id}_opening`] && <p style={errS}><IconAlert />{closeErr[`${nz.id}_opening`]}</p>}
                                  </div>
                                  <div>
                                    <label style={lbl}>Closing Reading</label>
                                    <input type="number" step="0.01" min="0" placeholder="0.00"
                                      value={cd.closing_reading ?? ''}
                                      onChange={e => setNozzleClose(nz.id, 'closing_reading', e.target.value)}
                                      style={{ ...inp, textAlign: 'right', fontWeight: 700, borderColor: closeErr?.[`${nz.id}_reading`] ? '#FCA5A5' : undefined }}
                                    />
                                    {closeErr?.[`${nz.id}_reading`] && <p style={errS}><IconAlert />{closeErr[`${nz.id}_reading`]}</p>}
                                  </div>
                                  <div>
                                    <label style={lbl}>Calculated</label>
                                    <div style={{ background: validL ? '#F0FDF4' : '#F8FAFC', border: `1.5px solid ${validL ? '#BBF7D0' : '#E2E8F0'}`, borderRadius: '8px', padding: '8px 10px', textAlign: 'center', height: '37px', display: 'flex', flexDirection: 'column', justifyContent: 'center', boxSizing: 'border-box' }}>
                                      <div style={{ fontSize: '10px', color: validL ? '#059669' : '#94A3B8', fontWeight: 600 }}>{validL ? `${fmt(lit)} L` : '—'}</div>
                                      <div style={{ fontSize: '12.5px', fontWeight: 800, color: validL ? '#065F46' : '#CBD5E1', lineHeight: 1.2 }}>{validL ? fmtPKR(amount) : '—'}</div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Note */}
          <div style={{ marginBottom: '14px' }}>
            <label style={lbl}>Shift Note <span style={{ color: '#94A3B8', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
            <textarea value={closeNote} onChange={e => setCloseNote(e.target.value)}
              placeholder="Discrepancies, meter issues, remarks…"
              rows={2} style={{ ...inp, resize: 'vertical', lineHeight: '1.5' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={onSubmit} disabled={saving} style={{
              flex: 1, padding: '12px', borderRadius: '10px', border: 'none',
              background: saving ? '#94A3B8' : 'linear-gradient(135deg, #0D1B3E, #122158)',
              color: 'white', fontWeight: 700, fontSize: '13px', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              boxShadow: saving ? 'none' : '0 3px 12px rgba(13,27,62,0.3)',
            }}>
              {saving ? 'Saving…' : 'Save Readings & Continue to Payment →'}
            </button>
            <button onClick={onCancel} disabled={saving} style={{ padding: '12px 18px', borderRadius: '10px', border: '1.5px solid #E2E8F0', background: 'white', color: '#475569', fontWeight: 600, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
