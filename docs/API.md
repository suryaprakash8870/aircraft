# AeroFuel Management — API Reference

Base URL (local dev): **`http://localhost:8000/api`**

Interactive Swagger UI: <http://localhost:8000/docs>
Redoc: <http://localhost:8000/redoc>
OpenAPI JSON: <http://localhost:8000/openapi.json>

> **Authentication:** All endpoints under `/api/*` (except `/api/auth/login` and `/api/auth/refresh`) require a JWT access token in the `Authorization: Bearer <token>` header.

---

## Table of Contents

- [What this API does](#what-this-api-does)
- [Role-based access](#role-based-access)
- [Authentication flow](#authentication-flow)
- [Conventions](#conventions)
- [Use-case quick lookup](#use-case-quick-lookup)
- [Endpoint reference](#endpoint-reference)
  - [Authentication](#authentication)
  - [Users (admin only)](#users-admin-only)
  - [Fuel Agents](#fuel-agents)
  - [Airports](#airports)
  - [Fuel Purchases](#fuel-purchases)
  - [Fuel Stock](#fuel-stock)
  - [Aircrafts](#aircrafts)
  - [Aircraft Filling](#aircraft-filling)
  - [Dashboard](#dashboard)
  - [Reports](#reports)
  - [PDF Generation](#pdf-generation)
  - [Audit Logs (admin only)](#audit-logs-admin-only)
- [Common error responses](#common-error-responses)

---

## What this API does

Backend for an Aviation Fuel Management System. It tracks:

- **Fuel purchases** from vendors (fuel agents) into airport storage tanks
- **Aircraft fueling operations** that draw from those tanks
- **Stock balances** at each airport per fuel type, kept consistent by an
  internal stock service that auto-updates on every purchase / filling /
  adjustment
- **Reports & PDFs** for invoices, fueling receipts, stock reports, and
  per-vendor / per-aircraft analytics
- **Audit logs** of all data modifications, who did them, and when

---

## Role-based access

| Role | Can do |
|------|--------|
| **admin** | Everything: user management, audit logs, all CRUD, all reports |
| **operator** | Add / edit / delete records (agents, airports, purchases, aircrafts, fillings, stock adjustments) — cannot manage users |
| **viewer** | Read-only access to lists, dashboard, reports, PDFs |

The required role for each endpoint is shown in the tables below.

---

## Authentication flow

```
1. POST /api/auth/login         → { access_token, refresh_token, token_type }
                                    Use access_token in Authorization header.
2. GET  /api/auth/me            → { id, email, full_name, role, ... }
                                    Fetch the current user's profile.
3. POST /api/auth/refresh       → { access_token, refresh_token, token_type }
                                    When access_token expires (60 min default),
                                    exchange the refresh_token for a new one.
4. POST /api/auth/logout        → { message }
                                    Logs the logout action; client discards tokens.
```

### Token lifetimes (configurable in `backend/.env`)
| Token | Default | Setting |
|-------|---------|---------|
| Access | 60 minutes | `ACCESS_TOKEN_EXPIRE_MINUTES` |
| Refresh | 7 days | `REFRESH_TOKEN_EXPIRE_DAYS` |

---

## Conventions

### Pagination

List endpoints (GET on collections) support these query params:
| Param | Default | Range | Description |
|-------|---------|-------|-------------|
| `page` | `1` | `>= 1` | 1-based page index |
| `page_size` | `20` | `1–1000` | Items per page |

Pagination response shape:
```json
{
  "items": [ /* records */ ],
  "total": 253,
  "page": 1,
  "page_size": 20,
  "pages": 13
}
```

### Date & datetime formats
- Dates: `YYYY-MM-DD` (e.g. `2026-05-24`)
- Datetimes: ISO 8601 with timezone (e.g. `2026-05-24T08:30:00+00:00`)

### Money / fuel units
- Currency: float, rupees (₹). Formatted client-side.
- Fuel quantity: float, litres (L).

### IDs
- Primary keys: UUID v4 (e.g. `f6fd53a7-cb68-4a54-a12e-f49fbb31ca28`)
- Human-readable codes:
  - Fuel Purchase: `FP-YYYYMMDD-XXXX` (e.g. `FP-20260524-A1B2`)
  - Aircraft Filling: `AF-YYYYMMDD-XXXX` (e.g. `AF-20260524-C3D4`)

---

## Use-case quick lookup

| I want to... | Call |
|--------------|------|
| Log in | `POST /api/auth/login` |
| See total fuel stock across all airports | `GET /api/dashboard/stats` |
| See monthly purchase trends chart | `GET /api/dashboard/charts/monthly-purchase` |
| See monthly fuel consumption chart | `GET /api/dashboard/charts/monthly-consumption` |
| List recent activity on dashboard | `GET /api/dashboard/recent-transactions` |
| Add a new fuel vendor | `POST /api/fuel-agents` |
| Add a new airport | `POST /api/airports` |
| Add a new aircraft | `POST /api/aircrafts` |
| Record a fuel purchase (auto-adds to stock) | `POST /api/fuel-purchases` |
| Attach an invoice PDF/image to a purchase | `POST /api/fuel-purchases/{id}/upload-invoice` |
| Record an aircraft fueling (auto-deducts stock) | `POST /api/aircraft-filling` |
| See stock for one airport | `GET /api/fuel-stock/airport/{id}` |
| Manually adjust stock (correction, wastage, etc.) | `POST /api/fuel-stock/adjustment` |
| See the change history of stock movements | `GET /api/fuel-stock/logs` |
| Get a purchase invoice PDF | `GET /api/pdf/purchase/{id}` |
| Get an aircraft fueling receipt PDF | `GET /api/pdf/filling/{id}` |
| Get a stock report PDF | `GET /api/pdf/stock-report` |
| Get an analytics PDF for a date range | `GET /api/pdf/analytics?start_date=…&end_date=…` |
| Export fuel purchases to Excel/CSV/PDF | `GET /api/reports/export?type=purchases&format=xlsx` |
| Export aircraft fuelings | `GET /api/reports/export?type=consumption&format=xlsx` |
| Filter aircraft history for one tail number | `GET /api/reports/aircraft-history?aircraft_id=…` |
| See per-vendor purchase summary | `GET /api/reports/vendor?agent_id=…` |
| Create a new user (admin) | `POST /api/users` |
| Change a user's password | `PUT /api/users/{id}/password` |
| See who did what & when | `GET /api/audit-logs` |

---

## Endpoint reference

Below, "Role" is the **minimum** required:
- 🌐 = public (no token)
- 👁 = viewer (anyone logged in)
- 🔧 = operator (can write)
- 👑 = admin

---

### Authentication

| Method | Path | Role | Purpose |
|--------|------|------|---------|
| POST | `/api/auth/login` | 🌐 | Trade email + password for `access_token` + `refresh_token` |
| POST | `/api/auth/refresh` | 🌐 | Exchange a valid refresh token for a new access token |
| POST | `/api/auth/logout` | 👁 | Logs the action in `audit_logs`; client should discard tokens |
| GET | `/api/auth/me` | 👁 | Returns the logged-in user's profile |

**Login request body:**
```json
{ "email": "admin@aerofuel.com", "password": "Admin@123" }
```

**Login response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiI...",
  "refresh_token": "eyJhbGciOiJIUzI1NiI...",
  "token_type": "bearer"
}
```

**Refresh request:** `{ "refresh_token": "..." }`

---

### Users (admin only)

Manage system users (admins, operators, viewers).

| Method | Path | Role | Purpose |
|--------|------|------|---------|
| GET | `/api/users` | 👑 | Paginated user list — supports `?search=` and `?role=` |
| POST | `/api/users` | 👑 | Create a new user with email, password, role |
| GET | `/api/users/{user_id}` | 👑 | Get a user by ID |
| PUT | `/api/users/{user_id}` | 👑 | Update name / email / role / `is_active` |
| DELETE | `/api/users/{user_id}` | 👑 | Soft-delete (sets `is_active=false`) |
| PUT | `/api/users/{user_id}/password` | 👑 | Reset a user's password |

**Create user body:**
```json
{
  "email": "newuser@aerofuel.com",
  "username": "newuser",
  "password": "StrongPass@123",
  "full_name": "New User",
  "role": "operator"
}
```

---

### Fuel Agents

The companies / vendors that sell aviation fuel to your operation.

| Method | Path | Role | Purpose |
|--------|------|------|---------|
| GET | `/api/fuel-agents` | 👁 | List agents — `?search=&status=active|inactive&page=&page_size=` |
| POST | `/api/fuel-agents` | 🔧 | Add a new vendor with company info + GST |
| GET | `/api/fuel-agents/{agent_id}` | 👁 | Get one agent |
| PUT | `/api/fuel-agents/{agent_id}` | 🔧 | Update vendor details |
| DELETE | `/api/fuel-agents/{agent_id}` | 🔧 | Delete vendor (blocked if linked to active purchases) |

**Create body:**
```json
{
  "agent_name": "Indian Oil Aviation",
  "company_name": "Indian Oil Corporation Ltd",
  "contact_person": "Anil Mehta",
  "phone": "+91-22-26447000",
  "email": "aviation@indianoil.in",
  "address": "IndianOil Bhavan, Mumbai",
  "gst_number": "27AAACI1681G1ZQ",
  "status": "active"
}
```

---

### Airports

Airports where you store fuel and refuel aircraft.

| Method | Path | Role | Purpose |
|--------|------|------|---------|
| GET | `/api/airports` | 👁 | List airports with `current_stock` summary per record |
| POST | `/api/airports` | 🔧 | Register a new airport (sets storage capacity) |
| GET | `/api/airports/{airport_id}` | 👁 | Get one airport |
| PUT | `/api/airports/{airport_id}` | 🔧 | Update name / city / country / capacity |
| DELETE | `/api/airports/{airport_id}` | 🔧 | Delete airport (blocked if it has stock or purchases) |

**Create body:**
```json
{
  "airport_name": "Indira Gandhi International Airport",
  "airport_code": "DEL",
  "city": "New Delhi",
  "country": "India",
  "fuel_storage_capacity": 5000000.0
}
```

---

### Fuel Purchases

Each record is one delivery from a vendor into an airport's tank.
**Creating a purchase automatically increases the stock at that airport.**

| Method | Path | Role | Purpose |
|--------|------|------|---------|
| GET | `/api/fuel-purchases` | 👁 | List purchases — supports filters: `airport_id`, `agent_id`, `start_date`, `end_date`, `payment_status`, `fuel_type` |
| POST | `/api/fuel-purchases` | 🔧 | Record a new purchase; auto-generates `purchase_id` (`FP-YYYYMMDD-XXXX`), computes `total_amount`, **adds to stock** |
| GET | `/api/fuel-purchases/{purchase_id}` | 👁 | Get one purchase with nested `fuel_agent` and `airport` objects |
| PUT | `/api/fuel-purchases/{purchase_id}` | 🔧 | Update fields; if airport / fuel_type / quantity changed, **rebalances stock atomically** |
| DELETE | `/api/fuel-purchases/{purchase_id}` | 🔧 | Delete and **reverse the stock addition** (deletes attached invoice file too) |
| POST | `/api/fuel-purchases/{purchase_id}/upload-invoice` | 🔧 | Attach a PDF/JPG/PNG invoice (max 10 MB); replaces any previous one |

**Create body:**
```json
{
  "fuel_agent_id": "f6fd…",
  "airport_id": "f80f…",
  "fuel_type": "ATF",
  "quantity_purchased": 125000.0,
  "purchase_rate": 98.5,
  "purchase_date": "2026-05-24",
  "invoice_number": "INV-20260524-1234",
  "payment_status": "paid",
  "remarks": "Bulk monthly order"
}
```
`total_amount` is computed server-side as `quantity × rate`.
`payment_status` ∈ `paid | pending | partial`.

---

### Fuel Stock

Real-time stock levels per airport + fuel type, plus the audit-style log
of every increase/decrease.

| Method | Path | Role | Purpose |
|--------|------|------|---------|
| GET | `/api/fuel-stock` | 👁 | Current stock for every airport × fuel type |
| GET | `/api/fuel-stock/airport/{airport_id}` | 👁 | Just the stock rows for one airport |
| POST | `/api/fuel-stock/adjustment` | 🔧 | **Manual** stock change — corrections, wastage, evaporation, initial balance. Records a `fuel_stock_logs` entry. |
| GET | `/api/fuel-stock/logs` | 👁 | History of every stock change. Filters: `airport_id`, `fuel_type`, `transaction_type`, `start_date`, `end_date` |

**Adjustment body:**
```json
{
  "airport_id": "f80f…",
  "fuel_type": "ATF",
  "quantity": -250.0,
  "notes": "Wastage during transfer"
}
```
`quantity` can be **positive** (add) or **negative** (remove). The stock
service won't let it go below zero.

`transaction_type` values in logs: `purchase`, `filling`, `adjustment`.

---

### Aircrafts

The aircraft you refuel.

| Method | Path | Role | Purpose |
|--------|------|------|---------|
| GET | `/api/aircrafts` | 👁 | List — `?search=` matches tail number / model / airline |
| POST | `/api/aircrafts` | 🔧 | Register a new aircraft with capacity |
| GET | `/api/aircrafts/{aircraft_id}` | 👁 | Get one aircraft |
| PUT | `/api/aircrafts/{aircraft_id}` | 🔧 | Update |
| DELETE | `/api/aircrafts/{aircraft_id}` | 🔧 | Delete (blocked if it has fueling records) |

**Create body:**
```json
{
  "aircraft_number": "VT-ANA",
  "aircraft_model": "Boeing 777-300ER",
  "airline_name": "Air India",
  "fuel_capacity": 181283.0,
  "status": "active"
}
```

---

### Aircraft Filling

Each record is one fueling operation pumping fuel **out** of an airport
tank **into** an aircraft.
**Creating a filling automatically deducts from the stock at that airport.**

| Method | Path | Role | Purpose |
|--------|------|------|---------|
| GET | `/api/aircraft-filling` | 👁 | List — filters: `aircraft_id`, `airport_id`, `start_date`, `end_date` |
| POST | `/api/aircraft-filling` | 🔧 | Record a fueling; auto-generates `filling_id` (`AF-YYYYMMDD-XXXX`), computes `total_cost`, **deducts stock**. Returns 400 if insufficient stock. |
| GET | `/api/aircraft-filling/{filling_id}` | 👁 | Get one with nested aircraft + airport |
| PUT | `/api/aircraft-filling/{filling_id}` | 🔧 | Update; rebalances stock if quantity/airport/fuel-type changed |
| DELETE | `/api/aircraft-filling/{filling_id}` | 🔧 | Delete and **restore the stock** |

**Create body:**
```json
{
  "aircraft_id": "ac01…",
  "airport_id": "f6fd…",
  "fuel_type": "ATF",
  "quantity_filled": 45000.0,
  "fuel_rate": 99.5,
  "filling_datetime": "2026-05-24T14:30:00Z",
  "flight_number": "AI142",
  "remarks": "Pre-departure refueling"
}
```

---

### Dashboard

Aggregated read-only data for the home page.

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/dashboard/stats` | Top-of-page KPIs: `total_stock`, `monthly_purchased`, `monthly_consumed`, `total_aircraft_fueled` + per-airport stock summary |
| GET | `/api/dashboard/charts/monthly-purchase` | 12-month rolling purchase trend: `[{month, quantity, amount}, …]` |
| GET | `/api/dashboard/charts/monthly-consumption` | 12-month rolling consumption trend: `[{month, quantity}, …]` |
| GET | `/api/dashboard/charts/vendor-analytics` | Per-vendor totals: `[{agent_name, total_quantity, total_amount}, …]` |
| GET | `/api/dashboard/charts/airport-usage` | Per-airport stock + consumed: `[{airport_code, airport_name, stock, consumed}, …]` |
| GET | `/api/dashboard/recent-transactions` | Last 10 mixed activity events (purchases + fillings) for the activity feed |

All require any logged-in role (👁).

---

### Reports

Detailed filterable reports for the Reports page and exports.

| Method | Path | Required filters | Purpose |
|--------|------|------------------|---------|
| GET | `/api/reports/fuel-purchases` | — | All purchase rows for date range / airport / agent / etc. Returns `{ data: [...], total }` |
| GET | `/api/reports/fuel-consumption` | — | All filling rows; filters: `aircraft_id`, `airport_id`, dates |
| GET | `/api/reports/airport-stock` | — | Current stock per airport × fuel type; filter: `airport_id` |
| GET | `/api/reports/aircraft-history` | **`aircraft_id`** | Per-aircraft fueling history with summary totals |
| GET | `/api/reports/vendor` | **`agent_id`** | Per-vendor purchase history with summary totals |
| GET | `/api/reports/export` | `type`, `format` | Download a report as a file — see below |

#### `GET /api/reports/export` parameters

| Param | Allowed values | Description |
|-------|---------------|-------------|
| `type` | `purchases`, `consumption`, `airport_stock`, `aircraft_history`, `vendor` | Which report |
| `format` | `xlsx`, `csv`, `pdf` | Output format |
| `start_date`, `end_date` | ISO date | Date range filter |
| `airport_id` | UUID | Filter by airport |
| `agent_id` | UUID | (vendor / purchases) |
| `aircraft_id` | UUID | (consumption / aircraft_history — **required** for aircraft_history) |

Response is a binary file with appropriate `Content-Type` and a
`Content-Disposition: attachment; filename=...` header.

---

### PDF Generation

Single-document branded PDFs (separate from `reports/export`).

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/pdf/purchase/{purchase_id}` | A4 invoice-style PDF for one fuel purchase |
| GET | `/api/pdf/filling/{filling_id}` | A4 receipt-style PDF for one aircraft fueling |
| GET | `/api/pdf/stock-report?airport_id=` | Stock summary PDF (optionally for one airport) |
| GET | `/api/pdf/analytics?start_date=&end_date=` | Date-ranged analytics PDF |

All return a streaming `application/pdf` response. Any logged-in role can
download (audit logs capture who did it).

---

### Audit Logs (admin only)

Every create / update / delete (and login / logout) is recorded.

| Method | Path | Role | Purpose |
|--------|------|------|---------|
| GET | `/api/audit-logs` | 👑 | List audit entries; filters: `user_id`, `action`, `entity_type`, `start_date`, `end_date`. Paginated. |

`action` values: `login`, `logout`, `create`, `update`, `delete`.

Each entry stores `old_values` and `new_values` as JSON so you can see
exactly what changed.

---

## Common error responses

All error responses use this shape:
```json
{ "detail": "Human-readable error message" }
```
Validation errors (422) return an array of issues instead:
```json
{ "detail": [ { "type": "...", "loc": [...], "msg": "...", "input": "..." } ] }
```

| Status | When |
|--------|------|
| `400` | Bad input — e.g. insufficient stock for filling, invalid file type, missing required filter |
| `401` | Missing or invalid `Authorization` header — log in or refresh token |
| `403` | Logged in but role too low (e.g. viewer trying to POST) |
| `404` | Resource doesn't exist — agent / airport / aircraft / purchase / filling / user with that ID |
| `409` | Conflict — duplicate email, username, airport code, aircraft number |
| `422` | Validation error — schema mismatch, wrong field type, out-of-range value |
| `500` | Backend bug — check uvicorn logs |

---

## Example workflow

```bash
# 1. Log in
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@aerofuel.com","password":"Admin@123"}' \
  | python -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

# 2. Pick an airport and agent
AIRPORT=$(curl -s "http://localhost:8000/api/airports?page=1&page_size=1" \
  -H "Authorization: Bearer $TOKEN" \
  | python -c "import sys,json; print(json.load(sys.stdin)['items'][0]['id'])")

AGENT=$(curl -s "http://localhost:8000/api/fuel-agents?page=1&page_size=1" \
  -H "Authorization: Bearer $TOKEN" \
  | python -c "import sys,json; print(json.load(sys.stdin)['items'][0]['id'])")

# 3. Record a fuel purchase
curl -X POST http://localhost:8000/api/fuel-purchases \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"fuel_agent_id\": \"$AGENT\",
    \"airport_id\": \"$AIRPORT\",
    \"fuel_type\": \"ATF\",
    \"quantity_purchased\": 50000,
    \"purchase_rate\": 98.5,
    \"purchase_date\": \"2026-05-24\",
    \"invoice_number\": \"INV-001\",
    \"payment_status\": \"paid\"
  }"

# 4. Download the invoice PDF for that purchase
PURCHASE_ID=...  # from step 3 response
curl -OJ -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/api/pdf/purchase/$PURCHASE_ID"

# 5. Verify stock went up
curl -s "http://localhost:8000/api/fuel-stock/airport/$AIRPORT" \
  -H "Authorization: Bearer $TOKEN"
```

---

## See also

- [PLAN.md](../PLAN.md) — architecture, database schema, implementation status
- [README.md](../README.md) — setup, environment variables, troubleshooting
- Live Swagger UI: <http://localhost:8000/docs>
