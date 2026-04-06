'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { getCompany } from '../../../lib/store';

const fmt    = n => new Intl.NumberFormat('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);
const fmtPKR = n => `Rs. ${fmt(n)}`;

const IconPlus  = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconGauge = () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 6v6l4 2"/><circle cx="18" cy="6" r="3"/></svg>;
const IconAlert = () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const IconBolt  = () => <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;

const lbl  = { fontSize: '11px', fontWeight: 600, color: '#64748B', marginBottom: '4px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' };
const inp  = { width: '100%', padding: '8px 10px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '13px', color: '#1E293B', background: 'white', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };
const errS = { fontSize: '10.5px', color: '#ef4444', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '3px' };


export default function ShiftsPage() {
  const router = useRouter();
  const [shifts,    setShifts]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState({ status: 'all', date: '' });
  const [closing,    setClosing]    = useState(null);
  const [closeData,  setCloseData]  = useState({});
  const [closeErr,   setCloseErr]   = useState({});
  const [meterReset, setMeterReset] = useState({});  // { nozzle_id: bool }
  const [closeNote,  setCloseNote]  = useState('');
  const [saving,      setSaving]     = useState(false);
  const [error,       setError]      = useState('');

  const load = useCallback(async () => {
    const company = getCompany();
    if (!company) return;
    setLoading(true);
    let q = supabase
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

    if (filter.status !== 'all') q = q.eq('status', filter.status);
    if (filter.date) q = q.eq('shift_date', filter.date);

    const { data } = await q;
    const sorted = (data || []).map(s => ({
      ...s,
      shift_nozzles: (s.shift_nozzles || []).sort((a, b) => a.nozzle_number - b.nozzle_number),
    }));
    setShifts(sorted);
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const startClose = (shift) => {
    const cd = {};
    for (const nz of (shift.shift_nozzles || []))
      cd[nz.id] = {
        opening_reading: nz.opening_reading != null ? String(nz.opening_reading) : '',
        closing_reading: '',
      };
    setCloseData(cd);
    setCloseErr({});
    setMeterReset({});
    setCloseNote('');
    setError('');
    setClosing(shift.id);
  };

  const handleDeleteDraft = async (shiftId) => {
    if (!confirm('Delete this draft shift? This cannot be undone.')) return;
    await supabase.from('shift_nozzles').delete().eq('shift_id', shiftId);
    await supabase.from('shifts').delete().eq('id', shiftId);
    load();
  };

  const handleActivate = (shift) => {
    router.push(`/dashboard/shifts/${shift.id}/activate`);
  };

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
      const liters = meterReset[nz.id]
        ? Math.max(0, closingReading)
        : Math.max(0, closingReading - openingReading);
      const amount = parseFloat((liters * rate).toFixed(2));
      const { error: nErr } = await supabase.from('shift_nozzles').update({
        opening_reading: openingReading,
        closing_reading: closingReading,
        liters_sold:     parseFloat(liters.toFixed(2)),
        rate,
        amount,
      }).eq('id', nz.id);
      if (nErr) { setError('Failed to save readings. Try again.'); setSaving(false); return; }
    }

    // Save note to shift if provided
    if (closeNote.trim()) {
      await supabase.from('shifts').update({ note: closeNote.trim() }).eq('id', shift.id);
    }

    setSaving(false);
    router.push(`/dashboard/shifts/${shift.id}/payment`);
  };

  const draftShifts  = shifts.filter(s => s.status === 'draft');
  const openShifts   = shifts.filter(s => s.status === 'open');
  const closedShifts = shifts.filter(s => s.status === 'closed');

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#0F172A' }}>Shifts</h2>
          <p style={{ margin: 0, fontSize: '12px', color: '#64748B', marginTop: '2px' }}>Manage active and upcoming shifts</p>
        </div>
        {draftShifts.length === 0 && openShifts.length === 0 && !loading && (
          <button onClick={() => router.push('/dashboard/shifts/open')} style={{
            display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 16px', borderRadius: '10px', border: 'none',
            background: 'linear-gradient(135deg, #0D1B3E, #122158)', color: 'white', fontWeight: 600, fontSize: '13px',
            cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 3px 10px rgba(13,27,62,0.3)',
          }}>
            <IconPlus /> Setup Shift
          </button>
        )}
      </div>

      {/* Active shift */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: '#059669', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px', paddingLeft: '2px' }}>
          Active Shift {openShifts.length === 0 && <span style={{ color: '#94A3B8', fontWeight: 400, textTransform: 'none' }}>— none running</span>}
        </div>
        {openShifts.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
              />
            ))}
          </div>
        ) : (
          <div style={{ padding: '18px 20px', background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', color: '#94A3B8', fontSize: '13px' }}>
            {draftShifts.length > 0 ? 'No active shift — activate the shift below when the team is ready.' : 'No shifts yet. Use "Setup Shift" to configure your machines and staff.'}
          </div>
        )}
      </div>

      {/* Inactive / draft shifts */}
      {draftShifts.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#D97706', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px', paddingLeft: '2px' }}>
            Inactive Shifts ({draftShifts.length})
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {draftShifts.map(shift => (
              <ShiftCard key={shift.id} shift={shift}
                onActivate={() => handleActivate(shift)}
                onDelete={() => handleDeleteDraft(shift.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Closed shifts */}
      {closedShifts.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Closed ({closedShifts.length})</div>
            <input type="date" value={filter.date} onChange={e => setFilter(p => ({ ...p, date: e.target.value }))}
              style={{ padding: '4px 8px', border: '1.5px solid #E2E8F0', borderRadius: '7px', fontSize: '11px', color: '#1E293B', fontFamily: 'inherit', marginLeft: 'auto' }}
            />
            {filter.date && (
              <button onClick={() => setFilter(p => ({ ...p, date: '' }))} style={{ padding: '4px 9px', borderRadius: '7px', border: '1.5px solid #E2E8F0', background: 'white', color: '#64748B', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit' }}>Clear</button>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {closedShifts
              .filter(s => !filter.date || s.shift_date === filter.date)
              .map(shift => <ShiftCard key={shift.id} shift={shift} />)}
          </div>
        </div>
      )}

      {!loading && shifts.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '11px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: '#2563EB' }}><IconGauge /></div>
          <div style={{ fontWeight: 600, color: '#1E293B', fontSize: '14px' }}>No shifts yet</div>
          <div style={{ color: '#64748B', fontSize: '12px', marginTop: '4px' }}>Click "Setup Shift" to configure your machines and staff — only needed once</div>
        </div>
      )}
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function groupByStaff(nozzles) {
  const groups = {};
  for (const nz of nozzles) {
    const sid = nz.staff_id || '__unassigned__';
    if (!groups[sid]) groups[sid] = { staff: nz.staff, nozzles: [] };
    groups[sid].nozzles.push(nz);
  }
  return groups;
}

// ─── Shift Card ───────────────────────────────────────────────────────────────

function ShiftCard({ shift, isClosing, closeData, setNozzleClose, closeErr, meterReset, setMeterReset, closeNote, setCloseNote, saving, error, onClose, onSubmit, onCancel, onActivate, onDelete }) {
  const isDraft  = shift.status === 'draft';
  const isOpen   = shift.status === 'open';
  const isClosed = shift.status === 'closed';

  const nozzles = (shift.shift_nozzles || []).sort((a, b) => a.nozzle_number - b.nozzle_number);
  const machineMap = {};
  for (const nz of nozzles) { if (nz.machine_id && !machineMap[nz.machine_id]) machineMap[nz.machine_id] = nz.machines; }
  const machineList = Object.values(machineMap);
  const multiMachine = machineList.length > 1;

  const staffGroups  = groupByStaff(nozzles);
  const borderColor  = isDraft ? '#FDE68A' : isOpen ? '#BBF7D0' : '#E2E8F0';
  const shiftTitle   = shift.shift_name || (machineList.map(m => m?.name).filter(Boolean).join(' · ') || 'Shift');

  return (
    <div style={{ background: 'white', borderRadius: '12px', border: `1px solid ${borderColor}`, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>

      {/* ── Shift header ── */}
      <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', borderBottom: '1px solid #F1F5F9' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: isDraft ? '#FEF3C7' : isOpen ? '#DCFCE7' : '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDraft ? '#D97706' : isOpen ? '#059669' : '#64748B', flexShrink: 0 }}>
            <IconGauge />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {shiftTitle}
              {shift.shift_duration && (
                <span style={{ padding: '1px 7px', borderRadius: '999px', background: '#EFF6FF', color: '#2563EB', fontWeight: 600, fontSize: '10.5px' }}>
                  {shift.shift_duration}h
                </span>
              )}
              {machineList.map(m => m?.name).filter(Boolean).map(name => (
                <span key={name} style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 400 }}>{name}</span>
              ))}
            </div>
            <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>{shift.shift_date}</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isDraft && (
            <>
              <span style={{ padding: '3px 10px', borderRadius: '999px', background: '#FEF3C7', color: '#D97706', fontSize: '11px', fontWeight: 700 }}>DRAFT</span>
              <button onClick={onDelete} style={{ padding: '6px 10px', borderRadius: '7px', border: '1.5px solid #FECACA', background: '#FEF2F2', color: '#EF4444', fontWeight: 600, fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit' }}>
                Delete
              </button>
              <button onClick={onActivate} style={{
                display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '8px',
                border: 'none', background: 'linear-gradient(135deg, #059669, #047857)', color: 'white',
                fontWeight: 600, fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: '0 2px 8px rgba(5,150,105,0.3)',
              }}>
                <IconBolt /> Activate
              </button>
            </>
          )}
          {isOpen && !isClosing && (
            <>
              <span style={{ padding: '3px 10px', borderRadius: '999px', background: '#DCFCE7', color: '#059669', fontSize: '11px', fontWeight: 700 }}>ACTIVE</span>
              <button onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '8px', border: '1.5px solid #2563EB', background: '#EFF6FF', color: '#2563EB', fontWeight: 600, fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>
                Close Shift
              </button>
            </>
          )}
          {isClosed && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#059669' }}>{fmtPKR(shift.total_amount)}</div>
              <div style={{ fontSize: '11px', color: '#64748B' }}>{fmt(shift.total_liters)} Ltr</div>
            </div>
          )}
        </div>
      </div>

      {/* ── Per-person rows ── */}
      <div style={{ padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {Object.entries(staffGroups).map(([sid, { staff, nozzles: sNozzles }]) => {
          const personLiters = sNozzles.reduce((s, nz) => s + (nz.liters_sold || 0), 0);
          const personAmount = sNozzles.reduce((s, nz) => s + (nz.amount     || 0), 0);
          const hasClosed    = sNozzles.some(nz => nz.closing_reading != null);
          const hasStarted   = sNozzles.some(nz => nz.opening_reading != null);

          return (
            <div key={sid} style={{ border: '1.5px solid #E2E8F0', borderRadius: '10px', overflow: 'hidden' }}>
              {/* Person header */}
              <div style={{ padding: '8px 12px', background: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #F1F5F9' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'linear-gradient(135deg, #0D1B3E, #122158)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '12px', flexShrink: 0 }}>
                  {(staff?.name || 'U')[0].toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 700, fontSize: '13px', color: '#0F172A' }}>{staff?.name || 'Unassigned'}</span>
                  {staff?.role && <span style={{ fontSize: '11px', color: '#94A3B8', marginLeft: '6px' }}>{staff.role}</span>}
                </div>
                {hasClosed && (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#059669' }}>{fmtPKR(personAmount)}</div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>{fmt(personLiters)} Ltr</div>
                  </div>
                )}
                {!hasClosed && !hasStarted && (
                  <span style={{ fontSize: '11px', color: '#94A3B8', fontStyle: 'italic' }}>Not started</span>
                )}
              </div>

              {/* Nozzle rows under this person */}
              <div style={{ padding: '6px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {sNozzles.map(nz => (
                  <div key={nz.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 8px', background: 'white', borderRadius: '6px', flexWrap: 'wrap' }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '5px', background: 'linear-gradient(135deg, #2563EB, #1D4ED8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '10px', flexShrink: 0 }}>
                      {nz.nozzle_number}
                    </div>
                    {multiMachine && (
                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#2563EB', background: '#EFF6FF', padding: '1px 5px', borderRadius: '4px' }}>{nz.machines?.name}</span>
                    )}
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>{nz.nozzle_name || `Nozzle ${nz.nozzle_number}`}</span>
                    <span style={{ fontSize: '11px', color: '#94A3B8', background: '#F1F5F9', padding: '1px 6px', borderRadius: '4px' }}>{nz.products?.name || '—'}</span>
                    {nz.opening_reading != null && (
                      <span style={{ fontSize: '11px', color: '#64748B' }}>
                        Open <strong style={{ color: '#334155' }}>{fmt(nz.opening_reading)}</strong>
                      </span>
                    )}
                    {nz.closing_reading != null && (
                      <>
                        <span style={{ color: '#CBD5E1', fontSize: '11px' }}>→</span>
                        <span style={{ fontSize: '11px', color: '#64748B' }}>
                          Close <strong style={{ color: '#334155' }}>{fmt(nz.closing_reading)}</strong>
                        </span>
                        <span style={{ fontSize: '11.5px', color: '#059669', fontWeight: 700, marginLeft: 'auto' }}>
                          {fmt(nz.liters_sold)} Ltr · {fmtPKR(nz.amount)}
                        </span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Closing form (grouped by person) ── */}
      {isClosing && (
        <div style={{ borderTop: '1px solid #E2E8F0', padding: '16px', background: '#FAFBFC' }}>
          <div style={{ fontWeight: 700, fontSize: '13px', color: '#0F172A', marginBottom: '14px' }}>Enter Closing Readings</div>

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 12px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', marginBottom: '12px', color: '#B91C1C', fontSize: '12px' }}>
              <IconAlert />{error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
            {Object.entries(staffGroups).map(([sid, { staff, nozzles: sNozzles }]) => {
              const personTotal = sNozzles.reduce((sum, nz) => {
                const cd     = closeData[nz.id] || {};
                const rawLit = meterReset?.[nz.id]
                  ? parseFloat(cd.closing_reading || 0)
                  : parseFloat(cd.closing_reading || 0) - parseFloat(cd.opening_reading || 0);
                const valid  = !isNaN(rawLit) && rawLit > 0;
                const rate   = nz.rate || nz.products?.selling_rate || 0;
                return sum + (valid ? rawLit * rate : 0);
              }, 0);
              const allFilled = sNozzles.every(nz => {
                const ov = closeData[nz.id]?.opening_reading;
                const cv = closeData[nz.id]?.closing_reading;
                return ov !== '' && ov !== undefined && !isNaN(+ov) &&
                       cv !== '' && cv !== undefined && !isNaN(+cv) && +cv >= +ov;
              });

              return (
                <div key={sid} style={{ background: 'white', border: '1.5px solid #E2E8F0', borderRadius: '11px', overflow: 'hidden' }}>
                  {/* Person header */}
                  <div style={{ padding: '9px 14px', background: '#F8FAFC', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '26px', height: '26px', borderRadius: '7px', background: 'linear-gradient(135deg, #0D1B3E, #122158)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '12px' }}>
                      {(staff?.name || 'U')[0].toUpperCase()}
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '13px', color: '#0F172A', flex: 1 }}>{staff?.name || 'Unassigned'}</span>
                    {allFilled && personTotal > 0 && (
                      <span style={{ fontWeight: 800, fontSize: '14px', color: '#059669' }}>{fmtPKR(personTotal)}</span>
                    )}
                  </div>

                  {/* Nozzle reading inputs */}
                  <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {sNozzles.map(nz => {
                      const cd     = closeData[nz.id] || {};
                      const liters = meterReset?.[nz.id]
                        ? parseFloat(cd.closing_reading || 0)
                        : parseFloat(cd.closing_reading || 0) - parseFloat(cd.opening_reading || 0);
                      const validLiters = !isNaN(liters) && liters > 0;
                      const rate   = nz.rate || nz.products?.selling_rate || 0;
                      const amount = validLiters ? liters * rate : 0;
                      return (
                        <div key={nz.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px', alignItems: 'end' }}>
                          <div>
                            <label style={lbl}>
                              {nz.nozzle_name || `Nozzle ${nz.nozzle_number}`}
                              {multiMachine && <span style={{ color: '#94A3B8', fontWeight: 400 }}> · {nz.machines?.name}</span>}
                            </label>
                            <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '6px' }}>{nz.products?.name}</div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '11px', color: meterReset?.[nz.id] ? '#D97706' : '#94A3B8', userSelect: 'none' }}>
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
                          <div>
                            <label style={lbl}>Opening Reading</label>
                            <input type="number" step="0.01" min="0" placeholder="0.00"
                              value={cd.opening_reading ?? ''}
                              onChange={e => setNozzleClose(nz.id, 'opening_reading', e.target.value)}
                              style={{ ...inp, textAlign: 'right', fontWeight: 700, borderColor: closeErr[`${nz.id}_opening`] ? '#FCA5A5' : undefined }}
                            />
                            {closeErr[`${nz.id}_opening`] && <p style={errS}><IconAlert />{closeErr[`${nz.id}_opening`]}</p>}
                          </div>
                          <div>
                            <label style={lbl}>Closing Reading</label>
                            <input type="number" step="0.01" min="0" placeholder="0.00"
                              value={cd.closing_reading ?? ''}
                              onChange={e => setNozzleClose(nz.id, 'closing_reading', e.target.value)}
                              style={{ ...inp, textAlign: 'right', fontWeight: 700, borderColor: closeErr[`${nz.id}_reading`] ? '#FCA5A5' : undefined }}
                            />
                            {closeErr[`${nz.id}_reading`] && <p style={errS}><IconAlert />{closeErr[`${nz.id}_reading`]}</p>}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                            <div style={{ background: validLiters ? '#F0FDF4' : '#F8FAFC', border: `1px solid ${validLiters ? '#BBF7D0' : '#E2E8F0'}`, borderRadius: '8px', padding: '8px 10px', width: '100%', textAlign: 'center' }}>
                              <div style={{ fontSize: '10px', color: validLiters ? '#059669' : '#94A3B8', fontWeight: 600 }}>{validLiters ? `${fmt(liters)} Ltr` : '—'}</div>
                              <div style={{ fontSize: '13px', fontWeight: 800, color: validLiters ? '#065F46' : '#CBD5E1' }}>{validLiters ? fmtPKR(amount) : '—'}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Note field */}
          <div style={{ marginBottom: '12px' }}>
            <label style={lbl}>Shift Note <span style={{ color: '#94A3B8', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional — discrepancies, remarks…)</span></label>
            <textarea
              value={closeNote}
              onChange={e => setCloseNote(e.target.value)}
              placeholder="e.g. Nozzle 2 was slow, meter replaced on Nozzle 4…"
              rows={2}
              style={{ ...inp, resize: 'vertical', lineHeight: '1.5' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={onSubmit} disabled={saving} style={{
              flex: 1, padding: '11px', borderRadius: '9px', border: 'none',
              background: saving ? 'rgba(37,99,235,0.5)' : 'linear-gradient(135deg, #0D1B3E, #122158)',
              color: 'white', fontWeight: 700, fontSize: '13px', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              boxShadow: saving ? 'none' : '0 3px 10px rgba(13,27,62,0.3)',
            }}>
              {saving ? 'Saving…' : 'Save Readings & Continue to Payment →'}
            </button>
            <button onClick={onCancel} disabled={saving} style={{ padding: '11px 18px', borderRadius: '9px', border: '1.5px solid #E2E8F0', background: 'white', color: '#475569', fontWeight: 600, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
