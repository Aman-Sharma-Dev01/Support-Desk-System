import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../api/client';
import { StatusBadge, PriorityBadge } from '../tickets/TicketBadge';
import { 
  Users, 
  Inbox, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  UserPlus, 
  ArrowRight, 
  Trash2,
  RefreshCw 
} from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, ticketsRes, agentsRes] = await Promise.all([
        apiRequest('/dashboard/stats'),
        apiRequest('/tickets?limit=8'),
        apiRequest('/agents'),
      ]);

      setStats(statsRes.data);
      setTickets(ticketsRes.data || []);
      setAgents(agentsRes.data || []);
    } catch (err) {
      console.error('Failed to load admin stats', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Quick assign ticket to agent
  const handleAssignAgent = async (ticketId, agentName) => {
    try {
      await apiRequest(`/tickets/${ticketId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          assignee: agentName,
          status: agentName !== 'Unassigned' ? 'Assigned' : 'Open',
        }),
      });
      fetchDashboardData();
    } catch (err) {
      alert(err.message || 'Failed to update assignee');
    }
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '32px auto', padding: '0 24px' }}>
      {/* Admin Header */}
      <div style={{
        background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
        borderRadius: '16px',
        padding: '32px',
        marginBottom: '32px',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 10px 25px -5px rgba(5, 150, 105, 0.3)'
      }}>
        <div>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.9 }}>
            System Administration
          </span>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '4px 0 8px 0', letterSpacing: '-0.02em' }}>
            Help Desk Control Center
          </h1>
          <p style={{ margin: 0, opacity: 0.9, fontSize: '0.95rem', maxWidth: '600px' }}>
            Monitor operational health, delegate tickets across support agents, and manage team members.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <Link
            to="/admin/agents"
            style={{
              padding: '11px 20px',
              borderRadius: '10px',
              backgroundColor: '#ffffff',
              color: 'var(--brand)',
              fontWeight: 700,
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
            }}
          >
            <UserPlus size={17} /> Register New Agent
          </Link>
        </div>
      </div>

      {/* KPI Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
        <div className="card" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Total System Tickets</span>
            <Inbox size={18} color="var(--brand)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>
            {stats?.totalTickets || 0}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>Active database load</span>
        </div>

        <div className="card" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>In Progress / Assigned</span>
            <Clock size={18} color="#d97706" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>
            {(stats?.openTickets || 0) + (stats?.inProgressTickets || 0)}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
            {stats?.waitingTickets || 0} waiting on customer
          </span>
        </div>

        <div className="card" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Overdue Tickets ({'>'}24h)</span>
            <AlertTriangle size={18} color="#dc2626" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#dc2626' }}>
            {stats?.overdueTickets || 0}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 600 }}>Requires immediate triage</span>
        </div>

        <div className="card" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Resolved Tickets</span>
            <CheckCircle2 size={18} color="#16a34a" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#16a34a' }}>
            {stats?.resolvedTickets || 0}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>Completed successfully</span>
        </div>
      </div>

      {/* Two columns: Recent Tickets with Delegate Dropdown + Registered Agents Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>
        {/* Left Column: Tickets Delegate Table */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Recent Tickets & Assignee Delegation
              </h2>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Assign any ticket directly to any agent
              </span>
            </div>
            <Link to="/admin/tickets" className="btn-soft-green" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
              View All Tickets
            </Link>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
              <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 10px' }} />
              <p>Loading tickets...</p>
            </div>
          ) : tickets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
              No tickets recorded.
            </div>
          ) : (
            <div>
              {tickets.map((t, idx) => (
                <div
                  key={t._id}
                  style={{
                    padding: '16px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: idx === tickets.length - 1 ? 'none' : '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ maxWidth: '50%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>
                        #{t._id.slice(-6)}
                      </span>
                      <Link
                        to={`/tickets/${t._id}`}
                        style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--brand)')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#0f172a')}
                      >
                        {t.subject}
                      </Link>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      Customer: {t.customer}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <PriorityBadge priority={t.priority} />
                    <StatusBadge status={t.status} />

                    {/* Agent Delegate Dropdown */}
                    <div style={{ minWidth: '160px' }}>
                      <select
                        value={t.assignee || 'Unassigned'}
                        onChange={(e) => handleAssignAgent(t._id, e.target.value)}
                        className="input-field"
                        style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                      >
                        <option value="Unassigned">Unassigned</option>
                        {agents.map((ag) => (
                          <option key={ag._id} value={ag.name}>
                            {ag.name} ({ag.role})
                          </option>
                        ))}
                      </select>
                    </div>

                    <Link
                      to={`/tickets/${t._id}`}
                      className="btn-secondary"
                      style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Support Agents Overview */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={18} color="var(--brand)" /> Support Team ({agents.length})
            </h3>
            <Link to="/admin/agents" style={{ fontSize: '0.8rem', color: 'var(--brand)', fontWeight: 700 }}>
              + Add
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {agents.map((ag) => (
              <div
                key={ag._id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  backgroundColor: '#f8faf9',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1, overflow: 'hidden' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--brand-light)',
                    color: 'var(--brand)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    flexShrink: 0
                  }}>
                    {ag.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0, overflow: 'hidden' }}>
                    <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ag.name}
                    </span>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ag.email}
                    </span>
                  </div>
                </div>

                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '6px',
                  backgroundColor: ag.role === 'Admin' ? '#fdf2f8' : '#ecfdf5',
                  color: ag.role === 'Admin' ? '#9d174d' : '#047857',
                  flexShrink: 0,
                  marginLeft: '8px'
                }}>
                  {ag.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
