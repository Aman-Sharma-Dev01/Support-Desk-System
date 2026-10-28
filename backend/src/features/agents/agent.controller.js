import Agent from './agent.model.js';

// GET /api/agents — any authenticated agent can list agents
export const getAgents = async (req, res, next) => {
  try {
    const agents = await Agent.find({ role: { $in: ['Admin', 'Agent'] } }).sort({ name: 1 });
    res.json({
      success: true,
      data: agents,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/agents — Admin only: create a new agent (with password)
export const createAgent = async (req, res, next) => {
  try {
    // Only Admin can create agents
    if (req.agent.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden — Admin access required to create agents',
      });
    }

    const { name, email, password, role, avatar } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, and password are required',
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

    res.status(201).json({
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

// DELETE /api/agents/:id — Admin only: delete an agent
export const deleteAgent = async (req, res, next) => {
  try {
    if (req.agent.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden — Admin access required to delete agents',
      });
    }

    const { id } = req.params;
    if (req.agent.id.toString() === id) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete your own admin account',
      });
    }

    const agent = await Agent.findById(id);
    if (!agent) {
      return res.status(404).json({ success: false, error: 'Agent not found' });
    }

    await Agent.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Agent deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
