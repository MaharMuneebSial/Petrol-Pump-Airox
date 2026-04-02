'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { clearSession } from '../../lib/store';

export default function SignOutPage() {
  const router = useRouter();

  useEffect(() => {
    clearSession();
    router.replace('/signin');
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f1f5c' }}>
      <p style={{ color: 'white', fontSize: '14px' }}>Signing out...</p>
    </div>
  );
}
