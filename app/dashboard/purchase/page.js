'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getPurchases, getProducts, getAccounts, deletePurchase } from '../../../lib/store';

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
const IconCart = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
  </svg>
);
const IconTrash = () => (
  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);
const IconWarning = () => (
  <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

export default function PurchasePage() {
  const [purchases, setPurchases] = useState([]);
  const [products, setProducts] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [deleteId, setDeleteId] = useState(null);

  const load = async () => {
    const [p, pr, a] = await Promise.all([getPurchases(), getProducts(), getAccounts()]);
    setPurchases(p); setProducts(pr); setAccounts(a);
  };
  useEffect(() => { load(); }, []);

  const getProductName = (id) => products.find(p => p.id === id)?.name || 'Unknown';
  const getSupplierName = (id) => accounts.find(a => a.id === id)?.name || 'Cash';

  const filtered = purchases.filter(p => {
    const prod = getProductName(p.productId);
    const supp = getSupplierName(p.supplierId);
    const matchSearch = prod.toLowerCase().includes(search.toLowerCase()) || supp.toLowerCase().includes(search.toLowerCase());
    const date = p.date || '';
    return matchSearch && (!dateFrom || date >= dateFrom) && (!dateTo || date <= dateTo);
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  const totalAmt = filtered.reduce((s, p) => s + parseFloat(p.total || 0), 0);
  const totalQty = filtered.reduce((s, p) => s + parseFloat(p.quantity || 0), 0);

  const handleDelete = async (id) => { await deletePurchase(id); await load(); setDeleteId(null); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      <div className="ps-page-header">
        <div>
          <h1 className="ps-page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <IconCart /> Purchase List
          </h1>
          <p className="ps-page-subtitle">All fuel and product purchases</p>
        </div>
        <Link href="/dashboard/purchase/add" className="btn-primary">
          <IconPlus /> Add Purchase
        </Link>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
        {[
          { label: 'Total Records', value: purchases.length, color: '#0f1f5c', bg: 'linear-gradient(135deg, #eff6ff, #dbeafe)' },
          { label: 'Total Quantity', value: `${fmt(totalQty)} Ltr`, color: '#7c3aed', bg: 'linear-gradient(135deg, #f5f3ff, #ede9fe)' },
          { label: 'Total Amount', value: `Rs. ${fmt(totalAmt)}`, color: '#10b981', bg: 'linear-gradient(135deg, #f0fdf4, #dcfce7)' },
        ].map(s => (
          <div key={s.label} className="ps-card" style={{ padding: '18px 20px', background: s.bg, border: 'none' }}>
            <p style={{ fontSize: '11px', fontWeight: 600, color: s.color, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 4px', opacity: 0.8 }}>{s.label}</p>
            <p style={{ fontSize: '22px', fontWeight: 800, color: s.color, margin: 0, letterSpacing: '-0.02em' }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="ps-card">
        <div className="ps-toolbar">
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}><IconSearch /></span>
            <input className="ps-input" placeholder="Search product or supplier..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: '240px', paddingLeft: '34px' }} />
          </div>
          <input type="date" className="ps-input" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ maxWidth: '160px' }} />
          <input type="date" className="ps-input" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ maxWidth: '160px' }} />
          <span style={{ marginLeft: 'auto', fontSize: '13px', color: '#64748b', fontWeight: 500 }}>{filtered.length} records</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="ps-table">
            <thead>
              <tr>
                <th>#</th><th>Date</th><th>Product</th>
                <th style={{ textAlign: 'right' }}>Quantity (Ltr)</th>
                <th style={{ textAlign: 'right' }}>Rate/Ltr</th>
                <th style={{ textAlign: 'right' }}>Total (Rs.)</th>
                <th>Supplier</th><th>Note</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: '60px 20px', textAlign: 'center', color: '#94a3b8' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <span style={{ opacity: 0.3, color: '#0f1f5c' }}><IconCart /></span>
                      <p style={{ fontWeight: 600, margin: 0 }}>No purchases found</p>
                      <Link href="/dashboard/purchase/add" style={{ fontSize: '12px', color: '#0f1f5c', textDecoration: 'none', fontWeight: 600 }}>Record first purchase →</Link>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((p, i) => (
                  <tr key={p.id}>
                    <td style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 600 }}>{i + 1}</td>
                    <td style={{ color: '#475569', fontSize: '13px' }}>{p.date}</td>
                    <td style={{ fontWeight: 600, color: '#0f1f5c', fontSize: '13px' }}>{getProductName(p.productId)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#7c3aed', fontSize: '13px' }}>{fmt(p.quantity)}</td>
                    <td style={{ textAlign: 'right', color: '#475569', fontSize: '13px' }}>Rs. {fmt(p.rate)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#10b981', fontSize: '13px' }}>Rs. {fmt(p.total)}</td>
                    <td style={{ color: '#475569', fontSize: '13px' }}>{getSupplierName(p.supplierId)}</td>
                    <td style={{ color: '#94a3b8', fontSize: '12px' }}>{p.note || '—'}</td>
                    <td style={{ textAlign: 'center' }}>
                      <button onClick={() => setDeleteId(p.id)} className="btn-danger btn-sm"><IconTrash /> Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr>
                  <td colSpan={3} style={{ padding: '12px 16px', fontWeight: 700, fontSize: '13px', color: '#0f1f5c' }}>Total</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 800, color: '#7c3aed', fontSize: '13px' }}>{fmt(totalQty)}</td>
                  <td />
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 800, color: '#10b981', fontSize: '13px' }}>Rs. {fmt(totalAmt)}</td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {deleteId && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}>
          <div className="ps-card" style={{ maxWidth: '360px', width: '100%', padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', flexShrink: 0 }}>
                <IconWarning />
              </div>
              <div>
                <h3 style={{ fontWeight: 700, fontSize: '16px', color: '#0f1f5c', margin: '0 0 6px' }}>Delete Purchase?</h3>
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: 1.5 }}>This will also reverse the stock. This cannot be undone.</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '22px' }}>
              <button onClick={() => handleDelete(deleteId)} className="btn-danger" style={{ flex: 1, justifyContent: 'center', padding: '10px' }}>
                <IconTrash /> Delete
              </button>
              <button onClick={() => setDeleteId(null)} className="btn-outline" style={{ flex: 1, justifyContent: 'center', padding: '10px' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
