# Support Desk System

A full-stack customer support platform for receiving, organizing, assigning, tracking, and resolving customer issues with comprehensive service performance metrics.

---

## 📋 Table of Contents
1. [Project Overview & 5-Phase Roadmap](#1-project-overview--5-phase-roadmap)
2. [Architecture & Feature-Based Folder Structure](#2-architecture--feature-based-folder-structure)
3. [Business Rules & Data Integrity](#3-business-rules--data-integrity)
4. [Backend API Reference](#4-backend-api-reference)
5. [Getting Started & Setup Instructions](#5-getting-started--setup-instructions)
6. [Database Seeding](#6-database-seeding)
7. [Implementation Status](#7-implementation-status)

---

## 1. Project Overview & 5-Phase Roadmap

The development of this Support Desk System is divided into 5 structured phases:

### Phase 1: Project Architecture & Backend Foundation
- Establish modular, feature-based project architecture.
- Configure Express.js server, Mongoose ORM, and environment configs.
- Setup centralized error-handling middleware and robust database connection handling.
- Build automatic database seeder with realistic support agents, diverse tickets, replies, notes, and activity events.

### Phase 2: Complete Feature-Driven REST APIs & Business Logic *(Completed)*
- **Tickets Feature**: CRUD operations, multi-filter querying (status, priority, assignee, overdue), full-text search, custom priority sorting, and cascade deletion.
- **Comments Feature**: Distinguish between public customer replies and internal agent notes, updating ticket timestamps and triggering audit events.
- **Activity History Feature**: Automatic audit logging for ticket creation, status changes, priority changes, assignee changes, and note/reply additions.
- **Dashboard Feature**: Real-time aggregated service metrics (Total, Open, In Progress, Resolved, Urgent, Overdue).
- **Agents Feature**: Dedicated agent directory for assignment and attribution.

### Phase 3: Frontend Setup & Core Ticket Operations
- Initialize modern Vite + React client.
- Build responsive layout with navigation, notifications, and brand styling.
- Implement comprehensive Ticket List view with searchable table, status/priority badges, and last-updated relative timestamps.
- Implement multi-attribute filtering (Status, Priority, Assignee) and dynamic sorting (Recently Updated vs Priority).
- Create Ticket Modal with client-side validation for required fields.

### Phase 4: Ticket Detail Experience & Dual-Messaging Timeline
- Ticket detail view with inline field editing (Status, Priority, Assignee).
- Clear visual distinction between Public Customer Replies and Yellow-flagged Internal Notes.
- Chronological timeline combining customer replies, internal notes, and system activity logs.
- Real-time SLA breach and Overdue status badges.

### Phase 5: Dashboard Analytics, Service Metrics & Polish
- Performance overview dashboard displaying real-time counts:
  - Total Tickets, Open, In Progress, Resolved
  - Urgent issues requiring immediate attention
  - Overdue tickets exceeding the 24-hour SLA
- Empty states, loading spinners, form error toasts, and responsive design for laptop screens.
- Comprehensive testing, documentation, and verification.

---

## 2. Architecture & Feature-Based Folder Structure

The backend follows a **Feature-Based Modular Architecture**. Each domain feature contains its own controller, routes, schema/model, and related services:

```
Support Desk System/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                        # Database connection configuration
│   │   ├── middleware/
│   │   │   └── errorHandler.js              # Centralized error handler
│   │   ├── features/
│   │   │   ├── tickets/
│   │   │   │   ├── ticket.model.js          # Ticket Mongoose Schema & virtuals
│   │   │   │   ├── ticket.controller.js     # Ticket CRUD, search, filter, sort
│   │   │   │   └── ticket.routes.js         # Ticket API endpoints & subroutes
│   │   │   ├── comments/
│   │   │   │   ├── comment.model.js         # Reply & Note schema
│   │   │   │   ├── comment.controller.js    # Add and retrieve comments
│   │   │   │   └── comment.routes.js        # Comment endpoints
│   │   │   ├── activities/
│   │   │   │   ├── activity.model.js        # Audit log event schema
│   │   │   │   ├── activity.service.js      # Automatic activity logging helper
│   │   │   │   ├── activity.controller.js   # Fetch ticket timeline events
│   │   │   │   └── activity.routes.js       # Activity endpoints
│   │   │   ├── dashboard/
│   │   │   │   ├── dashboard.controller.js  # Live service performance metrics
│   │   │   │   └── dashboard.routes.js      # Dashboard stats endpoints
│   │   │   └── agents/
│   │   │       ├── agent.model.js           # Support agent profile schema
│   │   │       ├── agent.controller.js      # Fetch and create agents
│   │   │       └── agent.routes.js          # Agent endpoints
│   │   ├── app.js                           # Express application configuration
│   │   └── seed.js                          # Sample data seeder
│   ├── server.js                            # Backend server entry point
│   ├── .env.example                         # Environment variable template
│   └── package.json                         # Backend dependencies & scripts
├── frontend/                                # Client application
└── README.md                                # Project documentation
```

---

## 3. Business Rules & Data Integrity

1. **Required Fields**:
   - Every ticket must have a `subject`, `customer` (name or email), and `description`. Both client and server reject submissions missing any of these.
2. **Overdue Definition**:
   - A ticket is marked **Overdue** if and only if its status is **not** `Resolved` and its `createdAt` timestamp is greater than **24 hours in the past**.
   - Computed dynamically via Mongoose virtuals and MongoDB queries to ensure live accuracy.
3. **Resolution**:
   - Once a ticket is changed to `Resolved`, it is immediately excluded from Open, In Progress, and Overdue calculations.
4. **Audit History & Activity Logging**:
   - Every creation, status change, priority change, assignment change, public reply, and internal note automatically records an immutable Activity History event with timestamp and author.
5. **Data Integrity & Cascade Deletion**:
   - If a ticket is deleted, all corresponding replies, notes, and activity history records are cleaned up via cascade deletion to prevent orphaned entries.

---

## 4. Backend API Reference

### Health Check
- `GET /api/health` — Check server status.

### Tickets (`/api/tickets`)
- `GET /api/tickets` — List tickets with search, filtering, and sorting:
  - Query Params:
    - `search`: Case-insensitive regex match against `subject` or `customer`.
    - `status`: `Open`, `In Progress`, `Waiting on Customer`, `Resolved`, or comma-separated list.
    - `priority`: `Low`, `Medium`, `High`, `Urgent`.
    - `assignee`: Filter by assigned agent name or `Unassigned`.
    - `overdueOnly`: `true` to return only unresolved tickets created > 24 hours ago.
    - `sortBy`: `recently_updated` (default), `priority` (Urgent -> High -> Medium -> Low), `created_desc`, `created_asc`.
    - `page` & `limit`: Optional pagination support.
- `GET /api/tickets/:id` — Retrieve a single ticket by its ID.
- `POST /api/tickets` — Create a new ticket.
  - Body: `{ subject, customer, description, priority?, status?, assignee?, createdBy? }`
- `PATCH /api/tickets/:id` (or `PUT`) — Update ticket details (status, priority, assignee, subject, description). Automatically logs change activities.
- `DELETE /api/tickets/:id` — Delete a ticket and cascade-delete its comments and activity logs.

### Comments & Notes (`/api/tickets/:ticketId/comments`)
- `GET /api/tickets/:ticketId/comments` — Retrieve all replies and internal notes in chronological order.
- `POST /api/tickets/:ticketId/comments` — Add a new reply or internal note.
  - Body: `{ type: "reply" | "note", content: string, authorName: string, authorEmail?: string }`
  - Updates ticket's `updatedAt` and logs an activity entry.

### Activity History (`/api/tickets/:ticketId/activities`)
- `GET /api/tickets/:ticketId/activities` — Retrieve chronological audit log for a ticket.

### Dashboard (`/api/dashboard`)
- `GET /api/dashboard/stats` — Return computed counts:
  - `totalTickets`: Total number of tickets.
  - `openTickets`: Tickets with status `Open`.
  - `inProgressTickets`: Tickets with status `In Progress`.
  - `waitingTickets`: Tickets with status `Waiting on Customer`.
  - `resolvedTickets`: Tickets with status `Resolved`.
  - `urgentTickets`: Tickets with priority `Urgent`.
  - `overdueTickets`: Tickets matching the 24-hour overdue SLA rule.
  - `priorityBreakdown`: Breakdown by Low, Medium, High, Urgent.
  - `sampleOverdueTickets`: Top urgent overdue tickets list.

### Agents (`/api/agents`)
- `GET /api/agents` — List available support agents.
- `POST /api/agents` — Register a new support agent `{ name, email, role?, avatar? }`.

---

## 5. Getting Started & Setup Instructions

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [MongoDB](https://www.mongodb.com/) (Local instance running at `mongodb://127.0.0.1:27017` or a MongoDB Atlas URI)

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables in `.env`:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://127.0.0.1:27017/support_desk
   NODE_ENV=development
   ```
4. Seed the database with sample data:
   ```bash
   npm run seed
   ```
5. Start the backend development server:
   ```bash
   npm run dev
   ```
   The API will be accessible at `http://localhost:5000`.

---

## 6. Database Seeding

Run the seed command to populate demo agents, varied tickets (including open, urgent, and >24h overdue tickets), public customer replies, internal yellow notes, and audit events:

```bash
npm run seed
```

---

## 7. Implementation Status

| Feature / Requirement | Backend API Status | Notes |
| :--- | :--- | :--- |
| **Ticket CRUD** | ✅ Complete | Full validation & error handling |
| **Search, Filter & Sort** | ✅ Complete | Multi-filter & priority ordering supported |
| **Overdue SLA Calculation** | ✅ Complete | `status !== 'Resolved' && createdAt > 24h` |
| **Public Replies vs Internal Notes** | ✅ Complete | Clear separation with `type: 'reply' \| 'note'` |
| **Activity History Logging** | ✅ Complete | Automatic audit trails for all updates |
| **Dashboard Metrics** | ✅ Complete | Live database aggregation |
| **Data Integrity (Cascade Delete)** | ✅ Complete | Prevents orphaned replies & activities |
| **Agent Management** | ✅ Complete | Pre-seeded agents & assignment support |
