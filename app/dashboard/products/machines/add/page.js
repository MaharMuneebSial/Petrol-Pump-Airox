'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { addMachine, getProducts } from '../../../../../lib/store';

export default function AddMachinePage() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    name: '',
    machineNo: '',
    productId: '',
    nozzleCount: '2',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    getProducts().then(setProducts);
  }, []);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Machine name is required';
    if (!form.machineNo.trim()) errs.machineNo = 'Machine number is required';
    if (!form.productId) errs.productId = 'Select a product';
    if (!form.nozzleCount || parseInt(form.nozzleCount) < 1) errs.nozzleCount = 'At least 1 nozzle required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);

    await addMachine({
      name: form.name.trim(),
      machineNo: form.machineNo.trim(),
      productId: form.productId,
      nozzleCount: parseInt(form.nozzleCount),
    });

    setLoading(false);
    setSuccess(true);
    setTimeout(() => router.push('/dashboard/products/machines/manage'), 1000);
  };

  const handleChange = (field) => (e) => {
    setForm(p => ({ ...p, [field]: e.target.value }));
    setErrors(p => ({ ...p, [field]: '' }));
  };

  return (
    <div className="space-y-5 max-w-xl">
      <div className="flex items-center gap-2 text-sm" style={{ color: '#64748b' }}>
        <Link href="/dashboard/products/machines/manage" style={{ color: '#0f1f5c', textDecoration: 'none', fontWeight: 600 }}>Machines</Link>
        <span>›</span>
        <span>Add Pump Machine</span>
      </div>

      <div className="ps-page-header">
        <div>
          <h1 className="ps-page-title">⚙️ Add Pump Machine</h1>
          <p className="ps-page-subtitle">Register a new dispenser/pump machine</p>
        </div>
      </div>

      {success && (
        <div className="flex items-center gap-2 p-4 rounded-xl" style={{ background: '#d1fae5', color: '#065f46' }}>
          ✅ Machine added successfully! Redirecting...
        </div>
      )}

      <div className="ps-card">
        <div className="px-5 py-3" style={{ borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
          <h2 className="font-semibold text-sm" style={{ color: '#0f1f5c' }}>Machine Details</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="ps-label">Machine Name *</label>
              <input
                className="ps-input"
                placeholder="e.g. Dispenser 1"
                value={form.name}
                onChange={handleChange('name')}
              />
              {errors.name && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.name}</p>}
            </div>
            <div>
              <label className="ps-label">Machine Number *</label>
              <input
                className="ps-input"
                placeholder="e.g. M-001"
                value={form.machineNo}
                onChange={handleChange('machineNo')}
              />
              {errors.machineNo && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.machineNo}</p>}
            </div>
            <div>
              <label className="ps-label">Product/Fuel Type *</label>
              <select className="ps-input" value={form.productId} onChange={handleChange('productId')}>
                <option value="">— Select Product —</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              {errors.productId && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.productId}</p>}
              {products.length === 0 && (
                <p className="text-xs mt-1" style={{ color: '#f59e0b' }}>
                  <Link href="/dashboard/products/add" style={{ color: '#0f1f5c' }}>Add products first →</Link>
                </p>
              )}
            </div>
            <div>
              <label className="ps-label">Number of Nozzles *</label>
              <select className="ps-input" value={form.nozzleCount} onChange={handleChange('nozzleCount')}>
                {[1, 2, 3, 4, 6, 8].map(n => (
                  <option key={n} value={n}>{n} Nozzle{n > 1 ? 's' : ''}</option>
                ))}
              </select>
              {errors.nozzleCount && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.nozzleCount}</p>}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-primary px-6 py-2.5 text-sm" style={{ opacity: loading ? 0.8 : 1 }}>
              {loading ? '⏳ Saving...' : '💾 Save Machine'}
            </button>
            <Link href="/dashboard/products/machines/manage" className="px-6 py-2.5 text-sm rounded-lg font-medium" style={{ background: '#f1f5f9', color: '#374151', textDecoration: 'none' }}>
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
