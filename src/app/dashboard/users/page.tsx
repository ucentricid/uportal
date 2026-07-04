"use client";

import { useEffect, useState } from 'react';
import {
  UserPlus,
  Search,
  Edit2,
  Trash2,
  Shield,
  User,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  AlertTriangle
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface UserData {
  id: string;
  name: string;
  username: string;
  role: string;
  created_at: string;
  status: boolean;
  email?: string;
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [isForbidden, setIsForbidden] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Helper to trigger global notification
  const notify = (message: string, type: 'success' | 'error' = 'success') => {
    window.dispatchEvent(new CustomEvent('show-notification', {
      detail: { message, type }
    }));
  };

  // Delete Confirmation State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    role: 'user',
    email: ''
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/proxy/users');
      if (response.data.status === 'success') {
        setUsers(response.data.data);
      }
    } catch (err: any) {
      if (err.response?.status === 403) {
        setIsForbidden(true);
      } else {
        console.error('Failed to fetch users:', err);
        setMockUsers();
      }
    } finally {
      setLoading(false);
    }
  };

  const setMockUsers = () => {
    setUsers([
      { id: '1', name: 'Dedi Rosandi', username: 'dedirosandi', role: 'admin', created_at: new Date().toISOString(), status: true, email: 'dedi@ucentric.id' },
      { id: '2', name: 'John Doe', username: 'johndoe', role: 'user', created_at: new Date().toISOString(), status: true, email: 'john@doe.com' },
    ]);
  };

  useEffect(() => {
    fetchUsers();
    const stored = localStorage.getItem('user');
    if (stored) setCurrentUser(JSON.parse(stored));
  }, []);

  const validatePassword = (pass: string) => {
    if (pass.length < 8) return "Password must be at least 8 characters.";
    if (!/[A-Z]/.test(pass)) return "Password must contain at least one uppercase letter.";
    if (!/[0-9]/.test(pass)) return "Password must contain at least one number.";
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pass)) return "Password must contain at least one special character.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!editingUser || formData.password) {
      const passError = validatePassword(formData.password);
      if (passError) {
        setError(passError);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (editingUser) {
        const payload = { ...formData };
        if (!payload.password) delete (payload as any).password;

        const response = await api.put(`/api/proxy/users/${editingUser.id}`, payload);
        if (response.data.status === 'success') {
          notify(response.data.message || 'User updated successfully!', 'success');
          finishSubmission();
        }
      } else {
        const response = await api.post('/api/proxy/users', formData);
        if (response.data.status === 'success') {
          notify(response.data.message || 'User created successfully!', 'success');
          finishSubmission();
        }
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Operation failed. Please try again.';
      setError(msg);
      notify(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const finishSubmission = () => {
    setFormData({ name: '', username: '', password: '', role: 'user', email: '' });
    setTimeout(() => {
      setIsModalOpen(false);
      setEditingUser(null);
      setSuccess('');
      fetchUsers();
    }, 1500);
  };

  const handleEdit = (user: UserData) => {
    setEditingUser(user);
    setFormData({
      name: user.name || '',
      username: user.username || user.email || '',
      password: '',
      role: user.role || 'user',
      email: user.email || ''
    });
    setIsModalOpen(true);
  };

  const toggleStatus = async (user: UserData) => {
    setTogglingId(user.id);
    try {
      const response = await api.put(`/api/proxy/users/${user.id}`, {
        status: !user.status
      });
      if (response.data.status === 'success') {
        setUsers(users.map(u => u.id === user.id ? { ...u, status: !u.status } : u));
        notify(`User ${!user.status ? 'activated' : 'deactivated'} successfully!`, 'success');
      }
    } catch (err: any) {
      notify(err.response?.data?.message || 'Failed to update status', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      const response = await api.delete(`/api/proxy/users/${id}`);
      if (response.data.status === 'success') {
        notify(response.data.message || 'User deleted successfully!', 'success');
        setShowDeleteConfirm(null);
        fetchUsers();
      }
    } catch (err: any) {
      notify(err.response?.data?.message || 'Failed to delete user', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', marginBottom: '0.25rem' }}>User Management</h1>
            <p>Manage your portal users and their permissions.</p>
          </div>
          <button className="btn-primary" style={{ width: 'auto' }} onClick={() => {
            setEditingUser(null);
            setFormData({ name: '', username: '', password: '', role: 'user', email: '' });
            setIsModalOpen(true);
          }} disabled={isForbidden}>
            <UserPlus size={18} />
            Add New User
          </button>
        </div>

        {isForbidden ? (
          <div className="card" style={{ padding: '4rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ padding: '1.5rem', borderRadius: '50%', background: 'rgba(229, 115, 115, 0.1)', color: 'var(--error-color)' }}>
              <Shield size={48} />
            </div>
            <div>
              <h2 style={{ color: 'var(--primary-color)', marginBottom: '0.5rem' }}>Access Denied</h2>
              <p style={{ maxWidth: '400px' }}>You do not have the required permissions to access this page. Only users with Admin or Superadmin roles can manage users.</p>
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
                  placeholder="Search users..."
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
                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem' }}>USER</th>
                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem' }}>ROLE</th>
                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem' }}>STATUS</th>
                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem' }}>DATE ADDED</th>
                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '3rem', textAlign: 'center' }}>
                        <Loader2 className="animate-spin" style={{ margin: 'auto' }} />
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No users found.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id} style={{ borderTop: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '1rem 1.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(43, 58, 85, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-color)' }}>
                              <User size={16} />
                            </div>
                            <div>
                              <p style={{ fontWeight: '600', fontSize: '0.9rem', margin: 0 }}>{user.name}</p>
                              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>@{user.username}</p>
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
                            background: user.role === 'admin' ? 'rgba(43, 58, 85, 0.1)' : 'rgba(130, 140, 155, 0.1)',
                            color: user.role === 'admin' ? 'var(--primary-color)' : 'var(--text-muted)'
                          }}>
                            <Shield size={12} />
                            {user.role.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '1rem 1.5rem' }}>
                          <button
                            onClick={() => toggleStatus(user)}
                            disabled={togglingId === user.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              background: 'none',
                              border: 'none',
                              padding: '0.4rem 0.6rem',
                              borderRadius: '20px',
                              cursor: togglingId === user.id ? 'not-allowed' : 'pointer',
                              transition: 'all 0.2s ease',
                              backgroundColor: user.status ? 'rgba(34, 197, 94, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                            }}
                          >
                            {togglingId === user.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: user.status ? 'var(--success-color)' : 'var(--text-muted)' }}></div>
                            )}
                            <span style={{ fontSize: '0.85rem', fontWeight: '500', color: user.status ? 'var(--success-color)' : 'var(--text-muted)' }}>
                              {user.status ? 'Active' : 'Inactive'}
                            </span>
                          </button>
                        </td>
                        <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button className="nav-item" style={{ padding: '0.4rem' }} onClick={() => handleEdit(user)}>
                              <Edit2 size={16} />
                            </button>
                            {currentUser?.id !== user.id && (
                              <button className="nav-item" style={{ padding: '0.4rem', color: 'var(--error-color)' }} onClick={() => setShowDeleteConfirm(user.id)}>
                                <Trash2 size={16} />
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

      {/* User Modal (Create/Edit) */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '480px', position: 'relative', padding: '2.5rem', boxShadow: '0 20px 80px rgba(0,0,0,0.3)' }}>
            <button onClick={() => { setIsModalOpen(false); setEditingUser(null); }} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', color: 'var(--text-muted)' }}><X size={20} /></button>
            <h2 style={{ marginBottom: '0.5rem' }}>{editingUser ? 'Edit User' : 'Create New User'}</h2>
            <p style={{ marginBottom: '2rem' }}>{editingUser ? 'Update the details for this user.' : 'Fill in the details to add a new portal user.'}</p>
            <form onSubmit={handleSubmit}>
              <div className="form-group"><label className="form-label">Full Name</label><input type="text" className="form-input" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
              <div className="form-group"><label className="form-label">Username</label><input type="text" className="form-input" required value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} /></div>
              <div className="form-group"><label className="form-label">Email Address</label><input type="email" className="form-input" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></div>
              <div className="form-group"><label className="form-label">Password {editingUser && '(Leave blank to keep current)'}</label><input type="password" className="form-input" required={!editingUser} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} /></div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-input" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} style={{ appearance: 'none' }}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="superadmin">Superadmin</option>
                  <option value="affiliate">Affiliate</option>
                  <option value="sales">Sales</option>
                </select>
              </div>
              {error && <div className="error-message" style={{ marginBottom: '1.5rem' }}>{error}</div>}
              {success && <div className="success-message" style={{ marginBottom: '1.5rem' }}>{success}</div>}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => { setIsModalOpen(false); setEditingUser(null); }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={isSubmitting}>{isSubmitting ? <Loader2 className="animate-spin" size={18} /> : (editingUser ? 'Save Changes' : 'Create User')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px', textAlign: 'center', padding: '2.5rem' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <AlertTriangle size={32} />
            </div>
            <h2 style={{ marginBottom: '0.5rem' }}>Are you sure?</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>This action cannot be undone. This user will be permanently removed from the system.</p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowDeleteConfirm(null)}>Cancel</button>
              <button className="btn-primary" style={{ flex: 1, backgroundColor: '#ef4444', borderColor: '#ef4444' }} onClick={() => handleDelete(showDeleteConfirm)} disabled={isDeleting}>
                {isDeleting ? <Loader2 className="animate-spin" size={18} /> : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
