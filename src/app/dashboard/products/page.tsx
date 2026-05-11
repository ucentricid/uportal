"use client";

import { useState, useEffect } from 'react';
import { Package, Loader2, AlertCircle, Search, RefreshCw, Eye, X, Edit2, Trash2, AlertTriangle, CheckCircle, Upload, Plus, DollarSign } from 'lucide-react';
import axios from 'axios';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: string;
  photo_url: string | null;
  description: string | null;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    price: '',
    photo_url: '',
    description: '',
    status: 'active'
  });
  const [createForm, setCreateForm] = useState({
    name: '',
    price: '',
    photo_url: '',
    description: '',
    status: 'active'
  });
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const fetchProducts = async (page: number = 1, searchTerm: string = '') => {
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
      const url = `/api/products?${queryString}`;

      const response = await axios.get(url);

      if (response.data.success) {
        setProducts(response.data.data || []);
        setTotalPages(response.data.pagination?.total_pages || 1);
        setTotalItems(response.data.pagination?.total_items || 0);
      } else {
        setError('Failed to fetch products');
      }
    } catch (err: any) {
      console.error('Error fetching products:', err);
      setError(err.response?.data?.error || 'Failed to fetch products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(currentPage, search);
  }, [currentPage]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchProducts(1, search);
  };

  const handleRefresh = () => {
    fetchProducts(currentPage, search);
  };

  const handleViewDetail = (product: Product) => {
    setSelectedProduct(product);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedProduct(null);
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setEditForm({
      name: product.name,
      price: product.price,
      photo_url: product.photo_url || '',
      description: product.description || '',
      status: product.status
    });
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedProduct(null);
  };

  const handleDelete = (product: Product) => {
    setProductToDelete(product);
    setShowDeleteConfirm(true);
  };

  const closeDeleteConfirm = () => {
    setShowDeleteConfirm(false);
    setProductToDelete(null);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('photo', file);

      const response = await axios.post('/api/products/upload-photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        const photoUrl = response.data.data.url;
        // Update both create and edit forms
        if (showCreateModal) {
          setCreateForm({ ...createForm, photo_url: photoUrl });
        } else if (showEditModal) {
          setEditForm({ ...editForm, photo_url: photoUrl });
        }
        window.dispatchEvent(new CustomEvent('show-notification', {
          detail: { message: 'Photo uploaded successfully', type: 'success' }
        }));
      } else {
        setError(response.data.error || 'Failed to upload photo');
      }
    } catch (err: any) {
      console.error('Error uploading photo:', err);
      setError(err.response?.data?.error || 'Failed to upload photo');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setError('');

    try {
      const body: any = {
        name: createForm.name,
        price: parseFloat(createForm.price),
        status: createForm.status,
      };

      if (createForm.photo_url) body.photo_url = createForm.photo_url;
      if (createForm.description) body.description = createForm.description;

      const response = await axios.post('/api/products', body, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.data.success) {
        fetchProducts(currentPage, search);
        setShowCreateModal(false);
        setCreateForm({ name: '', price: '', photo_url: '', description: '', status: 'active' });
        window.dispatchEvent(new CustomEvent('show-notification', {
          detail: { message: 'Product created successfully', type: 'success' }
        }));
      } else {
        setError(response.data.error || 'Failed to create product');
      }
    } catch (err: any) {
      console.error('Error creating product:', err);
      setError(err.response?.data?.error || 'Failed to create product');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    setEditLoading(true);
    setError('');

    try {
      const body: any = {
        name: editForm.name,
        price: parseFloat(editForm.price),
        status: editForm.status,
      };

      if (editForm.photo_url) body.photo_url = editForm.photo_url;
      if (editForm.description) body.description = editForm.description;

      const response = await axios.put(`/api/products/${selectedProduct.slug}`, body, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.data.success) {
        fetchProducts(currentPage, search);
        closeEditModal();
        window.dispatchEvent(new CustomEvent('show-notification', {
          detail: { message: 'Product updated successfully', type: 'success' }
        }));
      } else {
        setError(response.data.error || 'Failed to update product');
      }
    } catch (err: any) {
      console.error('Error updating product:', err);
      setError(err.response?.data?.error || 'Failed to update product');
    } finally {
      setEditLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;

    setDeleteLoading(true);
    setError('');

    try {
      const response = await axios.delete(`/api/products/${productToDelete.slug}`);

      if (response.data.success) {
        fetchProducts(currentPage, search);
        closeDeleteConfirm();
        window.dispatchEvent(new CustomEvent('show-notification', {
          detail: { message: 'Product deleted successfully', type: 'success' }
        }));
      } else {
        setError(response.data.error || 'Failed to delete product');
      }
    } catch (err: any) {
      console.error('Error deleting product:', err);
      setError(err.response?.data?.error || 'Failed to delete product');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleImageError = (productId: string) => {
    setImageErrors(prev => ({
      ...prev,
      [productId]: true
    }));
  };

  if (loading && products.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <Loader2 className="animate-spin" size={40} style={{ color: 'var(--primary-color)' }} />
          <p style={{ color: 'var(--text-muted)' }}>Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Package size={32} style={{ color: 'var(--primary-color)' }} />
            Products
          </h1>
          <p>Manage your product catalog</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Plus size={18} />
            Add Product
          </button>
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
      </div>

      {/* Search Bar */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search by name, slug, or description..."
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
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Total Products</p>
          <h3 style={{ fontSize: '2rem', fontWeight: '700', margin: 0 }}>{totalItems}</h3>
        </div>
        <div className="card" style={{ padding: '1.5rem' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Active</p>
          <h3 style={{ fontSize: '2rem', fontWeight: '700', margin: 0, color: '#10b981' }}>
            {products.filter(p => p.status === 'active').length}
          </h3>
        </div>
        <div className="card" style={{ padding: '1.5rem' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>This Page</p>
          <h3 style={{ fontSize: '2rem', fontWeight: '700', margin: 0 }}>{products.length}</h3>
        </div>
      </div>

      {/* Products Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {products.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <Package size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
            <p>No products found</p>
          </div>
        ) : (
          products.map((product) => (
            <div key={product.id} className="card" style={{ overflow: 'hidden' }}>
              {/* Product Image */}
              <div style={{ height: '200px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {product.photo_url && !imageErrors[product.id] ? (
                  <img 
                    src={product.photo_url} 
                    alt={product.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={() => handleImageError(product.id)}
                  />
                ) : (
                  <Package size={48} style={{ color: '#cbd5e1' }} />
                )}
              </div>

              {/* Product Info */}
              <div style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '600', margin: 0, flex: 1 }}>{product.name}</h3>
                  <span style={{ 
                    padding: '0.25rem 0.75rem', 
                    borderRadius: '20px', 
                    fontSize: '0.75rem', 
                    fontWeight: '600',
                    background: product.status === 'active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: product.status === 'active' ? '#10b981' : '#ef4444'
                  }}>
                    {product.status}
                  </span>
                </div>

                <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary-color)', margin: '0 0 0.5rem' }}>
                  Rp {parseInt(product.price).toLocaleString('id-ID')}
                </p>

                {product.description && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 1rem', lineHeight: '1.5' }}>
                    {product.description.substring(0, 100)}{product.description.length > 100 ? '...' : ''}
                  </p>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                  <button
                    onClick={() => handleViewDetail(product)}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      background: 'rgba(79, 70, 229, 0.1)',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      color: '#4f46e5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      fontSize: '0.85rem',
                      fontWeight: '500'
                    }}
                  >
                    <Eye size={16} />
                    Detail
                  </button>
                  <button
                    onClick={() => handleEdit(product)}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      background: 'rgba(245, 158, 11, 0.1)',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      color: '#f59e0b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      fontSize: '0.85rem',
                      fontWeight: '500'
                    }}
                  >
                    <Edit2 size={16} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(product)}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      color: '#ef4444',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      fontSize: '0.85rem',
                      fontWeight: '500'
                    }}
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem' }}>
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

      {/* Create Product Modal */}
      {showCreateModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
          onClick={() => setShowCreateModal(false)}
        >
          <div 
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              maxWidth: '700px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              padding: '1.5rem 2rem',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem', color: '#0f172a' }}>Add New Product</h2>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>Fill in the product details</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.5rem',
                  cursor: 'pointer',
                  color: '#0f172a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} style={{ padding: '2rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label" style={{ color: '#334155' }}>Product Name *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    style={{ color: '#0f172a', backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}
                    value={createForm.name}
                    onChange={(e) => setCreateForm({...createForm, name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ color: '#334155' }}>Price *</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    style={{ color: '#0f172a', backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}
                    value={createForm.price}
                    onChange={(e) => setCreateForm({...createForm, price: e.target.value})}
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ color: '#334155' }}>Status</label>
                  <select 
                    className="form-input" 
                    style={{ color: '#0f172a', backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}
                    value={createForm.status}
                    onChange={(e) => setCreateForm({...createForm, status: e.target.value})}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label" style={{ color: '#334155' }}>Product Photo</label>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      style={{ flex: 1 }}
                    />
                    {uploadLoading && <Loader2 className="animate-spin" size={20} style={{ color: '#4f46e5' }} />}
                  </div>
                  {createForm.photo_url && (
                    <p style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.5rem' }}>✓ Photo uploaded</p>
                  )}
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label" style={{ color: '#334155' }}>Description</label>
                  <textarea 
                    className="form-input" 
                    style={{ minHeight: '100px', color: '#0f172a', backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}
                    value={createForm.description}
                    onChange={(e) => setCreateForm({...createForm, description: e.target.value})}
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
                borderTop: '1px solid #e2e8f0',
                marginTop: '2rem',
                display: 'flex',
                gap: '1rem',
                justifyContent: 'flex-end'
              }}>
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                  disabled={createLoading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={createLoading}
                >
                  {createLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Creating...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={18} />
                      Create Product
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && selectedProduct && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              maxWidth: '700px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              padding: '1.5rem 2rem',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem', color: '#0f172a' }}>Edit Product</h2>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>{selectedProduct.slug}</p>
              </div>
              <button
                onClick={closeEditModal}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.5rem',
                  cursor: 'pointer',
                  color: '#0f172a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateProduct} style={{ padding: '2rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label" style={{ color: '#334155' }}>Product Name *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    style={{ color: '#0f172a', backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}
                    value={editForm.name}
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ color: '#334155' }}>Price *</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    style={{ color: '#0f172a', backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}
                    value={editForm.price}
                    onChange={(e) => setEditForm({...editForm, price: e.target.value})}
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ color: '#334155' }}>Status</label>
                  <select 
                    className="form-input" 
                    style={{ color: '#0f172a', backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}
                    value={editForm.status}
                    onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label" style={{ color: '#334155' }}>Product Photo</label>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      style={{ flex: 1 }}
                    />
                    {uploadLoading && <Loader2 className="animate-spin" size={20} style={{ color: '#4f46e5' }} />}
                  </div>
                  {editForm.photo_url && (
                    <p style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.5rem' }}>✓ Photo uploaded</p>
                  )}
                  {selectedProduct.photo_url && !editForm.photo_url && (
                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem' }}>Current: {selectedProduct.photo_url}</p>
                  )}
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label" style={{ color: '#334155' }}>Description</label>
                  <textarea 
                    className="form-input" 
                    style={{ minHeight: '100px', color: '#0f172a', backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}
                    value={editForm.description}
                    onChange={(e) => setEditForm({...editForm, description: e.target.value})}
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
                borderTop: '1px solid #e2e8f0',
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
                      Update Product
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Detail Modal */}
      {showDetailModal && selectedProduct && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              maxWidth: '700px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              padding: '1.5rem 2rem',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem', color: '#0f172a' }}>Product Details</h2>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>{selectedProduct.name}</p>
              </div>
              <button
                onClick={closeDetailModal}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.5rem',
                  cursor: 'pointer',
                  color: '#0f172a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '2rem' }}>
              {/* Product Image */}
              <div style={{
                height: '300px',
                background: '#f1f5f9',
                borderRadius: '12px',
                overflow: 'hidden',
                marginBottom: '2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {selectedProduct.photo_url && !imageErrors[selectedProduct.id] ? (
                  <img 
                    src={selectedProduct.photo_url} 
                    alt={selectedProduct.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={() => handleImageError(selectedProduct.id)}
                  />
                ) : (
                  <Package size={64} style={{ color: '#cbd5e1' }} />
                )}
              </div>

              {/* Product Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Product Name</p>
                  <p style={{ fontSize: '1rem', color: '#0f172a', fontWeight: '600' }}>{selectedProduct.name}</p>
                </div>
                <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Slug</p>
                  <p style={{ fontSize: '0.9rem', color: '#0f172a', fontFamily: 'monospace' }}>{selectedProduct.slug}</p>
                </div>
                <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Price</p>
                  <p style={{ fontSize: '1.25rem', color: '#4f46e5', fontWeight: '700' }}>
                    Rp {parseInt(selectedProduct.price).toLocaleString('id-ID')}
                  </p>
                </div>
                <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Status</p>
                  <span style={{ 
                    padding: '0.35rem 0.75rem', 
                    borderRadius: '20px', 
                    fontSize: '0.85rem', 
                    fontWeight: '600',
                    background: selectedProduct.status === 'active' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                    color: selectedProduct.status === 'active' ? '#10b981' : '#ef4444'
                  }}>
                    {selectedProduct.status}
                  </span>
                </div>
                {selectedProduct.description && (
                  <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', gridColumn: '1 / -1' }}>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem' }}>Description</p>
                    <p style={{ fontSize: '0.95rem', color: '#0f172a', lineHeight: '1.6' }}>{selectedProduct.description}</p>
                  </div>
                )}
                <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Created At</p>
                  <p style={{ fontSize: '0.9rem', color: '#0f172a' }}>
                    {new Date(selectedProduct.created_at).toLocaleDateString('id-ID', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Updated At</p>
                  <p style={{ fontSize: '0.9rem', color: '#0f172a' }}>
                    {new Date(selectedProduct.updated_at).toLocaleDateString('id-ID', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>

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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && productToDelete && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              maxWidth: '450px',
              width: '100%',
              padding: '2.5rem',
              textAlign: 'center',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
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
            
            <h2 style={{ marginBottom: '0.5rem', color: '#0f172a' }}>Delete Product?</h2>
            <p style={{ color: '#64748b', marginBottom: '1rem', fontSize: '0.9rem' }}>
              Are you sure you want to delete this product?
            </p>
            <div style={{
              padding: '1rem',
              background: '#f8fafc',
              borderRadius: '8px',
              marginBottom: '2rem'
            }}>
              <p style={{ fontWeight: '600', color: '#0f172a', margin: '0 0 0.25rem' }}>
                {productToDelete.name}
              </p>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                Slug: {productToDelete.slug}
              </p>
            </div>
            
            <p style={{ fontSize: '0.8rem', color: '#f59e0b', marginBottom: '2rem' }}>
              ⚠️ This action cannot be undone! Product photo will also be deleted.
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
