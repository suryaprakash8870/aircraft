# ✈ AeroFuel Management System

A full-stack Aviation Fuel Management System for tracking fuel purchases,
stock levels, aircraft fueling operations, and generating reports.

> See [PLAN.md](./PLAN.md) for full architecture, database schema, API reference, and implementation status.

---

## Quick Start (Docker)

**Prerequisites:** Docker Desktop installed and running.

```bash
# 1. Clone / open the project folder
cd D:\venki\fuel-management

# 2. Start everything
docker-compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |
| API Docs (Redoc) | http://localhost:8000/redoc |
| PostgreSQL | localhost:5432 |

**Default login:**
- Email: `admin@aerofuel.com`
- Password: `Admin@123`

---

## Local Development (Without Docker)

### Backend

```bash
cd backend

# Create virtual environment
python -m venv .venv

# Activate (Windows PowerShell)
.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Copy env file and update DATABASE_URL to point to your local PostgreSQL
copy .env.example .env

# Run database migrations
alembic upgrade head

# Seed default admin user
python -m app.seed

# Start the API server
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

The dev server runs on http://localhost:3000 and proxies `/api` requests to `localhost:8000`.

---

## Project Structure

```
fuel-management/
├── PLAN.md              ← Architecture, DB schema, API reference
├── README.md            ← This file
├── docker-compose.yml
├── .gitignore
├── backend/             ← FastAPI application (port 8000)
│   ├── app/
│   │   ├── models/      ← SQLAlchemy ORM models
│   │   ├── schemas/     ← Pydantic v2 request/response schemas
│   │   ├── routers/     ← API route handlers
│   │   ├── services/    ← Business logic (stock, PDF, auth)
│   │   └── utils/       ← JWT auth, pagination, ID generation
│   ├── alembic/         ← Database migrations
│   └── requirements.txt
└── frontend/            ← React application (port 3000)
    └── src/
        ├── api/         ← Axios API modules
        ├── store/       ← Redux Toolkit slices
        ├── components/  ← Reusable UI components
        ├── pages/       ← Page-level components
        └── theme/       ← MUI theme configuration
```

---

## Features

| Module | Description |
|--------|-------------|
| **Auth** | JWT login/refresh, role-based access (admin/operator/viewer) |
| **Dashboard** | Live stats, charts (ApexCharts), recent transactions |
| **Fuel Agents** | Manage fuel vendors/suppliers |
| **Airports** | Manage airports and storage capacity |
| **Fuel Purchases** | Purchase entries with auto stock update |
| **Fuel Stock** | Real-time inventory, adjustment, stock logs |
| **Aircrafts** | Aircraft registry |
| **Aircraft Filling** | Fueling operations with auto stock deduction |
| **Reports** | Filterable reports, export to PDF / Excel / CSV |
| **PDF Generation** | Professional PDFs via ReportLab |
| **Audit Logs** | Full change history tracking |

---

## User Roles

| Role | Permissions |
|------|-------------|
| **Admin** | Full access — users, all modules, audit logs |
| **Operator** | Add/edit/delete records, manage stock |
| **Viewer** | Read-only, view reports and dashboards |

---

## Environment Variables

Copy `backend/.env` and update values before deploying:

```env
DATABASE_URL=postgresql+asyncpg://fuel_user:fuel_pass@db:5432/fuel_management
SECRET_KEY=change-this-to-a-secure-random-string-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7
COMPANY_NAME=AeroFuel Management
UPLOAD_DIR=uploads
```

> **Security:** Change `SECRET_KEY` before going to production.

---

## Database

PostgreSQL 16. Migrations managed by Alembic.

```bash
# Apply all migrations
alembic upgrade head

# Create a new migration after model changes
alembic revision --autogenerate -m "description"

# Rollback one step
alembic downgrade -1
```

**Tables:** users · fuel_agents · airports · fuel_purchases · fuel_stocks ·
fuel_stock_logs · aircrafts · aircraft_fillings · audit_logs

---

## PDF Generation

PDFs are generated server-side using ReportLab and streamed directly to the browser.

| Endpoint | PDF Type |
|----------|----------|
| `GET /api/pdf/purchase/{id}` | Fuel purchase invoice |
| `GET /api/pdf/filling/{id}` | Aircraft filling receipt |
| `GET /api/pdf/stock-report` | Stock summary report |
| `GET /api/pdf/analytics` | Analytics report |

---

## Tech Stack

- **Frontend:** React 18 · Vite · Material UI 5 · Redux Toolkit · Axios · ApexCharts
- **Backend:** FastAPI · SQLAlchemy 2 (async) · Pydantic v2 · Alembic · ReportLab
- **Database:** PostgreSQL 16
- **Auth:** JWT (access + refresh tokens, bcrypt password hashing)
- **Container:** Docker + Docker Compose

---

## Contributing

1. Check [PLAN.md](./PLAN.md) for implementation status
2. Follow the existing file structure
3. Backend: async SQLAlchemy 2.0 pattern (`select()`, not `query()`)
4. Frontend: Redux Toolkit with async thunks
5. All API routes use `/api` prefix
