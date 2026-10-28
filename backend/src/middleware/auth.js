import jwt from 'jsonwebtoken';
import Agent from '../features/agents/agent.model.js';

const JWT_SECRET = process.env.JWT_SECRET || 'support_desk_jwt_secret_key_2026';

// Protect routes — verify JWT token
export const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized — no token provided',
      });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Attach agent info to request
    const agent = await Agent.findById(decoded.id);
    if (!agent) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized — agent no longer exists',
      });
    }

    req.agent = {
      id: agent._id,
      name: agent.name,
      email: agent.email,
      role: agent.role,
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, error: 'Not authorized — invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, error: 'Not authorized — token expired' });
    }
    next(error);
  }
};

// Admin-only middleware — must be used after protect
export const adminOnly = (req, res, next) => {
  if (req.agent && req.agent.role === 'Admin') {
    return next();
  }
  return res.status(403).json({
    success: false,
    error: 'Forbidden — Admin access required',
  });
};

// Staff-only middleware (Admin or Agent) — must be used after protect
export const staffOnly = (req, res, next) => {
  if (req.agent && ['Admin', 'Agent'].includes(req.agent.role)) {
    return next();
  }
  return res.status(403).json({
    success: false,
    error: 'Forbidden — Staff access required',
  });
};

