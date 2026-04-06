'use client';
import { useState, useEffect, useRef } from 'react';
import { getDashboardSummary, getCompany, getRole } from '../../lib/store';
import Link from 'next/link';

const fmt = (n) => new Intl.NumberFormat('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);

function AnimatedNumber({ value, prefix = '', suffix = '', duration = 900 }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);
  const numVal = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.-]/g, '')) || 0;
  useEffect(() => {
    const startTime = performance.now();
    function tick(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      setDisplay(numVal * (1 - Math.pow(1 - progress, 3)));
      if (progress < 1) ref.current = requestAnimationFrame(tick);
    }
    ref.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(ref.current);
  }, [numVal, duration]);
  return <>{prefix}{fmt(display)}{suffix}</>;
}

// ── Compact Icons (18px default) ─────────────
const I = { w: 18, h: 18, f: 'none', s: 'currentColor', sw: '2', lc: 'round', lj: 'round', v: '0 0 24 24' };
const IconUsers = () => <svg width={I.w} height={I.h} fill={I.f} stroke={I.s} strokeWidth={I.sw} strokeLinecap={I.lc} strokeLinejoin={I.lj} viewBox={I.v}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const IconCart = () => <svg width={I.w} height={I.h} fill={I.f} stroke={I.s} strokeWidth={I.sw} strokeLinecap={I.lc} strokeLinejoin={I.lj} viewBox={I.v}><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>;
const IconTrending = () => <svg width={I.w} height={I.h} fill={I.f} stroke={I.s} strokeWidth={I.sw} strokeLinecap={I.lc} strokeLinejoin={I.lj} viewBox={I.v}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>;
const IconExpense = () => <svg width={I.w} height={I.h} fill={I.f} stroke={I.s} strokeWidth={I.sw} strokeLinecap={I.lc} strokeLinejoin={I.lj} viewBox={I.v}><path d="M12 1v22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
const IconFuel = () => <svg width={I.w} height={I.h} fill={I.f} stroke={I.s} strokeWidth={I.sw} strokeLinecap={I.lc} strokeLinejoin={I.lj} viewBox={I.v}><path d="M3 22V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"/><path d="M3 11h12"/><path d="M13 6l4 4"/><path d="M17 10v6a2 2 0 0 0 4 0v-4l-2-2"/></svg>;
const IconCalendar = () => <svg width="14" height="14" fill={I.f} stroke={I.s} strokeWidth={I.sw} strokeLinecap={I.lc} strokeLinejoin={I.lj} viewBox={I.v}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
const IconBarrel = () => <svg width="16" height="16" fill={I.f} stroke={I.s} strokeWidth={I.sw} strokeLinecap={I.lc} strokeLinejoin={I.lj} viewBox={I.v}><path d="M12 2C6.5 2 2 4.5 2 7v10c0 2.5 4.5 5 10 5s10-2.5 10-5V7c0-2.5-4.5-5-10-5z"/><path d="M2 7c0 2.5 4.5 5 10 5s10-2.5 10-5"/><path d="M2 12c0 2.5 4.5 5 10 5s10-2.5 10-5"/></svg>;
const IconCash = () => <svg width={I.w} height={I.h} fill={I.f} stroke={I.s} strokeWidth={I.sw} strokeLinecap={I.lc} strokeLinejoin={I.lj} viewBox={I.v}><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>;
const IconArrowRight = () => <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>;
const IconLightning = () => <svg width="14" height="14" fill={I.f} stroke={I.s} strokeWidth={I.sw} strokeLinecap={I.lc} strokeLinejoin={I.lj} viewBox={I.v}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
const IconManage = () => <svg width="14" height="14" fill={I.f} stroke={I.s} strokeWidth={I.sw} strokeLinecap={I.lc} strokeLinejoin={I.lj} viewBox={I.v}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

// ── Compact Stat Card ────────────────────────
function StatCard({ Icon, label, value, color, iconBg, sub, accentColor, isNumeric, numValue }) {
  return (
    <div className="ps-stat-card" style={{
      cursor: 'default',
      borderLeft: `3px solid ${accentColor}`,
      borderBottom: 'none',
    }}>
      <div style={{ padding: '10px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
            background: iconBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: accentColor,
          }}>
            <Icon />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '9px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 1px' }}>
              {label}
            </p>
            <p style={{ fontSize: '15px', fontWeight: 800, color, margin: 0, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              {isNumeric ? <AnimatedNumber value={numValue} prefix="Rs. " /> : value}
            </p>
          </div>
          <span style={{
            display: 'flex', alignItems: 'center', gap: '3px',
            fontSize: '9px', fontWeight: 700, color: '#10b981',
            background: '#dcfce7', padding: '2px 6px', borderRadius: '99px',
            alignSelf: 'flex-start',
          }}>
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10b981', animation: 'livePulse 2s ease-in-out infinite' }} />
            Live
          </span>
        </div>
        {sub && <p style={{ fontSize: '9px', color: '#b0b8c8', margin: '4px 0 0 42px' }}>{sub}</p>}
      </div>
    </div>
  );
}

// ── Compact Stock Row ────────────────────────
function StockRow({ name, stock, unit, rate, maxStock = 10000 }) {
  const value = stock * rate;
  const isLow = stock < 500;
  const isEmpty = stock === 0;
  const pct = Math.min((stock / maxStock) * 100, 100);
  const barColor = isEmpty ? '#ef4444' : isLow ? '#DC2626' : '#10b981';
  return (
    <tr>
      <td style={{ padding: '7px 10px', color: '#1e293b', fontWeight: 600, fontSize: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: barColor, flexShrink: 0 }} />
          {name}
        </div>
      </td>
      <td style={{ padding: '7px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '100px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ width: '100%', height: '3px', background: '#f1f5f9', borderRadius: '99px', overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: barColor, borderRadius: '99px', transition: 'width 0.8s ease' }} />
            </div>
          </div>
          <span style={{ fontWeight: 700, fontSize: '12px', color: isEmpty ? '#ef4444' : isLow ? '#DC2626' : '#10b981', whiteSpace: 'nowrap' }}>
            {fmt(stock)} <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 500 }}>{unit}</span>
          </span>
        </div>
      </td>
      <td style={{ padding: '7px 10px', textAlign: 'right', color: '#475569', fontSize: '12px' }}>Rs. {fmt(rate)}</td>
      <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 700, color: '#0f1f5c', fontSize: '12px' }}>Rs. {fmt(value)}</td>
      <td style={{ padding: '7px 10px', textAlign: 'center' }}>
        <span className={`badge ${isEmpty ? 'badge-danger' : isLow ? 'badge-warning' : 'badge-success'}`} style={{ fontSize: '10px', padding: '2px 8px' }}>
          {isEmpty ? 'Out' : isLow ? 'Low' : 'OK'}
        </span>
      </td>
    </tr>
  );
}

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [company, setCompany] = useState(null);
  const [now, setNow] = useState('');

  useEffect(() => {
    const load = async () => {
      setSummary(await getDashboardSummary());
      setCompany(getCompany());
      setNow(new Date().toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    };
    load();
  }, []);

  // Returns true if the current user can access a given permission key
  const canAccess = (permKey) => {
    const role = getRole();
    if (!role) return false;
    if (role === 'owner') return true;
    const perms = getCompany()?.permissions || {};
    return perms[permKey] === true;
  };

  if (!summary) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: '#0f1f5c', animation: 'spin 0.7s linear infinite', margin: '0 auto 12px' }} />
        <p style={{ color: '#64748b', fontSize: '13px' }}>Loading dashboard...</p>
      </div>
    </div>
  );

  const totalStockValue = summary.stockDetails.reduce((s, d) => s + d.stock * d.rate, 0);

  return (
    <>
      <style>{`
        @keyframes livePulse { 0%,100%{opacity:1} 50%{opacity:.3} }
        @keyframes floatOrb { 0%,100%{transform:translate(0,0)} 50%{transform:translate(8px,-8px)} }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

        {/* ── Welcome Banner ── */}
        <div style={{
          borderRadius: '12px', padding: '12px 18px',
          background: 'linear-gradient(135deg, #0a1540 0%, #0f1f5c 50%, #1a237e 100%)',
          boxShadow: '0 4px 20px rgba(15,31,92,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: '14px',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', right: '-20px', top: '-20px', width: '160px', height: '160px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.1), transparent 70%)', animation: 'floatOrb 8s ease-in-out infinite', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '20px 20px', pointerEvents: 'none' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative', zIndex: 1 }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '9px',
              background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontSize: '14px', fontWeight: 800,
              boxShadow: '0 3px 10px rgba(37,99,235,0.4)',
            }}>
              {company?.businessName?.charAt(0)?.toUpperCase() || 'P'}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ color: 'white', fontWeight: 800, fontSize: '14px', margin: 0, letterSpacing: '-0.01em' }}>
                  {getGreeting()}, {company?.businessName || 'Admin'}
                </h1>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#94a3b8', fontSize: '11px' }}>
                  <IconCalendar /> {now}
                </span>
                <span style={{ width: '1px', height: '12px', background: 'rgba(255,255,255,0.15)' }} />
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  padding: '3px 10px', borderRadius: '999px',
                  background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.25)',
                  color: '#93C5FD', fontSize: '11px', fontWeight: 700,
                }}>
                  <IconFuel /> {company?.pumpCode}
                </span>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  padding: '3px 10px', borderRadius: '999px',
                  background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)',
                  color: '#6ee7b7', fontSize: '11px', fontWeight: 600,
                }}>
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981', animation: 'livePulse 2s ease-in-out infinite' }} />
                  Online
                </span>
              </div>
            </div>
          </div>

          <div className="hidden md:flex" style={{ gap: '8px', position: 'relative', zIndex: 1 }}>
            {canAccess('sales_add') && (
              <Link href="/dashboard/sales/add" style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                padding: '6px 12px', background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                color: 'white', fontWeight: 700, fontSize: '11px',
                borderRadius: '7px', textDecoration: 'none',
                boxShadow: '0 3px 10px rgba(37,99,235,0.4)',
              }}>
                <IconTrending /> Add Sale
              </Link>
            )}
            {canAccess('purchase') && (
              <Link href="/dashboard/purchase/add" style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                padding: '6px 12px', background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.18)',
                color: 'white', fontWeight: 600, fontSize: '11px',
                borderRadius: '7px', textDecoration: 'none',
              }}>
                <IconCart /> Add Purchase
              </Link>
            )}
          </div>
        </div>

        {/* ── Monthly Summary ── */}
        <div className="ps-card" style={{ overflow: 'hidden' }}>
          <div style={{
            padding: '10px 16px', borderBottom: '1px solid #f1f5f9',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '7px',
                background: 'linear-gradient(135deg, #0f1f5c, #1e3a8a)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
              }}>
                <IconCalendar />
              </div>
              <h2 style={{ fontWeight: 700, fontSize: '13px', color: '#0f1f5c', margin: 0 }}>Monthly Sales Summary</h2>
            </div>
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#0f1f5c', background: '#eff6ff', padding: '3px 10px', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
              {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {[
              { label: 'Total Sale Amount', value: summary.monthlySaleAmt, prefix: 'Rs. ', color: '#10b981', bg: 'linear-gradient(145deg, #f0fdf4, #dcfce7)', iconBg: '#10b981', Icon: IconCash },
              { label: 'Petrol Sold', value: summary.petrolLtr, suffix: ' Ltr', color: '#0f1f5c', bg: 'linear-gradient(145deg, #eff6ff, #dbeafe)', iconBg: '#0f1f5c', Icon: IconFuel },
              { label: 'Diesel Sold', value: summary.dieselLtr, suffix: ' Ltr', color: '#475569', bg: 'linear-gradient(145deg, #f8fafc, #f1f5f9)', iconBg: '#64748b', Icon: IconBarrel },
            ].map((item, i) => (
              <div key={item.label} style={{
                padding: '10px 12px', background: item.bg,
                borderRight: i < 2 ? '1px solid rgba(226,232,240,0.5)' : 'none',
                textAlign: 'center',
              }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '7px',
                  background: item.iconBg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', margin: '0 auto 6px',
                  boxShadow: `0 2px 8px ${item.iconBg}40`,
                }}>
                  <item.Icon />
                </div>
                <p style={{ fontSize: '16px', fontWeight: 800, color: item.color, margin: '0 0 2px', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                  <AnimatedNumber value={item.value} prefix={item.prefix || ''} suffix={item.suffix || ''} />
                </p>
                <p style={{ fontSize: '9px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }} className="lg:grid-cols-4">
          <StatCard Icon={IconUsers} label="Total Accounts" value={summary.accountsCount} color="#0f1f5c" iconBg="#eff6ff" accentColor="#0f1f5c" sub="Customers & Suppliers" />
          <StatCard Icon={IconCart} label="Total Purchases" value={`Rs. ${fmt(summary.totalPurchaseAmt)}`} color="#7c3aed" iconBg="#f5f3ff" accentColor="#7c3aed" sub="All time" isNumeric numValue={summary.totalPurchaseAmt} />
          <StatCard Icon={IconTrending} label="Total Sales" value={`Rs. ${fmt(summary.totalSaleAmt)}`} color="#10b981" iconBg="#f0fdf4" accentColor="#10b981" sub="All time" isNumeric numValue={summary.totalSaleAmt} />
          <StatCard Icon={IconExpense} label="Total Expenses" value={`Rs. ${fmt(summary.totalExpenseAmt)}`} color="#ef4444" iconBg="#fef2f2" accentColor="#ef4444" sub="All time" isNumeric numValue={summary.totalExpenseAmt} />
        </div>

        {/* ── Main Grid: Stock + Sidebar ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }} className="xl:grid-cols-3">
          {/* Stock Table */}
          <div className="ps-card xl:col-span-2">
            <div style={{
              padding: '10px 16px', borderBottom: '1px solid #f1f5f9',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '7px',
                  background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
                }}>
                  <IconBarrel />
                </div>
                <h2 style={{ fontWeight: 700, fontSize: '13px', color: '#0f1f5c', margin: 0 }}>Stock Details</h2>
              </div>
              <Link href="/dashboard/products/manage" style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                fontSize: '11px', fontWeight: 600, color: '#0f1f5c', textDecoration: 'none',
                padding: '4px 10px', borderRadius: '6px', background: '#f1f5f9',
              }}>
                Manage <IconArrowRight />
              </Link>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="ps-table">
                <thead>
                  <tr>
                    <th style={{ fontSize: '10px', padding: '8px 14px' }}>Product</th>
                    <th style={{ fontSize: '10px', padding: '8px 14px' }}>Stock Level</th>
                    <th style={{ fontSize: '10px', padding: '8px 14px', textAlign: 'right' }}>Rate</th>
                    <th style={{ fontSize: '10px', padding: '8px 14px', textAlign: 'right' }}>Value</th>
                    <th style={{ fontSize: '10px', padding: '8px 14px', textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.stockDetails.map(d => <StockRow key={d.name} {...d} />)}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} style={{ padding: '7px 10px', fontWeight: 700, fontSize: '12px', color: '#0f1f5c' }}>
                      Total Stock Value
                    </td>
                    <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 800, color: '#10b981', fontSize: '13px' }}>
                      Rs. {fmt(totalStockValue)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Cash in Hand */}
            <div className="ps-card" style={{ padding: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <div style={{
                  width: '24px', height: '24px', borderRadius: '6px',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
                }}>
                  <IconCash />
                </div>
                <h2 style={{ fontWeight: 700, fontSize: '12px', color: '#0f1f5c', margin: 0 }}>Cash in Hand</h2>
              </div>
              <div style={{
                borderRadius: '8px', padding: '12px',
                background: 'linear-gradient(135deg, #0a1540, #0f1f5c)',
                textAlign: 'center',
                boxShadow: '0 4px 16px rgba(15,31,92,0.3)',
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{ position: 'absolute', right: '-10px', top: '-10px', width: '60px', height: '60px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.15), transparent 70%)', pointerEvents: 'none' }} />
                <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.15em', color: '#93c5fd', textTransform: 'uppercase', margin: '0 0 4px', position: 'relative' }}>
                  Available Cash
                </p>
                <p style={{ fontSize: '18px', fontWeight: 800, color: 'white', margin: 0, letterSpacing: '-0.02em', position: 'relative' }}>
                  <AnimatedNumber value={summary.cashInHand > 0 ? summary.cashInHand : 0} prefix="Rs. " />
                </p>
                {summary.cashInHand < 0 && (
                  <p style={{ fontSize: '11px', color: '#fca5a5', margin: '4px 0 0', position: 'relative' }}>Cash deficit</p>
                )}
              </div>

              <div style={{ marginTop: '8px', display: 'flex', gap: '6px' }}>
                <Link href="/dashboard/vouchers?type=receipt" style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  padding: '6px', borderRadius: '7px',
                  background: '#f0fdf4', border: '1px solid #bbf7d0',
                  color: '#15803d', textDecoration: 'none', fontSize: '11px', fontWeight: 700,
                }}>
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10b981' }} />
                  Receipt
                </Link>
                <Link href="/dashboard/vouchers?type=payment" style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  padding: '6px', borderRadius: '7px',
                  background: '#fef2f2', border: '1px solid #fecaca',
                  color: '#b91c1c', textDecoration: 'none', fontSize: '11px', fontWeight: 700,
                }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444' }} />
                  Payment
                </Link>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="ps-card" style={{ padding: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <div style={{
                  width: '24px', height: '24px', borderRadius: '6px',
                  background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
                }}>
                  <IconLightning />
                </div>
                <h2 style={{ fontWeight: 700, fontSize: '12px', color: '#0f1f5c', margin: 0 }}>Quick Actions</h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                {[
                  { label: 'Add Sale', href: '/dashboard/sales/add', Icon: IconTrending, color: '#10b981', bg: '#f0fdf4', border: '#bbf7d0', perm: 'sales_add' },
                  { label: 'Add Purchase', href: '/dashboard/purchase/add', Icon: IconCart, color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', perm: 'purchase' },
                  { label: 'Add Account', href: '/dashboard/accounts/add', Icon: IconUsers, color: '#0f1f5c', bg: '#eff6ff', border: '#bfdbfe', perm: 'accounts' },
                  { label: 'Reports', href: '/dashboard/reports/summary-sheet', Icon: IconManage, color: '#475569', bg: '#f8fafc', border: '#e2e8f0', perm: 'reports' },
                ].filter(a => canAccess(a.perm)).map(a => (
                  <Link key={a.label} href={a.href} style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                    padding: '8px 6px', borderRadius: '8px',
                    background: a.bg, border: `1px solid ${a.border}`,
                    textDecoration: 'none', textAlign: 'center',
                    transition: 'all 0.2s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    <span style={{
                      width: '26px', height: '26px', borderRadius: '6px',
                      background: `${a.color}10`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: a.color,
                    }}>
                      <a.Icon />
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: a.color }}>{a.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
