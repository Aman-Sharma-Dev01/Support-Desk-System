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

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ success: false, error: 'Ticket not found' });
    }

    // Role check: regular users can only see public replies on their own tickets
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
          error: 'Forbidden — You can only view comments on your own tickets',
        });
      }
      query.type = 'reply'; // Hide internal notes from regular users
    }

    const comments = await Comment.find(query).sort({ createdAt: 1 });
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

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket not found',
      });
    }

    let commentType = type === 'note' ? 'note' : 'reply';
    let finalAuthorName = authorName ? authorName.trim() : (req.agent ? req.agent.name : '');
    let finalAuthorEmail = authorEmail || (req.agent ? req.agent.email : '');

    // Regular users can only post public replies on their own tickets
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
          error: 'Forbidden — You can only comment on your own tickets',
        });
      }
      commentType = 'reply';
      finalAuthorName = req.agent.name;
      finalAuthorEmail = req.agent.email;
    }

    if (!finalAuthorName) {
      return res.status(400).json({
        success: false,
        error: 'Author name is required',
      });
    }

    const comment = await Comment.create({
      ticketId,
      type: commentType,
      content: content.trim(),
      authorName: finalAuthorName,
      authorEmail: finalAuthorEmail,
      authorRole: req.agent ? req.agent.role : 'User',
    });

    // Touch ticket updatedAt
    ticket.updatedAt = new Date();
    await ticket.save();

    // Log Activity
    const action = commentType === 'note' ? 'NOTE_ADDED' : 'REPLY_ADDED';
    const message =
      commentType === 'note'
        ? `Internal note added by ${finalAuthorName}`
        : `Public reply added by ${finalAuthorName}`;

    await logActivity({
      ticketId,
      action,
      performedBy: finalAuthorName,
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
