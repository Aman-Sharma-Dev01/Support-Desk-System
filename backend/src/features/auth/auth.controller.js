import jwt from 'jsonwebtoken';
import Agent from '../agents/agent.model.js';

const JWT_SECRET = process.env.JWT_SECRET || 'support_desk_jwt_secret_key_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Generate JWT token
const generateToken = (agent) => {
  return jwt.sign(
    { id: agent._id, email: agent.email, role: agent.role, name: agent.name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// POST /api/auth/login
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
      });
    }

    // Find agent and explicitly include password field
    const agent = await Agent.findOne({ email: email.toLowerCase() }).select('+password');

    if (!agent) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
    }

    const isMatch = await agent.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
    }

    const token = generateToken(agent);

    res.json({
      success: true,
      data: {
        token,
        agent: {
          id: agent._id,
          name: agent.name,
          email: agent.email,
          role: agent.role,
          avatar: agent.avatar,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/me — get current logged-in agent profile
export const getMe = async (req, res, next) => {
  try {
    const agent = await Agent.findById(req.agent.id);
    if (!agent) {
      return res.status(404).json({ success: false, error: 'Agent not found' });
    }

    res.json({
      success: true,
      data: {
        id: agent._id,
        name: agent.name,
        email: agent.email,
        role: agent.role,
        avatar: agent.avatar,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/register — Admin-only: register a new agent
export const register = async (req, res, next) => {
  try {
    const { name, email, password, role, avatar } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, and password are required',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters',
      });
    }

    const existing = await Agent.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'An agent with this email already exists',
      });
    }

    const agent = await Agent.create({
      name,
      email: email.toLowerCase(),
      password,
      role: role || 'Agent',
      avatar: avatar || '',
    });

    const token = generateToken(agent);

    res.status(201).json({
      success: true,
      data: {
        token,
        agent: {
          id: agent._id,
          name: agent.name,
          email: agent.email,
          role: agent.role,
          avatar: agent.avatar,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/signup — Public: register as a regular User (Customer)
export const signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, and password are required',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters',
      });
    }

    const existing = await Agent.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email already exists',
      });
    }

    const user = await Agent.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: 'User',
      avatar: '',
    });

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      data: {
        token,
        agent: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

