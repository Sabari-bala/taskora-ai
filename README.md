# Taskora AI

> AI-assisted project workspace where every AI suggestion requires human approval.

[![Live Demo](https://img.shields.io/badge/Live_Demo-Vercel-black?style=for-the-badge&logo=vercel)](https://taskora-ai-delta.vercel.app) [![CI](https://github.com/Sabari-bala/taskora-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/Sabari-bala/taskora-ai/actions) [![Backend](https://img.shields.io/badge/Backend-Django%205-092E20?style=for-the-badge&logo=django)](https://taskora-api-df40.onrender.com/api/v1/health/) [![Frontend](https://img.shields.io/badge/Frontend-React%2018-61DAFB?style=for-the-badge&logo=react)](https://taskora-ai-delta.vercel.app)

<!-- Add screenshots here: Kanban board, AI planner review modal, and Viewer (read-only) view. -->

## Live Demo

**Application:** https://taskora-ai-delta.vercel.app

> **Cold start:** The backend runs on Render's free tier. If the application has not been visited recently, the first request may take 20–30 seconds while the server wakes up.

### Demo Accounts

The following accounts share the same demo password: `StrongPass!2026`.

| Role | Email | Access |
|---|---|---|
| Owner | `sabari@taskora.local` | Full access |
| Manager | `priya@taskora.local` | Manage projects and tasks |
| Member | `rahul@taskora.local` | Work on assigned tasks |
| Viewer | `sneha@taskora.local` | Read-only access |

> **Public demo:** Other visitors may edit or delete demo data. Do not enter real personal information or credentials.

## Overview

Taskora AI is a multi-tenant project management platform where AI acts as a planning co-pilot, not a chatbot.

Most project management tools assume users already know what work needs to be done. Taskora addresses this problem by allowing users to describe a goal in plain language, review an AI-generated proposal of milestones and tasks, approve the items they want, and execute the plan inside a project workspace with roles, permissions, and audit trails.

**Core principle: AI proposes, humans approve.**

AI output is never written directly to the database. Every proposal is normalized, validated, presented through an editable review step, and saved only after the user explicitly commits it through the same permission-checked service functions used by manual actions.

## Features

### Core Project Management

- **Multi-tenant workspaces:** Workspace data is isolated.
- **Role-based access control:** Five roles—Owner, Admin, Manager, Member, and Viewer—with permissions enforced by the backend.
- **Kanban board:** Drag-and-drop task management with optimistic UI updates and automatic rollback when API requests fail.
- **Task management:** Subtasks, priorities, labels, assignees, due dates, and an activity audit log.
- **Milestones:** Track project checkpoints.
- **Command palette:** Search with keyboard navigation using `Ctrl+K` or `Cmd+K`.
- **Dark mode and responsive layouts:** Theme-aware UI, collapsible sidebar, scrollable Kanban board, and full-screen drawers on smaller screens.

### AI Features

Powered by the Groq API and LLaMA models.

- **AI Project Planner:** A three-step workflow—Describe, Review, Commit—that generates milestones, epics, and tasks.
- **AI Task Breakdown:** Generates ordered subtasks from a parent task.
- **AI Task Summarization:** Extracts summaries, decisions, blockers, and next actions from comments.
- **AI Project Insights:** Django calculates statistics from actual database records; the language model generates the explanatory narrative.

## How AI Safety Works

1. The user requests AI-generated content.
2. The AI provider returns the model output.
3. A normalizer maps variable field names to the application's expected schema.
4. The result is validated against a strict JSON Schema. Invalid output is rejected safely.
5. The frontend displays the proposal in an editable review interface.
6. The user selects the desired items and explicitly clicks **Commit**.
7. The backend saves the approved changes through standard, permission-checked service functions.

The AI layer uses an `AIProvider` interface, allowing providers to be changed without coupling the application to a single vendor. Groq is the current provider.

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React 18, Vite, React Router | Component-based single-page application |
| UI | Tailwind CSS, Radix UI, dnd-kit | Styling, accessible UI primitives, and drag-and-drop |
| Server state | TanStack Query | Data fetching, caching, and optimistic updates |
| Backend | Python 3.13, Django 5, Django REST Framework | API development, business logic, and ORM |
| Database | PostgreSQL (Neon), SQLite for development | Relational persistence |
| Authentication | SimpleJWT | JWT authentication with refresh-token handling |
| AI | Groq API, JSON Schema validation | AI generation behind a provider abstraction |
| Testing | Pytest, Factory Boy | Automated tests for permissions, workflows, and AI failure modes |
| Code quality | GitHub Actions, pre-commit, Ruff, Black, Prettier | Automated checks and consistent formatting |
| Hosting | Render, Vercel | Separate backend and frontend deployments |

## Architecture

### Backend Request Flow

```text
Client Request
      |
      v
   ViewSet
      |
      v
  Serializer
 (validation)
      |
      v
   Service
 (business rules)
      |
      v
    Model
      |
      v
  PostgreSQL
```

Business logic lives in `services.py`, keeping views thin and making core rules easier to test independently of HTTP requests.

### Data Model Highlights

- **User:** Custom user model with UUID primary keys and email-based login.
- **Workspace:** Organizes users and workspace-level access.
- **Project:** Represents a project within a workspace.
- **Task:** Stores task details, assignments, priorities, and workflow status.
- **Milestone:** Represents project checkpoints.
- **Comment:** Stores task-related discussion.
- **TaskActivity:** Records task activity, including changes and Kanban reordering.

## Local Setup

### Prerequisites

- Python 3.13, or the version supported by the project.
- Node.js and npm.
- Git.
- A Groq API key for AI features.

### 1. Clone the Repository

```bash
git clone https://github.com/Sabari-bala/taskora-ai.git
cd taskora-ai
```

### 2. Set Up the Backend

From the repository root, create and activate a virtual environment.

**Windows PowerShell:**

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements/dev.txt
Copy-Item .env.example .env
```

**macOS/Linux:**

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements/dev.txt
cp .env.example .env
```

Configure the environment variables required by the backend, including the database settings, Django secret key, and Groq API key where applicable.

Run migrations and start the development server:

```bash
python manage.py migrate
python manage.py runserver
```

The backend is available at `http://127.0.0.1:8000`.

### 3. Set Up the Frontend

Open a second terminal from the repository root:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite, typically `http://localhost:5173`.

> **Note:** Confirm the environment-variable names and required values against the project's `.env.example` files and frontend configuration. Never commit real secrets or API keys.

## Testing

Run the backend test suite from the `backend` directory with the virtual environment activated:

```bash
pytest --cov
```

The project test suite covers role-based permissions, authentication flows, task lifecycle operations, and AI failure modes.

**Reported test status:** 200 tests passing with 94% backend coverage.

GitHub Actions runs automated checks through the configured CI workflow.

## Security

- Argon2 password hashing.
- JWT refresh-token rotation and token blacklisting on logout.
- Object-level permissions on API viewsets.
- Workspace-level data isolation enforced through querysets.
- CSRF protection for cookie-authenticated endpoints.
- Rate limiting on AI endpoints.
- Secrets and API keys supplied through environment variables.
- AI-generated proposals validated before users can commit them.

## Engineering Notes

- **React StrictMode:** Fixed duplicate requests in authentication and email-verification flows caused by effects running twice during development.
- **SQLite locking:** Addressed database-locking issues during development by enabling WAL mode.
- **Cross-domain deployment:** Configured CORS, CSRF, and cookie settings to support communication between the Vercel frontend and Render backend.
- **AI output validation:** Added normalization and schema validation to handle inconsistent model responses safely.

These issues provided practical experience debugging application behavior across development and production environments.

## Roadmap and Known Limitations

### Planned

- [ ] Real-time collaboration using WebSockets for instant Kanban updates.
- [ ] Docker Compose for one-command local setup.
- [ ] Email verification on signup, requiring SMTP configuration.

### Known Limitations

- Two-factor authentication is not implemented.
- Notifications poll every 30 seconds rather than using WebSockets.
- File attachments are not supported.

## Author

**Sabari Bala M R** — Python Full Stack Developer

- [LinkedIn](https://linkedin.com/in/sabari-bala)
- [GitHub](https://github.com/Sabari-bala)

Licensed under the MIT License. See [LICENSE](LICENSE) for details.
