# Fuel Management System — Project Plan

## Overview
Aviation Fuel Management System to track fuel purchases, stock, aircraft fueling operations,
and generate reports/PDFs. Built as a full-stack web application.

---

## Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React + Vite | 18 / 5 |
| UI Library | Material UI (MUI) | 5 |
| State Management | Redux Toolkit | 2 |
| HTTP Client | Axios | 1.7 |
| Charts | ApexCharts | 3.49 |
| Forms | React Hook Form | 7 |
| Backend | FastAPI | 0.111 |
| ORM | SQLAlchemy (async) | 2.0 |
| Validation | Pydantic | v2 |
| Migrations | Alembic | 1.13 |
| Auth | JWT (python-jose + passlib) | — |
| PDF | ReportLab | 4.2 |
| Excel Export | openpyxl | 3.1 |
| Database | PostgreSQL | 16 |
| Container | Docker + Docker Compose | — |

---

## Project Structure

```
fuel-management/
├── PLAN.md                        ← This file
├── README.md                      ← Setup & running guide
├── docker-compose.yml             ← Orchestrates db + backend + frontend
├── .gitignore
│
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── .env                       ← Environment variables (not committed)
│   ├── alembic.ini
│   ├── alembic/
│   │   ├── env.py
│   │   └── versions/              ← Auto-generated migration files
│   └── app/
│       ├── main.py                ← FastAPI app, CORS, router registration
│       ├── config.py              ← Settings via pydantic-settings
│       ├── database.py            ← Async engine, session, Base
│       ├── seed.py                ← Creates default admin user
│       ├── models/
│       │   ├── __init__.py
│       │   ├── user.py
│       │   ├── fuel_agent.py
│       │   ├── airport.py
│       │   ├── fuel_purchase.py
│       │   ├── fuel_stock.py      ← FuelStock + FuelStockLog
│       │   ├── aircraft.py
│       │   ├── aircraft_filling.py
│       │   └── audit_log.py
│       ├── schemas/
│       │   ├── auth.py
│       │   ├── user.py
│       │   ├── fuel_agent.py
│       │   ├── airport.py
│       │   ├── fuel_purchase.py
│       │   ├── fuel_stock.py
│       │   ├── aircraft.py
│       │   ├── aircraft_filling.py
│       │   ├── dashboard.py
│       │   └── common.py          ← PaginatedResponse[T], MessageResponse
│       ├── routers/
│       │   ├── auth.py
│       │   ├── users.py
│       │   ├── fuel_agents.py
│       │   ├── airports.py
│       │   ├── fuel_purchases.py
│       │   ├── fuel_stock.py
│       │   ├── aircrafts.py
│       │   ├── aircraft_filling.py
│       │   ├── dashboard.py
│       │   ├── reports.py
│       │   ├── pdf.py
│       │   └── audit_logs.py
│       ├── services/
│       │   ├── stock_service.py   ← Stock update/deduct logic
│       │   ├── pdf_service.py     ← ReportLab PDF generators
│       │   └── auth_service.py    ← Login, token creation
│       └── utils/
│           ├── auth.py            ← JWT helpers, FastAPI dependencies
│           ├── pagination.py      ← Paginate helper, PaginationParams
│           ├── id_generator.py    ← FP-YYYYMMDD-XXXX, AF-YYYYMMDD-XXXX
│           └── audit.py          ← log_action() helper
│
└── frontend/
    ├── Dockerfile                 ← Multi-stage: Vite build → Nginx serve
    ├── nginx.conf                 ← SPA routing + /api proxy
    ├── index.html
    ├── vite.config.js             ← Dev proxy: /api → localhost:8000
    ├── package.json
    └── src/
        ├── main.jsx               ← React root, Redux Provider, Router
        ├── App.jsx                ← All routes, ProtectedRoute, AdminRoute
        ├── theme/
        │   └── index.js           ← MUI theme (blue/orange, Inter font)
        ├── api/
        │   ├── axios.js           ← Instance, auth interceptors, refresh logic
        │   ├── authApi.js
        │   ├── fuelAgentsApi.js
        │   ├── airportsApi.js
        │   ├── fuelPurchasesApi.js
        │   ├── fuelStockApi.js
        │   ├── aircraftsApi.js
        │   ├── aircraftFillingApi.js
        │   ├── dashboardApi.js
        │   ├── reportsApi.js
        │   ├── usersApi.js
        │   └── auditLogsApi.js
        ├── store/
        │   ├── index.js
        │   └── slices/
        │       ├── authSlice.js
        │       ├── fuelAgentsSlice.js
        │       ├── airportsSlice.js
        │       ├── fuelPurchasesSlice.js
        │       ├── fuelStockSlice.js
        │       ├── aircraftsSlice.js
        │       ├── aircraftFillingSlice.js
        │       ├── dashboardSlice.js
        │       └── uiSlice.js
        ├── components/
        │   ├── layout/
        │   │   └── Layout.jsx     ← AppBar + Sidebar + content
        │   ├── common/
        │   │   ├── DataTable.jsx  ← Reusable paginated table with search
        │   │   ├── StatCard.jsx   ← Dashboard stat card
        │   │   ├── PageHeader.jsx ← Title + action button
        │   │   ├── ConfirmDialog.jsx
        │   │   ├── SnackbarAlert.jsx
        │   │   └── LoadingScreen.jsx
        │   └── charts/
        │       ├── LineChart.jsx
        │       ├── BarChart.jsx
        │       └── PieChart.jsx
        ├── pages/
        │   ├── auth/
        │   │   └── LoginPage.jsx
        │   ├── dashboard/
        │   │   └── DashboardPage.jsx
        │   ├── fuel-agents/
        │   │   ├── FuelAgentsPage.jsx
        │   │   └── FuelAgentFormPage.jsx
        │   ├── airports/
        │   │   ├── AirportsPage.jsx
        │   │   └── AirportFormPage.jsx
        │   ├── fuel-purchases/
        │   │   ├── FuelPurchasesPage.jsx
        │   │   ├── FuelPurchaseFormPage.jsx
        │   │   └── FuelPurchaseDetailPage.jsx
        │   ├── fuel-stock/
        │   │   └── FuelStockPage.jsx
        │   ├── aircrafts/
        │   │   ├── AircraftsPage.jsx
        │   │   └── AircraftFormPage.jsx
        │   ├── aircraft-filling/
        │   │   ├── AircraftFillingPage.jsx
        │   │   ├── AircraftFillingFormPage.jsx
        │   │   └── AircraftFillingDetailPage.jsx
        │   ├── reports/
        │   │   └── ReportsPage.jsx
        │   ├── users/
        │   │   ├── UsersPage.jsx
        │   │   └── UserFormPage.jsx
        │   └── audit-logs/
        │       └── AuditLogsPage.jsx
        └── utils/
            └── helpers.js
```

---

## Database Schema

### `users`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| email | VARCHAR(255) | UNIQUE |
| username | VARCHAR(100) | UNIQUE |
| hashed_password | VARCHAR(255) | bcrypt |
| full_name | VARCHAR(255) | |
| role | VARCHAR(20) | admin / operator / viewer |
| is_active | BOOLEAN | default true |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

### `fuel_agents`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| agent_name | VARCHAR(255) | |
| company_name | VARCHAR(255) | |
| contact_person | VARCHAR(255) | |
| phone | VARCHAR(20) | |
| email | VARCHAR(255) | |
| address | TEXT | |
| gst_number | VARCHAR(50) | |
| status | VARCHAR(20) | active / inactive |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

### `airports`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| airport_name | VARCHAR(255) | |
| airport_code | VARCHAR(10) | UNIQUE |
| city | VARCHAR(100) | |
| country | VARCHAR(100) | |
| fuel_storage_capacity | FLOAT | litres |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

### `fuel_purchases`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| purchase_id | VARCHAR(50) | UNIQUE e.g. FP-20260523-A1B2 |
| fuel_agent_id | UUID | FK fuel_agents |
| airport_id | UUID | FK airports |
| fuel_type | VARCHAR(50) | ATF / AVGAS / JET-A1 |
| quantity_purchased | FLOAT | litres |
| purchase_rate | FLOAT | per litre |
| total_amount | FLOAT | quantity × rate |
| purchase_date | DATE | |
| invoice_number | VARCHAR(100) | |
| payment_status | VARCHAR(20) | paid / pending / partial |
| invoice_document | VARCHAR(500) | file path |
| remarks | TEXT | |
| created_by | UUID | FK users |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

### `fuel_stocks`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| airport_id | UUID | FK airports |
| fuel_type | VARCHAR(50) | |
| current_stock | FLOAT | litres |
| last_updated | TIMESTAMPTZ | |

### `fuel_stock_logs`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| airport_id | UUID | FK airports |
| fuel_type | VARCHAR(50) | |
| transaction_type | VARCHAR(20) | purchase / filling / adjustment |
| quantity | FLOAT | +in / -out |
| reference_id | UUID | FK purchase or filling |
| reference_type | VARCHAR(50) | |
| notes | TEXT | |
| created_by | UUID | FK users |
| created_at | TIMESTAMPTZ | |

### `aircrafts`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| aircraft_number | VARCHAR(50) | UNIQUE (tail number) |
| aircraft_model | VARCHAR(100) | |
| airline_name | VARCHAR(255) | |
| fuel_capacity | FLOAT | litres |
| status | VARCHAR(20) | active / inactive |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

### `aircraft_fillings`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| filling_id | VARCHAR(50) | UNIQUE e.g. AF-20260523-C3D4 |
| aircraft_id | UUID | FK aircrafts |
| airport_id | UUID | FK airports |
| quantity_filled | FLOAT | litres |
| fuel_rate | FLOAT | per litre |
| total_cost | FLOAT | quantity × rate |
| filled_by | UUID | FK users |
| filling_datetime | TIMESTAMPTZ | |
| flight_number | VARCHAR(50) | |
| remarks | TEXT | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

### `audit_logs`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| user_id | UUID | FK users |
| action | VARCHAR(50) | login / create / update / delete |
| entity_type | VARCHAR(100) | table name |
| entity_id | VARCHAR(255) | |
| old_values | JSON | |
| new_values | JSON | |
| ip_address | VARCHAR(50) | |
| created_at | TIMESTAMPTZ | |

---

## API Endpoints

### Auth — `/api/auth`
| Method | Path | Access | Description |
|--------|------|--------|-------------|
| POST | `/login` | Public | Login, returns access + refresh tokens |
| POST | `/refresh` | Public | Exchange refresh token for new access token |
| POST | `/logout` | Auth | Log logout action |
| GET | `/me` | Auth | Get current user profile |

### Users — `/api/users` *(Admin only)*
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List users (paginated) |
| POST | `/` | Create user |
| GET | `/{id}` | Get user by ID |
| PUT | `/{id}` | Update user |
| DELETE | `/{id}` | Deactivate user |
| PUT | `/{id}/password` | Change password |

### Fuel Agents — `/api/fuel-agents`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List (paginated, search, status filter) |
| POST | `/` | Create agent |
| GET | `/{id}` | Get agent |
| PUT | `/{id}` | Update agent |
| DELETE | `/{id}` | Delete agent |

### Airports — `/api/airports`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List airports with current stock |
| POST | `/` | Create airport |
| GET | `/{id}` | Get airport |
| PUT | `/{id}` | Update airport |
| DELETE | `/{id}` | Delete airport |

### Fuel Purchases — `/api/fuel-purchases`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List (date range, airport, agent, status filters) |
| POST | `/` | Create purchase → auto-updates stock |
| GET | `/{id}` | Get purchase with nested agent/airport |
| PUT | `/{id}` | Update → recalculates stock delta |
| DELETE | `/{id}` | Delete → reverses stock |
| POST | `/{id}/upload-invoice` | Upload invoice file |

### Fuel Stock — `/api/fuel-stock`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | All airport stocks |
| GET | `/airport/{airport_id}` | Stock for one airport |
| POST | `/adjustment` | Manual adjustment |
| GET | `/logs` | Stock movement logs |

### Aircrafts — `/api/aircrafts`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List (search, status filter) |
| POST | `/` | Create |
| GET | `/{id}` | Get |
| PUT | `/{id}` | Update |
| DELETE | `/{id}` | Delete |

### Aircraft Filling — `/api/aircraft-filling`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List (aircraft, airport, date filters) |
| POST | `/` | Create → auto-deducts stock |
| GET | `/{id}` | Get filling with nested details |
| PUT | `/{id}` | Update |
| DELETE | `/{id}` | Delete → reverses stock |

### Dashboard — `/api/dashboard`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/stats` | Totals: stock, monthly purchased/consumed, fueled count |
| GET | `/charts/monthly-purchase` | 12-month purchase trend |
| GET | `/charts/monthly-consumption` | 12-month consumption trend |
| GET | `/charts/vendor-analytics` | Per-agent totals |
| GET | `/charts/airport-usage` | Per-airport stock vs consumed |
| GET | `/recent-transactions` | Last 10 purchases + fillings |

### Reports — `/api/reports`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/fuel-purchases` | Purchase report with filters |
| GET | `/fuel-consumption` | Consumption report |
| GET | `/airport-stock` | Airport stock summary |
| GET | `/aircraft-history` | Aircraft fuel history |
| GET | `/vendor` | Vendor summary report |
| GET | `/export` | Download Excel/CSV (`?type=&format=xlsx`) |

### PDF — `/api/pdf`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/purchase/{id}` | Fuel purchase invoice PDF |
| GET | `/filling/{id}` | Aircraft filling receipt PDF |
| GET | `/stock-report` | Stock report PDF |
| GET | `/analytics` | Analytics report PDF |

### Audit Logs — `/api/audit-logs` *(Admin only)*
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List logs (user, action, date filters) |

---

## Business Logic Rules

### Stock Management
```
current_stock += quantity_purchased    (on purchase create)
current_stock -= quantity_purchased    (on purchase delete)
current_stock -= quantity_filled       (on aircraft filling create)
current_stock += quantity_filled       (on aircraft filling delete)
current_stock += adjustment_quantity   (manual, positive or negative)
```
- Filling is **blocked** if `quantity_filled > current_stock`
- Every stock change creates a `fuel_stock_logs` record

### Auto-generated IDs
- Purchase: `FP-YYYYMMDD-XXXX` (4 random alphanumeric chars)
- Filling: `AF-YYYYMMDD-XXXX`

### Computed Fields (calculated before save)
- `total_amount = quantity_purchased × purchase_rate`
- `total_cost = quantity_filled × fuel_rate`

---

## Role Permissions

| Feature | Admin | Operator | Viewer |
|---------|-------|----------|--------|
| Login / View Dashboard | ✓ | ✓ | ✓ |
| View all modules | ✓ | ✓ | ✓ |
| Add / Edit / Delete records | ✓ | ✓ | ✗ |
| Manage Users | ✓ | ✗ | ✗ |
| View Audit Logs | ✓ | ✗ | ✗ |
| Generate Reports / PDFs | ✓ | ✓ | ✓ |

---

## Implementation Status

### Backend
- [x] Project structure & directories
- [x] `config.py` — pydantic-settings
- [x] `database.py` — async SQLAlchemy engine
- [x] `models/user.py`
- [x] `models/fuel_agent.py`
- [x] `models/airport.py`
- [x] `models/fuel_purchase.py`
- [x] `models/fuel_stock.py`
- [x] `models/aircraft.py`
- [x] `models/aircraft_filling.py`
- [x] `models/audit_log.py`
- [x] `schemas/` — all Pydantic v2 schemas (auth, user, fuel_agent, airport, fuel_purchase, fuel_stock, aircraft, aircraft_filling, dashboard, audit_log, common)
- [x] `utils/auth.py` — JWT helpers + dependencies
- [x] `utils/pagination.py`
- [x] `utils/id_generator.py`
- [x] `utils/audit.py`
- [x] `routers/auth.py`
- [x] `routers/users.py`
- [x] `routers/fuel_agents.py`
- [x] `routers/airports.py`
- [x] `routers/fuel_purchases.py`
- [x] `routers/fuel_stock.py`
- [x] `routers/aircrafts.py`
- [x] `routers/aircraft_filling.py`
- [x] `routers/dashboard.py`
- [x] `routers/reports.py`
- [x] `routers/pdf.py`
- [x] `routers/audit_logs.py`
- [x] `services/stock_service.py`
- [x] `services/pdf_service.py`
- [x] `main.py` — lifespan creates tables + default admin on startup
- [x] `seed.py` — standalone seed script (also runs via main.py lifespan)
- [x] `alembic/env.py`
- [x] `alembic.ini`
- [x] `Dockerfile`
- [x] `requirements.txt`

### Frontend
- [x] Project structure & directories
- [x] `package.json`
- [x] `vite.config.js`
- [x] `index.html`
- [x] `src/theme/index.js`
- [x] `src/api/` — 12 API modules (axios instance with refresh logic + all domain APIs)
- [x] `src/store/` — Redux store + 11 slices (auth, fuelAgents, airports, fuelPurchases, fuelStock, aircrafts, aircraftFilling, dashboard, ui, users, auditLogs)
- [x] `src/utils/helpers.js`
- [x] `src/components/layout/Layout.jsx` — sidebar + AppBar, role-based nav, responsive
- [x] `src/components/common/` — DataTable, StatCard, ConfirmDialog, PageHeader, SnackbarAlert, LoadingScreen
- [x] `src/components/charts/` — LineChart, BarChart, PieChart (ApexCharts)
- [x] `src/pages/auth/LoginPage.jsx`
- [x] `src/pages/dashboard/DashboardPage.jsx`
- [x] `src/pages/fuel-agents/` — FuelAgentsPage, FuelAgentFormPage
- [x] `src/pages/airports/` — AirportsPage, AirportFormPage
- [x] `src/pages/fuel-purchases/` — FuelPurchasesPage, FuelPurchaseFormPage, FuelPurchaseDetailPage
- [x] `src/pages/fuel-stock/` — FuelStockPage (tabs: stock cards + logs + adjustment)
- [x] `src/pages/aircrafts/` — AircraftsPage, AircraftFormPage
- [x] `src/pages/aircraft-filling/` — AircraftFillingPage, AircraftFillingFormPage, AircraftFillingDetailPage
- [x] `src/pages/reports/` — ReportsPage (5 tabs with filters + export)
- [x] `src/pages/users/` — UsersPage, UserFormPage (admin only)
- [x] `src/pages/audit-logs/` — AuditLogsPage (admin only)
- [x] `src/main.jsx`
- [x] `src/App.jsx` — all 22 routes, ProtectedRoute, AdminRoute
- [x] `Dockerfile`
- [x] `nginx.conf`

### Infrastructure
- [x] `docker-compose.yml`
- [x] `.gitignore`
- [x] `frontend/Dockerfile`
- [x] `frontend/nginx.conf`

---

## Verification (2026-05-23)

| Check | Result |
|-------|--------|
| Backend Python syntax (`compileall`) | ✅ All 53 files compile |
| Backend imports (full app + all routers) | ✅ FastAPI loads, **63 routes** registered |
| Backend models registered in SQLAlchemy | ✅ **9 tables**: users, fuel_agents, airports, fuel_purchases, fuel_stocks, fuel_stock_logs, aircrafts, aircraft_fillings, audit_logs |
| Frontend `npm install` | ✅ Clean (after dep-pinning fix) |
| Frontend `npm run build` | ✅ 1410 modules transformed, build in ~6s, no errors |
| Docker Compose config validation | ✅ Valid (warning about obsolete `version:` removed) |

### Issues Found and Fixed During Verification
1. **react-apexcharts ↔ apexcharts version mismatch** — `react-apexcharts@^1.4.0` resolved to 1.9.x which requires `apexcharts >= 4.0.0`, but package.json pinned `apexcharts ^3.49.2`. Fixed by upgrading both to compatible versions: `apexcharts ^4.0.0`, `react-apexcharts ^1.7.0`.
2. **Duplicate `bgcolor` key in `ConfirmDialog.jsx`** — esbuild warning. Removed the duplicate.
3. **Obsolete `version: "3.9"` in docker-compose.yml** — removed to silence Docker Compose v2 warning.
4. **Redundant `python -m app.seed` in docker-compose command** — removed; `main.py` lifespan already seeds the admin user on startup.
5. **Missing `app/seed.py`** — added as standalone script (still optional since lifespan handles it).

---

## Development Workflow

### Run with Docker (Recommended)
```bash
docker-compose up --build
```
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- DB: localhost:5432

### Run Locally (Dev)

**Backend:**
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
alembic upgrade head
python -m app.seed
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## Default Credentials
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@aerofuel.com | Admin@123 |

> Change this password immediately after first login in production.

---

## Environment Variables

### Backend (`.env`)
| Variable | Default | Description |
|----------|---------|-------------|
| DATABASE_URL | postgresql+asyncpg://... | PostgreSQL connection string |
| SECRET_KEY | (change this!) | JWT signing secret (min 32 chars) |
| ALGORITHM | HS256 | JWT algorithm |
| ACCESS_TOKEN_EXPIRE_MINUTES | 60 | Access token TTL |
| REFRESH_TOKEN_EXPIRE_DAYS | 7 | Refresh token TTL |
| COMPANY_NAME | AeroFuel Management | Appears in PDFs |
| UPLOAD_DIR | uploads | Invoice file upload directory |
