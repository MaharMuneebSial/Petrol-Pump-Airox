'use client';
import { useState, useEffect } from 'react';
import { getExpenses } from '../../../../lib/store';

const fmt     = (n) => new Intl.NumberFormat('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);
const fmtDate = (d) => { try { return new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }); } catch { return d; } };

const CATEGORIES = ['Salaries','Utilities','Fuel','Maintenance','Rent','Office','Transport','Equipment','Security','Other'];
const CAT_COLORS = { Salaries:'#2563eb', Utilities:'#d97706', Fuel:'#059669', Maintenance:'#7c3aed', Rent:'#0891b2', Office:'#475569', Transport:'#ea580c', Equipment:'#9333ea', Security:'#0D1B3E', Other:'#64748b' };
const CAT_BG    = { Salaries:'#eff6ff', Utilities:'#fffbeb', Fuel:'#f0fdf4', Maintenance:'#f5f3ff', Rent:'#ecfeff', Office:'#f8fafc', Transport:'#fff7ed', Equipment:'#faf5ff', Security:'#eef2f7', Other:'#f8fafc' };
const CAT_BD    = { Salaries:'#bfdbfe', Utilities:'#fde68a', Fuel:'#bbf7d0', Maintenance:'#ddd6fe', Rent:'#a5f3fc', Office:'#e2e8f0', Transport:'#fed7aa', Equipment:'#e9d5ff', Security:'#c7d2fe', Other:'#e2e8f0' };

const PERIODS = [
  { label: 'Today',      key: 'today' },
  { label: 'Yesterday',  key: 'yesterday' },
  { label: 'This Week',  key: 'week' },
  { label: 'Last Week',  key: 'lastweek' },
  { label: 'This Month', key: 'month' },
  { label: 'Last Month', key: 'lastmonth' },
  { label: 'This Year',  key: 'year' },
  { label: 'Custom',     key: 'custom' },
];

function getPeriodRange(key, customFrom, customTo) {
  const now = new Date();
  const d   = (x) => x.toISOString().slice(0, 10);
  if (key === 'today')     { const t = d(now); return { from: t, to: t }; }
  if (key === 'yesterday') { const y = new Date(now); y.setDate(y.getDate()-1); const yd = d(y); return { from: yd, to: yd }; }
  if (key === 'week')      { const s = new Date(now); s.setDate(now.getDate()-now.getDay()); return { from: d(s), to: d(now) }; }
  if (key === 'lastweek')  { const s = new Date(now); s.setDate(now.getDate()-now.getDay()-7); const e2 = new Date(s); e2.setDate(s.getDate()+6); return { from: d(s), to: d(e2) }; }
  if (key === 'month')     { return { from: `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`, to: d(now) }; }
  if (key === 'lastmonth') { const f = new Date(now.getFullYear(), now.getMonth()-1, 1); const l = new Date(now.getFullYear(), now.getMonth(), 0); return { from: d(f), to: d(l) }; }
  if (key === 'year')      { return { from: `${now.getFullYear()}-01-01`, to: d(now) }; }
  if (key === 'custom')    { return { from: customFrom, to: customTo }; }
  return { from: '', to: '' };
}

// Group expenses by a key for breakdown tables
function groupBy(expenses, getKey) {
  const map = {};
  expenses.forEach(e => {
    const k = getKey(e);
    if (!map[k]) map[k] = { total: 0, count: 0 };
    map[k].total += e.amount;
    map[k].count += 1;
  });
  return Object.entries(map).sort((a, b) => b[1].total - a[1].total);
}

const IconReport  = () => <svg width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16l3-2 2 2 2-2 2 2 2-2 3 2V4a2 2 0 0 0-2-2z"/><line x1="8" y1="9" x2="16" y2="9"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="12" y2="17"/></svg>;
const IconCalendar= () => <svg width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;

export default function ExpenseReportPage() {
  const [expenses,    setExpenses]    = useState([]);
  const [period,      setPeriod]      = useState('month');
  const [customFrom,  setCustomFrom]  = useState('');
  const [customTo,    setCustomTo]    = useState('');
  const [catFilter,   setCatFilter]   = useState('');
  const [groupMode,   setGroupMode]   = useState('date'); // 'date' | 'category' | 'payment'
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    (async () => { setLoading(true); setExpenses(await getExpenses()); setLoading(false); })();
  }, []);

  const { from, to } = getPeriodRange(period, customFrom, customTo);

  const filtered = expenses.filter(e => {
    const d = e.date || '';
    return (!from || d >= from) && (!to || d <= to) && (!catFilter || e.category === catFilter);
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  const total   = filtered.reduce((s, e) => s + e.amount, 0);
  const avgDay  = (() => {
    if (!filtered.length) return 0;
    const days = new Set(filtered.map(e => e.date)).size;
    return total / (days || 1);
  })();
  const highest = filtered.reduce((m, e) => e.amount > m ? e.amount : m, 0);
  const topCat  = (() => { const byCat = {}; filtered.forEach(e => { byCat[e.category] = (byCat[e.category]||0)+e.amount; }); return Object.entries(byCat).sort((a,b)=>b[1]-a[1])[0]?.[0] || '—'; })();

  // Breakdown data
  const byCategory = groupBy(filtered, e => e.category);
  const byDate     = groupBy(filtered, e => e.date);
  const byPayment  = groupBy(filtered, e => e.paymentMode);
  const maxCatAmt  = byCategory[0]?.[1].total || 1;

  const pmLabel = (v) => ({ cash: 'Cash', bank_transfer: 'Bank Transfer', jazzcash: 'JazzCash', easypaisa: 'EasyPaisa' }[v] || v);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: '#e11d48', animation: 'spin 0.7s linear infinite', margin: '0 auto 12px' }} />
        <p style={{ color: '#64748b', fontSize: 13 }}>Loading report…</p>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,#e11d48,#f43f5e)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
          <IconReport />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0D1B3E', letterSpacing: '-0.025em', lineHeight: 1.2 }}>Expense Report</h1>
          <p style={{ margin: 0, fontSize: '11.5px', color: '#94a3b8', marginTop: 1 }}>Detailed breakdown by period, category & payment method</p>
        </div>
      </div>

      {/* ── Period selector ── */}
      <div className="ps-card" style={{ padding: '10px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '11px', fontWeight: 700, color: '#94a3b8' }}><IconCalendar /> Period</span>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {PERIODS.map(p => (
              <button key={p.key} onClick={() => setPeriod(p.key)}
                style={{ padding: '5px 12px', borderRadius: 999, fontSize: '11px', fontWeight: 700, border: `1.5px solid ${period === p.key ? '#e11d48' : '#e2e8f0'}`, background: period === p.key ? '#fef2f2' : '#fff', color: period === p.key ? '#e11d48' : '#64748b', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.12s' }}>
                {p.label}
              </button>
            ))}
          </div>
          {/* Category filter */}
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
            style={{ marginLeft: 'auto', padding: '5px 10px', fontSize: '12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontFamily: 'inherit', outline: 'none', color: '#0D1B3E', background: '#fff', cursor: 'pointer' }}>
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Custom date range */}
        {period === 'custom' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, paddingTop: 10, borderTop: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>From</span>
            <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
              style={{ padding: '5px 10px', fontSize: '12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontFamily: 'inherit', outline: 'none', color: '#0D1B3E' }} />
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>To</span>
            <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
              style={{ padding: '5px 10px', fontSize: '12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontFamily: 'inherit', outline: 'none', color: '#0D1B3E' }} />
          </div>
        )}
      </div>

      {/* ── Summary stat cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {[
          { label: 'Total Expenses', value: `Rs. ${fmt(total)}`,       color: '#e11d48', sub: `${filtered.length} transactions` },
          { label: 'Daily Average',  value: `Rs. ${fmt(avgDay)}`,      color: '#d97706', sub: 'Per day in period' },
          { label: 'Highest Single', value: `Rs. ${fmt(highest)}`,     color: '#7c3aed', sub: 'Largest transaction' },
          { label: 'Top Category',   value: topCat,                    color: '#2563eb', sub: 'Most spent category' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 11, border: '1px solid #e8edf4', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', padding: '13px 16px' }}>
            <p style={{ margin: 0, fontSize: '9.5px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</p>
            <p style={{ margin: '4px 0 2px', fontSize: '15px', fontWeight: 800, color: s.color, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', lineHeight: 1.2 }}>{s.value}</p>
            <p style={{ margin: 0, fontSize: '10px', color: '#b0b8c9', fontWeight: 500 }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Category Breakdown (bar chart) ── */}
      {byCategory.length > 0 && (
        <div className="ps-card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '10px 16px', borderBottom: '1px solid #f1f5f9', background: '#fafbfc', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#0D1B3E' }}>Breakdown by Category</span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#e11d48' }}>Rs. {fmt(total)}</span>
          </div>
          <div style={{ padding: '12px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 24px' }}>
            {byCategory.map(([cat, { total: amt, count }]) => {
              const pct = total > 0 ? Math.round((amt / total) * 100) : 0;
              const clr = CAT_COLORS[cat] || '#64748b';
              const bg2 = CAT_BG[cat]    || '#f8fafc';
              const bd2 = CAT_BD[cat]    || '#e2e8f0';
              return (
                <div key={cat}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ display: 'inline-flex', padding: '2px 9px', borderRadius: 999, fontSize: '10px', fontWeight: 700, background: bg2, color: clr, border: `1px solid ${bd2}` }}>{cat}</span>
                      <span style={{ fontSize: '10px', color: '#94a3b8' }}>{count} txn{count !== 1 ? 's' : ''}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8' }}>{pct}%</span>
                      <span style={{ fontSize: '11.5px', fontWeight: 800, color: clr, fontVariantNumeric: 'tabular-nums' }}>Rs. {fmt(amt)}</span>
                    </div>
                  </div>
                  <div style={{ height: 6, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ width: `${(amt / maxCatAmt) * 100}%`, height: '100%', background: clr, borderRadius: 999, transition: 'width 0.7s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Payment Method Breakdown ── */}
      {byPayment.length > 0 && (
        <div className="ps-card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '10px 16px', borderBottom: '1px solid #f1f5f9', background: '#fafbfc' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#0D1B3E' }}>Breakdown by Payment Method</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(byPayment.length, 4)}, 1fr)` }}>
            {byPayment.map(([pm, { total: amt, count }], i) => (
              <div key={pm} style={{ padding: '14px 18px', borderRight: i < byPayment.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                <p style={{ margin: 0, fontSize: '9.5px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{pmLabel(pm)}</p>
                <p style={{ margin: '4px 0 2px', fontSize: '15px', fontWeight: 800, color: '#0D1B3E', fontVariantNumeric: 'tabular-nums' }}>Rs. {fmt(amt)}</p>
                <p style={{ margin: 0, fontSize: '10px', color: '#b0b8c9' }}>{count} transaction{count !== 1 ? 's' : ''}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Detailed Transactions Table ── */}
      <div className="ps-card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '10px 16px', borderBottom: '1px solid #f1f5f9', background: '#fafbfc', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#0D1B3E' }}>All Transactions</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 999, fontSize: '10px', fontWeight: 700, background: '#fef2f2', color: '#e11d48', border: '1px solid #fecdd3', marginLeft: 4 }}>
            {filtered.length} records
          </span>
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
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8', fontSize: '13px' }}>
                  No expense records found for this period
                </td></tr>
              ) : filtered.map((e, i) => {
                const clr = CAT_COLORS[e.category] || '#64748b';
                const bg2 = CAT_BG[e.category]    || '#f8fafc';
                const bd2 = CAT_BD[e.category]    || '#e2e8f0';
                return (
                  <tr key={e.id}>
                    <td style={{ color: '#94a3b8', fontSize: '11.5px', fontWeight: 700, textAlign: 'center' }}>{i + 1}</td>
                    <td style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>{fmtDate(e.date)}</td>
                    <td>
                      <span style={{ display: 'inline-flex', padding: '3px 10px', borderRadius: 999, fontSize: '10.5px', fontWeight: 700, background: bg2, color: clr, border: `1px solid ${bd2}` }}>
                        {e.category}
                      </span>
                    </td>
                    <td style={{ fontSize: '12px', color: e.description ? '#475569' : '#cbd5e1', fontStyle: e.description ? 'normal' : 'italic' }}>
                      {e.description || 'No notes'}
                    </td>
                    <td style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 500 }}>{pmLabel(e.paymentMode)}</td>
                    <td style={{ textAlign: 'right', fontSize: '13px', fontWeight: 800, color: '#e11d48', fontVariantNumeric: 'tabular-nums' }}>
                      Rs. {fmt(e.amount)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr style={{ background: '#fafbfc', borderTop: '2px solid #f1f5f9' }}>
                  <td colSpan={5} style={{ padding: '9px 14px', fontWeight: 700, fontSize: '12px', color: '#0D1B3E' }}>Total — {filtered.length} records</td>
                  <td style={{ padding: '9px 14px', textAlign: 'right', fontWeight: 800, color: '#e11d48', fontSize: '14px', fontVariantNumeric: 'tabular-nums' }}>Rs. {fmt(total)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
