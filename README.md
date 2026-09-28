# Taskora AI

> An AI-native project workspace for small teams who don't have a dedicated project manager.

![Status](https://img.shields.io/badge/status-in%20development-yellow)
![Backend](https://img.shields.io/badge/backend-Django%205-092E20?logo=django)
![Frontend](https://img.shields.io/badge/frontend-React%2018-61DAFB?logo=react)
![Database](https://img.shields.io/badge/database-PostgreSQL-336791?logo=postgresql)

---

## Overview

Taskora AI is a multi-tenant collaboration platform where artificial intelligence
acts as a planning co-pilot. Instead of bolting a chatbot onto a task manager,
AI is embedded directly into workflows: it turns vague ideas into structured,
**human-reviewed** project plans, summarises messy task threads, and interprets
real project data into plain-language insight.

**Core principle:** every AI output is a proposal the user reviews before
anything reaches the database. An AI bug can never corrupt workspace data.

## The Problem It Solves

Most project tools assume you already know *what* work needs doing. Small teams
usually start with a goal ("launch the marketing site") and no idea how to
decompose it. Taskora closes that gap.

## Features

### Core
- Multi-tenant workspaces with role-based access
- Projects, milestones, and cross-project task views
- Kanban board with drag-and-drop and optimistic updates
- Rich task detail: comments, activity timeline, labels, estimates
- Backend-driven search, filtering, and pagination
- Dashboard with real database analytics
- In-app notifications

### AI (Ember-flagged in the UI)
- **AI Project Planner** — idea → editable plan of milestones, epics, and tasks
- **AI Task Breakdown** — decompose a task into ordered subtasks
- **AI Task Summarization** — decisions, blockers, next actions from threads
- **AI Project Insights** — narrative on top of real Django-computed statistics

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Django 5, DRF |
| Database | PostgreSQL 16 |
| Auth | SimpleJWT (access in memory, refresh in HttpOnly cookie) |
| Frontend | React 18 + Vite |
| Server state | TanStack Query |
| Styling | Tailwind + "Paper & Signal" tokens |
| AI | Provider abstraction (Groq / Gemini / OpenAI) |
| Testing | pytest + factory_boy, Vitest + RTL |

## Local Setup

### Prerequisites
- Python 3.12+
- Node.js 20+
- PostgreSQL 16 (or Docker)
- Git

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements/dev.txt
python manage.py migrate
python manage.py runserver