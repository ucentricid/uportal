"use client";

import { useState, useEffect } from 'react';
import { 
  Package, 
  Loader2, 
  Search, 
  Eye, 
  X, 
  Edit2, 
  Trash2, 
  AlertTriangle,
  Shield,
  Plus
} from 'lucide-react';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    name: string;
    price: string;
    photo_url: string;
    description: string;
    status: 'active' | 'inactive';
  }>({
    name: '',
    price: '',
    photo_url: '',
    description: '',
    status: 'active'
  });
  const [createForm, setCreateForm] = useState<{
    name: string;
    price: string;
    photo_url: string;
    description: string;
    status: 'active' | 'inactive';
  }>({
    name: '',
    price: '',
    photo_url: '',
    description: '',
    status: 'active'
  });
  const [editLoading, setEditLoading] = useState<boolean>(false);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
  const [createLoading, setCreateLoading] = useState<boolean>(false);
  const [uploadLoading, setUploadLoading] = useState<boolean>(false);
  const [isForbidden, setIsForbidden] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  // Helper to trigger global notification
  const notify = (message: string, type: 'success' | 'error' = 'success') => {
    window.dispatchEvent(new CustomEvent('show-notification', { 
      detail: { message, type } 
    }));
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const url = `/api/products?page=1&limit=100`;
      const response = await axios.get(url);
      if (response.data.success) {
        setProducts(response.data.data || []);
      }
    } catch (err: any) {
      if (err.response?.status === 403) {
        setIsForbidden(true);
      } else {
        console.error('Failed to fetch products:', err);
        setMockProducts();
      }
    } finally {
      setLoading(false);
    }
  };

  const setMockProducts = () => {
    setProducts([
      { 
        id: '1', 
        name: 'Sample Product', 
        slug: 'sample-product', 
        price: '100000', 
        photo_url: null, 
        description: 'This is a sample product', 
        status: 'active', 
        created_at: new Date().toISOString(), 
        updated_at: new Date().toISOString() 
      },
    ]);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    product.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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

  const handleDelete = async (id: string) => {
    setDeleteLoading(true);
    try {
      const product = products.find(p => p.id === id);
      if (!product) return;

      const response = await axios.delete(`/api/products/${product.slug}`);

      if (response.data.success) {
        notify('Product deleted successfully', 'success');
        setShowDeleteConfirm(null);
        fetchProducts();
      } else {
        notify(response.data.error || 'Failed to delete product', 'error');
      }
    } catch (err: any) {
      console.error('Error deleting product:', err);
      notify(err.response?.data?.error || 'Failed to delete product', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, isCreate: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadLoading(true);

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
        if (isCreate) {
          setCreateForm({ ...createForm, photo_url: photoUrl });
        } else {
          setEditForm({ ...editForm, photo_url: photoUrl });
        }
        notify('Photo uploaded successfully', 'success');
      } else {
        notify(response.data.error || 'Failed to upload photo', 'error');
      }
    } catch (err: any) {
      console.error('Error uploading photo:', err);
      notify(err.response?.data?.error || 'Failed to upload photo', 'error');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);

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
        fetchProducts();
        setShowCreateModal(false);
        setCreateForm({ name: '', price: '', photo_url: '', description: '', status: 'active' });
        notify('Product created successfully', 'success');
      } else {
        notify(response.data.error || 'Failed to create product', 'error');
      }
    } catch (err: any) {
      console.error('Error creating product:', err);
      notify(err.response?.data?.error || 'Failed to create product', 'error');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    setEditLoading(true);

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
        fetchProducts();
        closeEditModal();
        notify('Product updated successfully', 'success');
      } else {
        notify(response.data.error || 'Failed to update product', 'error');
      }
    } catch (err: any) {
      console.error('Error updating product:', err);
      notify(err.response?.data?.error || 'Failed to update product', 'error');
    } finally {
      setEditLoading(false);
    }
  };

  const handleImageError = (productId: string) => {
    setImageErrors(prev => ({
      ...prev,
      [productId]: true
    }));
  };

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', marginBottom: '0.25rem' }}>Product Management</h1>
            <p>Manage your product catalog and inventory.</p>
          </div>
          <button className="btn-primary" style={{ width: 'auto' }} onClick={() => setShowCreateModal(true)} disabled={isForbidden}>
            <Plus size={18} />
            Add New Product
          </button>
        </div>

        {isForbidden ? (
          <div className="card" style={{ padding: '4rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ padding: '1.5rem', borderRadius: '50%', background: 'rgba(229, 115, 115, 0.1)', color: 'var(--error-color)' }}>
              <Shield size={48} />
            </div>
            <div>
              <h2 style={{ color: 'var(--primary-color)', marginBottom: '0.5rem' }}>Access Denied</h2>
              <p style={{ maxWidth: '400px' }}>You do not have the required permissions to access this page. Only users with Admin or Superadmin roles can manage products.</p>
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
                  placeholder="Search products..." 
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
                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem' }}>PRODUCT</th>
                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem' }}>PRICE</th>
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
                  ) : filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No products found.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product) => (
                      <tr key={product.id} style={{ borderTop: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '1rem 1.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                              {product.photo_url && !imageErrors[product.id] ? (
                                <img 
                                  src={product.photo_url} 
                                  alt={product.name}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  onError={() => handleImageError(product.id)}
                                />
                              ) : (
                                <Package size={20} style={{ color: '#cbd5e1' }} />
                              )}
                            </div>
                            <div>
                              <p style={{ fontWeight: '600', fontSize: '0.9rem', margin: 0 }}>{product.name}</p>
                              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, fontFamily: 'monospace' }}>{product.slug}</p>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '1rem 1.5rem' }}>
                          <p style={{ fontWeight: '600', fontSize: '0.95rem', margin: 0, color: 'var(--primary-color)' }}>
                            Rp {parseInt(product.price).toLocaleString('id-ID')}
                          </p>
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
                            background: product.status === 'active' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                            color: product.status === 'active' ? 'var(--success-color)' : 'var(--text-muted)'
                          }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: product.status === 'active' ? 'var(--success-color)' : 'var(--text-muted)' }}></div>
                            {product.status.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          {new Date(product.created_at).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button className="nav-item" style={{ padding: '0.4rem' }} onClick={() => handleViewDetail(product)}>
                              <Eye size={16} />
                            </button>
                            <button className="nav-item" style={{ padding: '0.4rem' }} onClick={() => handleEdit(product)}>
                              <Edit2 size={16} />
                            </button>
                            <button className="nav-item" style={{ padding: '0.4rem', color: 'var(--error-color)' }} onClick={() => setShowDeleteConfirm(product.id)}>
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

      {/* Create Product Modal */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '700px', maxHeight: '90vh', position: 'relative', padding: 0, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', overflow: 'hidden', borderRadius: '16px' }}>
            {/* Modal Header */}
            <div style={{ padding: '2rem 2.5rem', borderBottom: '1px solid var(--border-color)', background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)' }}>
              <button onClick={() => setShowCreateModal(false)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'white', border: '1px solid var(--border-color)', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)', transition: 'all 0.2s' }}><X size={18} /></button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                  <Plus size={24} />
                </div>
                <div>
                  <h2 style={{ marginBottom: 0, fontSize: '1.5rem' }}>Create New Product</h2>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#1e40af' }}>Fill in the product details</p>
                </div>
              </div>
            </div>
            
            {/* Modal Body */}
            <div style={{ padding: '2rem 2.5rem', overflow: 'auto', maxHeight: 'calc(90vh - 220px)' }}>
              <form onSubmit={handleCreateProduct}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Product Name</label>
                    <input type="text" className="form-input" required value={createForm.name} onChange={(e) => setCreateForm({...createForm, name: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Price</label>
                    <input type="number" className="form-input" required value={createForm.price} onChange={(e) => setCreateForm({...createForm, price: e.target.value})} min="0" step="0.01" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-input" value={createForm.status} onChange={(e) => setCreateForm({...createForm, status: e.target.value as 'active' | 'inactive'})} style={{ appearance: 'none' }}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Product Photo</label>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => handlePhotoUpload(e, true)}
                      className="form-input"
                    />
                    {createForm.photo_url && (
                      <p style={{ fontSize: '0.85rem', color: 'var(--success-color)', marginTop: '0.5rem', fontWeight: '500' }}>✓ Photo uploaded successfully</p>
                    )}
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Description</label>
                    <textarea className="form-input" value={createForm.description} onChange={(e) => setCreateForm({...createForm, description: e.target.value})} style={{ minHeight: '120px' }} />
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'flex-end' }}>
                  <button type="button" className="btn-secondary" style={{ width: 'auto' }} onClick={() => setShowCreateModal(false)}>Cancel</button>
                  <button type="submit" className="btn-primary" style={{ width: 'auto' }} disabled={createLoading}>
                    {createLoading ? <Loader2 className="animate-spin" size={18} /> : 'Create Product'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && selectedProduct && (
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
                  <h2 style={{ marginBottom: 0, fontSize: '1.5rem' }}>Edit Product</h2>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#92400e' }}>Update product information</p>
                </div>
              </div>
            </div>
            
            {/* Modal Body */}
            <div style={{ padding: '2rem 2.5rem', overflow: 'auto', maxHeight: 'calc(90vh - 220px)' }}>
              <form onSubmit={handleUpdateProduct}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Product Name</label>
                    <input type="text" className="form-input" required value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Price</label>
                    <input type="number" className="form-input" required value={editForm.price} onChange={(e) => setEditForm({...editForm, price: e.target.value})} min="0" step="0.01" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-input" value={editForm.status} onChange={(e) => setEditForm({...editForm, status: e.target.value as 'active' | 'inactive'})} style={{ appearance: 'none' }}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Product Photo</label>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => handlePhotoUpload(e, false)}
                      className="form-input"
                    />
                    {editForm.photo_url && (
                      <p style={{ fontSize: '0.85rem', color: 'var(--success-color)', marginTop: '0.5rem', fontWeight: '500' }}>✓ Photo uploaded successfully</p>
                    )}
                    {selectedProduct.photo_url && !editForm.photo_url && (
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Current photo exists</p>
                    )}
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Description</label>
                    <textarea className="form-input" value={editForm.description} onChange={(e) => setEditForm({...editForm, description: e.target.value})} style={{ minHeight: '120px' }} />
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

      {/* Product Detail Modal */}
      {showDetailModal && selectedProduct && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', position: 'relative', padding: 0, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', overflow: 'hidden', borderRadius: '16px' }}>
            {/* Modal Header */}
            <div style={{ padding: '2rem 2.5rem', borderBottom: '1px solid var(--border-color)', background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)' }}>
              <button onClick={closeDetailModal} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'white', border: '1px solid var(--border-color)', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)', transition: 'all 0.2s' }}><X size={18} /></button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--primary-color), #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                  <Package size={24} />
                </div>
                <div>
                  <h2 style={{ marginBottom: 0, fontSize: '1.5rem' }}>{selectedProduct.name}</h2>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>Product Details Information</p>
                </div>
              </div>
            </div>
            
            {/* Modal Body */}
            <div style={{ padding: '2rem 2.5rem', overflow: 'auto', maxHeight: 'calc(90vh - 200px)' }}>
              {/* Product Image */}
              {selectedProduct.photo_url && !imageErrors[selectedProduct.id] && (
                <div style={{ height: '250px', background: 'linear-gradient(135deg, #f8fafc, #e2e8f0)', borderRadius: '12px', overflow: 'hidden', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #e2e8f0' }}>
                  <img 
                    src={selectedProduct.photo_url} 
                    alt={selectedProduct.name}
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                    onError={() => handleImageError(selectedProduct.id)}
                  />
                </div>
              )}

              {/* Quick Info */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ padding: '1.25rem', background: 'linear-gradient(135deg, #fef3c7, #fde68a)', borderRadius: '12px', border: '1px solid #fcd34d' }}>
                  <p style={{ fontSize: '0.75rem', color: '#92400e', marginBottom: '0.25rem', fontWeight: '600' }}>Price</p>
                  <p style={{ fontSize: '1.25rem', margin: 0, fontWeight: '700', color: '#78350f' }}>Rp {parseInt(selectedProduct.price).toLocaleString('id-ID')}</p>
                </div>
                <div style={{ padding: '1.25rem', background: selectedProduct.status === 'active' ? 'linear-gradient(135deg, #f0fdf4, #dcfce7)' : 'linear-gradient(135deg, #fef2f2, #fee2e2)', borderRadius: '12px', border: `1px solid ${selectedProduct.status === 'active' ? '#86efac' : '#fca5a5'}` }}>
                  <p style={{ fontSize: '0.75rem', color: selectedProduct.status === 'active' ? '#15803d' : '#b91c1c', marginBottom: '0.25rem', fontWeight: '600' }}>Status</p>
                  <p style={{ fontSize: '1rem', margin: 0, fontWeight: '700', color: selectedProduct.status === 'active' ? '#14532d' : '#7f1d1d' }}>{selectedProduct.status.toUpperCase()}</p>
                </div>
                <div style={{ padding: '1.25rem', background: 'linear-gradient(135deg, #f3e8ff, #e9d5ff)', borderRadius: '12px', border: '1px solid #c084fc' }}>
                  <p style={{ fontSize: '0.75rem', color: '#7c3aed', marginBottom: '0.25rem', fontWeight: '600' }}>Created</p>
                  <p style={{ fontSize: '0.875rem', margin: 0, fontWeight: '600', color: '#5b21b6' }}>
                    {new Date(selectedProduct.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>

              {/* Product Information */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1rem', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '3px', height: '18px', background: 'var(--primary-color)', borderRadius: '2px' }}></div>
                  Product Information
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                  <div style={{ padding: '1.25rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.35rem', fontWeight: '600' }}>Product Name</p>
                    <p style={{ fontSize: '1rem', margin: 0, fontWeight: '600', color: '#0f172a' }}>{selectedProduct.name}</p>
                  </div>
                  <div style={{ padding: '1.25rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.35rem', fontWeight: '600' }}>Slug</p>
                    <p style={{ fontSize: '0.95rem', margin: 0, fontFamily: 'monospace', color: '#0f172a' }}>{selectedProduct.slug}</p>
                  </div>
                  {selectedProduct.description && (
                    <div style={{ padding: '1.25rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', gridColumn: '1 / -1' }}>
                      <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem', fontWeight: '600' }}>Description</p>
                      <p style={{ fontSize: '0.95rem', margin: 0, color: '#0f172a', lineHeight: '1.7' }}>{selectedProduct.description}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Timestamps */}
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1rem', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '3px', height: '18px', background: 'var(--primary-color)', borderRadius: '2px' }}></div>
                  Timestamps
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                  <div style={{ padding: '1.25rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.35rem', fontWeight: '600' }}>Created At</p>
                    <p style={{ fontSize: '0.95rem', margin: 0, color: '#0f172a' }}>
                      {new Date(selectedProduct.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div style={{ padding: '1.25rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.35rem', fontWeight: '600' }}>Updated At</p>
                    <p style={{ fontSize: '0.95rem', margin: 0, color: '#0f172a' }}>
                      {new Date(selectedProduct.updated_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {showDeleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px', textAlign: 'center', padding: '2.5rem' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <AlertTriangle size={32} />
            </div>
            <h2 style={{ marginBottom: '0.5rem' }}>Are you sure?</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>This action cannot be undone. This product will be permanently removed from the system.</p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowDeleteConfirm(null)}>Cancel</button>
              <button className="btn-primary" style={{ flex: 1, backgroundColor: '#ef4444', borderColor: '#ef4444' }} onClick={() => handleDelete(showDeleteConfirm)} disabled={deleteLoading}>
                {deleteLoading ? <Loader2 className="animate-spin" size={18} /> : 'Delete Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
