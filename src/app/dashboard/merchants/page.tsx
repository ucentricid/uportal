"use client";

import { useState, useEffect } from 'react';
import { Store, Loader2, AlertCircle, Search, RefreshCw, Eye, X, Mail, Phone, MapPin, Calendar, CreditCard, Edit2, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
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
  payment_status: string;
  register_date: string;
  status_active: boolean;
}

export default function MerchantsPage() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [merchantToDelete, setMerchantToDelete] = useState<Merchant | null>(null);
  const [editForm, setEditForm] = useState({
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
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchMerchants = async (page: number = 1, searchTerm: string = '') => {
    setLoading(true);
    setError('');

    try {
      const queryParams: any = {
        page: page.toString(),
        limit: '20',
      };

      if (searchTerm) {
        queryParams.search = searchTerm;
      }

      const queryString = new URLSearchParams(queryParams).toString();
      // Use local API proxy to avoid CORS issues
      const url = `/api/merchants?${queryString}`;

      const response = await axios.get(url);

      if (response.data.success) {
        setMerchants(response.data.data || []);
        setTotalPages(response.data.pagination?.total_pages || 1);
        setTotalItems(response.data.pagination?.total_items || 0);
      } else {
        setError('Failed to fetch merchants');
      }
    } catch (err: any) {
      console.error('Error fetching merchants:', err);
      setError(err.response?.data?.error || 'Failed to fetch merchants. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMerchants(currentPage, search);
  }, [currentPage]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchMerchants(1, search);
  };

  const handleRefresh = () => {
    fetchMerchants(currentPage, search);
  };

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

  const handleDelete = (merchant: Merchant) => {
    setMerchantToDelete(merchant);
    setShowDeleteConfirm(true);
  };

  const closeDeleteConfirm = () => {
    setShowDeleteConfirm(false);
    setMerchantToDelete(null);
  };

  const handleUpdateMerchant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMerchant) return;

    setEditLoading(true);
    setError('');

    try {
      // Use local API proxy to avoid CORS issues
      const url = `/api/merchants/${selectedMerchant.token_number}`;

      const response = await axios.put(url, editForm, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      if (response.data.success) {
        // Refresh the list
        fetchMerchants(currentPage, search);
        closeEditModal();
        // Show success notification
        window.dispatchEvent(new CustomEvent('show-notification', {
          detail: { message: 'Merchant updated successfully', type: 'success' }
        }));
      } else {
        setError(response.data.error || 'Failed to update merchant');
      }
    } catch (err: any) {
      console.error('Error updating merchant:', err);
      if (err.response) {
        // Server responded with error status
        setError(err.response.data?.error || 'Failed to update merchant');
      } else if (err.request) {
        // Request was made but no response
        setError('Network error. Please check your connection.');
      } else {
        setError('Failed to update merchant. Please try again.');
      }
    } finally {
      setEditLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!merchantToDelete) return;

    setDeleteLoading(true);
    setError('');

    try {
      // Use local API proxy to avoid CORS issues
      const url = `/api/merchants/${merchantToDelete.token_number}`;

      const response = await axios.delete(url, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      if (response.data.success) {
        // Refresh the list
        fetchMerchants(currentPage, search);
        closeDeleteConfirm();
        // Show success notification
        window.dispatchEvent(new CustomEvent('show-notification', {
          detail: { message: 'Merchant deleted successfully', type: 'success' }
        }));
      } else {
        setError(response.data.error || 'Failed to delete merchant');
      }
    } catch (err: any) {
      console.error('Error deleting merchant:', err);
      if (err.response) {
        // Server responded with error status
        setError(err.response.data?.error || 'Failed to delete merchant');
      } else if (err.request) {
        // Request was made but no response
        setError('Network error. Please check your connection.');
      } else {
        setError('Failed to delete merchant. Please try again.');
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading && merchants.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <Loader2 className="animate-spin" size={40} style={{ color: 'var(--primary-color)' }} />
          <p style={{ color: 'var(--text-muted)' }}>Loading merchants...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Store size={32} style={{ color: 'var(--primary-color)' }} />
            Merchants
          </h1>
          <p>Manage and view all registered merchants</p>
        </div>
        <button 
          onClick={handleRefresh}
          className="btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          disabled={loading}
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Search Bar */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search by name, email, phone, or merchant name..."
              className="form-input"
              style={{ paddingLeft: '40px' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            Search
          </button>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <AlertCircle size={20} style={{ color: '#ef4444' }} />
          <p style={{ margin: 0, color: '#ef4444' }}>{error}</p>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div className="card" style={{ padding: '1.5rem' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Total Merchants</p>
          <h3 style={{ fontSize: '2rem', fontWeight: '700', margin: 0 }}>{totalItems}</h3>
        </div>
        <div className="card" style={{ padding: '1.5rem' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Active</p>
          <h3 style={{ fontSize: '2rem', fontWeight: '700', margin: 0, color: '#10b981' }}>
            {merchants.filter(m => m.status_active).length}
          </h3>
        </div>
        <div className="card" style={{ padding: '1.5rem' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>This Page</p>
          <h3 style={{ fontSize: '2rem', fontWeight: '700', margin: 0 }}>{merchants.length}</h3>
        </div>
      </div>

      {/* Merchants Table */}
      <div className="card" style={{ padding: '1.5rem', overflow: 'hidden' }}>
        {merchants.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <Store size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
            <p>No merchants found</p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Token</th>
                    <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Merchant</th>
                    <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Owner</th>
                    <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Email</th>
                    <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Phone</th>
                    <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Package</th>
                    <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Status</th>
                    <th style={{ textAlign: 'center', padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {merchants.map((merchant) => (
                    <tr key={merchant.token_number} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '1rem', fontSize: '0.85rem', fontFamily: 'monospace' }}>
                        {merchant.token_number}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <p style={{ fontWeight: '600', margin: 0 }}>{merchant.merchant_name}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                          {merchant.city}, {merchant.province}
                        </p>
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.85rem' }}>{merchant.name}</td>
                      <td style={{ padding: '1rem', fontSize: '0.85rem' }}>{merchant.email}</td>
                      <td style={{ padding: '1rem', fontSize: '0.85rem' }}>{merchant.phone}</td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ 
                          padding: '0.25rem 0.75rem', 
                          borderRadius: '20px', 
                          fontSize: '0.75rem', 
                          fontWeight: '600',
                          background: merchant.package === 'premium' ? 'rgba(79, 70, 229, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                          color: merchant.package === 'premium' ? '#4f46e5' : '#10b981'
                        }}>
                          {merchant.package}
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ 
                          padding: '0.25rem 0.75rem', 
                          borderRadius: '20px', 
                          fontSize: '0.75rem', 
                          fontWeight: '600',
                          background: merchant.status_active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          color: merchant.status_active ? '#10b981' : '#ef4444'
                        }}>
                          {merchant.status_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleViewDetail(merchant)}
                            style={{
                              padding: '0.5rem',
                              background: 'rgba(79, 70, 229, 0.1)',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              color: '#4f46e5',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(79, 70, 229, 0.2)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'rgba(79, 70, 229, 0.1)';
                            }}
                            title="View Details"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => handleEdit(merchant)}
                            style={{
                              padding: '0.5rem',
                              background: 'rgba(245, 158, 11, 0.1)',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              color: '#f59e0b',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(245, 158, 11, 0.2)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'rgba(245, 158, 11, 0.1)';
                            }}
                            title="Edit Merchant"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(merchant)}
                            style={{
                              padding: '0.5rem',
                              background: 'rgba(239, 68, 68, 0.1)',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              color: '#ef4444',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                            }}
                            title="Delete Merchant"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e2e8f0' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Page {currentPage} of {totalPages} ({totalItems} total)
                </p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1 || loading}
                    className="btn-secondary"
                    style={{ padding: '0.5rem 1rem' }}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages || loading}
                    className="btn-secondary"
                    style={{ padding: '0.5rem 1rem' }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedMerchant && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
          onClick={closeDetailModal}
        >
          <div 
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.98)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              maxWidth: '700px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              padding: '1.5rem 2rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem', color: '#ffffff' }}>Merchant Details</h2>
                <p style={{ fontSize: '0.85rem', color: '#cbd5e1', margin: 0 }}>{selectedMerchant.merchant_name}</p>
              </div>
              <button
                onClick={closeDetailModal}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.5rem',
                  cursor: 'pointer',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '2rem' }}>
              {/* Token & Status */}
              <div style={{
                display: 'flex',
                gap: '1rem',
                marginBottom: '2rem',
                padding: '1rem',
                background: 'rgba(30, 41, 59, 0.5)',
                borderRadius: '12px'
              }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Token Number</p>
                  <p style={{ fontSize: '1.1rem', fontWeight: '600', color: '#ffffff', fontFamily: 'monospace' }}>
                    {selectedMerchant.token_number}
                  </p>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Order ID</p>
                  <p style={{ fontSize: '0.9rem', color: '#ffffff', fontFamily: 'monospace' }}>
                    {selectedMerchant.order_id}
                  </p>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Status</p>
                  <span style={{ 
                    padding: '0.35rem 0.75rem', 
                    borderRadius: '20px', 
                    fontSize: '0.85rem', 
                    fontWeight: '600',
                    background: selectedMerchant.status_active ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                    color: selectedMerchant.status_active ? '#10b981' : '#ef4444'
                  }}>
                    {selectedMerchant.status_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {/* Personal Information */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Store size={20} style={{ color: '#4f46e5' }} />
                  Personal Information
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem'
                }}>
                  <div style={{ padding: '1rem', background: 'rgba(30, 41, 59, 0.5)', borderRadius: '8px' }}>
                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Owner Name</p>
                    <p style={{ fontSize: '0.95rem', color: '#ffffff', fontWeight: '500' }}>{selectedMerchant.name}</p>
                  </div>
                  <div style={{ padding: '1rem', background: 'rgba(30, 41, 59, 0.5)', borderRadius: '8px' }}>
                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Email</p>
                    <p style={{ fontSize: '0.95rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Mail size={16} style={{ color: '#4f46e5' }} />
                      {selectedMerchant.email}
                    </p>
                  </div>
                  <div style={{ padding: '1rem', background: 'rgba(30, 41, 59, 0.5)', borderRadius: '8px' }}>
                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Phone</p>
                    <p style={{ fontSize: '0.95rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Phone size={16} style={{ color: '#4f46e5' }} />
                      {selectedMerchant.phone}
                    </p>
                  </div>
                  <div style={{ padding: '1rem', background: 'rgba(30, 41, 59, 0.5)', borderRadius: '8px' }}>
                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Registration Date</p>
                    <p style={{ fontSize: '0.95rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Calendar size={16} style={{ color: '#4f46e5' }} />
                      {new Date(selectedMerchant.register_date).toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MapPin size={20} style={{ color: '#4f46e5' }} />
                  Address
                </h3>
                <div style={{ padding: '1rem', background: 'rgba(30, 41, 59, 0.5)', borderRadius: '8px' }}>
                  <p style={{ fontSize: '0.95rem', color: '#ffffff', marginBottom: '0.5rem' }}>
                    {selectedMerchant.address}
                  </p>
                  <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                    {selectedMerchant.subdistrict}, {selectedMerchant.regency}, {selectedMerchant.city}
                  </p>
                  <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                    {selectedMerchant.province} - {selectedMerchant.postal_code}
                  </p>
                </div>
              </div>

              {/* Package & Payment */}
              <div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CreditCard size={20} style={{ color: '#4f46e5' }} />
                  Package & Payment
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '1rem'
                }}>
                  <div style={{ padding: '1rem', background: 'rgba(30, 41, 59, 0.5)', borderRadius: '8px' }}>
                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Package</p>
                    <span style={{ 
                      padding: '0.35rem 0.75rem', 
                      borderRadius: '20px', 
                      fontSize: '0.85rem', 
                      fontWeight: '600',
                      background: selectedMerchant.package === 'premium' ? 'rgba(79, 70, 229, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                      color: selectedMerchant.package === 'premium' ? '#818cf8' : '#10b981',
                      display: 'inline-block'
                    }}>
                      {selectedMerchant.package}
                    </span>
                  </div>
                  <div style={{ padding: '1rem', background: 'rgba(30, 41, 59, 0.5)', borderRadius: '8px' }}>
                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Amount</p>
                    <p style={{ fontSize: '0.95rem', color: '#ffffff', fontWeight: '600' }}>
                      Rp {parseInt(selectedMerchant.amount).toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div style={{ padding: '1rem', background: 'rgba(30, 41, 59, 0.5)', borderRadius: '8px' }}>
                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Payment Status</p>
                    <span style={{ 
                      padding: '0.35rem 0.75rem', 
                      borderRadius: '20px', 
                      fontSize: '0.85rem', 
                      fontWeight: '600',
                      background: selectedMerchant.payment_status === 'paid' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                      color: selectedMerchant.payment_status === 'paid' ? '#10b981' : '#f59e0b',
                      display: 'inline-block',
                      textTransform: 'capitalize'
                    }}>
                      {selectedMerchant.payment_status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '1.5rem 2rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={closeDetailModal}
                className="btn-primary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedMerchant && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
          onClick={closeEditModal}
        >
          <div 
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.98)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              maxWidth: '700px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              padding: '1.5rem 2rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem', color: '#ffffff' }}>Edit Merchant</h2>
                <p style={{ fontSize: '0.85rem', color: '#cbd5e1', margin: 0 }}>{selectedMerchant.token_number}</p>
              </div>
              <button
                onClick={closeEditModal}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.5rem',
                  cursor: 'pointer',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateMerchant} style={{ padding: '2rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ color: '#e2e8f0' }}>Owner Name *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    style={{ color: '#ffffff', backgroundColor: 'rgba(30, 41, 59, 0.8)' }}
                    value={editForm.name}
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ color: '#e2e8f0' }}>Merchant Name *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    style={{ color: '#ffffff', backgroundColor: 'rgba(30, 41, 59, 0.8)' }}
                    value={editForm.merchant_name}
                    onChange={(e) => setEditForm({...editForm, merchant_name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ color: '#e2e8f0' }}>Email *</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    style={{ color: '#ffffff', backgroundColor: 'rgba(30, 41, 59, 0.8)' }}
                    value={editForm.email}
                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ color: '#e2e8f0' }}>Phone *</label>
                  <input 
                    type="tel" 
                    className="form-input" 
                    style={{ color: '#ffffff', backgroundColor: 'rgba(30, 41, 59, 0.8)' }}
                    value={editForm.phone}
                    onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label" style={{ color: '#e2e8f0' }}>Address *</label>
                  <textarea 
                    className="form-input" 
                    style={{ color: '#ffffff', backgroundColor: 'rgba(30, 41, 59, 0.8)', minHeight: '80px' }}
                    value={editForm.address}
                    onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ color: '#e2e8f0' }}>City *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    style={{ color: '#ffffff', backgroundColor: 'rgba(30, 41, 59, 0.8)' }}
                    value={editForm.city}
                    onChange={(e) => setEditForm({...editForm, city: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ color: '#e2e8f0' }}>Subdistrict *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    style={{ color: '#ffffff', backgroundColor: 'rgba(30, 41, 59, 0.8)' }}
                    value={editForm.subdistrict}
                    onChange={(e) => setEditForm({...editForm, subdistrict: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ color: '#e2e8f0' }}>Regency *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    style={{ color: '#ffffff', backgroundColor: 'rgba(30, 41, 59, 0.8)' }}
                    value={editForm.regency}
                    onChange={(e) => setEditForm({...editForm, regency: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ color: '#e2e8f0' }}>Province *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    style={{ color: '#ffffff', backgroundColor: 'rgba(30, 41, 59, 0.8)' }}
                    value={editForm.province}
                    onChange={(e) => setEditForm({...editForm, province: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ color: '#e2e8f0' }}>Postal Code *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    style={{ color: '#ffffff', backgroundColor: 'rgba(30, 41, 59, 0.8)' }}
                    value={editForm.postal_code}
                    onChange={(e) => setEditForm({...editForm, postal_code: e.target.value})}
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="error-message" style={{ marginTop: '1.5rem', marginBottom: 0 }}>
                  {error}
                </div>
              )}

              <div style={{
                padding: '1.5rem 0 0',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                marginTop: '2rem',
                display: 'flex',
                gap: '1rem',
                justifyContent: 'flex-end'
              }}>
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={closeEditModal}
                  disabled={editLoading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={editLoading}
                >
                  {editLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Updating...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={18} />
                      Update Merchant
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && merchantToDelete && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
          onClick={closeDeleteConfirm}
        >
          <div 
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.98)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              maxWidth: '450px',
              width: '100%',
              padding: '2.5rem',
              textAlign: 'center',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ 
              width: '64px', 
              height: '64px', 
              borderRadius: '50%', 
              background: 'rgba(239, 68, 68, 0.1)', 
              color: '#ef4444', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 1.5rem' 
            }}>
              <AlertTriangle size={32} />
            </div>
            
            <h2 style={{ marginBottom: '0.5rem', color: '#ffffff' }}>Delete Merchant?</h2>
            <p style={{ color: '#cbd5e1', marginBottom: '1rem', fontSize: '0.9rem' }}>
              Are you sure you want to delete this merchant?
            </p>
            <div style={{
              padding: '1rem',
              background: 'rgba(30, 41, 59, 0.5)',
              borderRadius: '8px',
              marginBottom: '2rem'
            }}>
              <p style={{ fontWeight: '600', color: '#ffffff', margin: '0 0 0.25rem' }}>
                {merchantToDelete.merchant_name}
              </p>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0 }}>
                Token: {merchantToDelete.token_number}
              </p>
            </div>
            
            <p style={{ fontSize: '0.8rem', color: '#f59e0b', marginBottom: '2rem' }}>
              ⚠️ This action cannot be undone!
            </p>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                className="btn-secondary" 
                style={{ flex: 1 }} 
                onClick={closeDeleteConfirm}
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button 
                className="btn-primary" 
                style={{ 
                  flex: 1,
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                }} 
                onClick={handleConfirmDelete}
                disabled={deleteLoading}
              >
                {deleteLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={18} />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
