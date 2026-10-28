import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../api/client';
import { useAuth } from '../auth/AuthContext';
import { StatusBadge, PriorityBadge } from '../tickets/TicketBadge';
import { 
  Inbox, 
  UserCheck, 
  AlertTriangle, 
  Search, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  UserPlus, 
  RefreshCw,
  Check
} from 'lucide-react';

export default function AgentDashboard() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all'); // 'all', 'unassigned', 'my', 'overdue'
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Global KPI stats that don't reset when filtering
  const [globalCounts, setGlobalCounts] = useState({ total: 0, unassigned: 0, myAssigned: 0 });

  const fetchGlobalCounts = async () => {
    try {
      const res = await apiRequest('/tickets');
      const all = res.data || [];
      setGlobalCounts({
        total: all.length,
        unassigned: all.filter((t) => !t.assignee || t.assignee === 'Unassigned').length,
        myAssigned: all.filter((t) => t.assignee === user?.name).length,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const params = [];
      if (search.trim()) params.push(`search=${encodeURIComponent(search.trim())}`);
      if (statusFilter !== 'all') params.push(`status=${statusFilter}`);
      if (priorityFilter !== 'all') params.push(`priority=${priorityFilter}`);

      if (tab === 'unassigned') {
        params.push('assignee=Unassigned');
      } else if (tab === 'my' && user?.name) {
        params.push(`assignee=${encodeURIComponent(user.name)}`);
      } else if (tab === 'overdue') {
        params.push('overdueOnly=true');
      }

      const queryString = params.length > 0 ? `?${params.join('&')}` : '';
      const res = await apiRequest(`/tickets${queryString}`);
      setTickets(res.data || []);
    } catch (err) {
      console.error('Failed to load tickets', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    fetchGlobalCounts();
  }, [tab, statusFilter, priorityFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTickets();
  };

  // Agent: Claim ticket
  const handleClaimTicket = async (ticketId, e) => {
    e.stopPropagation();
    if (!user) return;
    setActionLoadingId(ticketId);
    try {
      await apiRequest(`/tickets/${ticketId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          assignee: user.name,
          status: 'Assigned',
        }),
      });
      await Promise.all([fetchTickets(), fetchGlobalCounts()]);
    } catch (err) {
      alert(err.message || 'Failed to claim ticket');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Agent: Quick resolve ticket
  const handleQuickResolve = async (ticketId, e) => {
    e.stopPropagation();
    setActionLoadingId(ticketId);
    try {
      await apiRequest(`/tickets/${ticketId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'Resolved',
        }),
      });
      await Promise.all([fetchTickets(), fetchGlobalCounts()]);
    } catch (err) {
      alert(err.message || 'Failed to resolve ticket');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '32px auto', padding: '0 24px' }}>
      {/* Top Banner (Light Green Theme with Professional Card) */}
      <div style={{
        background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)',
        border: '1px solid var(--brand-border)',
        borderRadius: '16px',
        padding: '28px 32px',
        marginBottom: '28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Agent Help Desk
          </span>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '4px 0 6px 0' }}>
            Welcome, {user?.name}
          </h1>
          <p style={{ color: '#475569', fontSize: '0.925rem', margin: 0 }}>
            Pick up incoming customer tickets, reply to issues, and resolve tickets efficiently.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{
            padding: '12px 22px',
            borderRadius: '12px',
            backgroundColor: '#ffffff',
            border: '1px solid var(--brand-border)',
            textAlign: 'center',
            boxShadow: '0 2px 4px rgba(5, 150, 105, 0.08)'
          }}>
            <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--brand)', textTransform: 'uppercase' }}>
              My Active Tickets
            </span>
            <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>
              {globalCounts.myAssigned}
            </span>
          </div>

          <div style={{
            padding: '12px 22px',
            borderRadius: '12px',
            backgroundColor: '#ffffff',
            border: '1px solid #fde68a',
            textAlign: 'center',
            boxShadow: '0 2px 4px rgba(217, 119, 6, 0.08)'
          }}>
            <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#b45309', textTransform: 'uppercase' }}>
              Unassigned Queue
            </span>
            <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>
              {globalCounts.unassigned}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {[
          { key: 'all', label: 'All Tickets', icon: Inbox },
          { key: 'unassigned', label: 'Unassigned Queue', icon: UserPlus },
          { key: 'my', label: 'Assigned to Me', icon: UserCheck },
          { key: 'overdue', label: 'Overdue SLA (>24h)', icon: AlertTriangle },
        ].map((item) => {
          const Icon = item.icon;
          const isSelected = tab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '10px',
                fontSize: '0.875rem',
                fontWeight: 700,
                color: isSelected ? '#ffffff' : '#64748b',
                backgroundColor: isSelected ? 'var(--brand)' : '#ffffff',
                border: isSelected ? '1px solid var(--brand)' : '1px solid var(--border-light)',
                boxShadow: isSelected ? '0 2px 6px rgba(5, 150, 105, 0.25)' : 'none',
              }}
            >
              <Icon size={16} />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 300px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search by subject or customer name..."
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field"
              style={{ padding: '7px 12px', fontSize: '0.825rem', width: 'auto' }}
            >
              <option value="all">All</option>
              <option value="Open">Open</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Waiting on Customer">Waiting on Customer</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="input-field"
              style={{ padding: '7px 12px', fontSize: '0.825rem', width: 'auto' }}
            >
              <option value="all">All</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <button
            onClick={() => { setSearch(''); setStatusFilter('all'); setPriorityFilter('all'); setTab('all'); }}
            className="btn-secondary"
            style={{ padding: '7px 12px', fontSize: '0.8rem' }}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Tickets List */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Ticket Queue ({tickets.length})
          </h2>
          <button
            onClick={() => { fetchTickets(); fetchGlobalCounts(); }}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--brand)', fontWeight: 600 }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 10px' }} />
            <p>Loading tickets...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
            <Inbox size={42} color="#cbd5e1" style={{ margin: '0 auto 14px' }} />
            <h3 style={{ fontSize: '1.1rem', color: '#334155', marginBottom: '6px' }}>No tickets in this view</h3>
            <p style={{ fontSize: '0.875rem' }}>All caught up! Check other tabs or reset filters.</p>
          </div>
        ) : (
          <div>
            {tickets.map((t, idx) => {
              const isAssignedToMe = t.assignee === user?.name;
              const isResolved = t.status === 'Resolved';
              const isActionLoading = actionLoadingId === t._id;

              return (
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxWidth: '55%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>
                        #{t._id.slice(-6)}
                      </span>
                      <Link
                        to={`/tickets/${t._id}`}
                        style={{
                          fontSize: '1rem',
                          fontWeight: 700,
                          color: '#0f172a',
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

                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.78rem', color: '#94a3b8' }}>
                      <span>Customer: <strong style={{ color: '#475569' }}>{t.customer}</strong></span>
                      <span>•</span>
                      <span>Assignee: <strong style={{ color: isAssignedToMe ? 'var(--brand)' : '#475569' }}>
                        {isAssignedToMe ? 'You' : (t.assignee || 'Unassigned')}
                      </strong></span>
                      <span>•</span>
                      <span>Updated {new Date(t.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <PriorityBadge priority={t.priority} />
                    <StatusBadge status={t.status} />

                    {/* Claim Button: If not assigned to me, show Claim */}
                    {!isAssignedToMe && (
                      <button
                        onClick={(e) => handleClaimTicket(t._id, e)}
                        disabled={isActionLoading}
                        className="btn-soft-green"
                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                      >
                        <UserCheck size={14} />
                        {isActionLoading ? 'Updating...' : 'Claim Ticket'}
                      </button>
                    )}

                    {/* Direct 1-Click Resolve Button for Agent */}
                    {!isResolved && (
                      <button
                        onClick={(e) => handleQuickResolve(t._id, e)}
                        disabled={isActionLoading}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          backgroundColor: '#ecfdf5',
                          color: '#047857',
                          border: '1px solid #a7f3d0',
                        }}
                        title="Mark ticket as resolved"
                      >
                        <Check size={14} />
                        <span>Resolve</span>
                      </button>
                    )}

                    <Link
                      to={`/tickets/${t._id}`}
                      className="btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                    >
                      <span>Manage</span>
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
