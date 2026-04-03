'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../../lib/supabase';
import { getCompany } from '../../../../lib/store';

const IconBack  = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>;
const IconGauge = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 6v6l4 2"/><circle cx="18" cy="6" r="3"/></svg>;
const IconAlert = () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;

const lbl = { fontSize: '11px', fontWeight: 600, color: '#64748B', marginBottom: '4px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' };
const inp = { width: '100%', padding: '8px 10px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '13px', color: '#1E293B', background: 'white', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };
const err = { fontSize: '10.5px', color: '#ef4444', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '3px' };

export default function OpenShiftPage() {
  const router = useRouter();
  const [machines,  setMachines]  = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [products,  setProducts]  = useState([]);
  const [saving,    setSaving]    = useState(false);
  const [globalErr, setGlobalErr] = useState('');
  const [errors,    setErrors]    = useState({});

  const [form, setForm] = useState({
    machine_id:     '',
    shift_date:     new Date().toISOString().split('T')[0],
    shift_duration: '12',
  });

  // nozzleData[n] = { staff_id, product_id, opening_reading }
  const [nozzleData,      setNozzleData]      = useState({});
  const [selectedMachine, setSelectedMachine] = useState(null);

  useEffect(() => {
    const company = getCompany();
    if (!company) return;
    Promise.all([
      supabase.from('machines').select('id, name, machine_no, nozzle_count, product_id, products(id, name, selling_rate)').eq('company_id', company.id).eq('is_active', true),
      supabase.from('staff').select('id, name, role').eq('company_id', company.id).eq('is_active', true),
      supabase.from('products').select('id, name, selling_rate, unit').eq('company_id', company.id).eq('is_active', true),
    ]).then(([mRes, sRes, pRes]) => {
      setMachines(mRes.data || []);
      setStaffList(sRes.data || []);
      setProducts(pRes.data || []);
    });
  }, []);

  const handleMachineChange = (id) => {
    const m = machines.find(x => x.id === id) || null;
    setSelectedMachine(m);
    setForm(p => ({ ...p, machine_id: id }));
    // Init nozzles: default product from machine
    const nd = {};
    if (m) {
      for (let i = 1; i <= m.nozzle_count; i++) {
        nd[i] = { staff_id: '', product_id: m.product_id || '', opening_reading: '' };
      }
    }
    setNozzleData(nd);
    setErrors({});
  };

  const setNozzle = (n, field, value) => {
    setNozzleData(p => ({ ...p, [n]: { ...p[n], [field]: value } }));
    setErrors(p => ({ ...p, [`n${n}_${field}`]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.machine_id) e.machine_id = 'Select a machine';
    if (!form.shift_date) e.shift_date = 'Required';
    if (selectedMachine) {
      for (let i = 1; i <= selectedMachine.nozzle_count; i++) {
        const nd = nozzleData[i] || {};
        if (!nd.staff_id)       e[`n${i}_staff_id`]        = 'Select staff';
        if (!nd.product_id)     e[`n${i}_product_id`]      = 'Select product';
        if (nd.opening_reading === '' || nd.opening_reading === undefined)
                                e[`n${i}_opening_reading`] = 'Required';
        else if (isNaN(+nd.opening_reading) || +nd.opening_reading < 0)
                                e[`n${i}_opening_reading`] = 'Invalid';
      }
    }
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    setGlobalErr('');

    const company = getCompany();

    // Block duplicate open shift for same machine
    const { data: existing } = await supabase.from('shifts').select('id').eq('company_id', company.id).eq('machine_id', form.machine_id).eq('status', 'open').limit(1);
    if (existing?.length > 0) {
      setGlobalErr('This machine already has an open shift. Close it first.');
      setSaving(false);
      return;
    }

    // Create shift
    const { data: shift, error: shiftErr } = await supabase.from('shifts').insert({
      company_id:     company.id,
      machine_id:     form.machine_id,
      shift_date:     form.shift_date,
      shift_duration: parseInt(form.shift_duration),
      status:         'open',
      opened_at:      new Date().toISOString(),
    }).select('id').single();

    if (shiftErr || !shift) { setGlobalErr('Failed to create shift.'); setSaving(false); return; }

    // Create nozzle records
    const nozzleRows = [];
    for (let i = 1; i <= selectedMachine.nozzle_count; i++) {
      const nd = nozzleData[i];
      nozzleRows.push({
        shift_id:        shift.id,
        company_id:      company.id,
        nozzle_number:   i,
        staff_id:        nd.staff_id,
        product_id:      nd.product_id,
        opening_reading: parseFloat(nd.opening_reading),
      });
    }

    const { error: nozzleErr } = await supabase.from('shift_nozzles').insert(nozzleRows);
    if (nozzleErr) {
      // Rollback shift
      await supabase.from('shifts').delete().eq('id', shift.id);
      setGlobalErr('Failed to save nozzle readings.');
      setSaving(false);
      return;
    }

    router.push('/dashboard/shifts');
  };

  const nozzleCount = selectedMachine?.nozzle_count || 0;

  return (
    <div style={{ maxWidth: '800px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '22px' }}>
        <button onClick={() => router.back()} style={{ width: '34px', height: '34px', borderRadius: '9px', background: 'white', border: '1.5px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569', flexShrink: 0 }}>
          <IconBack />
        </button>
        <div>
          <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#0F172A' }}>Open Shift</h2>
          <p style={{ margin: 0, fontSize: '12px', color: '#64748B', marginTop: '2px' }}>Assign staff per nozzle and record opening meter readings</p>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        {/* Card header */}
        <div style={{ background: 'linear-gradient(135deg, #0a1540, #0f1f5c)', padding: '14px 20px', borderBottom: '3px solid #2563EB', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(37,99,235,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#93C5FD' }}><IconGauge /></div>
          <div>
            <div style={{ color: 'white', fontWeight: 700, fontSize: '13px' }}>New Shift</div>
            <div style={{ color: '#93C5FD', fontSize: '11px' }}>Configure each nozzle independently</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
          {globalErr && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '9px', marginBottom: '16px', color: '#B91C1C', fontSize: '12.5px' }}>
              <IconAlert />{globalErr}
            </div>
          )}

          {/* Top fields: machine, date, duration */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '14px', marginBottom: '20px' }}>
            <div>
              <label style={lbl}>Machine</label>
              <select value={form.machine_id} onChange={e => handleMachineChange(e.target.value)} style={{ ...inp, color: form.machine_id ? '#1E293B' : '#94A3B8', cursor: 'pointer' }}>
                <option value="">Select machine...</option>
                {machines.map(m => <option key={m.id} value={m.id}>{m.name} — {m.machine_no}</option>)}
              </select>
              {errors.machine_id && <p style={err}><IconAlert />{errors.machine_id}</p>}
            </div>
            <div>
              <label style={lbl}>Shift Date</label>
              <input type="date" value={form.shift_date} onChange={e => setForm(p => ({ ...p, shift_date: e.target.value }))} style={inp} />
              {errors.shift_date && <p style={err}><IconAlert />{errors.shift_date}</p>}
            </div>
            <div>
              <label style={lbl}>Duration</label>
              <select value={form.shift_duration} onChange={e => setForm(p => ({ ...p, shift_duration: e.target.value }))} style={{ ...inp, cursor: 'pointer' }}>
                <option value="6">6 Hours</option>
                <option value="8">8 Hours</option>
                <option value="12">12 Hours</option>
                <option value="24">24 Hours</option>
              </select>
            </div>
          </div>

          {/* Machine info */}
          {selectedMachine && (
            <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '10px', padding: '10px 14px', marginBottom: '20px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', color: '#1E40AF' }}><strong>Machine:</strong> {selectedMachine.name} ({selectedMachine.machine_no})</span>
              <span style={{ fontSize: '12px', color: '#1E40AF' }}><strong>Default Fuel:</strong> {selectedMachine.products?.name || '—'}</span>
              <span style={{ fontSize: '12px', color: '#1E40AF' }}><strong>Nozzles:</strong> {selectedMachine.nozzle_count}</span>
            </div>
          )}

          {/* Per-nozzle configuration */}
          {nozzleCount > 0 ? (
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid #F1F5F9' }}>
                Nozzle Configuration — Assign Staff & Opening Readings
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {Array.from({ length: nozzleCount }, (_, i) => i + 1).map(n => {
                  const nd = nozzleData[n] || {};
                  const productRate = products.find(p => p.id === nd.product_id)?.selling_rate;
                  return (
                    <div key={n} style={{ background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: '12px', padding: '14px 16px' }}>
                      {/* Nozzle header */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: 'linear-gradient(135deg, #2563EB, #1D4ED8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '13px', flexShrink: 0 }}>
                          {n}
                        </div>
                        <span style={{ fontWeight: 700, fontSize: '13px', color: '#0F172A' }}>Nozzle {n}</span>
                        {productRate && (
                          <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#059669', fontWeight: 600, background: '#F0FDF4', padding: '2px 8px', borderRadius: '6px', border: '1px solid #BBF7D0' }}>
                            Rs. {productRate} / Ltr
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                        {/* Staff */}
                        <div>
                          <label style={lbl}>Operator (Staff)</label>
                          <select value={nd.staff_id || ''} onChange={e => setNozzle(n, 'staff_id', e.target.value)}
                            style={{ ...inp, color: nd.staff_id ? '#1E293B' : '#94A3B8', cursor: 'pointer' }}>
                            <option value="">Select staff...</option>
                            {staffList.map(s => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}
                          </select>
                          {errors[`n${n}_staff_id`] && <p style={err}><IconAlert />{errors[`n${n}_staff_id`]}</p>}
                        </div>

                        {/* Product */}
                        <div>
                          <label style={lbl}>Product / Fuel</label>
                          <select value={nd.product_id || ''} onChange={e => setNozzle(n, 'product_id', e.target.value)}
                            style={{ ...inp, color: nd.product_id ? '#1E293B' : '#94A3B8', cursor: 'pointer' }}>
                            <option value="">Select product...</option>
                            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                          {errors[`n${n}_product_id`] && <p style={err}><IconAlert />{errors[`n${n}_product_id`]}</p>}
                        </div>

                        {/* Opening reading */}
                        <div>
                          <label style={lbl}>Opening Reading (Ltrs)</label>
                          <input type="number" step="0.01" min="0" placeholder="0.00"
                            value={nd.opening_reading ?? ''} onChange={e => setNozzle(n, 'opening_reading', e.target.value)}
                            style={{ ...inp, textAlign: 'right', fontWeight: 700, fontSize: '14px' }}
                          />
                          {errors[`n${n}_opening_reading`] && <p style={err}><IconAlert />{errors[`n${n}_opening_reading`]}</p>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '28px', color: '#94A3B8', fontSize: '13px', background: '#F8FAFC', borderRadius: '10px', border: '1.5px dashed #E2E8F0' }}>
              Select a machine above to configure nozzles
            </div>
          )}

          {/* Submit */}
          <button type="submit" disabled={saving} style={{
            width: '100%', marginTop: '20px', padding: '12px', borderRadius: '10px', border: 'none',
            background: saving ? 'rgba(37,99,235,0.5)' : 'linear-gradient(135deg, #2563EB, #1D4ED8)',
            color: 'white', fontWeight: 700, fontSize: '14px', cursor: saving ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit', boxShadow: saving ? 'none' : '0 4px 14px rgba(37,99,235,0.35)',
          }}>
            {saving ? 'Opening Shift...' : 'Open Shift'}
          </button>
        </form>
      </div>
    </div>
  );
}
