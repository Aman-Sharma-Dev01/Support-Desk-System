import express from 'express';
import {
  getTickets,
  getTicketById,
  createTicket,
  updateTicket,
  deleteTicket,
} from './ticket.controller.js';
import commentRoutes from '../comments/comment.routes.js';
import activityRoutes from '../activities/activity.routes.js';

const router = express.Router();

// Nested routes for ticket comments and activities
router.use('/:ticketId/comments', commentRoutes);
router.use('/:ticketId/activities', activityRoutes);

// Base ticket endpoints
router.get('/', getTickets);
router.get('/:id', getTicketById);
router.post('/', createTicket);
router.patch('/:id', updateTicket);
router.put('/:id', updateTicket);
router.delete('/:id', deleteTicket);

export default router;
