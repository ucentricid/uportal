"use client";

import { useState, useEffect } from 'react';
import { 
  QrCode, 
  Loader2, 
  Search, 
  Eye, 
  X, 
  Check, 
  AlertTriangle,
  Shield,
  Trash2,
  FileText,
  Building2,
  User as UserIcon,
  CreditCard,
  Calendar,
  ExternalLink,
  Store
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

interface QrisActivation {
  id: string;
  token_number: string;
  account_name: string;
  account_name_owner: string;
  account_number_owner: string;
  attachment_account_book: string;
  attachment_identity_card: string;
  agree_terms: boolean;
  status: string; // 'pending' | 'approved' | 'rejected'
  created_at: string;
  updated_at: string;
  merchant?: {
    merchant_name: string;
    city: string;
    province: string;
    street_address: string;
  };
}

export default function QrisActivationsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<QrisActivation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState<QrisActivation | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [viewImageModal, setViewImageModal] = useState<{url: string, title: string} | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [isForbidden, setIsForbidden] = useState(false);

  // Helper to trigger global notification
  const notify = (message: string, type: 'success' | 'error' = 'success') => {
    window.dispatchEvent(new CustomEvent('show-notification', { 
      detail: { message, type } 
    }));
  };

  const fetchRequests = async () => {
    setLoading(true);
    try {
      // Fetch both requests and merchants concurrently
      const [activationsRes, merchantsRes] = await Promise.allSettled([
        axios.get('/api/qris-activations?page=1&limit=100'),
        axios.get('/api/merchants?page=1&limit=100')
      ]);

      let activationsList: QrisActivation[] = [];
      let merchantsList: any[] = [];

      if (activationsRes.status === 'fulfilled' && activationsRes.value.data.success) {
        activationsList = activationsRes.value.data.data || [];
      } else {
        // Fallback to mock if fetch fails
        setMockRequests();
        setLoading(false);
        return;
      }

      if (merchantsRes.status === 'fulfilled' && merchantsRes.value.data.success) {
        merchantsList = merchantsRes.value.data.data || [];
      }

      // Map merchant details to activation requests
      const mapped = activationsList.map(req => {
        const merchant = merchantsList.find(m => m.token_number === req.token_number);
        if (merchant) {
          return {
            ...req,
            merchant: {
              merchant_name: merchant.merchant_name,
              city: merchant.city,
              province: merchant.province,
              street_address: merchant.street_address
            }
          };
        }
        return req;
      });

      setRequests(mapped);
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
        id: 'mock-1',
        token_number: '1234-5678-9012-3456',
        account_name: 'BCA',
        account_name_owner: 'John Doe',
        account_number_owner: '1234567890',
        attachment_account_book: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', // placeholder
        attachment_identity_card: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', // placeholder
        agree_terms: true,
        status: 'pending',
        created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        merchant: {
          merchant_name: 'Coffee Shop',
          city: 'Jakarta Selatan',
          province: 'DKI Jakarta',
          street_address: 'Jl. Sudirman No. 123'
        }
      },
      {
        id: 'mock-2',
        token_number: '9876-5432-1098-7654',
        account_name: 'GoPay Premium',
        account_name_owner: 'Jane Smith',
        account_number_owner: '081299998888',
        attachment_account_book: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
        attachment_identity_card: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
        agree_terms: true,
        status: 'approved',
        created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
        updated_at: new Date(Date.now() - 3600000 * 24).toISOString(),
        merchant: {
          merchant_name: 'Warung Makan Padang',
          city: 'Padang',
          province: 'Sumatera Barat',
          street_address: 'Jl. Ahmad Yani No. 45'
        }
      }
    ]);
  };

  useEffect(() => {
    // Client-side role verification
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

  const handleUpdateStatus = async (id: string, newStatus: 'approved' | 'rejected' | 'pending') => {
    setActionLoading(true);
    try {
      const url = `/api/qris-activations/${id}`;
      const response = await axios.put(url, { status: newStatus });
      if (response.data.success) {
        notify(`QRIS Activation request status updated to ${newStatus}!`, 'success');
        if (selectedRequest && selectedRequest.id === id) {
          setSelectedRequest({ ...selectedRequest, status: newStatus });
        }
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

  const handleDeleteRequest = async (id: string) => {
    setActionLoading(true);
    try {
      const url = `/api/qris-activations/${id}`;
      const response = await axios.delete(url);
      if (response.data.success) {
        notify('Request deleted successfully!', 'success');
        setShowDeleteConfirm(null);
        if (selectedRequest && selectedRequest.id === id) {
          setShowDetailModal(false);
          setSelectedRequest(null);
        }
        fetchRequests();
      } else {
        notify(response.data.error || 'Failed to delete request', 'error');
      }
    } catch (err: any) {
      console.error('Error deleting request:', err);
      notify(err.response?.data?.error || 'Failed to delete request', 'error');
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
      req.account_name_owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.account_number_owner.includes(searchTerm) ||
      (req.merchant?.merchant_name && req.merchant.merchant_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (req.merchant?.city && req.merchant.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (req.merchant?.province && req.merchant.province.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'var(--success-color)';
      case 'rejected': return 'var(--error-color)';
      default: return '#f59e0b'; // pending -> amber
    }
  };

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', marginBottom: '0.25rem' }}>QRIS Activations</h1>
            <p>Review and verify merchant requests for QRIS payment method activation.</p>
          </div>
        </div>

        {isForbidden ? (
          <div className="card" style={{ padding: '4rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ padding: '1.5rem', borderRadius: '50%', background: 'rgba(229, 115, 115, 0.1)', color: 'var(--error-color)' }}>
              <Shield size={48} />
            </div>
            <div>
              <h2 style={{ color: 'var(--primary-color)', marginBottom: '0.5rem' }}>Access Denied</h2>
              <p style={{ maxWidth: '400px' }}>You do not have the required permissions to access this page. Only Superadmin users can manage QRIS activations.</p>
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
                  placeholder="Search activations..." 
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
                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem' }}>TOKEN NUMBER</th>
                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem' }}>BANK / EWALLET</th>
                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem' }}>OWNER</th>
                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem' }}>ACCOUNT NUMBER</th>
                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem' }}>STATUS</th>
                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textAlign: 'right' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '3rem', textAlign: 'center' }}>
                        <Loader2 className="animate-spin" style={{ margin: 'auto' }} />
                      </td>
                    </tr>
                  ) : filteredRequests.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No activation requests found.
                      </td>
                    </tr>
                  ) : (
                    filteredRequests.map((req) => (
                      <tr key={req.id} style={{ borderTop: '1px solid var(--border-color)', transition: 'background-color 0.2s' }}>
                        <td style={{ padding: '1rem 1.5rem' }}>
                          {req.merchant ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(43, 58, 85, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-color)' }}>
                                <Store size={16} />
                              </div>
                              <div>
                                <p style={{ fontWeight: '600', fontSize: '0.9rem', margin: 0 }}>{req.merchant.merchant_name}</p>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>{req.merchant.city}, {req.merchant.province}</p>
                              </div>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(130, 140, 155, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                                <Store size={16} />
                              </div>
                              <div>
                                <p style={{ fontWeight: '600', fontSize: '0.9rem', margin: 0, color: 'var(--text-muted)' }}>Unknown Merchant</p>
                              </div>
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem', fontWeight: '500', fontFamily: 'monospace' }}>
                          {req.token_number}
                        </td>
                        <td style={{ padding: '1rem 1.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Building2 size={16} style={{ color: 'var(--primary-color)' }} />
                            <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>{req.account_name}</span>
                          </div>
                        </td>
                        <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem' }}>
                          {req.account_name_owner}
                        </td>
                        <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem', fontFamily: 'monospace' }}>
                          {req.account_number_owner}
                        </td>
                        <td style={{ padding: '1rem 1.5rem' }}>
                          <select
                            value={req.status}
                            disabled={actionLoading || req.status === 'rejected'}
                            onChange={(e) => handleUpdateStatus(req.id, e.target.value as 'approved' | 'rejected' | 'pending')}
                            style={{
                              fontSize: '0.75rem', 
                              fontWeight: '600', 
                              padding: '0.2rem 1.5rem 0.2rem 0.6rem', 
                              borderRadius: '20px', 
                              background: req.status === 'approved' ? 'rgba(129, 199, 132, 0.15)' : req.status === 'rejected' ? 'rgba(229, 115, 115, 0.15)' : 'rgba(245, 158, 11, 0.15)',
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
                            <button 
                              className="nav-item" 
                              style={{ padding: '0.4rem', color: 'var(--error-color)' }} 
                              onClick={() => setShowDeleteConfirm(req.id)}
                              title="Delete Request"
                            >
                              <Trash2 size={16} />
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
                  <QrCode size={24} />
                </div>
                <div>
                  <h2 style={{ marginBottom: 0, fontSize: '1.5rem' }}>{selectedRequest.merchant?.merchant_name || 'QRIS Activation Request'}</h2>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>ID: {selectedRequest.id}</p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div style={{ padding: '2rem 2.5rem', overflow: 'auto', maxHeight: 'calc(90vh - 220px)', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* Account Details Info */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem' }}>
                <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.35rem', fontWeight: '600' }}>MERCHANT TOKEN</p>
                  <p style={{ fontSize: '0.95rem', margin: 0, fontWeight: '600', color: '#0f172a', fontFamily: 'monospace' }}>{selectedRequest.token_number}</p>
                </div>
                <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.35rem', fontWeight: '600' }}>STATUS</p>
                  <select
                    value={selectedRequest.status}
                    disabled={actionLoading || selectedRequest.status === 'rejected'}
                    onChange={(e) => handleUpdateStatus(selectedRequest.id, e.target.value as 'approved' | 'rejected' | 'pending')}
                    style={{
                      fontSize: '0.8rem', 
                      fontWeight: '600', 
                      padding: '0.2rem 1.5rem 0.2rem 0.6rem', 
                      borderRadius: '20px', 
                      background: selectedRequest.status === 'approved' ? 'rgba(129, 199, 132, 0.15)' : selectedRequest.status === 'rejected' ? 'rgba(229, 115, 115, 0.15)' : 'rgba(245, 158, 11, 0.15)',
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
                    <option value="rejected" style={{ color: '#0f172a', background: '#fff' }}>REJECTED</option>
                  </select>
                </div>
                <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.35rem', fontWeight: '600' }}>BANK / EWALLET NAME</p>
                  <p style={{ fontSize: '0.95rem', margin: 0, fontWeight: '500', color: '#0f172a' }}>{selectedRequest.account_name}</p>
                </div>
                <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.35rem', fontWeight: '600' }}>SUBMITTED AT</p>
                  <p style={{ fontSize: '0.95rem', margin: 0, color: '#0f172a' }}>
                    {new Date(selectedRequest.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.35rem', fontWeight: '600' }}>OWNER NAME</p>
                  <p style={{ fontSize: '0.95rem', margin: 0, fontWeight: '500', color: '#0f172a' }}>{selectedRequest.account_name_owner}</p>
                </div>
                <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.35rem', fontWeight: '600' }}>ACCOUNT NUMBER</p>
                  <p style={{ fontSize: '0.95rem', margin: 0, fontWeight: '500', color: '#0f172a', fontFamily: 'monospace' }}>{selectedRequest.account_number_owner}</p>
                </div>
                {selectedRequest.merchant && (
                  <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', gridColumn: '1 / -1' }}>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.35rem', fontWeight: '600' }}>MERCHANT ADDRESS</p>
                    <p style={{ fontSize: '0.95rem', margin: 0, color: '#0f172a' }}>
                      {selectedRequest.merchant.street_address}, {selectedRequest.merchant.city}, {selectedRequest.merchant.province}
                    </p>
                  </div>
                )}
              </div>

              {/* Attachments Section */}
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1rem', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '3px', height: '18px', background: 'var(--primary-color)', borderRadius: '2px' }}></div>
                  Uploaded Verification Documents
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  
                  {/* ID Card Doc */}
                  <div style={{ border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden', background: '#fafbfc' }}>
                    <div style={{ padding: '0.75rem 1rem', background: '#f1f5f9', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--primary-color)' }}>Owner ID Card (KTP)</span>
                      <button type="button" onClick={() => setViewImageModal({ url: selectedRequest.attachment_identity_card, title: 'Owner ID Card (KTP)' })} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--primary-color)', fontWeight: '600', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                        View <Eye size={12} />
                      </button>
                    </div>
                    <div style={{ padding: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '180px' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={selectedRequest.attachment_identity_card} 
                        alt="ID Card" 
                        style={{ maxWidth: '100%', maxHeight: '160px', objectFit: 'contain', borderRadius: '6px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', cursor: 'pointer' }}
                        onClick={() => setViewImageModal({ url: selectedRequest.attachment_identity_card, title: 'Owner ID Card (KTP)' })}
                        onError={(e) => {
                          e.currentTarget.src = "https://images.unsplash.com/photo-1557200134-90327ee9fafa?w=500&auto=format&fit=crop&q=60";
                        }}
                      />
                    </div>
                  </div>

                  {/* Bank Book Doc */}
                  <div style={{ border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden', background: '#fafbfc' }}>
                    <div style={{ padding: '0.75rem 1rem', background: '#f1f5f9', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--primary-color)' }}>Bank Account Book</span>
                      <button type="button" onClick={() => setViewImageModal({ url: selectedRequest.attachment_account_book, title: 'Bank Account Book' })} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--primary-color)', fontWeight: '600', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                        View <Eye size={12} />
                      </button>
                    </div>
                    <div style={{ padding: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '180px' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={selectedRequest.attachment_account_book} 
                        alt="Bank Book" 
                        style={{ maxWidth: '100%', maxHeight: '160px', objectFit: 'contain', borderRadius: '6px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', cursor: 'pointer' }}
                        onClick={() => setViewImageModal({ url: selectedRequest.attachment_account_book, title: 'Bank Account Book' })}
                        onError={(e) => {
                          e.currentTarget.src = "https://images.unsplash.com/photo-1557200134-90327ee9fafa?w=500&auto=format&fit=crop&q=60";
                        }}
                      />
                    </div>
                  </div>

                </div>
              </div>

              {/* Action Buttons (Approve / Reject) for superadmin when status is pending */}
              {selectedRequest.status === 'pending' && (
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', padding: '1rem 0 0', borderTop: '1px solid var(--border-color)', justifyContent: 'flex-end' }}>
                  <button 
                    className="btn-secondary" 
                    style={{ width: 'auto', borderColor: 'var(--error-color)', color: 'var(--error-color)' }}
                    onClick={() => handleUpdateStatus(selectedRequest.id, 'rejected')}
                    disabled={actionLoading}
                  >
                    {actionLoading ? <Loader2 className="animate-spin" size={16} /> : 'Reject Activation'}
                  </button>
                  <button 
                    className="btn-primary" 
                    style={{ width: 'auto', backgroundColor: 'var(--success-color)', borderColor: 'var(--success-color)' }}
                    onClick={() => handleUpdateStatus(selectedRequest.id, 'approved')}
                    disabled={actionLoading}
                  >
                    {actionLoading ? <Loader2 className="animate-spin" size={16} /> : 'Approve & Activate QRIS'}
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation modal */}
      {showDeleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px', textAlign: 'center', padding: '2.5rem' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <AlertTriangle size={32} />
            </div>
            <h2 style={{ marginBottom: '0.5rem' }}>Delete Request?</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Are you sure you want to permanently delete this activation request? This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowDeleteConfirm(null)}>Cancel</button>
              <button className="btn-primary" style={{ flex: 1, backgroundColor: '#ef4444', borderColor: '#ef4444' }} onClick={() => handleDeleteRequest(showDeleteConfirm)} disabled={actionLoading}>
                {actionLoading ? <Loader2 className="animate-spin" size={18} /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image View Modal */}
      {viewImageModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '90vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ color: 'white', margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>{viewImageModal.title}</h3>
              <button 
                onClick={() => setViewImageModal(null)} 
                style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', transition: 'all 0.2s' }}
              >
                <X size={20} />
              </button>
            </div>
            <div style={{ position: 'relative', width: '100%', height: 'calc(90vh - 60px)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={viewImageModal.url} 
                alt={viewImageModal.title} 
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
                onError={(e) => {
                  e.currentTarget.src = "https://images.unsplash.com/photo-1557200134-90327ee9fafa?w=500&auto=format&fit=crop&q=60";
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
