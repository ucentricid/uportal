"use client";

import { useEffect, useState } from 'react';
import {
  Search,
  Edit2,
  Trash2,
  Shield,
  X,
  Loader2,
  AlertTriangle,
  Plus,
  Scale
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import apiLocal from '@/lib/api-local';

interface CategoryCommission {
  id: string;
  name: string;
  code: string;
  plan_type: string;
  reward_type: string;
  is_active: boolean;
}

export default function CategoryCommissionsPage() {
  const router = useRouter();
  const [data, setData] = useState<CategoryCommission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [editingItem, setEditingItem] = useState<CategoryCommission | null>(null);
  const [isForbidden, setIsForbidden] = useState(false);

  // Helper to trigger global notification
  const notify = (message: string, type: 'success' | 'error' = 'success') => {
    window.dispatchEvent(new CustomEvent('show-notification', {
      detail: { message, type }
    }));
  };

  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    plan_type: 'FLAT',
    reward_type: 'FIXED_AMOUNT',
    is_active: true
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await apiLocal.get('/api/proxy/category-commissions');
      if (response.data.status === 'success' || response.data.success) {
        setData(response.data.data || []);
      }
    } catch (err: any) {
      if (err.response?.status === 403) {
        setIsForbidden(true);
      } else {
        console.error('Failed to fetch category commissions:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const payload = { ...formData };
      if (editingItem) {
        const response = await apiLocal.put(`/api/proxy/category-commissions/${editingItem.id}`, payload);
        if (response.data.status === 'success' || response.data.success) {
          notify('Updated successfully!', 'success');
          finishSubmission();
        }
      } else {
        const response = await apiLocal.post('/api/proxy/category-commissions', payload);
        if (response.data.status === 'success' || response.data.success) {
          notify('Created successfully!', 'success');
          finishSubmission();
        }
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Operation failed.';
      setError(msg);
      notify(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const finishSubmission = () => {
    setFormData({ name: '', code: '', plan_type: 'FLAT', reward_type: 'FIXED_AMOUNT', is_active: true });
    setIsModalOpen(false);
    setEditingItem(null);
    fetchData();
  };

  const handleEdit = (item: CategoryCommission) => {
    setEditingItem(item);
    setFormData({
      name: item.name || '',
      code: item.code || '',
      plan_type: item.plan_type || 'FLAT',
      reward_type: item.reward_type || 'FIXED_AMOUNT',
      is_active: item.is_active
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      const response = await apiLocal.delete(`/api/proxy/category-commissions/${id}`);
      if (response.data.status === 'success' || response.data.success) {
        notify('Deleted successfully!', 'success');
        setShowDeleteConfirm(null);
        fetchData();
      }
    } catch (err: any) {
      notify(err.response?.data?.message || 'Failed to delete', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredData = data.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', marginBottom: '0.25rem' }}>Category Commissions</h1>
            <p>Manage product category commission rates.</p>
          </div>
          <button className="btn-primary" style={{ width: 'auto' }} onClick={() => {
            setEditingItem(null);
            setFormData({ name: '', code: '', plan_type: 'FLAT', reward_type: 'FIXED_AMOUNT', is_active: true });
            setIsModalOpen(true);
          }} disabled={isForbidden}>
            <Plus size={18} />
            Add Category
          </button>
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
                  placeholder="Search categories..."
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
                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem' }}>CODE</th>
                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem' }}>PLAN TYPE</th>
                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem' }}>REWARD TYPE</th>
                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem' }}>STATUS</th>
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
                  ) : filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No data found.
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((item) => (
                      <tr key={item.id} style={{ borderTop: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '1rem 1.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(43, 58, 85, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-color)' }}>
                              <Scale size={16} />
                            </div>
                            <p style={{ fontWeight: '600', fontSize: '0.95rem', margin: 0 }}>{item.name}</p>
                          </div>
                        </td>
                        <td style={{ padding: '1rem 1.5rem' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: '500' }}>{item.code || '-'}</span>
                        </td>
                        <td style={{ padding: '1rem 1.5rem' }}>
                          <span style={{ fontSize: '0.85rem' }}>{item.plan_type || '-'}</span>
                        </td>
                        <td style={{ padding: '1rem 1.5rem' }}>
                          <span style={{ fontSize: '0.85rem' }}>{item.reward_type || '-'}</span>
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
                            background: item.is_active ? 'rgba(34, 197, 94, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                            color: item.is_active ? 'var(--success-color)' : 'var(--text-muted)'
                          }}>
                            {item.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button className="nav-item" style={{ padding: '0.4rem' }} onClick={() => handleEdit(item)}>
                              <Edit2 size={16} />
                            </button>
                            <button className="nav-item" style={{ padding: '0.4rem', color: 'var(--error-color)' }} onClick={() => setShowDeleteConfirm(item.id)}>
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

      {/* Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '480px', position: 'relative', padding: '2.5rem', boxShadow: '0 20px 80px rgba(0,0,0,0.3)' }}>
            <button onClick={() => { setIsModalOpen(false); setEditingItem(null); }} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', color: 'var(--text-muted)' }}><X size={20} /></button>
            <h2 style={{ marginBottom: '0.5rem' }}>{editingItem ? 'Edit Category' : 'Add Category'}</h2>
            <p style={{ marginBottom: '2rem' }}>{editingItem ? 'Update category commission.' : 'Add new category commission.'}</p>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Category Name</label>
                <input type="text" className="form-input" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Category Code</label>
                <input type="text" className="form-input" required value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Plan Type</label>
                <select className="form-input" value={formData.plan_type} onChange={(e) => setFormData({ ...formData, plan_type: e.target.value })} style={{ appearance: 'none' }}>
                  <option value="FLAT">Flat</option>
                  <option value="TIERED">Tiered</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Reward Type</label>
                <select className="form-input" value={formData.reward_type} onChange={(e) => setFormData({ ...formData, reward_type: e.target.value })} style={{ appearance: 'none' }}>
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FIXED_AMOUNT">Fixed Amount (Rp)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-input" value={formData.is_active ? 'active' : 'inactive'} onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'active' })} style={{ appearance: 'none' }}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              {error && <div className="error-message" style={{ marginBottom: '1.5rem' }}>{error}</div>}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => { setIsModalOpen(false); setEditingItem(null); }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={isSubmitting}>{isSubmitting ? <Loader2 className="animate-spin" size={18} /> : 'Save'}</button>
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
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowDeleteConfirm(null)}>Cancel</button>
              <button className="btn-primary" style={{ flex: 1, backgroundColor: '#ef4444', borderColor: '#ef4444' }} onClick={() => handleDelete(showDeleteConfirm)} disabled={isDeleting}>
                {isDeleting ? <Loader2 className="animate-spin" size={18} /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
