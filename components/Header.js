'use client';
import { useRouter } from 'next/navigation';
import { getCompany, clearSession } from '../lib/store';
import { useState, useEffect, useRef } from 'react';

const IconMenu = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>;
const IconFuel = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M3 22V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"/><path d="M3 11h12"/><path d="M13 6l4 4"/><path d="M17 10v6a2 2 0 0 0 4 0v-4l-2-2"/></svg>;
const IconEdit = () => <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IconLock = () => <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
const IconLogout = () => <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
const IconChevron = () => <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>;
const IconBell = () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;

export default function Header({ onToggleSidebar }) {
  const router = useRouter();
  const [company, setCompany] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => { setCompany(getCompany()); }, []);
  useEffect(() => {
    const handler = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSignOut = () => { clearSession(); router.push('/signin'); };
  const initials = company?.businessName ? company.businessName.slice(0, 2).toUpperCase() : 'PS';

  return (
    <header style={{
      height: '48px', minHeight: '48px',
      background: 'linear-gradient(135deg, #0a1540 0%, #0f1f5c 60%, #1a237e 100%)',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 14px',
      position: 'relative', zIndex: 40,
      boxShadow: '0 1px 8px rgba(0,0,0,0.2)',
    }}>
      {/* Left */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button onClick={onToggleSidebar} style={{
          background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '7px', color: '#93c5fd', cursor: 'pointer', padding: '5px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
        >
          <IconMenu />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{
            width: '26px', height: '26px',
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            borderRadius: '6px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
            boxShadow: '0 2px 6px rgba(245,158,11,0.35)',
          }}>
            <IconFuel />
          </div>
          <span className="hidden sm:block" style={{ color: 'white', fontWeight: 800, fontSize: '13px', letterSpacing: '0.04em' }}>
            PETRO<span style={{ color: '#f59e0b' }}>STATION</span>
          </span>
        </div>
      </div>

      {/* Center */}
      {company && (
        <div className="hidden md:flex" style={{
          alignItems: 'center', gap: '6px',
          padding: '4px 12px', borderRadius: '999px',
          background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)',
          position: 'absolute', left: '50%', transform: 'translateX(-50%)',
        }}>
          <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 4px #10b981' }} />
          <span style={{ color: '#fcd34d', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em' }}>PUMP CODE:</span>
          <span style={{ color: '#ffffff', fontSize: '11px', fontWeight: 800, letterSpacing: '0.15em' }}>{company.pumpCode || 'N/A'}</span>
        </div>
      )}

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <button style={{
          background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '7px', color: '#93c5fd', cursor: 'pointer', padding: '5px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
        >
          <IconBell />
        </button>

        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button onClick={() => setShowDropdown(p => !p)} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '3px 8px 3px 3px',
            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '8px', cursor: 'pointer',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
            onMouseLeave={e => { if (!showDropdown) e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
          >
            <div style={{
              width: '26px', height: '26px', borderRadius: '6px',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 800, fontSize: '10px', flexShrink: 0,
            }}>
              {initials}
            </div>
            <div className="hidden sm:block" style={{ textAlign: 'left' }}>
              <div style={{ color: 'white', fontSize: '11px', fontWeight: 600, maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {company?.businessName || 'Admin'}
              </div>
              <div style={{ color: '#64748b', fontSize: '9px' }}>Administrator</div>
            </div>
            <span style={{ color: '#64748b' }}><IconChevron /></span>
          </button>

          {showDropdown && (
            <div style={{
              position: 'absolute', right: 0, top: 'calc(100% + 6px)',
              width: '200px', background: '#1e293b', border: '1px solid #334155',
              borderRadius: '10px', boxShadow: '0 12px 30px rgba(0,0,0,0.35)',
              overflow: 'hidden', zIndex: 100,
            }}>
              <div style={{ padding: '10px 12px', borderBottom: '1px solid #334155', background: 'rgba(15,31,92,0.3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '30px', height: '30px', borderRadius: '8px',
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 800, fontSize: '11px',
                  }}>
                    {initials}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: 'white', fontSize: '11px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {company?.businessName || 'Admin'}
                    </div>
                    <div style={{ color: '#64748b', fontSize: '10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {company?.email || ''}
                    </div>
                  </div>
                </div>
              </div>

              {[
                { label: 'Edit Profile', icon: <IconEdit />, href: '/dashboard/security/company-info' },
                { label: 'Change Password', icon: <IconLock />, href: '/dashboard/security/change-password' },
              ].map(item => (
                <button key={item.label} onClick={() => { setShowDropdown(false); router.push(item.href); }} style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  width: '100%', padding: '8px 12px',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  color: '#cbd5e1', fontSize: '12px', fontWeight: 500,
                  fontFamily: 'inherit', textAlign: 'left',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'white'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#cbd5e1'; }}
                >
                  <span style={{ color: '#93c5fd', opacity: 0.8 }}>{item.icon}</span>
                  {item.label}
                </button>
              ))}

              <div style={{ borderTop: '1px solid #334155' }}>
                <button onClick={() => { setShowDropdown(false); handleSignOut(); }} style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  width: '100%', padding: '8px 12px',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  color: '#f87171', fontSize: '12px', fontWeight: 600,
                  fontFamily: 'inherit', textAlign: 'left',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <IconLogout /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>

        <button onClick={handleSignOut} style={{
          display: 'flex', alignItems: 'center', gap: '5px',
          padding: '5px 10px',
          background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)',
          borderRadius: '7px', color: '#fca5a5',
          fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.22)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; }}
        >
          <IconLogout />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
}
