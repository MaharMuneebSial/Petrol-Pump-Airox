'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAccounts, getSales, getPurchases, getVouchers, getCompany } from '../../../../lib/store';
import ExportToolbar from '../../../../components/ExportToolbar';

const fmt = (n) => new Intl.NumberFormat('en-PK', { minimumFractionDigits: 2 }).format(n || 0);

const typeColors = { Customer: '#2563EB', Supplier: '#D97706', Employee: '#059669', Other: '#7C3AED' };
const typeBg    = { Customer: '#EFF6FF', Supplier: '#FFFBEB', Employee: '#F0FDF4', Other: '#F5F3FF' };

/* ── Account Selector (shown when no ?id) ── */
function AccountSelector({ accounts, onSelect }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');

  const filtered = accounts.filter(a => {
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) || a.phone?.includes(search);
    const matchType   = !filter || a.type === filter;
    return matchSearch && matchType;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Header */}
      <div>
        <h1 className="ps-page-title">Account Ledger</h1>
        <p className="ps-page-subtitle">Select an account to view its ledger</p>
      </div>

      <div className="ps-card" style={{ overflow: 'visible' }}>
        {/* Toolbar */}
        <div className="ps-toolbar">
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </span>
            <input
              className="ps-input"
              placeholder="Search by name or phone…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: '32px', maxWidth: '260px' }}
            />
          </div>
          <select
            className="ps-input"
            value={filter}
            onChange={e => setFilter(e.target.value)}
            style={{ maxWidth: '150px' }}
          >
            <option value="">All Types</option>
            <option>Customer</option>
            <option>Supplier</option>
            <option>Employee</option>
            <option>Other</option>
          </select>
          <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#64748B', fontWeight: 500 }}>
            {filtered.length} account{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Account list */}
        <div>
          {filtered.length === 0 ? (
            <div style={{ padding: '48px 20px', textAlign: 'center', color: '#94A3B8' }}>
              No accounts found
            </div>
          ) : (
            filtered.map((acc, i) => (
              <button
                key={acc.id}
                onClick={() => onSelect(acc.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '12px 16px',
                  borderBottom: i < filtered.length - 1 ? '1px solid #F1F5F9' : 'none',
                  background: 'white',
                  border: 'none',
                  borderBottomColor: '#F1F5F9',
                  borderBottomStyle: i < filtered.length - 1 ? 'solid' : 'none',
                  borderBottomWidth: i < filtered.length - 1 ? '1px' : '0',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                onMouseLeave={e => e.currentTarget.style.background = 'white'}
              >
                {/* Avatar */}
                <div style={{
                  width: '36px', height: '36px', borderRadius: '9px', flexShrink: 0,
                  background: typeBg[acc.type] || '#F1F5F9',
                  color: typeColors[acc.type] || '#64748B',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: '13px',
                }}>
                  {acc.name.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: '#1E293B' }}>{acc.name}</div>
                  <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '1px' }}>
                    {acc.phone || 'No phone'} {acc.address ? `· ${acc.address}` : ''}
                  </div>
                </div>

                {/* Type badge */}
                <span style={{
                  padding: '2px 10px', borderRadius: '999px',
                  fontSize: '10.5px', fontWeight: 700,
                  background: typeBg[acc.type] || '#F1F5F9',
                  color: typeColors[acc.type] || '#64748B',
                }}>
                  {acc.type}
                </span>

                {/* Balance */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '1px' }}>Balance</div>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: parseFloat(acc.currentBalance) > 0 ? '#EF4444' : '#10B981' }}>
                    Rs. {fmt(acc.currentBalance)}
                  </div>
                </div>

                {/* Arrow */}
                <svg width="14" height="14" fill="none" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Ledger View ── */
function LedgerView({ account, entries }) {
  let runningBalance = parseFloat(account.openingBalance || 0);
  const entriesWithBalance = entries.map(e => {
    runningBalance += e.debit - e.credit;
    return { ...e, balance: runningBalance };
  });

  const exportColumns = [
    { label: '#',            key: 'no' },
    { label: 'Date',         key: 'date' },
    { label: 'Type',         key: 'type' },
    { label: 'Description',  key: 'description' },
    { label: 'Debit (Dr)',   key: 'debit',   align: 'right' },
    { label: 'Credit (Cr)',  key: 'credit',  align: 'right' },
    { label: 'Balance',      key: 'balance', align: 'right' },
    { label: 'Dr/Cr',        key: 'drcr' },
  ];

  const openingRow = {
    no: '—', date: 'Opening', type: 'Opening Balance',
    description: 'Opening balance brought forward',
    debit: `Rs. ${fmt(account.openingBalance)}`, credit: '—',
    balance: `Rs. ${fmt(account.openingBalance)}`, drcr: 'Dr',
  };

  const exportData = [
    openingRow,
    ...entriesWithBalance.map((e, i) => ({
      no:          i + 1,
      date:        e.date,
      type:        e.type,
      description: e.description,
      debit:       e.debit  > 0 ? `Rs. ${fmt(e.debit)}`  : '—',
      credit:      e.credit > 0 ? `Rs. ${fmt(e.credit)}` : '—',
      balance:     `Rs. ${fmt(Math.abs(e.balance))}`,
      drcr:        e.balance > 0 ? 'Dr' : 'Cr',
    })),
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11.5px', color: '#94A3B8' }}>
        <Link href="/dashboard/accounts" style={{ color: '#64748B', textDecoration: 'none', fontWeight: 500 }}>Accounts</Link>
        <span>›</span>
        <Link href="/dashboard/accounts/ledger" style={{ color: '#64748B', textDecoration: 'none', fontWeight: 500 }}>Ledger</Link>
        <span>›</span>
        <span style={{ color: '#1E293B', fontWeight: 600 }}>{account.name}</span>
      </div>

      {/* Header */}
      <div className="ps-page-header" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="ps-page-title">Account Ledger</h1>
          <p className="ps-page-subtitle">{account.name} — {account.type}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <ExportToolbar
            title="Account Ledger"
            subtitle={`${account.name}  |  ${account.type}${account.phone ? '  |  ' + account.phone : ''}`}
            filename={`Ledger_${account.name.replace(/\s+/g, '_')}`}
            columns={exportColumns}
            data={exportData}
            summary={[
              { label: 'Account',         value: account.name },
              { label: 'Type',            value: account.type },
              { label: 'Opening Balance', value: `Rs. ${fmt(account.openingBalance)}` },
              { label: 'Transactions',    value: entries.length },
              { label: 'Closing Balance', value: `Rs. ${fmt(account.currentBalance)}` },
            ]}
          />
          <Link href="/dashboard/accounts/ledger" className="btn-ghost">← All Accounts</Link>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px' }}>
        {[
          { label: 'Account Name',    value: account.name,                         color: '#1E293B' },
          { label: 'Type',            value: account.type,                         color: typeColors[account.type] || '#64748B' },
          { label: 'Phone',           value: account.phone || '—',                color: '#475569' },
          { label: 'Current Balance', value: `Rs. ${fmt(account.currentBalance)}`, color: parseFloat(account.currentBalance) > 0 ? '#EF4444' : '#10B981' },
        ].map(s => (
          <div key={s.label} className="ps-card" style={{ padding: '12px 14px' }}>
            <p style={{ fontSize: '10.5px', fontWeight: 600, color: '#94A3B8', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</p>
            <p style={{ fontSize: '13px', fontWeight: 700, color: s.color, margin: 0 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Transaction table */}
      <div className="ps-card">
        <div className="form-section-header">
          <p className="form-section-title">Transaction History</p>
        </div>
      </div>

      <table className="ps-table" style={{ width: '100%' }}>
        <thead>
          <tr>
            <th>#</th><th>Date</th><th>Type</th><th>Description</th>
            <th style={{ textAlign: 'right' }}>Debit (Dr)</th>
            <th style={{ textAlign: 'right' }}>Credit (Cr)</th>
            <th style={{ textAlign: 'right' }}>Balance</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ background: '#FFFBEB' }}>
            <td style={{ color: '#94A3B8', fontSize: '12px' }}>—</td>
            <td style={{ color: '#92400E', fontSize: '12px' }}>Opening</td>
            <td><span className="badge badge-warning">Opening Balance</span></td>
            <td style={{ color: '#92400E', fontSize: '12px' }}>Opening balance brought forward</td>
            <td style={{ textAlign: 'right', color: '#B45309', fontSize: '12px', fontWeight: 600 }}>Rs. {fmt(account.openingBalance)}</td>
            <td style={{ textAlign: 'right', color: '#94A3B8', fontSize: '12px' }}>—</td>
            <td style={{ textAlign: 'right', color: '#1E293B', fontSize: '12px', fontWeight: 700 }}>Rs. {fmt(account.openingBalance)}</td>
          </tr>
          {entriesWithBalance.length === 0 ? (
            <tr><td colSpan={7} style={{ padding: '40px 20px', textAlign: 'center', color: '#94A3B8' }}>No transactions yet</td></tr>
          ) : entriesWithBalance.map((e, i) => (
            <tr key={i}>
              <td style={{ color: '#94A3B8', fontSize: '12px' }}>{i + 1}</td>
              <td style={{ color: '#475569', fontSize: '12px' }}>{e.date}</td>
              <td><span className={`badge ${e.type === 'Sale' ? 'badge-success' : e.type === 'Purchase' ? 'badge-warning' : 'badge-info'}`}>{e.type}</span></td>
              <td style={{ color: '#374151', fontSize: '12px' }}>{e.description}</td>
              <td style={{ textAlign: 'right', fontSize: '12px', fontWeight: 500, color: e.debit > 0 ? '#EF4444' : '#94A3B8' }}>{e.debit > 0 ? `Rs. ${fmt(e.debit)}` : '—'}</td>
              <td style={{ textAlign: 'right', fontSize: '12px', fontWeight: 500, color: e.credit > 0 ? '#10B981' : '#94A3B8' }}>{e.credit > 0 ? `Rs. ${fmt(e.credit)}` : '—'}</td>
              <td style={{ textAlign: 'right', fontSize: '12px', fontWeight: 700, color: e.balance > 0 ? '#EF4444' : '#10B981' }}>Rs. {fmt(Math.abs(e.balance))} {e.balance > 0 ? 'Dr' : 'Cr'}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={4} style={{ padding: '10px 14px', fontWeight: 700, fontSize: '13px', color: '#0F1F5C' }}>Closing Balance</td>
            <td colSpan={3} style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, fontSize: '13px', color: '#0F1F5C' }}>Rs. {fmt(account.currentBalance)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

/* ── Main Content ── */
function LedgerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get('id');

  const [allAccounts, setAllAccounts] = useState([]);
  const [account, setAccount]         = useState(null);
  const [entries, setEntries]         = useState([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const accounts = await getAccounts();
      setAllAccounts(accounts);

      if (!id) { setLoading(false); return; }

      const acc = accounts.find(a => String(a.id) === String(id)) || null;
      setAccount(acc);

      if (acc) {
        const [allSales, allPurchases, allVouchers] = await Promise.all([getSales(), getPurchases(), getVouchers()]);

        const salesEntries = allSales.filter(s => s.customerId === id).map(s => ({
          date: s.date, type: 'Sale',
          description: `Sale - ${s.note || 'Product sale'}`,
          debit:  s.paymentMode === 'credit' ? parseFloat(s.total || 0) : 0,
          credit: s.paymentMode !== 'credit' ? parseFloat(s.total || 0) : 0,
        }));
        const purchaseEntries = allPurchases.filter(p => p.supplierId === id).map(p => ({
          date: p.date, type: 'Purchase',
          description: `Purchase - ${p.note || 'Product purchase'}`,
          debit: 0, credit: parseFloat(p.total || 0),
        }));
        const voucherEntries = allVouchers.filter(v => v.accountId === id).map(v => ({
          date: v.date,
          type: v.type === 'receipt' ? 'Cash Receipt' : 'Cash Payment',
          description: v.description || (v.type === 'receipt' ? 'Cash received' : 'Cash paid'),
          debit:  v.type === 'payment' ? parseFloat(v.amount || 0) : 0,
          credit: v.type === 'receipt' ? parseFloat(v.amount || 0) : 0,
        }));

        const all = [...salesEntries, ...purchaseEntries, ...voucherEntries]
          .sort((a, b) => new Date(a.date) - new Date(b.date));
        setEntries(all);
      }

      setLoading(false);
    };
    load();
  }, [id]);

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '80px 20px', color: '#94A3B8', fontSize: '13px' }}>
      Loading…
    </div>
  );

  if (!id || !account) return (
    <AccountSelector
      accounts={allAccounts}
      onSelect={(accId) => router.push(`/dashboard/accounts/ledger?id=${accId}`)}
    />
  );

  return <LedgerView account={account} entries={entries} />;
}

export default function LedgerPage() {
  return (
    <Suspense fallback={<div style={{ padding: '80px 20px', textAlign: 'center', color: '#94A3B8' }}>Loading…</div>}>
      <LedgerContent />
    </Suspense>
  );
}
