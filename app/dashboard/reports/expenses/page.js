'use client';
import { useState, useEffect } from 'react';
import { getExpenses, addExpense, deleteExpense } from '../../../../lib/store';

const fmt = (n) => new Intl.NumberFormat('en-PK', { minimumFractionDigits: 2 }).format(n || 0);

const CATEGORIES = ['Salary', 'Utility Bills', 'Maintenance', 'Fuel', 'Equipment', 'Office', 'Transport', 'Other'];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category: 'Salary', amount: '', date: new Date().toISOString().slice(0, 10), description: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [catFilter, setCatFilter] = useState('');

  const load = async () => setExpenses(await getExpenses());
  useEffect(() => { load(); }, []);

  const filtered = expenses.filter(e => {
    const date = e.date || '';
    return (!dateFrom || date >= dateFrom) && (!dateTo || date <= dateTo) && (!catFilter || e.category === catFilter);
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  const total = filtered.reduce((s, e) => s + parseFloat(e.amount || 0), 0);

  const byCat = {};
  filtered.forEach(e => {
    if (!byCat[e.category]) byCat[e.category] = 0;
    byCat[e.category] += parseFloat(e.amount || 0);
  });

  const validate = () => {
    const errs = {};
    if (!form.category) errs.category = 'Select category';
    if (!form.amount || parseFloat(form.amount) <= 0) errs.amount = 'Enter valid amount';
    if (!form.date) errs.date = 'Select date';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    await addExpense({ category: form.category, amount: parseFloat(form.amount), date: form.date, description: form.description.trim() });
    setLoading(false);
    setShowForm(false);
    setForm({ category: 'Salary', amount: '', date: new Date().toISOString().slice(0, 10), description: '' });
    await load();
  };

  const handleDelete = async (id) => {
    await deleteExpense(id);
    await load();
    setDeleteId(null);
  };

  return (
    <div className="space-y-5">
      <div className="ps-page-header">
        <div>
          <h1 className="ps-page-title">Expenses Report</h1>
          <p className="ps-page-subtitle">Track and manage all station expenses</p>
        </div>
        <button onClick={() => setShowForm(p => !p)} className="btn-primary px-4 py-2 text-sm">
          {showForm ? 'Cancel' : '+ Add Expense'}
        </button>
      </div>

      {showForm && (
        <div className="ps-card">
          <div className="px-5 py-3" style={{ borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
            <h2 className="font-semibold text-sm" style={{ color: '#0f1f5c' }}>Add New Expense</h2>
          </div>
          <form onSubmit={handleSubmit} className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
              <div>
                <label className="ps-label">Category *</label>
                <select className="ps-input" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="ps-label">Amount (Rs.) *</label>
                <input className="ps-input" placeholder="0.00" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} inputMode="decimal" />
                {errors.amount && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.amount}</p>}
              </div>
              <div>
                <label className="ps-label">Date *</label>
                <input type="date" className="ps-input" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
              </div>
              <div>
                <label className="ps-label">Description</label>
                <input className="ps-input" placeholder="Details..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={loading} className="btn-primary px-6 py-2.5 text-sm" style={{ opacity: loading ? 0.8 : 1 }}>
                {loading ? 'Saving...' : 'Save Expense'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2.5 text-sm rounded-lg font-medium" style={{ background: '#f1f5f9', color: '#374151', border: 'none', cursor: 'pointer' }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="ps-card px-4 py-3 flex flex-wrap gap-3">
        <input type="date" className="ps-input" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ maxWidth: '160px' }} />
        <input type="date" className="ps-input" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ maxWidth: '160px' }} />
        <select className="ps-input" value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{ maxWidth: '180px' }}>
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="ps-card px-4 py-3"><p className="text-xs" style={{ color: '#94a3b8' }}>Total Records</p><p className="text-xl font-bold" style={{ color: '#0f1f5c' }}>{filtered.length}</p></div>
        <div className="ps-card px-4 py-3"><p className="text-xs" style={{ color: '#94a3b8' }}>Total Expenses</p><p className="text-xl font-bold" style={{ color: '#ef4444' }}>Rs. {fmt(total)}</p></div>
      </div>

      {Object.keys(byCat).length > 0 && (
        <div className="ps-card">
          <div className="px-5 py-3" style={{ borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
            <h2 className="font-semibold text-sm" style={{ color: '#0f1f5c' }}>Category Summary</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0 divide-x divide-y" style={{ divideColor: '#f1f5f9' }}>
            {Object.entries(byCat).map(([cat, amt]) => (
              <div key={cat} className="p-4" style={{ borderBottom: '1px solid #f1f5f9' }}>
                <p className="text-xs font-medium" style={{ color: '#64748b' }}>{cat}</p>
                <p className="text-base font-bold mt-1" style={{ color: '#ef4444' }}>Rs. {fmt(amt)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="ps-card">
        <div className="overflow-x-auto">
          <table className="ps-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Date</th>
                <th>Category</th>
                <th>Description</th>
                <th className="text-right">Amount (Rs.)</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center" style={{ color: '#94a3b8' }}>
                  <p className="mt-2 font-medium">No expenses recorded</p>
                </td></tr>
              ) : filtered.map((e, i) => (
                <tr key={e.id}>
                  <td className="text-sm" style={{ color: '#94a3b8' }}>{i + 1}</td>
                  <td className="text-sm" style={{ color: '#475569' }}>{e.date}</td>
                  <td><span className="badge badge-warning">{e.category}</span></td>
                  <td className="text-sm" style={{ color: '#374151' }}>{e.description || '—'}</td>
                  <td className="text-right font-bold text-sm" style={{ color: '#ef4444' }}>Rs. {fmt(e.amount)}</td>
                  <td className="text-center">
                    <button onClick={() => setDeleteId(e.id)} className="btn-danger">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr style={{ background: '#f8fafc', borderTop: '2px solid #e2e8f0' }}>
                  <td colSpan={4} className="py-3 px-4 font-bold text-sm" style={{ color: '#0f1f5c' }}>Total</td>
                  <td className="py-3 px-4 text-right font-bold text-sm" style={{ color: '#ef4444' }}>Rs. {fmt(total)}</td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {deleteId && (
        <div className="fixed inset-0 flex items-center justify-center z-50 px-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="ps-card p-6 max-w-sm w-full">
            <h3 className="font-bold text-lg" style={{ color: '#0f1f5c' }}>Confirm Delete</h3>
            <p className="text-sm mt-2" style={{ color: '#64748b' }}>Delete this expense record?</p>
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
