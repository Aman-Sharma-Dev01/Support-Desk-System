import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { LifeBuoy, ArrowRight, ShieldCheck, Headphones, User, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const [isRegister, setIsRegister] = useState(searchParams.get('tab') === 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, signup, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        if (!name.trim()) throw new Error('Please enter your full name');
        await signup(name, email, password);
      } else {
        await login(email, password);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const setDemoCredentials = (demoEmail, demoPass) => {
    setIsRegister(false);
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 68px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      backgroundColor: '#f8faf9',
    }}>
      <div style={{ width: '100%', maxWidth: '460px' }}>
        {/* Header Branding */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '14px',
            backgroundColor: 'var(--brand)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 8px 20px rgba(5, 150, 105, 0.25)',
            marginBottom: '14px'
          }}>
            <LifeBuoy size={30} strokeWidth={2.2} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
            {isRegister ? 'Create Customer Account' : 'Welcome to DeskPulse'}
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
            {isRegister 
              ? 'Raise and track support requests with our dedicated team' 
              : 'Sign in to access your tickets and resolution desk'}
          </p>
        </div>

        {/* Auth Card */}
        <div className="card" style={{ padding: '32px', backgroundColor: '#ffffff', boxShadow: 'var(--shadow-lg)' }}>
          {/* Tabs */}
          <div style={{
            display: 'flex',
            background: '#f1f5f3',
            padding: '4px',
            borderRadius: '10px',
            marginBottom: '24px'
          }}>
            <button
              type="button"
              onClick={() => { setIsRegister(false); setError(''); }}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '7px',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: !isRegister ? 'var(--brand)' : '#64748b',
                backgroundColor: !isRegister ? '#ffffff' : 'transparent',
                boxShadow: !isRegister ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsRegister(true); setError(''); }}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '7px',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: isRegister ? 'var(--brand)' : '#64748b',
                backgroundColor: isRegister ? '#ffffff' : 'transparent',
                boxShadow: isRegister ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              Register (Customer)
            </button>
          </div>

          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 14px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: '#b91c1c',
              fontSize: '0.85rem',
              marginBottom: '20px'
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {isRegister && (
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Your Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field"
                />
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Email Address
              </label>
              <input
                type="email"
                required
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Password
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '11px',
                fontSize: '0.95rem',
                marginTop: '6px',
                opacity: loading ? 0.75 : 1
              }}
            >
              {loading ? 'Please wait...' : (isRegister ? 'Create Account & Continue' : 'Sign In')}
              <ArrowRight size={18} />
            </button>
          </form>
        </div>

        {/* Demo Fast Login Switcher */}
        <div style={{ marginTop: '24px', padding: '18px', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
          <p style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em', marginBottom: '10px' }}>
            Quick Demo Logins (Click to autofill)
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setDemoCredentials('admin@supportdesk.com', 'admin123')}
              style={{
                padding: '8px 10px',
                borderRadius: '8px',
                border: '1px solid #fbcfe8',
                backgroundColor: '#fdf2f8',
                color: '#9d174d',
                fontSize: '0.75rem',
                fontWeight: 700,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <ShieldCheck size={16} />
              <span>Admin</span>
            </button>

            <button
              type="button"
              onClick={() => setDemoCredentials('agent@supportdesk.com', 'agent123')}
              style={{
                padding: '8px 10px',
                borderRadius: '8px',
                border: '1px solid #bbf7d0',
                backgroundColor: '#f0fdf4',
                color: '#166534',
                fontSize: '0.75rem',
                fontWeight: 700,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Headphones size={16} />
              <span>Agent</span>
            </button>

            <button
              type="button"
              onClick={() => setDemoCredentials('user@supportdesk.com', 'user123')}
              style={{
                padding: '8px 10px',
                borderRadius: '8px',
                border: '1px solid #bfdbfe',
                backgroundColor: '#eff6ff',
                color: '#1e40af',
                fontSize: '0.75rem',
                fontWeight: 700,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <User size={16} />
              <span>User</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

