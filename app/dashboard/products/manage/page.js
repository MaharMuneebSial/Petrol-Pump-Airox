'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getProducts, updateProduct, deleteProduct } from '../../../../lib/store';

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
const IconEdit = () => (
  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const IconTrash = () => (
  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);
const IconSave = () => (
  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IconX = () => (
  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IconWarning = () => (
  <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);
const IconPackage = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
);

export default function ManageProductsPage() {
  const [products, setProducts] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [deleteId, setDeleteId] = useState(null);
  const [search, setSearch] = useState('');

  const load = async () => setProducts(await getProducts());
  useEffect(() => { load(); }, []);

  const filtered = products.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()));
  const totalStockValue = products.reduce((s, p) => s + parseFloat(p.stock || 0) * parseFloat(p.rate || 0), 0);

  const handleEdit = (product) => {
    setEditId(product.id);
    setEditForm({ name: product.name || '', unit: product.unit || 'Ltr', stock: product.stock ?? '', rate: product.rate ?? '', hsnCode: product.hsnCode || '' });
  };

  const handleSave = async (id) => {
    await updateProduct(id, {
      name: editForm.name, unit: editForm.unit,
      stock: parseFloat(editForm.stock || 0), rate: parseFloat(editForm.rate || 0),
      hsnCode: editForm.hsnCode,
    });
    setEditId(null);
    await load();
  };

  const handleDelete = async (id) => { await deleteProduct(id); await load(); setDeleteId(null); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      <div className="ps-page-header">
        <div>
          <h1 className="ps-page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <IconPackage /> Manage Products
          </h1>
          <p className="ps-page-subtitle">Edit and manage your fuel products</p>
        </div>
        <Link href="/dashboard/products/add" className="btn-primary">
          <IconPlus /> Add New Product
        </Link>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
        {[
          { label: 'Total Products', value: products.length, color: '#0f1f5c', bg: 'linear-gradient(135deg, #eff6ff, #dbeafe)' },
          { label: 'Low Stock', value: products.filter(p => parseFloat(p.stock || 0) < 500).length, color: '#d97706', bg: 'linear-gradient(135deg, #fffbeb, #fef3c7)' },
          { label: 'Total Value', value: `Rs. ${fmt(totalStockValue)}`, color: '#10b981', bg: 'linear-gradient(135deg, #f0fdf4, #dcfce7)' },
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
            <input className="ps-input" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: '280px', paddingLeft: '34px' }} />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="ps-table">
            <thead>
              <tr>
                <th>#</th><th>Product Name</th><th>Unit</th>
                <th style={{ textAlign: 'right' }}>Stock</th>
                <th style={{ textAlign: 'right' }}>Rate (Rs.)</th>
                <th>HSN Code</th>
                <th style={{ textAlign: 'right' }}>Stock Value</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: '60px 20px', textAlign: 'center', color: '#94a3b8' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <span style={{ opacity: 0.3, color: '#0f1f5c' }}><IconPackage /></span>
                      <p style={{ fontWeight: 600, margin: 0 }}>No products found</p>
                      <Link href="/dashboard/products/add" style={{ fontSize: '12px', color: '#0f1f5c', textDecoration: 'none', fontWeight: 600 }}>Add your first product →</Link>
                    </div>
                  </td>
                </tr>
              ) : filtered.map((p, i) => (
                <tr key={p.id}>
                  <td style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 600 }}>{i + 1}</td>
                  {editId === p.id ? (
                    <>
                      <td><input className="ps-input" style={{ padding: '7px 10px', fontSize: '13px' }} value={editForm.name || ''} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} /></td>
                      <td>
                        <select className="ps-input" style={{ padding: '7px 10px', fontSize: '13px' }} value={editForm.unit || 'Ltr'} onChange={e => setEditForm(f => ({ ...f, unit: e.target.value }))}>
                          <option>Ltr</option><option>Kg</option><option>Cubic Meter</option><option>Unit</option>
                        </select>
                      </td>
                      <td><input className="ps-input" style={{ padding: '7px 10px', fontSize: '13px', textAlign: 'right' }} value={editForm.stock ?? ''} onChange={e => setEditForm(f => ({ ...f, stock: e.target.value }))} inputMode="decimal" /></td>
                      <td><input className="ps-input" style={{ padding: '7px 10px', fontSize: '13px', textAlign: 'right' }} value={editForm.rate ?? ''} onChange={e => setEditForm(f => ({ ...f, rate: e.target.value }))} inputMode="decimal" /></td>
                      <td><input className="ps-input" style={{ padding: '7px 10px', fontSize: '13px' }} value={editForm.hsnCode || ''} onChange={e => setEditForm(f => ({ ...f, hsnCode: e.target.value }))} /></td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#7c3aed', fontSize: '13px' }}>
                        Rs. {fmt(parseFloat(editForm.stock || 0) * parseFloat(editForm.rate || 0))}
                      </td>
                      <td />
                      <td>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button
                            onClick={() => handleSave(p.id)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '7px', fontSize: '12px', fontWeight: 600, background: '#10b981', color: 'white', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                          >
                            <IconSave /> Save
                          </button>
                          <button
                            onClick={() => setEditId(null)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '7px', fontSize: '12px', fontWeight: 600, background: '#f1f5f9', color: '#374151', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                          >
                            <IconX /> Cancel
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{ fontWeight: 700, color: '#0f1f5c', fontSize: '13px' }}>{p.name}</td>
                      <td style={{ color: '#475569', fontSize: '13px' }}>{p.unit}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, fontSize: '13px', color: parseFloat(p.stock || 0) < 500 ? '#f59e0b' : '#10b981' }}>
                        {fmt(p.stock)}
                      </td>
                      <td style={{ textAlign: 'right', color: '#475569', fontSize: '13px' }}>Rs. {fmt(p.rate)}</td>
                      <td style={{ color: '#94a3b8', fontSize: '12px' }}>{p.hsnCode || '—'}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#7c3aed', fontSize: '13px' }}>
                        Rs. {fmt(parseFloat(p.stock || 0) * parseFloat(p.rate || 0))}
                      </td>
                      <td>
                        {parseFloat(p.stock || 0) === 0 ? (
                          <span className="badge badge-danger">Out of Stock</span>
                        ) : parseFloat(p.stock || 0) < 500 ? (
                          <span className="badge badge-warning">Low Stock</span>
                        ) : (
                          <span className="badge badge-success">Available</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button
                            onClick={() => handleEdit(p)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '7px', fontSize: '12px', fontWeight: 600, background: '#eff6ff', color: '#1d4ed8', border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#dbeafe'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#eff6ff'; }}
                          >
                            <IconEdit /> Edit
                          </button>
                          <button onClick={() => setDeleteId(p.id)} className="btn-danger btn-sm"><IconTrash /> Delete</button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {deleteId && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}>
          <div className="ps-card" style={{ maxWidth: '360px', width: '100%', padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', flexShrink: 0 }}><IconWarning /></div>
              <div>
                <h3 style={{ fontWeight: 700, fontSize: '16px', color: '#0f1f5c', margin: '0 0 6px' }}>Delete Product?</h3>
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: 1.5 }}>This will also affect all stock calculations. Cannot be undone.</p>
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
