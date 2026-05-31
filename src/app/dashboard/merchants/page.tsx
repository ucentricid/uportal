"use client";

import { useState, useEffect } from 'react';
import { 
  Store, 
  Loader2, 
  Search, 
  Eye, 
  X, 
  Edit2, 
  Trash2, 
  AlertTriangle,
  Shield,
  Unlink
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

interface Merchant {
  token_number: string;
  order_id: string;
  name: string;
  merchant_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  subdistrict: string;
  regency: string;
  province: string;
  postal_code: string;
  package: string;
  amount: string;
  status: string;
  payment_method: string;
  payment_status: string;
  midtrans_order_id: string;
  paid_at: string | null;
  register_date: string;
  status_active: boolean;
  device_id: string | null;
  device_name: string | null;
  device_type: string | null;
  referral_code: string | null;
}

export default function MerchantsPage() {
  const router = useRouter();
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false);
  const [showExtendConfirm, setShowExtendConfirm] = useState<Merchant | null>(null);
  const [extendLoading, setExtendLoading] = useState<boolean>(false);
  const [editForm, setEditForm] = useState<{
    name: string;
    merchant_name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    subdistrict: string;
    regency: string;
    province: string;
    postal_code: string;
  }>({
    name: '',
    merchant_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    subdistrict: '',
    regency: '',
    province: '',
    postal_code: ''
  });
  const [editLoading, setEditLoading] = useState<boolean>(false);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
  const [unlinkLoading, setUnlinkLoading] = useState<boolean>(false);
  const [isForbidden, setIsForbidden] = useState(false);

  // Helper to trigger global notification
  const notify = (message: string, type: 'success' | 'error' = 'success') => {
    window.dispatchEvent(new CustomEvent('show-notification', { 
      detail: { message, type } 
    }));
  };

  const handleUnlinkDevice = async () => {
    setShowUnlinkConfirm(true);
  };

  const confirmUnlinkDevice = async () => {
    if (!selectedMerchant || !selectedMerchant.device_id) return;

    setUnlinkLoading(true);
    setShowUnlinkConfirm(false);

    try {
      const response = await axios.post('/api/merchants/unlink-device', {
        token: selectedMerchant.token_number,
      });

      if (response.data.success) {
        setSelectedMerchant({
          ...selectedMerchant,
          device_id: null,
          device_name: null,
          device_type: null,
        });
        fetchMerchants();
        notify('Device unlinked successfully', 'success');
      } else {
        notify(response.data.error || 'Failed to unlink device', 'error');
      }
    } catch (err: any) {
      console.error('Error unlinking device:', err);
      notify(err.response?.data?.error || 'Failed to unlink device', 'error');
    } finally {
      setUnlinkLoading(false);
    }
  };

  const fetchMerchants = async () => {
    setLoading(true);
    try {
      const url = `/api/merchants?page=1&limit=100`;
      const response = await axios.get(url);
      console.log('Fetched merchants count:', response.data.data?.length || 0);
      if (response.data.success) {
        setMerchants(response.data.data || []);
        // Log first merchant to check status_active format
        if (response.data.data && response.data.data.length > 0) {
          console.log('Sample merchant:', {
            token: response.data.data[0].token_number,
            status_active: response.data.data[0].status_active,
            type: typeof response.data.data[0].status_active
          });
        }
      }
    } catch (err: any) {
      if (err.response?.status === 403) {
        setIsForbidden(true);
      } else {
        console.error('Failed to fetch merchants:', err);
        setMockMerchants();
      }
    } finally {
      setLoading(false);
    }
  };

  const setMockMerchants = () => {
    setMerchants([
      { 
        token_number: 'TKN001', 
        order_id: 'ORD001', 
        name: 'John Doe', 
        merchant_name: 'Coffee Shop', 
        email: 'john@coffee.com', 
        phone: '081234567890', 
        address: 'Jl. Sudirman No. 123', 
        city: 'Jakarta', 
        subdistrict: 'Kebayoran', 
        regency: 'Jakarta Selatan', 
        province: 'DKI Jakarta', 
        postal_code: '12345', 
        package: 'premium', 
        amount: '500000', 
        status: 'active', 
        payment_method: 'credit_card', 
        payment_status: 'paid', 
        midtrans_order_id: 'MT001', 
        paid_at: new Date().toISOString(), 
        register_date: new Date().toISOString(), 
        status_active: true,
        device_id: 'DEV001',
        device_name: 'iPhone 13',
        device_type: 'mobile',
        referral_code: 'REF001'
      },
    ]);
  };

  useEffect(() => {
    fetchMerchants();
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const filteredMerchants = merchants.filter(merchant => 
    merchant.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    merchant.merchant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    merchant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    merchant.phone.includes(searchTerm)
  );

  const handleViewDetail = (merchant: Merchant) => {
    setSelectedMerchant(merchant);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedMerchant(null);
  };

  const handleEdit = (merchant: Merchant) => {
    setSelectedMerchant(merchant);
    setEditForm({
      name: merchant.name,
      merchant_name: merchant.merchant_name,
      email: merchant.email,
      phone: merchant.phone,
      address: merchant.address,
      city: merchant.city,
      subdistrict: merchant.subdistrict,
      regency: merchant.regency,
      province: merchant.province,
      postal_code: merchant.postal_code
    });
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedMerchant(null);
  };

  const handleUpdateMerchant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMerchant) return;

    setEditLoading(true);

    try {
      const url = `/api/merchants/${selectedMerchant.token_number}`;
      const response = await axios.put(url, editForm, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      if (response.data.success) {
        fetchMerchants();
        closeEditModal();
        notify('Merchant updated successfully', 'success');
      } else {
        notify(response.data.error || 'Failed to update merchant', 'error');
      }
    } catch (err: any) {
      console.error('Error updating merchant:', err);
      notify(err.response?.data?.error || 'Failed to update merchant', 'error');
    } finally {
      setEditLoading(false);
    }
  };

  const handleExtendActive = (merchant: Merchant) => {
    setShowExtendConfirm(merchant);
  };

  const confirmExtendActive = async () => {
    if (!showExtendConfirm) return;

    setExtendLoading(true);
    try {
      // Calculate 7 days from NOW (today), not from old register_date
      const now = new Date();
      const newDate = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));
      const formattedDate = newDate.toISOString();

      console.log('Extending merchant:', {
        token: showExtendConfirm.token_number,
        today: now.toISOString(),
        oldRegisterDate: showExtendConfirm.register_date,
        newRegisterDate: formattedDate,
        status_active: true
      });

      const url = `/api/merchants/${showExtendConfirm.token_number}`;
      const response = await axios.put(url, {
        register_date: formattedDate,
        status_active: true
      });

      console.log('API Response:', response.data);

      if (response.data.success) {
        // Update local state immediately
        setMerchants(prevMerchants => {
          const updated = prevMerchants.map(m => {
            if (m.token_number === showExtendConfirm.token_number) {
              console.log('Updating merchant:', {
                before: { status_active: m.status_active, register_date: m.register_date },
                after: { status_active: true, register_date: formattedDate }
              });
              return {
                ...m,
                register_date: formattedDate,
                status_active: true
              };
            }
            return m;
          });
          return updated;
        });
        
        setShowExtendConfirm(null);
        notify('Merchant active period extended by 7 days', 'success');
        
        // Background refresh after delay
        setTimeout(() => {
          fetchMerchants();
        }, 3000);
      } else {
        notify(response.data.error || 'Failed to extend active period', 'error');
      }
    } catch (err: any) {
      console.error('Error extending active period:', err);
      notify(err.response?.data?.error || 'Failed to extend active period', 'error');
    } finally {
      setExtendLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteLoading(true);
    try {
      const url = `/api/merchants/${id}`;
      const response = await axios.delete(url, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      if (response.data.success) {
        notify('Merchant deleted successfully', 'success');
        setShowDeleteConfirm(null);
        fetchMerchants();
      } else {
        notify(response.data.error || 'Failed to delete merchant', 'error');
      }
    } catch (err: any) {
      console.error('Error deleting merchant:', err);
      notify(err.response?.data?.error || 'Failed to delete merchant', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', marginBottom: '0.25rem' }}>Merchant Management</h1>
            <p>Manage your registered merchants and their details.</p>
          </div>
        </div>

        {isForbidden ? (
          <div className="card" style={{ padding: '4rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ padding: '1.5rem', borderRadius: '50%', background: 'rgba(229, 115, 115, 0.1)', color: 'var(--error-color)' }}>
              <Shield size={48} />
            </div>
            <div>
              <h2 style={{ color: 'var(--primary-color)', marginBottom: '0.5rem' }}>Access Denied</h2>
              <p style={{ maxWidth: '400px' }}>You do not have the required permissions to access this page. Only users with Admin or Superadmin roles can manage merchants.</p>
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
                  placeholder="Search merchants..." 
                  className="form-input" 
                  style={{ paddingLeft: '40px', borderRadius: '30px' }}
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', background: '#f8fafc' }}>
                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem' }}>MERCHANT</th>
                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem' }}>OWNER</th>
                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem' }}>CONTACT</th>
                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem' }}>PACKAGE</th>
                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem' }}>STATUS</th>
                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '3rem', textAlign: 'center' }}>
                        <Loader2 className="animate-spin" style={{ margin: 'auto' }} />
                      </td>
                    </tr>
                  ) : filteredMerchants.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No merchants found.
                      </td>
                    </tr>
                  ) : (
                    filteredMerchants.map((merchant) => (
                      <tr key={merchant.token_number} style={{ borderTop: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '1rem 1.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(43, 58, 85, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-color)' }}>
                              <Store size={16} />
                            </div>
                            <div>
                              <p style={{ fontWeight: '600', fontSize: '0.9rem', margin: 0 }}>{merchant.merchant_name}</p>
                              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>{merchant.city}, {merchant.province}</p>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem' }}>{merchant.name}</td>
                        <td style={{ padding: '1rem 1.5rem' }}>
                          <div>
                            <p style={{ fontSize: '0.85rem', margin: 0 }}>{merchant.email}</p>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>{merchant.phone}</p>
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
                            background: merchant.package === 'premium' ? 'rgba(43, 58, 85, 0.1)' : 'rgba(130, 140, 155, 0.1)',
                            color: merchant.package === 'premium' ? 'var(--primary-color)' : 'var(--text-muted)'
                          }}>
                            {merchant.package.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '1rem 1.5rem' }}>
                          {merchant.status_active === false && merchant.package === 'trial' ? (
                            <button 
                              onClick={() => handleExtendActive(merchant)}
                              style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '0.4rem',
                                background: 'none',
                                border: 'none',
                                padding: '0.4rem 0.6rem',
                                borderRadius: '20px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                backgroundColor: 'rgba(100, 116, 139, 0.1)',
                              }}
                            >
                              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-muted)' }}></div>
                              <span style={{ fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-muted)' }}>
                                Inactive
                              </span>
                            </button>
                          ) : (
                            <span style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '0.4rem',
                              fontSize: '0.85rem', 
                              fontWeight: '500',
                              color: merchant.status_active ? 'var(--success-color)' : 'var(--text-muted)'
                            }}>
                              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: merchant.status_active ? 'var(--success-color)' : 'var(--text-muted)' }}></div>
                              {merchant.status_active ? 'Active' : 'Inactive'}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button className="nav-item" style={{ padding: '0.4rem' }} onClick={() => handleViewDetail(merchant)}>
                              <Eye size={16} />
                            </button>
                            <button className="nav-item" style={{ padding: '0.4rem' }} onClick={() => handleEdit(merchant)}>
                              <Edit2 size={16} />
                            </button>
                            <button className="nav-item" style={{ padding: '0.4rem', color: 'var(--error-color)' }} onClick={() => setShowDeleteConfirm(merchant.token_number)}>
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
      {showDetailModal && selectedMerchant && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', position: 'relative', padding: 0, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', overflow: 'hidden', borderRadius: '16px' }}>
            {/* Modal Header */}
            <div style={{ padding: '2rem 2.5rem', borderBottom: '1px solid var(--border-color)', background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)' }}>
              <button onClick={closeDetailModal} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'white', border: '1px solid var(--border-color)', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)', transition: 'all 0.2s' }}><X size={18} /></button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--primary-color), #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                  <Store size={24} />
                </div>
                <div>
                  <h2 style={{ marginBottom: 0, fontSize: '1.5rem' }}>{selectedMerchant.merchant_name}</h2>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>Merchant Details Information</p>
                </div>
              </div>
            </div>
            
            {/* Modal Body */}
            <div style={{ padding: '2rem 2.5rem', overflow: 'auto', maxHeight: 'calc(90vh - 200px)' }}>
              {/* Quick Info */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ padding: '1rem', background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)', borderRadius: '12px', border: '1px solid #bae6fd' }}>
                  <p style={{ fontSize: '0.75rem', color: '#0369a1', marginBottom: '0.25rem', fontWeight: '600' }}>Token</p>
                  <p style={{ fontSize: '0.9rem', margin: 0, fontFamily: 'monospace', fontWeight: '600', color: '#0c4a6e' }}>{selectedMerchant.token_number}</p>
                </div>
                <div style={{ padding: '1rem', background: selectedMerchant.status_active ? 'linear-gradient(135deg, #f0fdf4, #dcfce7)' : 'linear-gradient(135deg, #fef2f2, #fee2e2)', borderRadius: '12px', border: `1px solid ${selectedMerchant.status_active ? '#86efac' : '#fca5a5'}` }}>
                  <p style={{ fontSize: '0.75rem', color: selectedMerchant.status_active ? '#15803d' : '#b91c1c', marginBottom: '0.25rem', fontWeight: '600' }}>Status</p>
                  <p style={{ fontSize: '0.9rem', margin: 0, fontWeight: '600', color: selectedMerchant.status_active ? '#14532d' : '#7f1d1d' }}>{selectedMerchant.status_active ? '✓ Active' : '✗ Inactive'}</p>
                </div>
                <div style={{ padding: '1rem', background: 'linear-gradient(135deg, #faf5ff, #f3e8ff)', borderRadius: '12px', border: '1px solid #d8b4fe' }}>
                  <p style={{ fontSize: '0.75rem', color: '#7c3aed', marginBottom: '0.25rem', fontWeight: '600' }}>Package</p>
                  <p style={{ fontSize: '0.9rem', margin: 0, fontWeight: '600', color: '#5b21b6', textTransform: 'capitalize' }}>{selectedMerchant.package}</p>
                </div>
              </div>

              {/* Personal Information */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1rem', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '3px', height: '18px', background: 'var(--primary-color)', borderRadius: '2px' }}></div>
                  Personal Information
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                  <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.35rem', fontWeight: '600' }}>Owner Name</p>
                    <p style={{ fontSize: '0.95rem', margin: 0, fontWeight: '500', color: '#0f172a' }}>{selectedMerchant.name}</p>
                  </div>
                  <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.35rem', fontWeight: '600' }}>Email</p>
                    <p style={{ fontSize: '0.95rem', margin: 0, color: '#0f172a' }}>{selectedMerchant.email}</p>
                  </div>
                  <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.35rem', fontWeight: '600' }}>Phone</p>
                    <p style={{ fontSize: '0.95rem', margin: 0, color: '#0f172a' }}>{selectedMerchant.phone}</p>
                  </div>
                  <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.35rem', fontWeight: '600' }}>Registration Date</p>
                    <p style={{ fontSize: '0.95rem', margin: 0, color: '#0f172a' }}>
                      {new Date(selectedMerchant.register_date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1rem', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '3px', height: '18px', background: 'var(--primary-color)', borderRadius: '2px' }}></div>
                  Address
                </h3>
                <div style={{ padding: '1.25rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', lineHeight: '1.8' }}>
                  <p style={{ fontSize: '0.95rem', margin: 0, color: '#0f172a' }}>{selectedMerchant.address}</p>
                  <p style={{ fontSize: '0.875rem', margin: '0.25rem 0 0', color: '#475569' }}>{selectedMerchant.subdistrict}, {selectedMerchant.regency}</p>
                  <p style={{ fontSize: '0.875rem', margin: '0.25rem 0 0', color: '#475569' }}>{selectedMerchant.city}, {selectedMerchant.province}</p>
                  <p style={{ fontSize: '0.875rem', margin: '0.25rem 0 0', color: '#475569', fontWeight: '600' }}>{selectedMerchant.postal_code}</p>
                </div>
              </div>

              {/* Payment Information */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1rem', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '3px', height: '18px', background: 'var(--primary-color)', borderRadius: '2px' }}></div>
                  Payment Information
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                  <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.35rem', fontWeight: '600' }}>Amount</p>
                    <p style={{ fontSize: '1.1rem', margin: 0, fontWeight: '700', color: 'var(--primary-color)' }}>Rp {parseInt(selectedMerchant.amount).toLocaleString('id-ID')}</p>
                  </div>
                  <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.35rem', fontWeight: '600' }}>Payment Status</p>
                    <p style={{ fontSize: '0.95rem', margin: 0, fontWeight: '600', color: selectedMerchant.payment_status === 'paid' ? 'var(--success-color)' : '#f59e0b', textTransform: 'capitalize' }}>{selectedMerchant.payment_status}</p>
                  </div>
                  <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.35rem', fontWeight: '600' }}>Payment Method</p>
                    <p style={{ fontSize: '0.95rem', margin: 0, color: '#0f172a', textTransform: 'capitalize' }}>{selectedMerchant.payment_method || '-'}</p>
                  </div>
                  <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.35rem', fontWeight: '600' }}>Paid At</p>
                    <p style={{ fontSize: '0.95rem', margin: 0, color: '#0f172a' }}>
                      {selectedMerchant.paid_at 
                        ? new Date(selectedMerchant.paid_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })
                        : '-'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Device & Referral */}
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1rem', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '3px', height: '18px', background: 'var(--primary-color)', borderRadius: '2px' }}></div>
                  Device & Referral
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                  <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.35rem', fontWeight: '600' }}>Device ID</p>
                    <p style={{ fontSize: '0.95rem', margin: 0, fontFamily: 'monospace', color: '#0f172a' }}>{selectedMerchant.device_id || '-'}</p>
                  </div>
                  <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.35rem', fontWeight: '600' }}>Device Name</p>
                    <p style={{ fontSize: '0.95rem', margin: 0, color: '#0f172a' }}>{selectedMerchant.device_name || '-'}</p>
                  </div>
                  <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.35rem', fontWeight: '600' }}>Device Type</p>
                    <p style={{ fontSize: '0.95rem', margin: 0, color: '#0f172a', textTransform: 'capitalize' }}>{selectedMerchant.device_type || '-'}</p>
                  </div>
                  <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.35rem', fontWeight: '600' }}>Referral Code</p>
                    <p style={{ fontSize: '0.95rem', margin: 0, fontFamily: 'monospace', color: '#0f172a' }}>{selectedMerchant.referral_code || '-'}</p>
                  </div>
                </div>
                {selectedMerchant.device_id && (
                  <div style={{ marginTop: '1rem', padding: '1rem', background: 'linear-gradient(135deg, #fef2f2, #fee2e2)', borderRadius: '10px', border: '1px solid #fca5a5' }}>
                    <p style={{ fontSize: '0.875rem', color: '#991b1b', marginBottom: '0.75rem', fontWeight: '600' }}>⚠️ Device Linked</p>
                    <button
                      onClick={handleUnlinkDevice}
                      disabled={unlinkLoading}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.6rem 1.2rem',
                        background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: unlinkLoading ? 'not-allowed' : 'pointer',
                        color: 'white',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        transition: 'all 0.2s',
                        opacity: unlinkLoading ? 0.6 : 1,
                      }}
                      onMouseEnter={(e) => {
                        if (!unlinkLoading) {
                          e.currentTarget.style.transform = 'translateY(-1px)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      {unlinkLoading ? (
                        <>
                          <Loader2 className="animate-spin" size={16} />
                          Unlinking...
                        </>
                      ) : (
                        <>
                          <Unlink size={16} />
                          Unlink Device
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedMerchant && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '700px', maxHeight: '90vh', position: 'relative', padding: 0, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', overflow: 'hidden', borderRadius: '16px' }}>
            {/* Modal Header */}
            <div style={{ padding: '2rem 2.5rem', borderBottom: '1px solid var(--border-color)', background: 'linear-gradient(135deg, #fef3c7, #fde68a)' }}>
              <button onClick={closeEditModal} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'white', border: '1px solid var(--border-color)', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)', transition: 'all 0.2s' }}><X size={18} /></button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                  <Edit2 size={24} />
                </div>
                <div>
                  <h2 style={{ marginBottom: 0, fontSize: '1.5rem' }}>Edit Merchant</h2>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#92400e' }}>Update merchant information</p>
                </div>
              </div>
            </div>
            
            {/* Modal Body */}
            <div style={{ padding: '2rem 2.5rem', overflow: 'auto', maxHeight: 'calc(90vh - 220px)' }}>
              <form onSubmit={handleUpdateMerchant}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
                  <div className="form-group">
                    <label className="form-label">Owner Name</label>
                    <input type="text" className="form-input" required value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Merchant Name</label>
                    <input type="text" className="form-input" required value={editForm.merchant_name} onChange={(e) => setEditForm({...editForm, merchant_name: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input type="email" className="form-input" required value={editForm.email} onChange={(e) => setEditForm({...editForm, email: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input type="tel" className="form-input" required value={editForm.phone} onChange={(e) => setEditForm({...editForm, phone: e.target.value})} />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Full Address</label>
                    <textarea className="form-input" required value={editForm.address} onChange={(e) => setEditForm({...editForm, address: e.target.value})} style={{ minHeight: '80px' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">City</label>
                    <input type="text" className="form-input" required value={editForm.city} onChange={(e) => setEditForm({...editForm, city: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Subdistrict</label>
                    <input type="text" className="form-input" required value={editForm.subdistrict} onChange={(e) => setEditForm({...editForm, subdistrict: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Regency</label>
                    <input type="text" className="form-input" required value={editForm.regency} onChange={(e) => setEditForm({...editForm, regency: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Province</label>
                    <input type="text" className="form-input" required value={editForm.province} onChange={(e) => setEditForm({...editForm, province: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Postal Code</label>
                    <input type="text" className="form-input" required value={editForm.postal_code} onChange={(e) => setEditForm({...editForm, postal_code: e.target.value})} />
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'flex-end' }}>
                  <button type="button" className="btn-secondary" style={{ width: 'auto' }} onClick={closeEditModal}>Cancel</button>
                  <button type="submit" className="btn-primary" style={{ width: 'auto' }} disabled={editLoading}>
                    {editLoading ? <Loader2 className="animate-spin" size={18} /> : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
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
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>This action cannot be undone. This merchant will be permanently removed from the system.</p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowDeleteConfirm(null)}>Cancel</button>
              <button className="btn-primary" style={{ flex: 1, backgroundColor: '#ef4444', borderColor: '#ef4444' }} onClick={() => handleDelete(showDeleteConfirm)} disabled={deleteLoading}>
                {deleteLoading ? <Loader2 className="animate-spin" size={18} /> : 'Delete Merchant'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Extend Active Period Confirmation Modal */}
      {showExtendConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '450px', textAlign: 'center', padding: '2.5rem' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20M2 12h20"/>
                <circle cx="12" cy="12" r="10"/>
              </svg>
            </div>
            <h2 style={{ marginBottom: '0.5rem' }}>Extend Active Period?</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Are you sure you want to extend the active period for this merchant?</p>
            <div style={{ padding: '1.25rem', background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', borderRadius: '10px', marginBottom: '2rem', border: '1px solid #86efac' }}>
              <p style={{ fontWeight: '600', color: '#14532d', margin: '0 0 0.75rem', fontSize: '1rem' }}>{showExtendConfirm.merchant_name}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span style={{ color: '#15803d' }}>Today:</span>
                  <span style={{ fontWeight: '600', color: '#14532d' }}>
                    {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span style={{ color: '#15803d' }}>New Register Date:</span>
                  <span style={{ fontWeight: '600', color: '#14532d' }}>
                    {new Date(new Date().getTime() + (7 * 24 * 60 * 60 * 1000)).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>
                <div style={{ borderTop: '1px solid #86efac', margin: '0.5rem 0' }}></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span style={{ color: '#15803d' }}>Extension:</span>
                  <span style={{ fontWeight: '700', color: '#16a34a' }}>+7 days from today</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowExtendConfirm(null)}>Cancel</button>
              <button className="btn-primary" style={{ flex: 1, backgroundColor: '#22c55e', borderColor: '#22c55e' }} onClick={confirmExtendActive} disabled={extendLoading}>
                {extendLoading ? <Loader2 className="animate-spin" size={18} /> : 'Extend 7 Days'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unlink Device Confirmation Modal */}
      {showUnlinkConfirm && selectedMerchant && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px', textAlign: 'center', padding: '2.5rem' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <Unlink size={32} />
            </div>
            <h2 style={{ marginBottom: '0.5rem' }}>Unlink Device?</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Are you sure you want to unlink this device from the merchant?</p>
            <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', marginBottom: '2rem', border: '1px solid var(--border-color)' }}>
              <p style={{ fontWeight: '600', color: '#0f172a', margin: '0 0 0.25rem' }}>{selectedMerchant.merchant_name}</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>Device: {selectedMerchant.device_name || selectedMerchant.device_id}</p>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowUnlinkConfirm(false)}>Cancel</button>
              <button className="btn-primary" style={{ flex: 1, backgroundColor: '#ef4444', borderColor: '#ef4444' }} onClick={confirmUnlinkDevice} disabled={unlinkLoading}>
                {unlinkLoading ? <Loader2 className="animate-spin" size={18} /> : 'Unlink Device'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
