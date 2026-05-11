"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (token && userStr) {
      const user = JSON.parse(userStr);
      if (user.role === 'admin' || user.role === 'superadmin') {
        router.replace('/dashboard');
      } else {
        localStorage.clear();
        router.replace('/login');
      }
    } else {
      router.replace('/login');
    }
  }, [router]);

  return (
    <div style={{ height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-color)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <Loader2 className="animate-spin" size={32} style={{ color: 'var(--primary-color)' }} />
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '500' }}>Initializing uPortal...</p>
      </div>
    </div>
  );
}
