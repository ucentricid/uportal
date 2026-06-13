"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Store,
  QrCode,
  CreditCard,
  Package,
  Megaphone,
  Settings, 
  LogOut, 
  Bell, 
  Search,
  Menu,
  X,
  User as UserIcon,
  Loader2,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  Wallet,
  Scale
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  useEffect(() => {
    if (user) {
      setIsLoading(false);
      return;
    }

    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (!storedToken || !storedUser) {
      router.replace('/login');
    } else {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.role !== 'admin' && parsedUser.role !== 'superadmin') {
          localStorage.clear();
          router.replace('/login');
        } else {
          setUser(parsedUser);
        }
      } catch (e) {
        localStorage.clear();
        router.replace('/login');
      }
    }
    setIsLoading(false);
  }, [router, user]);

  // Separate useEffect for notifications to ensure it's always registered
  useEffect(() => {
    const handleNotify = (e: any) => {
      setNotification({ message: e.detail.message, type: e.detail.type });
      setTimeout(() => setNotification(null), 4000);
    };

    window.addEventListener('show-notification', handleNotify);
    return () => window.removeEventListener('show-notification', handleNotify);
  }, []);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await api.post('/api/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.clear();
      router.push('/login');
    }
  };

  if (isLoading || !user) {
    return (
      <div style={{ height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-color)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <Loader2 className="animate-spin" size={32} style={{ color: 'var(--primary-color)' }} />
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '500' }}>uPortal is loading...</p>
        </div>
      </div>
    );
  }

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Users', href: '/dashboard/users', icon: <Users size={20} />, adminOnly: true },
    { name: 'Merchants', href: '/dashboard/merchants', icon: <Store size={20} />, adminOnly: true },
    { name: 'QRIS Activations', href: '/dashboard/qris-activations', icon: <QrCode size={20} />, superadminOnly: true },
    { name: 'Transactions', href: '/dashboard/transactions', icon: <CreditCard size={20} />, superadminOnly: true },
    { name: 'Withdrawal Requests', href: '/dashboard/withdrawals', icon: <Wallet size={20} />, superadminOnly: true },
    { name: 'Products', href: '/dashboard/products', icon: <Package size={20} />, adminOnly: true },
    { name: 'Blast Notif', href: '/dashboard/blast-notif', icon: <Megaphone size={20} />, adminOnly: true },
    { name: 'Settings', href: '/dashboard/settings', icon: <Settings size={20} /> },
  ].filter(item => {
    if (item.superadminOnly) return user?.role === 'superadmin';
    if (item.adminOnly) return user?.role === 'admin' || user?.role === 'superadmin';
    return true;
  });

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? '' : 'sidebar-closed'}`} style={{ width: isSidebarOpen ? '280px' : '80px', transition: 'width 0.3s ease' }}>
        <div className="sidebar-logo">
          {isSidebarOpen ? (
            <>
              <div style={{ background: 'var(--primary-color)', color: 'white', padding: '5px', borderRadius: '8px' }}>uP</div>
              <span>uPortal</span>
            </>
          ) : (
            <div style={{ background: 'var(--primary-color)', color: 'white', padding: '5px', borderRadius: '8px' }}>uP</div>
          )}
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link 
              key={item.name} 
              href={item.href}
              className={`nav-item ${pathname === item.href ? 'active' : ''}`}
              title={item.name}
            >
              {item.icon}
              {isSidebarOpen && <span>{item.name}</span>}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button onClick={() => setShowLogoutConfirm(true)} className="nav-item logout-btn">
            <LogOut size={20} />
            {isSidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content" style={{ marginLeft: isSidebarOpen ? '280px' : '80px', transition: 'margin-left 0.3s ease' }}>
        <header className="header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="nav-item" style={{ padding: '0.5rem' }}>
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="Search..." 
                className="form-input" 
                style={{ paddingLeft: '40px', width: '300px', borderRadius: '30px', background: '#f0f2f5', border: 'none' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <button className="nav-item" style={{ padding: '0.5rem', position: 'relative' }}>
              <Bell size={20} />
              <span style={{ position: 'absolute', top: '8px', right: '8px', width: '8px', height: '8px', background: 'var(--error-color)', borderRadius: '50%' }}></span>
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 1rem', borderRadius: '30px', background: '#f0f2f5' }}>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--primary-color)', margin: 0 }}>{user.name}</p>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>{user.role || 'Administrator'}</p>
              </div>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--accent-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                 <UserIcon size={20} style={{ margin: 'auto' }} />
              </div>
            </div>
          </div>
        </header>

        <section className="page-content">
          {children}
        </section>
      </main>
      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px', textAlign: 'center', padding: '2.5rem' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(43, 58, 85, 0.1)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <AlertTriangle size={32} />
            </div>
            <h2 style={{ marginBottom: '0.5rem' }}>Ready to Leave?</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Are you sure you want to log out of your account?</p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowLogoutConfirm(false)}>Stay Here</button>
              <button className="btn-primary" style={{ flex: 1 }} onClick={handleLogout}>
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Global Notification Toast */}
      {notification && (
        <div className="animate-fade-in" style={{ 
          position: 'fixed', 
          top: '2rem', 
          right: '2rem', 
          zIndex: 10001,
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '1rem 1.5rem',
          borderRadius: '12px',
          background: 'white',
          boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
          borderLeft: `4px solid ${notification.type === 'success' ? 'var(--success-color)' : 'var(--error-color)'}`
        }}>
          {notification.type === 'success' ? (
            <CheckCircle size={20} style={{ color: 'var(--success-color)' }} />
          ) : (
            <AlertCircle size={20} style={{ color: 'var(--error-color)' }} />
          )}
          <p style={{ margin: 0, fontWeight: '600', fontSize: '0.9rem', color: 'var(--primary-color)' }}>{notification.message}</p>
          <button onClick={() => setNotification(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', marginLeft: '0.5rem', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
