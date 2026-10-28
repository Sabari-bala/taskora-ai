# Taskora AI Backend

This directory contains the Django REST Framework API for Taskora AI.

For the product overview, architecture, environment configuration, authentication design, deployment, and full testing instructions, see the [root README](../README.md).

## Local checks

Run these commands from the `backend/` directory after installing dependencies and configuring the repository-root `.env` file:

```bash
python manage.py check
pytest
pytest --cov
```

The CI workflow runs the backend test suite and Ruff checks alongside the frontend checks.
