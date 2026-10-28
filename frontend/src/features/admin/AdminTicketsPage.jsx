import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../api/client';
import { StatusBadge, PriorityBadge } from '../tickets/TicketBadge';
import { Search, Filter, Trash2, ArrowRight, RefreshCw, Inbox, AlertTriangle } from 'lucide-react';

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [overdueOnly, setOverdueOnly] = useState(false);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const params = [];
      if (search.trim()) params.push(`search=${encodeURIComponent(search.trim())}`);
      if (statusFilter !== 'all') params.push(`status=${statusFilter}`);
      if (priorityFilter !== 'all') params.push(`priority=${priorityFilter}`);
      if (overdueOnly) params.push('overdueOnly=true');

      const query = params.length > 0 ? `?${params.join('&')}` : '';
      const [ticketsRes, agentsRes] = await Promise.all([
        apiRequest(`/tickets${query}`),
        apiRequest('/agents'),
      ]);

      setTickets(ticketsRes.data || []);
      setAgents(agentsRes.data || []);
    } catch (err) {
      console.error('Failed to load tickets', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [statusFilter, priorityFilter, overdueOnly]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTickets();
  };

  const handleAssignAgent = async (ticketId, agentName) => {
    try {
      await apiRequest(`/tickets/${ticketId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          assignee: agentName,
          status: agentName !== 'Unassigned' ? 'Assigned' : 'Open',
        }),
      });
      fetchTickets();
    } catch (err) {
      alert(err.message || 'Failed to update assignee');
    }
  };

  const handleDeleteTicket = async (ticketId, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this ticket and all its comments permanently?')) return;
    try {
      await apiRequest(`/tickets/${ticketId}`, { method: 'DELETE' });
      fetchTickets();
    } catch (err) {
      alert(err.message || 'Failed to delete ticket');
    }
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '32px auto', padding: '0 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0' }}>
            All System Tickets
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
            Assign tickets, monitor resolution statuses, and delete stale requests.
          </p>
        </div>

        <button
          onClick={fetchTickets}
          className="btn-secondary"
          style={{ padding: '8px 14px', fontSize: '0.85rem' }}
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 300px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search by subject or customer..."
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
            onClick={() => setOverdueOnly(!overdueOnly)}
            style={{
              padding: '7px 14px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: overdueOnly ? '#fef2f2' : '#ffffff',
              color: overdueOnly ? '#dc2626' : '#64748b',
              border: `1px solid ${overdueOnly ? '#fecaca' : 'var(--border-light)'}`
            }}
          >
            <AlertTriangle size={14} />
            Overdue Only
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 10px' }} />
            <p>Loading tickets...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
            <Inbox size={42} color="#cbd5e1" style={{ margin: '0 auto 14px' }} />
            <h3 style={{ fontSize: '1.1rem', color: '#334155', marginBottom: '6px' }}>No tickets match filters</h3>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8faf9', borderBottom: '1px solid var(--border-subtle)' }}>
                <th style={{ padding: '14px 20px', fontWeight: 700, color: '#475569' }}>Ticket ID & Subject</th>
                <th style={{ padding: '14px 20px', fontWeight: 700, color: '#475569' }}>Customer</th>
                <th style={{ padding: '14px 20px', fontWeight: 700, color: '#475569' }}>Priority</th>
                <th style={{ padding: '14px 20px', fontWeight: 700, color: '#475569' }}>Status</th>
                <th style={{ padding: '14px 20px', fontWeight: 700, color: '#475569' }}>Assigned Agent</th>
                <th style={{ padding: '14px 20px', fontWeight: 700, color: '#475569', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr
                  key={t._id}
                  style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background-color 0.15s ease' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fbfdfc')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <td style={{ padding: '16px 20px', maxWidth: '320px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>
                        #{t._id.slice(-6)}
                      </span>
                      <Link
                        to={`/tickets/${t._id}`}
                        style={{ fontWeight: 700, color: '#0f172a' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--brand)')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#0f172a')}
                      >
                        {t.subject}
                      </Link>
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px', color: '#64748b' }}>{t.customer}</td>
                  <td style={{ padding: '16px 20px' }}>
                    <PriorityBadge priority={t.priority} />
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <StatusBadge status={t.status} />
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <select
                      value={t.assignee || 'Unassigned'}
                      onChange={(e) => handleAssignAgent(t._id, e.target.value)}
                      className="input-field"
                      style={{ padding: '6px 10px', fontSize: '0.8rem', width: 'auto' }}
                    >
                      <option value="Unassigned">Unassigned</option>
                      {agents.map((ag) => (
                        <option key={ag._id} value={ag.name}>
                          {ag.name} ({ag.role})
                        </option>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                      <Link
                        to={`/tickets/${t._id}`}
                        className="btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                      >
                        View
                      </Link>
                      <button
                        onClick={(e) => handleDeleteTicket(t._id, e)}
                        title="Delete Ticket"
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
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

