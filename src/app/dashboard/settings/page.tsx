"use client";

import { useEffect, useState } from 'react';
import { 
  Settings, 
  Mail, 
  CreditCard, 
  ShieldAlert, 
  Plus, 
  Edit3, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  Loader2, 
  Check, 
  Sliders,
  Database,
  Lock
} from 'lucide-react';
import axios from 'axios';

interface ConfigItem {
  key: string;
  value: string;
  updated_at?: string;
}

export default function SettingsPage() {
  const [configs, setConfigs] = useState<ConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'smtp' | 'midtrans' | 'security' | 'custom'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Show/hide secrets state
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});

  // Editing state
  const [editingItem, setEditingItem] = useState<ConfigItem | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New config key dialog state
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newError, setNewError] = useState('');

  // Notify utility
  const notify = (message: string, type: 'success' | 'error' = 'success') => {
    window.dispatchEvent(new CustomEvent('show-notification', { 
      detail: { message, type } 
    }));
  };

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/configs');
      if (response.data && response.data.success) {
        setConfigs(response.data.data);
      } else {
        notify('Failed to load configurations from server', 'error');
        setMockConfigs();
      }
    } catch (err: any) {
      console.error('Failed to fetch configs:', err);
      notify('API down. Loaded mock configurations.', 'error');
      setMockConfigs();
    } finally {
      setLoading(false);
    }
  };

  const setMockConfigs = () => {
    setConfigs([
      { key: "CORS_ORIGIN", value: "http://localhost:3000,https://ukasir.id", updated_at: "2026-06-01T04:00:00.000Z" },
      { key: "MIDTRANS_IS_PRODUCTION", value: "false", updated_at: "2026-06-01T04:00:00.000Z" },
      { key: "MIDTRANS_MERCHANT_ID", value: "M100239482", updated_at: "2026-06-01T04:00:00.000Z" },
      { key: "MIDTRANS_CLIENT_KEY", value: "VT-client-8aBcDeFgHiJkLmNo", updated_at: "2026-06-01T04:00:00.000Z" },
      { key: "SMTP_HOST", value: "smtp.hostinger.com", updated_at: "2026-06-01T04:00:00.000Z" },
      { key: "SMTP_PORT", value: "465", updated_at: "2026-06-01T04:00:00.000Z" },
      { key: "SMTP_USER", value: "no-reply@ucentric.id", updated_at: "2026-06-01T04:00:00.000Z" },
      { key: "SMTP_PASSWORD", value: "••••••••••••••••", updated_at: "2026-06-01T04:00:00.000Z" }
    ]);
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const handleUpdateConfig = async (key: string, value: string) => {
    setIsSubmitting(true);
    try {
      const response = await axios.post('/api/configs', { key, value });
      if (response.data && response.data.success) {
        notify(`Configuration '${key}' saved successfully!`, 'success');
        setEditingItem(null);
        fetchConfigs();
      } else {
        notify(response.data.message || 'Failed to update config', 'error');
      }
    } catch (err: any) {
      console.error(err);
      notify('Failed to save configuration. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewError('');
    if (!newKey.trim() || !newValue.trim()) {
      setNewError('Key and Value are required');
      return;
    }
    
    // Key validation
    const formattedKey = newKey.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');

    setIsSubmitting(true);
    try {
      const response = await axios.post('/api/configs', { key: formattedKey, value: newValue });
      if (response.data && response.data.success) {
        notify(`Config '${formattedKey}' created successfully!`, 'success');
        setIsNewModalOpen(false);
        setNewKey('');
        setNewValue('');
        fetchConfigs();
      } else {
        setNewError(response.data.message || 'Failed to create config');
      }
    } catch (err: any) {
      console.error(err);
      setNewError('Error creating configuration key.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleVisibility = (key: string) => {
    setVisibleKeys(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Group config keys into predefined tabs
  const getFilteredConfigs = () => {
    let filtered = configs;
    
    // Apply search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(item => 
        item.key.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.value.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (activeTab === 'smtp') {
      return filtered.filter(c => c.key.startsWith('SMTP_'));
    }
    if (activeTab === 'midtrans') {
      return filtered.filter(c => c.key.startsWith('MIDTRANS_'));
    }
    if (activeTab === 'security') {
      return filtered.filter(c => c.key === 'CORS_ORIGIN' || c.key.includes('SECURE') || c.key.includes('JWT') || c.key.includes('ENCRYPT'));
    }
    if (activeTab === 'custom') {
      return filtered.filter(c => 
        !c.key.startsWith('SMTP_') && 
        !c.key.startsWith('MIDTRANS_') && 
        c.key !== 'CORS_ORIGIN' && 
        !c.key.includes('SECURE') && 
        !c.key.includes('JWT') && 
        !c.key.includes('ENCRYPT')
      );
    }

    return filtered;
  };

  const isSensitive = (key: string) => {
    const k = key.toUpperCase();
    return k.includes('PASSWORD') || k.includes('SECRET') || k.includes('KEY') || k.includes('TOKEN') || k.includes('PASS');
  };

  const formatConfigValue = (key: string, value: string) => {
    if (isSensitive(key) && !visibleKeys[key]) {
      return '••••••••••••••••';
    }
    return value;
  };

  const activeConfigs = getFilteredConfigs();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Banner/Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Settings className="animate-spin-slow" size={28} />
            System Configurations
          </h1>
          <p>Retrieve, manage, and encrypt global application settings in real-time.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={fetchConfigs} disabled={loading}>
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
          <button className="btn-primary" style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => setIsNewModalOpen(true)}>
            <Plus size={18} />
            Add Configuration
          </button>
        </div>
      </div>

      {/* Tabs Layout */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', gap: '1rem', overflowX: 'auto', paddingBottom: '2px' }}>
        <button 
          onClick={() => setActiveTab('all')} 
          style={{
            padding: '0.75rem 1.25rem',
            borderBottom: activeTab === 'all' ? '2px solid var(--primary-color)' : '2px solid transparent',
            color: activeTab === 'all' ? 'var(--primary-color)' : 'var(--text-muted)',
            fontWeight: activeTab === 'all' ? '600' : '500',
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            transition: 'all 0.2s'
          }}
        >
          <Database size={16} /> All Configs
        </button>
        <button 
          onClick={() => setActiveTab('smtp')} 
          style={{
            padding: '0.75rem 1.25rem',
            borderBottom: activeTab === 'smtp' ? '2px solid var(--primary-color)' : '2px solid transparent',
            color: activeTab === 'smtp' ? 'var(--primary-color)' : 'var(--text-muted)',
            fontWeight: activeTab === 'smtp' ? '600' : '500',
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            transition: 'all 0.2s'
          }}
        >
          <Mail size={16} /> SMTP Email
        </button>
        <button 
          onClick={() => setActiveTab('midtrans')} 
          style={{
            padding: '0.75rem 1.25rem',
            borderBottom: activeTab === 'midtrans' ? '2px solid var(--primary-color)' : '2px solid transparent',
            color: activeTab === 'midtrans' ? 'var(--primary-color)' : 'var(--text-muted)',
            fontWeight: activeTab === 'midtrans' ? '600' : '500',
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            transition: 'all 0.2s'
          }}
        >
          <CreditCard size={16} /> Midtrans Payments
        </button>
        <button 
          onClick={() => setActiveTab('security')} 
          style={{
            padding: '0.75rem 1.25rem',
            borderBottom: activeTab === 'security' ? '2px solid var(--primary-color)' : '2px solid transparent',
            color: activeTab === 'security' ? 'var(--primary-color)' : 'var(--text-muted)',
            fontWeight: activeTab === 'security' ? '600' : '500',
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            transition: 'all 0.2s'
          }}
        >
          <Lock size={16} /> CORS & Security
        </button>
        <button 
          onClick={() => setActiveTab('custom')} 
          style={{
            padding: '0.75rem 1.25rem',
            borderBottom: activeTab === 'custom' ? '2px solid var(--primary-color)' : '2px solid transparent',
            color: activeTab === 'custom' ? 'var(--primary-color)' : 'var(--text-muted)',
            fontWeight: activeTab === 'custom' ? '600' : '500',
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            transition: 'all 0.2s'
          }}
        >
          <Sliders size={16} /> Custom Variables
        </button>
      </div>

      {/* Main Grid View */}
      <div className="card" style={{ padding: '0' }}>
        {/* Search Header */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <input 
            type="text" 
            placeholder="Search configurations..." 
            className="form-input" 
            style={{ maxWidth: '320px', borderRadius: '30px' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Showing {activeConfigs.length} configuration{activeConfigs.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Configs Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', background: '#f8fafc' }}>
                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', width: '35%' }}>KEY</th>
                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', width: '45%' }}>VALUE</th>
                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', width: '20%', textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} style={{ padding: '4rem', textAlign: 'center' }}>
                    <Loader2 className="animate-spin" size={24} style={{ margin: 'auto', color: 'var(--primary-color)' }} />
                    <p style={{ marginTop: '0.75rem', fontSize: '0.85rem' }}>Decrypting system credentials...</p>
                  </td>
                </tr>
              ) : activeConfigs.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No configurations found under this filter.
                  </td>
                </tr>
              ) : (
                activeConfigs.map((item) => (
                  <tr key={item.key} style={{ borderTop: '1px solid var(--border-color)', transition: 'background-color 0.2s' }}>
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <span style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--primary-color)', letterSpacing: '0.5px' }}>
                          {item.key}
                        </span>
                        {item.updated_at && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Updated: {new Date(item.updated_at).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      {editingItem?.key === item.key ? (
                        <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                          <input 
                            type={isSensitive(item.key) ? 'password' : 'text'}
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="form-input"
                            style={{ flex: 1, padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}
                            autoFocus
                          />
                          <button 
                            className="btn-primary" 
                            style={{ width: 'auto', padding: '0.4rem 0.8rem' }}
                            onClick={() => handleUpdateConfig(item.key, editValue)}
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                          </button>
                          <button 
                            className="btn-secondary" 
                            style={{ padding: '0.4rem 0.8rem' }}
                            onClick={() => setEditingItem(null)}
                            disabled={isSubmitting}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ 
                            fontFamily: isSensitive(item.key) && !visibleKeys[item.key] ? 'inherit' : 'monospace', 
                            fontSize: '0.9rem',
                            color: isSensitive(item.key) && !visibleKeys[item.key] ? 'var(--text-muted)' : 'var(--text-main)',
                            wordBreak: 'break-all'
                          }}>
                            {formatConfigValue(item.key, item.value)}
                          </span>
                          {isSensitive(item.key) && (
                            <button 
                              onClick={() => toggleVisibility(item.key)} 
                              style={{ color: 'var(--text-muted)', display: 'flex', padding: '0.2rem' }}
                            >
                              {visibleKeys[item.key] ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                      {editingItem?.key !== item.key && (
                        <button 
                          className="nav-item" 
                          style={{ padding: '0.5rem', display: 'inline-flex', margin: 0 }}
                          onClick={() => {
                            setEditingItem(item);
                            setEditValue(item.value);
                          }}
                        >
                          <Edit3 size={16} />
                          <span style={{ fontSize: '0.85rem' }}>Edit</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modern Dialog to Add New Configuration */}
      {isNewModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '480px', position: 'relative', padding: '2.5rem', boxShadow: '0 20px 80px rgba(0,0,0,0.3)' }}>
            <h2 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sliders size={24} /> New Configuration
            </h2>
            <p style={{ marginBottom: '2rem' }}>Define a new configuration key. The server automatically encrypts sensitive keys using AES-256-CBC.</p>
            <form onSubmit={handleCreateConfig}>
              <div className="form-group">
                <label className="form-label">Configuration Key</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. JWT_EXPIRATION_TIME"
                  required 
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)} 
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Only capital letters, digits, and underscores are permitted.
                </span>
              </div>
              <div className="form-group">
                <label className="form-label">Value</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. 7d"
                  required 
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)} 
                />
              </div>
              
              {newError && <div className="error-message" style={{ marginBottom: '1.5rem' }}>{newError}</div>}
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => { setIsNewModalOpen(false); setNewKey(''); setNewValue(''); setNewError(''); }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : 'Save Variable'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
