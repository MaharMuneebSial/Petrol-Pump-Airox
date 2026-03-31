'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getSales, getProducts, getAccounts, deleteSale } from '../../../lib/store';

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
const IconTrending = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
    <polyline points="17 6 23 6 23 12"/>
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

export default function SalesPage() {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filterMode, setFilterMode] = useState('');
  const [deleteId, setDeleteId] = useState(null);

  const load = async () => {
    const [s, p, a] = await Promise.all([getSales(), getProducts(), getAccounts()]);
    setSales(s); setProducts(p); setAccounts(a);
  };
  useEffect(() => { load(); }, []);

  const getProductName = (id) => products.find(p => p.id === id)?.name || 'Unknown';
  const getCustomerName = (id) => id ? (accounts.find(a => a.id === id)?.name || 'Unknown') : 'Cash Customer';

  const filtered = sales.filter(s => {
    const prod = getProductName(s.productId);
    const cust = getCustomerName(s.customerId);
    const matchSearch = prod.toLowerCase().includes(search.toLowerCase()) || cust.toLowerCase().includes(search.toLowerCase());
    const date = s.date || '';
    return matchSearch && (!dateFrom || date >= dateFrom) && (!dateTo || date <= dateTo) && (!filterMode || s.paymentMode === filterMode);
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  const totalAmt = filtered.reduce((s, p) => s + parseFloat(p.total || 0), 0);
  const totalQty = filtered.reduce((s, p) => s + parseFloat(p.quantity || 0), 0);
  const cashSales = filtered.filter(s => s.paymentMode === 'cash').reduce((s, p) => s + parseFloat(p.total || 0), 0);
  const creditSales = filtered.filter(s => s.paymentMode === 'credit').reduce((s, p) => s + parseFloat(p.total || 0), 0);

  const modeColors = { cash: 'badge-success', credit: 'badge-danger', card: 'badge-info', online: 'badge-warning' };

  const handleDelete = async (id) => { await deleteSale(id); await load(); setDeleteId(null); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      <div className="ps-page-header">
        <div>
          <h1 className="ps-page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <IconTrending /> Sales List
          </h1>
          <p className="ps-page-subtitle">All fuel and product sales</p>
        </div>
        <Link href="/dashboard/sales/add" className="btn-gold">
          <IconPlus /> Add Sale
        </Link>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }} className="md:grid-cols-4">
        {[
          { label: 'Total Records', value: sales.length, color: '#0f1f5c', bg: 'linear-gradient(135deg, #eff6ff, #dbeafe)' },
          { label: 'Quantity', value: `${fmt(totalQty)} Ltr`, color: '#7c3aed', bg: 'linear-gradient(135deg, #f5f3ff, #ede9fe)' },
          { label: 'Cash Sales', value: `Rs. ${fmt(cashSales)}`, color: '#10b981', bg: 'linear-gradient(135deg, #f0fdf4, #dcfce7)' },
          { label: 'Credit Sales', value: `Rs. ${fmt(creditSales)}`, color: '#ef4444', bg: 'linear-gradient(135deg, #fef2f2, #fee2e2)' },
        ].map(s => (
          <div key={s.label} className="ps-card" style={{ padding: '18px 20px', background: s.bg, border: 'none' }}>
            <p style={{ fontSize: '11px', fontWeight: 600, color: s.color, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 4px', opacity: 0.8 }}>{s.label}</p>
            <p style={{ fontSize: '20px', fontWeight: 800, color: s.color, margin: 0, letterSpacing: '-0.02em' }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="ps-card">
        <div className="ps-toolbar">
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}><IconSearch /></span>
            <input className="ps-input" placeholder="Search product or customer..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: '240px', paddingLeft: '34px' }} />
          </div>
          <input type="date" className="ps-input" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ maxWidth: '160px' }} />
          <input type="date" className="ps-input" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ maxWidth: '160px' }} />
          <select className="ps-input" value={filterMode} onChange={e => setFilterMode(e.target.value)} style={{ maxWidth: '150px' }}>
            <option value="">All Payments</option>
            <option value="cash">Cash</option>
            <option value="credit">Credit</option>
            <option value="card">Card</option>
            <option value="online">Online</option>
          </select>
          <span style={{ marginLeft: 'auto', fontSize: '13px', color: '#64748b', fontWeight: 500 }}>{filtered.length} records</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="ps-table">
            <thead>
              <tr>
                <th>#</th><th>Date</th><th>Customer</th><th>Product</th>
                <th style={{ textAlign: 'right' }}>Qty (Ltr)</th>
                <th style={{ textAlign: 'right' }}>Rate</th>
                <th style={{ textAlign: 'right' }}>Total (Rs.)</th>
                <th>Payment</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: '60px 20px', textAlign: 'center', color: '#94a3b8' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <span style={{ opacity: 0.3, color: '#0f1f5c' }}><IconTrending /></span>
                      <p style={{ fontWeight: 600, margin: 0 }}>No sales found</p>
                      <Link href="/dashboard/sales/add" style={{ fontSize: '12px', color: '#0f1f5c', textDecoration: 'none', fontWeight: 600 }}>Record first sale →</Link>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((s, i) => (
                  <tr key={s.id}>
                    <td style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 600 }}>{i + 1}</td>
                    <td style={{ color: '#475569', fontSize: '13px' }}>{s.date}</td>
                    <td style={{ color: '#374151', fontSize: '13px', fontWeight: 500 }}>{getCustomerName(s.customerId)}</td>
                    <td style={{ fontWeight: 600, color: '#0f1f5c', fontSize: '13px' }}>{getProductName(s.productId)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#7c3aed', fontSize: '13px' }}>{fmt(s.quantity)}</td>
                    <td style={{ textAlign: 'right', color: '#475569', fontSize: '13px' }}>Rs. {fmt(s.rate)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#10b981', fontSize: '13px' }}>Rs. {fmt(s.total)}</td>
                    <td>
                      <span className={`badge ${modeColors[s.paymentMode] || 'badge-gray'}`}>
                        {s.paymentMode?.charAt(0).toUpperCase() + s.paymentMode?.slice(1)}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button onClick={() => setDeleteId(s.id)} className="btn-danger btn-sm"><IconTrash /> Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr>
                  <td colSpan={4} style={{ padding: '12px 16px', fontWeight: 700, fontSize: '13px', color: '#0f1f5c' }}>Total</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 800, color: '#7c3aed', fontSize: '13px' }}>{fmt(totalQty)}</td>
                  <td />
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 800, color: '#10b981', fontSize: '13px' }}>Rs. {fmt(totalAmt)}</td>
                  <td colSpan={2} />
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
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', flexShrink: 0 }}><IconWarning /></div>
              <div>
                <h3 style={{ fontWeight: 700, fontSize: '16px', color: '#0f1f5c', margin: '0 0 6px' }}>Delete Sale?</h3>
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: 1.5 }}>This will reverse stock changes. This cannot be undone.</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '22px' }}>
              <button onClick={() => handleDelete(deleteId)} className="btn-danger" style={{ flex: 1, justifyContent: 'center', padding: '10px' }}><IconTrash /> Delete</button>
              <button onClick={() => setDeleteId(null)} className="btn-outline" style={{ flex: 1, justifyContent: 'center', padding: '10px' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
