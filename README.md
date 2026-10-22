# Taskora AI

> An AI-powered project workspace for modern teams — plan smarter, ship faster.

[![Live Demo](https://img.shields.io/badge/Live_Demo-Vercel-black?style=for-the-badge&logo=vercel)](https://taskora-ai-delta.vercel.app)
[![Backend](https://img.shields.io/badge/Backend-Django%205-092E20?style=for-the-badge&logo=django)](https://taskora-api-df40.onrender.com/api/v1/health/)
[![Frontend](https://img.shields.io/badge/Frontend-React%2018-61DAFB?style=for-the-badge&logo=react)](#)

## 🚀 Live Demo

**URL:** [https://taskora-ai-delta.vercel.app](https://taskora-ai-delta.vercel.app)

**Demo Accounts** (Password for all: `StrongPass!2026`):
- **Owner:** `sabari@taskora.local` (Full access)
- **Manager:** `priya@taskora.local`
- **Member:** `rahul@taskora.local`
- **Viewer:** `sneha@taskora.local` (Read-only access)

*(Note: The backend is hosted on Render's free tier and sleeps after 15 minutes of inactivity. The first request may take 30–50 seconds to wake it up.)*

---

## Overview

Taskora AI is a multi-tenant project management platform where AI acts as a planning co-pilot. 

Most project tools assume you already know what work needs to be done. Taskora closes that gap: describe a goal in natural language, review the AI's structured proposal of milestones and tasks, approve only what you want, and work inside a real project management system with roles, permissions, and audit trails.

**Core Principle:** AI never writes to the database directly. Every AI output is a *proposal* that a human reviews before it is committed. This ensures an AI hallucination can never corrupt workspace data.

## Features

### Core
- **Multi-Tenant Workspaces:** Isolated data per workspace.
- **Role-Based Access Control:** 5 roles (Owner, Admin, Manager, Member, Viewer) enforced on every API endpoint.
- **Kanban Board:** Drag-and-drop with optimistic UI updates and automatic rollback on failure.
- **Task Management:** Subtasks, priorities, labels, assignees, due dates, and activity audit logs.
- **Milestones:** Track project checkpoints.
- **Real-time Search:** Chrome-style inline search with keyboard navigation (Cmd/Ctrl+K).
- **Dark Mode:** Fully theme-aware UI.
- **Mobile Responsive:** Sidebar collapses, Kanban scrolls, drawers adapt.

### AI Features (Powered by Groq)
- **AI Project Planner:** 3-step flow (Describe → Review → Commit). Generates structured milestones, epics, and tasks.
- **AI Task Breakdown:** Generates ordered subtasks from a parent task.
- **AI Task Summarization:** Extracts summary, decisions, blockers, and next actions from comments.
- **AI Project Insights:** Interprets real database statistics into narrative observations and risks.

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **Frontend** | React 18 + Vite | Fast SPA development, no SEO requirements |
| **Styling** | Tailwind CSS | Custom "Paper & Signal" design system |
| **State/Data** | TanStack Query | Server state, caching, optimistic updates |
| **Backend** | Django 5 + DRF | Batteries-included ORM, auth, and migrations |
| **Database** | PostgreSQL (Neon) | Production-grade relational DB |
| **Auth** | SimpleJWT | Access in memory (XSS-safe), Refresh in HttpOnly cookie (CSRF-safe) |
| **AI** | Groq API | Fast LLM inference via provider abstraction |
| **Deployment**| Render + Vercel | Backend + Frontend hosting |

## Architecture

### The Three-Layer Backend
View/ViewSet → Serializer → Service → Model
↓ ↓
Validation Business rules

text
Business logic is isolated in `services.py`. Views stay thin. This makes the system testable without HTTP.

### AI Safety Pattern
1. The user requests an AI generation.
2. The LLM returns a JSON schema-validated proposal.
3. The frontend renders an editable review modal.
4. The user selects what they want and hits "Commit".
5. The backend uses standard, permission-checked service functions to save the data.

## Local Setup

See the [**Handbook**](docs/HANDBOOK.md) for a full walkthrough, role testing matrix, and troubleshooting.

### Backend
```bash
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements/dev.txt
python manage.py migrate
python manage.py runserver
Frontend
bash
cd frontend
npm install
npm run dev
Testing
bash
# Backend
cd backend
pytest
185 tests passing. Tests cover permissions (role × action matrix), auth flows, task lifecycle, and AI failure modes.

Security Considerations
Implemented:

Argon2 password hashing.

JWT refresh rotation with token blacklist.

Object-level permissions on every viewset.

Multi-tenancy enforced at the query level.

CSRF protection on cookie-authenticated endpoints.

Rate limiting on AI endpoints.

Known Limitations:

No 2FA.

No email verification on signup (only on email change).

Notifications poll every 30 seconds (no WebSockets).

No file attachments.

Author
Sabari Bala M R — Python Full-Stack Developer

LinkedIn · GitHub · Email

Licensed under the MIT License.