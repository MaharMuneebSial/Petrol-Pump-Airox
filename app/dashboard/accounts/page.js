'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAccounts, deleteAccount } from '../../../lib/store';

const fmt = (n) => new Intl.NumberFormat('en-PK', { minimumFractionDigits: 2 }).format(n || 0);

const IconPlus = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const IconSearch = () => (
  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const IconUsers = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const IconTrash = () => (
  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);
const IconBook = () => (
  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
);
const IconWarning = () => (
  <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

export default function AccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [deleteId, setDeleteId] = useState(null);

  const load = async () => setAccounts(await getAccounts());
  useEffect(() => { load(); }, []);

  const filtered = accounts.filter(a => {
    const matchSearch = a.name?.toLowerCase().includes(search.toLowerCase()) || a.phone?.includes(search);
    const matchType = !filterType || a.type === filterType;
    return matchSearch && matchType;
  });

  const handleDelete = async (id) => {
    await deleteAccount(id);
    await load();
    setDeleteId(null);
  };

  const typeColors = {
    Customer: 'badge-info',
    Supplier: 'badge-warning',
    Employee: 'badge-success',
    Other: 'badge-gray',
  };

  const stats = [
    { label: 'Total',     value: accounts.length,                                    color: '#0f1f5c', bg: 'linear-gradient(135deg, #eff6ff, #dbeafe)' },
    { label: 'Customers', value: accounts.filter(a => a.type === 'Customer').length, color: '#1d4ed8', bg: 'linear-gradient(135deg, #dbeafe, #bfdbfe)' },
    { label: 'Suppliers', value: accounts.filter(a => a.type === 'Supplier').length, color: '#a16207', bg: 'linear-gradient(135deg, #fef9c3, #fef3c7)' },
    { label: 'Employees', value: accounts.filter(a => a.type === 'Employee').length, color: '#15803d', bg: 'linear-gradient(135deg, #dcfce7, #bbf7d0)' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Header */}
      <div className="ps-page-header">
        <div>
          <h1 className="ps-page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <IconUsers /> Accounts
          </h1>
          <p className="ps-page-subtitle">Manage customers, suppliers and employees</p>
        </div>
        <Link href="/dashboard/accounts/add" className="btn-primary">
          <IconPlus /> Add New Account
        </Link>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }} className="md:grid-cols-4">
        {stats.map(s => (
          <div key={s.label} className="ps-card" style={{ padding: '16px 20px', background: s.bg, border: 'none' }}>
            <p style={{ fontSize: '12px', fontWeight: 600, color: s.color, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px', opacity: 0.8 }}>
              {s.label}
            </p>
            <p style={{ fontSize: '28px', fontWeight: 800, color: s.color, margin: 0, letterSpacing: '-0.02em' }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="ps-card">
        {/* Toolbar */}
        <div className="ps-toolbar">
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
              <IconSearch />
            </span>
            <input
              className="ps-input"
              placeholder="Search by name or phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ maxWidth: '280px', paddingLeft: '34px' }}
            />
          </div>
          <select
            className="ps-input"
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            style={{ maxWidth: '160px' }}
          >
            <option value="">All Types</option>
            <option>Customer</option>
            <option>Supplier</option>
            <option>Employee</option>
            <option>Other</option>
          </select>
          <span style={{ marginLeft: 'auto', fontSize: '13px', color: '#64748b', fontWeight: 500 }}>
            {filtered.length} record{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="ps-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Account Name</th>
                <th>Type</th>
                <th>Phone</th>
                <th>Address</th>
                <th style={{ textAlign: 'right' }}>Opening Balance</th>
                <th style={{ textAlign: 'right' }}>Current Balance</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '60px 20px', textAlign: 'center', color: '#94a3b8' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <span style={{ opacity: 0.3, color: '#0f1f5c' }}><IconUsers /></span>
                      <p style={{ fontWeight: 600, margin: 0 }}>No accounts found</p>
                      <Link href="/dashboard/accounts/add" style={{ fontSize: '12px', color: '#0f1f5c', textDecoration: 'none', fontWeight: 600 }}>
                        Add your first account →
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((acc, i) => (
                  <tr key={acc.id}>
                    <td style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 600 }}>{i + 1}</td>
                    <td style={{ fontWeight: 700, color: '#0f1f5c', fontSize: '13px' }}>{acc.name}</td>
                    <td><span className={`badge ${typeColors[acc.type] || 'badge-gray'}`}>{acc.type}</span></td>
                    <td style={{ color: '#475569', fontSize: '13px' }}>{acc.phone || '—'}</td>
                    <td style={{ color: '#475569', fontSize: '13px', maxWidth: '150px' }}>
                      <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {acc.address || '—'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', color: '#475569', fontSize: '13px', fontWeight: 500 }}>
                      Rs. {fmt(acc.openingBalance)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span style={{
                        fontWeight: 700, fontSize: '13px',
                        color: parseFloat(acc.currentBalance) > 0 ? '#ef4444' : '#10b981',
                      }}>
                        Rs. {fmt(acc.currentBalance)}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <Link
                          href={`/dashboard/accounts/ledger?id=${acc.id}`}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                            padding: '5px 10px', borderRadius: '7px', fontSize: '12px', fontWeight: 600,
                            background: '#eff6ff', color: '#1d4ed8', textDecoration: 'none',
                            transition: 'all 0.15s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#dbeafe'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#eff6ff'; }}
                        >
                          <IconBook /> Ledger
                        </Link>
                        <button onClick={() => setDeleteId(acc.id)} className="btn-danger btn-sm">
                          <IconTrash /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Modal */}
      {deleteId && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
          background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
          animation: 'fadeIn 0.2s ease',
        }}>
          <div className="ps-card" style={{ maxWidth: '360px', width: '100%', padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '12px',
                background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#ef4444', flexShrink: 0,
              }}>
                <IconWarning />
              </div>
              <div>
                <h3 style={{ fontWeight: 700, fontSize: '16px', color: '#0f1f5c', margin: '0 0 6px' }}>
                  Delete Account?
                </h3>
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                  This action cannot be undone. All associated data may be affected.
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '22px' }}>
              <button
                onClick={() => handleDelete(deleteId)}
                className="btn-danger"
                style={{ flex: 1, justifyContent: 'center', padding: '10px' }}
              >
                <IconTrash /> Yes, Delete
              </button>
              <button
                onClick={() => setDeleteId(null)}
                className="btn-outline"
                style={{ flex: 1, justifyContent: 'center', padding: '10px' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
