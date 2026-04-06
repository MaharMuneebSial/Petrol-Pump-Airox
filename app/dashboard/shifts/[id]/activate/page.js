'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '../../../../../lib/supabase';
import { getCompany } from '../../../../../lib/store';

const fmt = n => new Intl.NumberFormat('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);

const IconBack  = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>;
const IconAlert = () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const IconBolt  = () => <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
const IconEdit  = () => <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;

const lbl  = { fontSize: '11px', fontWeight: 600, color: '#64748B', marginBottom: '4px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' };
const inp  = { width: '100%', padding: '8px 10px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '13px', color: '#1E293B', background: 'white', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };
const errS = { fontSize: '10.5px', color: '#ef4444', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '3px' };

export default function ActivateShiftPage() {
  const router  = useRouter();
  const { id }  = useParams();
  const company = getCompany();

  const [shift,          setShift]          = useState(null);
  const [staffList,      setStaffList]       = useState([]);
  const [shiftDate,      setShiftDate]       = useState(new Date().toISOString().split('T')[0]);
  const [readings,       setReadings]        = useState({});   // { nozzle_id: string }
  const [hints,          setHints]           = useState({});   // { nozzle_id: string }
  const [staffOverrides, setStaffOverrides]  = useState({});   // { nozzle_id: staff_id }
  const [editingStaff,   setEditingStaff]    = useState({});   // { nozzle_id: bool }
  const [errors,         setErrors]          = useState({});
  const [saving,         setSaving]          = useState(false);
  const [loading,        setLoading]         = useState(true);
  const [globalErr,      setGlobalErr]       = useState('');

  useEffect(() => {
    if (!company) { router.push('/dashboard/shifts'); return; }
    loadAll();
  }, [id]);

  const loadAll = async () => {
    // Load shift + staff in parallel
    const [shiftRes, staffRes] = await Promise.all([
      supabase.from('shifts')
        .select(`id, shift_name, shift_date, shift_duration, status,
          shift_nozzles(id, nozzle_number, nozzle_name, machine_id, staff_id, product_id,
            machines(id, name, machine_no),
            staff(id, name, role),
            products(id, name, selling_rate, unit)
          )
        `)
        .eq('id', id)
        .single(),
      supabase.from('staff')
        .select('id, name, role')
        .eq('company_id', company.id)
        .eq('is_active', true),
    ]);

    if (!shiftRes.data || shiftRes.data.status !== 'draft') {
      router.push('/dashboard/shifts');
      return;
    }

    setStaffList(staffRes.data || []);

    const nozzles = (shiftRes.data.shift_nozzles || []).sort((a, b) => {
      if (a.machine_id !== b.machine_id) return String(a.machine_id).localeCompare(String(b.machine_id));
      return a.nozzle_number - b.nozzle_number;
    });

    // ── Batch query for last closing readings (Fix: 2 queries instead of N+1, ordered by closed_at) ──
    const machineIds = [...new Set(nozzles.map(nz => nz.machine_id))];

    // Step 1: get last closed shifts ordered by closed_at
    const { data: closedShifts } = await supabase
      .from('shifts')
      .select('id')
      .eq('company_id', company.id)
      .eq('status', 'closed')
      .order('closed_at', { ascending: false })
      .limit(30);

    // Step 2: get closing readings for those shifts + these machines
    const closedIds = (closedShifts || []).map(s => s.id);
    let history = [];
    if (closedIds.length > 0 && machineIds.length > 0) {
      const { data } = await supabase
        .from('shift_nozzles')
        .select('machine_id, nozzle_number, closing_reading, shift_id')
        .in('machine_id', machineIds)
        .in('shift_id', closedIds)
        .eq('company_id', company.id)
        .not('closing_reading', 'is', null);
      history = data || [];
    }

    // Step 3: machine initial readings as fallback
    const { data: machineNozzles } = await supabase
      .from('machine_nozzles')
      .select('machine_id, nozzle_number, initial_reading')
      .in('machine_id', machineIds);
    const initialMap = {};
    for (const mn of (machineNozzles || [])) {
      initialMap[`${mn.machine_id}_${mn.nozzle_number}`] = mn.initial_reading;
    }

    // Step 4: pick the most recent closing reading per machine+nozzle
    // closedIds is already ordered by closed_at desc — first match wins
    const lastReadingMap = {};
    for (const shiftId of closedIds) {
      for (const h of history.filter(h => h.shift_id === shiftId)) {
        const key = `${h.machine_id}_${h.nozzle_number}`;
        if (lastReadingMap[key] == null) lastReadingMap[key] = h.closing_reading;
      }
    }

    const readingsInit = {};
    const hintsInit    = {};
    for (const nz of nozzles) {
      const key          = `${nz.machine_id}_${nz.nozzle_number}`;
      const lastReading  = lastReadingMap[key];
      const initReading  = initialMap[key];
      if (lastReading != null) {
        readingsInit[nz.id] = String(lastReading);
        hintsInit[nz.id]    = `Last close: ${fmt(lastReading)}`;
      } else if (initReading != null) {
        readingsInit[nz.id] = String(initReading);
        hintsInit[nz.id]    = `Initial: ${fmt(initReading)}`;
      } else {
        readingsInit[nz.id] = '';
        hintsInit[nz.id]    = null;
      }
    }

    setShift({ ...shiftRes.data, shift_nozzles: nozzles });
    setReadings(readingsInit);
    setHints(hintsInit);
    setLoading(false);
  };

  const validate = () => {
    const e = {};
    for (const nz of (shift?.shift_nozzles || [])) {
      const v = readings[nz.id];
      if (v === '' || v === undefined) e[nz.id] = 'Required';
      else if (isNaN(+v) || +v < 0)   e[nz.id] = 'Invalid number';
    }
    return e;
  };

  const handleActivate = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true); setGlobalErr('');

    // ── Check: only one shift can be active at a time ──
    const { data: openShifts } = await supabase
      .from('shifts')
      .select('id, shift_name')
      .eq('company_id', company.id)
      .eq('status', 'open');

    if (openShifts && openShifts.length > 0) {
      const name = openShifts[0].shift_name || 'another shift';
      setGlobalErr(`A shift is already active (${name}). Close it first before activating a new one.`);
      setSaving(false);
      return;
    }

    // ── Save opening readings + rate + any staff overrides per nozzle ──
    for (const nz of (shift.shift_nozzles || [])) {
      const patch = {
        opening_reading: parseFloat(readings[nz.id]),
        rate:            nz.products?.selling_rate || 0,  // Fix: store rate at activation time
      };
      if (staffOverrides[nz.id]) patch.staff_id = staffOverrides[nz.id];

      const { error } = await supabase.from('shift_nozzles').update(patch).eq('id', nz.id);
      if (error) { setGlobalErr(`Failed to save reading: ${error.message}`); setSaving(false); return; }
    }

    const { error } = await supabase.from('shifts')
      .update({ status: 'open', opened_at: new Date().toISOString(), shift_date: shiftDate })
      .eq('id', id);
    if (error) { setGlobalErr(`Failed to activate: ${error.message}`); setSaving(false); return; }

    router.push('/dashboard/shifts');
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#64748B', fontSize: '13px' }}>Loading shift…</div>;
  }

  const machineGroups = {};
  for (const nz of (shift?.shift_nozzles || [])) {
    if (!machineGroups[nz.machine_id]) machineGroups[nz.machine_id] = { machine: nz.machines, nozzles: [] };
    machineGroups[nz.machine_id].nozzles.push(nz);
  }

  const shiftTitle = shift.shift_name || Object.values(machineGroups).map(g => g.machine?.name).filter(Boolean).join(' · ') || 'Shift';

  return (
    <div style={{ maxWidth: '800px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '22px' }}>
        <button onClick={() => router.back()} style={{ width: '34px', height: '34px', borderRadius: '9px', background: 'white', border: '1.5px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569', flexShrink: 0 }}>
          <IconBack />
        </button>
        <div>
          <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#0F172A' }}>Activate — {shiftTitle}</h2>
          <p style={{ margin: 0, fontSize: '12px', color: '#64748B', marginTop: '2px' }}>Confirm date, staff, and opening readings — then start</p>
        </div>
      </div>

      {globalErr && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '9px', marginBottom: '16px', color: '#B91C1C', fontSize: '12.5px' }}>
          <IconAlert />{globalErr}
        </div>
      )}

      {/* Date + duration */}
      <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #E2E8F0', padding: '12px 16px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ flex: 1 }}>
          <label style={lbl}>Shift Date</label>
          <input type="date" value={shiftDate} onChange={e => setShiftDate(e.target.value)} style={inp} />
        </div>
        <div style={{ paddingTop: '16px', fontSize: '12px', color: '#64748B' }}>
          {shift.shift_duration}h shift
        </div>
      </div>

      {/* Machine groups */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '18px' }}>
        {Object.entries(machineGroups).map(([mid, group]) => (
          <div key={mid} style={{ background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ background: 'linear-gradient(135deg, #0a1540, #0f1f5c)', padding: '11px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: 'white', fontWeight: 700, fontSize: '13px' }}>{group.machine?.name}</span>
              <span style={{ color: '#93C5FD', fontSize: '11px' }}>#{group.machine?.machine_no}</span>
              <span style={{ color: '#93C5FD', fontSize: '11px', marginLeft: 'auto' }}>{group.nozzles.length} nozzle{group.nozzles.length > 1 ? 's' : ''}</span>
            </div>

            <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {group.nozzles.map(nz => {
                const currentStaffId = staffOverrides[nz.id] || nz.staff_id;
                const currentStaff   = staffList.find(s => s.id === currentStaffId) || nz.staff;
                const isEditingThisStaff = editingStaff[nz.id];

                return (
                  <div key={nz.id} style={{ background: '#F8FAFC', border: `1.5px solid ${errors[nz.id] ? '#FCA5A5' : '#E2E8F0'}`, borderRadius: '10px', padding: '12px 14px' }}>
                    {/* Nozzle top row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
                      <div style={{ width: '26px', height: '26px', borderRadius: '7px', background: 'linear-gradient(135deg, #2563EB, #1D4ED8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '11px', flexShrink: 0 }}>
                        {nz.nozzle_number}
                      </div>
                      <span style={{ fontWeight: 700, fontSize: '13px', color: '#0F172A' }}>
                        {nz.nozzle_name || `Nozzle ${nz.nozzle_number}`}
                      </span>
                      {nz.products && (
                        <span style={{ fontSize: '11px', color: '#0369A1', background: '#E0F2FE', padding: '1px 7px', borderRadius: '5px', border: '1px solid #BAE6FD' }}>
                          {nz.products.name}
                        </span>
                      )}
                      {nz.products?.selling_rate && (
                        <span style={{ fontSize: '11px', color: '#7C3AED', fontWeight: 600, background: '#F5F3FF', padding: '1px 7px', borderRadius: '5px', border: '1px solid #DDD6FE', marginLeft: 'auto' }}>
                          Rs. {nz.products.selling_rate}/Ltr
                        </span>
                      )}
                    </div>

                    {/* Staff row */}
                    <div style={{ marginBottom: '10px' }}>
                      <label style={lbl}>Operator</label>
                      {isEditingThisStaff ? (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <select
                            value={staffOverrides[nz.id] || nz.staff_id || ''}
                            onChange={e => {
                              setStaffOverrides(p => ({ ...p, [nz.id]: e.target.value }));
                            }}
                            style={{ ...inp, cursor: 'pointer', flex: 1 }}
                          >
                            <option value="">Select staff…</option>
                            {staffList.map(s => <option key={s.id} value={s.id}>{s.name} — {s.role}</option>)}
                          </select>
                          <button
                            type="button"
                            onClick={() => setEditingStaff(p => ({ ...p, [nz.id]: false }))}
                            style={{ padding: '0 12px', borderRadius: '8px', border: '1.5px solid #BBF7D0', background: '#F0FDF4', color: '#059669', fontWeight: 600, fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
                          >
                            Done
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', background: 'white', border: '1.5px solid #E2E8F0', borderRadius: '8px' }}>
                          <span style={{ flex: 1, fontSize: '13px', color: '#1E293B', fontWeight: 500 }}>
                            {currentStaff?.name || '—'}
                            {currentStaff?.role && <span style={{ color: '#94A3B8', fontSize: '11px', marginLeft: '6px' }}>{currentStaff.role}</span>}
                          </span>
                          <button
                            type="button"
                            onClick={() => setEditingStaff(p => ({ ...p, [nz.id]: true }))}
                            style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 9px', borderRadius: '6px', border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#64748B', fontWeight: 600, fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit' }}
                          >
                            <IconEdit /> Change
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Opening reading */}
                    <div>
                      <label style={lbl}>
                        Opening Reading <span style={{ color: '#ef4444' }}>*</span>
                        {hints[nz.id] && (
                          <span style={{ marginLeft: '8px', color: '#059669', fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>
                            ({hints[nz.id]})
                          </span>
                        )}
                      </label>
                      <input
                        type="number" step="0.01" min="0" placeholder="0.00"
                        value={readings[nz.id] ?? ''}
                        onChange={e => {
                          setReadings(p => ({ ...p, [nz.id]: e.target.value }));
                          setErrors(p => { const n = { ...p }; delete n[nz.id]; return n; });
                        }}
                        style={{ ...inp, textAlign: 'right', fontWeight: 700, fontSize: '14px', borderColor: errors[nz.id] ? '#FCA5A5' : undefined }}
                      />
                      {errors[nz.id] && <p style={errS}><IconAlert />{errors[nz.id]}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <button onClick={handleActivate} disabled={saving} style={{
        width: '100%', padding: '13px', borderRadius: '10px', border: 'none',
        background: saving ? 'rgba(5,150,105,0.5)' : 'linear-gradient(135deg, #059669, #047857)',
        color: 'white', fontWeight: 700, fontSize: '14px', cursor: saving ? 'not-allowed' : 'pointer',
        fontFamily: 'inherit', boxShadow: saving ? 'none' : '0 4px 14px rgba(5,150,105,0.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
      }}>
        {saving ? 'Activating…' : <><IconBolt /> Activate Shift — Start Now</>}
      </button>
    </div>
  );
}
