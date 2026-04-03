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

const lbl  = { fontSize: '11px', fontWeight: 600, color: '#64748B', marginBottom: '4px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' };
const inp  = { width: '100%', padding: '8px 10px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '13px', color: '#1E293B', background: 'white', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };
const errS = { fontSize: '10.5px', color: '#ef4444', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '3px' };

export default function OpenShiftPage() {
  const router = useRouter();
  const [machines,      setMachines]      = useState([]);
  const [staffList,     setStaffList]     = useState([]);
  const [products,      setProducts]      = useState([]);
  const [saving,        setSaving]        = useState(false);
  const [globalErr,     setGlobalErr]     = useState('');
  const [errors,        setErrors]        = useState({});
  const [shiftDate,     setShiftDate]     = useState(new Date().toISOString().split('T')[0]);
  const [shiftDuration, setShiftDuration] = useState('12');
  // [{ blockId, machine_id, machine, nozzleData:{n:{staff_id,product_id,opening_reading,_hint}}, quickStaff, loading }]
  const [machineBlocks, setMachineBlocks] = useState([]);

  useEffect(() => {
    const company = getCompany();
    if (!company) return;
    Promise.all([
      supabase.from('machines').select('id, name, machine_no, nozzle_count').eq('company_id', company.id).eq('is_active', true),
      supabase.from('staff').select('id, name, role').eq('company_id', company.id).eq('is_active', true),
      supabase.from('products').select('id, name, selling_rate, unit').eq('company_id', company.id).eq('is_active', true),
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

    const company = getCompany();

    // Load saved nozzle config (staff + product + initial reading)
    const { data: configs } = await supabase.from('machine_nozzles').select('nozzle_number, staff_id, product_id, initial_reading').eq('machine_id', machineId);
    const configMap = {};
    for (const c of (configs || [])) configMap[c.nozzle_number] = c;

    // Load last closing reading per nozzle (use as opening reading suggestion)
    const lastReadings = {};
    for (let i = 1; i <= machine.nozzle_count; i++) {
      const { data: last } = await supabase.from('shift_nozzles')
        .select('closing_reading').eq('machine_id', machineId).eq('nozzle_number', i)
        .eq('company_id', company.id).not('closing_reading', 'is', null)
        .order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (last?.closing_reading != null) lastReadings[i] = last.closing_reading;
    }

    const nozzleData = {};
    for (let i = 1; i <= machine.nozzle_count; i++) {
      const c = configMap[i] || {};
      const last = lastReadings[i];
      nozzleData[i] = {
        staff_id:        c.staff_id    || '',
        product_id:      c.product_id  || '',
        opening_reading: last != null  ? String(last) : (c.initial_reading != null ? String(c.initial_reading) : ''),
        _hint:           last != null  ? `Last close: ${last}` : null,
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
      if (usedIds.includes(block.machine_id)) { e[`${block.blockId}_machine`] = 'Already added'; } else usedIds.push(block.machine_id);
      for (const [num, nd] of Object.entries(block.nozzleData)) {
        if (!nd.staff_id)  e[`${block.blockId}_n${num}_staff_id`]        = 'Required';
        if (!nd.product_id) e[`${block.blockId}_n${num}_product_id`]     = 'Required';
        const v = nd.opening_reading;
        if (v === '' || v === undefined)         e[`${block.blockId}_n${num}_opening_reading`] = 'Required';
        else if (isNaN(+v) || +v < 0)           e[`${block.blockId}_n${num}_opening_reading`] = 'Invalid';
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
        company_id: company.id, shift_date: shiftDate,
        shift_duration: parseInt(shiftDuration), status: 'open',
        opened_at: new Date().toISOString(),
      }).select('id').single();
      if (shiftErr || !shift) { setGlobalErr(`Failed to create shift: ${shiftErr?.message}`); setSaving(false); return; }

      const rows = [];
      for (const block of machineBlocks) {
        for (const [num, nd] of Object.entries(block.nozzleData)) {
          rows.push({ shift_id: shift.id, company_id: company.id, machine_id: block.machine_id, nozzle_number: parseInt(num), staff_id: nd.staff_id, product_id: nd.product_id, opening_reading: parseFloat(nd.opening_reading) });
        }
      }
      const { error: nErr } = await supabase.from('shift_nozzles').insert(rows);
      if (nErr) { await supabase.from('shifts').delete().eq('id', shift.id); setGlobalErr(`Failed to save nozzles: ${nErr.message}`); setSaving(false); return; }

      router.push('/dashboard/shifts');
    } catch (ex) { setGlobalErr(`Error: ${ex.message}`); setSaving(false); }
  };

  const usedMachineIds = machineBlocks.map(b => b.machine_id).filter(Boolean);

  return (
    <div style={{ maxWidth: '900px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '22px' }}>
        <button onClick={() => router.back()} style={{ width: '34px', height: '34px', borderRadius: '9px', background: 'white', border: '1.5px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569', flexShrink: 0 }}>
          <IconBack />
        </button>
        <div>
          <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#0F172A' }}>Open Shift</h2>
          <p style={{ margin: 0, fontSize: '12px', color: '#64748B', marginTop: '2px' }}>Add machines — assign staff per nozzle (or whole machine at once)</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {globalErr && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '9px', marginBottom: '16px', color: '#B91C1C', fontSize: '12.5px' }}>
            <IconAlert />{globalErr}
          </div>
        )}

        {/* Date + Duration */}
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '16px', marginBottom: '14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div>
            <label style={lbl}>Shift Date</label>
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

        {/* Machine blocks */}
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
            width: '100%', padding: '12px', borderRadius: '10px', border: 'none',
            background: saving ? 'rgba(37,99,235,0.5)' : 'linear-gradient(135deg, #2563EB, #1D4ED8)',
            color: 'white', fontWeight: 700, fontSize: '14px', cursor: saving ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit', boxShadow: saving ? 'none' : '0 4px 14px rgba(37,99,235,0.35)',
          }}>
            {saving ? 'Opening Shift…' : `Open Shift — ${machineBlocks.filter(b => b.machine_id).length} Machine${machineBlocks.filter(b => b.machine_id).length !== 1 ? 's' : ''}`}
          </button>
        )}
      </form>
    </div>
  );
}

function MachineBlock({ block, idx, availableMachines, staffList, products, errors, onMachineSelect, onNozzleChange, onRemove, onQuickStaffChange, onApplyQuickStaff }) {
  const { blockId, machine, nozzleData, quickStaff, loading } = block;

  return (
    <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0a1540, #0f1f5c)', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '26px', height: '26px', borderRadius: '7px', background: 'rgba(37,99,235,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#93C5FD', fontSize: '12px', fontWeight: 800 }}>{idx + 1}</div>
          <span style={{ color: 'white', fontWeight: 700, fontSize: '13px' }}>{machine ? machine.name : `Machine ${idx + 1}`}</span>
          {machine && <span style={{ color: '#93C5FD', fontSize: '11px' }}>— {machine.nozzle_count} nozzle{machine.nozzle_count > 1 ? 's' : ''}</span>}
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

        {loading && <div style={{ textAlign: 'center', padding: '20px', color: '#64748B', fontSize: '12px' }}>Loading nozzle config…</div>}

        {!loading && machine && (
          <>
            {/* Quick assign */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', padding: '10px 12px', background: '#F0FDF4', borderRadius: '10px', border: '1px solid #BBF7D0', marginBottom: '14px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ ...lbl, color: '#059669', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <IconBolt /> Quick Assign — all nozzles to one person
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
                <IconCheck /> Apply
              </button>
            </div>

            {/* Per-nozzle config */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {Array.from({ length: machine.nozzle_count }, (_, i) => i + 1).map(n => {
                const nd = nozzleData[n] || {};
                const hasErr = errors[`${blockId}_n${n}_staff_id`] || errors[`${blockId}_n${n}_product_id`] || errors[`${blockId}_n${n}_opening_reading`];
                const rate = products.find(p => p.id === nd.product_id)?.selling_rate;
                return (
                  <div key={n} style={{ background: '#F8FAFC', border: `1.5px solid ${hasErr ? '#FCA5A5' : '#E2E8F0'}`, borderRadius: '10px', padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                      <div style={{ width: '26px', height: '26px', borderRadius: '7px', background: 'linear-gradient(135deg, #2563EB, #1D4ED8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '12px', flexShrink: 0 }}>{n}</div>
                      <span style={{ fontWeight: 700, fontSize: '12.5px', color: '#0F172A' }}>Nozzle {n}</span>
                      {nd._hint && <span style={{ fontSize: '10.5px', color: '#059669', background: '#F0FDF4', padding: '1px 7px', borderRadius: '5px', border: '1px solid #BBF7D0' }}>{nd._hint}</span>}
                      {rate && <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#7C3AED', fontWeight: 600, background: '#F5F3FF', padding: '1px 7px', borderRadius: '5px', border: '1px solid #DDD6FE' }}>Rs. {rate}/Ltr</span>}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={lbl}>Operator</label>
                        <select value={nd.staff_id || ''} onChange={e => onNozzleChange(n, 'staff_id', e.target.value)}
                          style={{ ...inp, color: nd.staff_id ? '#1E293B' : '#94A3B8', cursor: 'pointer', borderColor: errors[`${blockId}_n${n}_staff_id`] ? '#FCA5A5' : undefined }}>
                          <option value="">Select staff…</option>
                          {staffList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        {errors[`${blockId}_n${n}_staff_id`] && <p style={errS}><IconAlert />{errors[`${blockId}_n${n}_staff_id`]}</p>}
                      </div>
                      <div>
                        <label style={lbl}>Product</label>
                        <select value={nd.product_id || ''} onChange={e => onNozzleChange(n, 'product_id', e.target.value)}
                          style={{ ...inp, color: nd.product_id ? '#1E293B' : '#94A3B8', cursor: 'pointer', borderColor: errors[`${blockId}_n${n}_product_id`] ? '#FCA5A5' : undefined }}>
                          <option value="">Select product…</option>
                          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        {errors[`${blockId}_n${n}_product_id`] && <p style={errS}><IconAlert />{errors[`${blockId}_n${n}_product_id`]}</p>}
                      </div>
                      <div>
                        <label style={lbl}>Opening Reading</label>
                        <input type="number" step="0.01" min="0" placeholder="0.00"
                          value={nd.opening_reading ?? ''}
                          onChange={e => onNozzleChange(n, 'opening_reading', e.target.value)}
                          style={{ ...inp, textAlign: 'right', fontWeight: 700, fontSize: '14px', borderColor: errors[`${blockId}_n${n}_opening_reading`] ? '#FCA5A5' : undefined }}
                        />
                        {errors[`${blockId}_n${n}_opening_reading`] && <p style={errS}><IconAlert />{errors[`${blockId}_n${n}_opening_reading`]}</p>}
                      </div>
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
