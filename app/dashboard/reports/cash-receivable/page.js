'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAccounts, getSales, getVouchers } from '../../../../lib/store';

const fmt = (n) => new Intl.NumberFormat('en-PK', { minimumFractionDigits: 2 }).format(n || 0);

export default function CashReceivablePage() {
  const [data, setData] = useState([]);

  useEffect(() => {
    const load = async () => {
      const accounts = await getAccounts();
      const customers = accounts.filter(a => a.type === 'Customer');
      setData(customers.map(c => ({
        ...c,
        balance: parseFloat(c.currentBalance || 0),
      })).filter(c => c.balance > 0));
    };
    load();
  }, []);

  const total = data.reduce((s, d) => s + d.balance, 0);

  return (
    <div className="space-y-5">
      <div className="ps-page-header">
        <div>
          <h1 className="ps-page-title">📥 Cash Receivable</h1>
          <p className="ps-page-subtitle">Customers who owe you money</p>
        </div>
        <Link href="/dashboard/accounts/add" className="btn-primary px-4 py-2 text-sm" style={{ textDecoration: 'none' }}>+ Add Customer</Link>
      </div>

      <div className="grid grid-cols-2 gap-4 max-w-sm">
        <div className="ps-card px-4 py-3">
          <p className="text-xs" style={{ color: '#94a3b8' }}>Total Debtors</p>
          <p className="text-xl font-bold" style={{ color: '#0f1f5c' }}>{data.length}</p>
        </div>
        <div className="ps-card px-4 py-3">
          <p className="text-xs" style={{ color: '#94a3b8' }}>Total Receivable</p>
          <p className="text-xl font-bold" style={{ color: '#10b981' }}>Rs. {fmt(total)}</p>
        </div>
      </div>

      <div className="ps-card">
        <div className="px-5 py-3" style={{ borderBottom: '1px solid #f1f5f9' }}>
          <h2 className="font-semibold text-sm" style={{ color: '#0f1f5c' }}>Receivable Accounts</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="ps-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Customer Name</th>
                <th>Phone</th>
                <th>Address</th>
                <th className="text-right">Amount Receivable</th>
                <th className="text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center" style={{ color: '#94a3b8' }}>
                  <p style={{ fontSize: '32px' }}>✅</p>
                  <p className="mt-2 font-medium">No outstanding receivables</p>
                </td></tr>
              ) : data.map((d, i) => (
                <tr key={d.id}>
                  <td className="text-sm" style={{ color: '#94a3b8' }}>{i + 1}</td>
                  <td className="font-semibold text-sm" style={{ color: '#0f1f5c' }}>{d.name}</td>
                  <td className="text-sm" style={{ color: '#475569' }}>{d.phone || '—'}</td>
                  <td className="text-sm" style={{ color: '#475569' }}>{d.address || '—'}</td>
                  <td className="text-right font-bold text-sm" style={{ color: '#10b981' }}>Rs. {fmt(d.balance)}</td>
                  <td className="text-center">
                    <Link href={`/dashboard/accounts/ledger?id=${d.id}`} className="text-xs px-3 py-1 rounded font-semibold" style={{ background: '#eff6ff', color: '#1d4ed8', textDecoration: 'none' }}>
                      View Ledger
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
            {data.length > 0 && (
              <tfoot>
                <tr style={{ background: '#f8fafc', borderTop: '2px solid #e2e8f0' }}>
                  <td colSpan={4} className="py-3 px-4 font-bold text-sm" style={{ color: '#0f1f5c' }}>Total Receivable</td>
                  <td className="py-3 px-4 text-right font-bold" style={{ color: '#10b981' }}>Rs. {fmt(total)}</td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
