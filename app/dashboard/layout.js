'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '../../lib/store';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated()) router.replace('/signin');
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f1f5c' }}>
        <div className="text-center">
          <span style={{ fontSize: '32px' }}>⛽</span>
          <p className="text-white mt-2 font-semibold text-sm">Loading PetroStation...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated()) return null;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#f1f5f9' }}>
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(p => !p)} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header onToggleSidebar={() => setSidebarCollapsed(p => !p)} />
        <main className="flex-1 overflow-y-auto" style={{ background: '#f1f5f9' }}>
          <div style={{ padding: '18px 24px' }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
