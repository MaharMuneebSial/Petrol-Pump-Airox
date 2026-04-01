'use client';
import { useRouter } from 'next/navigation';
import { getCompany, clearSession } from '../lib/store';
import { useState, useEffect, useRef } from 'react';
// hy   sbdfhb  sd fshdbui hsfdbyi 
const IconMenu   = () => <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="3" y1="8" x2="21" y2="8"/><line x1="3" y1="16" x2="21" y2="16"/></svg>;
const IconFuel   = () => <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M3 22V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"/><path d="M3 11h12"/><path d="M13 6l4 4"/><path d="M17 10v6a2 2 0 0 0 4 0v-4l-2-2"/></svg>;
const IconEdit   = () => <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IconLock   = () => <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
const IconLogout = () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
const IconChevron = () => <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>;
//hy by
export default function Header({ onToggleSidebar }) {
  const router = useRouter();
  const [company, setCompany]         = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => { setCompany(getCompany()); }, []);
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setShowDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSignOut = () => { clearSession(); router.push('/signin'); };
  const initials = company?.businessName
    ? company.businessName.slice(0, 2).toUpperCase()
    : 'PS';

  return (
    <header style={{
      height: '52px', minHeight: '52px',
      background: '#0D1B3E',
      borderBottom: '1px solid rgba(255,255,255,0.07)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 16px',
      position: 'relative', zIndex: 40,
      boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
    }}>

      {/* ── Left ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={onToggleSidebar}
          style={{
            background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px', color: '#7A90AA', cursor: 'pointer',
            padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'white'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#7A90AA'; }}
        >
          <IconMenu />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px', height: '28px',
            background: 'linear-gradient(135deg, #F0A500, #D4920A)',
            borderRadius: '7px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', boxShadow: '0 3px 8px rgba(240,165,0,0.3)',
          }}>
            <IconFuel />
          </div>
          <span className="hidden sm:block" style={{
            color: 'white', fontWeight: 800, fontSize: '13px', letterSpacing: '0.06em',
          }}>
            PETRO<span style={{ color: '#F0A500' }}>STATION</span>
          </span>
        </div>
      </div>

      {/* ── Center — Pump Code ── */}
      {company && (
        <div className="hidden md:flex" style={{
          alignItems: 'center', gap: '7px',
          padding: '5px 14px', borderRadius: '999px',
          background: 'rgba(240,165,0,0.1)',
          border: '1px solid rgba(240,165,0,0.2)',
          position: 'absolute', left: '50%', transform: 'translateX(-50%)',
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#059669', boxShadow: '0 0 5px #059669' }} />
          <span style={{ color: '#F0A500', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', opacity: 0.85 }}>
            PUMP CODE:
          </span>
          <span style={{ color: 'white', fontSize: '11px', fontWeight: 800, letterSpacing: '0.12em' }}>
            {company.pumpCode || 'N/A'}
          </span>
        </div>
      )}

      {/* ── Right ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

        {/* Profile dropdown */}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setShowDropdown(p => !p)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '4px 10px 4px 4px',
              background: showDropdown ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '9px', cursor: 'pointer',
            }}
            onMouseEnter={e => { if (!showDropdown) e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
            onMouseLeave={e => { if (!showDropdown) e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
          >
            <div style={{
              width: '28px', height: '28px', borderRadius: '7px',
              background: 'linear-gradient(135deg, #F0A500, #D4920A)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 800, fontSize: '10px', flexShrink: 0,
              letterSpacing: '0.02em',
            }}>
              {initials}
            </div>
            <div className="hidden sm:block" style={{ textAlign: 'left' }}>
              <div style={{
                color: 'white', fontSize: '11.5px', fontWeight: 600,
                maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                lineHeight: 1.2,
              }}>
                {company?.businessName || 'Admin'}
              </div>
              <div style={{ color: '#475569', fontSize: '9px', marginTop: '1px' }}>Administrator</div>
            </div>
            <span style={{ color: '#475569', marginLeft: '2px' }}><IconChevron /></span>
          </button>

          {showDropdown && (
            <div style={{
              position: 'absolute', right: 0, top: 'calc(100% + 6px)',
              width: '210px',
              background: '#131F35',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              boxShadow: '0 16px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04)',
              overflow: 'hidden', zIndex: 100,
              animation: 'fadeIn 0.15s ease',
            }}>
              {/* Profile info */}
              <div style={{
                padding: '12px 14px',
                borderBottom: '1px solid rgba(255,255,255,0.07)',
                background: 'rgba(240,165,0,0.05)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '34px', height: '34px', borderRadius: '9px',
                    background: 'linear-gradient(135deg, #F0A500, #D4920A)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 800, fontSize: '12px',
                    flexShrink: 0,
                  }}>
                    {initials}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      color: 'white', fontSize: '12px', fontWeight: 600,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {company?.businessName || 'Admin'}
                    </div>
                    <div style={{
                      color: '#56708A', fontSize: '10.5px',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '1px',
                    }}>
                      {company?.email || ''}
                    </div>
                  </div>
                </div>
              </div>

              {/* Menu items */}
              {[
                { label: 'Edit Profile',     icon: <IconEdit />,  href: '/dashboard/security/company-info' },
                { label: 'Change Password',  icon: <IconLock />,  href: '/dashboard/security/change-password' },
              ].map(item => (
                <button
                  key={item.label}
                  onClick={() => { setShowDropdown(false); router.push(item.href); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '9px',
                    width: '100%', padding: '9px 14px',
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    color: '#A8BFCF', fontSize: '12px', fontWeight: 500,
                    fontFamily: 'inherit', textAlign: 'left',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'white'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#A8BFCF'; }}
                >
                  <span style={{ color: '#56708A' }}>{item.icon}</span>
                  {item.label}
                </button>
              ))}

              {/* Sign out */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                <button
                  onClick={() => { setShowDropdown(false); handleSignOut(); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '9px',
                    width: '100%', padding: '9px 14px',
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    color: '#F87171', fontSize: '12px', fontWeight: 600,
                    fontFamily: 'inherit', textAlign: 'left',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220,38,38,0.08)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <IconLogout /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quick sign out button */}
        <button
          onClick={handleSignOut}
          style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            padding: '6px 11px',
            background: 'rgba(220,38,38,0.1)',
            border: '1px solid rgba(220,38,38,0.2)',
            borderRadius: '8px', color: '#FCA5A5',
            fontSize: '11.5px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220,38,38,0.18)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(220,38,38,0.1)'; }}
        >
          <IconLogout />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
}
