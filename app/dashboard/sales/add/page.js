'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { addSale, getProducts, getAccounts } from '../../../../lib/store';

// ─── Icons ────────────────────────────────────────────────────────────────────
const Ico = ({ d, w = 14, extra = '' }) => (
  <svg width={w} height={w} fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d={extra} />{d.map((p, i) => <path key={i} d={p} />)}
  </svg>
);
const IconSave = () => <Ico d={['M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z','M17 21v-8H7v8','M7 3v5h8']} />;
const IconBack = () => (
  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
);
const IconCheck = () => (
  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IconX = () => (
  <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IconAlert = () => (
  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);
const IconChevron = () => (
  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);
const IconDroplet = () => (
  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
  </svg>
);
const IconUser = () => (
  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
const IconCash = () => (
  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/>
    <line x1="6" y1="12" x2="6.01" y2="12"/><line x1="18" y1="12" x2="18.01" y2="12"/>
  </svg>
);
const IconCredit = () => (
  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
    <line x1="7" y1="15" x2="9" y2="15"/>
  </svg>
);
const IconPhone = () => (
  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>
  </svg>
);
const IconBank = () => (
  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/>
    <line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/>
    <line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7"/>
  </svg>
);
const IconCard = () => (
  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
    <line x1="7" y1="15" x2="12" y2="15"/>
  </svg>
);
const IconSaleTag = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
    <line x1="7" y1="7" x2="7.01" y2="7"/>
  </svg>
);
const IconHash = () => (
  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/>
    <line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/>
  </svg>
);

// ─── Payment Methods ──────────────────────────────────────────────────────────

const METHODS = [
  {
    value: 'cash',        label: 'Cash',          dbMode: 'cash',
    color: '#059669', bg: '#f0fdf4', border: '#6ee7b7', solid: '#059669', lightBg: '#ecfdf5',
    Icon: IconCash,
  },
  {
    value: 'credit',      label: 'Credit',        dbMode: 'credit',
    color: '#dc2626', bg: '#fef2f2', border: '#fca5a5', solid: '#dc2626', lightBg: '#fff1f2',
    Icon: IconCredit,
  },
  {
    value: 'jazzcash',    label: 'JazzCash',      dbMode: 'jazzcash',
    color: '#be185d', bg: '#fdf2f8', border: '#f9a8d4', solid: '#db2777', lightBg: '#fdf4ff',
    Icon: IconPhone,
  },
  {
    value: 'easypaisa',   label: 'EasyPaisa',     dbMode: 'easypaisa',
    color: '#15803d', bg: '#f0fdf4', border: '#86efac', solid: '#16a34a', lightBg: '#f0fdf4',
    Icon: IconPhone,
  },
  {
    value: 'bank',        label: 'Bank Transfer', dbMode: 'bank',
    color: '#1d4ed8', bg: '#eff6ff', border: '#93c5fd', solid: '#2563eb', lightBg: '#f0f7ff',
    Icon: IconBank,
  },
  {
    value: 'credit_card', label: 'Credit Card',   dbMode: 'card',
    color: '#6d28d9', bg: '#f5f3ff', border: '#c4b5fd', solid: '#7c3aed', lightBg: '#faf5ff',
    Icon: IconCard,
  },
];

const initMethodData = () => ({
  cash:        { amount: '' },
  credit:      { amount: '', customerId: '', customerName: '' },
  jazzcash:    { amount: '', phone: '', txnId: '' },
  easypaisa:   { amount: '', phone: '', txnId: '' },
  bank:        { amount: '', bankName: '', accountNo: '', ref: '' },
  credit_card: { amount: '', lastFour: '', ref: '' },
});

const fmt = (n) => new Intl.NumberFormat('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);

// ─── Shared input styles ──────────────────────────────────────────────────────

const inp = (extra = {}) => ({
  width: '100%', boxSizing: 'border-box',
  padding: '8px 11px', fontSize: '13px', fontFamily: 'inherit',
  border: '1.5px solid #e2e8f0', borderRadius: '8px',
  background: '#fff', color: '#0D1B3E', outline: 'none',
  ...extra,
});
const lbl = {
  display: 'block', fontSize: '11px', fontWeight: 700,
  color: '#64748b', marginBottom: '4px', letterSpacing: '0.03em', textTransform: 'uppercase',
};

const ErrMsg = ({ msg }) => msg
  ? <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '3px' }}>
      <IconAlert /> {msg}
    </p>
  : null;

// ─── Amount input with Rs. prefix ────────────────────────────────────────────
const AmountInput = ({ value, onChange, borderColor, error }) => (
  <div>
    <div style={{ position: 'relative' }}>
      <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px', fontWeight: 700, color: '#94a3b8', pointerEvents: 'none' }}>Rs.</span>
      <input
        style={inp({ paddingLeft: '34px', borderColor: error ? '#fca5a5' : borderColor || '#e2e8f0' })}
        placeholder="0.00" value={value} onChange={onChange} inputMode="decimal"
      />
    </div>
    <ErrMsg msg={error} />
  </div>
);

// ─── Component ────────────────────────────────────────────────────────────────
export default function AddSalePage() {
  const router = useRouter();
  const [products, setProducts]   = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    productId: '', quantity: '', rate: '', total: '',
    date: new Date().toISOString().slice(0, 10), note: '',
  });
  const [errors, setErrors] = useState({});

  // Payment state
  const [activeMethods, setActiveMethods] = useState([]);
  const [methodData, setMethodData] = useState(initMethodData());

  // Product combobox
  const [productSearch, setProductSearch]     = useState('');
  const [showProductDrop, setShowProductDrop] = useState(false);
  const productRef   = useRef(null);
  const selectedProduct = products.find(p => p.id === form.productId) || null;

  // Credit customer combobox (inside credit card)
  const [creditCustSearch, setCreditCustSearch]       = useState('');
  const [showCreditCustDrop, setShowCreditCustDrop]   = useState(false);
  const creditCustRef = useRef(null);

  useEffect(() => {
    (async () => {
      const [prods, accs] = await Promise.all([getProducts(), getAccounts()]);
      setProducts(prods);
      setCustomers(accs.filter(a => a.type === 'Customer'));
    })();
  }, []);

  useEffect(() => {
    const h = (e) => {
      if (productRef.current   && !productRef.current.contains(e.target))   setShowProductDrop(false);
      if (creditCustRef.current && !creditCustRef.current.contains(e.target)) setShowCreditCustDrop(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // ── Derived ──────────────────────────────────────────────────────────────────
  const total      = parseFloat(form.total) || 0;
  const unitDisp   = selectedProduct?.unit || 'Unit';
  const splitTotal = activeMethods.reduce((s, m) => s + (parseFloat(methodData[m]?.amount) || 0), 0);
  const remaining  = Math.max(0, total - splitTotal);
  const overPaid   = splitTotal > total + 0.01;
  const splitDone  = total > 0 && activeMethods.length > 0 && Math.abs(total - splitTotal) < 0.01;

  const filteredProducts = products.filter(p =>
    p.name?.toLowerCase().includes(productSearch.toLowerCase())
  );
  const filteredCreditCustomers = customers.filter(c =>
    c.name?.toLowerCase().includes(creditCustSearch.toLowerCase())
  );

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const selectProduct = (prod) => {
    const rate = prod.rate?.toString() || '';
    const qty  = parseFloat(form.quantity) || 0;
    setForm(p => ({ ...p, productId: prod.id, rate, total: (qty * parseFloat(prod.rate || 0)).toFixed(2) }));
    setProductSearch(prod.name);
    setShowProductDrop(false);
    setErrors(p => ({ ...p, productId: '' }));
    setMethodData(initMethodData());
  };

  const handleChange = (field) => (e) => {
    const val = e.target.value;
    setForm(p => {
      const up = { ...p, [field]: val };
      if (field === 'quantity' || field === 'rate') {
        const q = parseFloat(field === 'quantity' ? val : p.quantity) || 0;
        const r = parseFloat(field === 'rate'     ? val : p.rate)     || 0;
        up.total = (q * r).toFixed(2);
      }
      return up;
    });
    setErrors(p => ({ ...p, [field]: '' }));
    if (field === 'quantity' || field === 'rate') setMethodData(initMethodData());
  };

  const toggleMethod = (value) => {
    setActiveMethods(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
    setErrors(p => ({ ...p, payment: '', [`${value}_amount`]: '', [`${value}_phone`]: '' }));
  };

  const updateField = (method, field) => (e) => {
    setMethodData(prev => ({ ...prev, [method]: { ...prev[method], [field]: e.target.value } }));
    setErrors(p => ({ ...p, [`${method}_${field}`]: '', payment: '' }));
  };

  const fillRemaining = (method) => {
    if (remaining <= 0.005) return;
    const cur = parseFloat(methodData[method].amount) || 0;
    setMethodData(prev => ({ ...prev, [method]: { ...prev[method], amount: (cur + remaining).toFixed(2) } }));
    setErrors(p => ({ ...p, [`${method}_amount`]: '', payment: '' }));
  };

  const selectCreditCustomer = (cust) => {
    setMethodData(prev => ({ ...prev, credit: { ...prev.credit, customerId: cust?.id || '', customerName: cust?.name || '' } }));
    setCreditCustSearch(cust?.name || '');
    setShowCreditCustDrop(false);
    setErrors(p => ({ ...p, credit_customer: '' }));
  };

  // ── Validate ──────────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.productId)                                 e.productId = 'Select a product';
    if (!form.quantity || parseFloat(form.quantity) <= 0) e.quantity  = 'Enter valid quantity';
    if (!form.rate     || parseFloat(form.rate)     <= 0) e.rate      = 'Enter valid rate';
    if (!form.date)                                      e.date      = 'Select date';

    if (activeMethods.length === 0) {
      e.payment = 'Select at least one payment method';
    } else {
      if (!splitDone && total > 0)
        e.payment = `Payment must total Rs.${fmt(total)}  —  ${overPaid ? 'Over by' : 'Remaining'}: Rs.${fmt(overPaid ? splitTotal - total : remaining)}`;

      for (const m of activeMethods) {
        const d = methodData[m];
        if (!d.amount || parseFloat(d.amount) <= 0) e[`${m}_amount`] = 'Enter amount';
        if (m === 'credit' && !d.customerId)         e.credit_customer = 'Select customer';
        if ((m === 'jazzcash' || m === 'easypaisa') && !d.phone) e[`${m}_phone`] = 'Required';
        if (m === 'bank') {
          if (!d.bankName) e.bank_name    = 'Required';
          if (!d.accountNo) e.bank_account = 'Required';
        }
      }
    }
    return e;
  };

  // ── Submit ────────────────────────────────────────────────────────────────────
  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);

    const activePayments = activeMethods.filter(m => parseFloat(methodData[m].amount) > 0);
    const payments = activePayments.map(m => {
      const d      = methodData[m];
      const method = METHODS.find(pm => pm.value === m);
      let meta = null;
      if (m === 'jazzcash' || m === 'easypaisa') meta = { phone: d.phone, txnId: d.txnId || null };
      if (m === 'bank')        meta = { bankName: d.bankName, accountNo: d.accountNo, ref: d.ref || null };
      if (m === 'credit_card') meta = { lastFour: d.lastFour || null, ref: d.ref || null };
      return { mode: method.dbMode, amount: parseFloat(d.amount), customerId: m === 'credit' ? d.customerId : null, meta };
    });

    const isSplit     = activePayments.length > 1;
    const primaryMode = isSplit ? 'split' : payments[0].mode;
    const creditEntry = activeMethods.includes('credit') ? methodData.credit : null;

    await addSale({
      customerId:  creditEntry?.customerId || null,
      productId:   form.productId,
      quantity:    parseFloat(form.quantity),
      rate:        parseFloat(form.rate),
      total:       parseFloat(form.total),
      paymentMode: primaryMode,
      date:        form.date,
      note:        form.note.trim(),
      payments,
    });

    setLoading(false);
    setSuccess(true);
    setTimeout(() => router.push('/dashboard/sales'), 1200);
  };

  // ── Render a single method card ───────────────────────────────────────────────
  const renderCard = (method) => {
    const { value, label, solid, bg, border, lightBg, Icon } = method;
    const d     = methodData[value];
    const amt   = parseFloat(d.amount) || 0;
    const isOnly = activeMethods.length === 1;

    return (
      <div key={value} style={{ border: `1.5px solid ${border}`, borderRadius: '12px', overflow: 'visible', background: '#fff' }}>
        {/* Card header */}
        <div style={{
          background: lightBg, padding: '10px 14px', borderBottom: `1px solid ${border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', color: solid, fontWeight: 700, fontSize: '13px' }}>
            <Icon /> {label}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {amt > 0 && (
              <span style={{ fontSize: '12px', fontWeight: 700, color: solid, background: bg, border: `1px solid ${border}`, borderRadius: '6px', padding: '2px 8px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <IconCheck /> Rs.{fmt(amt)}
              </span>
            )}
            {remaining > 0.005 && (
              <button type="button" onClick={() => fillRemaining(value)}
                style={{ padding: '3px 9px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, border: `1.5px solid ${border}`, background: bg, color: solid, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                +Rs.{fmt(remaining)}
              </button>
            )}
            {!isOnly && (
              <button type="button" onClick={() => toggleMethod(value)}
                style={{ width: '22px', height: '22px', borderRadius: '6px', border: `1.5px solid ${border}`, background: '#fff', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit' }}>
                <IconX />
              </button>
            )}
          </div>
        </div>

        {/* Card body — method-specific fields */}
        <div style={{ padding: '14px 16px' }}>

          {/* CASH — only amount */}
          {value === 'cash' && (
            <div style={{ maxWidth: '220px' }}>
              <label style={lbl}>Amount *</label>
              <AmountInput value={d.amount} onChange={updateField('cash', 'amount')} error={errors.cash_amount} />
            </div>
          )}

          {/* CREDIT — customer + amount */}
          {value === 'credit' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '12px' }}>
              <div>
                <label style={lbl}>Customer Account *</label>
                <div ref={creditCustRef} style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex', zIndex: 1 }}><IconUser /></span>
                  <input
                    style={inp({ paddingLeft: '30px', paddingRight: '28px', cursor: 'pointer', borderColor: errors.credit_customer ? '#fca5a5' : '#e2e8f0' })}
                    placeholder="Search customer..."
                    value={creditCustSearch}
                    readOnly={!showCreditCustDrop}
                    onClick={() => { setShowCreditCustDrop(true); setCreditCustSearch(''); }}
                    onChange={(e) => setCreditCustSearch(e.target.value)}
                  />
                  <span style={{ position: 'absolute', right: '9px', top: '50%', transform: `translateY(-50%) rotate(${showCreditCustDrop ? 180 : 0}deg)`, transition: 'transform 0.2s', color: '#94a3b8', display: 'flex', pointerEvents: 'none' }}><IconChevron /></span>
                  {showCreditCustDrop && (
                    <div style={{ position: 'absolute', top: 'calc(100% + 3px)', left: 0, right: 0, zIndex: 300, background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.10)', maxHeight: '180px', overflowY: 'auto' }}>
                      {filteredCreditCustomers.length === 0
                        ? <div style={{ padding: '10px 14px', color: '#94a3b8', fontSize: '13px' }}>No customers found</div>
                        : filteredCreditCustomers.map(c => (
                          <div key={c.id} onClick={() => selectCreditCustomer(c)}
                            style={{ padding: '9px 14px', cursor: 'pointer', fontSize: '13px', borderBottom: '1px solid #f1f5f9', color: '#0D1B3E', fontWeight: 500 }}
                            onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >{c.name}</div>
                        ))
                      }
                    </div>
                  )}
                </div>
                <ErrMsg msg={errors.credit_customer} />
                {d.customerId && d.customerName && (
                  <p style={{ fontSize: '11px', color: '#059669', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <IconCheck /> {d.customerName}
                  </p>
                )}
              </div>
              <div>
                <label style={lbl}>Amount *</label>
                <AmountInput value={d.amount} onChange={updateField('credit', 'amount')} borderColor={border} error={errors.credit_amount} />
              </div>
            </div>
          )}

          {/* JAZZCASH / EASYPAISA — phone + amount + txnId */}
          {(value === 'jazzcash' || value === 'easypaisa') && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div>
                <label style={lbl}>{label} Number *</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex' }}><IconPhone /></span>
                  <input
                    style={inp({ paddingLeft: '32px', borderColor: errors[`${value}_phone`] ? '#fca5a5' : '#e2e8f0' })}
                    placeholder="03XX-XXXXXXX"
                    value={d.phone}
                    onChange={updateField(value, 'phone')}
                    inputMode="tel"
                  />
                </div>
                <ErrMsg msg={errors[`${value}_phone`]} />
              </div>
              <div>
                <label style={lbl}>Amount *</label>
                <AmountInput value={d.amount} onChange={updateField(value, 'amount')} borderColor={border} error={errors[`${value}_amount`]} />
              </div>
              <div>
                <label style={lbl}>Transaction ID <span style={{ fontWeight: 400 }}>(Optional)</span></label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex' }}><IconHash /></span>
                  <input style={inp({ paddingLeft: '32px' })} placeholder="TXN reference..." value={d.txnId} onChange={updateField(value, 'txnId')} />
                </div>
              </div>
            </div>
          )}

          {/* BANK TRANSFER — bank name + account no + amount + ref */}
          {value === 'bank' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={lbl}>Bank Name *</label>
                  <input
                    style={inp({ borderColor: errors.bank_name ? '#fca5a5' : '#e2e8f0' })}
                    placeholder="e.g. HBL, MCB, UBL..."
                    value={d.bankName}
                    onChange={updateField('bank', 'bankName')}
                  />
                  <ErrMsg msg={errors.bank_name} />
                </div>
                <div>
                  <label style={lbl}>Account No. *</label>
                  <input
                    style={inp({ borderColor: errors.bank_account ? '#fca5a5' : '#e2e8f0' })}
                    placeholder="IBAN or account number"
                    value={d.accountNo}
                    onChange={updateField('bank', 'accountNo')}
                  />
                  <ErrMsg msg={errors.bank_account} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '12px' }}>
                <div>
                  <label style={lbl}>Amount *</label>
                  <AmountInput value={d.amount} onChange={updateField('bank', 'amount')} borderColor={border} error={errors.bank_amount} />
                </div>
                <div>
                  <label style={lbl}>Reference / Transaction ID <span style={{ fontWeight: 400 }}>(Optional)</span></label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex' }}><IconHash /></span>
                    <input style={inp({ paddingLeft: '32px' })} placeholder="Transfer reference..." value={d.ref} onChange={updateField('bank', 'ref')} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CREDIT CARD — amount + last 4 + ref */}
          {value === 'credit_card' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr', gap: '12px' }}>
              <div>
                <label style={lbl}>Amount *</label>
                <AmountInput value={d.amount} onChange={updateField('credit_card', 'amount')} borderColor={border} error={errors.credit_card_amount} />
              </div>
              <div>
                <label style={lbl}>Last 4 Digits <span style={{ fontWeight: 400 }}>(Optional)</span></label>
                <input
                  style={inp()}
                  placeholder="XXXX"
                  maxLength={4}
                  value={d.lastFour}
                  onChange={updateField('credit_card', 'lastFour')}
                  inputMode="numeric"
                />
              </div>
              <div>
                <label style={lbl}>Reference / Approval Code <span style={{ fontWeight: 400 }}>(Optional)</span></label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex' }}><IconHash /></span>
                  <input style={inp({ paddingLeft: '32px' })} placeholder="Approval reference..." value={d.ref} onChange={updateField('credit_card', 'ref')} />
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    );
  };

  // ── Main render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '34px', height: '34px', borderRadius: '10px', flexShrink: 0, background: 'linear-gradient(135deg, #0D1B3E, #1e3a8a)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
          <IconSaleTag />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11.5px', color: '#94a3b8', marginBottom: '1px' }}>
            <Link href="/dashboard/sales" style={{ color: '#0D1B3E', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
              <IconBack /> Sales
            </Link>
            <span style={{ color: '#cbd5e1' }}>/</span>
            <span>Add Sale</span>
          </div>
          <h1 style={{ margin: 0, fontSize: '19px', fontWeight: 700, color: '#0D1B3E', lineHeight: 1.2 }}>Add Sale</h1>
        </div>
      </div>

      {success && (
        <div className="alert-success" style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '10px 14px', fontSize: '13px' }}>
          <IconCheck /> Sale recorded successfully! Redirecting...
        </div>
      )}

      <div className="ps-card" style={{ overflow: 'visible' }}>
        {/* Card header */}
        <div style={{ padding: '13px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '3px', height: '14px', borderRadius: '2px', background: '#0D1B3E' }} />
          <p style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: '#0D1B3E', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Sale Details</p>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Row: Product | Qty | Rate */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '14px', alignItems: 'start' }}>

            {/* Product combobox */}
            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#475569', marginBottom: '5px' }}>Product *</label>
              <div ref={productRef} style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#059669', display: 'flex', zIndex: 1 }}><IconDroplet /></span>
                <input
                  style={inp({ paddingLeft: '30px', paddingRight: '28px', cursor: 'pointer', borderColor: errors.productId ? '#fca5a5' : '#e2e8f0' })}
                  placeholder="Search product..."
                  value={productSearch}
                  readOnly={!showProductDrop}
                  onClick={() => { setShowProductDrop(true); setProductSearch(''); }}
                  onChange={(e) => setProductSearch(e.target.value)}
                />
                <span style={{ position: 'absolute', right: '9px', top: '50%', transform: `translateY(-50%) rotate(${showProductDrop ? 180 : 0}deg)`, transition: 'transform 0.2s', color: '#94a3b8', display: 'flex', pointerEvents: 'none' }}><IconChevron /></span>
                {showProductDrop && (
                  <div style={{ position: 'absolute', top: 'calc(100% + 3px)', left: 0, right: 0, zIndex: 200, background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.10)', maxHeight: '210px', overflowY: 'auto' }}>
                    {filteredProducts.length === 0
                      ? <div style={{ padding: '11px 14px', color: '#94a3b8', fontSize: '13px' }}>No products found</div>
                      : filteredProducts.map(prod => (
                        <div key={prod.id} onClick={() => selectProduct(prod)}
                          style={{ padding: '9px 14px', cursor: 'pointer', background: form.productId === prod.id ? '#eff6ff' : 'transparent', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                          onMouseLeave={e => e.currentTarget.style.background = form.productId === prod.id ? '#eff6ff' : 'transparent'}
                        >
                          <span style={{ fontSize: '13px', fontWeight: 600, color: '#0D1B3E' }}>{prod.name}</span>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>{prod.stock} {prod.unit} · Rs.{fmt(prod.rate)}</span>
                        </div>
                      ))
                    }
                  </div>
                )}
              </div>
              {selectedProduct && !showProductDrop && (
                <p style={{ fontSize: '11px', color: '#059669', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <IconCheck /> {selectedProduct.name} · Stock: {selectedProduct.stock} {selectedProduct.unit} · Rs.{fmt(selectedProduct.rate)}
                </p>
              )}
              <ErrMsg msg={errors.productId} />
            </div>

            {/* Qty */}
            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#475569', marginBottom: '5px' }}>Qty ({unitDisp}) *</label>
              <input style={inp({ borderColor: errors.quantity ? '#fca5a5' : '#e2e8f0' })} placeholder="0.00" value={form.quantity} onChange={handleChange('quantity')} inputMode="decimal" />
              <ErrMsg msg={errors.quantity} />
            </div>

            {/* Rate */}
            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#475569', marginBottom: '5px' }}>Rate (Rs./{unitDisp}) *</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px', fontWeight: 700, color: '#94a3b8', pointerEvents: 'none' }}>Rs.</span>
                <input style={inp({ paddingLeft: '34px', borderColor: errors.rate ? '#fca5a5' : '#e2e8f0' })} placeholder="0.00" value={form.rate} onChange={handleChange('rate')} inputMode="decimal" />
              </div>
              <ErrMsg msg={errors.rate} />
            </div>
          </div>

          {/* Total bar */}
          <div style={{ background: 'linear-gradient(135deg, #0D1B3E 0%, #1e3a8a 100%)', borderRadius: '10px', padding: '11px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 1px' }}>Total Amount</p>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', margin: 0 }}>Qty × Rate per {unitDisp}</p>
            </div>
            <p style={{ fontSize: '22px', fontWeight: 800, color: total > 0 ? '#F0A500' : 'rgba(255,255,255,0.2)', margin: 0, letterSpacing: '-0.02em', fontFamily: 'monospace' }}>
              Rs. {fmt(total)}
            </p>
          </div>

          {/* ── Payment Methods section ──────────────────────────────────────── */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#475569' }}>Payment Method *</label>
              {activeMethods.length > 1 && (
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  {activeMethods.length} methods selected
                </span>
              )}
            </div>

            {/* Method selector buttons */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
              {METHODS.map(({ value, label, solid, bg, border, Icon }) => {
                const active = activeMethods.includes(value);
                return (
                  <button key={value} type="button" onClick={() => toggleMethod(value)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '7px 14px', borderRadius: '8px',
                      fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                      transition: 'all 0.15s',
                      background: active ? solid : bg,
                      color:      active ? '#fff' : solid,
                      border:     `1.5px solid ${active ? solid : border}`,
                      boxShadow:  active ? `0 3px 10px ${solid}35` : 'none',
                    }}
                  >
                    <Icon />
                    {label}
                    {active && (
                      <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <IconCheck />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <ErrMsg msg={errors.payment} />

            {/* Active method cards */}
            {activeMethods.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {METHODS.filter(m => activeMethods.includes(m.value)).map(method => renderCard(method))}
              </div>
            )}

            {/* Split summary bar (shown when multiple methods or any amount entered) */}
            {activeMethods.length > 0 && total > 0 && (
              <div style={{
                marginTop: '10px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '9px 14px', borderRadius: '8px',
                background: splitDone ? '#f0fdf4' : overPaid ? '#fef2f2' : '#f8fafc',
                border: `1.5px solid ${splitDone ? '#6ee7b7' : overPaid ? '#fca5a5' : '#e2e8f0'}`,
              }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: splitDone ? '#059669' : overPaid ? '#dc2626' : '#64748b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  {splitDone
                    ? <><IconCheck /> Payment complete · Rs.{fmt(total)}</>
                    : overPaid
                      ? <><IconAlert /> Over by Rs.{fmt(splitTotal - total)}</>
                      : `Entered: Rs.${fmt(splitTotal)} of Rs.${fmt(total)}`
                  }
                </span>
                {!splitDone && !overPaid && remaining > 0.005 && (
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#d97706' }}>
                    Remaining: Rs.{fmt(remaining)}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Note + Date row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '14px', alignItems: 'start' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#475569', marginBottom: '5px' }}>
                Note <span style={{ fontWeight: 400, color: '#94a3b8' }}>(Optional)</span>
              </label>
              <textarea
                style={{ ...inp(), resize: 'vertical', lineHeight: 1.5 }}
                placeholder="Additional notes about this sale..."
                value={form.note}
                onChange={handleChange('note')}
                rows={2}
              />
            </div>
            <div style={{ minWidth: '155px' }}>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#475569', marginBottom: '5px' }}>Sale Date *</label>
              <input type="date" style={inp({ borderColor: errors.date ? '#fca5a5' : '#e2e8f0' })} value={form.date} onChange={handleChange('date')} />
              <ErrMsg msg={errors.date} />
            </div>
          </div>

          {/* Action bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '14px', marginTop: '2px' }}>
            <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>* Required fields</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Link href="/dashboard/sales" style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, border: '1.5px solid #e2e8f0', color: '#64748b', textDecoration: 'none', background: '#fff', display: 'inline-flex', alignItems: 'center' }}>
                Cancel
              </Link>
              <button type="submit" disabled={loading} style={{ padding: '8px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, background: '#0D1B3E', color: '#fff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', opacity: loading ? 0.75 : 1, fontFamily: 'inherit' }}>
                {loading ? <><span className="spinner" /> Saving...</> : <><IconSave /> Save Sale</>}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
