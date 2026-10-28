import mongoose from 'mongoose';
import Comment from './comment.model.js';
import Ticket from '../tickets/ticket.model.js';
import { logActivity } from '../activities/activity.service.js';

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

export const getComments = async (req, res, next) => {
  try {
    const { ticketId } = req.params;
    if (!isValidObjectId(ticketId)) {
      return res.status(400).json({ success: false, error: 'Invalid ticket ID format' });
    }
    const comments = await Comment.find({ ticketId }).sort({ createdAt: 1 });
    res.json({
      success: true,
      data: comments,
    });
  } catch (error) {
    next(error);
  }
};

export const addComment = async (req, res, next) => {
  try {
    const { ticketId } = req.params;
    if (!isValidObjectId(ticketId)) {
      return res.status(400).json({ success: false, error: 'Invalid ticket ID format' });
    }
    const { type, content, authorName, authorEmail } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Content is required',
      });
    }

    if (!authorName || !authorName.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Author name is required',
      });
    }

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket not found',
      });
    }

    const commentType = type === 'note' ? 'note' : 'reply';

    const comment = await Comment.create({
      ticketId,
      type: commentType,
      content: content.trim(),
      authorName: authorName.trim(),
      authorEmail: authorEmail || '',
    });

    // Touch ticket updatedAt
    ticket.updatedAt = new Date();
    await ticket.save();

    // Log Activity
    const action = commentType === 'note' ? 'NOTE_ADDED' : 'REPLY_ADDED';
    const message =
      commentType === 'note'
        ? `Internal note added by ${authorName.trim()}`
        : `Public reply added by ${authorName.trim()}`;

    await logActivity({
      ticketId,
      action,
      performedBy: authorName.trim(),
      message,
    });

    res.status(201).json({
      success: true,
      data: comment,
    });
  } catch (error) {
    next(error);
  }
};
