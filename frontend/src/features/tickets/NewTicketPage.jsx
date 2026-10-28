import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../../api/client';
import { useAuth } from '../auth/AuthContext';
import { ArrowLeft, Send, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function NewTicketPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [subject, setSubject] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [description, setDescription] = useState('');
  const [customer, setCustomer] = useState(user ? `${user.name} (${user.email})` : '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      setError('Subject and description are required.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await apiRequest('/tickets', {
        method: 'POST',
        body: JSON.stringify({
          subject: subject.trim(),
          priority,
          description: description.trim(),
          customer: customer || `${user?.name || 'Customer'} (${user?.email || 'user@desk.com'})`,
        }),
      });

      if (res.data?._id) {
        navigate(`/tickets/${res.data._id}`);
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Failed to submit ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '32px auto', padding: '0 20px' }}>
      <button
        onClick={() => navigate(-1)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          color: '#64748b',
          fontSize: '0.875rem',
          fontWeight: 600,
          marginBottom: '20px',
        }}
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div className="card" style={{ padding: '36px', backgroundColor: '#ffffff' }}>
        <div style={{ marginBottom: '24px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0' }}>
            Submit a New Support Ticket
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
            Describe your problem in detail and our support agents will respond promptly.
          </p>
        </div>

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 16px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            color: '#b91c1c',
            fontSize: '0.875rem',
            marginBottom: '24px'
          }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Subject / Brief Summary <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Cannot access invoice report on billing dashboard"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="input-field"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Priority Level
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="input-field"
                style={{ cursor: 'pointer' }}
              >
                <option value="Low">Low - Minor question or feedback</option>
                <option value="Medium">Medium - Normal request</option>
                <option value="High">High - Impaired functionality</option>
                <option value="Urgent">Urgent - Critical blocker or outage</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Customer Contact
              </label>
              <input
                type="text"
                disabled={user?.role === 'User'}
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                className="input-field"
                style={{ backgroundColor: user?.role === 'User' ? '#f8fafc' : '#ffffff' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Detailed Description <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <textarea
              required
              rows={6}
              placeholder="Provide exact details, steps to reproduce, or error messages..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field"
              style={{ resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ opacity: loading ? 0.75 : 1 }}
            >
              <Send size={16} />
              {loading ? 'Submitting...' : 'Submit Support Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

