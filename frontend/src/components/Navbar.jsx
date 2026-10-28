import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { RoleBadge } from '../features/tickets/TicketBadge';
import { 
  LifeBuoy, 
  LogOut, 
  PlusCircle, 
  LayoutDashboard, 
  Users, 
  Inbox, 
  CheckCircle2, 
  UserCheck 
} from 'lucide-react';

export default function Navbar() {
  const { user, logout, isAdmin, isAgent, isUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header style={{
      backgroundColor: '#ffffff',
      borderBottom: '1px solid var(--border-light)',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '0 24px',
        height: '68px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              backgroundColor: 'var(--brand)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 10px rgba(5, 150, 105, 0.25)'
            }}>
              <LifeBuoy size={22} strokeWidth={2.2} />
            </div>
            <div>
              <span style={{ fontWeight: 800, fontSize: '1.2rem', color: '#0f172a', letterSpacing: '-0.02em' }}>
                Desk<span style={{ color: 'var(--brand)' }}>Pulse</span>
              </span>
              <span style={{ display: 'block', fontSize: '0.65rem', color: '#64748b', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Support System
              </span>
            </div>
          </Link>

          {/* Navigation Links by Role */}
          {user && (
            <nav style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {isUser && (
                <>
                  <Link
                    to="/dashboard"
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: isActive('/dashboard') ? 'var(--brand)' : 'var(--text-secondary)',
                      backgroundColor: isActive('/dashboard') ? 'var(--brand-light)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Inbox size={16} />
                    My Tickets
                  </Link>
                  <Link
                    to="/new-ticket"
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: isActive('/new-ticket') ? 'var(--brand)' : 'var(--text-secondary)',
                      backgroundColor: isActive('/new-ticket') ? 'var(--brand-light)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <PlusCircle size={16} />
                    Raise Ticket
                  </Link>
                </>
              )}

              {isAgent && (
                <>
                  <Link
                    to="/dashboard"
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: isActive('/dashboard') ? 'var(--brand)' : 'var(--text-secondary)',
                      backgroundColor: isActive('/dashboard') ? 'var(--brand-light)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Inbox size={16} />
                    Ticket Queue
                  </Link>
                </>
              )}

              {isAdmin && (
                <>
                  <Link
                    to="/dashboard"
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: isActive('/dashboard') ? 'var(--brand)' : 'var(--text-secondary)',
                      backgroundColor: isActive('/dashboard') ? 'var(--brand-light)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <LayoutDashboard size={16} />
                    Overview
                  </Link>
                  <Link
                    to="/admin/tickets"
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: isActive('/admin/tickets') ? 'var(--brand)' : 'var(--text-secondary)',
                      backgroundColor: isActive('/admin/tickets') ? 'var(--brand-light)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Inbox size={16} />
                    All Tickets
                  </Link>
                  <Link
                    to="/admin/agents"
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: isActive('/admin/agents') ? 'var(--brand)' : 'var(--text-secondary)',
                      backgroundColor: isActive('/admin/agents') ? 'var(--brand-light)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Users size={16} />
                    Manage Agents
                  </Link>
                </>
              )}
            </nav>
          )}
        </div>

        {/* Right User Bar */}
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
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
                {user.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a' }}>
                    {user.name}
                  </span>
                  <RoleBadge role={user.role} />
                </div>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  {user.email}
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Sign Out"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-light)',
                backgroundColor: '#ffffff',
                color: '#64748b',
                fontSize: '0.8rem',
                fontWeight: 600,
                marginLeft: '6px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#fef2f2';
                e.currentTarget.style.borderColor = '#fecaca';
                e.currentTarget.style.color = '#dc2626';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.borderColor = 'var(--border-light)';
                e.currentTarget.style.color = '#64748b';
              }}
            >
              <LogOut size={15} />
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Link to="/login" className="btn-secondary" style={{ padding: '8px 16px' }}>
              Sign In
            </Link>
            <Link to="/login?tab=signup" className="btn-primary" style={{ padding: '8px 16px' }}>
              Sign Up as Customer
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

