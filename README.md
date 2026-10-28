# DeskPulse — Support Desk System

A modern, role-based customer support ticket management system built with Express.js, MongoDB Atlas, React, and Vite. Designed with a clean, professional light-green and white interface.

---

## Table of Contents
1. [Key Features & Role Workflows](#key-features--role-workflows)
2. [Demo Accounts](#demo-accounts)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Getting Started](#getting-started)
   - [Prerequisites](#prerequisites)
   - [1. Backend Setup](#1-backend-setup)
   - [2. Database Seeding](#2-database-seeding)
   - [3. Frontend Setup](#3-frontend-setup)
6. [API Endpoints Reference](#api-endpoints-reference)
7. [Deployment Guide (Vercel & Cloud)](#deployment-guide)

---

## Key Features & Role Workflows

The system enforces distinct, role-based workflows for **Users (Customers)**, **Agents**, and **Admins**:

### 1. Normal User (Customer)
- **Sign Up / Log In**: Register a customer account or log in.
- **Raise Tickets**: Submit new support requests specifying Subject, Priority (Low, Medium, High, Urgent), and Description.
- **Track Status**: View only their own tickets, live assignment status, and last-updated timestamps.
- **Agent Responses**: Read public replies from support agents and post follow-up comments. Internal agent notes are automatically hidden from users.
- **Resolution Confirmation**: When a ticket is marked as resolved (or in progress), the system prompts the user:
  - **"Yes, Confirm Resolved"** — Closes the ticket and records user confirmation in the activity audit trail.
  - **"No, I Still Need Help"** — Reopens the ticket with customer feedback so agents can take further action.

### 2. Support Agent
- **Unified Ticket Queue**: View all tickets across the system with instant filtering (All Tickets, Unassigned Queue, Assigned to Me, Overdue SLA >24h).
- **1-Click Self-Assignment**: Claim any unassigned ticket with one click ("Claim Ticket"). The status automatically updates to `Assigned` in the database for all users and logs the action in the ticket audit history.
- **1-Click Quick Resolve**: Mark tickets as resolved directly from the queue or ticket detail view.
- **Manage & Respond**: Update status (`Open`, `Assigned`, `In Progress`, `Waiting on Customer`, `Resolved`) and priority, post public customer replies, or write private internal team notes.
- **Audit Timeline**: View chronological activity logs tracking every status shift, priority update, and comment.

### 3. Administrator
- **Full Control & Analytics**: Real-time aggregated KPI metrics (Total Tickets, In Progress, Overdue SLA >24h, Resolved, Priority Breakdown).
- **Delegate Any Ticket**: Assign or reassign any ticket to any registered agent using the delegation dropdown.
- **Agent Directory Management**: Register new agents (Name, Work Email, Password, Role) and remove inactive staff members.
- **Ticket Lifecycle**: Full access to edit, delete tickets, view internal notes, and monitor system performance.

---

## Demo Accounts

The database comes pre-seeded with 3 accounts (0 tickets, ready for your own test tickets):

| Role | Name | Email | Password | Permissions |
|---|---|---|---|---|
| **Admin** | Aarav Sharma | `admin@supportdesk.com` | `admin123` | Full system control, agent management, delegation, delete tickets |
| **Agent** | Rohan Verma | `agent@supportdesk.com` | `agent123` | View all tickets, claim tickets, resolve tickets, internal notes |
| **User** | Ananya Patel | `user@supportdesk.com` | `user123` | Raise tickets, track own tickets, reply, confirm resolution |

*(Quick 1-click login buttons for these accounts are available on the login page).*

---

## Tech Stack

- **Backend**: Node.js, Express.js (ES Modules)
- **Database**: MongoDB Atlas with Mongoose ORM
- **Authentication**: JWT (JSON Web Tokens) with `bcryptjs` password hashing
- **Frontend**: React 19, Vite, React Router v7, Lucide React icons
- **Theme**: Light green (`#059669`, `#ecfdf5`) & white clean professional palette

---

## Project Structure

```text
Support Desk System/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                  # MongoDB Atlas connection & fallback
│   │   ├── features/
│   │   │   ├── activities/            # Audit history tracking
│   │   │   ├── agents/                # Agent model, controller, routes
│   │   │   ├── auth/                  # Authentication (login, signup, JWT)
│   │   │   ├── comments/              # Public replies & internal notes
│   │   │   ├── dashboard/             # Aggregated stats & metrics
│   │   │   └── tickets/               # Ticket CRUD, resolution confirmation
│   │   ├── middleware/
│   │   │   ├── auth.js                # JWT protect, adminOnly, staffOnly
│   │   │   └── errorHandler.js        # Global error handling
│   │   ├── app.js                     # Express app setup
│   │   └── seed.js                    # Database seeder script
│   ├── .env                           # Backend environment variables
│   ├── package.json
│   └── server.js                      # Server entry point
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js              # Fetch client with auto-auth & env routing
│   │   ├── components/
│   │   │   └── Navbar.jsx             # Role-aware navigation header
│   │   ├── features/
│   │   │   ├── admin/                 # Admin Dashboard & Agent Management
│   │   │   ├── agent/                 # Agent Queue & Quick Actions
│   │   │   ├── auth/                  # Login / Register / AuthContext
│   │   │   ├── tickets/               # Ticket Detail & New Ticket form
│   │   │   └── user/                  # Customer Dashboard
│   │   ├── App.jsx                    # Routing & protected routes
│   │   ├── index.css                  # Light-green design system
│   │   └── main.jsx
│   ├── .env                           # Frontend environment variables
│   ├── vercel.json                    # SPA rewrite configuration
│   ├── vite.config.js
│   └── package.json
└── README.md
```

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [MongoDB Atlas](https://www.mongodb.com/atlas) connection string (or local MongoDB)

---

### 1. Backend Setup

1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   npm install
   ```

2. Create/verify `backend/.env`:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRES_IN=7d
   ```

3. Start the backend server:
   ```bash
   # Production / regular run
   npm start

   # Development with auto-reload
   npm run dev
   ```
   The backend runs at `http://localhost:5000`.

---

### 2. Database Seeding

To clean the database and create the 3 default users (Admin, Agent, User) with 0 tickets:

```bash
cd backend
npm run seed
```

---

### 3. Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   npm install
   ```

2. Configure `frontend/.env`:
   ```env
   VITE_API_URL=http://localhost:5000
   ```
   *(In local development, if left empty, Vite's proxy forwards requests from `http://localhost:5173/api` to `http://localhost:5000/api`)*.

3. Start the frontend development server:
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:5173`.

---

## API Endpoints Reference

### Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | Public | Authenticate user/agent and receive JWT |
| `POST` | `/api/auth/signup` | Public | Register a new customer (`User` role) |
| `GET` | `/api/auth/me` | Protected | Get profile of logged-in user |

### Tickets (`/api/tickets`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/tickets` | Protected | List tickets (Users see only their own; Agents/Admins see all with search & filters) |
| `GET` | `/api/tickets/:id` | Protected | View single ticket details |
| `POST` | `/api/tickets` | Protected | Create a new ticket (automatically links creator) |
| `PATCH` | `/api/tickets/:id` | Staff | Update ticket status, priority, or assignee |
| `DELETE` | `/api/tickets/:id` | Admin | Delete ticket (cascades delete on comments and activities) |
| `POST` | `/api/tickets/:id/confirm-resolution` | User | Customer confirms resolution (`resolved: true`) or reopens (`resolved: false`) |

### Comments (`/api/tickets/:id/comments`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/tickets/:id/comments` | Protected | View ticket comments (internal notes hidden from regular users) |
| `POST` | `/api/tickets/:id/comments` | Protected | Post a public reply or internal staff note |

### Staff Management (`/api/agents`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/agents` | Staff | List all agents & admins |
| `POST` | `/api/agents` | Admin | Register a new agent or admin |
| `DELETE` | `/api/agents/:id` | Admin | Remove an agent |

### Dashboard Analytics (`/api/dashboard`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/dashboard/stats` | Staff | Get real-time ticket counts, overdue count, and priority breakdown |

---

## Deployment Guide

### Deploying Frontend on Vercel
1. Push your repository to GitHub.
2. In Vercel, click **Add New Project** and import the repository.
3. Configure settings:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. In **Environment Variables**, add:
   - `VITE_API_URL` = `https://your-deployed-backend-url` (e.g., your Render/Railway backend URL)
5. [`frontend/vercel.json`](./frontend/vercel.json) already handles SPA rewrites so direct navigation and page reloads work smoothly.

### Deploying Backend (Render / Railway / VPS)
1. Deploy the `backend/` directory as a Node web service.
2. Build Command: `npm install`
3. Start Command: `npm start`
4. Set Environment Variables:
   - `PORT` = `5000`
   - `NODE_ENV` = `production`
   - `MONGODB_URI` = `your_mongodb_atlas_connection_string`
   - `JWT_SECRET` = `your_secure_secret`
