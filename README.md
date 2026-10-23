# Taskora AI

**An AI-assisted project management platform where AI proposes and humans approve.**

Taskora AI is a full-stack, multi-tenant project workspace built with Django REST Framework and React. Teams can organize projects, manage tasks through a Kanban board, collaborate through comments and activity logs, and use AI-assisted workflows to turn goals into actionable plans.

AI is integrated into the product workflow—not added as a standalone chatbot. Generated plans and task suggestions remain proposals until a user reviews and confirms them.

## Live Demo

- **Frontend:** https://taskora-ai-delta.vercel.app
- **Backend health check:** https://taskora-api-df40.onrender.com/api/v1/health/
- **Source code:** https://github.com/Sabari-bala/taskora-ai
- **User handbook:** [docs/HANDBOOK.md](docs/HANDBOOK.md)

> The public demo is intended for evaluation. Demo data may be modified by other visitors. Do not enter personal or confidential information.

## Key Features

### Project and task management
- Create and manage projects, milestones, tasks, and subtasks.
- Organize tasks across five workflow statuses: Backlog, To Do, In Progress, Review, and Done.
- Set priorities, assignees, due dates, estimates, and labels.
- Add task comments and inspect task activity history.
- Use drag-and-drop Kanban boards with optimistic updates and rollback on failure.
- Search, filter, paginate, and view dashboard summaries.

### Workspaces and permissions
- Workspace-scoped data and membership.
- Five roles: Owner, Admin, Manager, Member, and Viewer.
- Role-aware access and object-level permission checks on protected operations.
- Member management and workspace switching.
- Read-only access for Viewers.

### AI-assisted workflows
- **AI Project Planner:** turn a project description into a structured proposal with milestones and tasks.
- **AI Task Breakdown:** propose subtasks for an existing task.
- **AI Task Summarization:** summarize task context, decisions, blockers, and next actions.
- **AI Project Insights:** interpret calculated project statistics and surface risks or recommendations.

### User experience
- Responsive layouts for desktop and mobile.
- Light and dark themes.
- Searchable application navigation and keyboard shortcuts.
- Notifications and unread indicators.
- Reusable UI components and loading, empty, and error states.

## Technology Stack

| Area | Technologies |
|---|---|
| Backend | Python 3.13, Django 5.1, Django REST Framework |
| Frontend | React 18, Vite, React Router |
| Styling and UI | Tailwind CSS, Radix UI, Lucide React |
| Client data | TanStack Query, Axios |
| Kanban | dnd-kit |
| Database | PostgreSQL in production, SQLite for development |
| Authentication | SimpleJWT, refresh-token rotation and blacklist |
| AI integration | Groq API, `httpx`, JSON Schema validation |
| API documentation | drf-spectacular |
| Testing | pytest, pytest-django, Factory Boy |
| Code quality | Ruff, Black, ESLint, Prettier, pre-commit |
| Deployment | Render for the backend, Vercel for the frontend |

## Architecture and Engineering Decisions

### Backend structure

The backend follows a domain-oriented Django architecture. Views handle HTTP concerns, serializers validate and represent data, service functions own business operations, and selectors organize read queries where applicable.

This separation keeps business logic testable and reduces the amount of logic inside views.

### Multi-tenant authorization

Workspace membership defines the access boundary. Protected operations check both the requested resource and the user's permissions; the frontend is not treated as the security boundary.

### Human-reviewed AI

AI-generated content is not written directly to the database by the model.

1. The user submits a request.
2. The backend calls the configured AI provider.
3. The response is normalized and validated against a JSON Schema.
4. The user reviews and selects the proposed content.
5. Approved changes are persisted through normal, permission-checked application operations.

This design keeps the AI layer separate from the application's authorization and persistence rules.

### Provider abstraction

Taskora AI uses the **Groq API**, currently configured with the `openai/gpt-oss-120b` model. Provider configuration is abstracted so the integration can be changed without redesigning the product's workflows.

AI requests also have timeout, retry, rate-limit, error-handling, and interaction-logging safeguards.

### Frontend state management

- TanStack Query manages server state and request caching.
- Authentication and theme contexts handle shared application state.
- Local component state handles temporary UI interactions.
- URL search parameters can represent navigable filters and pagination state.

## Security

Implemented safeguards include:

- Password hashing with Argon2.
- JWT authentication with refresh-token rotation and token blacklisting on logout.
- Access tokens held in memory rather than browser local storage.
- Refresh tokens stored in an HttpOnly cookie.
- CSRF protection for cookie-authenticated endpoints.
- Workspace-scoped queries and object-level authorization.
- Rate limiting and structured validation for AI endpoints.
- Environment-based configuration for secrets and deployment settings.

Security controls depend on correct production configuration. Never commit real secrets, API keys, database credentials, or private environment files.

## Testing and Quality

The project's automated backend tests cover areas including authentication, permissions, business rules, task workflows, and AI failure scenarios.

**Latest reported backend status:** 200 tests passing, with 94% test coverage.

These are reported project test results, not a guarantee that every production scenario is covered. Run the current test suite before relying on these figures after code changes.

GitHub Actions is used for continuous integration, alongside formatting and linting tools.

## Local Development

### Prerequisites

- Python 3.13
- Node.js and npm
- Git
- A Groq API key for testing AI features

### 1. Clone the repository

```powershell
git clone https://github.com/Sabari-bala/taskora-ai.git
cd taskora-ai
```

### 2. Configure and run the backend

Run these commands from the repository root in PowerShell:

```powershell
cd backend
py -3.13 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements/dev.txt
Copy-Item .env.example .env
```

Edit `backend/.env` and provide the required local settings, including a Django secret key and your Groq API key if you want to use AI features. Configure the database variables according to the project's settings.

Then run migrations and start Django:

```powershell
python manage.py migrate
python manage.py runserver
```

The backend should be available at `http://127.0.0.1:8000`.

### 3. Configure and run the frontend

Open a **second terminal** at the repository root:

```powershell
cd frontend
npm install
Copy-Item .env.example .env
```

Set the API base URL in `frontend/.env`:

- **Local development:** `VITE_API_URL=http://localhost:8000/api/v1`
- **Production:** `VITE_API_URL=/api/v1`, with the Vercel API proxy configured for the deployed application.

The production setting relies on the deployed proxy configuration. The local setting connects directly to the Django development server.

Start Vite:

```powershell
npm run dev
```

Open the local URL printed by Vite in the terminal.

> If PowerShell reports that the destination `.env` file already exists, review it before replacing it. Keep real credentials in local environment files, never in `.env.example`.

## Demo Accounts

The seeded demonstration workspace includes accounts representing different permission levels:

| Account | Role |
|---|---|
| `sabari@taskora.local` | Owner |
| `priya@taskora.local` | Manager |
| `rahul@taskora.local` | Member |
| `arjun@taskora.local` | Member |
| `sneha@taskora.local` | Viewer |

The documented demo password is `StrongPass!2026`. Use these credentials only if they remain enabled on the live demo; deployments may reset or change demo data.

## Known Limitations

Taskora AI focuses on project and task workflows rather than being a complete enterprise suite. Current documented limitations include:

- No billing or subscription system.
- No signup email verification or password-reset email workflow.
- No file attachments.
- Notifications poll periodically rather than using WebSockets.
- No real-time collaborative editing.
- No two-factor authentication.
- No custom workflow builder, time tracking, or native mobile application.

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
│   └── vite.config.js
├── docs/
│   └── HANDBOOK.md
├── .github/
│   └── workflows/
├── .gitignore
├── LICENSE
└── README.md
```

## What This Project Demonstrates

- Building a full-stack application with Django REST APIs and React.
- Modeling relational data and enforcing workspace-level permissions.
- Designing reusable services and maintainable application boundaries.
- Managing client-side server state and asynchronous UI updates.
- Integrating a third-party LLM through Groq with structured-output validation.
- Keeping AI proposals separate from authorized database writes.
- Testing authentication, permissions, business rules, and failure paths.
- Configuring separate frontend and backend deployments.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
