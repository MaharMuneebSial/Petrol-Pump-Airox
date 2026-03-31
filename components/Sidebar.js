'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// ── SVG Icons (16px) ─────────────────────────
const S = { w: '16', h: '16', f: 'none', s: 'currentColor', sw: '2', lc: 'round', lj: 'round', v: '0 0 24 24' };
const IconGrid = () => <svg width={S.w} height={S.h} fill={S.f} stroke={S.s} strokeWidth={S.sw} strokeLinecap={S.lc} strokeLinejoin={S.lj} viewBox={S.v}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>;
const IconUsers = () => <svg width={S.w} height={S.h} fill={S.f} stroke={S.s} strokeWidth={S.sw} strokeLinecap={S.lc} strokeLinejoin={S.lj} viewBox={S.v}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const IconCart = () => <svg width={S.w} height={S.h} fill={S.f} stroke={S.s} strokeWidth={S.sw} strokeLinecap={S.lc} strokeLinejoin={S.lj} viewBox={S.v}><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>;
const IconTrending = () => <svg width={S.w} height={S.h} fill={S.f} stroke={S.s} strokeWidth={S.sw} strokeLinecap={S.lc} strokeLinejoin={S.lj} viewBox={S.v}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>;
const IconReceipt = () => <svg width={S.w} height={S.h} fill={S.f} stroke={S.s} strokeWidth={S.sw} strokeLinecap={S.lc} strokeLinejoin={S.lj} viewBox={S.v}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>;
const IconBarChart = () => <svg width={S.w} height={S.h} fill={S.f} stroke={S.s} strokeWidth={S.sw} strokeLinecap={S.lc} strokeLinejoin={S.lj} viewBox={S.v}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>;
const IconPackage = () => <svg width={S.w} height={S.h} fill={S.f} stroke={S.s} strokeWidth={S.sw} strokeLinecap={S.lc} strokeLinejoin={S.lj} viewBox={S.v}><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>;
const IconShield = () => <svg width={S.w} height={S.h} fill={S.f} stroke={S.s} strokeWidth={S.sw} strokeLinecap={S.lc} strokeLinejoin={S.lj} viewBox={S.v}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
const IconFuel = () => <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M3 22V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"/><path d="M3 11h12"/><path d="M13 6l4 4"/><path d="M17 10v6a2 2 0 0 0 4 0v-4l-2-2"/></svg>;
const IconChevronDown = ({ open }) => <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}><polyline points="6 9 12 15 18 9"/></svg>;

const menuItems = [
  { label: 'Dashboard', Icon: IconGrid, href: '/dashboard', exact: true },
  {
    label: 'Accounts', Icon: IconUsers,
    children: [
      { label: 'Add Account', href: '/dashboard/accounts/add' },
      { label: 'Manage Accounts', href: '/dashboard/accounts' },
      { label: 'Ledger', href: '/dashboard/accounts/ledger' },
    ],
  },
  {
    label: 'Purchase', Icon: IconCart,
    children: [
      { label: 'Add Purchase', href: '/dashboard/purchase/add' },
      { label: 'Purchase List', href: '/dashboard/purchase' },
    ],
  },
  {
    label: 'Sales', Icon: IconTrending,
    children: [
      { label: 'Add Sale', href: '/dashboard/sales/add' },
      { label: 'Sales List', href: '/dashboard/sales' },
    ],
  },
  {
    label: 'Vouchers', Icon: IconReceipt,
    children: [
      { label: 'Cash Receipt', href: '/dashboard/vouchers?type=receipt' },
      { label: 'Cash Payment', href: '/dashboard/vouchers?type=payment' },
    ],
  },
  {
    label: 'Reports', Icon: IconBarChart,
    children: [
      { label: 'Cash Receivable', href: '/dashboard/reports/cash-receivable' },
      { label: 'Cash Payable', href: '/dashboard/reports/cash-payable' },
      { label: 'Summary Sheet', href: '/dashboard/reports/summary-sheet' },
      { label: 'Purchase Report', href: '/dashboard/reports/purchase-report' },
      { label: 'Sales Report', href: '/dashboard/reports/sales-report' },
      { label: 'Trading Account', href: '/dashboard/reports/trading-account' },
      { label: 'Profit on Sales', href: '/dashboard/reports/profit-on-sales' },
      { label: 'Expenses Report', href: '/dashboard/reports/expenses' },
      { label: 'Investment Summary', href: '/dashboard/reports/investment-summary' },
      { label: 'Datewise Summary', href: '/dashboard/reports/datewise-summary' },
      { label: 'Product Summary', href: '/dashboard/reports/datewise-product-summary' },
    ],
  },
  {
    label: 'Products', Icon: IconPackage,
    children: [
      { label: 'Add Product', href: '/dashboard/products/add' },
      { label: 'Manage Products', href: '/dashboard/products/manage' },
      { label: 'Add Machine', href: '/dashboard/products/machines/add' },
      { label: 'Manage Machines', href: '/dashboard/products/machines/manage' },
      { label: 'Rate Adjustment', href: '/dashboard/products/rate-adjustment' },
    ],
  },
  {
    label: 'Security', Icon: IconShield,
    children: [
      { label: 'Change Password', href: '/dashboard/security/change-password' },
      { label: 'Company Info', href: '/dashboard/security/company-info' },
    ],
  },
];

export default function Sidebar({ collapsed, onToggle }) {
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = useState({});

  const toggleMenu = (label) =>
    setOpenMenus(prev => ({ ...prev, [label]: !prev[label] }));

  const isActive = (href, exact = false) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <div style={{
      width: collapsed ? '52px' : '210px',
      background: '#0f172a',
      borderRight: '1px solid rgba(255,255,255,0.06)',
      minHeight: '100vh',
      display: 'flex', flexDirection: 'column',
      transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
      overflow: 'hidden', flexShrink: 0,
    }}>
      {/* ── Logo ── */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        padding: collapsed ? '10px 0' : '10px 10px 10px 12px',
        minHeight: '48px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        background: 'linear-gradient(135deg, rgba(15,31,92,0.6), rgba(10,21,64,0.8))',
      }}>
        {!collapsed ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '30px', height: '30px',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', flexShrink: 0,
              boxShadow: '0 3px 10px rgba(245,158,11,0.35)',
            }}>
              <IconFuel />
            </div>
            <div>
              <div style={{ color: '#f59e0b', fontWeight: 800, fontSize: '11px', letterSpacing: '0.08em', lineHeight: 1.1 }}>PETRO</div>
              <div style={{ color: '#94a3b8', fontWeight: 500, fontSize: '8px', letterSpacing: '0.12em', marginTop: '1px' }}>STATION</div>
            </div>
          </div>
        ) : (
          <div style={{
            width: '30px', height: '30px',
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white',
            boxShadow: '0 3px 10px rgba(245,158,11,0.35)',
          }}>
            <IconFuel />
          </div>
        )}
      </div>

      {/* ── Nav ── */}
      <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '4px 0' }}>
        {!collapsed && (
          <div style={{ padding: '6px 12px 3px', fontSize: '9px', fontWeight: 700, color: '#334155', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Menu
          </div>
        )}

        {menuItems.map((item) => {
          if (!item.children) {
            const active = isActive(item.href, item.exact);
            return (
              <Link key={item.label} href={item.href} style={{
                display: 'flex', alignItems: 'center',
                gap: '9px',
                padding: collapsed ? '8px 0' : '7px 12px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                margin: '1px 6px',
                borderRadius: '7px',
                textDecoration: 'none',
                color: active ? '#f59e0b' : '#94a3b8',
                background: active ? 'rgba(245,158,11,0.12)' : 'transparent',
                borderLeft: active && !collapsed ? '2px solid #f59e0b' : '2px solid transparent',
                fontWeight: active ? 600 : 500,
                fontSize: '12px',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s',
              }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#e2e8f0'; } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8'; } }}
              >
                <span style={{ flexShrink: 0, opacity: active ? 1 : 0.75 }}><item.Icon /></span>
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          }

          const anyChildActive = item.children.some(c => pathname.startsWith(c.href.split('?')[0]));
          const open = openMenus[item.label] !== undefined ? openMenus[item.label] : anyChildActive;

          return (
            <div key={item.label}>
              <button
                onClick={() => !collapsed && toggleMenu(item.label)}
                style={{
                  display: 'flex', alignItems: 'center',
                  gap: '9px',
                  padding: collapsed ? '8px 0' : '7px 12px',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  margin: '1px 6px',
                  width: 'calc(100% - 12px)',
                  borderRadius: '7px',
                  background: anyChildActive ? 'rgba(245,158,11,0.12)' : 'transparent',
                  borderLeft: anyChildActive && !collapsed ? '2px solid #f59e0b' : '2px solid transparent',
                  color: anyChildActive ? '#f59e0b' : '#94a3b8',
                  fontWeight: anyChildActive ? 600 : 500,
                  fontSize: '12px',
                  border: 'none', cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={e => { if (!anyChildActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#e2e8f0'; } }}
                onMouseLeave={e => { if (!anyChildActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8'; } }}
              >
                <span style={{ flexShrink: 0, opacity: anyChildActive ? 1 : 0.75 }}><item.Icon /></span>
                {!collapsed && (
                  <>
                    <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
                    <span style={{ opacity: 0.5 }}><IconChevronDown open={open} /></span>
                  </>
                )}
              </button>

              {!collapsed && open && (
                <div style={{
                  background: 'rgba(0,0,0,0.15)',
                  margin: '1px 6px',
                  borderRadius: '6px',
                  overflow: 'hidden',
                }}>
                  {item.children.map(child => {
                    const childBase = child.href.split('?')[0];
                    const childActive = pathname === childBase || pathname.startsWith(childBase + '/');
                    return (
                      <Link key={child.label} href={child.href} style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '5px 10px 5px 28px',
                        fontSize: '11px',
                        color: childActive ? '#fbbf24' : '#64748b',
                        background: childActive ? 'rgba(245,158,11,0.1)' : 'transparent',
                        textDecoration: 'none',
                        fontWeight: childActive ? 600 : 400,
                        whiteSpace: 'nowrap',
                        transition: 'all 0.12s',
                        borderLeft: childActive ? '2px solid #f59e0b' : '2px solid transparent',
                      }}
                        onMouseEnter={e => { if (!childActive) { e.currentTarget.style.color = '#cbd5e1'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; } }}
                        onMouseLeave={e => { if (!childActive) { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.background = 'transparent'; } }}
                      >
                        <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: childActive ? '#f59e0b' : '#334155', flexShrink: 0 }} />
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* ── Footer ── */}
      {!collapsed && (
        <div style={{ padding: '8px 12px', borderTop: '1px solid rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 4px #10b981' }} />
            <span style={{ fontSize: '9px', color: '#475569' }}>PetroStation v1.0</span>
          </div>
        </div>
      )}
    </div>
  );
}
