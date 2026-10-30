# Taskora AI

> AI-assisted project workspace where every AI suggestion needs human approval.

[![Live Demo](https://img.shields.io/badge/Live_Demo-Vercel-black?style=for-the-badge&logo=vercel)](https://taskora-ai-delta.vercel.app)
[![CI](https://github.com/Sabari-bala/taskora-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/Sabari-bala/taskora-ai/actions)
[![Backend](https://img.shields.io/badge/Backend-Django%205-092E20?style=for-the-badge&logo=django)](https://taskora-api-df40.onrender.com/api/v1/health/)
[![Frontend](https://img.shields.io/badge/Frontend-React%2018-61DAFB?style=for-the-badge&logo=react)](https://taskora-ai-delta.vercel.app)


**An AI-assisted project management platform where AI proposes and humans approve.**

Taskora AI is a full-stack, multi-tenant project workspace built with Django REST Framework and React. Teams can organize projects, manage tasks through a Kanban board, collaborate through comments and activity logs, and use AI-assisted workflows to turn goals into actionable plans.

AI is part of the product workflow, not a standalone chatbot. Generated plans and task suggestions remain proposals until a user reviews and confirms them.

## Live Demo

- **Application:** https://taskora-ai-delta.vercel.app
- **Backend health check:** https://taskora-api-df40.onrender.com/api/v1/health/
- **User handbook:** [docs/HANDBOOK.md](docs/HANDBOOK.md)

> **Cold start:** The backend runs on Render's free tier. If the app has not been visited recently, the first request may take 20-30 seconds while the server wakes up.

### Demo accounts

Password for all accounts: `StrongPass!2026`

| Account | Role |
|---|---|
| `sabari@taskora.local` | Owner |
| `priya@taskora.local` | Manager |
| `rahul@taskora.local` | Member |
| `arjun@taskora.local` | Member |
| `sneha@taskora.local` | Viewer (read-only) |

> **Public demo:** Other visitors can edit or delete demo data. Do not enter personal or confidential information.

> **One-click demo login:** The login page has buttons for each role (Owner, Manager, Member, Viewer). Click any to log in instantly — no typing needed.

> **Demo password protection:** Password changes are disabled for demo accounts, so the demo can never be locked out by a visitor.

## Key Features

### Project and task management

- Create and manage projects, milestones, tasks and subtasks.
- Organize tasks across five workflow statuses: Backlog, To Do, In Progress, Review and Done.
- Set priorities, assignees, due dates, estimates and labels.
- Add task comments and inspect task activity history.
- Drag-and-drop Kanban board with optimistic updates and rollback on failure.
- Search, filter, paginate and view dashboard summaries.

### Workspaces and permissions

- Workspace-scoped data and membership.
- Five roles: Owner, Admin, Manager, Member and Viewer.
- Role-aware access and object-level permission checks on protected operations.
- Member management and workspace switching.
- Read-only access for Viewers.

### AI-assisted workflows

- **AI Project Planner:** turn a project description into a structured proposal of milestones and tasks (Describe, Review, Commit).
- **AI Task Breakdown:** propose subtasks for an existing task.
- **AI Task Summarization:** summarize task context, decisions, blockers and next actions.
- **AI Project Insights:** interpret calculated project statistics and surface risks or recommendations.

### User experience

- Responsive layouts for desktop and mobile.
- Light and dark themes.
- Command palette search and keyboard shortcuts (`Ctrl+K` / `Cmd+K`).
- Notifications and unread indicators.
- Loading, empty and error states throughout.

## Technology Stack

| Area | Technologies |
|---|---|
| Backend | Python 3.13, Django 5.1, Django REST Framework |
| Frontend | React 18, Vite, React Router |
| Styling and UI | Tailwind CSS, Radix UI, Lucide React |
| Client data | TanStack Query, Axios |
| Kanban | dnd-kit |
| Database | PostgreSQL (Neon) in production, SQLite for development |
| Authentication | SimpleJWT, refresh-token rotation and blacklist |
| UI polish | Framer Motion (page transitions), Sonner (toast notifications) |
| Testing | Pytest + Factory Boy (backend), Vitest + React Testing Library (frontend) |
| CI/CD | GitHub Actions (Node 22), Render Deploy Hook, Vercel |
| AI integration | Groq API, `httpx`, JSON Schema validation |
| API documentation | drf-spectacular |
| Code quality | Ruff, Black, ESLint, Prettier, pre-commit, GitHub Actions |
| Deployment | Render (backend), Vercel (frontend) |

## Architecture and Engineering Decisions

### Backend structure

```text
Request -> ViewSet -> Serializer -> Service -> Model -> PostgreSQL
                      (validation)  (business rules)
```

The backend follows a domain-oriented Django architecture. Views handle HTTP concerns, serializers validate and represent data, and service functions own business operations. This keeps business logic testable without going through HTTP.

### Multi-tenant authorization

Workspace membership defines the access boundary. Protected operations check both the requested resource and the user's permissions; the frontend is never treated as the security boundary.

### Human-reviewed AI

AI-generated content is never written to the database directly by the model.

1. The user submits a request.
2. The backend calls the configured AI provider.
3. The response is normalized (variable key names mapped to the expected schema) and validated against a JSON Schema. Invalid output is rejected safely.
4. The user reviews and selects the proposed content in an editable review step.
5. Approved changes are saved through the same permission-checked service functions used by manual actions.

### Provider abstraction

Taskora AI uses the **Groq API**, currently configured with the `openai/gpt-oss-120b` model. Providers sit behind an `AIProvider` interface so the integration can change without redesigning the product's workflows. AI requests have timeout, retry, rate-limit and error-handling safeguards.

### Frontend state management

- TanStack Query manages server state and caching.
- Authentication and theme contexts handle shared application state.
- URL search parameters represent filters and pagination.

## Security

- Argon2 as the primary password hasher, with Django's PBKDF2 hashers retained for compatibility and automatic upgrades on successful login.
- JWT authentication with refresh-token rotation and blacklisting on logout.
- Access tokens held in memory, not in browser local storage.
- Refresh tokens stored in an HttpOnly cookie.
- CSRF protection for cookie-authenticated endpoints.
- Workspace-scoped queries and object-level authorization.
- Rate limiting and structured validation on AI endpoints.
- Environment-based configuration for secrets and deployment settings.

Never commit real secrets, API keys or database credentials.

## Deployment

- **Frontend:** Vercel. `frontend/vercel.json` proxies `/api/*` to the Render API and rewrites all other paths to `index.html`.
- **Backend:** Render (Gunicorn, Whitenoise), PostgreSQL on Neon.
- **Production environment:** `VITE_API_URL=/api/v1` on Vercel. The backend needs `DJANGO_ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS` and `CSRF_TRUSTED_ORIGINS` set to the Vercel domain.

## Engineering Notes

- **Test-suite configuration:** More than 100 tests initially failed because `SECURE_SSL_REDIRECT = True` was inherited from production settings. A pytest fixture now overrides the setting during tests.
- **Cross-domain authentication:** Browsers can block third-party cookies between Vercel and Render. Proxying `/api` through Vercel makes the HttpOnly refresh cookie first-party.
- **Demo account safety:** Password changes are blocked for the five seeded demo accounts so visitors cannot lock other users out of the shared demo.
- **SPA deep links:** A catch-all Vercel rewrite serves `index.html` when users refresh client-side routes.
- **React StrictMode:** Duplicate requests in authentication flows during development were addressed.
- **SQLite locking:** WAL mode and a busy timeout reduce database-locking errors during local development.
- **AI output validation:** AI responses are normalized and checked against a JSON Schema before they can be reviewed and committed.

## Testing and Quality

```bash
cd backend
pytest --cov
```

**201 backend tests passing with 94% coverage, plus 1 frontend test via Vitest.** The suite covers authentication flows (rotation, refresh, blacklist), the role-by-action permission matrix, task workflows including Kanban reordering and activity logging, and AI failure modes (timeouts, malformed JSON).

GitHub Actions runs backend tests and Ruff, plus frontend linting, Vitest tests, and a production build, on pushes to `main` and `feature/**` branches and pull requests targeting `main`.

## Local Development

### Prerequisites

- Python 3.13
- Node.js and npm
- Git
- A Groq API key (for AI features)

### 1. Clone the repository

```bash
git clone https://github.com/Sabari-bala/taskora-ai.git
cd taskora-ai
```

### 2. Backend

Django loads its environment from the repository-root `.env` file. Create that file from the backend example before starting the server.

**Windows (PowerShell), from the repository root:**

```powershell
Copy-Item backend/.env.example .env
cd backend
py -3.13 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements/dev.txt
```

**macOS / Linux, from the repository root:**

```bash
cp backend/.env.example .env
cd backend
python3.13 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements/dev.txt
```

Edit the repository-root `.env` file and set a secure local Django secret key and your Groq API key if you want to use AI features. The example leaves `DATABASE_URL` unset so development uses SQLite by default. If you prefer PostgreSQL locally, configure `DATABASE_URL` for your local database.

Then run migrations and start Django:

```bash
python manage.py migrate
python manage.py runserver
```

The backend runs at `http://127.0.0.1:8000`.

### 3. Frontend

In a second terminal from the repository root:

```bash
cd frontend
npm install
cp .env.example .env        # PowerShell: Copy-Item .env.example .env
npm run dev
```

Set the API URL in `frontend/.env`:

- **Local development:** `VITE_API_URL=http://localhost:8000/api/v1`
- **Production:** `VITE_API_URL=/api/v1` (relies on the Vercel proxy described above)

Open the local URL printed by Vite.

## Known Limitations

- No two-factor authentication.
- No signup email verification or password-reset emails.
- No file attachments.
- Notifications poll periodically instead of using WebSockets.

## Project Structure

```text
taskora-ai/
├── backend/
│   ├── apps/
│   ├── config/
│   ├── requirements/
│   └── manage.py
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── features/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── lib/
│   ├── package.json
│   ├── vercel.json
│   └── vite.config.js
├── docs/
│   └── HANDBOOK.md
├── .github/workflows/
├── CONTRIBUTING.md
├── LICENSE
└── README.md
```

## What This Project Demonstrates

- Building a full-stack application with Django REST APIs and React.
- Modeling relational data and enforcing workspace-level permissions.
- Designing a service layer with maintainable application boundaries.
- Managing server state and optimistic UI updates on the client.
- Integrating an LLM through Groq with structured-output validation.
- Keeping AI proposals separate from authorized database writes.
- Testing authentication, permissions, business rules and failure paths.
- Diagnosing and fixing production issues (third-party cookies, SPA routing, cross-domain configuration).

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

**Author:** Sabari Bala M R, Python Full Stack Developer | [LinkedIn](https://linkedin.com/in/sabari-bala) | [GitHub](https://github.com/Sabari-bala)
