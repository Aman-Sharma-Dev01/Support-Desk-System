import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './features/auth/AuthContext';
import Navbar from './components/Navbar';
import LoginPage from './features/auth/LoginPage';
import UserDashboard from './features/user/UserDashboard';
import AgentDashboard from './features/agent/AgentDashboard';
import AdminDashboard from './features/admin/AdminDashboard';
import NewTicketPage from './features/tickets/NewTicketPage';
import TicketDetailPage from './features/tickets/TicketDetailPage';
import AdminAgentsPage from './features/admin/AdminAgentsPage';
import AdminTicketsPage from './features/admin/AdminTicketsPage';
import { RefreshCw } from 'lucide-react';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px', color: '#64748b' }}>
        <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px' }} />
        <p>Checking authorization...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function RoleBasedDashboard() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px', color: '#64748b' }}>
        <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px' }} />
        <p>Loading your workspace...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (user.role === 'Admin') return <AdminDashboard />;
  if (user.role === 'Agent') return <AgentDashboard />;
  return <UserDashboard />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <Navbar />
          <main style={{ flex: 1 }}>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<LoginPage />} />

              {/* Protected Routes */}
              <Route
                path="/"
                element={<Navigate to="/dashboard" replace />}
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <RoleBasedDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/new-ticket"
                element={
                  <ProtectedRoute>
                    <NewTicketPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tickets/:id"
                element={
                  <ProtectedRoute>
                    <TicketDetailPage />
                  </ProtectedRoute>
                }
              />

              {/* Admin Protected Routes */}
              <Route
                path="/admin/tickets"
                element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <AdminTicketsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/agents"
                element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <AdminAgentsPage />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
