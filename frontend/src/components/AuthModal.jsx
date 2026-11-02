import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Lock, Mail, User, Shield, AlertCircle, CheckCircle2, HeartHandshake } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, initialMode = 'login', onSuccess }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState(initialMode); // 'login' or 'register'
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('affected_person'); // 'affected_person' or 'volunteer'

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
        setSuccessMsg('Logged in successfully!');
        setTimeout(() => {
          onClose();
          if (onSuccess) onSuccess();
        }, 500);
      } else {
        if (password.length < 8) {
          throw new Error('Password must be at least 8 characters long');
        }
        await register({ name, email, password, role });
        setSuccessMsg('Account registered and signed in!');
        setTimeout(() => {
          onClose();
          if (onSuccess) onSuccess();
        }, 600);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillQuickDemo = (type) => {
    setError('');
    if (type === 'affected') {
      setEmail('affected@helpconnect.local');
      setPassword('Password123!');
      if (mode === 'register') {
        setName('Sarah Jenkins (Survivor)');
        setRole('affected_person');
      }
    } else if (type === 'volunteer') {
      setEmail('volunteer@helpconnect.local');
      setPassword('Password123!');
      if (mode === 'register') {
        setName('David Clark (Responder)');
        setRole('volunteer');
      }
    } else if (type === 'admin') {
      setEmail('admin@helpconnect.local');
      setPassword('Password123!');
      setMode('login');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem' }}>
              {mode === 'login' ? 'Sign In to HelpConnect' : 'Create HelpConnect Account'}
            </h2>
            <p style={{ fontSize: '0.85rem', marginTop: '0.2rem' }}>
              {mode === 'login' 
                ? 'Access your emergency dashboard and requests' 
                : 'Join the humanitarian disaster response network'}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '0.4rem',
              borderRadius: 'var(--radius-sm)'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          background: 'rgba(15, 23, 42, 0.6)',
          padding: '0.25rem',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1.5rem',
          border: '1px solid var(--border-subtle)'
        }}>
          <button
            type="button"
            className={`btn btn-sm ${mode === 'login' ? 'btn-primary' : 'btn-outline'}`}
            style={{ border: 'none', borderRadius: 'var(--radius-sm)' }}
            onClick={() => { setMode('login'); setError(''); }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`btn btn-sm ${mode === 'register' ? 'btn-primary' : 'btn-outline'}`}
            style={{ border: 'none', borderRadius: 'var(--radius-sm)' }}
            onClick={() => { setMode('register'); setError(''); }}
          >
            Register
          </button>
        </div>

        {/* Alert Messages */}
        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.75rem 1rem',
            background: 'var(--critical-bg)',
            border: '1px solid var(--critical-border)',
            borderRadius: 'var(--radius-md)',
            color: '#fca5a5',
            fontSize: '0.85rem',
            marginBottom: '1.25rem'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.75rem 1rem',
            background: 'var(--low-bg)',
            border: '1px solid var(--low-border)',
            borderRadius: 'var(--radius-md)',
            color: '#86efac',
            fontSize: '0.85rem',
            marginBottom: '1.25rem'
          }}>
            <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem' }}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <User size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                required
                placeholder="you@example.com"
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Mail size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password {mode === 'register' && '(min 8 characters)'}</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                required
                minLength={mode === 'register' ? 8 : 1}
                placeholder="••••••••"
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Lock size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
          </div>

          {/* Role selector in registration */}
          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label">I am joining as:</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div
                  onClick={() => setRole('affected_person')}
                  style={{
                    padding: '0.85rem',
                    borderRadius: 'var(--radius-md)',
                    border: `1.5px solid ${role === 'affected_person' ? '#fbbf24' : 'var(--border-subtle)'}`,
                    background: role === 'affected_person' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(15, 23, 42, 0.4)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#fbbf24', fontWeight: 600, fontSize: '0.9rem' }}>
                    <AlertCircle size={16} />
                    <span>Affected Person</span>
                  </div>
                  <p style={{ fontSize: '0.75rem', marginTop: '0.35rem', color: 'var(--text-secondary)' }}>
                    Need urgent food, medical, rescue, or shelter aid.
                  </p>
                </div>

                <div
                  onClick={() => setRole('volunteer')}
                  style={{
                    padding: '0.85rem',
                    borderRadius: 'var(--radius-md)',
                    border: `1.5px solid ${role === 'volunteer' ? '#38bdf8' : 'var(--border-subtle)'}`,
                    background: role === 'volunteer' ? 'rgba(56, 189, 248, 0.1)' : 'rgba(15, 23, 42, 0.4)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#38bdf8', fontWeight: 600, fontSize: '0.9rem' }}>
                    <HeartHandshake size={16} />
                    <span>Volunteer</span>
                  </div>
                  <p style={{ fontSize: '0.75rem', marginTop: '0.35rem', color: 'var(--text-secondary)' }}>
                    Respond to requests and assist affected communities.
                  </p>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem' }}
            disabled={loading}
          >
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {/* Quick Demo Credentials for Tester Convenience */}
        <div style={{
          marginTop: '1.75rem',
          paddingTop: '1.25rem',
          borderTop: '1px solid var(--border-subtle)',
          textAlign: 'center'
        }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
            Testing shortcuts (auto-fills test role):
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => fillQuickDemo('affected')}
            >
              Affected Person
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => fillQuickDemo('volunteer')}
            >
              Volunteer
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => fillQuickDemo('admin')}
            >
              Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
