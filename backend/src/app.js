import express from 'express';
import cors from 'cors';
import authRoutes from './features/auth/auth.routes.js';
import ticketRoutes from './features/tickets/ticket.routes.js';
import agentRoutes from './features/agents/agent.routes.js';
import dashboardRoutes from './features/dashboard/dashboard.routes.js';
import { protect, adminOnly, staffOnly } from './middleware/auth.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check (public)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Support Desk System API',
  });
});

// Auth Routes (login is public, register is admin-protected inside the router)
app.use('/api/auth', authRoutes);

// Protected Feature Routes — all require valid JWT
app.use('/api/tickets', protect, ticketRoutes);
app.use('/api/agents', protect, staffOnly, agentRoutes);
app.use('/api/dashboard', protect, staffOnly, dashboardRoutes);

// 404 Route Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

export default app;
