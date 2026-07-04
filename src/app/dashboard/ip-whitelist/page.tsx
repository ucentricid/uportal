"use client";

import { useEffect, useState } from 'react';
import {
  Shield,
  Search,
  Loader2,
  CheckCircle,
  XCircle,
  Globe
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface IPData {
  ip_address: string;
  status: string;
}

export default function IPWhitelistPage() {
  const router = useRouter();
  const [ips, setIps] = useState<IPData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isForbidden, setIsForbidden] = useState(false);
  const [processingIp, setProcessingIp] = useState<string | null>(null);

  // Helper to trigger global notification
  const notify = (message: string, type: 'success' | 'error' = 'success') => {
    window.dispatchEvent(new CustomEvent('show-notification', {
      detail: { message, type }
    }));
  };

  const fetchIps = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/proxy/ips');
      if (response.data.status === 'success') {
        setIps(response.data.data);
      }
    } catch (err: any) {
      if (err.response?.status === 403) {
        setIsForbidden(true);
      } else {
        console.error('Failed to fetch IPs:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIps();
  }, []);

  const handleApprove = async (ip: string) => {
    setProcessingIp(ip);
    try {
      const response = await api.put(`/api/proxy/ips/${ip}/approve`);
      if (response.data.status === 'success') {
        notify(`IP ${ip} approved successfully`, 'success');
        setIps(ips.map(item => item.ip_address === ip ? { ...item, status: 'APPROVED' } : item));
      }
    } catch (err: any) {
      notify(err.response?.data?.message || 'Failed to approve IP', 'error');
    } finally {
      setProcessingIp(null);
    }
  };

  const handleBlock = async (ip: string) => {
    setProcessingIp(ip);
    try {
      const response = await api.put(`/api/proxy/ips/${ip}/block`);
      if (response.data.status === 'success') {
        notify(`IP ${ip} blocked successfully`, 'success');
        setIps(ips.map(item => item.ip_address === ip ? { ...item, status: 'BLOCKED' } : item));
      }
    } catch (err: any) {
      notify(err.response?.data?.message || 'Failed to block IP', 'error');
    } finally {
      setProcessingIp(null);
    }
  };

  const filteredIps = (ips || []).filter(item =>
    (item?.ip_address || '').toLowerCase().includes((searchTerm || '').toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '0.25rem' }}>IP Whitelist</h1>
          <p>Manage allowed and blocked IP addresses for backoffice access.</p>
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
                placeholder="Search IP address..."
                className="form-input"
                style={{ paddingLeft: '40px', borderRadius: '30px' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', background: '#f8fafc' }}>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem' }}>IP ADDRESS</th>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem' }}>STATUS</th>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={3} style={{ padding: '3rem', textAlign: 'center' }}>
                      <Loader2 className="animate-spin" style={{ margin: 'auto' }} />
                    </td>
                  </tr>
                ) : filteredIps.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No IP addresses found.
                    </td>
                  </tr>
                ) : (
                  filteredIps.map((item, index) => (
                    <tr key={item?.ip_address || index} style={{ borderTop: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(43, 58, 85, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-color)' }}>
                            <Globe size={16} />
                          </div>
                          <div>
                            <p style={{ fontWeight: '600', fontSize: '0.9rem', margin: 0 }}>{item.ip_address}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '20px',
                          background: item.status === 'APPROVED' ? 'rgba(34, 197, 94, 0.1)' : item.status === 'BLOCKED' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                          color: item.status === 'APPROVED' ? 'var(--success-color)' : item.status === 'BLOCKED' ? 'var(--error-color)' : 'var(--text-muted)'
                        }}>
                          {item.status || 'PENDING'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          {item.status !== 'APPROVED' && (
                            <button 
                              className="btn-primary" 
                              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', width: 'auto', gap: '0.25rem' }} 
                              onClick={() => handleApprove(item.ip_address)}
                              disabled={processingIp === item.ip_address}
                            >
                              {processingIp === item.ip_address ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                              Approve
                            </button>
                          )}
                          {item.status !== 'BLOCKED' && (
                            <button 
                              className="btn-secondary" 
                              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', width: 'auto', gap: '0.25rem', borderColor: 'var(--error-color)', color: 'var(--error-color)' }} 
                              onClick={() => handleBlock(item.ip_address)}
                              disabled={processingIp === item.ip_address}
                            >
                              {processingIp === item.ip_address ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                              Block
                            </button>
                          )}
                        </div>
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
