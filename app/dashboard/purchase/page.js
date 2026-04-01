'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getPurchases, getProducts, getAccounts, deletePurchase } from '../../../lib/store';

const fmt     = (n) => new Intl.NumberFormat('en-PK', { minimumFractionDigits: 2 }).format(n || 0);
const fmtQty  = (n) => { const v = parseFloat(n || 0); return v % 1 === 0 ? v.toLocaleString('en-PK') : fmt(v); };
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const PAYMENT = {
  cash:   { label: 'Cash',   dot: '#94a3b8', bg: '#f1f5f9', color: '#475569' },
  credit: { label: 'Credit', dot: '#f59e0b', bg: '#fffbeb', color: '#92400e' },
  card:   { label: 'Card',   dot: '#3b82f6', bg: '#eff6ff', color: '#1d4ed8' },
  online: { label: 'Online', dot: '#10b981', bg: '#f0fdf4', color: '#065f46' },
};

const PayBadge = ({ mode }) => {
  const p = PAYMENT[mode] || PAYMENT.cash;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '20px', background: p.bg, color: p.color, whiteSpace: 'nowrap' }}>
      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: p.dot, flexShrink: 0 }} />
      {p.label}
    </span>
  );
};

const IconPlus     = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconSearch   = () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IconCart     = () => <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>;
const IconTrash    = () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>;
const IconWarning  = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const IconDownload = () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
const IconFilter   = () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>;

const exportCSV = (rows, products, accounts) => {
  const name = (id) => products.find(p => p.id === id)?.name || 'Unknown';
  const supp = (id) => accounts.find(a => a.id === id)?.name || 'Cash';
  const headers = ['Date','Product','Qty','Rate','Total','Supplier','Payment','Invoice','Note'];
  const data = rows.map(r => [r.date, name(r.productId), r.quantity, r.rate, r.total, supp(r.supplierId), r.paymentMode||'cash', r.invoiceNo||'', r.note||'']);
  const csv = [headers, ...data].map(r => r.join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = `purchases-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
};

export default function PurchasePage() {
  const [purchases,     setPurchases]     = useState([]);
  const [products,      setProducts]      = useState([]);
  const [accounts,      setAccounts]      = useState([]);
  const [search,        setSearch]        = useState('');
  const [dateFrom,      setDateFrom]      = useState('');
  const [dateTo,        setDateTo]        = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [deleteId,      setDeleteId]      = useState(null);
  const [deletePurch,   setDeletePurch]   = useState(null);
  const [page,          setPage]          = useState(1);
  const [pageSize,      setPageSize]      = useState(15);

  const load = async () => {
    const [p, pr, a] = await Promise.all([getPurchases(), getProducts(), getAccounts()]);
    setPurchases(p); setProducts(pr); setAccounts(a);
  };
  useEffect(() => { load(); }, []);

  const getProductName = (id) => products.find(p => p.id === id)?.name || 'Unknown';
  const getProductUnit = (id) => products.find(p => p.id === id)?.unit || '';
  const getSupplierName = (id) => accounts.find(a => a.id === id)?.name || '';

  const filtered = purchases.filter(p => {
    const matchSearch  = !search || getProductName(p.productId).toLowerCase().includes(search.toLowerCase()) || getSupplierName(p.supplierId).toLowerCase().includes(search.toLowerCase());
    const matchProduct = !productFilter || p.productId === productFilter;
    const matchPayment = !paymentFilter || (p.paymentMode || 'cash') === paymentFilter;
    const d = p.date || '';
    return matchSearch && matchProduct && matchPayment && (!dateFrom || d >= dateFrom) && (!dateTo || d <= dateTo);
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  const totalAmt = filtered.reduce((s, p) => s + parseFloat(p.total || 0), 0);

  // Per-product quantity breakdown
  const qtyByProduct = filtered.reduce((acc, p) => {
    const name = getProductName(p.productId);
    const unit = getProductUnit(p.productId);
    const key  = p.productId;
    if (!acc[key]) acc[key] = { name, unit, qty: 0 };
    acc[key].qty += parseFloat(p.quantity || 0);
    return acc;
  }, {});
  const hasFilters = !!(search || dateFrom || dateTo || productFilter || paymentFilter);
  const clearFilters = () => { setSearch(''); setDateFrom(''); setDateTo(''); setProductFilter(''); setPaymentFilter(''); setPage(1); };

  // Pagination — reset to page 1 whenever filters change
  useEffect(() => { setPage(1); }, [search, dateFrom, dateTo, productFilter, paymentFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage   = Math.min(page, totalPages);
  const paginated  = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const confirmDelete = (p) => { setDeleteId(p.id); setDeletePurch(p); };
  const handleDelete  = async () => { await deletePurchase(deleteId); await load(); setDeleteId(null); setDeletePurch(null); };

  /* ── shared td style ── */
  const td = { padding: '9px 14px', fontSize: '12.5px', borderBottom: '1px solid #f1f5f9', verticalAlign: 'middle' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: 'linear-gradient(135deg,#0f1f5c,#1e3a8a)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
            <IconCart />
          </div>
          <div>
            <h1 className="ps-page-title" style={{ margin: 0 }}>Purchase List</h1>
            <p className="ps-page-subtitle" style={{ margin: 0 }}>All fuel and product purchases</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => exportCSV(filtered, products, accounts)} className="btn-ghost btn-sm">
            <IconDownload /> Export CSV
          </button>
          <Link href="/dashboard/purchase/add" className="btn-primary">
            <IconPlus /> Add Purchase
          </Link>
        </div>
      </div>

      {/* ── Stats Strip ── */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Object.keys(qtyByProduct).length + 2}, 1fr)`, gap: '10px', alignItems: 'stretch' }}>

        {/* Records */}
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '10px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1px', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '10.5px', fontWeight: 700, color: 'var(--navy)', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Records</p>
          <p style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--navy)', letterSpacing: '-0.03em', lineHeight: 1.2 }}>{filtered.length}</p>
          <p style={{ margin: 0, fontSize: '10px', color: 'var(--navy)', opacity: 0.45 }}>{purchases.length !== filtered.length ? `of ${purchases.length} total` : 'total'}</p>
        </div>

        {/* Per-product qty */}
        {Object.values(qtyByProduct).map(({ name, unit, qty }) => (
          <div key={name} style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: '10px', padding: '10px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1px', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: '10.5px', fontWeight: 700, color: '#7c3aed', opacity: 0.65, textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>{name}</p>
            <p style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#7c3aed', letterSpacing: '-0.03em', lineHeight: 1.2 }}>{fmtQty(qty)}</p>
            <p style={{ margin: 0, fontSize: '10px', color: '#7c3aed', opacity: 0.5 }}>{unit}</p>
          </div>
        ))}

        {/* Total Amount */}
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '10px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1px', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '10.5px', fontWeight: 700, color: 'var(--success)', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Total Amount</p>
          <p style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--success)', letterSpacing: '-0.03em', lineHeight: 1.2 }}>Rs. {fmt(totalAmt)}</p>
          <p style={{ margin: 0, fontSize: '10px', color: 'var(--success)', opacity: 0.45 }}>{filtered.length} purchases</p>
        </div>

      </div>
      {hasFilters && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-4px' }}>
          <button onClick={clearFilters} style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '5px 12px', cursor: 'pointer', color: 'var(--danger)', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '13px' }}>×</span> Clear filters
          </button>
        </div>
      )}

      {/* ── Main Card ── */}
      <div className="ps-card">

        {/* Toolbar */}
        <div className="ps-toolbar" style={{ gap: '8px' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '140px', maxWidth: '200px' }}>
            <span style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}><IconSearch /></span>
            <input className="ps-input" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '28px', fontSize: '12px', padding: '7px 10px 7px 28px' }} />
          </div>

          <select className="ps-input" value={productFilter} onChange={e => setProductFilter(e.target.value)} style={{ maxWidth: '150px', fontSize: '12px', padding: '7px 10px' }}>
            <option value="">All Products</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>

          <select className="ps-input" value={paymentFilter} onChange={e => setPaymentFilter(e.target.value)} style={{ maxWidth: '120px', fontSize: '12px', padding: '7px 10px' }}>
            <option value="">All Payments</option>
            <option value="cash">Cash</option>
            <option value="credit">Credit</option>
            <option value="card">Card</option>
            <option value="online">Online</option>
          </select>

          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'white', border: '1.5px solid var(--border)', borderRadius: '8px', padding: '0 10px', height: '36px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>From</span>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ border: 'none', outline: 'none', fontSize: '12px', color: 'var(--text-primary)', background: 'transparent', fontFamily: 'inherit', width: '120px' }} />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500, marginLeft: '4px' }}>To</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ border: 'none', outline: 'none', fontSize: '12px', color: 'var(--text-primary)', background: 'transparent', fontFamily: 'inherit', width: '120px' }} />
          </div>

          <span style={{ marginLeft: 'auto', fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: 500, whiteSpace: 'nowrap' }}>
            {filtered.length} of {purchases.length}
          </span>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table className="ps-table">
            <thead>
              <tr>
                <th style={{ width: '36px' }}>#</th>
                <th>Date</th>
                <th>Product</th>
                <th style={{ textAlign: 'right' }}>Qty</th>
                <th style={{ textAlign: 'right' }}>Rate (Rs.)</th>
                <th style={{ textAlign: 'right' }}>Total (Rs.)</th>
                <th>Supplier</th>
                <th>Payment</th>
                <th>Invoice</th>
                <th style={{ width: '40px' }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ ...td, padding: '56px 20px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <span style={{ opacity: 0.15, color: 'var(--navy)' }}><IconCart /></span>
                      <p style={{ fontWeight: 600, margin: 0, color: 'var(--text-muted)' }}>No purchases found</p>
                      {hasFilters
                        ? <button onClick={clearFilters} style={{ fontSize: '12px', color: 'var(--navy)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Clear filters</button>
                        : <Link href="/dashboard/purchase/add" style={{ fontSize: '12px', color: 'var(--navy)', textDecoration: 'none', fontWeight: 600 }}>Record first purchase →</Link>
                      }
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((p, i) => {
                  const supp = getSupplierName(p.supplierId);
                  const unit = getProductUnit(p.productId);
                  const globalIdx = (safePage - 1) * pageSize + i + 1;
                  return (
                    <tr key={p.id}>
                      <td style={{ ...td, paddingLeft: '16px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: 600 }}>{globalIdx}</td>
                      <td style={{ ...td, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{fmtDate(p.date)}</td>
                      <td style={{ ...td }}>
                        <span style={{ fontWeight: 600, color: 'var(--navy)' }}>{getProductName(p.productId)}</span>
                        {p.note && <p style={{ margin: '1px 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>{p.note}</p>}
                      </td>
                      <td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <span style={{ fontWeight: 700, color: '#7c3aed' }}>{fmtQty(p.quantity)}</span>
                        {unit && <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: '3px' }}>{unit}</span>}
                      </td>
                      <td style={{ ...td, textAlign: 'right', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {fmt(p.rate)}
                      </td>
                      <td style={{ ...td, textAlign: 'right', fontWeight: 700, color: 'var(--success)', whiteSpace: 'nowrap' }}>
                        {fmt(p.total)}
                      </td>
                      <td style={{ ...td, color: supp ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                        {supp || <span style={{ fontSize: '11px' }}>—</span>}
                      </td>
                      <td style={td}>
                        <PayBadge mode={p.paymentMode || 'cash'} />
                      </td>
                      <td style={{ ...td, maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-muted)', fontSize: '11.5px' }} title={p.invoiceNo || ''}>
                        {p.invoiceNo || '—'}
                      </td>
                      <td style={{ ...td, textAlign: 'center', paddingRight: '12px' }}>
                        <button
                          onClick={() => confirmDelete(p)}
                          className="btn-icon"
                          title="Delete"
                          style={{ color: 'var(--text-muted)', opacity: 0.4, padding: '5px' }}
                          onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.borderColor = '#fecaca'; }}
                          onMouseLeave={e => { e.currentTarget.style.opacity = '0.4'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                        >
                          <IconTrash />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Summary + Pagination Bar ── */}
        {filtered.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px 16px', borderTop: '1.5px solid var(--border)', background: '#f8fafc', gap: '10px' }}>

            {/* Pagination controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Page size */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Show</span>
                <select
                  value={pageSize}
                  onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                  style={{ fontSize: '12px', padding: '3px 6px', border: '1.5px solid var(--border)', borderRadius: '6px', background: 'white', color: 'var(--text-primary)', outline: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  {[15, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>per page</span>
              </div>

              <div style={{ width: '1px', height: '16px', background: 'var(--border)' }} />

              {/* Page info */}
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filtered.length)} of {filtered.length}
              </span>

              {/* Buttons */}
              {[
                { label: '«', action: () => setPage(1),            disabled: safePage === 1,          title: 'First page' },
                { label: '‹', action: () => setPage(p => p - 1),  disabled: safePage === 1,          title: 'Previous page' },
                { label: '›', action: () => setPage(p => p + 1),  disabled: safePage === totalPages, title: 'Next page' },
                { label: '»', action: () => setPage(totalPages),   disabled: safePage === totalPages, title: 'Last page' },
              ].map(btn => (
                <button
                  key={btn.label}
                  onClick={btn.action}
                  disabled={btn.disabled}
                  title={btn.title}
                  style={{
                    width: '32px', height: '32px', borderRadius: '7px',
                    border: `1.5px solid ${btn.disabled ? 'var(--border)' : 'var(--navy)'}`,
                    background: btn.disabled ? '#f1f5f9' : 'var(--navy)',
                    color: btn.disabled ? 'var(--text-muted)' : 'white',
                    cursor: btn.disabled ? 'not-allowed' : 'pointer',
                    fontSize: '14px', fontWeight: 700,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    opacity: btn.disabled ? 0.45 : 1, fontFamily: 'inherit',
                    boxShadow: btn.disabled ? 'none' : '0 1px 3px rgba(13,27,62,0.2)',
                  }}
                  onMouseEnter={e => { if (!btn.disabled) { e.currentTarget.style.background = 'var(--navy-mid)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
                  onMouseLeave={e => { if (!btn.disabled) { e.currentTarget.style.background = 'var(--navy)'; e.currentTarget.style.transform = 'translateY(0)'; } }}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Delete Modal ── */}
      {deleteId && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(15,31,92,0.45)', backdropFilter: 'blur(6px)' }}>
          <div className="ps-card animate-fade-in" style={{ maxWidth: '380px', width: '100%', padding: '0', overflow: 'hidden' }}>
            {/* Modal header strip */}
            <div style={{ background: '#fef2f2', padding: '20px 24px 16px', borderBottom: '1px solid #fee2e2', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)', flexShrink: 0 }}>
                <IconWarning />
              </div>
              <div>
                <h3 style={{ fontWeight: 700, fontSize: '15px', color: 'var(--navy)', margin: '0 0 2px' }}>Delete Purchase?</h3>
                <p style={{ fontSize: '12px', color: 'var(--danger)', margin: 0, fontWeight: 500 }}>This action cannot be undone</p>
              </div>
            </div>
            {/* Modal body */}
            <div style={{ padding: '18px 24px' }}>
              {deletePurch && (
                <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '12px 14px', marginBottom: '16px', border: '1px solid var(--border)' }}>
                  <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: '13px', color: 'var(--navy)' }}>{getProductName(deletePurch.productId)}</p>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {fmtQty(deletePurch.quantity)} {getProductUnit(deletePurch.productId)} · Rs. {fmt(deletePurch.total)} · {fmtDate(deletePurch.date)}
                  </p>
                </div>
              )}
              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: '0 0 18px', lineHeight: 1.6 }}>
                Deleting this purchase will reverse the stock quantity and supplier balance.
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => { setDeleteId(null); setDeletePurch(null); }} className="btn-outline" style={{ flex: 1, justifyContent: 'center' }}>
                  Cancel
                </button>
                <button onClick={handleDelete} className="btn-danger" style={{ flex: 1, justifyContent: 'center' }}>
                  <IconTrash /> Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
