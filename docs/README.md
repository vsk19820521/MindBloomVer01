# MindBloom

A logic and lateral thinking puzzle web app for children (ages 4–12), built with
vanilla HTML/CSS/JS, Vercel serverless functions, and Supabase.

## Documentation

All design and planning documents live in [`docs/`](docs/):

| File | Purpose |
|------|---------|
| [docs/implementation_plan.md](docs/implementation_plan.md) | Full requirements, architecture, and phased delivery plan |
| [docs/TASK_LOG.md](docs/TASK_LOG.md) | Running task checklist — updated as work progresses |

## Quick Start (local dev)

```bash
# Install dependencies
npm install

# Set environment variables
copy .env.example .env.local
# Edit .env.local — set SUPABASE_URL and SUPABASE_SERVICE_KEY

# Run tests
npm test

# Serve locally (static files only — API runs on Vercel)
python -m http.server 8000
```

## Deployment

Deployed on Vercel. Push to `main` → auto-deploy.

Environment variables required in Vercel dashboard:
- `SUPABASE_URL` — bare project URL, e.g. `https://xxx.supabase.co` (**no** `/rest/v1` suffix)
- `SUPABASE_SERVICE_KEY` — service role key (never expose in frontend)

## Tech Stack

- **Frontend:** HTML5, vanilla CSS, vanilla JS (ESM modules)
- **Backend:** Vercel serverless functions (Node 18)
- **Database:** Supabase (PostgreSQL)
- **Auth:** bcrypt password hashing (server-side)
- **Storage:** Supabase Storage (canvas drawing images)