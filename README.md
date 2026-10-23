# Taskora AI

> AI-assisted project workspace where every AI suggestion needs human approval.

[![Live Demo](https://img.shields.io/badge/Live_Demo-Vercel-black?style=for-the-badge&logo=vercel)](https://taskora-ai-delta.vercel.app)
[![CI](https://github.com/Sabari-bala/taskora-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/Sabari-bala/taskora-ai/actions)
[![Backend](https://img.shields.io/badge/Backend-Django%205-092E20?style=for-the-badge&logo=django)](https://taskora-api-df40.onrender.com/api/v1/health/)
[![Frontend](https://img.shields.io/badge/Frontend-React%2018-61DAFB?style=for-the-badge&logo=react)](https://taskora-ai-delta.vercel.app)

<!-- Add screenshots here: Kanban board, AI planner review modal, Viewer (read-only) view -->

## Live Demo

**URL:** https://taskora-ai-delta.vercel.app

> **Cold start:** The backend runs on Render's free tier. If the app has not been visited recently, the first load can take 20-30 seconds while the server wakes up. After that, requests are fast.

**Demo accounts** (password for all: `StrongPass!2026`):

| Role | Email | Access |
|---|---|---|
| Owner | `sabari@taskora.local` | Full access |
| Manager | `priya@taskora.local` | Manage projects and tasks |
| Member | `rahul@taskora.local` | Work on assigned tasks |
| Viewer | `sneha@taskora.local` | Read-only |

> **Public demo:** Data can be edited or deleted by other visitors. Please do not enter real personal information or credentials.

## Overview

Taskora AI is a multi-tenant project management platform where AI acts as a planning co-pilot, not a chatbot.

Most project tools assume you already know what work needs to be done. Taskora closes that gap: describe a goal in plain language, review the AI's structured proposal of milestones and tasks, approve only what you want, and then work inside a real project system with roles, permissions and audit trails.

**Core principle: AI proposes, humans approve.** AI output is never written to the database directly. Every proposal is validated, shown in an editable review step, and saved only after a user commits it through the same permission-checked service functions as any manual action.

## Features

### Core
- **Multi-tenant workspaces:** Data is isolated per workspace.
- **Role-based access control:** Five roles (Owner, Admin, Manager, Member, Viewer) enforced on every API endpoint.
- **Kanban board:** Drag-and-drop with optimistic UI updates and automatic rollback if the API call fails.
- **Task management:** Subtasks, priorities, labels, assignees, due dates, and an immutable activity audit log.
- **Milestones:** Track project checkpoints.
- **Command palette search:** Inline search with keyboard navigation (Cmd/Ctrl+K).
- **Dark mode and mobile layout:** Theme-aware UI, collapsible sidebar, scrollable board, full-screen drawers on small screens.

### AI features (Groq, LLaMA models)
- **AI Project Planner:** Three-step flow (Describe, Review, Commit) that generates milestones, epics and tasks.
- **AI Task Breakdown:** Generates ordered subtasks from a parent task.
- **AI Task Summarization:** Extracts summary, decisions, blockers and next actions from comments.
- **AI Project Insights:** Django calculates real database statistics; the LLM only writes the narrative on top of them.

## How AI safety works

1. The user requests an AI generation.
2. The provider returns raw LLM output.
3. A **normalizer** maps variable key names to the expected schema (for example `name` to `title`).
4. The result is validated against a strict **JSON Schema**. If the format is wrong, the request is rejected safely and the app keeps working.
5. The frontend shows an editable review modal.
6. The user selects what they want and clicks **Commit**.
7. The backend saves it through standard, permission-checked service functions.

The AI layer sits behind an `AIProvider` interface, so the app is not locked to one vendor (Groq is the current provider).

## Tech stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | React 18, Vite, React Router | Fast SPA development; no SEO requirements for an authenticated app |
| UI | Tailwind CSS, Radix UI, dnd-kit | Custom "Paper & Signal" design system, accessible primitives, drag-and-drop |
| Server state | TanStack Query | Caching and optimistic updates |
| Backend | Python 3.13, Django 5, Django REST Framework | ORM, migrations and a mature API toolkit |
| Database | PostgreSQL (Neon) in production, SQLite in development | Relational data model with constraints |
| Auth | SimpleJWT | Access token in memory (XSS-safe), refresh token in an HttpOnly cookie |
| AI | Groq API with JSON Schema validation | Fast inference behind a provider abstraction |
| Testing | Pytest, Factory Boy | Role-by-action permission tests and AI failure modes |
| Tooling | GitHub Actions, pre-commit (Ruff, Black, Prettier) | Consistent style and automated checks |
| Hosting | Render (API), Vercel (frontend) | Separate deployments with cross-domain CORS/CSRF configuration |

## Architecture

### Three-layer backend
Request -> ViewSet -> Serializer -> Service -> Model
(validation) (business rules)

text

Business logic lives in `services.py`; views stay thin. This keeps the core rules testable without going through HTTP.

### Data model highlights
- Custom `User` model with UUID primary keys and email-based login.
- Workspaces, Projects, Tasks, Milestones and Comments.
- An immutable `TaskActivity` log written automatically when tasks change (including Kanban reorders, which run in atomic database updates).

## Local setup

Backend:

```bash
cd backend
python -m venv .venv

# Windows PowerShell
.venv\Scripts\Activate.ps1
# macOS / Linux
source .venv/bin/activate

pip install -r requirements/dev.txt
cp .env.example .env        # then fill in values (AI features need a Groq API key)
python manage.py migrate
python manage.py runserver
Frontend:

bash
cd frontend
npm install
npm run dev
See the Handbook for a full walkthrough, the role testing matrix and troubleshooting.

Testing
bash
cd backend
pytest --cov
200 tests passing with 94% backend coverage. The suite covers the permission matrix (role x action), auth flows, the task lifecycle and AI failure modes. The GitHub Actions pipeline runs on every push.

Security
Argon2 password hashing

JWT refresh rotation with token blacklist on logout

Object-level permissions on every viewset

Multi-tenancy enforced at the query level

CSRF protection on cookie-authenticated endpoints

Rate limiting on AI endpoints

Secrets and API keys supplied through environment variables

Engineering notes
React StrictMode double-firing: fixed duplicate requests in the auth and email-verification flows caused by effects running twice in development.

SQLite locking: resolved "database is locked" errors in development by enabling WAL mode.

Cross-domain deployment: configured CORS, CSRF and cookie settings so the Vercel frontend and Render API work together.

Roadmap and known limitations
Planned

□ Real-time collaboration (WebSockets) for instant Kanban updates
□ Docker Compose for one-command local setup
□ Email verification on signup (requires SMTP)
Known limitations

No two-factor authentication

Notifications poll every 30 seconds instead of using WebSockets

No file attachments

Author
Sabari Bala M R, Python Full Stack Developer
LinkedIn | GitHub | Email

Licensed under the MIT License.
