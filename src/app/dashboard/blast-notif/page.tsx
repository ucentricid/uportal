"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Bell, Send, Loader2, CheckCircle, Clock, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  target_type: string;
  token_number: string | null;
  status: string;
  scheduled_at: string;
  created_at: string;
  updated_at: string;
}

export default function BlastNotifPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 10;
  const [createForm, setCreateForm] = useState({
    title: '',
    body: '',
    type: 'info',
    token_number: '',
    scheduled_at: '',
  });

  useEffect(() => {
    fetchNotifications(1);
  }, []);

  const fetchNotifications = async (page = 1) => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/notifications?page=${page}&limit=${limit}`);
      if (response.data.success) {
        setNotifications(response.data.data || []);
        setTotalPages(response.data.pagination?.total_pages || 1);
        setTotalItems(response.data.pagination?.total || 0);
        setCurrentPage(page);
      }
    } catch (err: any) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      fetchNotifications(page);
    }
  };

  const handleCreateNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);

    try {
      const scheduledDate = new Date(createForm.scheduled_at);
      const formattedScheduledAt = scheduledDate.toISOString();

      const payload = {
        title: createForm.title,
        body: createForm.body,
        type: createForm.type,
        target_type: createForm.token_number ? 'single' : 'broadcast',
        token_number: createForm.token_number || null,
        status: 'scheduled',
        scheduled_at: formattedScheduledAt,
      };

      const response = await axios.post('/api/notifications', payload, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      if (response.data.success) {
        fetchNotifications(currentPage);
        closeCreateModal();
        notify('Notification created and scheduled successfully', 'success');
      } else {
        notify(response.data.error || 'Failed to create notification', 'error');
      }
    } catch (err: any) {
      console.error('Error creating notification:', err);
      notify(err.response?.data?.error || 'Failed to create notification', 'error');
    } finally {
      setCreateLoading(false);
    }
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setCreateForm({
      title: '',
      body: '',
      type: 'info',
      token_number: '',
      scheduled_at: '',
    });
  };

  const notify = (message: string, type: 'success' | 'error') => {
    window.dispatchEvent(new CustomEvent('notify', { detail: { message, type } }));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle size={16} style={{ color: 'var(--success-color)' }} />;
      case 'scheduled':
        return <Clock size={16} style={{ color: 'var(--primary-color)' }} />;
      case 'failed':
        return <XCircle size={16} style={{ color: 'var(--error-color)' }} />;
      default:
        return <Clock size={16} style={{ color: 'var(--text-muted)' }} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'var(--success-color)';
      case 'scheduled':
        return 'var(--primary-color)';
      case 'failed':
        return 'var(--error-color)';
      default:
        return 'var(--text-muted)';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'promo':
        return '#f59e0b';
      case 'info':
        return '#3b82f6';
      case 'warning':
        return '#ef4444';
      case 'success':
        return '#22c55e';
      default:
        return 'var(--text-muted)';
    }
  };

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Page Header */}
        <div>
          <h1 style={{ marginBottom: '0.5rem', fontSize: '2rem', fontWeight: '700' }}>Blast Notification</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', margin: 0 }}>
            Send broadcast notifications to all users
          </p>
        </div>

        {/* Notifications Table */}
        <div className="card">
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600' }}>Notification History</h3>
            <button className="btn-primary" onClick={() => setShowCreateModal(true)} style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', width: 'auto' }}>
              <Send size={16} />
              Create Blast
            </button>
          </div>

          {loading ? (
            <div style={{ padding: '4rem', textAlign: 'center' }}>
              <Loader2 className="animate-spin" size={32} style={{ color: 'var(--primary-color)', margin: '0 auto' }} />
              <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div style={{ padding: '4rem', textAlign: 'center' }}>
              <Bell size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem', opacity: 0.3 }} />
              <p style={{ color: 'var(--text-muted)' }}>No notifications created yet</p>
            </div>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Title</th>
                      <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Target</th>
                      <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Type</th>
                      <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                      <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Scheduled At</th>
                      <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Created At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notifications.map((notif) => (
                      <tr key={notif.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '1rem 1.5rem' }}>
                          <div>
                            <p style={{ fontWeight: '600', marginBottom: '0.25rem', fontSize: '0.95rem' }}>{notif.title}</p>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {notif.body}
                            </p>
                          </div>
                        </td>
                        <td style={{ padding: '1rem 1.5rem' }}>
                          {notif.target_type === 'broadcast' ? (
                            <span style={{
                              display: 'inline-block',
                              padding: '0.35rem 0.75rem',
                              borderRadius: '20px',
                              fontSize: '0.8rem',
                              fontWeight: '600',
                              backgroundColor: 'rgba(59, 130, 246, 0.1)',
                              color: '#3b82f6',
                            }}>
                              📢 Broadcast
                            </span>
                          ) : (
                            <span style={{
                              display: 'inline-block',
                              padding: '0.35rem 0.75rem',
                              borderRadius: '20px',
                              fontSize: '0.8rem',
                              fontWeight: '600',
                              backgroundColor: 'rgba(245, 158, 11, 0.1)',
                              color: '#f59e0b',
                            }}>
                              🎯 {notif.token_number}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '1rem 1.5rem' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '0.35rem 0.75rem',
                            borderRadius: '20px',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            backgroundColor: `${getTypeColor(notif.type)}20`,
                            color: getTypeColor(notif.type),
                            textTransform: 'capitalize'
                          }}>
                            {notif.type}
                          </span>
                        </td>
                        <td style={{ padding: '1rem 1.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {getStatusIcon(notif.status)}
                            <span style={{ fontSize: '0.85rem', fontWeight: '500', color: getStatusColor(notif.status), textTransform: 'capitalize' }}>
                              {notif.status}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '1rem 1.5rem' }}>
                          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            {new Date(notif.scheduled_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                        <td style={{ padding: '1rem 1.5rem' }}>
                          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                            {new Date(notif.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>
                    Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, totalItems)} of {totalItems} results
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      style={{
                        padding: '0.5rem 0.75rem',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        background: 'white',
                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                        opacity: currentPage === 1 ? 0.5 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontSize: '0.875rem',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      <ChevronLeft size={16} />
                      Previous
                    </button>
                    
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          style={{
                            width: '36px',
                            height: '36px',
                            border: page === currentPage ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                            borderRadius: '8px',
                            background: page === currentPage ? 'var(--primary-color)' : 'white',
                            color: page === currentPage ? 'white' : 'var(--text-secondary)',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: page === currentPage ? '600' : '500',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {page}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      style={{
                        padding: '0.5rem 0.75rem',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        background: 'white',
                        cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                        opacity: currentPage === totalPages ? 0.5 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontSize: '0.875rem',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      Next
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Create Notification Modal */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '700px', maxHeight: '90vh', position: 'relative', padding: 0, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', overflow: 'hidden', borderRadius: '16px' }}>
            {/* Modal Header */}
            <div style={{ padding: '2rem 2.5rem', borderBottom: '1px solid var(--border-color)', background: 'linear-gradient(135deg, #fef3c7, #fde68a)' }}>
              <button onClick={closeCreateModal} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'white', border: '1px solid var(--border-color)', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)', transition: 'all 0.2s' }}>
                <XCircle size={18} />
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                  <Bell size={24} />
                </div>
                <div>
                  <h2 style={{ marginBottom: 0, fontSize: '1.5rem' }}>Create Blast Notification</h2>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#92400e' }}>Send notification to all users</p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '2.5rem', overflowY: 'auto', maxHeight: 'calc(90vh - 200px)' }}>
              <form onSubmit={handleCreateNotification}>
                <div className="form-group">
                  <label className="form-label">Title *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder="e.g., Promo Premium Murah"
                    value={createForm.title}
                    onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Message *</label>
                  <textarea
                    className="form-input"
                    required
                    rows={4}
                    placeholder="e.g., Dapatkan diskon 15% untuk langganan premium bulan ini!"
                    value={createForm.body}
                    onChange={(e) => setCreateForm({ ...createForm, body: e.target.value })}
                    style={{ resize: 'vertical', fontFamily: 'inherit' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                  <div className="form-group">
                    <label className="form-label">Type *</label>
                    <select
                      className="form-input"
                      required
                      value={createForm.type}
                      onChange={(e) => setCreateForm({ ...createForm, type: e.target.value })}
                    >
                      <option value="info">Info</option>
                      <option value="promo">Promo</option>
                      <option value="warning">Warning</option>
                      <option value="success">Success</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Token Number (Optional)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Leave empty for broadcast to all"
                      value={createForm.token_number}
                      onChange={(e) => setCreateForm({ ...createForm, token_number: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Schedule Date & Time *</label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    required
                    value={createForm.scheduled_at}
                    onChange={(e) => setCreateForm({ ...createForm, scheduled_at: e.target.value })}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>

                {/* Info Card */}
                <div style={{ padding: '1.25rem', background: createForm.token_number ? 'linear-gradient(135deg, #fef3c7, #fde68a)' : 'linear-gradient(135deg, #eff6ff, #dbeafe)', borderRadius: '10px', border: createForm.token_number ? '1px solid #fcd34d' : '1px solid #93c5fd', marginTop: '1rem' }}>
                  <p style={{ fontSize: '0.875rem', color: createForm.token_number ? '#92400e' : '#1e40af', margin: 0, fontWeight: '600' }}>
                    {createForm.token_number ? '🎯 Targeted Notification' : 'ℹ️ Broadcast Information'}
                  </p>
                  <p style={{ fontSize: '0.85rem', color: createForm.token_number ? '#78350f' : '#1e3a8a', margin: '0.5rem 0 0' }}>
                    {createForm.token_number 
                      ? `This notification will be sent to <strong>specific merchant</strong> with token: ${createForm.token_number}`
                      : 'This notification will be sent to <strong>all users</strong> at the scheduled time.'}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'flex-end' }}>
                  <button type="button" className="btn-secondary" style={{ width: 'auto' }} onClick={closeCreateModal}>Cancel</button>
                  <button type="submit" className="btn-primary" style={{ width: 'auto', backgroundColor: '#f59e0b', borderColor: '#f59e0b' }} disabled={createLoading}>
                    {createLoading ? <Loader2 className="animate-spin" size={18} /> : (
                      <>
                        <Send size={18} />
                        Schedule Blast
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
