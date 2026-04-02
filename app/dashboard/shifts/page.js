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

const lbl = { fontSize: '11px', fontWeight: 600, color: '#64748B', marginBottom: '4px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' };
const inp = { width: '100%', padding: '8px 10px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '13px', color: '#1E293B', background: 'white', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };
const errS = { fontSize: '10.5px', color: '#ef4444', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '3px' };


export default function ShiftsPage() {
  const router = useRouter();
  const [shifts,   setShifts]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState({ status: 'all', date: '' });
  const [closing,  setClosing]  = useState(null);
  const [closeData, setCloseData] = useState({}); // { nozzle_id: { closing_reading } }
  const [closeErr, setCloseErr] = useState({});
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');

  const load = useCallback(async () => {
    const company = getCompany();
    if (!company) return;
    setLoading(true);
    let q = supabase
      .from('shifts')
      .select(`
        id, shift_date, shift_duration, status, total_liters, total_amount, note, opened_at, closed_at,
        machines(id, name, machine_no, nozzle_count),
        shift_nozzles(id, nozzle_number, staff_id, product_id, opening_reading, closing_reading, liters_sold, rate, amount, payment_mode, payment_meta, account_id,
          staff(id, name, role),
          products(id, name, unit, selling_rate)
        )
      `)
      .eq('company_id', company.id)
      .order('shift_date', { ascending: false })
      .order('opened_at', { ascending: false });

    if (filter.status !== 'all') q = q.eq('status', filter.status);
    if (filter.date) q = q.eq('shift_date', filter.date);

    const { data } = await q;
    // Sort nozzles within each shift
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
    for (const nz of (shift.shift_nozzles || [])) {
      cd[nz.id] = { closing_reading: '' };
    }
    setCloseData(cd);
    setCloseErr({});
    setError('');
    setClosing(shift.id);
  };

  const setNozzleClose = (nozzleId, field, value) => {
    setCloseData(p => ({ ...p, [nozzleId]: { ...p[nozzleId], [field]: value } }));
    setCloseErr(p => ({ ...p, [`${nozzleId}_${field}`]: '' }));
  };

  const validateClose = (shift) => {
    const e = {};
    for (const nz of (shift.shift_nozzles || [])) {
      const v = closeData[nz.id]?.closing_reading;
      if (v === '' || v === undefined)  e[`${nz.id}_reading`] = 'Required';
      else if (isNaN(+v) || +v < 0)    e[`${nz.id}_reading`] = 'Invalid';
      else if (+v < nz.opening_reading) e[`${nz.id}_reading`] = `Must be ≥ ${nz.opening_reading}`;
    }
    return e;
  };

  const handleSaveReadings = async (shift) => {
    const errs = validateClose(shift);
    if (Object.keys(errs).length) { setCloseErr(errs); return; }
    setSaving(true);
    setError('');

    for (const nz of (shift.shift_nozzles || [])) {
      const closingReading = parseFloat(closeData[nz.id].closing_reading);
      const liters = Math.max(0, closingReading - nz.opening_reading);
      const rate   = nz.products?.selling_rate || 0;
      const amount = parseFloat((liters * rate).toFixed(2));

      const { error: nErr } = await supabase.from('shift_nozzles').update({
        closing_reading: closingReading,
        liters_sold:     parseFloat(liters.toFixed(2)),
        rate,
        amount,
      }).eq('id', nz.id);

      if (nErr) { setError('Failed to save readings. Try again.'); setSaving(false); return; }
    }

    setSaving(false);
    router.push(`/dashboard/shifts/${shift.id}/payment`);
  };

  const openShifts   = shifts.filter(s => s.status === 'open');
  const closedShifts = shifts.filter(s => s.status === 'closed');

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#0F172A' }}>Shifts</h2>
          <p style={{ margin: 0, fontSize: '12px', color: '#64748B', marginTop: '2px' }}>Nozzle-based duty shift management</p>
        </div>
        <button onClick={() => router.push('/dashboard/shifts/open')} style={{
          display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 16px', borderRadius: '10px', border: 'none',
          background: 'linear-gradient(135deg, #2563EB, #1D4ED8)', color: 'white', fontWeight: 600, fontSize: '13px',
          cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 3px 10px rgba(37,99,235,0.35)',
        }}>
          <IconPlus /> Open New Shift
        </button>
      </div>

      {/* Filters */}
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '12px 16px', marginBottom: '16px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
        {['all', 'open', 'closed'].map(s => (
          <button key={s} onClick={() => setFilter(p => ({ ...p, status: s }))} style={{
            padding: '5px 14px', borderRadius: '999px', border: '1.5px solid',
            borderColor: filter.status === s ? '#2563EB' : '#E2E8F0',
            background: filter.status === s ? '#EFF6FF' : 'white',
            color: filter.status === s ? '#2563EB' : '#64748B',
            fontWeight: filter.status === s ? 600 : 400,
            fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize',
          }}>{s}</button>
        ))}
        <input type="date" value={filter.date} onChange={e => setFilter(p => ({ ...p, date: e.target.value }))}
          style={{ padding: '6px 10px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '12px', color: '#1E293B', fontFamily: 'inherit' }}
        />
        {filter.date && (
          <button onClick={() => setFilter(p => ({ ...p, date: '' }))} style={{ padding: '5px 10px', borderRadius: '8px', border: '1.5px solid #E2E8F0', background: 'white', color: '#64748B', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>Clear</button>
        )}
      </div>

      {/* Open shifts */}
      {(filter.status === 'all' || filter.status === 'open') && openShifts.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#059669', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px', paddingLeft: '2px' }}>Open ({openShifts.length})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {openShifts.map(shift => (
              <ShiftCard key={shift.id} shift={shift}
                isClosing={closing === shift.id}
                closeData={closeData} setNozzleClose={setNozzleClose}
                closeErr={closeErr}
                saving={saving} error={error}
                onClose={() => startClose(shift)}
                onSubmit={() => handleSaveReadings(shift)}
                onCancel={() => setClosing(null)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Closed shifts */}
      {(filter.status === 'all' || filter.status === 'closed') && closedShifts.length > 0 && (
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px', paddingLeft: '2px' }}>Closed ({closedShifts.length})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {closedShifts.map(shift => <ShiftCard key={shift.id} shift={shift} />)}
          </div>
        </div>
      )}

      {!loading && shifts.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '11px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: '#2563EB' }}><IconGauge /></div>
          <div style={{ fontWeight: 600, color: '#1E293B', fontSize: '14px' }}>No shifts found</div>
          <div style={{ color: '#64748B', fontSize: '12px', marginTop: '4px' }}>Open a new shift to get started</div>
        </div>
      )}
    </div>
  );
}

// ─── Shift Card ──────────────────────────────────────────────────────────────

function ShiftCard({ shift, isClosing, closeData, setNozzleClose, closeErr, saving, error, onClose, onSubmit, onCancel }) {
  const isOpen   = shift.status === 'open';
  const nozzles  = (shift.shift_nozzles || []).sort((a, b) => a.nozzle_number - b.nozzle_number);

  return (
    <div style={{ background: 'white', borderRadius: '12px', border: `1px solid ${isOpen ? '#BBF7D0' : '#E2E8F0'}`, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>

      {/* Shift header row */}
      <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', borderBottom: '1px solid #F1F5F9' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: isOpen ? '#DCFCE7' : '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isOpen ? '#059669' : '#64748B', flexShrink: 0 }}>
            <IconGauge />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#0F172A' }}>
              {shift.machines?.name}
              <span style={{ fontWeight: 400, color: '#94A3B8', marginLeft: '6px', fontSize: '12px' }}>#{shift.machines?.machine_no}</span>
              {shift.shift_duration && (
                <span style={{ marginLeft: '8px', padding: '1px 7px', borderRadius: '999px', background: '#EFF6FF', color: '#2563EB', fontWeight: 600, fontSize: '10.5px' }}>
                  {shift.shift_duration}h
                </span>
              )}
            </div>
            <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>{shift.shift_date}</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isOpen && !isClosing && (
            <>
              <span style={{ padding: '3px 10px', borderRadius: '999px', background: '#DCFCE7', color: '#059669', fontSize: '11px', fontWeight: 700 }}>OPEN</span>
              <button onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '8px', border: '1.5px solid #2563EB', background: '#EFF6FF', color: '#2563EB', fontWeight: 600, fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>
                Close Shift
              </button>
            </>
          )}
          {!isOpen && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>{fmtPKR(shift.total_amount)}</div>
              <div style={{ fontSize: '11px', color: '#64748B' }}>{fmt(shift.total_liters)} Ltr total</div>
            </div>
          )}
        </div>
      </div>

      {/* Nozzle summary rows */}
      <div style={{ padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {nozzles.map(nz => (
          <div key={nz.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 10px', background: '#F8FAFC', borderRadius: '8px', flexWrap: 'wrap' }}>
            {/* Nozzle badge */}
            <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: 'linear-gradient(135deg, #2563EB, #1D4ED8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '11px', flexShrink: 0 }}>
              {nz.nozzle_number}
            </div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#1E293B', minWidth: '100px' }}>{nz.staff?.name || '—'}</span>
            <span style={{ fontSize: '11.5px', color: '#64748B', background: '#E2E8F0', padding: '1px 8px', borderRadius: '5px' }}>{nz.products?.name || '—'}</span>
            <span style={{ fontSize: '11.5px', color: '#475569' }}>Open: <strong>{fmt(nz.opening_reading)}</strong></span>
            {nz.closing_reading != null && (
              <>
                <span style={{ color: '#CBD5E1' }}>→</span>
                <span style={{ fontSize: '11.5px', color: '#475569' }}>Close: <strong>{fmt(nz.closing_reading)}</strong></span>
                <span style={{ fontSize: '11.5px', color: '#059669', fontWeight: 700 }}>{fmt(nz.liters_sold)} Ltr</span>
                <span style={{ fontSize: '11.5px', color: '#0F172A', fontWeight: 700, marginLeft: 'auto' }}>{fmtPKR(nz.amount)}</span>
              </>
            )}
          </div>
        ))}
      </div>

      {/* ── Closing form ── */}
      {isClosing && (
        <div style={{ borderTop: '1px solid #E2E8F0', padding: '16px', background: '#FAFBFC' }}>
          <div style={{ fontWeight: 700, fontSize: '13px', color: '#0F172A', marginBottom: '14px' }}>Enter Closing Readings</div>

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 12px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', marginBottom: '12px', color: '#B91C1C', fontSize: '12px' }}>
              <IconAlert />{error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
            {nozzles.map(nz => {
              const cd = closeData[nz.id] || {};
              const liters = parseFloat(cd.closing_reading || 0) - nz.opening_reading;
              const validLiters = !isNaN(liters) && liters > 0;
              const amount = validLiters ? liters * (nz.products?.selling_rate || 0) : 0;
              return (
                <div key={nz.id} style={{ background: 'white', border: `1.5px solid ${closeErr[`${nz.id}_reading`] ? '#FCA5A5' : '#E2E8F0'}`, borderRadius: '10px', padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: 'linear-gradient(135deg, #2563EB, #1D4ED8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '11px' }}>{nz.nozzle_number}</div>
                    <span style={{ fontWeight: 700, fontSize: '13px', color: '#0F172A' }}>Nozzle {nz.nozzle_number}</span>
                    <span style={{ fontSize: '11.5px', color: '#64748B' }}>{nz.staff?.name} · {nz.products?.name}</span>
                    {validLiters && (
                      <span style={{ marginLeft: 'auto', fontWeight: 700, color: '#059669', fontSize: '12px' }}>
                        {fmt(liters)} Ltr = {fmtPKR(amount)}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={lbl}>Closing Reading</label>
                      <input type="number" step="0.01" min={nz.opening_reading} placeholder={fmt(nz.opening_reading)}
                        value={cd.closing_reading ?? ''}
                        onChange={e => setNozzleClose(nz.id, 'closing_reading', e.target.value)}
                        style={{ ...inp, textAlign: 'right', fontWeight: 700 }}
                      />
                      <div style={{ fontSize: '10.5px', color: '#94A3B8', marginTop: '2px' }}>Opening: {fmt(nz.opening_reading)}</div>
                      {closeErr[`${nz.id}_reading`] && <p style={errS}><IconAlert />{closeErr[`${nz.id}_reading`]}</p>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                      <div style={{ background: validLiters ? '#F0FDF4' : '#F8FAFC', border: `1px solid ${validLiters ? '#BBF7D0' : '#E2E8F0'}`, borderRadius: '8px', padding: '8px 12px', width: '100%', textAlign: 'center' }}>
                        <div style={{ fontSize: '10.5px', color: validLiters ? '#059669' : '#94A3B8', fontWeight: 600 }}>Calculated</div>
                        <div style={{ fontSize: '14px', fontWeight: 800, color: validLiters ? '#065F46' : '#CBD5E1' }}>{fmtPKR(amount)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action buttons */}
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
