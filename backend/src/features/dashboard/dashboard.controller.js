import Ticket from '../tickets/ticket.model.js';

export const getDashboardStats = async (req, res, next) => {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Run parallel aggregation and counts for maximum performance
    const [
      totalTickets,
      openTickets,
      inProgressTickets,
      waitingTickets,
      resolvedTickets,
      urgentTickets,
      overdueTicketsCount,
      overdueTicketsList,
      priorityCounts,
    ] = await Promise.all([
      Ticket.countDocuments(),
      Ticket.countDocuments({ status: 'Open' }),
      Ticket.countDocuments({ status: 'In Progress' }),
      Ticket.countDocuments({ status: 'Waiting on Customer' }),
      Ticket.countDocuments({ status: 'Resolved' }),
      Ticket.countDocuments({ priority: 'Urgent' }),
      // Overdue: not Resolved AND created more than 24 hours ago
      Ticket.countDocuments({
        status: { $ne: 'Resolved' },
        createdAt: { $lt: twentyFourHoursAgo },
      }),
      // Retrieve top overdue tickets for rapid resolution in dashboard
      Ticket.find({
        status: { $ne: 'Resolved' },
        createdAt: { $lt: twentyFourHoursAgo },
      })
        .sort({ createdAt: 1 })
        .limit(5),
      // Aggregate by priority
      Ticket.aggregate([
        {
          $group: {
            _id: '$priority',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    // Map priority counts
    const priorityBreakdown = {
      Low: 0,
      Medium: 0,
      High: 0,
      Urgent: 0,
    };
    priorityCounts.forEach((p) => {
      if (p._id && priorityBreakdown[p._id] !== undefined) {
        priorityBreakdown[p._id] = p.count;
      }
    });

    res.json({
      success: true,
      data: {
        totalTickets,
        openTickets,
        inProgressTickets,
        waitingTickets,
        resolvedTickets,
        urgentTickets,
        overdueTickets: overdueTicketsCount,
        priorityBreakdown,
        sampleOverdueTickets: overdueTicketsList,
      },
    });
  } catch (error) {
    next(error);
  }
};
