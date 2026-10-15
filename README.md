cd ~/Desktop/PROJECTS/it-ticket-system
cat > README.md << 'EOF'
# TicketDesk

A full-stack IT help desk ticketing system built with React, Node.js, Express, and MySQL. Supports role-based access control, real-time notifications, AI-powered ticket analysis, and a full admin panel — deployed on a zero-cost production stack.

**Live demo: [ticketdesk-kappa.vercel.app](https://ticketdesk-kappa.vercel.app)**

> **Heads up:** the backend runs on a free tier that sleeps when idle, so the first login can take up to a minute. After that it's fast.
>
> **Try it:** log in as `admin@test.com` / `123456` (admin) or `adrien@test.com` / `123456` (employee).

![TicketDesk screenshot](screenshot.png)

---

## Overview

TicketDesk was built to handle the full lifecycle of an IT support request. Employees submit and track tickets, collaborate through comments, and manage their profiles. Admins have a dedicated panel for user management, password reset approvals, and an analytics dashboard covering ticket volume, priority distribution, resolution rates, and top submitters.

Two AI features run on top of the ticket data via Groq's API: a per-ticket summarizer and an incident detector that scans all open tickets and surfaces clusters likely describing the same underlying outage.

---

## Tech Stack

| | |
|---|---|
| Frontend | React (Create React App), Tailwind CSS |
| Backend | Node.js, Express |
| Database | MySQL |
| Authentication | JWT (with 30-day Remember Me) |
| File Storage | Cloudinary |
| AI | Groq API — llama-3.3-70b-versatile |
| Hosting | Vercel, Render.com, Aiven |

---

## Features

**Authentication & accounts** — JWT-based login and registration, Remember Me persisted in localStorage, rate-limited username changes with password confirmation, avatar uploads via Cloudinary, and a forgot-password flow where employees submit requests that admins resolve from the admin panel.

**Tickets & comments** — Full CRUD with priority and status fields, comment threads on each ticket, and a notification bell that pulls live ticket data with per-notification dismiss.

**Admin panel** — User management (role changes, deletions), password reset request queue, AI Incident Monitor, and a glassmorphism stats header with at-a-glance system metrics.

**Analytics** — 7-day activity chart, priority breakdown, status overview, resolution rate, and top submitters.

**AI** — Ticket summarization on demand and an incident detection scan that groups open tickets by probable root cause.

---

## Getting Started

Requires Node.js and a running MySQL instance (local, or a hosted one such as Aiven).

```bash
# Clone
git clone https://github.com/adrientdonf/it-ticket-system.git
cd it-ticket-system

# Backend
cd server && npm install
# create server/.env first (see Environment Variables below)
node setup-db.js      # creates the four tables (safe to run more than once)
node seed-users.js    # optional: adds the test accounts listed below
node server.js
# → http://localhost:8000

# Frontend (in a second terminal)
cd client && npm install && npm start
# → http://localhost:3000
```

---

## Project Structure

```
it-ticket-system/
  client/
    public/
    src/
      components/       TicketCard, TicketModal, CommentSection
      pages/            Login, Register, Profile, Admin, Analytics
      services/         api.js
      App.js
  server/
    config/             db.js, cloudinary.js, groq.js
    controllers/        auth, ticket, admin, comment, ai
    middleware/         authMiddleware.js, adminMiddleware.js
    models/             userModel.js
    routes/
    server.js
    setup-db.js         creates the database tables
    seed-users.js       adds the demo accounts
```

---

## API Endpoints

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
PUT    /api/auth/change-password
PUT    /api/auth/change-username
PUT    /api/auth/avatar
POST   /api/auth/forgot-password

GET    /api/tickets
POST   /api/tickets
GET    /api/tickets/:id
PUT    /api/tickets/:id
DELETE /api/tickets/:id

GET    /api/tickets/:id/comments
POST   /api/tickets/:id/comments
DELETE /api/tickets/:id/comments/:commentId

GET    /api/admin/users
PUT    /api/admin/users/:id/role
DELETE /api/admin/users/:id
GET    /api/admin/reset-requests
PUT    /api/admin/reset-requests/:id/resolve

POST   /api/ai/summarize
POST   /api/ai/detect-incidents
```

---

## Database Schema

```
users                    id, username, email, password (hashed), role, avatar_url, created_at
tickets                  id, title, description, priority, status, created_by, created_at, updated_at
comments                 id, ticket_id, user_id, username, content, created_at
password_reset_requests  id, user_id, username, email, status, created_at
```

---

## Environment Variables

`server/.env`:
```env
PORT=8000
DB_HOST=
DB_PORT=3306
DB_USER=
DB_PASSWORD=
DB_NAME=
DB_SSL=false
JWT_SECRET=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
GROQ_API_KEY=
```

Set `DB_SSL=true` for hosted databases that require an encrypted connection (Aiven does).

`client/.env`:
```env
REACT_APP_API_URL=http://localhost:8000/api
```

---

## Test Accounts

| Email | Password | Role |
|---|---|---|
| admin@test.com | 123456 | Admin |
| adrien@test.com | 123456 | Employee |
| Keryl@test.com | 123456 | Employee |

---

## Deployment

| Service | Provider |
|---|---|
| Frontend | Vercel |
| Backend | Render.com (free tier — cold starts of up to a minute after inactivity) |
| Database | Aiven (free MySQL) |
| Images | Cloudinary |
| AI | Groq |
EOF
head -5 README.md
