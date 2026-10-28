import express from 'express';
import cors from 'cors';
import ticketRoutes from './features/tickets/ticket.routes.js';
import agentRoutes from './features/agents/agent.routes.js';
import dashboardRoutes from './features/dashboard/dashboard.routes.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Support Desk System API',
  });
});

// Feature Routes
app.use('/api/tickets', ticketRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/dashboard', dashboardRoutes);

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
