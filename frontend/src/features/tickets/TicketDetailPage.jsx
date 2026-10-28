import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiRequest } from '../../api/client';
import { useAuth } from '../auth/AuthContext';
import { StatusBadge, PriorityBadge } from './TicketBadge';
import { 
  ArrowLeft, 
  Send, 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  UserCheck, 
  MessageSquare, 
  Lock, 
  AlertTriangle, 
  Trash2, 
  Activity as ActivityIcon,
  HelpCircle,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

export default function TicketDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isUser, isAgent, isAdmin, isStaff } = useAuth();

  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [activities, setActivities] = useState([]);
  const [agentsList, setAgentsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Comment input state
  const [newComment, setNewComment] = useState('');
  const [commentType, setCommentType] = useState('reply'); // 'reply' or 'note'
  const [submittingComment, setSubmittingComment] = useState(false);

  // Resolution prompt state
  const [resolutionFeedback, setResolutionFeedback] = useState('');
  const [showReopenBox, setShowReopenBox] = useState(false);
  const [submittingResolution, setSubmittingResolution] = useState(false);

  // Status/assignee action loading
  const [actionLoading, setActionLoading] = useState(false);

  const fetchTicketData = async () => {
    try {
      setLoading(true);
      const [ticketRes, commentsRes, activitiesRes] = await Promise.all([
        apiRequest(`/tickets/${id}`),
        apiRequest(`/tickets/${id}/comments`),
        apiRequest(`/tickets/${id}/activities`),
      ]);

      setTicket(ticketRes.data);
      setComments(commentsRes.data || []);
      setActivities(activitiesRes.data || []);

      if (isStaff) {
        const agentsRes = await apiRequest('/agents').catch(() => ({ data: [] }));
        setAgentsList(agentsRes.data || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load ticket details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicketData();
  }, [id]);

  // Handle post comment
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmittingComment(true);
    try {
      await apiRequest(`/tickets/${id}/comments`, {
        method: 'POST',
        body: JSON.stringify({
          content: newComment.trim(),
          type: commentType,
          authorName: user?.name || 'Support Agent',
          authorEmail: user?.email || '',
        }),
      });

      setNewComment('');
      fetchTicketData();
    } catch (err) {
      alert(err.message || 'Failed to post response');
    } finally {
      setSubmittingComment(false);
    }
  };

  // Agent: Assign ticket to self
  const handleAssignToSelf = async () => {
    if (!user) return;
    setActionLoading(true);
    try {
      await apiRequest(`/tickets/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          assignee: user.name,
          status: ticket.status === 'Open' ? 'Assigned' : ticket.status,
        }),
      });
      fetchTicketData();
    } catch (err) {
      alert(err.message || 'Failed to assign ticket to yourself');
    } finally {
      setActionLoading(false);
    }
  };

  // Admin: Assign to any agent
  const handleAssignToAgent = async (agentName) => {
    setActionLoading(true);
    try {
      await apiRequest(`/tickets/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          assignee: agentName,
          status: agentName !== 'Unassigned' && ticket.status === 'Open' ? 'Assigned' : ticket.status,
        }),
      });
      fetchTicketData();
    } catch (err) {
      alert(err.message || 'Failed to assign ticket');
    } finally {
      setActionLoading(false);
    }
  };

  // Staff: Change status directly
  const handleStatusChange = async (newStatus) => {
    setActionLoading(true);
    try {
      await apiRequest(`/tickets/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      fetchTicketData();
    } catch (err) {
      alert(err.message || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  // Staff: Change priority
  const handlePriorityChange = async (newPriority) => {
    setActionLoading(true);
    try {
      await apiRequest(`/tickets/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ priority: newPriority }),
      });
      fetchTicketData();
    } catch (err) {
      alert(err.message || 'Failed to update priority');
    } finally {
      setActionLoading(false);
    }
  };

  // Admin: Delete ticket
  const handleDeleteTicket = async () => {
    if (!window.confirm('Are you sure you want to delete this ticket and all its history?')) return;
    try {
      await apiRequest(`/tickets/${id}`, { method: 'DELETE' });
      navigate('/dashboard');
    } catch (err) {
      alert(err.message || 'Failed to delete ticket');
    }
  };

  // User: Confirm resolution (Yes or No)
  const handleConfirmResolution = async (resolved) => {
    setSubmittingResolution(true);
    try {
      await apiRequest(`/tickets/${id}/confirm-resolution`, {
        method: 'POST',
        body: JSON.stringify({
          resolved,
          feedback: resolutionFeedback.trim(),
        }),
      });
      setShowReopenBox(false);
      setResolutionFeedback('');
      fetchTicketData();
    } catch (err) {
      alert(err.message || 'Failed to confirm resolution status');
    } finally {
      setSubmittingResolution(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px', color: '#64748b' }}>
        <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px' }} />
        <p>Loading ticket discussion...</p>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div style={{ maxWidth: '600px', margin: '60px auto', padding: '0 20px', textAlign: 'center' }}>
        <div className="card" style={{ padding: '32px' }}>
          <AlertTriangle size={36} color="#ef4444" style={{ margin: '0 auto 12px' }} />
          <h2 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Cannot View Ticket</h2>
          <p style={{ color: '#64748b', marginBottom: '20px' }}>{error || 'Ticket not found'}</p>
          <Link to="/dashboard" className="btn-primary">Return to Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1240px', margin: '24px auto', padding: '0 20px' }}>
      {/* Top Bar with Back and Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: '#64748b',
            fontSize: '0.875rem',
            fontWeight: 600,
          }}
        >
          <ArrowLeft size={16} /> Back to Tickets
        </button>

        {isAdmin && (
          <button
            onClick={handleDeleteTicket}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid #fecaca',
              backgroundColor: '#fef2f2',
              color: '#dc2626',
              fontSize: '0.8rem',
              fontWeight: 600,
            }}
          >
            <Trash2 size={14} /> Delete Ticket
          </button>
        )}
      </div>

      {/* Main 2-column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>
        {/* Left Column: Ticket Details + Discussion + Resolution Prompt */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Ticket Header & Description Card */}
          <div className="card" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Ticket #{ticket._id.slice(-6)}
                </span>
                <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', margin: '4px 0 8px 0', lineHeight: 1.3 }}>
                  {ticket.subject}
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.82rem', color: '#64748b' }}>
                  <span>Created by <strong>{ticket.customer}</strong></span>
                  <span>•</span>
                  <span>{new Date(ticket.createdAt).toLocaleString()}</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                <StatusBadge status={ticket.status} />
                <PriorityBadge priority={ticket.priority} />
              </div>
            </div>

            {/* Ticket Description */}
            <div style={{
              backgroundColor: '#f8faf9',
              borderRadius: '10px',
              padding: '18px 20px',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.925rem',
              color: '#334155',
              whiteSpace: 'pre-wrap',
              lineHeight: 1.6
            }}>
              {ticket.description}
            </div>
          </div>

          {/* USER RESOLUTION CONFIRMATION WORKFLOW: "At the end ask user that your ticket is resolved or not" */}
          {isUser && (
            <div className="card" style={{
              padding: '24px',
              border: ticket.status === 'Resolved' ? '2px solid var(--brand)' : '1px solid #fed7aa',
              backgroundColor: ticket.status === 'Resolved' ? '#f0fdf7' : '#fffbeb',
              boxShadow: 'var(--shadow-md)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: ticket.status === 'Resolved' ? 'var(--brand)' : '#f59e0b',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <HelpCircle size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    {ticket.status === 'Resolved'
                      ? 'Ticket marked as Resolved. Is your issue fully solved?'
                      : 'Is your support request resolved?'}
                  </h3>
                  <p style={{ fontSize: '0.825rem', color: '#64748b', margin: 0 }}>
                    Please let us know so we can confirm completion or keep assisting you.
                  </p>
                </div>
              </div>

              {!showReopenBox ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '16px' }}>
                  <button
                    onClick={() => handleConfirmResolution(true)}
                    disabled={submittingResolution || ticket.status === 'Resolved'}
                    className="btn-primary"
                    style={{
                      padding: '9px 18px',
                      backgroundColor: 'var(--brand)',
                      fontSize: '0.85rem'
                    }}
                  >
                    <CheckCircle2 size={16} />
                    Yes, My Issue is Resolved!
                  </button>

                  <button
                    onClick={() => setShowReopenBox(true)}
                    className="btn-secondary"
                    style={{
                      padding: '9px 18px',
                      fontSize: '0.85rem',
                      borderColor: '#fca5a5',
                      color: '#b91c1c'
                    }}
                  >
                    <XCircle size={16} />
                    No, I Still Need Help
                  </button>
                </div>
              ) : (
                <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label style={{ fontSize: '0.825rem', fontWeight: 600, color: '#334155' }}>
                    What still needs resolution? (Optional feedback):
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe what is still not working..."
                    value={resolutionFeedback}
                    onChange={(e) => setResolutionFeedback(e.target.value)}
                    className="input-field"
                  />
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => handleConfirmResolution(false)}
                      disabled={submittingResolution}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        backgroundColor: '#dc2626',
                        color: '#ffffff',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <RefreshCw size={14} /> Reopen Ticket for Agent
                    </button>
                    <button
                      onClick={() => setShowReopenBox(false)}
                      className="btn-secondary"
                      style={{ padding: '8px 14px', fontSize: '0.85rem' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Conversation / Responses Stream */}
          <div className="card" style={{ padding: '28px' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare size={18} color="var(--brand)" />
              Responses & Discussion ({comments.length})
            </h2>

            {comments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 20px', color: '#94a3b8', fontSize: '0.9rem' }}>
                No responses yet. Write a message below to start the conversation.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginBottom: '28px' }}>
                {comments.map((c) => {
                  const isAgent = c.authorRole === 'Agent' || (!c.authorRole && ticket.assignee && c.authorName === ticket.assignee);
                  const isAdmin = c.authorRole === 'Admin';
                  const isCustomer = c.authorRole === 'User' || (!c.authorRole && ticket.customer && ticket.customer.includes(c.authorName));
                  const isStaff = isAgent || isAdmin || c.type === 'note';

                  const avatarBg = c.type === 'note' ? '#fde68a' : (isAdmin ? '#fdf2f8' : (isAgent ? 'var(--brand-light)' : '#eff6ff'));
                  const avatarColor = c.type === 'note' ? '#92400e' : (isAdmin ? '#9d174d' : (isAgent ? 'var(--brand)' : '#1d4ed8'));

                  return (
                    <div
                      key={c._id}
                      style={{
                        padding: '18px 20px',
                        borderRadius: '12px',
                        border: c.type === 'note' ? '1.5px dashed #fcd34d' : '1px solid var(--border-light)',
                        backgroundColor: c.type === 'note' ? '#fffbeb' : '#ffffff',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            backgroundColor: avatarBg,
                            color: avatarColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.8rem'
                          }}>
                            {c.authorName?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a' }}>
                                {c.authorName}
                              </span>
                              {c.type === 'note' ? (
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '0.7rem',
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  backgroundColor: '#fef3c7',
                                  color: '#b45309',
                                  fontWeight: 700,
                                }}>
                                  <Lock size={11} /> Internal Note
                                </span>
                              ) : isAdmin ? (
                                <span style={{
                                  fontSize: '0.7rem',
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  backgroundColor: '#fdf2f8',
                                  color: '#9d174d',
                                  fontWeight: 700,
                                }}>
                                  Admin
                                </span>
                              ) : isAgent ? (
                                <span style={{
                                  fontSize: '0.7rem',
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  backgroundColor: 'var(--brand-light)',
                                  color: 'var(--brand)',
                                  fontWeight: 700,
                                }}>
                                  Support Agent
                                </span>
                              ) : (
                                <span style={{
                                  fontSize: '0.7rem',
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  backgroundColor: '#eff6ff',
                                  color: '#1d4ed8',
                                  fontWeight: 700,
                                }}>
                                  Customer
                                </span>
                              )}
                            </div>
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                              {new Date(c.createdAt).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div style={{
                        fontSize: '0.9rem',
                        color: c.type === 'note' ? '#78350f' : '#334155',
                        lineHeight: 1.6,
                        whiteSpace: 'pre-wrap'
                      }}>
                        {c.content}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Post Reply / Internal Note Form */}
            <form onSubmit={handleAddComment} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {isStaff && (
                <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
                  <button
                    type="button"
                    onClick={() => setCommentType('reply')}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: commentType === 'reply' ? 'var(--brand)' : '#64748b',
                      backgroundColor: commentType === 'reply' ? 'var(--brand-light)' : '#f1f5f3',
                      border: `1px solid ${commentType === 'reply' ? 'var(--brand-border)' : 'transparent'}`
                    }}
                  >
                    Public Reply to Customer
                  </button>
                  <button
                    type="button"
                    onClick={() => setCommentType('note')}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: commentType === 'note' ? '#b45309' : '#64748b',
                      backgroundColor: commentType === 'note' ? '#fef3c7' : '#f1f5f3',
                      border: `1px solid ${commentType === 'note' ? '#fde68a' : 'transparent'}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Lock size={12} /> Internal Staff Note
                  </button>
                </div>
              )}

              <textarea
                rows={4}
                required
                placeholder={
                  commentType === 'note'
                    ? 'Write an internal note only visible to agents and admins...'
                    : 'Write a response to the customer...'
                }
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="input-field"
                style={{
                  borderColor: commentType === 'note' ? '#fde68a' : 'var(--border-light)',
                  backgroundColor: commentType === 'note' ? '#fffdf7' : '#ffffff'
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  disabled={submittingComment}
                  className="btn-primary"
                  style={{
                    backgroundColor: commentType === 'note' ? '#d97706' : 'var(--brand)',
                    opacity: submittingComment ? 0.75 : 1
                  }}
                >
                  <Send size={15} />
                  {submittingComment ? 'Sending...' : (commentType === 'note' ? 'Save Internal Note' : 'Send Response')}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Sidebar: Status, Assignee, Actions & Activity Log */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Quick Actions / Assign Card */}
          <div className="card" style={{ padding: '22px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', marginBottom: '16px' }}>
              Ticket Management
            </h3>

            {/* Agent "Claim Ticket" Action */}
            {isAgent && (
              <div style={{ marginBottom: '16px' }}>
                <button
                  onClick={handleAssignToSelf}
                  disabled={actionLoading || ticket.assignee === user?.name}
                  className="btn-primary"
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    backgroundColor: ticket.assignee === user?.name ? '#10b981' : 'var(--brand)',
                    fontSize: '0.85rem'
                  }}
                >
                  <UserCheck size={16} />
                  {ticket.assignee === user?.name ? 'Assigned to You' : 'Claim / Assign to Myself'}
                </button>
              </div>
            )}

            {/* Quick Resolve Button for Staff */}
            {isStaff && ticket.status !== 'Resolved' && (
              <div style={{ marginBottom: '16px' }}>
                <button
                  onClick={() => handleStatusChange('Resolved')}
                  disabled={actionLoading}
                  className="btn-primary"
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    backgroundColor: '#059669',
                    fontSize: '0.85rem'
                  }}
                >
                  <CheckCircle size={16} /> Mark as Resolved
                </button>
              </div>
            )}

            {/* Reopen Button for Staff if Resolved */}
            {isStaff && ticket.status === 'Resolved' && (
              <div style={{ marginBottom: '16px' }}>
                <button
                  onClick={() => handleStatusChange('In Progress')}
                  disabled={actionLoading}
                  className="btn-secondary"
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    fontSize: '0.85rem',
                    color: '#d97706',
                    borderColor: '#fde68a'
                  }}
                >
                  <RefreshCw size={14} /> Reopen Ticket
                </button>
              </div>
            )}

            {/* Admin: Assign to ANY Agent Dropdown */}
            {isAdmin && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Assigned Agent
                </label>
                <select
                  value={ticket.assignee || 'Unassigned'}
                  onChange={(e) => handleAssignToAgent(e.target.value)}
                  disabled={actionLoading}
                  className="input-field"
                  style={{ fontSize: '0.85rem' }}
                >
                  <option value="Unassigned">Unassigned</option>
                  {agentsList.map((ag) => (
                    <option key={ag._id} value={ag.name}>
                      {ag.name} ({ag.role})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* For User: Show Assignee name */}
            {isUser && (
              <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  Handled By
                </span>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>
                  {ticket.assignee && ticket.assignee !== 'Unassigned' ? ticket.assignee : 'Awaiting Assignment'}
                </span>
              </div>
            )}

            {/* Staff: Status updater dropdown */}
            {isStaff && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Change Status
                </label>
                <select
                  value={ticket.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  disabled={actionLoading}
                  className="input-field"
                  style={{ fontSize: '0.85rem' }}
                >
                  <option value="Open">Open</option>
                  <option value="Assigned">Assigned</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Waiting on Customer">Waiting on Customer</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>
            )}

            {/* Staff: Priority updater dropdown */}
            {isStaff && (
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Priority Level
                </label>
                <select
                  value={ticket.priority}
                  onChange={(e) => handlePriorityChange(e.target.value)}
                  disabled={actionLoading}
                  className="input-field"
                  style={{ fontSize: '0.85rem' }}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>
            )}
          </div>

          {/* Activity History Timeline */}
          <div className="card" style={{ padding: '22px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ActivityIcon size={16} color="var(--brand)" /> Activity Timeline
            </h3>

            {activities.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>No activity logged yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {activities.map((act) => (
                  <div key={act._id} style={{ display: 'flex', gap: '10px', fontSize: '0.8rem' }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--brand)',
                      marginTop: '5px',
                      flexShrink: 0
                    }} />
                    <div>
                      <p style={{ margin: 0, color: '#334155', fontWeight: 500 }}>
                        {act.message}
                      </p>
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                        {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {act.performedBy}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

