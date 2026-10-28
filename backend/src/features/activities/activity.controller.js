import mongoose from 'mongoose';
import Activity from './activity.model.js';
import Ticket from '../tickets/ticket.model.js';

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

export const getTicketActivities = async (req, res, next) => {
  try {
    const { ticketId } = req.params;
    if (!isValidObjectId(ticketId)) {
      return res.status(400).json({ success: false, error: 'Invalid ticket ID format' });
    }

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ success: false, error: 'Ticket not found' });
    }

    const query = { ticketId };
    if (req.agent && req.agent.role === 'User') {
      const userEmail = (req.agent.email || '').toLowerCase();
      const userName = (req.agent.name || '').toLowerCase();
      const ticketCustomer = (ticket.customer || '').toLowerCase();
      const isOwner =
        (ticket.createdBy && ticket.createdBy.toString() === req.agent.id.toString()) ||
        ticketCustomer.includes(userEmail) ||
        ticketCustomer.includes(userName);
      if (!isOwner) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden — You can only view activity on your own tickets',
        });
      }
      query.action = { $ne: 'NOTE_ADDED' };
    }

    const activities = await Activity.find(query).sort({ createdAt: 1 });
    res.json({
      success: true,
      data: activities,
    });
  } catch (error) {
    next(error);
  }
};

