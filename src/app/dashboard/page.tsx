"use client";

import { useState, useEffect } from 'react';
import { 
  Users, 
  UserCheck, 
  ShieldCheck, 
  TrendingUp,
  Activity,
  ArrowUpRight
} from 'lucide-react';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  if (!user) return null;

  const stats = [
    { title: 'Total Users', value: '1,284', icon: <Users size={24} />, trend: '+12%', color: '#4f46e5' },
    { title: 'Active Users', value: '842', icon: <UserCheck size={24} />, trend: '+5%', color: '#10b981' },
    { title: 'New Signs', value: '32', icon: <Activity size={24} />, trend: '+18%', color: '#f59e0b' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '0.25rem' }}>Welcome back, {user.name.split(' ')[0]}!</h1>
        <p>Here's what's happening with your portal today.</p>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
        {stats.map((stat, index) => (
          <div key={index} className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div style={{ color: stat.color, background: `${stat.color}15`, padding: '0.75rem', borderRadius: '12px' }}>
                {stat.icon}
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '0.25rem 0.5rem', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                {stat.trend} <ArrowUpRight size={12} />
              </span>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{stat.title}</p>
            <h3 style={{ fontSize: '1.8rem', fontWeight: '700', margin: 0 }}>{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        <div className="card" style={{ minHeight: '300px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem' }}>Recent Activity</h3>
            <button style={{ fontSize: '0.8rem', color: 'var(--primary-color)', background: 'none', border: 'none', fontWeight: '600', cursor: 'pointer' }}>View All</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ display: 'flex', gap: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingUp size={20} style={{ color: 'var(--primary-color)' }} />
                </div>
                <div>
                  <p style={{ fontSize: '0.9rem', fontWeight: '600', margin: 0 }}>New user registered</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>2 minutes ago</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ minHeight: '300px' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>Quick Actions</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ padding: '1.5rem', borderRadius: '16px', background: 'var(--primary-color)', color: 'white', cursor: 'pointer' }}>
              <ShieldCheck size={24} style={{ marginBottom: '0.75rem' }} />
              <p style={{ fontWeight: '600', fontSize: '0.9rem' }}>Security Audit</p>
            </div>
            <div style={{ padding: '1.5rem', borderRadius: '16px', background: '#f0f2f5', cursor: 'pointer' }}>
              <Users size={24} style={{ marginBottom: '0.75rem', color: 'var(--primary-color)' }} />
              <p style={{ fontWeight: '600', fontSize: '0.9rem' }}>User Reports</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
