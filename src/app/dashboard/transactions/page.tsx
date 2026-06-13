"use client";

import { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Loader2, 
  Search, 
  Eye, 
  X, 
  CheckCircle, 
  AlertTriangle,
  Shield,
  Trash2,
  Building2,
  RefreshCw,
  Ban,
  Calendar,
  ExternalLink,
  Store,
  DollarSign
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

interface Transaction {
  id: string;
  order_id: string;
  token_number: string;
  gross_amount: string;
  payment_status: string; // 'pending' | 'paid' | 'cancelled' | 'expired'
  created_at: string;
  updated_at: string;
  merchant_name?: string;
  merchant_owner_name?: string;
}

export default function TransactionsPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState<Transaction | null>(null);
  const [isForbidden, setIsForbidden] = useState(false);

  // Helper to trigger global notification
  const notify = (message: string, type: 'success' | 'error' = 'success') => {
    window.dispatchEvent(new CustomEvent('show-notification', { 
      detail: { message, type } 
    }));
  };

  const fetchTransactions = async (search = '', status = 'all') => {
    setLoading(true);
    try {
      let url = '/api/transactions?limit=100';
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (status && status !== 'all') url += `&payment_status=${encodeURIComponent(status)}`;

      const response = await axios.get(url);
      if (response.data.success) {
        setTransactions(response.data.data || []);
      } else {
        setMockTransactions();
      }
    } catch (err: any) {
      if (err.response?.status === 403 || err.response?.status === 401) {
        setIsForbidden(true);
      } else {
        console.error('Failed to fetch transactions:', err);
        setMockTransactions();
      }
    } finally {
      setLoading(false);
    }
  };

  const setMockTransactions = () => {
    setTransactions([
      {
        id: 'mock-tx-1',
        order_id: 'TRX-1780925940-1234',
        token_number: '1234-5678-9012-3456',
        gross_amount: '15000.00',
        payment_status: 'pending',
        created_at: new Date(Date.now() - 600000).toISOString(),
        updated_at: new Date(Date.now() - 600000).toISOString(),
        merchant_name: 'Coffee Shop',
        merchant_owner_name: 'John Doe'
      },
      {
        id: 'mock-tx-2',
        order_id: 'TRX-1780925111-5678',
        token_number: '9876-5432-1098-7654',
        gross_amount: '50000.00',
        payment_status: 'paid',
        created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        merchant_name: 'Warung Makan Padang',
        merchant_owner_name: 'Jane Smith'
      },
      {
        id: 'mock-tx-3',
        order_id: 'TRX-1780925000-9999',
        token_number: '9876-5432-1098-7654',
        gross_amount: '120000.00',
        payment_status: 'cancelled',
        created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
        updated_at: new Date(Date.now() - 3600000 * 24).toISOString(),
        merchant_name: 'Warung Makan Padang',
        merchant_owner_name: 'Jane Smith'
      }
    ]);
  };

  useEffect(() => {
    // Check role from localStorage
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
    fetchTransactions();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTransactions(searchTerm, statusFilter);
  };

  const handleStatusChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    fetchTransactions(searchTerm, newStatus);
  };

  const handleCheckStatus = async (orderId: string) => {
    setActionLoading(`check-${orderId}`);
    try {
      const response = await axios.get(`/api/transactions/${orderId}`);
      if (response.data.success && response.data.data) {
        const updatedTx = response.data.data;
        notify(`Transaction status updated to: ${updatedTx.payment_status}`, 'success');
        
        // Update transaction locally
        setTransactions(prev => prev.map(tx => tx.order_id === orderId ? { ...tx, payment_status: updatedTx.payment_status, updated_at: updatedTx.updated_at } : tx));
        if (selectedTransaction && selectedTransaction.order_id === orderId) {
          setSelectedTransaction(prev => prev ? { ...prev, payment_status: updatedTx.payment_status, updated_at: updatedTx.updated_at } : null);
        }
      } else {
        notify(response.data.error || 'Failed to update transaction status', 'error');
      }
    } catch (err: any) {
      console.error('Error checking status:', err);
      notify(err.response?.data?.error || 'Failed to check transaction status', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelTransaction = async () => {
    if (!showCancelConfirm) return;
    const tx = showCancelConfirm;
    setActionLoading(`cancel-${tx.order_id}`);
    setShowCancelConfirm(null);
    try {
      const response = await axios.post(`/api/transactions/${tx.order_id}/cancel`, {
        token_number: tx.token_number
      });
      if (response.data.success) {
        notify('Transaction cancelled successfully!', 'success');
        fetchTransactions(searchTerm, statusFilter);
        if (selectedTransaction && selectedTransaction.order_id === tx.order_id) {
          setShowDetailModal(false);
          setSelectedTransaction(null);
        }
      } else {
        notify(response.data.error || 'Failed to cancel transaction', 'error');
      }
    } catch (err: any) {
      console.error('Error cancelling transaction:', err);
      notify(err.response?.data?.error || 'Failed to cancel transaction', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
      case 'settlement': 
        return 'var(--success-color)';
      case 'cancelled':
      case 'cancel':
      case 'expire':
      case 'failed':
      case 'deny':
        return 'var(--error-color)';
      default: 
        return '#f59e0b'; // pending -> amber
    }
  };

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', marginBottom: '0.25rem' }}>Cashier Transactions</h1>
            <p>Monitor all cashier transactions history across all merchants in the system.</p>
          </div>
        </div>

        {isForbidden ? (
          <div className="card" style={{ padding: '4rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ padding: '1.5rem', borderRadius: '50%', background: 'rgba(229, 115, 115, 0.1)', color: 'var(--error-color)' }}>
              <Shield size={48} />
            </div>
            <div>
              <h2 style={{ color: 'var(--primary-color)', marginBottom: '0.5rem' }}>Access Denied</h2>
              <p style={{ maxWidth: '400px' }}>You do not have the required permissions to access this page. Only Superadmin users can view all cashier transactions.</p>
            </div>
            <button className="btn-secondary" style={{ width: 'auto' }} onClick={() => router.push('/dashboard')}>
              Back to Dashboard
            </button>
          </div>
        ) : (
          <div className="card" style={{ padding: '0' }}>
            {/* Search and Filters */}
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
              <form onSubmit={handleSearchSubmit} style={{ position: 'relative', width: '320px', display: 'flex', gap: '0.5rem' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="text" 
                    placeholder="Search order, merchant, token..." 
                    className="form-input" 
                    style={{ paddingLeft: '40px', borderRadius: '30px' }}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn-primary" style={{ width: 'auto', borderRadius: '30px', padding: '0.5rem 1.25rem' }}>Search</button>
              </form>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '500' }}>Status:</span>
                <select 
                  className="form-input" 
                  style={{ padding: '0.5rem 2rem 0.5rem 1rem', borderRadius: '20px', fontSize: '0.875rem' }}
                  value={statusFilter}
                  onChange={(e) => handleStatusChange(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="settlement">Settlement</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="expire">Expired</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', background: '#f8fafc' }}>
                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem' }}>MERCHANT</th>
                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem' }}>ORDER ID</th>
                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem' }}>GROSS AMOUNT</th>
                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem' }}>PAYMENT STATUS</th>
                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem' }}>TRANSACTION TIME</th>
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
                  ) : transactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No transactions found.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => (
                      <tr key={tx.id} style={{ borderTop: '1px solid var(--border-color)', transition: 'background-color 0.2s' }}>
                        <td style={{ padding: '1rem 1.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Store size={16} style={{ color: 'var(--primary-color)' }} />
                            <div>
                              <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>{tx.merchant_name || 'Unknown Store'}</span>
                              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, fontFamily: 'monospace' }}>{tx.token_number}</p>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem', fontWeight: '600', fontFamily: 'monospace' }}>
                          {tx.order_id}
                        </td>
                        <td style={{ padding: '1rem 1.5rem', fontSize: '0.95rem', fontWeight: '700', color: 'var(--primary-color)' }}>
                          Rp {parseFloat(tx.gross_amount).toLocaleString('id-ID')}
                        </td>
                        <td style={{ padding: '1rem 1.5rem' }}>
                          <span style={{ 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '0.35rem',
                            fontSize: '0.75rem', 
                            fontWeight: '600', 
                            padding: '0.2rem 0.6rem', 
                            borderRadius: '20px', 
                            background: tx.payment_status === 'paid' || tx.payment_status === 'settlement' ? 'rgba(129, 199, 132, 0.15)' : tx.payment_status === 'pending' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(229, 115, 115, 0.15)',
                            color: getStatusColor(tx.payment_status)
                          }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: getStatusColor(tx.payment_status) }}></div>
                            {tx.payment_status.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                          {new Date(tx.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button 
                              className="nav-item" 
                              style={{ padding: '0.4rem', color: 'var(--primary-color)' }}
                              onClick={() => {
                                setSelectedTransaction(tx);
                                setShowDetailModal(true);
                              }}
                              title="View Details"
                            >
                              <Eye size={16} />
                            </button>
                            <button 
                              className="nav-item" 
                              style={{ padding: '0.4rem', color: '#6366f1' }}
                              disabled={actionLoading === `check-${tx.order_id}`}
                              onClick={() => handleCheckStatus(tx.order_id)}
                              title="Check Status in Real-time"
                            >
                              {actionLoading === `check-${tx.order_id}` ? (
                                <Loader2 className="animate-spin" size={16} />
                              ) : (
                                <RefreshCw size={16} />
                              )}
                            </button>
                            {tx.payment_status === 'pending' && (
                              <button 
                                className="nav-item" 
                                style={{ padding: '0.4rem', color: 'var(--error-color)' }}
                                disabled={actionLoading === `cancel-${tx.order_id}`}
                                onClick={() => setShowCancelConfirm(tx)}
                                title="Cancel Payment Transaction"
                              >
                                <Ban size={16} />
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

      {/* Detail Modal */}
      {showDetailModal && selectedTransaction && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '600px', position: 'relative', padding: 0, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', overflow: 'hidden', borderRadius: '16px' }}>
            
            {/* Header */}
            <div style={{ padding: '2rem 2.5rem', borderBottom: '1px solid var(--border-color)', background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)' }}>
              <button 
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedTransaction(null);
                }} 
                style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'white', border: '1px solid var(--border-color)', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)', transition: 'all 0.2s' }}
              >
                <X size={18} />
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--primary-color), #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                  <CreditCard size={24} />
                </div>
                <div>
                  <h2 style={{ marginBottom: 0, fontSize: '1.5rem' }}>Transaction Details</h2>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>ID: {selectedTransaction.id}</p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div style={{ padding: '2rem 2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem' }}>
                <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.35rem', fontWeight: '600' }}>ORDER ID</p>
                  <p style={{ fontSize: '0.95rem', margin: 0, fontWeight: '600', color: '#0f172a', fontFamily: 'monospace' }}>{selectedTransaction.order_id}</p>
                </div>
                <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.35rem', fontWeight: '600' }}>PAYMENT STATUS</p>
                  <span style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '0.35rem',
                    fontSize: '0.8rem', 
                    fontWeight: '600', 
                    padding: '0.15rem 0.5rem', 
                    borderRadius: '20px', 
                    background: selectedTransaction.payment_status === 'paid' || selectedTransaction.payment_status === 'settlement' ? 'rgba(129, 199, 132, 0.15)' : selectedTransaction.payment_status === 'pending' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(229, 115, 115, 0.15)',
                    color: getStatusColor(selectedTransaction.payment_status)
                  }}>
                    {selectedTransaction.payment_status.toUpperCase()}
                  </span>
                </div>
                <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.35rem', fontWeight: '600' }}>GROSS AMOUNT</p>
                  <p style={{ fontSize: '1.1rem', margin: 0, fontWeight: '700', color: 'var(--primary-color)' }}>
                    Rp {parseFloat(selectedTransaction.gross_amount).toLocaleString('id-ID')}
                  </p>
                </div>
                <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.35rem', fontWeight: '600' }}>MERCHANT TOKEN</p>
                  <p style={{ fontSize: '0.95rem', margin: 0, color: '#0f172a', fontFamily: 'monospace' }}>{selectedTransaction.token_number}</p>
                </div>
                <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.35rem', fontWeight: '600' }}>MERCHANT NAME</p>
                  <p style={{ fontSize: '0.95rem', margin: 0, color: '#0f172a', fontWeight: '500' }}>{selectedTransaction.merchant_name || '-'}</p>
                </div>
                <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.35rem', fontWeight: '600' }}>MERCHANT OWNER</p>
                  <p style={{ fontSize: '0.95rem', margin: 0, color: '#0f172a', fontWeight: '500' }}>{selectedTransaction.merchant_owner_name || '-'}</p>
                </div>
                <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.35rem', fontWeight: '600' }}>CREATED TIME</p>
                  <p style={{ fontSize: '0.9rem', margin: 0, color: '#0f172a' }}>
                    {new Date(selectedTransaction.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>
                <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.35rem', fontWeight: '600' }}>LAST UPDATED</p>
                  <p style={{ fontSize: '0.9rem', margin: 0, color: '#0f172a' }}>
                    {new Date(selectedTransaction.updated_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>
              </div>

              {/* Action Operations */}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', padding: '1rem 0 0', borderTop: '1px solid var(--border-color)', justifyContent: 'flex-end' }}>
                <button 
                  className="btn-secondary" 
                  style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  disabled={actionLoading === `check-${selectedTransaction.order_id}`}
                  onClick={() => handleCheckStatus(selectedTransaction.order_id)}
                >
                  <RefreshCw size={16} className={actionLoading === `check-${selectedTransaction.order_id}` ? "animate-spin" : ""} />
                  Check Real-time Status
                </button>
                {selectedTransaction.payment_status === 'pending' && (
                  <button 
                    className="btn-primary" 
                    style={{ width: 'auto', backgroundColor: 'var(--error-color)', borderColor: 'var(--error-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    onClick={() => setShowCancelConfirm(selectedTransaction)}
                  >
                    <Ban size={16} />
                    Cancel Transaction
                  </button>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation modal */}
      {showCancelConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px', textAlign: 'center', padding: '2.5rem' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <Ban size={32} />
            </div>
            <h2 style={{ marginBottom: '0.5rem' }}>Cancel Transaction?</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Are you sure you want to cancel payment for order <strong>{showCancelConfirm.order_id}</strong>? This will permanently cancel and remove the transaction.</p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowCancelConfirm(null)}>No, Keep It</button>
              <button className="btn-primary" style={{ flex: 1, backgroundColor: '#ef4444', borderColor: '#ef4444' }} onClick={handleCancelTransaction}>
                Yes, Cancel It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
