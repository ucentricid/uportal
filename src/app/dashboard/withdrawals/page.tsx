"use client";

import { useState, useEffect } from 'react';
import { 
  Wallet, 
  Loader2, 
  Search, 
  Eye, 
  X, 
  Shield,
  Building2,
  Store
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

interface WithdrawalRequest {
  id: string;
  token_number: string;
  amount: string;
  status: string; // 'pending' | 'approved' | 'rejected' | 'completed'
  bank_name: string;
  account_number: string;
  account_name: string;
  reason?: string;
  created_at: string;
  updated_at: string;
  merchant_owner_name?: string;
  merchant_name?: string;
}

export default function WithdrawalsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [isForbidden, setIsForbidden] = useState(false);
  
  // For rejection reason
  const [showRejectPrompt, setShowRejectPrompt] = useState<{id: string, isOpen: boolean}>({id: '', isOpen: false});
  const [rejectReason, setRejectReason] = useState('');

  const notify = (message: string, type: 'success' | 'error' = 'success') => {
    window.dispatchEvent(new CustomEvent('show-notification', { 
      detail: { message, type } 
    }));
  };

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/withdrawals?page=1&limit=100');
      if (response.data.success) {
        setRequests(response.data.data || []);
      } else {
        setMockRequests();
      }
    } catch (err: any) {
      if (err.response?.status === 403 || err.response?.status === 401) {
        setIsForbidden(true);
      } else {
        console.error('Failed to fetch data:', err);
        setMockRequests();
      }
    } finally {
      setLoading(false);
    }
  };

  const setMockRequests = () => {
    setRequests([
      {
        id: 'mock-wd-1',
        token_number: '1234-5678-9012-3456',
        amount: '150000.00',
        status: 'pending',
        bank_name: 'BANK BCA',
        account_number: '1234567890',
        account_name: 'John Doe',
        created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        merchant_name: 'Toko John',
        merchant_owner_name: 'John Doe'
      },
      {
        id: 'mock-wd-2',
        token_number: '9876-5432-1098-7654',
        amount: '2000000.00',
        status: 'completed',
        bank_name: 'GOPAY',
        account_number: '081234567890',
        account_name: 'Jane Smith',
        created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
        updated_at: new Date(Date.now() - 3600000 * 24).toISOString(),
        merchant_name: 'Jane Bakery',
        merchant_owner_name: 'Jane Smith'
      }
    ]);
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const u = JSON.parse(storedUser);
        if (u.role !== 'superadmin') {
          setIsForbidden(true);
          setLoading(false);
          return;
        }
      } catch (e) {
        setIsForbidden(true);
        setLoading(false);
        return;
      }
    }
    fetchRequests();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: string, reason: string = '') => {
    if (newStatus === 'rejected' && !reason && !showRejectPrompt.isOpen) {
      setShowRejectPrompt({ id, isOpen: true });
      return;
    }

    setActionLoading(true);
    try {
      const url = `/api/withdrawals/${id}`;
      const payload: any = { status: newStatus };
      if (newStatus === 'rejected') {
        payload.reason = reason;
      }

      const response = await axios.put(url, payload);
      if (response.data.success) {
        notify(`Withdrawal request status updated to ${newStatus}!`, 'success');
        if (selectedRequest && selectedRequest.id === id) {
          setSelectedRequest({ ...selectedRequest, status: newStatus, reason: newStatus === 'rejected' ? reason : selectedRequest.reason });
        }
        setShowRejectPrompt({ id: '', isOpen: false });
        setRejectReason('');
        fetchRequests();
      } else {
        notify(response.data.error || `Failed to update status to ${newStatus}`, 'error');
      }
    } catch (err: any) {
      console.error('Error updating status:', err);
      notify(err.response?.data?.error || `Failed to update status to ${newStatus}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const filteredRequests = requests.filter(req => {
    const matchesSearch = 
      req.token_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.account_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (req.merchant_name && req.merchant_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (req.merchant_owner_name && req.merchant_owner_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      req.account_number.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': 
      case 'completed': return 'var(--success-color)';
      case 'rejected': return 'var(--error-color)';
      default: return '#f59e0b'; // pending -> amber
    }
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', marginBottom: '0.25rem' }}>Withdrawal Requests</h1>
            <p>Manage merchant withdrawal requests and update their transfer status.</p>
          </div>
        </div>

        {isForbidden ? (
          <div className="card" style={{ padding: '4rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ padding: '1.5rem', borderRadius: '50%', background: 'rgba(229, 115, 115, 0.1)', color: 'var(--error-color)' }}>
              <Shield size={48} />
            </div>
            <div>
              <h2 style={{ color: 'var(--primary-color)', marginBottom: '0.5rem' }}>Access Denied</h2>
              <p style={{ maxWidth: '400px' }}>You do not have the required permissions to access this page. Only Superadmin users can manage withdrawals.</p>
            </div>
            <button className="btn-secondary" style={{ width: 'auto' }} onClick={() => router.push('/dashboard')}>
              Back to Dashboard
            </button>
          </div>
        ) : (
          <div className="card" style={{ padding: '0' }}>
            {/* Filter and Search Bar */}
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ position: 'relative', width: '300px' }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  placeholder="Search withdrawals..." 
                  className="form-input" 
                  style={{ paddingLeft: '40px', borderRadius: '30px' }}
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '500' }}>Status:</span>
                <select 
                  className="form-input" 
                  style={{ padding: '0.5rem 2rem 0.5rem 1rem', borderRadius: '20px', fontSize: '0.875rem' }}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="completed">Completed</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', background: '#f8fafc' }}>
                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem' }}>MERCHANT</th>
                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem' }}>BANK / EWALLET</th>
                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem' }}>AMOUNT</th>
                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem' }}>DATE</th>
                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem' }}>STATUS</th>
                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textAlign: 'right' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '3rem', textAlign: 'center' }}>
                        <Loader2 className="animate-spin" style={{ margin: 'auto' }} />
                      </td>
                    </tr>
                  ) : filteredRequests.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No withdrawal requests found.
                      </td>
                    </tr>
                  ) : (
                    filteredRequests.map((req) => (
                      <tr key={req.id} style={{ borderTop: '1px solid var(--border-color)', transition: 'background-color 0.2s' }}>
                        <td style={{ padding: '1rem 1.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(43, 58, 85, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-color)' }}>
                              <Store size={16} />
                            </div>
                            <div>
                              <p style={{ fontWeight: '600', fontSize: '0.9rem', margin: 0 }}>{req.merchant_name || 'Unknown'}</p>
                              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, fontFamily: 'monospace' }}>{req.token_number}</p>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '1rem 1.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Building2 size={16} style={{ color: 'var(--primary-color)' }} />
                            <div>
                              <span style={{ fontSize: '0.9rem', fontWeight: '600', display: 'block' }}>{req.bank_name}</span>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{req.account_name} ({req.account_number})</span>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem', fontWeight: '600', color: 'var(--primary-color)' }}>
                          {formatCurrency(req.amount)}
                        </td>
                        <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem' }}>
                          {new Date(req.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </td>
                        <td style={{ padding: '1rem 1.5rem' }}>
                          <select
                            value={req.status}
                            disabled={actionLoading || req.status === 'rejected'}
                            onChange={(e) => handleUpdateStatus(req.id, e.target.value)}
                            style={{
                              fontSize: '0.75rem', 
                              fontWeight: '600', 
                              padding: '0.2rem 1.5rem 0.2rem 0.6rem', 
                              borderRadius: '20px', 
                              background: (req.status === 'approved' || req.status === 'completed') ? 'rgba(129, 199, 132, 0.15)' : req.status === 'rejected' ? 'rgba(229, 115, 115, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                              color: getStatusColor(req.status),
                              border: 'none',
                              cursor: (actionLoading || req.status === 'rejected') ? 'not-allowed' : 'pointer',
                              opacity: req.status === 'rejected' ? 0.8 : 1,
                              outline: 'none',
                              appearance: 'none',
                              backgroundImage: req.status === 'rejected' ? 'none' : `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='${encodeURIComponent(getStatusColor(req.status))}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                              backgroundRepeat: 'no-repeat',
                              backgroundPosition: 'right 8px center',
                              backgroundSize: '12px',
                            }}
                          >
                            <option value="pending" style={{ color: '#0f172a', background: '#fff' }}>PENDING</option>
                            <option value="approved" style={{ color: '#0f172a', background: '#fff' }}>APPROVED</option>
                            <option value="completed" style={{ color: '#0f172a', background: '#fff' }}>COMPLETED</option>
                            <option value="rejected" style={{ color: '#0f172a', background: '#fff' }}>REJECTED</option>
                          </select>
                        </td>
                        <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button 
                              className="nav-item" 
                              style={{ padding: '0.4rem', color: 'var(--primary-color)' }} 
                              onClick={() => {
                                setSelectedRequest(req);
                                setShowDetailModal(true);
                              }}
                              title="Inspect Details"
                            >
                              <Eye size={16} />
                            </button>
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

      {/* Reject Reason Modal */}
      {showRejectPrompt.isOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem' }}>
            <h2 style={{ marginBottom: '1rem', color: 'var(--error-color)' }}>Reject Withdrawal</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>Please provide a reason for rejecting this withdrawal request. This reason will be visible to the merchant.</p>
            <textarea 
              className="form-input" 
              style={{ width: '100%', height: '100px', marginBottom: '1.5rem', resize: 'none' }}
              placeholder="e.g., Invalid account number..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            ></textarea>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                className="btn-secondary" 
                style={{ flex: 1 }} 
                onClick={() => {
                  setShowRejectPrompt({ id: '', isOpen: false });
                  setRejectReason('');
                  // Reset select if cancelled by re-fetching
                  fetchRequests(); 
                }}
              >Cancel</button>
              <button 
                className="btn-primary" 
                style={{ flex: 1, backgroundColor: 'var(--error-color)', borderColor: 'var(--error-color)' }} 
                onClick={() => handleUpdateStatus(showRejectPrompt.id, 'rejected', rejectReason)}
                disabled={actionLoading || !rejectReason.trim()}
              >
                {actionLoading ? <Loader2 className="animate-spin" size={18} style={{ margin: 'auto' }} /> : 'Reject Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedRequest && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', position: 'relative', padding: 0, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', overflow: 'hidden', borderRadius: '16px' }}>
            
            {/* Header */}
            <div style={{ padding: '2rem 2.5rem', borderBottom: '1px solid var(--border-color)', background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)' }}>
              <button 
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedRequest(null);
                }} 
                style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'white', border: '1px solid var(--border-color)', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)', transition: 'all 0.2s' }}
              >
                <X size={18} />
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--primary-color), #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                  <Wallet size={24} />
                </div>
                <div>
                  <h2 style={{ marginBottom: 0, fontSize: '1.5rem' }}>{selectedRequest.merchant_name || 'Withdrawal Request'}</h2>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>ID: {selectedRequest.id}</p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div style={{ padding: '2rem 2.5rem', overflow: 'auto', maxHeight: 'calc(90vh - 120px)', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem' }}>
                <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.35rem', fontWeight: '600' }}>AMOUNT</p>
                  <p style={{ fontSize: '1.25rem', margin: 0, fontWeight: '700', color: 'var(--primary-color)' }}>
                    {formatCurrency(selectedRequest.amount)}
                  </p>
                </div>
                <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.35rem', fontWeight: '600' }}>STATUS</p>
                  <select
                    value={selectedRequest.status}
                    disabled={actionLoading || selectedRequest.status === 'rejected'}
                    onChange={(e) => handleUpdateStatus(selectedRequest.id, e.target.value)}
                    style={{
                      fontSize: '0.8rem', 
                      fontWeight: '600', 
                      padding: '0.2rem 1.5rem 0.2rem 0.6rem', 
                      borderRadius: '20px', 
                      background: (selectedRequest.status === 'approved' || selectedRequest.status === 'completed') ? 'rgba(129, 199, 132, 0.15)' : selectedRequest.status === 'rejected' ? 'rgba(229, 115, 115, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      color: getStatusColor(selectedRequest.status),
                      border: 'none',
                      cursor: (actionLoading || selectedRequest.status === 'rejected') ? 'not-allowed' : 'pointer',
                      opacity: selectedRequest.status === 'rejected' ? 0.8 : 1,
                      outline: 'none',
                      appearance: 'none',
                      backgroundImage: selectedRequest.status === 'rejected' ? 'none' : `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='${encodeURIComponent(getStatusColor(selectedRequest.status))}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 8px center',
                      backgroundSize: '12px',
                    }}
                  >
                    <option value="pending" style={{ color: '#0f172a', background: '#fff' }}>PENDING</option>
                    <option value="approved" style={{ color: '#0f172a', background: '#fff' }}>APPROVED</option>
                    <option value="completed" style={{ color: '#0f172a', background: '#fff' }}>COMPLETED</option>
                    <option value="rejected" style={{ color: '#0f172a', background: '#fff' }}>REJECTED</option>
                  </select>
                </div>
                
                <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.35rem', fontWeight: '600' }}>MERCHANT TOKEN</p>
                  <p style={{ fontSize: '0.95rem', margin: 0, fontWeight: '600', color: '#0f172a', fontFamily: 'monospace' }}>{selectedRequest.token_number}</p>
                </div>
                <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.35rem', fontWeight: '600' }}>OWNER</p>
                  <p style={{ fontSize: '0.95rem', margin: 0, fontWeight: '500', color: '#0f172a' }}>{selectedRequest.merchant_owner_name || selectedRequest.account_name}</p>
                </div>
                
                <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', gridColumn: '1 / -1' }}>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.75rem', fontWeight: '600' }}>TRANSFER DESTINATION</p>
                  <div style={{ display: 'flex', gap: '2rem' }}>
                    <div>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '0 0 0.25rem 0' }}>Bank / E-Wallet</p>
                      <p style={{ margin: 0, fontWeight: '600' }}>{selectedRequest.bank_name}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '0 0 0.25rem 0' }}>Account Name</p>
                      <p style={{ margin: 0, fontWeight: '600' }}>{selectedRequest.account_name}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '0 0 0.25rem 0' }}>Account Number</p>
                      <p style={{ margin: 0, fontWeight: '600', fontFamily: 'monospace' }}>{selectedRequest.account_number}</p>
                    </div>
                  </div>
                </div>

                {selectedRequest.reason && (
                  <div style={{ padding: '1rem', background: 'rgba(229, 115, 115, 0.05)', borderRadius: '10px', border: '1px solid rgba(229, 115, 115, 0.2)', gridColumn: '1 / -1' }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--error-color)', marginBottom: '0.35rem', fontWeight: '600' }}>REJECTION REASON</p>
                    <p style={{ fontSize: '0.95rem', margin: 0, color: '#0f172a' }}>{selectedRequest.reason}</p>
                  </div>
                )}
                
                <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.35rem', fontWeight: '600' }}>CREATED AT</p>
                  <p style={{ fontSize: '0.95rem', margin: 0, color: '#0f172a' }}>
                    {new Date(selectedRequest.created_at).toLocaleString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.35rem', fontWeight: '600' }}>LAST UPDATED</p>
                  <p style={{ fontSize: '0.95rem', margin: 0, color: '#0f172a' }}>
                    {new Date(selectedRequest.updated_at).toLocaleString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

              </div>

              {/* Quick Actions if Pending */}
              {selectedRequest.status === 'pending' && (
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', padding: '1rem 0 0', borderTop: '1px solid var(--border-color)', justifyContent: 'flex-end' }}>
                  <button 
                    className="btn-secondary" 
                    style={{ width: 'auto', borderColor: 'var(--error-color)', color: 'var(--error-color)' }}
                    onClick={() => handleUpdateStatus(selectedRequest.id, 'rejected')}
                    disabled={actionLoading}
                  >
                    Reject Withdrawal
                  </button>
                  <button 
                    className="btn-primary" 
                    style={{ width: 'auto', backgroundColor: '#3b82f6', borderColor: '#3b82f6' }}
                    onClick={() => handleUpdateStatus(selectedRequest.id, 'approved')}
                    disabled={actionLoading}
                  >
                    Approve Request
                  </button>
                  <button 
                    className="btn-primary" 
                    style={{ width: 'auto', backgroundColor: 'var(--success-color)', borderColor: 'var(--success-color)' }}
                    onClick={() => handleUpdateStatus(selectedRequest.id, 'completed')}
                    disabled={actionLoading}
                  >
                    Mark as Completed
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
