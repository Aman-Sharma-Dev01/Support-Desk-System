import Agent from './agent.model.js';

export const getAgents = async (req, res, next) => {
  try {
    const agents = await Agent.find().sort({ name: 1 });
    res.json({
      success: true,
      data: agents,
    });
  } catch (error) {
    next(error);
  }
};

export const createAgent = async (req, res, next) => {
  try {
    const { name, email, role, avatar } = req.body;
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        error: 'Name and email are required',
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
      role: role || 'Support Agent',
      avatar: avatar || '',
    });

    res.status(201).json({
      success: true,
      data: agent,
    });
  } catch (error) {
    next(error);
  }
};
