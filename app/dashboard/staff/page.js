'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { getCompany, getRole, logActivity } from '../../../lib/store';

/* ── Permission definitions ── */
const ALL_PERMS = [
  { key: 'sales_add',  label: 'Add Sale',      desc: 'Create new sales entries' },
  { key: 'sales_list', label: 'Sales List',     desc: 'View all sales records' },
  { key: 'purchase',   label: 'Purchase',       desc: 'Add and view purchases' },
  { key: 'accounts',   label: 'Accounts',       desc: 'Manage accounts & ledger' },
  { key: 'products',   label: 'Products',       desc: 'Manage products & machines' },
  { key: 'vouchers',   label: 'Vouchers',       desc: 'Cash receipts & payments' },
  { key: 'reports',    label: 'Reports',        desc: 'View all reports' },
  { key: 'staff',      label: 'Staff Mgmt',     desc: 'Manage staff (managers only)' },
];

const DEFAULT_PERMS = {
  manager: { sales_add: true, sales_list: true, purchase: true, accounts: true, products: true, vouchers: true, reports: true, staff: true },
  cashier:  { sales_add: true, sales_list: false, purchase: false, accounts: false, products: false, vouchers: false, reports: false, staff: false },
};

/* ── Icons ── */
const IconPlus   = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconEdit   = () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IconTrash  = () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>;
const IconUsers  = () => <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const IconEye    = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const IconEyeOff = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;

const ROLE_COLOR = { manager: { bg: '#eff6ff', color: '#1d4ed8' }, cashier: { bg: '#f0fdf4', color: '#15803d' } };

/* ── Toggle Switch ── */
function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      style={{
        width: '36px', height: '20px', borderRadius: '10px', border: 'none',
        background: checked ? '#0D1B3E' : '#CBD5E1',
        cursor: disabled ? 'not-allowed' : 'pointer',
        position: 'relative', transition: 'background 0.2s', flexShrink: 0,
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <span style={{
        position: 'absolute', top: '3px',
        left: checked ? '19px' : '3px',
        width: '14px', height: '14px', borderRadius: '50%',
        background: 'white', transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </button>
  );
}

export default function StaffPage() {
  const company    = getCompany();
  const currentRole = getRole();
  const companyId  = company?.id;

  const [staff,       setStaff]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showForm,    setShowForm]    = useState(false);
  const [editStaff,   setEditStaff]   = useState(null);   // null = create, object = edit
  const [showPerms,   setShowPerms]   = useState(null);   // staff id whose perms are open
  const [showPw,      setShowPw]      = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState('');

  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'cashier' });

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('staff')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });
    setStaff(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  /* ── Open create form ── */
  const openCreate = () => {
    setEditStaff(null);
    setForm({ name: '', email: '', password: '', role: 'cashier' });
    setError('');
    setShowForm(true);
  };

  /* ── Open edit form ── */
  const openEdit = (s) => {
    setEditStaff(s);
    setForm({ name: s.name, email: s.email, password: '', role: s.role });
    setError('');
    setShowForm(true);
  };

  /* ── Save (create or update) ── */
  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.email.trim()) { setError('Name and email are required.'); return; }
    if (!editStaff && !form.password) { setError('Password is required for new staff.'); return; }
    setSaving(true);

    if (editStaff) {
      // Update
      const updates = { name: form.name, email: form.email.toLowerCase(), role: form.role };
      if (form.password) updates.password = form.password;
      const { error: err } = await supabase.from('staff').update(updates).eq('id', editStaff.id);
      if (err) { setError(err.message); setSaving(false); return; }
      await logActivity({
        action: 'edit', entity: 'staff', entityId: editStaff.id,
        description: `Edited staff: ${form.name} (${form.role})`,
        meta: { name: form.name, role: form.role, email: form.email.toLowerCase() },
      });
    } else {
      // Create — check email uniqueness across companies + staff
      const { data: existing } = await supabase
        .from('staff').select('id').eq('email', form.email.toLowerCase()).single();
      if (existing) { setError('This email is already in use.'); setSaving(false); return; }

      const defaultPerms = DEFAULT_PERMS[form.role] || DEFAULT_PERMS.cashier;
      const { data: inserted, error: err } = await supabase.from('staff').insert({
        company_id:  companyId,
        name:        form.name,
        email:       form.email.toLowerCase(),
        password:    form.password,
        role:        form.role,
        permissions: defaultPerms,
        created_by:  company?.staffId || null,
      }).select('id').single();
      if (err) { setError(err.message); setSaving(false); return; }
      await logActivity({
        action: 'add', entity: 'staff', entityId: inserted?.id,
        description: `Added staff: ${form.name} (${form.role})`,
        meta: { name: form.name, role: form.role, email: form.email.toLowerCase() },
      });
    }

    setSaving(false);
    setShowForm(false);
    load();
  };

  /* ── Toggle permission ── */
  const togglePerm = async (staffId, key, value) => {
    const member = staff.find(s => s.id === staffId);
    if (!member) return;
    const newPerms = { ...(member.permissions || {}), [key]: value };
    await supabase.from('staff').update({ permissions: newPerms }).eq('id', staffId);
    setStaff(prev => prev.map(s => s.id === staffId ? { ...s, permissions: newPerms } : s));
    const permLabel = ALL_PERMS.find(p => p.key === key)?.label || key;
    await logActivity({
      action: 'edit', entity: 'staff', entityId: staffId,
      description: `Updated permissions: ${member.name} — ${permLabel} ${value ? 'enabled' : 'disabled'}`,
      meta: { staffName: member.name, permission: key, enabled: value },
    });
  };

  /* ── Toggle active ── */
  const toggleActive = async (s) => {
    await supabase.from('staff').update({ is_active: !s.is_active }).eq('id', s.id);
    setStaff(prev => prev.map(m => m.id === s.id ? { ...m, is_active: !m.is_active } : m));
  };

  /* ── Delete ── */
  const handleDelete = async (id) => {
    if (!confirm('Delete this staff member? This cannot be undone.')) return;
    const member = staff.find(s => s.id === id);
    await supabase.from('staff').delete().eq('id', id);
    setStaff(prev => prev.filter(s => s.id !== id));
    if (member) {
      await logActivity({
        action: 'delete', entity: 'staff', entityId: id,
        description: `Deleted staff: ${member.name} (${member.role})`,
        meta: { name: member.name, role: member.role, email: member.email },
      });
    }
  };

  const td = { padding: '10px 14px', fontSize: '12.5px', borderBottom: '1px solid #f1f5f9', verticalAlign: 'middle' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: 'linear-gradient(135deg,#0f1f5c,#1e3a8a)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <IconUsers />
          </div>
          <div>
            <h1 className="ps-page-title" style={{ margin: 0 }}>Staff Management</h1>
            <p className="ps-page-subtitle" style={{ margin: 0 }}>Manage managers and cashiers</p>
          </div>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <IconPlus /> Add Staff
        </button>
      </div>

      {/* Staff Table */}
      <div className="ps-card">
        {loading ? (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: '#94A3B8' }}>Loading...</div>
        ) : staff.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: '#94A3B8' }}>
            <p style={{ fontWeight: 600, marginBottom: '4px' }}>No staff added yet</p>
            <p style={{ fontSize: '12px' }}>Add your first manager or cashier</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="ps-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th style={{ textAlign: 'center' }}>Active</th>
                  <th style={{ textAlign: 'center' }}>Permissions</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((s, i) => (
                  <>
                    <tr key={s.id}>
                      <td style={{ ...td, color: '#94A3B8', fontSize: '11px' }}>{i + 1}</td>
                      <td style={{ ...td, fontWeight: 600, color: '#1E293B' }}>{s.name}</td>
                      <td style={{ ...td, color: '#64748B' }}>{s.email}</td>
                      <td style={td}>
                        <span style={{
                          padding: '2px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 700,
                          background: ROLE_COLOR[s.role]?.bg || '#f1f5f9',
                          color: ROLE_COLOR[s.role]?.color || '#475569',
                        }}>
                          {s.role.charAt(0).toUpperCase() + s.role.slice(1)}
                        </span>
                      </td>
                      <td style={{ ...td, textAlign: 'center' }}>
                        <Toggle checked={s.is_active} onChange={() => toggleActive(s)} />
                      </td>
                      <td style={{ ...td, textAlign: 'center' }}>
                        <button
                          onClick={() => setShowPerms(showPerms === s.id ? null : s.id)}
                          className="btn-ghost btn-sm"
                          style={{ fontSize: '11px' }}
                        >
                          {showPerms === s.id ? 'Hide' : 'Edit Permissions'}
                        </button>
                      </td>
                      <td style={{ ...td, textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button onClick={() => openEdit(s)} className="btn-icon" title="Edit">
                            <IconEdit />
                          </button>
                          <button
                            onClick={() => handleDelete(s.id)}
                            className="btn-icon"
                            title="Delete"
                            style={{ color: '#ef4444' }}
                          >
                            <IconTrash />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Inline permissions panel */}
                    {showPerms === s.id && (
                      <tr key={`${s.id}-perms`}>
                        <td colSpan={7} style={{ padding: '0', background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                          <div style={{ padding: '16px 20px' }}>
                            <p style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 12px' }}>
                              Permissions for {s.name}
                            </p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '8px' }}>
                              {ALL_PERMS.map(p => {
                                const isChecked = s.permissions?.[p.key] === true;
                                // managers can't edit staff perm of other managers (only owner can)
                                const disabled = currentRole === 'manager' && p.key === 'staff' && s.role === 'manager';
                                return (
                                  <div
                                    key={p.key}
                                    style={{
                                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                      padding: '10px 12px', borderRadius: '8px',
                                      background: isChecked ? '#eff6ff' : 'white',
                                      border: `1px solid ${isChecked ? '#bfdbfe' : '#E2E8F0'}`,
                                      gap: '10px',
                                    }}
                                  >
                                    <div>
                                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#1E293B' }}>{p.label}</div>
                                      <div style={{ fontSize: '10.5px', color: '#94A3B8', marginTop: '1px' }}>{p.desc}</div>
                                    </div>
                                    <Toggle
                                      checked={isChecked}
                                      onChange={(val) => togglePerm(s.id, p.key, val)}
                                      disabled={disabled}
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(15,31,92,0.45)', backdropFilter: 'blur(6px)' }}>
          <div className="ps-card animate-fade-in" style={{ maxWidth: '420px', width: '100%', padding: 0, overflow: 'hidden' }}>
            <div style={{ background: 'linear-gradient(135deg,#0a1540,#0f1f5c)', padding: '18px 24px', borderBottom: '3px solid #F0A500' }}>
              <h3 style={{ color: 'white', fontWeight: 700, fontSize: '15px', margin: 0 }}>
                {editStaff ? 'Edit Staff Member' : 'Add New Staff'}
              </h3>
            </div>

            <form onSubmit={handleSave} style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {error && (
                <div style={{ padding: '10px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', fontSize: '12.5px' }}>
                  {error}
                </div>
              )}

              <div>
                <label className="ps-label">Full Name</label>
                <input className="ps-input" placeholder="Ali Hassan" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              </div>

              <div>
                <label className="ps-label">Email</label>
                <input className="ps-input" type="email" placeholder="ali@example.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
              </div>

              <div>
                <label className="ps-label">{editStaff ? 'New Password (leave blank to keep)' : 'Password'}</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="ps-input"
                    type={showPw ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                    style={{ paddingRight: '38px' }}
                  />
                  <button type="button" onClick={() => setShowPw(p => !p)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                    {showPw ? <IconEyeOff /> : <IconEye />}
                  </button>
                </div>
              </div>

              <div>
                <label className="ps-label">Role</label>
                <select
                  className="ps-input"
                  value={form.role}
                  onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                  disabled={currentRole === 'manager'} // managers can only create cashiers
                >
                  {currentRole === 'owner' && <option value="manager">Manager</option>}
                  <option value="cashier">Cashier</option>
                </select>
                {currentRole === 'manager' && (
                  <p style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>Managers can only create cashiers.</p>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button type="button" onClick={() => setShowForm(false)} className="btn-outline" style={{ flex: 1, justifyContent: 'center' }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                  {saving ? 'Saving...' : editStaff ? 'Save Changes' : 'Add Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
