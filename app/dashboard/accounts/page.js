'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAccounts, deleteAccount, updateAccount } from '../../../lib/store';

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
const IconEdit = () => (
  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const IconSave = () => (
  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
    <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
  </svg>
);
const IconX = () => (
  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

export default function AccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [editAccount, setEditAccount] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editLoading, setEditLoading] = useState(false);

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

  const openEdit = (acc) => {
    setEditAccount(acc);
    setEditForm({ name: acc.name, type: acc.type, phone: acc.phone || '', address: acc.address || '', notes: acc.notes || '' });
  };

  const handleEditSave = async () => {
    if (!editForm.name?.trim()) return;
    setEditLoading(true);
    await updateAccount(editAccount.id, {
      name: editForm.name.trim(),
      type: editForm.type,
      phone: editForm.phone.trim() || null,
      address: editForm.address.trim() || null,
      notes: editForm.notes.trim() || null,
    });
    setEditLoading(false);
    setEditAccount(null);
    await load();
  };

  const typeColors = {
    Customer: 'badge-info',
    Supplier: 'badge-warning',
    Employee: 'badge-success',
    Other: 'badge-gray',
  };

  const stats = [
    { label: 'Total Accounts', value: accounts.length,                                    accent: '#0D1B3E', iconBg: '#EEF2F7' },
    { label: 'Customers',      value: accounts.filter(a => a.type === 'Customer').length, accent: '#2563EB', iconBg: '#EFF6FF' },
    { label: 'Suppliers',      value: accounts.filter(a => a.type === 'Supplier').length, accent: '#D97706', iconBg: '#FFFBEB' },
    { label: 'Employees',      value: accounts.filter(a => a.type === 'Employee').length, accent: '#059669', iconBg: '#F0FDF4' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Header */}
      <div className="ps-page-header" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="ps-page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IconUsers /> Accounts
          </h1>
          <p className="ps-page-subtitle">Manage customers, suppliers and employees</p>
        </div>
        <Link href="/dashboard/accounts/add" className="btn-primary">
          <IconPlus /> Add New Account
        </Link>
      </div>

      {/* Stats — compact single row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
        {stats.map(s => (
          <div key={s.label} className="ps-card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', borderLeft: `3px solid ${s.accent}` }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ fontSize: '10.5px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 3px' }}>
                {s.label}
              </p>
              <p style={{ fontSize: '22px', fontWeight: 800, color: s.accent, margin: 0, letterSpacing: '-0.02em', lineHeight: 1 }}>
                {s.value}
              </p>
            </div>
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
                        <button
                          onClick={() => openEdit(acc)}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                            padding: '5px 10px', borderRadius: '7px', fontSize: '12px', fontWeight: 600,
                            background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0',
                            cursor: 'pointer',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#dcfce7'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#f0fdf4'; }}
                        >
                          <IconEdit /> Edit
                        </button>
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

      {/* Edit Modal */}
      {editAccount && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(15,31,92,0.45)', backdropFilter: 'blur(6px)' }}>
          <div className="ps-card" style={{ maxWidth: '480px', width: '100%', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc' }}>
              <h3 style={{ fontWeight: 700, fontSize: '15px', color: '#0f1f5c', margin: 0 }}>Edit Account</h3>
              <button onClick={() => setEditAccount(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' }}><IconX /></button>
            </div>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Type */}
              <div>
                <label className="ps-label">Account Type</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '6px', marginTop: '6px' }}>
                  {['Customer','Supplier','Employee','Other'].map(t => (
                    <button key={t} type="button" onClick={() => setEditForm(p => ({ ...p, type: t }))}
                      style={{ padding: '7px', borderRadius: '7px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                        border: editForm.type === t ? '2px solid #0f1f5c' : '1.5px solid #e2e8f0',
                        background: editForm.type === t ? '#eff6ff' : '#fafbfc',
                        color: editForm.type === t ? '#0f1f5c' : '#64748b',
                      }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              {/* Name */}
              <div>
                <label className="ps-label">Name *</label>
                <input className="ps-input" value={editForm.name || ''} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} placeholder="Account name" />
              </div>
              {/* Phone + Address */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="ps-label">Phone</label>
                  <input className="ps-input" value={editForm.phone || ''} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} placeholder="03XX-XXXXXXX" />
                </div>
                <div>
                  <label className="ps-label">Address</label>
                  <input className="ps-input" value={editForm.address || ''} onChange={e => setEditForm(p => ({ ...p, address: e.target.value }))} placeholder="City, area" />
                </div>
              </div>
              {/* Notes */}
              <div>
                <label className="ps-label">Notes</label>
                <input className="ps-input" value={editForm.notes || ''} onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))} placeholder="Optional notes" />
              </div>
            </div>
            <div style={{ padding: '14px 20px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setEditAccount(null)} className="btn-outline">Cancel</button>
              <button onClick={handleEditSave} disabled={editLoading || !editForm.name?.trim()} className="btn-primary" style={{ opacity: editLoading ? 0.75 : 1 }}>
                {editLoading ? <><span className="spinner" /> Saving…</> : <><IconSave /> Save Changes</>}
              </button>
            </div>
          </div>
        </div>
      )}

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
