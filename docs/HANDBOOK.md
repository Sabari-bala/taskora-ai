# Taskora AI — Handbook

Everything you need to run, explore, and stress-test Taskora.

## 1. Quick Start

### Backend
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements/dev.txt
python manage.py migrate
python manage.py runserver

### Frontend
cd frontend
npm install
npm run dev

### Demo accounts (all password: StrongPass!2026)

| Email | Role |
|---|---|
| sabari@taskora.local | Owner |
| priya@taskora.local  | Manager |
| rahul@taskora.local  | Member |
| arjun@taskora.local  | Member |
| sneha@taskora.local  | Viewer |

## 2. What the App Does

A multi-tenant project workspace with AI as a co-pilot. Every AI output is a
proposal a human reviews before it touches the database.

## 3. The Demo Workspace

**Northstar Studio** workspace contains:
- 5 members across all 5 roles
- 4 projects: Taskora Platform, Design System, Q4 Marketing, Mobile App v2
- 7 milestones
- 36 tasks with real descriptions and comments
- 8 subtasks
- 5 notifications

## 4. What to Try

1. **Dashboard** — real KPIs from the database
2. **Kanban** — drag a card between columns; refresh to see it persist
3. **Task detail** — click a card, edit fields, add comments
4. **Subtasks** — open a task with children, add/toggle/delete
5. **Milestones** — project page has a milestone panel
6. **AI Planner** — dashboard → "Plan with AI"; 3-step flow
7. **AI Breakdown** — task drawer → "Break down with AI"
8. **AI Summarize** — task drawer → "Summarize with AI"
9. **AI Insights** — project page → "Generate insights"
10. **Notifications** — bell icon
11. **Search** — topbar, or Ctrl+K
12. **Dark mode** — avatar menu
13. **Mobile view** — F12 → Ctrl+Shift+M → iPhone 12
14. **Members** — sidebar → see roles, invite, change roles

## 5. Role Testing

Log in as different users. What changes matters:

| Action | Owner | Manager | Member | Viewer |
|---|---|---|---|---|
| View Kanban | yes | yes | yes | yes |
| Create project | yes | yes | yes | no |
| Create task | yes | yes | yes | no |
| Comment | yes | yes | yes | no |
| Reorder tasks | yes | yes | yes | no |
| Invite member | yes | no | no | no |

## 6. AI Timings

| Feature | Where | Time |
|---|---|---|
| Project Planner | Dashboard / Projects | 5-15s |
| Task Breakdown | Task drawer | 5-10s |
| Task Summarize | Task drawer | 5-10s |
| Project Insights | Project page | 5-10s |

Every AI call is logged in the Django admin at /admin/ai/aiinteraction/

## 7. Common Issues

| Problem | Fix |
|---|---|
| "Unable to connect to 127.0.0.1:8000" | Start backend in another window |
| "Cannot find module 'config'" | cd backend before running Python |
| Frontend shows stale UI | Restart npm run dev |
| AI says "unexpected format" | Retry; normalizers handle most |

## 8. What Taskora Is Not

- No billing or subscriptions
- No email verification on signup (only on email change)
- No file attachments
- No real-time collaboration (notifications poll every 30s)
- SQLite in dev (Postgres via DATABASE_URL in production)

Each is a deliberate choice, not a missing feature.
