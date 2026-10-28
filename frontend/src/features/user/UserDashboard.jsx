import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../api/client';
import { useAuth } from '../auth/AuthContext';
import { StatusBadge, PriorityBadge } from '../tickets/TicketBadge';
import { 
  PlusCircle, 
  Search, 
  Inbox, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  MessageSquare, 
  HelpCircle,
  RefreshCw 
} from 'lucide-react';

export default function UserDashboard() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchUserTickets = async () => {
    try {
      setLoading(true);
      let query = '';
      const params = [];
      if (search.trim()) params.push(`search=${encodeURIComponent(search.trim())}`);
      if (statusFilter !== 'all') params.push(`status=${statusFilter}`);
      if (params.length > 0) query = `?${params.join('&')}`;

      const res = await apiRequest(`/tickets${query}`);
      setTickets(res.data || []);
    } catch (err) {
      console.error('Failed to load tickets', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserTickets();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUserTickets();
  };

  const totalCount = tickets.length;
  const openCount = tickets.filter((t) => t.status !== 'Resolved').length;
  const resolvedCount = tickets.filter((t) => t.status === 'Resolved').length;

  return (
    <div style={{ maxWidth: '1240px', margin: '32px auto', padding: '0 24px' }}>
      {/* Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)',
        border: '1px solid var(--brand-border)',
        borderRadius: '16px',
        padding: '32px',
        marginBottom: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Customer Support Portal
          </span>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '4px 0 8px 0' }}>
            Hello, {user?.name || 'Customer'}
          </h1>
          <p style={{ color: '#475569', fontSize: '0.95rem', margin: 0, maxWidth: '600px' }}>
            Track the status of your reported issues, communicate directly with our assigned support agents, and confirm resolutions.
          </p>
        </div>

        <Link
          to="/new-ticket"
          className="btn-primary"
          style={{
            padding: '12px 22px',
            fontSize: '0.95rem',
            boxShadow: '0 4px 14px rgba(5, 150, 105, 0.3)'
          }}
        >
          <PlusCircle size={18} />
          Raise a New Ticket
        </Link>
      </div>

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
        <div className="card" style={{ padding: '22px 26px', display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            backgroundColor: '#eff6ff',
            color: '#2563eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Inbox size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Total My Tickets</span>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>{totalCount}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '22px 26px', display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            backgroundColor: '#fffbeb',
            color: '#d97706',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Clock size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Open & In Progress</span>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>{openCount}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '22px 26px', display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            backgroundColor: '#ecfdf5',
            color: 'var(--brand)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Resolved Tickets</span>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>{resolvedCount}</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, maxWidth: '450px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search by ticket subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field"
              style={{ paddingLeft: '36px' }}
            />
          </div>
          <button type="submit" className="btn-secondary" style={{ padding: '9px 16px' }}>
            Search
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {['all', 'Open', 'In Progress', 'Resolved'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              style={{
                padding: '7px 14px',
                borderRadius: '8px',
                fontSize: '0.825rem',
                fontWeight: 600,
                color: statusFilter === st ? 'var(--brand)' : '#64748b',
                backgroundColor: statusFilter === st ? 'var(--brand-light)' : 'transparent',
                border: `1px solid ${statusFilter === st ? 'var(--brand-border)' : 'transparent'}`,
              }}
            >
              {st === 'all' ? 'All Status' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Ticket List */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            My Tickets
          </h2>
          <span style={{ fontSize: '0.825rem', color: '#64748b' }}>
            Showing {tickets.length} ticket{tickets.length === 1 ? '' : 's'}
          </span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 10px' }} />
            <p>Loading your tickets...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
            <Inbox size={42} color="#cbd5e1" style={{ margin: '0 auto 14px' }} />
            <h3 style={{ fontSize: '1.1rem', color: '#334155', marginBottom: '6px' }}>No tickets found</h3>
            <p style={{ fontSize: '0.875rem', marginBottom: '20px' }}>
              {search ? 'Try clearing your search term.' : 'You haven\'t raised any support tickets yet.'}
            </p>
            <Link to="/new-ticket" className="btn-primary">
              <PlusCircle size={16} /> Raise Your First Ticket
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {tickets.map((t, idx) => (
              <div
                key={t._id}
                style={{
                  padding: '20px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: idx === tickets.length - 1 ? 'none' : '1px solid var(--border-subtle)',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fbfdfc')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxWidth: '65%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>
                      #{t._id.slice(-6)}
                    </span>
                    <Link
                      to={`/tickets/${t._id}`}
                      style={{
                        fontSize: '1.02rem',
                        fontWeight: 700,
                        color: '#0f172a',
                        textDecoration: 'none',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--brand)')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#0f172a')}
                    >
                      {t.subject}
                    </Link>
                  </div>

                  <p style={{
                    fontSize: '0.85rem',
                    color: '#64748b',
                    margin: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {t.description}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>
                    <span>Assigned to: <strong style={{ color: '#475569' }}>{t.assignee && t.assignee !== 'Unassigned' ? t.assignee : 'Pending Agent'}</strong></span>
                    <span>•</span>
                    <span>Updated {new Date(t.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <PriorityBadge priority={t.priority} />
                  <StatusBadge status={t.status} />

                  <Link
                    to={`/tickets/${t._id}`}
                    className="btn-soft-green"
                    style={{ padding: '7px 14px' }}
                  >
                    <span>View Discussion</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

