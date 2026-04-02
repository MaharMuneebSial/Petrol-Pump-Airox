'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getCompany, clearSession } from '../../lib/store';
import { supabase } from '../../lib/supabase';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import RoleGuard from '../../components/RoleGuard';

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const didCheck = useRef(false);

  useEffect(() => {
    if (didCheck.current) return;
    didCheck.current = true;

    if (!isAuthenticated()) {
      router.replace('/signin');
      return;
    }

    setMounted(true);

    const company = getCompany();
    const staffId = company?.staffId;

    // Only staff (manager/cashier) need realtime sync — owners have no restrictions
    if (!staffId) return;

    const channel = supabase
      .channel(`staff-perms-${staffId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'staff', filter: `id=eq.${staffId}` },
        (payload) => {
          const updated = payload.new;

          // Staff deactivated → force logout immediately
          if (!updated.is_active) {
            clearSession();
            router.replace('/signin');
            return;
          }

          // Update permissions in localStorage
          const current = getCompany();
          sessionStorage.setItem('ps_company', JSON.stringify({
            ...current,
            permissions: updated.permissions || {},
          }));

          window.dispatchEvent(new Event('ps-permissions-updated'));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f1f5c' }}>
        <div className="text-center">
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '3px solid rgba(255,255,255,0.2)', borderTopColor: '#3B82F6', animation: 'spin 0.7s linear infinite', margin: '0 auto 12px' }} />
          <p className="text-white mt-2 font-semibold text-sm">Loading PetroStation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#f1f5f9' }}>
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(p => !p)} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header onToggleSidebar={() => setSidebarCollapsed(p => !p)} />
        <main className="flex-1 overflow-y-auto" style={{ background: '#f1f5f9' }}>
          <div style={{ padding: '18px 24px' }}>
            <RoleGuard>{children}</RoleGuard>
          </div>
        </main>
      </div>
    </div>
  );
}
