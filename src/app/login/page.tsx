"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, Loader2, Mail } from 'lucide-react';
import api from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotError, setForgotError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await api.post('/api/auth/login', {
        email, 
        password
      });

      if (response.data.success) {
        const { token, refreshToken, user } = response.data.data;

        // Only allow admin or superadmin to log in
        if (user.role !== 'admin' && user.role !== 'superadmin') {
          setError('Access Denied: Only administrators can access this portal.');
          setIsLoading(false);
          return;
        }

        // Save to local storage
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(user));
        
        // Redirect to dashboard
        router.push('/dashboard');
      }
    } catch (err: any) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Login failed. Please check your credentials and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess(false);
    setForgotLoading(true);

    try {
      const response = await api.post('/api/auth/forgot-password', {
        email: forgotEmail
      });

      if (response.data.success) {
        setForgotSuccess(true);
        setForgotEmail('');
      }
    } catch (err: any) {
      if (err.response?.data?.message) {
        setForgotError(err.response.data.message);
      } else {
        setForgotError('Failed to send reset password. Please try again.');
      }
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="glass-panel auth-card">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>uPortal</h1>
          <p>Welcome back! Please login to your account.</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input 
              id="email"
              type="email" 
              className="form-input" 
              placeholder="Enter your email address" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input 
              id="password"
              type="password" 
              className="form-input" 
              placeholder="Enter your password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <div className="error-message" style={{ marginBottom: '1.5rem' }}>{error}</div>}

          <button type="submit" className="btn-primary" disabled={isLoading}>
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : <LogIn size={20} />}
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <button 
            type="button" 
            onClick={() => setShowForgotPassword(true)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-primary)',
              cursor: 'pointer',
              fontSize: '0.9rem',
              textDecoration: 'underline'
            }}
          >
            Forgot Password?
          </button>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
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
          onClick={() => {
            setShowForgotPassword(false);
            setForgotSuccess(false);
            setForgotError('');
            setForgotEmail('');
          }}
        >
          <div 
            className="glass-panel"
            style={{
              maxWidth: '450px',
              width: '100%',
              padding: '2rem',
              position: 'relative',
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                setShowForgotPassword(false);
                setForgotSuccess(false);
                setForgotError('');
                setForgotEmail('');
              }}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'none',
                border: 'none',
                color: 'var(--color-text)',
                cursor: 'pointer',
                fontSize: '1.5rem',
                lineHeight: 1
              }}
            >
              ×
            </button>

            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <Mail size={48} style={{ color: 'var(--color-primary)', marginBottom: '1rem' }} />
              <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#ffffff' }}>Forgot Password?</h2>
              <p style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>
                Enter your email address and we'll send you a new password.
              </p>
            </div>

            {forgotSuccess ? (
              <div style={{ textAlign: 'center' }}>
                <div 
                  style={{
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    marginBottom: '1.5rem'
                  }}
                >
                  <p style={{ color: 'rgb(34, 197, 94)', margin: 0 }}>
                    ✓ If the email exists, a new password has been sent to your email.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotSuccess(false);
                    setForgotEmail('');
                  }}
                  className="btn-primary"
                >
                  Back to Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword}>
                <div className="form-group">
                  <label className="form-label" htmlFor="forgot-email" style={{ color: '#e2e8f0' }}>Email Address</label>
                  <input 
                    id="forgot-email"
                    type="email" 
                    className="form-input" 
                    placeholder="Enter your email address" 
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    style={{ color: '#ffffff', backgroundColor: 'rgba(30, 41, 59, 0.8)' }}
                  />
                </div>

                {forgotError && (
                  <div className="error-message" style={{ marginBottom: '1.5rem' }}>
                    {forgotError}
                  </div>
                )}

                <button 
                  type="submit" 
                  className="btn-primary" 
                  disabled={forgotLoading}
                  style={{ width: '100%' }}
                >
                  {forgotLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail size={20} />
                      Send New Password
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
