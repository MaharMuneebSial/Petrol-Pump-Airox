'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getMachines, getProducts, deleteMachine } from '../../../../../lib/store';

export default function ManageMachinesPage() {
  const [machines, setMachines] = useState([]);
  const [products, setProducts] = useState([]);
  const [deleteId, setDeleteId] = useState(null);

  const load = async () => {
    setMachines(await getMachines());
    setProducts(await getProducts());
  };
  useEffect(() => { load(); }, []);

  const getProductName = (id) => products.find(p => p.id === id)?.name || 'Unknown';

  const handleDelete = async (id) => {
    await deleteMachine(id);
    await load();
    setDeleteId(null);
  };

  return (
    <div className="space-y-5">
      <div className="ps-page-header">
        <div>
          <h1 className="ps-page-title">⚙️ Manage Machines</h1>
          <p className="ps-page-subtitle">All registered pump dispensers</p>
        </div>
        <Link href="/dashboard/products/machines/add" className="btn-primary px-4 py-2 text-sm" style={{ textDecoration: 'none' }}>
          + Add Machine
        </Link>
      </div>

      {/* Machine cards */}
      {machines.length === 0 ? (
        <div className="ps-card p-12 text-center">
          <p style={{ fontSize: '48px' }}>⚙️</p>
          <p className="mt-3 font-medium text-lg" style={{ color: '#374151' }}>No machines registered</p>
          <p className="mt-1 text-sm" style={{ color: '#94a3b8' }}>Add your pump dispensers to track them</p>
          <Link href="/dashboard/products/machines/add" className="btn-primary inline-block mt-4 px-6 py-2.5 text-sm" style={{ textDecoration: 'none' }}>
            + Add First Machine
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {machines.map(m => (
            <div key={m.id} className="ps-card overflow-hidden">
              <div className="px-5 py-3" style={{ background: 'linear-gradient(135deg, #0f1f5c, #1a237e)' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: '24px' }}>⛽</span>
                    <div>
                      <p className="font-bold text-white text-sm">{m.name}</p>
                      <p className="text-xs" style={{ color: '#93c5fd' }}>#{m.machineNo}</p>
                    </div>
                  </div>
                  <span
                    className="px-2 py-1 rounded-full text-xs font-bold"
                    style={{ background: 'rgba(245,158,11,0.2)', color: '#fcd34d' }}
                  >
                    Active
                  </span>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span style={{ color: '#64748b' }}>Product:</span>
                  <span className="font-semibold" style={{ color: '#0f1f5c' }}>{getProductName(m.productId)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: '#64748b' }}>Nozzles:</span>
                  <div className="flex gap-1">
                    {[...Array(parseInt(m.nozzleCount || 0))].map((_, i) => (
                      <span key={i} className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: '#eff6ff', color: '#1d4ed8' }}>
                        {i + 1}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="pt-2 flex gap-2" style={{ borderTop: '1px solid #f1f5f9' }}>
                  <button
                    onClick={() => setDeleteId(m.id)}
                    className="btn-danger flex-1 text-center"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table view */}
      {machines.length > 0 && (
        <div className="ps-card">
          <div className="px-5 py-3" style={{ borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
            <h2 className="font-semibold text-sm" style={{ color: '#0f1f5c' }}>Machine List</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="ps-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Machine Name</th>
                  <th>Machine No</th>
                  <th>Product</th>
                  <th className="text-center">Nozzles</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {machines.map((m, i) => (
                  <tr key={m.id}>
                    <td className="text-sm" style={{ color: '#94a3b8' }}>{i + 1}</td>
                    <td className="font-semibold text-sm" style={{ color: '#0f1f5c' }}>{m.name}</td>
                    <td className="text-sm" style={{ color: '#475569' }}>{m.machineNo}</td>
                    <td className="text-sm" style={{ color: '#374151' }}>{getProductName(m.productId)}</td>
                    <td className="text-center">
                      <span className="badge badge-info">{m.nozzleCount} Nozzle{m.nozzleCount > 1 ? 's' : ''}</span>
                    </td>
                    <td className="text-center">
                      <button onClick={() => setDeleteId(m.id)} className="btn-danger">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 flex items-center justify-center z-50 px-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="ps-card p-6 max-w-sm w-full">
            <h3 className="font-bold text-lg" style={{ color: '#0f1f5c' }}>Confirm Delete</h3>
            <p className="text-sm mt-2" style={{ color: '#64748b' }}>Delete this machine?</p>
            <div className="flex gap-3 mt-5">
              <button onClick={() => handleDelete(deleteId)} className="flex-1 py-2 rounded-lg text-sm font-semibold" style={{ background: '#ef4444', color: 'white', border: 'none', cursor: 'pointer' }}>Delete</button>
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2 rounded-lg text-sm font-semibold" style={{ background: '#f1f5f9', color: '#374151', border: 'none', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
