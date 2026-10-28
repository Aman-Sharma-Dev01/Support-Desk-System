import mongoose from 'mongoose';
import Ticket, { STATUS_ENUM, PRIORITY_ENUM } from './ticket.model.js';
import Comment from '../comments/comment.model.js';
import Activity from '../activities/activity.model.js';
import { logActivity } from '../activities/activity.service.js';

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Priority weight mapping for custom priority sorting
const PRIORITY_ORDER = {
  Urgent: 4,
  High: 3,
  Medium: 2,
  Low: 1,
};

// GET /api/tickets - List tickets with search, filtering, and sorting
export const getTickets = async (req, res, next) => {
  try {
    const {
      search,
      status,
      priority,
      assignee,
      overdueOnly,
      sortBy = 'recently_updated',
      page,
      limit,
    } = req.query;

    const query = {};
    const userOwnerMatches = [];

    if (req.agent && req.agent.role === 'User') {
      userOwnerMatches.push({ createdBy: req.agent.id });
      const userEmail = (req.agent.email || '').toLowerCase();
      const userName = (req.agent.name || '').toLowerCase();

      if (userEmail) {
        userOwnerMatches.push({ customer: { $regex: userEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } });
      }
      if (userName) {
        userOwnerMatches.push({ customer: { $regex: userName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } });
      }
    }

    // 1. Search by subject or customer name/email
    let searchFilter = null;
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      searchFilter = [{ subject: searchRegex }, { customer: searchRegex }];
    }

    if (userOwnerMatches.length > 0) {
      const ownerFilter = { $or: userOwnerMatches };
      if (searchFilter) {
        query.$and = [ownerFilter, { $or: searchFilter }];
      } else {
        query.$or = ownerFilter.$or;
      }
    } else if (searchFilter) {
      query.$or = searchFilter;
    }

    // 2. Filter by status
    if (status && status !== 'all') {
      if (Array.isArray(status)) {
        query.status = { $in: status };
      } else if (status.includes(',')) {
        query.status = { $in: status.split(',').map((s) => s.trim()) };
      } else {
        query.status = status;
      }
    }

    // 3. Filter by priority
    if (priority && priority !== 'all') {
      if (Array.isArray(priority)) {
        query.priority = { $in: priority };
      } else if (priority.includes(',')) {
        query.priority = { $in: priority.split(',').map((p) => p.trim()) };
      } else {
        query.priority = priority;
      }
    }

    // 4. Filter by assignee
    if (assignee && assignee !== 'all') {
      query.assignee = assignee;
    }

    // 5. Overdue filter
    // Overdue = status !== 'Resolved' AND createdAt < (now - 24 hours)
    if (overdueOnly === 'true' || overdueOnly === true) {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      // Merge with existing status filter if present, otherwise exclude Resolved
      if (!query.status) {
        query.status = { $ne: 'Resolved' };
      } else if (typeof query.status === 'string') {
        // Keep existing status filter only if it's not 'Resolved'
        if (query.status === 'Resolved') {
          // Resolved + overdue is contradictory â€” return empty
          return res.json({ success: true, total: 0, data: [] });
        }
      } else if (query.status.$in) {
        // Remove 'Resolved' from the $in array
        query.status.$in = query.status.$in.filter((s) => s !== 'Resolved');
        if (query.status.$in.length === 0) {
          return res.json({ success: true, total: 0, data: [] });
        }
      }
      query.createdAt = { $lt: twentyFourHoursAgo };
    }

    let ticketsQuery = Ticket.find(query);

    // 6. Sorting
    if (sortBy === 'priority') {
      // Fetch results and sort by priority order in memory if priority sorting
      const rawTickets = await ticketsQuery.exec();
      rawTickets.sort((a, b) => {
        const diff = (PRIORITY_ORDER[b.priority] || 0) - (PRIORITY_ORDER[a.priority] || 0);
        if (diff !== 0) return diff;
        return new Date(b.updatedAt) - new Date(a.updatedAt);
      });

      // Handle pagination if requested
      if (page && limit) {
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 20;
        const total = rawTickets.length;
        const paginated = rawTickets.slice((pageNum - 1) * limitNum, pageNum * limitNum);
        return res.json({
          success: true,
          total,
          page: pageNum,
          totalPages: Math.ceil(total / limitNum),
          data: paginated,
        });
      }

      return res.json({
        success: true,
        total: rawTickets.length,
        data: rawTickets,
      });
    }

    // Standard sorts
    let sortOptions = { updatedAt: -1 }; // default: most recently updated
    if (sortBy === 'created_desc') sortOptions = { createdAt: -1 };
    if (sortBy === 'created_asc') sortOptions = { createdAt: 1 };
    if (sortBy === 'oldest_updated') sortOptions = { updatedAt: 1 };

    ticketsQuery = ticketsQuery.sort(sortOptions);

    // Pagination
    if (page && limit) {
      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 20;
      const skip = (pageNum - 1) * limitNum;

      const total = await Ticket.countDocuments(query);
      const tickets = await ticketsQuery.skip(skip).limit(limitNum).exec();

      return res.json({
        success: true,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum),
        data: tickets,
      });
    }

    const tickets = await ticketsQuery.exec();
    res.json({
      success: true,
      total: tickets.length,
      data: tickets,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/tickets/:id - Get single ticket by ID
export const getTicketById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, error: 'Invalid ticket ID format' });
    }
    const ticket = await Ticket.findById(id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket not found',
      });
    }

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
          error: 'Forbidden — You can only view your own tickets',
        });
      }
    }

    res.json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/tickets - Create a new ticket
export const createTicket = async (req, res, next) => {
  try {
    const { subject, customer, description, priority, status, assignee, createdBy } = req.body;

    // Validation
    if (!subject || !subject.trim()) {
      return res.status(400).json({ success: false, error: 'Subject is required' });
    }
    if ((!req.agent || req.agent.role !== 'User') && (!customer || !customer.trim())) {
      return res.status(400).json({ success: false, error: 'Customer name or email is required' });
    }
    if (!description || !description.trim()) {
      return res.status(400).json({ success: false, error: 'Description is required' });
    }
    if (status && !STATUS_ENUM.includes(status)) {
      return res.status(400).json({ success: false, error: `Invalid status: ${status}` });
    }
    if (priority && !PRIORITY_ENUM.includes(priority)) {
      return res.status(400).json({ success: false, error: `Invalid priority: ${priority}` });
    }

    let finalCustomer = customer ? String(customer).trim() : '';
    let finalStatus = status || 'Open';
    let finalPriority = priority || 'Medium';
    let finalAssignee = assignee ? String(assignee).trim() : 'Unassigned';

    if (req.agent && req.agent.role === 'User') {
      finalCustomer = `${req.agent.name} (${req.agent.email})`;
      finalStatus = 'Open';
      finalAssignee = 'Unassigned';
    } else if (req.agent) {
      const tAss = String(finalAssignee).toLowerCase();
      if (tAss === 'self' || tAss === 'me') {
        finalAssignee = req.agent.name;
      }
      if (finalAssignee && finalAssignee !== 'Unassigned' && finalStatus === 'Open') {
        finalStatus = 'Assigned';
      }
    }

    const performedBy = req.agent ? req.agent.name : (createdBy || finalCustomer);

    const ticket = await Ticket.create({
      subject: subject.trim(),
      customer: finalCustomer,
      description: description.trim(),
      priority: finalPriority,
      status: finalStatus,
      assignee: finalAssignee,
      createdBy: req.agent ? req.agent.id : null,
    });

    // Record creation in Activity history
    await logActivity({
      ticketId: ticket._id,
      action: 'CREATED',
      performedBy,
      message: `Ticket created with ${ticket.priority} priority`,
    });

    res.status(201).json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH/PUT /api/tickets/:id - Update ticket details (status, priority, assignee, etc.)
export const updateTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, error: 'Invalid ticket ID format' });
    }
    if (req.agent && req.agent.role === 'User') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden ï¿½?" Regular users cannot edit ticket fields. Use comments to reply.',
      });
    }

    const { subject, description, customer, status, priority, assignee } = req.body;
    const updatedBy = req.agent ? req.agent.name : 'Support Agent';

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({ success: false, error: 'Ticket not found' });
    }

    const activitiesToLog = [];

    // Track status change
    if (status && status !== ticket.status) {
      if (!STATUS_ENUM.includes(status)) {
        return res.status(400).json({ success: false, error: `Invalid status: ${status}` });
      }
      activitiesToLog.push({
        action: 'STATUS_CHANGED',
        field: 'status',
        oldValue: ticket.status,
        newValue: status,
        performedBy: updatedBy,
        message: `Status updated from "${ticket.status}" to "${status}"`,
      });
      ticket.status = status;
    }

    // Track priority change
    if (priority && priority !== ticket.priority) {
      if (!PRIORITY_ENUM.includes(priority)) {
        return res.status(400).json({ success: false, error: `Invalid priority: ${priority}` });
      }
      activitiesToLog.push({
        action: 'PRIORITY_CHANGED',
        field: 'priority',
        oldValue: ticket.priority,
        newValue: priority,
        performedBy: updatedBy,
        message: `Priority updated from "${ticket.priority}" to "${priority}"`,
      });
      ticket.priority = priority;
    }

    // Track assignee change
    if (assignee !== undefined) {
      let newAssignee = assignee;
      if (typeof newAssignee === 'string') {
        const trimmed = newAssignee.trim();
        if (trimmed.toLowerCase() === 'self' || trimmed.toLowerCase() === 'me') {
          newAssignee = req.agent ? req.agent.name : trimmed;
        } else if (req.agent && trimmed.toLowerCase() === req.agent.name.toLowerCase()) {
          newAssignee = req.agent.name;
        } else {
          newAssignee = trimmed;
        }
      } else if (newAssignee === null) {
        newAssignee = 'Unassigned';
      }

      if (newAssignee !== ticket.assignee) {
        if (req.agent && req.agent.role !== 'Admin' && newAssignee !== req.agent.name && newAssignee !== 'Unassigned') {
          return res.status(403).json({
            success: false,
            error: 'Agents can only assign tickets to themselves. Admin access is required to assign to others.',
          });
        }

        activitiesToLog.push({
          action: 'ASSIGNEE_CHANGED',
          field: 'assignee',
          oldValue: ticket.assignee,
          newValue: newAssignee,
          performedBy: updatedBy,
          message: `Assignee changed from "${ticket.assignee}" to "${newAssignee}"`,
        });
        ticket.assignee = newAssignee;

        if (newAssignee && newAssignee !== 'Unassigned') {
          if (ticket.status === 'Open' || ticket.status === 'Assigned') {
            if (ticket.status !== 'Assigned') {
              activitiesToLog.push({
                action: 'STATUS_CHANGED',
                field: 'status',
                oldValue: ticket.status,
                newValue: 'Assigned',
                performedBy: updatedBy,
                message: `Status updated from "${ticket.status}" to "Assigned"`,
              });
              ticket.status = 'Assigned';
            }
          }
        } else if (newAssignee === 'Unassigned') {
          if (ticket.status === 'Assigned') {
            activitiesToLog.push({
              action: 'STATUS_CHANGED',
              field: 'status',
              oldValue: ticket.status,
              newValue: 'Open',
              performedBy: updatedBy,
              message: `Status updated from "${ticket.status}" to "Open"`,
            });
            ticket.status = 'Open';
          }
        }
      }
    }

    // Subject or description updates
    let infoUpdated = false;
    if (subject && subject.trim() !== ticket.subject) {
      ticket.subject = subject.trim();
      infoUpdated = true;
    }
    if (description && description.trim() !== ticket.description) {
      ticket.description = description.trim();
      infoUpdated = true;
    }
    if (customer && customer.trim() !== ticket.customer) {
      ticket.customer = customer.trim();
      infoUpdated = true;
    }

    if (infoUpdated) {
      activitiesToLog.push({
        action: 'TICKET_UPDATED',
        field: 'details',
        performedBy: updatedBy,
        message: 'Ticket details updated',
      });
    }

    // Save ticket
    await ticket.save();

    // Log all accumulated activities
    for (const act of activitiesToLog) {
      await logActivity({
        ticketId: ticket._id,
        ...act,
      });
    }

    res.json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/tickets/:id - Admin only: Delete ticket and cascade delete comments and activities
export const deleteTicket = async (req, res, next) => {
  try {
    if (req.agent && req.agent.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden — Admin access required to delete tickets',
      });
    }
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, error: 'Invalid ticket ID format' });
    }
    const ticket = await Ticket.findById(id);

    if (!ticket) {
      return res.status(404).json({ success: false, error: 'Ticket not found' });
    }

    // Cascade delete associated comments and activity logs to ensure data integrity
    await Comment.deleteMany({ ticketId: id });
    await Activity.deleteMany({ ticketId: id });
    await Ticket.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Ticket and all related comments and activities deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/tickets/:id/confirm-resolution - Customer confirms or reopens ticket
export const confirmResolution = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, error: 'Invalid ticket ID format' });
    }
    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({ success: false, error: 'Ticket not found' });
    }

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
          error: 'Forbidden — You can only confirm resolution on your own tickets',
        });
      }
    }

    const { resolved, feedback } = req.body;
    const oldStatus = ticket.status;
    const authorName = req.agent ? req.agent.name : 'Customer';

    if (resolved === true) {
      ticket.status = 'Resolved';
      await ticket.save();

      await logActivity({
        ticketId: ticket._id,
        action: 'STATUS_CHANGED',
        field: 'status',
        oldValue: oldStatus,
        newValue: 'Resolved',
        performedBy: authorName,
        message: feedback
          ? `Customer confirmed issue is resolved: "${feedback}"`
          : 'Customer confirmed ticket is resolved',
      });
    } else {
      ticket.status = 'In Progress';
      await ticket.save();

      await logActivity({
        ticketId: ticket._id,
        action: 'STATUS_CHANGED',
        field: 'status',
        oldValue: oldStatus,
        newValue: 'In Progress',
        performedBy: authorName,
        message: feedback
          ? `Customer reported issue is NOT resolved: "${feedback}"`
          : 'Customer reported issue is not resolved. Ticket reopened.',
      });
    }

    res.json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
};
