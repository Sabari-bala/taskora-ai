
# Taskora AI

> AI-assisted project workspace where every AI suggestion needs human approval.

[![Live Demo](https://img.shields.io/badge/Live_Demo-Vercel-black?style=for-the-badge&logo=vercel)](https://taskora-ai-delta.vercel.app)
[![CI](https://github.com/Sabari-bala/taskora-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/Sabari-bala/taskora-ai/actions/workflows/ci.yml)
[![Backend](https://img.shields.io/badge/Backend-Django%205-092E20?style=for-the-badge&logo=django)](https://taskora-api-df40.onrender.com/api/v1/health/)
[![Frontend](https://img.shields.io/badge/Frontend-React%2018-61DAFB?style=for-the-badge&logo=react)](https://taskora-ai-delta.vercel.app)

## 🚀 Live Demo

**URL:** [https://taskora-ai-delta.vercel.app](https://taskora-ai-delta.vercel.app)

> ⚡ **Note on the Live Demo:** The backend is deployed on Render's free tier. If the app hasn't been visited recently, the initial load may take **20–30 seconds** while the container spins up. Subsequent requests are instant.

**Demo Accounts** (Password for all: `StrongPass!2026`):
- **Owner:** `sabari@taskora.local` (Full access)
- **Manager:** `priya@taskora.local`
- **Member:** `rahul@taskora.local`
- **Viewer:** `sneha@taskora.local` (Read-only access)

> ⚠️ **Demo Environment Disclaimer:** This is a public demo environment. Data can be edited or deleted by other visitors. Please do not enter real personal information or credentials.

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

> **How AI Safety works under the hood:** LLM output is normalized (key-name mapping) and then validated against a strict **JSON Schema** before it reaches the review UI. If the LLM hallucinates a different format, the request is safely rejected without breaking the app.

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

### Backend
```bash
cd backend
python -m venv .venv

# Windows PowerShell
.venv\Scripts\Activate.ps1
# macOS / Linux
source .venv/bin/activate

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
200 tests passing (94% coverage). Tests cover the permission matrix (role × action), auth flows, task lifecycle, and AI failure modes.

Roadmap & Known Limitations
Planned Next:

□ Real-time collaboration (WebSockets) for instant Kanban updates.
□ Docker Compose for a 1-command local setup.
□ Email verification on signup (requires SMTP).
Known Limitations:

No 2FA.

Notifications poll every 30 seconds (no WebSockets).

No file attachments.

Security Considerations
Implemented:

Argon2 password hashing.

JWT refresh rotation with token blacklist.

Object-level permissions on every viewset.

Multi-tenancy enforced at the query level.

CSRF protection on cookie-authenticated endpoints.

Rate limiting on AI endpoints.

Author
Sabari Bala M R — Python Full-Stack Developer

LinkedIn · GitHub · Email

Licensed under the MIT License.