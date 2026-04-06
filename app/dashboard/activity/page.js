'use client';
import { useState, useEffect } from 'react';
import { getActivityLogs } from '../../../lib/store';

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtTime = (d) => d ? new Date(d).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true }) : '—';
const fmtDateTime = (d) => d ? `${fmtDate(d)}, ${fmtTime(d)}` : '—';

const ACTION_CFG = {
  add:    { label: 'Added',   bg: '#f0fdf4', color: '#15803d', border: '#86efac' },
  edit:   { label: 'Edited',  bg: '#eff6ff', color: '#1d4ed8', border: '#93c5fd' },
  delete: { label: 'Deleted', bg: '#fef2f2', color: '#dc2626', border: '#fca5a5' },
};

const ENTITY_CFG = {
  purchase: { label: 'Purchase', bg: '#f5f3ff', color: '#7c3aed' },
  sale:     { label: 'Sale',     bg: '#f0fdf4', color: '#059669' },
  account:  { label: 'Account',  bg: '#eff6ff', color: '#2563eb' },
  voucher:  { label: 'Voucher',  bg: '#f1f5f9', color: '#475569' },
  product:  { label: 'Product',  bg: '#fdf4ff', color: '#9333ea' },
  staff:    { label: 'Staff',    bg: '#fff1f2', color: '#e11d48' },
};

const ROLE_CFG = {
  owner:   { label: 'Owner',   bg: '#0f1f5c', color: 'white' },
  manager: { label: 'Manager', bg: '#7c3aed', color: 'white' },
  cashier: { label: 'Cashier', bg: '#0891b2', color: 'white' },
};

const IconActivity = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
const IconSearch   = () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IconRefresh  = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>;
const IconUser     = () => <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IconClock    = () => <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;

function ActionBadge({ action }) {
  const c = ACTION_CFG[action] || { label: action, bg: '#f1f5f9', color: '#64748b', border: '#e2e8f0' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, padding: '3px 9px', borderRadius: '6px', background: c.bg, color: c.color, border: `1px solid ${c.border}`, whiteSpace: 'nowrap' }}>
      {c.label}
    </span>
  );
}

function EntityBadge({ entity }) {
  const c = ENTITY_CFG[entity] || { label: entity, bg: '#f1f5f9', color: '#64748b' };
  return (
    <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '20px', background: c.bg, color: c.color, whiteSpace: 'nowrap' }}>
      {c.label}
    </span>
  );
}

function RoleBadge({ role }) {
  const c = ROLE_CFG[role] || { label: role, bg: '#64748b', color: 'white' };
  return (
    <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 7px', borderRadius: '20px', background: c.bg, color: c.color, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
      {c.label}
    </span>
  );
}

export default function ActivityPage() {
  const [logs, setLogs]               = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterEntity, setFilterEntity] = useState('');
  const [filterUser, setFilterUser]   = useState('');
  const [dateFrom, setDateFrom]       = useState('');
  const [dateTo, setDateTo]           = useState('');
  const [page, setPage]               = useState(1);
  const PAGE_SIZE = 20;

  const load = async () => {
    setLoading(true);
    setLogs(await getActivityLogs());
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  // Unique users for filter dropdown
  const users = [...new Set(logs.map(l => l.performed_by))].filter(Boolean).sort();

  const filtered = logs.filter(l => {
    const matchSearch = !search || l.description?.toLowerCase().includes(search.toLowerCase()) || l.performed_by?.toLowerCase().includes(search.toLowerCase());
    const matchAction = !filterAction || l.action === filterAction;
    const matchEntity = !filterEntity || l.entity === filterEntity;
    const matchUser   = !filterUser   || l.performed_by === filterUser;
    const d = l.created_at ? l.created_at.slice(0, 10) : '';
    const matchFrom   = !dateFrom || d >= dateFrom;
    const matchTo     = !dateTo   || d <= dateTo;
    return matchSearch && matchAction && matchEntity && matchUser && matchFrom && matchTo;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paginated  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [search, filterAction, filterEntity, filterUser, dateFrom, dateTo]);

  const hasFilters = !!(search || filterAction || filterEntity || filterUser || dateFrom || dateTo);
  const clearFilters = () => { setSearch(''); setFilterAction(''); setFilterEntity(''); setFilterUser(''); setDateFrom(''); setDateTo(''); };

  // Stats
  const today = new Date().toISOString().slice(0, 10);
  const todayLogs  = logs.filter(l => l.created_at?.slice(0, 10) === today);
  const addCount   = logs.filter(l => l.action === 'add').length;
  const editCount  = logs.filter(l => l.action === 'edit').length;
  const deleteCount= logs.filter(l => l.action === 'delete').length;

  const td = { padding: '10px 14px', fontSize: '12.5px', borderBottom: '1px solid #f1f5f9', verticalAlign: 'middle' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

      {/* Header */}
      <div className="ps-page-header" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="ps-page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IconActivity /> Activity Log
          </h1>
          <p className="ps-page-subtitle">Track every action performed by owners, managers and cashiers</p>
        </div>
        <button onClick={load} className="btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <IconRefresh /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
        {[
          { label: 'Total Actions',  value: logs.length,   accent: '#0f1f5c', bg: '#eff6ff' },
          { label: 'Today',          value: todayLogs.length, accent: '#10b981', bg: '#f0fdf4' },
          { label: 'Edits',          value: editCount,     accent: '#1d4ed8', bg: '#eff6ff' },
          { label: 'Deletions',      value: deleteCount,   accent: '#dc2626', bg: '#fef2f2' },
        ].map(s => (
          <div key={s.label} className="ps-card" style={{ padding: '12px 16px', borderLeft: `3px solid ${s.accent}` }}>
            <p style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px' }}>{s.label}</p>
            <p style={{ fontSize: '22px', fontWeight: 800, color: s.accent, margin: 0, letterSpacing: '-0.02em' }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="ps-card">

        {/* Filters */}
        <div className="ps-toolbar" style={{ flexWrap: 'wrap', gap: '8px' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: '160px', maxWidth: '220px' }}>
            <span style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}><IconSearch /></span>
            <input className="ps-input" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '28px', fontSize: '12px' }} />
          </div>

          {/* User filter */}
          <select className="ps-input" value={filterUser} onChange={e => setFilterUser(e.target.value)} style={{ maxWidth: '150px', fontSize: '12px' }}>
            <option value="">All Users</option>
            {users.map(u => <option key={u} value={u}>{u}</option>)}
          </select>

          {/* Action filter */}
          <select className="ps-input" value={filterAction} onChange={e => setFilterAction(e.target.value)} style={{ maxWidth: '120px', fontSize: '12px' }}>
            <option value="">All Actions</option>
            <option value="add">Added</option>
            <option value="edit">Edited</option>
            <option value="delete">Deleted</option>
          </select>

          {/* Entity filter */}
          <select className="ps-input" value={filterEntity} onChange={e => setFilterEntity(e.target.value)} style={{ maxWidth: '120px', fontSize: '12px' }}>
            <option value="">All Entities</option>
            <option value="purchase">Purchase</option>
            <option value="sale">Sale</option>
            <option value="account">Account</option>
            <option value="voucher">Voucher</option>
            <option value="product">Product</option>
            <option value="staff">Staff</option>
          </select>

          {/* Date range */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'white', border: '1.5px solid var(--border)', borderRadius: '8px', padding: '0 10px', height: '36px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>From</span>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ border: 'none', outline: 'none', fontSize: '12px', color: 'var(--text-primary)', background: 'transparent', fontFamily: 'inherit', width: '120px' }} />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>To</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ border: 'none', outline: 'none', fontSize: '12px', color: 'var(--text-primary)', background: 'transparent', fontFamily: 'inherit', width: '120px' }} />
          </div>

          <span style={{ marginLeft: 'auto', fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: 500, whiteSpace: 'nowrap' }}>
            {filtered.length} of {logs.length}
          </span>
          {hasFilters && (
            <button onClick={clearFilters} style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '7px', padding: '5px 10px', cursor: 'pointer', color: '#dc2626', fontSize: '11px', fontWeight: 700 }}>
              × Clear
            </button>
          )}
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table className="ps-table">
            <thead>
              <tr>
                <th style={{ width: '36px' }}>#</th>
                <th>Date & Time</th>
                <th>Performed By</th>
                <th>Action</th>
                <th>Module</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ ...td, textAlign: 'center', padding: '60px 20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: '#0f1f5c', animation: 'spin 0.7s linear infinite' }} />
                      <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>Loading activity logs...</p>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ ...td, textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <span style={{ opacity: 0.2, color: '#0f1f5c' }}><IconActivity /></span>
                      <p style={{ fontWeight: 600, margin: 0 }}>{hasFilters ? 'No matching logs' : 'No activity yet'}</p>
                      {hasFilters && <button onClick={clearFilters} style={{ fontSize: '12px', color: '#0f1f5c', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Clear filters</button>}
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((log, i) => {
                  const globalIdx = (safePage - 1) * PAGE_SIZE + i + 1;
                  const acfg = ACTION_CFG[log.action] || {};
                  return (
                    <tr key={log.id} style={{ borderLeft: `3px solid ${acfg.border || '#e2e8f0'}` }}>
                      <td style={{ ...td, color: '#94a3b8', fontSize: '11px', fontWeight: 600 }}>{globalIdx}</td>
                      <td style={{ ...td, whiteSpace: 'nowrap' }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#1e293b' }}>{fmtDate(log.created_at)}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                          <IconClock /> {fmtTime(log.created_at)}
                        </div>
                      </td>
                      <td style={{ ...td }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f1f5c', flexShrink: 0 }}>
                            <IconUser />
                          </div>
                          <div>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b' }}>{log.performed_by}</div>
                            <RoleBadge role={log.role} />
                          </div>
                        </div>
                      </td>
                      <td style={{ ...td }}><ActionBadge action={log.action} /></td>
                      <td style={{ ...td }}><EntityBadge entity={log.entity} /></td>
                      <td style={{ ...td, color: '#374151', fontSize: '12.5px', maxWidth: '360px' }}>
                        {log.description}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filtered.length > PAGE_SIZE && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px 16px', borderTop: '1.5px solid var(--border)', background: '#f8fafc', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>
              {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            {[
              { label: '«', action: () => setPage(1),            disabled: safePage === 1 },
              { label: '‹', action: () => setPage(p => p - 1),  disabled: safePage === 1 },
              { label: '›', action: () => setPage(p => p + 1),  disabled: safePage === totalPages },
              { label: '»', action: () => setPage(totalPages),   disabled: safePage === totalPages },
            ].map(btn => (
              <button key={btn.label} onClick={btn.action} disabled={btn.disabled}
                style={{ width: '32px', height: '32px', borderRadius: '7px', border: `1.5px solid ${btn.disabled ? 'var(--border)' : 'var(--navy)'}`, background: btn.disabled ? '#f1f5f9' : 'var(--navy)', color: btn.disabled ? 'var(--text-muted)' : 'white', cursor: btn.disabled ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', opacity: btn.disabled ? 0.45 : 1, fontFamily: 'inherit' }}>
                {btn.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
