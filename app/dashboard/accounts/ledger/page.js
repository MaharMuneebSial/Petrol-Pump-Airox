'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getAccountById, getSales, getPurchases, getVouchers } from '../../../../lib/store';

const fmt = (n) => new Intl.NumberFormat('en-PK', { minimumFractionDigits: 2 }).format(n || 0);

function LedgerContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const [account, setAccount] = useState(null);
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const acc = await getAccountById(id);
      setAccount(acc);
      if (!acc) return;

      const allSales = await getSales();
      const allPurchases = await getPurchases();
      const allVouchers = await getVouchers();

      const salesEntries = allSales.filter(s => s.customerId === id).map(s => ({
        date: s.date,
        type: 'Sale',
        description: `Sale - ${s.note || 'Product sale'}`,
        debit: s.paymentMode === 'credit' ? parseFloat(s.total || 0) : 0,
        credit: s.paymentMode !== 'credit' ? parseFloat(s.total || 0) : 0,
      }));

      const purchaseEntries = allPurchases.filter(p => p.supplierId === id).map(p => ({
        date: p.date,
        type: 'Purchase',
        description: `Purchase - ${p.note || 'Product purchase'}`,
        debit: 0,
        credit: parseFloat(p.total || 0),
      }));

      const voucherEntries = allVouchers.filter(v => v.accountId === id).map(v => ({
        date: v.date,
        type: v.type === 'receipt' ? 'Cash Receipt' : 'Cash Payment',
        description: v.description || (v.type === 'receipt' ? 'Cash received' : 'Cash paid'),
        debit: v.type === 'payment' ? parseFloat(v.amount || 0) : 0,
        credit: v.type === 'receipt' ? parseFloat(v.amount || 0) : 0,
      }));

      const all = [...salesEntries, ...purchaseEntries, ...voucherEntries].sort((a, b) => new Date(a.date) - new Date(b.date));
      setEntries(all);
    };
    load();
  }, [id]);

  let runningBalance = account ? parseFloat(account.openingBalance || 0) : 0;
  const entriesWithBalance = entries.map(e => {
    runningBalance += e.debit - e.credit;
    return { ...e, balance: runningBalance };
  });

  if (!account) return (
    <div className="text-center py-20">
      <p style={{ color: '#94a3b8' }}>Account not found.</p>
      <Link href="/dashboard/accounts" style={{ color: '#0f1f5c' }}>← Back to Accounts</Link>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-sm" style={{ color: '#64748b' }}>
        <Link href="/dashboard/accounts" style={{ color: '#0f1f5c', textDecoration: 'none', fontWeight: 600 }}>Accounts</Link>
        <span>›</span>
        <span>Ledger - {account.name}</span>
      </div>

      <div className="ps-page-header">
        <div>
          <h1 className="ps-page-title">📒 Account Ledger</h1>
          <p className="ps-page-subtitle">{account.name} — {account.type}</p>
        </div>
      </div>

      {/* Account summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Account Name', value: account.name, color: '#0f1f5c' },
          { label: 'Type', value: account.type, color: '#7c3aed' },
          { label: 'Phone', value: account.phone || 'N/A', color: '#475569' },
          { label: 'Current Balance', value: `Rs. ${fmt(account.currentBalance)}`, color: parseFloat(account.currentBalance) > 0 ? '#ef4444' : '#10b981' },
        ].map(s => (
          <div key={s.label} className="ps-card p-4">
            <p className="text-xs" style={{ color: '#94a3b8' }}>{s.label}</p>
            <p className="font-bold text-sm mt-1" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="ps-card">
        <div className="px-5 py-3" style={{ borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
          <h2 className="font-semibold text-sm" style={{ color: '#0f1f5c' }}>Transaction History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="ps-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Date</th>
                <th>Type</th>
                <th>Description</th>
                <th className="text-right">Debit (Dr)</th>
                <th className="text-right">Credit (Cr)</th>
                <th className="text-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              {/* Opening */}
              <tr style={{ background: '#fffbeb' }}>
                <td className="text-xs" style={{ color: '#94a3b8' }}>—</td>
                <td className="text-sm" style={{ color: '#92400e' }}>Opening</td>
                <td><span className="badge badge-warning">Opening Balance</span></td>
                <td className="text-sm" style={{ color: '#92400e' }}>Opening balance brought forward</td>
                <td className="text-right text-sm font-semibold" style={{ color: '#b45309' }}>Rs. {fmt(account.openingBalance)}</td>
                <td className="text-right text-sm">—</td>
                <td className="text-right text-sm font-bold" style={{ color: '#0f1f5c' }}>Rs. {fmt(account.openingBalance)}</td>
              </tr>
              {entriesWithBalance.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center" style={{ color: '#94a3b8' }}>
                    No transactions yet
                  </td>
                </tr>
              ) : (
                entriesWithBalance.map((e, i) => (
                  <tr key={i}>
                    <td className="text-xs" style={{ color: '#94a3b8' }}>{i + 1}</td>
                    <td className="text-sm" style={{ color: '#475569' }}>{e.date}</td>
                    <td>
                      <span className={`badge ${e.type === 'Sale' ? 'badge-success' : e.type === 'Purchase' ? 'badge-warning' : 'badge-info'}`}>
                        {e.type}
                      </span>
                    </td>
                    <td className="text-sm" style={{ color: '#374151' }}>{e.description}</td>
                    <td className="text-right text-sm font-medium" style={{ color: e.debit > 0 ? '#ef4444' : '#94a3b8' }}>
                      {e.debit > 0 ? `Rs. ${fmt(e.debit)}` : '—'}
                    </td>
                    <td className="text-right text-sm font-medium" style={{ color: e.credit > 0 ? '#10b981' : '#94a3b8' }}>
                      {e.credit > 0 ? `Rs. ${fmt(e.credit)}` : '—'}
                    </td>
                    <td className="text-right text-sm font-bold" style={{ color: e.balance > 0 ? '#ef4444' : '#10b981' }}>
                      Rs. {fmt(Math.abs(e.balance))} {e.balance > 0 ? 'Dr' : 'Cr'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr style={{ background: '#f8fafc', borderTop: '2px solid #e2e8f0' }}>
                <td colSpan={4} className="py-3 px-4 font-bold text-sm" style={{ color: '#0f1f5c' }}>Closing Balance</td>
                <td colSpan={3} className="py-3 px-4 text-right font-bold" style={{ color: '#0f1f5c' }}>
                  Rs. {fmt(account.currentBalance)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function LedgerPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center" style={{ color: '#94a3b8' }}>Loading...</div>}>
      <LedgerContent />
    </Suspense>
  );
}
