import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import Ticket from './features/tickets/ticket.model.js';
import Comment from './features/comments/comment.model.js';
import Activity from './features/activities/activity.model.js';
import Agent from './features/agents/agent.model.js';

import { connectDB } from './config/db.js';

const seedDatabase = async () => {
  try {
    await connectDB();
    console.log('[Seed] Connected to database');

    // Clean existing collections
    await Promise.all([
      Ticket.deleteMany({}),
      Comment.deleteMany({}),
      Activity.deleteMany({}),
      Agent.deleteMany({}),
    ]);
    console.log('[Seed] Cleared existing records');

    // 1. Seed Agents
    const agents = await Agent.insertMany([
      { name: 'Sarah Jenkins', email: 'sarah.j@supportdesk.internal', role: 'Senior Agent' },
      { name: 'Alex Rivera', email: 'alex.r@supportdesk.internal', role: 'Support Agent' },
      { name: 'David Kim', email: 'david.k@supportdesk.internal', role: 'Support Agent' },
      { name: 'Priya Patel', email: 'priya.p@supportdesk.internal', role: 'Admin' },
    ]);
    console.log(`[Seed] Seeded ${agents.length} agents`);

    // Helper timestamp offsets
    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const thirtyHoursAgo = new Date(now.getTime() - 30 * 60 * 60 * 1000);
    const tenHoursAgo = new Date(now.getTime() - 10 * 60 * 60 * 1000);
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    // 2. Seed Sample Tickets
    // Ticket 1: Overdue & Urgent (created 30 hours ago, status Open)
    const ticket1 = await Ticket.create({
      subject: 'Critical: Production payment webhook failing with 500 error',
      customer: 'billing@enterprise-client.io',
      description: 'Our checkout gateway cannot receive webhook notifications since yesterday morning. Customers are being charged but orders are not marked as completed.',
      priority: 'Urgent',
      status: 'In Progress',
      assignee: 'Sarah Jenkins',
      createdAt: thirtyHoursAgo,
      updatedAt: twoHoursAgo,
    });

    // Ticket 2: Overdue Regular (created 48 hours ago, Open)
    const ticket2 = await Ticket.create({
      subject: 'Cannot invite team members to organization workspace',
      customer: 'mark.watson@startup.co',
      description: 'Whenever I submit the invitation modal, a red toast shows "Internal server timeout". We urgently need our engineers onboarded.',
      priority: 'High',
      status: 'Open',
      assignee: 'Alex Rivera',
      createdAt: twoDaysAgo,
      updatedAt: twoDaysAgo,
    });

    // Ticket 3: Recent Medium Priority (Waiting on Customer)
    const ticket3 = await Ticket.create({
      subject: 'Clarification regarding monthly invoice itemization',
      customer: 'finance@acme-corp.com',
      description: 'Could you please break down the cloud storage bandwidth line item on invoice #2026-10-88? Our audit department requested the raw metrics.',
      priority: 'Medium',
      status: 'Waiting on Customer',
      assignee: 'David Kim',
      createdAt: tenHoursAgo,
      updatedAt: twoHoursAgo,
    });

    // Ticket 4: Resolved Ticket (created 2 days ago, resolved recently - should NOT count as overdue)
    const ticket4 = await Ticket.create({
      subject: 'Password reset link expired before 15-minute window',
      customer: 'elena.rostova@designagency.net',
      description: 'Password reset links sent to our domain are expiring prematurely.',
      priority: 'Low',
      status: 'Resolved',
      assignee: 'Alex Rivera',
      createdAt: twoDaysAgo,
      updatedAt: twoHoursAgo,
    });

    // Ticket 5: New Open Low Priority
    const ticket5 = await Ticket.create({
      subject: 'Feature request: Dark mode support for customer portal',
      customer: 'jordan.lee@techhub.org',
      description: 'It would be great to have dark mode when browsing ticket history at night.',
      priority: 'Low',
      status: 'Open',
      assignee: 'Unassigned',
      createdAt: twoHoursAgo,
      updatedAt: twoHoursAgo,
    });

    console.log('[Seed] Seeded 5 tickets with various statuses and priorities');

    // 3. Seed Comments (Public Replies and Internal Notes)
    await Comment.insertMany([
      {
        ticketId: ticket1._id,
        type: 'note',
        content: 'Engineering has identified a malformed payload header in the Stripe webhook proxy. Deploying a hotfix to staging.',
        authorName: 'Sarah Jenkins',
        authorEmail: 'sarah.j@supportdesk.internal',
        createdAt: new Date(now.getTime() - 15 * 60 * 60 * 1000),
      },
      {
        ticketId: ticket1._id,
        type: 'reply',
        content: 'Hello, our engineering team is actively testing a fix for the webhook dispatch issue. We will update you as soon as the patch is live in production.',
        authorName: 'Sarah Jenkins',
        authorEmail: 'sarah.j@supportdesk.internal',
        createdAt: new Date(now.getTime() - 14 * 60 * 60 * 1000),
      },
      {
        ticketId: ticket3._id,
        type: 'reply',
        content: 'Hi Finance Team, I have attached the CSV breakdown of your bandwidth utilization for October. Please let us know if you need any additional metric granularity.',
        authorName: 'David Kim',
        authorEmail: 'david.k@supportdesk.internal',
        createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
      },
      {
        ticketId: ticket3._id,
        type: 'note',
        content: 'Customer is eligible for tiered enterprise volume discount next quarter if usage exceeds 5TB.',
        authorName: 'Priya Patel',
        authorEmail: 'priya.p@supportdesk.internal',
        createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000),
      },
      {
        ticketId: ticket4._id,
        type: 'reply',
        content: 'We discovered a server clock drift issue on auth-node-02 and corrected the NTP synchronization. Password reset tokens will now reliably last for the full 15 minutes.',
        authorName: 'Alex Rivera',
        authorEmail: 'alex.r@supportdesk.internal',
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      },
    ]);
    console.log('[Seed] Seeded comments with public replies and internal notes');

    // 4. Seed Activities
    await Activity.insertMany([
      // Ticket 1 activities
      {
        ticketId: ticket1._id,
        action: 'CREATED',
        performedBy: 'billing@enterprise-client.io',
        message: 'Ticket created with Urgent priority',
        createdAt: thirtyHoursAgo,
      },
      {
        ticketId: ticket1._id,
        action: 'ASSIGNEE_CHANGED',
        field: 'assignee',
        oldValue: 'Unassigned',
        newValue: 'Sarah Jenkins',
        performedBy: 'Priya Patel',
        message: 'Assignee changed from "Unassigned" to "Sarah Jenkins"',
        createdAt: new Date(thirtyHoursAgo.getTime() + 10 * 60 * 1000),
      },
      {
        ticketId: ticket1._id,
        action: 'STATUS_CHANGED',
        field: 'status',
        oldValue: 'Open',
        newValue: 'In Progress',
        performedBy: 'Sarah Jenkins',
        message: 'Status updated from "Open" to "In Progress"',
        createdAt: new Date(thirtyHoursAgo.getTime() + 20 * 60 * 1000),
      },
      {
        ticketId: ticket1._id,
        action: 'NOTE_ADDED',
        performedBy: 'Sarah Jenkins',
        message: 'Internal note added by Sarah Jenkins',
        createdAt: new Date(now.getTime() - 15 * 60 * 60 * 1000),
      },
      {
        ticketId: ticket1._id,
        action: 'REPLY_ADDED',
        performedBy: 'Sarah Jenkins',
        message: 'Public reply added by Sarah Jenkins',
        createdAt: new Date(now.getTime() - 14 * 60 * 60 * 1000),
      },
      // Ticket 2 activities
      {
        ticketId: ticket2._id,
        action: 'CREATED',
        performedBy: 'mark.watson@startup.co',
        message: 'Ticket created with High priority',
        createdAt: twoDaysAgo,
      },
      {
        ticketId: ticket2._id,
        action: 'ASSIGNEE_CHANGED',
        field: 'assignee',
        oldValue: 'Unassigned',
        newValue: 'Alex Rivera',
        performedBy: 'Priya Patel',
        message: 'Assignee changed from "Unassigned" to "Alex Rivera"',
        createdAt: new Date(twoDaysAgo.getTime() + 15 * 60 * 1000),
      },
      // Ticket 3 activities
      {
        ticketId: ticket3._id,
        action: 'CREATED',
        performedBy: 'finance@acme-corp.com',
        message: 'Ticket created with Medium priority',
        createdAt: tenHoursAgo,
      },
      {
        ticketId: ticket3._id,
        action: 'ASSIGNEE_CHANGED',
        field: 'assignee',
        oldValue: 'Unassigned',
        newValue: 'David Kim',
        performedBy: 'Priya Patel',
        message: 'Assignee changed from "Unassigned" to "David Kim"',
        createdAt: new Date(tenHoursAgo.getTime() + 5 * 60 * 1000),
      },
      {
        ticketId: ticket3._id,
        action: 'STATUS_CHANGED',
        field: 'status',
        oldValue: 'Open',
        newValue: 'Waiting on Customer',
        performedBy: 'David Kim',
        message: 'Status updated from "Open" to "Waiting on Customer"',
        createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
      },
      // Ticket 4 activities
      {
        ticketId: ticket4._id,
        action: 'CREATED',
        performedBy: 'elena.rostova@designagency.net',
        message: 'Ticket created with Low priority',
        createdAt: twoDaysAgo,
      },
      {
        ticketId: ticket4._id,
        action: 'STATUS_CHANGED',
        field: 'status',
        oldValue: 'In Progress',
        newValue: 'Resolved',
        performedBy: 'Alex Rivera',
        message: 'Status updated from "In Progress" to "Resolved"',
        createdAt: twoHoursAgo,
      },
      // Ticket 5 activities
      {
        ticketId: ticket5._id,
        action: 'CREATED',
        performedBy: 'jordan.lee@techhub.org',
        message: 'Ticket created with Low priority',
        createdAt: twoHoursAgo,
      },
    ]);
    console.log('[Seed] Seeded activity history');

    console.log('\n✅ Database seeding complete!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]', error);
    process.exit(1);
  }
};

seedDatabase();
