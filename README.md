# Taskora AI

> An AI-powered project workspace for modern teams — plan smarter, ship faster.

![Status](https://img.shields.io/badge/status-in%20development-yellow)
![Backend](https://img.shields.io/badge/backend-Django%205-092E20?logo=django)
![Frontend](https://img.shields.io/badge/frontend-React%2018-61DAFB?logo=react)
![Database](https://img.shields.io/badge/database-PostgreSQL-336791?logo=postgresql)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## Overview

Taskora AI is a multi-tenant collaboration platform that helps teams plan,
organise, and track work — with AI embedded directly into the workflow.

Instead of adding a chatbot to the sidebar, AI is used where it actually helps:
turning a rough idea into a structured project plan, breaking a vague task into
concrete subtasks, summarising long comment threads, and interpreting real
project data into plain-language insight.

**Core principle:** every AI output is a proposal that a human reviews before
it reaches the database. An AI bug can never corrupt workspace data.

## The Problem It Solves

Most project tools assume you already know *what* work needs doing. They give
you a board and let you fill it.

But teams usually start with a **goal**, not a task list — "launch the
marketing site", "build the mobile app", "prepare the client demo". Turning
that goal into structured, assignable, trackable work takes time and experience.

Taskora closes that gap. Describe the goal, review the AI's structured
proposal, then work inside a real project management system.

## Features

### Core
- Multi-tenant workspaces with role-based access
  (Owner · Admin · Manager · Member · Viewer)
- Projects and milestones with leads, dates, and progress
- Kanban board with drag-and-drop and optimistic updates
- Rich task detail: comments, activity timeline, labels, estimates
- Backend-driven search, filtering, and pagination
- Dashboard with real database analytics
- In-app notifications

### AI (Ember-flagged in the UI)
- **AI Project Planner** — turn an idea into an editable plan of milestones,
  epics, and tasks
- **AI Task Breakdown** — decompose a task into ordered, estimated subtasks
- **AI Task Summarization** — decisions, blockers, and next actions from a thread
- **AI Project Insights** — narrative on top of Django-computed statistics

Every AI feature follows the same pattern: AI proposes → human reviews → user
confirms → standard, permission-checked endpoints persist.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Django 5.1 + Django REST Framework |
| Database | PostgreSQL 16 (SQLite for local dev) |
| Auth | SimpleJWT — access in memory, refresh in HttpOnly cookie |
| Frontend | React 18 + Vite |
| Routing | React Router v6 |
| Server state | TanStack Query |
| Styling | Tailwind CSS + "Paper & Signal" design tokens |
| Drag & drop | dnd-kit |
| AI | Provider abstraction (Groq / Gemini / OpenAI) |
| Testing | pytest + factory_boy, Vitest + React Testing Library |
| CI | GitHub Actions |
| Containers | Docker Compose (dev) |

## Project Structure

```
taskora-ai/
├── backend/                 # Django + DRF
│   ├── config/              # Settings (base/dev/prod/test), URLs, WSGI
│   ├── apps/                # Domain apps (accounts, workspaces, projects, tasks, …)
│   ├── common/              # Shared utilities (health, pagination, exceptions)
│   └── requirements/        # Pinned dependencies by environment
├── frontend/                # React + Vite
│   ├── src/
│   │   ├── app/             # Root, router, providers
│   │   ├── features/        # Feature-based modules
│   │   ├── components/ui/   # Design system primitives
│   │   ├── layouts/         # AppShell, AuthLayout
│   │   └── lib/             # Axios instance, query client, helpers
│   └── tailwind.config.js
├── docs/                    # Architecture, design, and API documentation
└── .github/workflows/       # CI
```

## Local Setup

### Prerequisites
- Python 3.12+
- Node.js 20+
- Git

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1     # Windows
# source .venv/bin/activate    # macOS / Linux
pip install -r requirements/dev.txt
python manage.py migrate
python manage.py runserver
```

Backend runs at **http://127.0.0.1:8000**
Health check: **http://127.0.0.1:8000/api/v1/health/**
API docs:     **http://127.0.0.1:8000/api/docs/**

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at **http://localhost:5173**

### Environment Variables

Copy `.env.example` to `.env` at the project root and fill in the values.
The `.env` file is gitignored — never commit real secrets.

## Testing

```bash
# Backend
cd backend
pytest

# Frontend
cd frontend
npm run test
```

Tests cover permissions (role × action matrix), auth flows, task lifecycle,
AI failure modes, and analytics accuracy.

## Architecture

The backend follows a **three-layer pattern**:

```
View/ViewSet  →  Serializer  →  Service  →  Model
                     ↓             ↓
                 Validation   Business rules
                              (activity log,
                               notifications,
                               permission checks)
```

Read queries are isolated in `selectors.py` for `select_related` /
`prefetch_related` optimisation. Business logic lives in `services.py`, not
in views or serialisers.

Full details in [`docs/architecture/`](docs/architecture/).

## Security

**Implemented:**
- Argon2 password hashing
- Refresh token in HttpOnly, Secure, SameSite cookie
- DRF throttling (anonymous + per-user + scoped AI)
- Object-level permissions on every viewset
- CORS allowlist
- All secrets via environment variables
- ORM-only queries (no raw SQL string interpolation)

**Known limitations (documented honestly):**
- No 2FA
- No refresh-token rotation with reuse detection
- Rate limits are per-process (Redis needed for multi-instance)
- No WAF / DDoS protection

## Roadmap

- [x] Phase 1–3 — Architecture, design system, repository setup
- [x] Phase 4 — Django backend foundation
- [ ] Phase 5 — Database models
- [ ] Phase 6 — Authentication
- [ ] Phase 7–13 — Workspaces, projects, tasks, Kanban, notifications, dashboard
- [ ] Phase 14–16 — AI foundation, Project Planner, Task Assistant
- [ ] Phase 17–20 — Testing, security hardening, Docker, deployment
- [ ] Phase 21–22 — Documentation, interview preparation

## Author

**Sabari Bala M R** — Python Full-Stack Developer

[LinkedIn](https://www.linkedin.com/in/sabari-bala) · [GitHub](https://github.com/Sabari-bala) · [Email](mailto:sabaribala7733@gmail.com)

---

Built as a flagship portfolio project. Licensed under the [MIT License](LICENSE).