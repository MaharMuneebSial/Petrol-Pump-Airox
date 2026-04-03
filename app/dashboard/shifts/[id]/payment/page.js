'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../../../lib/supabase';
import { getCompany } from '../../../../../lib/store';

const fmt    = n => new Intl.NumberFormat('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);
const fmtPKR = n => `Rs. ${fmt(n)}`;

// ── Icons ──────────────────────────────────────────────────────────────────
const IconBack    = () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>;
const IconCheck   = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>;
const IconAlert   = () => <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const IconGauge   = () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 6v6l4 2"/><circle cx="18" cy="6" r="3"/></svg>;
const IconUser    = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IconCash    = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/><path d="M6 12h.01M18 12h.01"/></svg>;
const IconWallet  = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/></svg>;
const IconCredit  = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;

// ── Styles ──────────────────────────────────────────────────────────────────
const lbl = { fontSize: '11px', fontWeight: 600, color: '#64748B', marginBottom: '4px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' };
const inp = { width: '100%', padding: '8px 10px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '13px', color: '#1E293B', background: 'white', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };
const errS = { fontSize: '10.5px', color: '#ef4444', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '3px' };

// Group shift_nozzles by staff_id
function groupByStaff(nozzles) {
  const groups = {};
  for (const nz of nozzles) {
    const sid = nz.staff_id;
    if (!groups[sid]) groups[sid] = { staff: nz.staff, nozzles: [] };
    groups[sid].nozzles.push(nz);
  }
  return groups;
}

export default function ShiftPaymentPage() {
  const { id } = useParams();
  const router = useRouter();
  const [shift,    setShift]    = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [payments, setPayments] = useState({}); // { staff_id: { cash, wallet, credit, account_id, wallet_phone, wallet_txn_id, wallet_sender_name } }
  const [errors,   setErrors]   = useState({});
  const [saving,   setSaving]   = useState(false);
  const [saveErr,  setSaveErr]  = useState('');

  useEffect(() => {
    loadShift();
    loadAccounts();
  }, [id]);

  const loadShift = async () => {
    const { data } = await supabase
      .from('shifts')
      .select(`
        id, shift_date, shift_duration, status, opened_at,
        shift_nozzles(
          id, nozzle_number, machine_id, staff_id, product_id,
          opening_reading, closing_reading, liters_sold, rate, amount,
          machines(id, name, machine_no),
          staff(id, name, role),
          products(id, name, unit, selling_rate)
        )
      `)
      .eq('id', id)
      .single();

    if (data) {
      const nozzles = (data.shift_nozzles || []).sort((a, b) => a.nozzle_number - b.nozzle_number);
      setShift({ ...data, shift_nozzles: nozzles });

      const groups = groupByStaff(nozzles);
      const init = {};
      for (const sid of Object.keys(groups)) {
        init[sid] = { cash_amount: '', wallet_amount: '', credit_amount: '', account_id: '', wallet_phone: '', wallet_txn_id: '', wallet_sender_name: '' };
      }
      setPayments(init);
    }
    setLoading(false);
  };

  const loadAccounts = async () => {
    const company = getCompany();
    if (!company) return;
    const { data } = await supabase.from('accounts').select('id, name, type').eq('company_id', company.id).eq('is_active', true);
    setAccounts(data || []);
  };

  const setPay = (staffId, field, value) => {
    setPayments(p => ({ ...p, [staffId]: { ...p[staffId], [field]: value } }));
    setErrors(p => { const n = { ...p }; delete n[`${staffId}_sum`]; delete n[`${staffId}_${field}`]; return n; });
  };

  const getTotal = (nozzles) => nozzles.reduce((s, nz) => s + (nz.amount || 0), 0);

  const validate = (groups) => {
    const errs = {};
    for (const [sid, { nozzles }] of Object.entries(groups)) {
      const total  = getTotal(nozzles);
      const pp     = payments[sid] || {};
      const cash   = parseFloat(pp.cash_amount   || 0);
      const wallet = parseFloat(pp.wallet_amount  || 0);
      const credit = parseFloat(pp.credit_amount  || 0);
      const sum    = cash + wallet + credit;
      if (Math.abs(sum - total) > 0.01) {
        errs[`${sid}_sum`] = `Total must be ${fmtPKR(total)} — currently ${fmtPKR(sum)}`;
      }
      if (credit > 0 && !pp.account_id) {
        errs[`${sid}_account_id`] = 'Select a credit account';
      }
    }
    return errs;
  };

  const handleSubmit = async () => {
    if (!shift) return;
    const nozzles = shift.shift_nozzles || [];
    const groups  = groupByStaff(nozzles);
    const errs    = validate(groups);
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSaving(true);
    setSaveErr('');

    const company = getCompany();
    if (!company?.id) {
      setSaveErr('Session error — please sign out and sign in again.');
      setSaving(false);
      return;
    }

    let shiftTotalLiters = 0;
    let shiftTotalAmount = 0;

    try {
      for (const [sid, { nozzles: staffNozzles }] of Object.entries(groups)) {
        const pp          = payments[sid] || {};
        const personTotal = getTotal(staffNozzles);
        const cash        = parseFloat(pp.cash_amount   || 0);
        const wallet      = parseFloat(pp.wallet_amount  || 0);
        const credit      = parseFloat(pp.credit_amount  || 0);

        const rCash   = personTotal > 0 ? cash   / personTotal : 0;
        const rWallet = personTotal > 0 ? wallet / personTotal : 0;
        const rCredit = personTotal > 0 ? credit / personTotal : 0;

        for (const nz of staffNozzles) {
          shiftTotalLiters += nz.liters_sold || 0;
          shiftTotalAmount += nz.amount      || 0;
          if ((nz.liters_sold || 0) <= 0) continue;

          const primaryMode = credit === personTotal ? 'credit'
            : wallet === personTotal ? 'wallet'
            : 'cash';

          const { data: saleData, error: saleErr } = await supabase.from('sales').insert({
            company_id:   company.id,
            sale_date:    shift.shift_date,
            product_id:   nz.product_id,
            account_id:   credit > 0 ? pp.account_id : null,
            quantity:     nz.liters_sold,
            rate:         nz.rate,
            total_amount: nz.amount,
            payment_mode: primaryMode,
            staff_id:     sid,
            shift_id:     shift.id,
            note:         `Shift — ${nz.machines?.name || ''} N${nz.nozzle_number} — ${nz.staff?.name}`,
          }).select('id').single();

          if (saleErr || !saleData) {
            setSaveErr(`Sale insert failed: ${saleErr?.message || 'unknown error'}`);
            setSaving(false);
            return;
          }

          const payRows = [];
          if (cash > 0) payRows.push({
            company_id: company.id, sale_id: saleData.id,
            payment_mode: 'cash',
            amount:       parseFloat((nz.amount * rCash).toFixed(2)),
            account_id:   null, meta: {},
          });
          if (wallet > 0) payRows.push({
            company_id: company.id, sale_id: saleData.id,
            payment_mode: 'wallet',
            amount:       parseFloat((nz.amount * rWallet).toFixed(2)),
            account_id:   null,
            meta: { phone: pp.wallet_phone || null, txn_id: pp.wallet_txn_id || null, sender: pp.wallet_sender_name || null },
          });
          if (credit > 0) payRows.push({
            company_id: company.id, sale_id: saleData.id,
            payment_mode: 'credit',
            amount:       parseFloat((nz.amount * rCredit).toFixed(2)),
            account_id:   pp.account_id, meta: {},
          });
          if (payRows.length) {
            const { error: pyErr } = await supabase.from('sale_payments').insert(payRows);
            if (pyErr) console.warn('sale_payments insert warn:', pyErr.message);
          }
        }

        const { error: spErr } = await supabase.from('shift_payments').insert({
          company_id:         company.id,
          shift_id:           shift.id,
          staff_id:           sid,
          total_amount:       personTotal,
          cash_amount:        cash,
          wallet_amount:      wallet,
          credit_amount:      credit,
          account_id:         credit > 0 ? pp.account_id : null,
          wallet_phone:       pp.wallet_phone        || null,
          wallet_txn_id:      pp.wallet_txn_id       || null,
          wallet_sender_name: pp.wallet_sender_name  || null,
        });
        if (spErr) console.warn('shift_payments insert warn:', spErr.message);
      }

      const { error: shiftErr } = await supabase.from('shifts').update({
        status:       'closed',
        total_liters: parseFloat(shiftTotalLiters.toFixed(2)),
        total_amount: parseFloat(shiftTotalAmount.toFixed(2)),
        closed_at:    new Date().toISOString(),
      }).eq('id', shift.id);

      if (shiftErr) {
        setSaveErr(`Failed to close shift: ${shiftErr.message}`);
        setSaving(false);
        return;
      }

      setSaving(false);
      router.push('/dashboard/shifts');
    } catch (err) {
      setSaveErr(`Unexpected error: ${err.message}`);
      setSaving(false);
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '60px' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '3px solid #E2E8F0', borderTopColor: '#2563EB', animation: 'spin 0.7s linear infinite' }} />
      </div>
    );
  }

  if (!shift) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <p style={{ color: '#64748B' }}>Shift not found.</p>
        <Link href="/dashboard/shifts" style={{ color: '#2563EB', fontWeight: 600 }}>← Back to Shifts</Link>
      </div>
    );
  }

  const groups = groupByStaff(shift.shift_nozzles || []);
  const grandTotal = (shift.shift_nozzles || []).reduce((s, nz) => s + (nz.amount || 0), 0);
  const grandLiters = (shift.shift_nozzles || []).reduce((s, nz) => s + (nz.liters_sold || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: 'linear-gradient(135deg, #0D1B3E, #122158)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
            <IconGauge />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#94A3B8', marginBottom: '1px' }}>
              <Link href="/dashboard/shifts" style={{ color: '#0D1B3E', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <IconBack /> Shifts
              </Link>
              <span style={{ color: '#CBD5E1' }}>/</span>
              <span>Payment Collection</span>
            </div>
            <h1 style={{ fontSize: '15px', fontWeight: 800, color: '#0D1B3E', margin: 0 }}>
              {shift.machines?.name} — {shift.shift_date}
              {shift.shift_duration && <span style={{ fontWeight: 400, color: '#64748B', fontSize: '13px', marginLeft: '8px' }}>{shift.shift_duration}h shift</span>}
            </h1>
          </div>
        </div>
      </div>

      {/* ── Shift summary banner ── */}
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '14px 18px', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: '10.5px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Liters</div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>{fmt(grandLiters)} Ltr</div>
        </div>
        <div>
          <div style={{ fontSize: '10.5px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Receivable</div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#059669' }}>{fmtPKR(grandTotal)}</div>
        </div>
        <div>
          <div style={{ fontSize: '10.5px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Staff on Duty</div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>{Object.keys(groups).length}</div>
        </div>
      </div>

      {/* ── Save error ── */}
      {saveErr && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', color: '#B91C1C', fontSize: '12.5px' }}>
          <IconAlert /> {saveErr}
        </div>
      )}

      {/* ── Per-person payment blocks ── */}
      {Object.entries(groups).map(([staffId, { staff, nozzles }]) => {
        const personTotal = getTotal(nozzles);
        const pp          = payments[staffId] || {};
        const cash        = parseFloat(pp.cash_amount   || 0);
        const wallet      = parseFloat(pp.wallet_amount  || 0);
        const credit      = parseFloat(pp.credit_amount  || 0);
        const allocated   = cash + wallet + credit;
        const remaining   = personTotal - allocated;
        const balanced    = Math.abs(remaining) < 0.01;

        return (
          <div key={staffId} style={{ background: 'white', borderRadius: '14px', border: `1.5px solid ${balanced && allocated > 0 ? '#BBF7D0' : '#E2E8F0'}`, overflow: 'hidden' }}>

            {/* Person header */}
            <div style={{ padding: '12px 16px', background: '#FAFBFC', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #6366F1, #4F46E5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                  <IconUser />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#0F172A' }}>{staff?.name || 'Unknown'}</div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>
                    {nozzles.map(nz => `Nozzle ${nz.nozzle_number}`).join(' · ')}
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: '#64748B' }}>Total Due</div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>{fmtPKR(personTotal)}</div>
              </div>
            </div>

            {/* Nozzle breakdown (read-only) */}
            <div style={{ padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: '5px', borderBottom: '1px solid #F1F5F9' }}>
              {nozzles.map(nz => (
                <div key={nz.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', background: '#F8FAFC', borderRadius: '8px', flexWrap: 'wrap' }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '5px', background: 'linear-gradient(135deg, #2563EB, #1D4ED8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '10px', flexShrink: 0 }}>
                    {nz.nozzle_number}
                  </div>
                  <span style={{ fontSize: '11.5px', color: '#475569', minWidth: '80px' }}>{nz.products?.name}</span>
                  <span style={{ fontSize: '11.5px', color: '#64748B' }}>
                    {fmt(nz.opening_reading)} → {fmt(nz.closing_reading)}
                  </span>
                  <span style={{ fontSize: '11.5px', color: '#059669', fontWeight: 600 }}>{fmt(nz.liters_sold)} Ltr</span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A', marginLeft: 'auto' }}>{fmtPKR(nz.amount)}</span>
                </div>
              ))}
            </div>

            {/* Payment inputs */}
            <div style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                How was payment collected?
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px', marginBottom: '12px' }}>

                {/* Cash */}
                <div>
                  <label style={lbl}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#059669' }}>
                      <IconCash /> Cash (Rs.)
                    </span>
                  </label>
                  <input type="number" step="0.01" min="0" placeholder="0.00"
                    value={pp.cash_amount}
                    onChange={e => setPay(staffId, 'cash_amount', e.target.value)}
                    style={{ ...inp, textAlign: 'right', fontWeight: 700, borderColor: '#BBF7D0', background: '#F0FDF4' }}
                  />
                </div>

                {/* Wallet */}
                <div>
                  <label style={lbl}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#7C3AED' }}>
                      <IconWallet /> Wallet (Rs.)
                    </span>
                  </label>
                  <input type="number" step="0.01" min="0" placeholder="0.00"
                    value={pp.wallet_amount}
                    onChange={e => setPay(staffId, 'wallet_amount', e.target.value)}
                    style={{ ...inp, textAlign: 'right', fontWeight: 700, borderColor: '#DDD6FE', background: '#F5F3FF' }}
                  />
                </div>

                {/* Credit */}
                <div>
                  <label style={lbl}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#DC2626' }}>
                      <IconCredit /> Credit (Rs.)
                    </span>
                  </label>
                  <input type="number" step="0.01" min="0" placeholder="0.00"
                    value={pp.credit_amount}
                    onChange={e => setPay(staffId, 'credit_amount', e.target.value)}
                    style={{ ...inp, textAlign: 'right', fontWeight: 700, borderColor: '#FECACA', background: '#FFF5F5' }}
                  />
                </div>
              </div>

              {/* Credit account selector */}
              {credit > 0 && (
                <div style={{ marginBottom: '10px' }}>
                  <label style={lbl}>Credit Customer Account <span style={{ color: '#DC2626' }}>*</span></label>
                  <select value={pp.account_id} onChange={e => setPay(staffId, 'account_id', e.target.value)}
                    style={{ ...inp, maxWidth: '320px', cursor: 'pointer', color: pp.account_id ? '#1E293B' : '#94A3B8' }}>
                    <option value="">Select customer account…</option>
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                  {errors[`${staffId}_account_id`] && <p style={errS}><IconAlert />{errors[`${staffId}_account_id`]}</p>}
                </div>
              )}

              {/* Wallet optional fields */}
              {wallet > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px', padding: '10px 14px', background: '#FAF5FF', borderRadius: '10px', border: '1px solid #DDD6FE', marginBottom: '10px' }}>
                  <div>
                    <label style={{ ...lbl, color: '#7C3AED' }}>Phone No. (optional)</label>
                    <input type="text" placeholder="03XX-XXXXXXX" value={pp.wallet_phone}
                      onChange={e => setPay(staffId, 'wallet_phone', e.target.value)} style={inp} />
                  </div>
                  <div>
                    <label style={{ ...lbl, color: '#7C3AED' }}>Transaction ID (optional)</label>
                    <input type="text" placeholder="TXN123…" value={pp.wallet_txn_id}
                      onChange={e => setPay(staffId, 'wallet_txn_id', e.target.value)} style={inp} />
                  </div>
                  <div>
                    <label style={{ ...lbl, color: '#7C3AED' }}>Sender Name (optional)</label>
                    <input type="text" placeholder="Name of sender" value={pp.wallet_sender_name}
                      onChange={e => setPay(staffId, 'wallet_sender_name', e.target.value)} style={inp} />
                  </div>
                </div>
              )}

              {/* Balance indicator */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', borderRadius: '10px',
                background: balanced && allocated > 0 ? '#F0FDF4' : remaining > 0 ? '#FFFBEB' : '#FFF5F5',
                border: `1px solid ${balanced && allocated > 0 ? '#BBF7D0' : remaining > 0 ? '#FDE68A' : '#FECACA'}`,
              }}>
                <div style={{ display: 'flex', gap: '18px', fontSize: '12px' }}>
                  <span style={{ color: '#64748B' }}>Allocated: <strong style={{ color: '#0F172A' }}>{fmtPKR(allocated)}</strong></span>
                  <span style={{ color: '#64748B' }}>Due: <strong style={{ color: '#0F172A' }}>{fmtPKR(personTotal)}</strong></span>
                </div>
                {balanced && allocated > 0 ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#059669', fontWeight: 700, fontSize: '12px' }}>
                    <IconCheck /> Balanced
                  </span>
                ) : (
                  <span style={{ color: remaining > 0 ? '#D97706' : '#DC2626', fontWeight: 700, fontSize: '12px' }}>
                    {remaining > 0 ? `${fmtPKR(remaining)} remaining` : `${fmtPKR(Math.abs(remaining))} over`}
                  </span>
                )}
              </div>
              {errors[`${staffId}_sum`] && <p style={{ ...errS, marginTop: '6px' }}><IconAlert />{errors[`${staffId}_sum`]}</p>}
            </div>
          </div>
        );
      })}

      {/* ── Submit ── */}
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Grand Total Receivable</div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#059669' }}>{fmtPKR(grandTotal)}</div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href="/dashboard/shifts" style={{
            padding: '10px 20px', borderRadius: '9px', border: '1.5px solid #E2E8F0',
            background: 'white', color: '#475569', fontWeight: 600, fontSize: '13px',
            textDecoration: 'none', display: 'inline-flex', alignItems: 'center',
          }}>
            Cancel
          </Link>
          <button onClick={handleSubmit} disabled={saving} style={{
            padding: '10px 28px', borderRadius: '9px', border: 'none',
            background: saving ? 'rgba(5,150,105,0.5)' : 'linear-gradient(135deg, #059669, #047857)',
            color: 'white', fontWeight: 700, fontSize: '13px',
            cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
            boxShadow: saving ? 'none' : '0 3px 10px rgba(5,150,105,0.35)',
          }}>
            {saving ? 'Recording…' : 'Confirm Payment & Close Shift'}
          </button>
        </div>
      </div>
    </div>
  );
}
