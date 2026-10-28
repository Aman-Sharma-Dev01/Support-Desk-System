import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../api/client';
import { RoleBadge } from '../tickets/TicketBadge';
import { Users, UserPlus, AlertCircle, CheckCircle2, Shield, Headphones, RefreshCw, Trash2 } from 'lucide-react';

export default function AdminAgentsPage() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Agent');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/agents');
      setAgents(res.data || []);
    } catch (err) {
      console.error('Failed to load agents', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const handleDeleteAgent = async (agentId, agentName) => {
    if (!window.confirm(`Are you sure you want to remove agent "${agentName}"?`)) return;
    try {
      await apiRequest(`/agents/${agentId}`, { method: 'DELETE' });
      setSuccessMsg(`Agent "${agentName}" removed.`);
      fetchAgents();
    } catch (err) {
      alert(err.message || 'Failed to delete agent');
    }
  };

  const handleCreateAgent = async (e) => {
    e.preventDefault();
    setFormError('');
    setSuccessMsg('');
    setFormLoading(true);

    try {
      await apiRequest('/agents', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          role,
        }),
      });

      setSuccessMsg(`Agent "${name}" registered successfully!`);
      setName('');
      setEmail('');
      setPassword('');
      setRole('Agent');
      setShowCreateModal(false);
      fetchAgents();
    } catch (err) {
      setFormError(err.message || 'Failed to create agent');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1240px', margin: '32px auto', padding: '0 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0' }}>
            Agent Directory & Staff Management
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
            Register new support team members and configure role access.
          </p>
        </div>

        <button
          onClick={() => { setShowCreateModal(true); setFormError(''); }}
          className="btn-primary"
          style={{ padding: '10px 18px', fontSize: '0.9rem' }}
        >
          <UserPlus size={16} /> Register New Agent
        </button>
      </div>

      {successMsg && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 16px',
          backgroundColor: '#ecfdf5',
          border: '1px solid #a7f3d0',
          borderRadius: '10px',
          color: '#065f46',
          fontSize: '0.9rem',
          marginBottom: '20px'
        }}>
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Agents Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Active Staff Members ({agents.length})
          </h2>
          <button
            onClick={fetchAgents}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--brand)', fontWeight: 600 }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 10px' }} />
            <p>Loading agents...</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8faf9', borderBottom: '1px solid var(--border-subtle)' }}>
                <th style={{ padding: '14px 24px', fontWeight: 700, color: '#475569' }}>Name & Identity</th>
                <th style={{ padding: '14px 24px', fontWeight: 700, color: '#475569' }}>Email</th>
                <th style={{ padding: '14px 24px', fontWeight: 700, color: '#475569' }}>Role</th>
                <th style={{ padding: '14px 24px', fontWeight: 700, color: '#475569' }}>Registered Date</th>
                <th style={{ padding: '14px 24px', fontWeight: 700, color: '#475569', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((ag) => (
                <tr
                  key={ag._id}
                  style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background-color 0.15s ease' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fbfdfc')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--brand-light)',
                        border: '1.5px solid var(--brand-border)',
                        color: 'var(--brand)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.85rem'
                      }}>
                        {ag.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 700, color: '#0f172a' }}>{ag.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px', color: '#64748b' }}>{ag.email}</td>
                  <td style={{ padding: '16px 24px' }}>
                    <RoleBadge role={ag.role} />
                  </td>
                  <td style={{ padding: '16px 24px', color: '#94a3b8' }}>
                    {ag.createdAt ? new Date(ag.createdAt).toLocaleDateString() : 'N/A'}
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                    {ag.role !== 'Admin' && (
                      <button
                        onClick={() => handleDeleteAgent(ag._id, ag.name)}
                        title="Remove Agent"
                        style={{
                          padding: '6px 8px',
                          borderRadius: '6px',
                          color: '#dc2626',
                          backgroundColor: '#fef2f2',
                          border: '1px solid #fecaca'
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Register Agent Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          padding: '20px'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '480px', padding: '32px', backgroundColor: '#ffffff', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Register New Agent
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ fontSize: '1.25rem', color: '#94a3b8', lineHeight: 1 }}
              >
                ✕
              </button>
            </div>

            {formError && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                color: '#b91c1c',
                fontSize: '0.85rem',
                marginBottom: '16px'
              }}>
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateAgent} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maya Chen"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Work Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="maya@supportdesk.com"
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
                  minLength={6}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  System Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="input-field"
                >
                  <option value="Agent">Agent (Can view and resolve tickets)</option>
                  <option value="Admin">Admin (Full administrative controls)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="btn-primary"
                  style={{ opacity: formLoading ? 0.75 : 1 }}
                >
                  {formLoading ? 'Registering...' : 'Complete Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

