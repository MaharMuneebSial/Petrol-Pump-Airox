'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../../lib/supabase';
import { getCompany } from '../../../../lib/store';

// ── Icons ─────────────────────────────────────────────────────────────────────
const IconBack    = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>;
const IconAlert   = () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const IconPlus    = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconX       = () => <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IconCheck   = () => <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>;
const IconBolt    = () => <svg width="11" height="11" fill="currentColor" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
const IconSave    = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>;
const IconGauge   = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 6v6l4 2"/><circle cx="18" cy="6" r="3"/></svg>;
const IconUser    = () => <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;

// ── Base styles ───────────────────────────────────────────────────────────────
const inp  = { width: '100%', padding: '10px 12px', border: '1.5px solid #E2E8F0', borderRadius: '9px', fontSize: '13px', color: '#1E293B', background: 'white', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', transition: 'border-color 0.15s' };
const lbl  = { fontSize: '11px', fontWeight: 700, color: '#64748B', marginBottom: '6px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' };
const errS = { fontSize: '10.5px', color: '#ef4444', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '3px', margin: '4px 0 0' };

const DURATIONS = [
  { value: '6',  label: '6h' },
  { value: '8',  label: '8h' },
  { value: '12', label: '12h' },
  { value: '24', label: '24h' },
];

export default function CreateShiftPage() {
  const router = useRouter();
  const [machines,      setMachines]      = useState([]);
  const [staffList,     setStaffList]     = useState([]);
  const [products,      setProducts]      = useState([]);
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
      supabase.from('products').select('id, name').eq('company_id', company.id).eq('is_active', true),
    ]).then(([mRes, sRes, pRes]) => {
      setMachines(mRes.data || []);
      setStaffList(sRes.data || []);
      setProducts(pRes.data || []);
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
      nozzleData[i] = { nozzle_name: c.nozzle_name || `Nozzle ${i}`, product_id: c.product_id || '', staff_id: '' };
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
      if (usedIds.includes(block.machine_id)) e[`${block.blockId}_machine`] = 'Already added';
      else usedIds.push(block.machine_id);
      for (const [num, nd] of Object.entries(block.nozzleData)) {
        if (!nd.staff_id)   e[`${block.blockId}_n${num}_staff_id`]   = 'Required';
        if (!nd.product_id) e[`${block.blockId}_n${num}_product_id`] = 'Required';
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
        company_id: company.id, shift_name: shiftName.trim() || null,
        shift_date: shiftDate, shift_duration: parseInt(shiftDuration), status: 'draft',
      }).select('id').single();
      if (shiftErr || !shift) { setGlobalErr(`Failed: ${shiftErr?.message}`); setSaving(false); return; }

      const rows = [];
      for (const block of machineBlocks)
        for (const [num, nd] of Object.entries(block.nozzleData))
          rows.push({ shift_id: shift.id, company_id: company.id, machine_id: block.machine_id, nozzle_number: parseInt(num), nozzle_name: nd.nozzle_name, staff_id: nd.staff_id || null, product_id: nd.product_id || null });

      const { error: nErr } = await supabase.from('shift_nozzles').insert(rows);
      if (nErr) {
        await supabase.from('shifts').delete().eq('id', shift.id);
        setGlobalErr(`Failed to save nozzles: ${nErr.message}`); setSaving(false); return;
      }
      router.push('/dashboard/shifts');
    } catch (ex) { setGlobalErr(`Error: ${ex.message}`); setSaving(false); }
  };

  const usedMachineIds = machineBlocks.map(b => b.machine_id).filter(Boolean);

  // Progress calc
  const totalNozzles    = machineBlocks.reduce((s, b) => s + Object.keys(b.nozzleData).length, 0);
  const assignedNozzles = machineBlocks.reduce((s, b) => s + Object.values(b.nozzleData).filter(n => n.staff_id).length, 0);
  const progressPct     = totalNozzles > 0 ? Math.round((assignedNozzles / totalNozzles) * 100) : 0;
  const allAssigned     = totalNozzles > 0 && assignedNozzles === totalNozzles;

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
        <button onClick={() => router.back()} style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'white', border: '1.5px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569', flexShrink: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <IconBack />
        </button>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>Create Shift</h2>
          <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#94A3B8' }}>Configure machines & staff, then activate when your team is ready</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {globalErr && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 14px', background: '#FEF2F2', border: '1.5px solid #FECACA', borderRadius: '10px', marginBottom: '18px', color: '#B91C1C', fontSize: '12.5px' }}>
            <IconAlert /> {globalErr}
          </div>
        )}

        {/* ── Step 1: Shift Details ── */}
        <StepCard step={1} title="Shift Details" subtitle="Basic info for this shift">
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr auto', gap: '12px', alignItems: 'end' }}>
            <div>
              <label style={lbl}>Shift Name <span style={{ color: '#94A3B8', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
              <input value={shiftName} onChange={e => setShiftName(e.target.value)} placeholder="e.g. Morning Shift" style={inp} />
            </div>
            <div>
              <label style={lbl}>Date <span style={{ color: '#ef4444' }}>*</span></label>
              <input type="date" value={shiftDate} onChange={e => setShiftDate(e.target.value)} style={{ ...inp, borderColor: errors.shiftDate ? '#FCA5A5' : undefined }} />
              {errors.shiftDate && <p style={errS}><IconAlert />{errors.shiftDate}</p>}
            </div>
            <div>
              <label style={lbl}>Duration</label>
              <div style={{ display: 'flex', gap: '6px' }}>
                {DURATIONS.map(d => (
                  <button key={d.value} type="button" onClick={() => setShiftDuration(d.value)} style={{
                    padding: '9px 14px', borderRadius: '9px', fontFamily: 'inherit', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                    border: shiftDuration === d.value ? '2px solid #2563EB' : '1.5px solid #E2E8F0',
                    background: shiftDuration === d.value ? '#EFF6FF' : 'white',
                    color: shiftDuration === d.value ? '#1D4ED8' : '#475569',
                    transition: 'all 0.15s', whiteSpace: 'nowrap',
                  }}>
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </StepCard>

        {/* ── Step 2: Machines ── */}
        <StepCard step={2} title="Machines & Staff" subtitle="Add dispensers and assign operators to each nozzle"
          right={totalNozzles > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ fontSize: '11.5px', color: allAssigned ? '#059669' : '#D97706', fontWeight: 700 }}>
                {assignedNozzles}/{totalNozzles} assigned
              </div>
              <div style={{ width: '60px', height: '5px', borderRadius: '99px', background: '#E2E8F0', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progressPct}%`, background: allAssigned ? '#059669' : '#D97706', borderRadius: '99px', transition: 'width 0.3s' }} />
              </div>
            </div>
          )}
        >
          {machineBlocks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 20px', borderRadius: '10px', border: '1.5px dashed #E2E8F0', background: '#FAFBFC', marginBottom: '12px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: '#2563EB' }}>
                <IconGauge />
              </div>
              <div style={{ fontWeight: 600, color: '#1E293B', fontSize: '13px', marginBottom: '4px' }}>No machines added yet</div>
              <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '16px' }}>Click below to add a dispenser to this shift</div>
              <AddMachineBtn onClick={addMachineBlock} />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '12px' }}>
              {machineBlocks.map((block, idx) => (
                <MachineBlock key={block.blockId} block={block} idx={idx}
                  availableMachines={machines.filter(m => !usedMachineIds.includes(m.id) || m.id === block.machine_id)}
                  staffList={staffList} products={products} errors={errors}
                  onMachineSelect={id => handleMachineSelect(block.blockId, id)}
                  onNozzleChange={(num, field, val) => setNozzle(block.blockId, num, field, val)}
                  onRemove={() => removeMachineBlock(block.blockId)}
                  onQuickStaffChange={val => setMachineBlocks(p => p.map(b => b.blockId === block.blockId ? { ...b, quickStaff: val } : b))}
                  onApplyQuickStaff={() => applyQuickStaff(block.blockId)}
                />
              ))}
              <AddMachineBtn onClick={addMachineBlock} compact />
            </div>
          )}

          {errors.machines && <p style={errS}><IconAlert /> {errors.machines}</p>}
        </StepCard>

        {/* ── Save button ── */}
        {machineBlocks.length > 0 && (
          <button type="submit" disabled={saving} style={{
            width: '100%', padding: '13px', borderRadius: '11px', border: 'none',
            background: saving ? '#94A3B8' : 'linear-gradient(135deg, #0D1B3E, #122158)',
            color: 'white', fontWeight: 700, fontSize: '14px', cursor: saving ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit', boxShadow: saving ? 'none' : '0 4px 16px rgba(13,27,62,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            transition: 'opacity 0.15s',
          }}>
            {saving ? 'Saving…' : <><IconSave /> Save Shift — Activate When Ready</>}
          </button>
        )}
      </form>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        select option { color: #1E293B; }
      `}</style>
    </div>
  );
}

// ── Step Card wrapper ─────────────────────────────────────────────────────────
function StepCard({ step, title, subtitle, children, right }) {
  return (
    <div style={{ background: 'white', borderRadius: '14px', border: '1.5px solid #E2E8F0', overflow: 'hidden', marginBottom: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '26px', height: '26px', borderRadius: '8px', background: 'linear-gradient(135deg, #0D1B3E, #122158)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '11px', fontWeight: 800, flexShrink: 0 }}>
          {step}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#0F172A' }}>{title}</div>
          <div style={{ fontSize: '11.5px', color: '#94A3B8', marginTop: '1px' }}>{subtitle}</div>
        </div>
        {right}
      </div>
      <div style={{ padding: '14px 16px' }}>{children}</div>
    </div>
  );
}

// ── Add Machine Button ────────────────────────────────────────────────────────
function AddMachineBtn({ onClick, compact }) {
  const [hover, setHover] = useState(false);
  return (
    <button type="button" onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        width: compact ? 'auto' : '100%', padding: compact ? '8px 18px' : '11px',
        borderRadius: '10px', border: `1.5px dashed ${hover ? '#2563EB' : '#CBD5E1'}`,
        background: hover ? '#EFF6FF' : 'white',
        color: hover ? '#2563EB' : '#64748B', fontWeight: 600, fontSize: '13px',
        cursor: 'pointer', fontFamily: 'inherit',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
        transition: 'all 0.15s',
      }}>
      <IconPlus /> Add {compact ? 'Another' : ''} Machine
    </button>
  );
}

// ── Machine Block ─────────────────────────────────────────────────────────────
function MachineBlock({ block, idx, availableMachines, staffList, products, errors, onMachineSelect, onNozzleChange, onRemove, onQuickStaffChange, onApplyQuickStaff }) {
  const { blockId, machine, nozzleData, quickStaff, loading } = block;

  const totalNozzles    = Object.keys(nozzleData).length;
  const assignedNozzles = Object.values(nozzleData).filter(n => n.staff_id && n.product_id).length;
  const allDone         = totalNozzles > 0 && assignedNozzles === totalNozzles;

  return (
    <div style={{ borderRadius: '12px', border: `1.5px solid ${allDone ? '#BBF7D0' : errors[`${blockId}_machine`] ? '#FECACA' : '#E2E8F0'}`, overflow: 'hidden', background: 'white', animation: 'fadeIn 0.2s ease', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>

      {/* ── Card Header ── */}
      <div style={{ padding: '11px 14px', background: allDone ? '#F0FDF4' : '#F8FAFC', borderBottom: `1px solid ${allDone ? '#D1FAE5' : '#F1F5F9'}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: allDone ? '#059669' : 'linear-gradient(135deg, #0D1B3E, #122158)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '11px', fontWeight: 800, flexShrink: 0, transition: 'background 0.2s' }}>
          {allDone ? <IconCheck /> : idx + 1}
        </div>
        <div style={{ flex: 1 }}>
          <span style={{ fontWeight: 700, fontSize: '13px', color: '#0F172A' }}>
            {machine ? machine.name : `Machine ${idx + 1}`}
          </span>
          {machine && (
            <span style={{ fontSize: '11px', color: '#94A3B8', marginLeft: '8px' }}>
              {machine.machine_no} · {machine.nozzle_count} nozzle{machine.nozzle_count !== 1 ? 's' : ''}
            </span>
          )}
          {totalNozzles > 0 && (
            <span style={{ fontSize: '11px', color: allDone ? '#059669' : '#D97706', marginLeft: '10px', fontWeight: 600 }}>
              {assignedNozzles}/{totalNozzles} assigned
            </span>
          )}
        </div>
        <button type="button" onClick={onRemove} style={{ width: '28px', height: '28px', borderRadius: '7px', background: '#FEF2F2', border: '1px solid #FECACA', color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <IconX />
        </button>
      </div>

      <div style={{ padding: '14px' }}>
        {/* Machine selector */}
        <div style={{ marginBottom: machine ? '14px' : '0' }}>
          <label style={lbl}>Select Dispenser</label>
          <select value={block.machine_id} onChange={e => onMachineSelect(e.target.value)}
            style={{ ...inp, color: block.machine_id ? '#1E293B' : '#94A3B8', cursor: 'pointer', borderColor: errors[`${blockId}_machine`] ? '#FCA5A5' : undefined }}>
            <option value="">Choose a dispenser…</option>
            {availableMachines.map(m => (
              <option key={m.id} value={m.id}>{m.name} — {m.machine_no} ({m.nozzle_count} nozzles)</option>
            ))}
          </select>
          {errors[`${blockId}_machine`] && <p style={errS}><IconAlert />{errors[`${blockId}_machine`]}</p>}
        </div>

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px', color: '#64748B', fontSize: '12.5px', justifyContent: 'center' }}>
            <div style={{ width: '14px', height: '14px', border: '2px solid #E2E8F0', borderTopColor: '#2563EB', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            Loading nozzle config…
          </div>
        )}

        {!loading && machine && Object.keys(nozzleData).length > 0 && (
          <>
            {/* ── Quick assign row ── */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', padding: '10px 12px', background: '#F0FDF4', border: '1.5px solid #BBF7D0', borderRadius: '10px', marginBottom: '12px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ ...lbl, color: '#059669', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                  <IconBolt /> Assign all nozzles to one person
                </label>
                <select value={quickStaff} onChange={e => onQuickStaffChange(e.target.value)}
                  style={{ ...inp, borderColor: '#BBF7D0', color: quickStaff ? '#1E293B' : '#94A3B8', cursor: 'pointer', padding: '9px 12px' }}>
                  <option value="">Select staff…</option>
                  {staffList.map(s => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}
                </select>
              </div>
              <button type="button" onClick={onApplyQuickStaff} disabled={!quickStaff} style={{
                padding: '9px 16px', borderRadius: '9px', border: 'none',
                background: quickStaff ? 'linear-gradient(135deg, #059669, #047857)' : '#CBD5E1',
                color: 'white', fontWeight: 700, fontSize: '12.5px',
                cursor: quickStaff ? 'pointer' : 'not-allowed', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap',
                boxShadow: quickStaff ? '0 2px 8px rgba(5,150,105,0.25)' : 'none',
                transition: 'all 0.15s', flexShrink: 0,
              }}>
                <IconCheck /> Apply All
              </button>
            </div>

            {/* ── Per-nozzle assignment ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {Object.entries(nozzleData).sort(([a], [b]) => +a - +b).map(([n, nd]) => {
                const assigned   = !!(nd.staff_id && nd.product_id);
                const staff      = staffList.find(s => s.id === nd.staff_id);
                const hasStaffErr = !!errors[`${blockId}_n${n}_staff_id`];
                const hasProdErr  = !!errors[`${blockId}_n${n}_product_id`];
                const hasErr      = hasStaffErr || hasProdErr;
                return (
                  <div key={n} style={{
                    display: 'grid', gridTemplateColumns: 'auto 1fr 1fr', gap: '10px', alignItems: 'center',
                    padding: '10px 12px', borderRadius: '10px',
                    background: assigned ? '#F0FDF4' : hasErr ? '#FFF5F5' : '#F8FAFC',
                    border: `1.5px solid ${assigned ? '#BBF7D0' : hasErr ? '#FCA5A5' : '#E2E8F0'}`,
                    transition: 'all 0.15s',
                  }}>
                    {/* Nozzle badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '100px' }}>
                      <div style={{ width: '26px', height: '26px', borderRadius: '7px', background: assigned ? '#059669' : 'linear-gradient(135deg, #2563EB, #1D4ED8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '11px', flexShrink: 0, transition: 'background 0.2s' }}>
                        {n}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '12.5px', color: '#0F172A' }}>{nd.nozzle_name}</div>
                        {assigned && staff && (
                          <div style={{ fontSize: '10.5px', color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px', marginTop: '1px' }}>
                            <IconUser /> {staff.name}
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Product dropdown */}
                    <div>
                      <select value={nd.product_id || ''} onChange={e => onNozzleChange(n, 'product_id', e.target.value)}
                        style={{ ...inp, color: nd.product_id ? '#1E293B' : '#94A3B8', cursor: 'pointer', padding: '8px 12px', borderColor: hasProdErr ? '#FCA5A5' : nd.product_id ? '#BBF7D0' : undefined }}>
                        <option value="">Select product…</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                      {hasProdErr && <p style={errS}><IconAlert /> {errors[`${blockId}_n${n}_product_id`]}</p>}
                    </div>
                    {/* Staff dropdown */}
                    <div>
                      <select value={nd.staff_id || ''} onChange={e => onNozzleChange(n, 'staff_id', e.target.value)}
                        style={{ ...inp, color: nd.staff_id ? '#1E293B' : '#94A3B8', cursor: 'pointer', padding: '8px 12px', borderColor: hasStaffErr ? '#FCA5A5' : nd.staff_id ? '#BBF7D0' : undefined }}>
                        <option value="">Assign operator…</option>
                        {staffList.map(s => <option key={s.id} value={s.id}>{s.name} — {s.role}</option>)}
                      </select>
                      {hasStaffErr && <p style={errS}><IconAlert /> {errors[`${blockId}_n${n}_staff_id`]}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
