import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });
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

    // Clean all collections completely (0 tickets, 0 comments, 0 activities, 0 users)
    await Promise.all([
      Ticket.deleteMany({}),
      Comment.deleteMany({}),
      Activity.deleteMany({}),
      Agent.deleteMany({}),
    ]);
    console.log('[Seed] Cleared existing records (Tickets, Comments, Activities, Users)');

    // 3 users with Indian names: Admin, Agent, User
    const usersData = [
      {
        name: 'Aarav Sharma',
        email: 'admin@supportdesk.com',
        password: 'admin123',
        role: 'Admin',
      },
      {
        name: 'Rohan Verma',
        email: 'agent@supportdesk.com',
        password: 'agent123',
        role: 'Agent',
      },
      {
        name: 'Ananya Patel',
        email: 'user@supportdesk.com',
        password: 'user123',
        role: 'User',
      },
    ];

    const createdUsers = [];
    for (const u of usersData) {
      const user = await Agent.create(u);
      createdUsers.push(user);
      console.log(`[Seed] Created ${user.role}: ${user.name} (${user.email})`);
    }

    console.log(`\n[Seed] Successfully seeded ${createdUsers.length} users with 0 tickets.`);
    console.log('Database is clean and ready.');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]', error);
    process.exit(1);
  }
};

seedDatabase();
