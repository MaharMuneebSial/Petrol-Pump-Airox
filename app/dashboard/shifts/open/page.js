'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../../lib/supabase';
import { getCompany } from '../../../../lib/store';

const IconBack  = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>;
const IconAlert = () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const IconPlus  = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconX     = () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IconCheck = () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>;
const IconBolt  = () => <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
const IconSave  = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>;

const lbl  = { fontSize: '11px', fontWeight: 600, color: '#64748B', marginBottom: '4px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' };
const inp  = { width: '100%', padding: '8px 10px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '13px', color: '#1E293B', background: 'white', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };
const errS = { fontSize: '10.5px', color: '#ef4444', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '3px' };

export default function CreateShiftPage() {
  const router = useRouter();
  const [machines,      setMachines]      = useState([]);
  const [staffList,     setStaffList]     = useState([]);
  const [saving,        setSaving]        = useState(false);
  const [globalErr,     setGlobalErr]     = useState('');
  const [errors,        setErrors]        = useState({});
  const [shiftName,     setShiftName]     = useState('');
  const [shiftDate,     setShiftDate]     = useState(new Date().toISOString().split('T')[0]);
  const [shiftDuration, setShiftDuration] = useState('24');
  const [machineBlocks, setMachineBlocks] = useState([]);

  useEffect(() => {
    const company = getCompany();
    if (!company) return;
    Promise.all([
      supabase.from('machines').select('id, name, machine_no, nozzle_count').eq('company_id', company.id).eq('is_active', true),
      supabase.from('staff').select('id, name, role').eq('company_id', company.id).eq('is_active', true),
    ]).then(([mRes, sRes]) => {
      setMachines(mRes.data || []);
      setStaffList(sRes.data || []);
    });
  }, []);

  const addMachineBlock = () => {
    setMachineBlocks(p => [...p, { blockId: `b_${Date.now()}`, machine_id: '', machine: null, nozzleData: {}, quickStaff: '', loading: false }]);
  };

  const removeMachineBlock = (blockId) => {
    setMachineBlocks(p => p.filter(b => b.blockId !== blockId));
    setErrors(p => { const n = { ...p }; Object.keys(n).filter(k => k.startsWith(`${blockId}_`)).forEach(k => delete n[k]); return n; });
  };

  const handleMachineSelect = async (blockId, machineId) => {
    const machine = machines.find(m => m.id === machineId) || null;
    setMachineBlocks(p => p.map(b => b.blockId === blockId ? { ...b, machine_id: machineId, machine, nozzleData: {}, quickStaff: '', loading: !!machineId } : b));
    setErrors(p => { const n = { ...p }; Object.keys(n).filter(k => k.startsWith(`${blockId}_`)).forEach(k => delete n[k]); return n; });
    if (!machine) return;

    const { data: configs } = await supabase
      .from('machine_nozzles')
      .select('nozzle_number, nozzle_name, product_id')
      .eq('machine_id', machineId);
    const configMap = {};
    for (const c of (configs || [])) configMap[c.nozzle_number] = c;

    const nozzleData = {};
    for (let i = 1; i <= machine.nozzle_count; i++) {
      const c = configMap[i] || {};
      nozzleData[i] = {
        nozzle_name: c.nozzle_name || `Nozzle ${i}`,
        product_id:  c.product_id  || '',
        staff_id:    '',
      };
    }
    setMachineBlocks(p => p.map(b => b.blockId === blockId ? { ...b, nozzleData, loading: false } : b));
  };

  const setNozzle = (blockId, num, field, value) => {
    setMachineBlocks(p => p.map(b => {
      if (b.blockId !== blockId) return b;
      return { ...b, nozzleData: { ...b.nozzleData, [num]: { ...b.nozzleData[num], [field]: value } } };
    }));
    setErrors(p => { const n = { ...p }; delete n[`${blockId}_n${num}_${field}`]; return n; });
  };

  const applyQuickStaff = (blockId) => {
    const block = machineBlocks.find(b => b.blockId === blockId);
    if (!block?.quickStaff) return;
    setMachineBlocks(p => p.map(b => {
      if (b.blockId !== blockId) return b;
      const nd = {};
      for (const [num, data] of Object.entries(b.nozzleData)) nd[num] = { ...data, staff_id: b.quickStaff };
      return { ...b, nozzleData: nd };
    }));
  };

  const validate = () => {
    const e = {};
    if (!shiftDate) e.shiftDate = 'Required';
    if (machineBlocks.length === 0) e.machines = 'Add at least one machine';
    const usedIds = [];
    for (const block of machineBlocks) {
      if (!block.machine_id) { e[`${block.blockId}_machine`] = 'Select a machine'; continue; }
      if (usedIds.includes(block.machine_id)) { e[`${block.blockId}_machine`] = 'Already added'; }
      else usedIds.push(block.machine_id);
      for (const [num, nd] of Object.entries(block.nozzleData)) {
        if (!nd.staff_id) e[`${block.blockId}_n${num}_staff_id`] = 'Required';
      }
    }
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true); setGlobalErr('');
    const company = getCompany();
    if (!company?.id) { setGlobalErr('Session error.'); setSaving(false); return; }

    try {
      const { data: shift, error: shiftErr } = await supabase.from('shifts').insert({
        company_id:     company.id,
        shift_name:     shiftName.trim() || null,
        shift_date:     shiftDate,
        shift_duration: parseInt(shiftDuration),
        status:         'draft',
      }).select('id').single();
      if (shiftErr || !shift) { setGlobalErr(`Failed: ${shiftErr?.message}`); setSaving(false); return; }

      const rows = [];
      for (const block of machineBlocks) {
        for (const [num, nd] of Object.entries(block.nozzleData)) {
          rows.push({
            shift_id:      shift.id,
            company_id:    company.id,
            machine_id:    block.machine_id,
            nozzle_number: parseInt(num),
            nozzle_name:   nd.nozzle_name,
            staff_id:      nd.staff_id,
            product_id:    nd.product_id,
          });
        }
      }
      const { error: nErr } = await supabase.from('shift_nozzles').insert(rows);
      if (nErr) {
        await supabase.from('shifts').delete().eq('id', shift.id);
        setGlobalErr(`Failed to save nozzles: ${nErr.message}`);
        setSaving(false);
        return;
      }

      router.push('/dashboard/shifts');
    } catch (ex) { setGlobalErr(`Error: ${ex.message}`); setSaving(false); }
  };

  const usedMachineIds = machineBlocks.map(b => b.machine_id).filter(Boolean);

  return (
    <div style={{ maxWidth: '900px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '22px' }}>
        <button onClick={() => router.back()} style={{ width: '34px', height: '34px', borderRadius: '9px', background: 'white', border: '1.5px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569', flexShrink: 0 }}>
          <IconBack />
        </button>
        <div>
          <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#0F172A' }}>Create Shift</h2>
          <p style={{ margin: 0, fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
            Set up machines & staff once — activate each time a new team starts
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {globalErr && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '9px', marginBottom: '16px', color: '#B91C1C', fontSize: '12.5px' }}>
            <IconAlert />{globalErr}
          </div>
        )}

        {/* Shift Info */}
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '16px', marginBottom: '14px', display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr', gap: '14px' }}>
          <div>
            <label style={lbl}>
              Shift Name <span style={{ color: '#94A3B8', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
            </label>
            <input value={shiftName} onChange={e => setShiftName(e.target.value)} placeholder="e.g. Morning Shift" style={inp} />
          </div>
          <div>
            <label style={lbl}>Date <span style={{ color: '#ef4444' }}>*</span></label>
            <input type="date" value={shiftDate} onChange={e => setShiftDate(e.target.value)} style={inp} />
            {errors.shiftDate && <p style={errS}><IconAlert />{errors.shiftDate}</p>}
          </div>
          <div>
            <label style={lbl}>Duration</label>
            <select value={shiftDuration} onChange={e => setShiftDuration(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
              <option value="6">6 Hours</option>
              <option value="8">8 Hours</option>
              <option value="12">12 Hours</option>
              <option value="24">24 Hours</option>
            </select>
          </div>
        </div>

        {/* Machine Blocks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '12px' }}>
          {machineBlocks.map((block, idx) => (
            <MachineBlock key={block.blockId} block={block} idx={idx}
              availableMachines={machines.filter(m => !usedMachineIds.includes(m.id) || m.id === block.machine_id)}
              staffList={staffList} errors={errors}
              onMachineSelect={id => handleMachineSelect(block.blockId, id)}
              onNozzleChange={(num, field, val) => setNozzle(block.blockId, num, field, val)}
              onRemove={() => removeMachineBlock(block.blockId)}
              onQuickStaffChange={val => setMachineBlocks(p => p.map(b => b.blockId === block.blockId ? { ...b, quickStaff: val } : b))}
              onApplyQuickStaff={() => applyQuickStaff(block.blockId)}
            />
          ))}
        </div>

        {/* Add Machine */}
        <button type="button" onClick={addMachineBlock} style={{
          width: '100%', padding: '11px', borderRadius: '10px', border: '2px dashed #CBD5E1',
          background: 'white', color: '#64748B', fontWeight: 600, fontSize: '13px',
          cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', marginBottom: '14px',
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#2563EB'; e.currentTarget.style.color = '#2563EB'; e.currentTarget.style.background = '#EFF6FF'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.color = '#64748B'; e.currentTarget.style.background = 'white'; }}
        >
          <IconPlus /> Add Machine to Shift
        </button>

        {errors.machines && <p style={{ ...errS, marginBottom: '10px' }}><IconAlert />{errors.machines}</p>}

        {machineBlocks.length > 0 && (
          <button type="submit" disabled={saving} style={{
            width: '100%', padding: '13px', borderRadius: '10px', border: 'none',
            background: saving ? 'rgba(13,27,62,0.5)' : 'linear-gradient(135deg, #0D1B3E, #122158)',
            color: 'white', fontWeight: 700, fontSize: '14px', cursor: saving ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit', boxShadow: saving ? 'none' : '0 4px 14px rgba(13,27,62,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          }}>
            {saving ? 'Saving…' : <><IconSave /> Save Shift — Activate When Ready</>}
          </button>
        )}
      </form>
    </div>
  );
}

// ─── Machine Block ────────────────────────────────────────────────────────────
function MachineBlock({ block, idx, availableMachines, staffList, errors, onMachineSelect, onNozzleChange, onRemove, onQuickStaffChange, onApplyQuickStaff }) {
  const { blockId, machine, nozzleData, quickStaff, loading } = block;

  return (
    <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0a1540, #0f1f5c)', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '26px', height: '26px', borderRadius: '7px', background: 'rgba(37,99,235,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#93C5FD', fontSize: '12px', fontWeight: 800 }}>{idx + 1}</div>
          <span style={{ color: 'white', fontWeight: 700, fontSize: '13px' }}>{machine ? machine.name : `Machine ${idx + 1}`}</span>
          {machine && <span style={{ color: '#93C5FD', fontSize: '11px' }}>— {machine.machine_no} · {machine.nozzle_count} nozzle{machine.nozzle_count > 1 ? 's' : ''}</span>}
        </div>
        <button type="button" onClick={onRemove} style={{ width: '28px', height: '28px', borderRadius: '7px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#FCA5A5', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IconX />
        </button>
      </div>

      <div style={{ padding: '14px 16px' }}>
        {/* Machine selector */}
        <div style={{ marginBottom: machine ? '14px' : '0' }}>
          <label style={lbl}>Select Machine</label>
          <select value={block.machine_id} onChange={e => onMachineSelect(e.target.value)} style={{ ...inp, color: block.machine_id ? '#1E293B' : '#94A3B8', cursor: 'pointer' }}>
            <option value="">Choose a machine…</option>
            {availableMachines.map(m => <option key={m.id} value={m.id}>{m.name} — {m.machine_no} ({m.nozzle_count} nozzles)</option>)}
          </select>
          {errors[`${blockId}_machine`] && <p style={errS}><IconAlert />{errors[`${blockId}_machine`]}</p>}
        </div>

        {loading && <div style={{ textAlign: 'center', padding: '16px', color: '#64748B', fontSize: '12px' }}>Loading nozzle config…</div>}

        {!loading && machine && Object.keys(nozzleData).length > 0 && (
          <>
            {/* Quick assign */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', padding: '10px 12px', background: '#F0FDF4', borderRadius: '10px', border: '1px solid #BBF7D0', marginBottom: '12px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ ...lbl, color: '#059669', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <IconBolt /> Assign whole machine to one person
                </label>
                <select value={quickStaff} onChange={e => onQuickStaffChange(e.target.value)} style={{ ...inp, borderColor: '#BBF7D0', color: quickStaff ? '#1E293B' : '#94A3B8', cursor: 'pointer' }}>
                  <option value="">Select staff…</option>
                  {staffList.map(s => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}
                </select>
              </div>
              <button type="button" onClick={onApplyQuickStaff} disabled={!quickStaff} style={{
                padding: '8px 14px', borderRadius: '8px', border: 'none',
                background: quickStaff ? '#059669' : '#CBD5E1', color: 'white',
                fontWeight: 700, fontSize: '12px', cursor: quickStaff ? 'pointer' : 'not-allowed',
                fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap',
              }}>
                <IconCheck /> Apply All
              </button>
            </div>

            {/* Per-nozzle operator assignment */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {Object.entries(nozzleData).sort(([a], [b]) => +a - +b).map(([n, nd]) => (
                <div key={n} style={{
                  display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '12px', alignItems: 'center',
                  background: '#F8FAFC',
                  border: `1.5px solid ${errors[`${blockId}_n${n}_staff_id`] ? '#FCA5A5' : '#E2E8F0'}`,
                  borderRadius: '9px', padding: '10px 12px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <div style={{ width: '26px', height: '26px', borderRadius: '7px', background: 'linear-gradient(135deg, #2563EB, #1D4ED8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '11px', flexShrink: 0 }}>{n}</div>
                    <span style={{ fontWeight: 700, fontSize: '12.5px', color: '#0F172A', whiteSpace: 'nowrap' }}>{nd.nozzle_name}</span>
                  </div>
                  <div>
                    <select value={nd.staff_id || ''} onChange={e => onNozzleChange(n, 'staff_id', e.target.value)}
                      style={{ ...inp, color: nd.staff_id ? '#1E293B' : '#94A3B8', cursor: 'pointer', padding: '7px 10px', borderColor: errors[`${blockId}_n${n}_staff_id`] ? '#FCA5A5' : undefined }}>
                      <option value="">Assign operator…</option>
                      {staffList.map(s => <option key={s.id} value={s.id}>{s.name} — {s.role}</option>)}
                    </select>
                    {errors[`${blockId}_n${n}_staff_id`] && <p style={errS}><IconAlert />{errors[`${blockId}_n${n}_staff_id`]}</p>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
