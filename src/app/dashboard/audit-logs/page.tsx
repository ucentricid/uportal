"use client";

import { useEffect, useState } from 'react';
import {
  Shield,
  Search,
  Loader2,
  Clock,
  Activity,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface AuditLog {
  id: string;
  method: string;
  endpoint: string;
  activity: string;
  actor: string;
  ip_address: string;
  user_agent: string;
  location: string;
  created_at: string;
}

export default function AuditLogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isForbidden, setIsForbidden] = useState(false);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [hasMore, setHasMore] = useState(true);

  const fetchLogs = async (currentPage: number) => {
    setLoading(true);
    try {
      const response = await api.get(`/api/proxy/audit-logs?page=${currentPage}&limit=${limit}`);
      if (response.data.success || response.data.status === 'success') {
        const newLogs = response.data.data;
        setLogs(newLogs);
        setHasMore(newLogs.length === limit);
      }
    } catch (err: any) {
      if (err.response?.status === 403) {
        setIsForbidden(true);
      } else {
        console.error('Failed to fetch audit logs:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(page);
  }, [page]);

  const filteredLogs = (logs || []).filter(log =>
    log.activity?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.actor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.endpoint?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '0.25rem' }}>Audit Logs</h1>
          <p>Review system activities and admin actions.</p>
        </div>
      </div>

      {isForbidden ? (
        <div className="card" style={{ padding: '4rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ padding: '1.5rem', borderRadius: '50%', background: 'rgba(229, 115, 115, 0.1)', color: 'var(--error-color)' }}>
            <Shield size={48} />
          </div>
          <div>
            <h2 style={{ color: 'var(--primary-color)', marginBottom: '0.5rem' }}>Access Denied</h2>
            <p style={{ maxWidth: '400px' }}>You do not have the required permissions to access this page.</p>
          </div>
          <button className="btn-secondary" style={{ width: 'auto' }} onClick={() => router.push('/dashboard')}>
            Back to Dashboard
          </button>
        </div>
      ) : (
        <div className="card" style={{ padding: '0' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ position: 'relative', width: '300px' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search action or details..."
                className="form-input"
                style={{ paddingLeft: '40px', borderRadius: '30px' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button 
                className="btn-secondary" 
                style={{ padding: '0.4rem 0.8rem', width: 'auto' }}
                disabled={page === 1 || loading}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                <ChevronLeft size={16} />
              </button>
              <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>Page {page}</span>
              <button 
                className="btn-secondary" 
                style={{ padding: '0.4rem 0.8rem', width: 'auto' }}
                disabled={!hasMore || loading}
                onClick={() => setPage(p => p + 1)}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', background: '#f8fafc' }}>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem' }}>ACTION</th>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem' }}>TIMESTAMP</th>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem' }}>DETAILS</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={3} style={{ padding: '3rem', textAlign: 'center' }}>
                      <Loader2 className="animate-spin" style={{ margin: 'auto' }} />
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No audit logs found for this page.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} style={{ borderTop: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(43, 58, 85, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-color)' }}>
                            <Activity size={16} />
                          </div>
                          <div>
                            <p style={{ fontWeight: '600', fontSize: '0.9rem', margin: 0 }}>
                              {log.activity}
                            </p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, marginTop: '0.2rem' }}>
                              {log.actor}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          <Clock size={14} />
                          {new Date(log.created_at).toLocaleString()}
                        </div>
                      </td>
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        <span style={{ fontWeight: '500', color: 'var(--primary-color)' }}>{log.method}</span> {log.endpoint}<br/>
                        <span style={{ fontSize: '0.75rem' }}>{log.ip_address} ({log.location})</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
