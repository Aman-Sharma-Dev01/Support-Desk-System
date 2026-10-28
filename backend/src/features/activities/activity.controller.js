import mongoose from 'mongoose';
import Activity from './activity.model.js';

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

export const getTicketActivities = async (req, res, next) => {
  try {
    const { ticketId } = req.params;
    if (!isValidObjectId(ticketId)) {
      return res.status(400).json({ success: false, error: 'Invalid ticket ID format' });
    }
    const activities = await Activity.find({ ticketId }).sort({ createdAt: 1 });
    res.json({
      success: true,
      data: activities,
    });
  } catch (error) {
    next(error);
  }
};
