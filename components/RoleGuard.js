'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getRole, getCompany } from '../lib/store';

/* ── Permission key for each URL prefix ───────────────────────────────────────
   null  = owner-only, never delegatable
   false = always allowed (dashboard home)
   string = permission key in staff.permissions JSONB
────────────────────────────────────────────────────────────────────────────── */
const PATH_PERM = [
  { prefix: '/dashboard/security',  perm: null         }, // owner only
  { prefix: '/dashboard/activity',  perm: null         }, // owner only
  { prefix: '/dashboard/sales/add', perm: 'sales_add'  },
  { prefix: '/dashboard/sales',     perm: 'sales_list' },
  { prefix: '/dashboard/shifts',    perm: 'shifts'     },
  { prefix: '/dashboard/purchase',  perm: 'purchase'   },
  { prefix: '/dashboard/accounts',  perm: 'accounts'   },
  { prefix: '/dashboard/products',  perm: 'products'   },
  { prefix: '/dashboard/vouchers',  perm: 'vouchers'   },
  { prefix: '/dashboard/reports',   perm: 'reports'    },
  { prefix: '/dashboard/staff',     perm: 'staff'      },
  { prefix: '/dashboard',           perm: false        }, // always allowed
];

function getPermKey(pathname) {
  const match = PATH_PERM
    .filter(r => pathname.startsWith(r.prefix))
    .sort((a, b) => b.prefix.length - a.prefix.length)[0];
  return match ? match.perm : null;
}

export default function RoleGuard({ children }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [allowed, setAllowed] = useState(null);

  const checkAccess = () => {
    const role    = getRole();
    const company = getCompany();
    // No role = stale/missing session → force re-login instead of "Access Denied"
    if (!role) { router.replace('/signin'); return; }

    if (role === 'owner') { setAllowed(true); return; }

    const permKey = getPermKey(pathname);

    if (permKey === null)  { setAllowed(false); return; }
    if (permKey === false) { setAllowed(true);  return; }

    const perms = company?.permissions || {};
    const hasAccess = perms[permKey] === true;
    setAllowed(hasAccess);

    // If permission was just revoked and user is on this page → redirect
    if (!hasAccess) router.replace('/dashboard');
  };

  useEffect(() => {
    checkAccess();
  }, [pathname]);

  // Listen for realtime permission updates
  useEffect(() => {
    window.addEventListener('ps-permissions-updated', checkAccess);
    return () => window.removeEventListener('ps-permissions-updated', checkAccess);
  }, [pathname]);

  if (allowed === null) return null;

  if (!allowed) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '60vh', gap: '12px',
      }}>
        <div style={{
          width: '56px', height: '56px', borderRadius: '14px',
          background: '#fef2f2', display: 'flex', alignItems: 'center',
          justifyContent: 'center',
        }}>
          <svg width="24" height="24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <rect x="3" y="11" width="18" height="11" rx="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <h2 style={{ fontWeight: 700, fontSize: '16px', color: '#1E293B', margin: 0 }}>
          Access Denied
        </h2>
        <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
          You don't have permission to view this page.
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          style={{
            marginTop: '8px', padding: '8px 20px', borderRadius: '8px',
            background: '#0D1B3E', color: 'white', border: 'none',
            fontSize: '13px', fontWeight: 600, cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          ← Go to Dashboard
        </button>
      </div>
    );
  }

  return children;
}
