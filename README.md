# ✈ AeroFuel Management System

A full-stack Aviation Fuel Management System for tracking fuel purchases,
stock levels, aircraft fueling operations, and generating reports.

📚 **Documentation**
- [PLAN.md](./PLAN.md) — architecture, database schema, implementation status
- [docs/API.md](./docs/API.md) — full API reference with use-case lookup, request/response shapes, examples
- Live Swagger UI: http://localhost:8000/docs (after starting the backend)

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quick Start with Docker](#quick-start-with-docker-all-platforms)
- [Local Development — Backend](#local-development--backend)
  - [Windows (PowerShell)](#windows-powershell)
  - [macOS / Linux (bash/zsh)](#macos--linux-bashzsh)
- [Local Development — Frontend](#local-development--frontend)
- [Environment Variables](#environment-variables)
- [Demo Data](#demo-data)
- [Default Login](#default-login)
- [Database Access](#database-access)
- [Troubleshooting](#troubleshooting)

---

## Tech Stack

- **Frontend:** React 18 · Vite · Material UI 5 · Redux Toolkit · Axios · ApexCharts
- **Backend:** FastAPI · SQLAlchemy 2 (async, asyncpg) · Pydantic v2 · Alembic · ReportLab
- **Database:** PostgreSQL 16
- **Auth:** JWT (access + refresh tokens, bcrypt password hashing)
- **Container:** Docker + Docker Compose

---

## Prerequisites

Pick **one** of these two setups:

### Option A — Docker only (simplest)
| Tool | Min Version |
|------|-------------|
| Docker Desktop (Win/Mac) or Docker Engine (Linux) | 20.x |
| Docker Compose | v2 |

That's it. No need to install Python, Node, or Postgres locally.

### Option B — Local dev
| Tool | Min Version | Why |
|------|-------------|-----|
| Python | 3.11+ | Backend |
| Node.js | 18+ | Frontend |
| PostgreSQL | 14+ | Database (or run via Docker — see below) |
| Git | any | Clone repo |

---

## Quick Start with Docker (all platforms)

Works identically on Windows, macOS, and Linux.

```bash
# 1. Clone the repo
git clone https://github.com/suryaprakash8870/aircraft.git
cd aircraft

# 2. One-time setup (copies backend/.env.example -> backend/.env,
#    checks Python/Node/Docker versions, prints next-step commands)
python scripts/setup.py
#    or use the OS wrapper:
#       Windows:       .\setup.ps1
#       macOS / Linux: bash setup.sh

# 3. Bring everything up
docker-compose up --build

# 4. Wait ~30s for "Application startup complete", then open:
#    Frontend:   http://localhost:3000
#    API docs:   http://localhost:8000/docs
```

> The setup script is **idempotent** — it won't overwrite an existing
> `backend/.env`. To do the env copy manually instead:
> ```
> # Windows PowerShell:
> Copy-Item backend/.env.example backend/.env
> # macOS / Linux:
> cp backend/.env.example backend/.env
> ```

To stop: `Ctrl+C`, then `docker-compose down`.
To wipe DB: `docker-compose down -v` (deletes the postgres volume).

**Note:** When running everything in Docker, the backend `.env` uses
`DATABASE_URL=postgresql+asyncpg://fuel_user:fuel_pass@db:5432/fuel_management`
because the backend container reaches Postgres by service name `db`. If running
the backend locally with a Dockerized Postgres, change `db` → `localhost`.

---

## Local Development — Backend

### Windows (PowerShell)

```powershell
# Enter backend folder
cd backend

# Create the virtual environment
python -m venv .venv

# Activate it
.\.venv\Scripts\Activate.ps1
# (If you get an "execution policy" error, run this once in admin PowerShell:
#   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
# and retry.)

# Install dependencies
pip install -r requirements.txt

# Create .env file from the template
Copy-Item .env.example .env
# Then open .env and set DATABASE_URL host to "localhost" instead of "db"
# (only matters if Postgres runs outside Docker network)

# Start a Postgres container (skip if you have a local Postgres)
docker run -d --name fuel_postgres `
  -e POSTGRES_USER=fuel_user `
  -e POSTGRES_PASSWORD=fuel_pass `
  -e POSTGRES_DB=fuel_management `
  -p 5432:5432 postgres:16-alpine

# Run database migrations + start server
alembic upgrade head
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### macOS / Linux (bash/zsh)

```bash
# Enter backend folder
cd backend

# Create the virtual environment
python3 -m venv .venv

# Activate it
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file from the template
cp .env.example .env
# Then open .env and set DATABASE_URL host to "localhost" instead of "db"

# Start a Postgres container (skip if you have a local Postgres)
docker run -d --name fuel_postgres \
  -e POSTGRES_USER=fuel_user \
  -e POSTGRES_PASSWORD=fuel_pass \
  -e POSTGRES_DB=fuel_management \
  -p 5432:5432 postgres:16-alpine

# Run database migrations + start server
alembic upgrade head
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

On first run, the app's lifespan creates all tables and seeds the default
admin user (`admin@aerofuel.com` / `Admin@123`).

API docs: http://localhost:8000/docs

---

## Local Development — Frontend

Same commands on Windows, macOS, and Linux:

```bash
cd frontend
npm install
npm run dev
```

The dev server starts at **http://localhost:3000** and proxies `/api` requests
to the backend at `http://localhost:8000` (configurable in `vite.config.js`).

For LAN access from other devices on your Wi-Fi:
```bash
npm run dev -- --host
# or set `server.host: true` in vite.config.js (already enabled in this repo)
```

---

## Environment Variables

`python scripts/setup.py` copies both env templates for you. To do it by
hand: copy each `.env.example` next to it as `.env` and edit.

### Backend (`backend/.env`)

Loaded automatically by `pydantic-settings`.

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql+asyncpg://fuel_user:fuel_pass@db:5432/fuel_management` | Async PostgreSQL connection. Use `db` for Docker-Compose, `localhost` for local dev. |
| `SECRET_KEY` | (placeholder) | JWT signing secret. **Change before production** (min 32 random chars). |
| `ALGORITHM` | `HS256` | JWT signing algorithm. |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` | Access token lifetime. |
| `REFRESH_TOKEN_EXPIRE_DAYS` | `7` | Refresh token lifetime. |
| `COMPANY_NAME` | `AeroFuel Management` | Appears in PDF headers. |
| `UPLOAD_DIR` | `uploads` | Where uploaded invoice files are stored. |

### Frontend (`frontend/.env`)

Loaded by Vite at dev/build time. Any value sent to the browser **must** be
prefixed with `VITE_`. Restart `npm run dev` after editing.

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | `http://localhost:8000/api` | Backend API URL the React app calls directly. Leave empty **only** for production Docker builds where nginx serves the bundle and proxies same-origin `/api` to the backend container. |
| `VITE_APP_NAME` | `AeroFuel` | Branding string. |
| `VITE_APP_TAGLINE` | `Aviation Fuel Management System` | Branding tagline. |
| `VITE_DEBUG_API` | `false` | When `true`, axios logs the resolved API base URL to the console. |

### Generating a secure SECRET_KEY

**Python (any OS):**
```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

**OpenSSL (macOS/Linux):**
```bash
openssl rand -base64 48
```

**PowerShell (Windows):**
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 48 | % {[char]$_})
```

---

## Demo Data

The repo includes a 60-day demo data seeder (8 airports, 17 aircrafts,
6 fuel agents, ~77 purchases, ~250 fillings).

```bash
# From backend folder, with venv activated
python -m app.seed_demo            # idempotent — skips if data exists
python -m app.seed_demo --reset    # wipe demo data and reseed (keeps admin)
```

Inside Docker:
```bash
docker-compose exec backend python -m app.seed_demo
```

---

## Default Login

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@aerofuel.com` | `Admin@123` |
| Operator (after seed) | `rajesh.kumar@aerofuel.com` | `Operator@123` |
| Operator (after seed) | `priya.sharma@aerofuel.com` | `Operator@123` |
| Viewer (after seed) | `viewer@aerofuel.com` | `Viewer@123` |

Change the admin password immediately in production.

---

## Database Access

Connect with any Postgres client (pgAdmin, DBeaver, TablePlus, psql):

```
Host:     localhost
Port:     5432
Database: fuel_management
User:     fuel_user
Password: fuel_pass
```

Connection string:
```
postgresql://fuel_user:fuel_pass@localhost:5432/fuel_management
```

Inside Docker:
```bash
docker exec -it fuel_postgres psql -U fuel_user -d fuel_management
```

### Alembic Migrations

```bash
# Apply all pending migrations
alembic upgrade head

# Generate a new migration after model changes
alembic revision --autogenerate -m "describe change"

# Rollback one step
alembic downgrade -1
```

---

## Project Structure

```
fuel-management/
├── PLAN.md              ← Full architecture, DB schema, API reference
├── README.md            ← This file
├── docker-compose.yml
├── .gitignore
├── backend/             ← FastAPI app (port 8000)
│   ├── app/
│   │   ├── models/      ← SQLAlchemy ORM
│   │   ├── schemas/     ← Pydantic v2
│   │   ├── routers/     ← API route handlers
│   │   ├── services/    ← Stock, PDF, business logic
│   │   ├── utils/       ← JWT auth, pagination, ID generation
│   │   ├── seed_demo.py ← Demo data seeder
│   │   └── main.py
│   ├── alembic/         ← Database migrations
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
└── frontend/            ← React app (port 3000)
    ├── src/
    │   ├── api/         ← Axios API modules
    │   ├── store/       ← Redux Toolkit slices
    │   ├── components/  ← Reusable UI
    │   ├── pages/       ← Page-level views
    │   └── theme/       ← MUI theme
    ├── package.json
    ├── Dockerfile
    └── nginx.conf
```

---

## Features

| Module | Description |
|--------|-------------|
| **Auth** | JWT login/refresh, role-based access (admin/operator/viewer) |
| **Dashboard** | Live stats, ApexCharts visualizations, recent transactions |
| **Fuel Agents** | Manage fuel vendors/suppliers |
| **Airports** | Manage airports and storage capacity |
| **Fuel Purchases** | Purchase entries with auto stock update |
| **Fuel Stock** | Real-time inventory, adjustment, stock logs |
| **Aircrafts** | Aircraft registry |
| **Aircraft Filling** | Fueling operations with auto stock deduction |
| **Reports** | Filterable reports, export to PDF / Excel / CSV |
| **PDF Generation** | Professional PDFs via ReportLab |
| **Audit Logs** | Full change-history tracking |

---

## Troubleshooting

### `npm install` fails with peer-dependency error on `apexcharts`
The repo pins `apexcharts ^4.0.0` and `react-apexcharts ^1.7.0` together
(earlier versions are incompatible). If you see ERESOLVE errors, delete
`node_modules` and `package-lock.json` and reinstall.

### `bcrypt` error: "password cannot be longer than 72 bytes"
`bcrypt 4.1+` is incompatible with `passlib 1.7.4`. The `requirements.txt`
pins `bcrypt==4.0.1` to avoid this. If you bypassed pip resolver, run:
```bash
pip install "bcrypt==4.0.1"
```

### Backend can't connect to database
- If running backend locally with Dockerized Postgres: ensure `DATABASE_URL`
  in `.env` uses `@localhost:5432`, not `@db:5432`.
- If running both in Docker Compose: use `@db:5432`.
- Verify Postgres is accepting connections:
  ```bash
  docker exec fuel_postgres pg_isready -U fuel_user -d fuel_management
  ```

### Port 8000 already in use
On Windows, killing uvicorn sometimes leaves an orphan socket. Either:
- Wait ~30s for Windows to release it, or
- Change the port: `uvicorn app.main:app --port 8001 --reload`
  (also update `frontend/vite.config.js` proxy target accordingly).

### Frontend shows `Network Error` on login
Ensure backend is running and reachable. Open http://localhost:8000/health
in a browser — should return `{"status":"healthy"}`. If yes, check the Vite
proxy target in `frontend/vite.config.js` matches the backend port.

### Dashboard shows all zeros despite seeded data
Hard refresh the browser (Ctrl+Shift+R / Cmd+Shift+R) to bust the cached
JS bundle after frontend changes.

---

## License

MIT
