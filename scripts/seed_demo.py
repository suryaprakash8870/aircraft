"""
Standalone demo data seeder for AeroFuel Management System.

Self-contained: defines its own DB models inline, connects with any
PostgreSQL URL, and seeds ~60 days of realistic fuel purchase / aircraft
filling activity. Does NOT depend on importing the FastAPI app.

Usage (any of these work):

    # Use DATABASE_URL from environment (or backend/.env)
    python scripts/seed_demo.py

    # Pass the connection string explicitly
    python scripts/seed_demo.py --db-url postgresql://fuel_user:fuel_pass@localhost:5432/fuel_management

    # Wipe existing demo data, then reseed
    python scripts/seed_demo.py --reset

Prerequisites:
    pip install sqlalchemy psycopg2-binary bcrypt python-dotenv

Notes:
    * Accepts either async (postgresql+asyncpg://...) or sync URLs; the
      script always uses the sync psycopg2 driver internally for simplicity.
    * Always preserves the default admin user (admin@aerofuel.com) on --reset.
"""
from __future__ import annotations

import argparse
import os
import random
import sys
import uuid
from datetime import date, datetime, time, timedelta, timezone
from pathlib import Path

# --- 3rd-party imports ------------------------------------------------------
try:
    import bcrypt
    from sqlalchemy import (
        Boolean,
        Column,
        Date,
        DateTime,
        Float,
        ForeignKey,
        String,
        Text,
        create_engine,
        delete,
        func,
        select,
    )
    from sqlalchemy.dialects.postgresql import UUID
    from sqlalchemy.orm import Session, declarative_base, relationship
except ImportError as e:
    print(f"Missing dependency: {e}")
    print("Install with: pip install sqlalchemy psycopg2-binary bcrypt python-dotenv")
    sys.exit(2)

# --- Reproducible randomness ------------------------------------------------
random.seed(42)


# ---------------------------------------------------------------------------
# Inline SQLAlchemy models (mirror of backend/app/models/*)
# ---------------------------------------------------------------------------
Base = declarative_base()


class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False)
    username = Column(String(100), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(20), default="operator", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)


class FuelAgent(Base):
    __tablename__ = "fuel_agents"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    agent_name = Column(String(255), nullable=False)
    company_name = Column(String(255))
    contact_person = Column(String(255))
    phone = Column(String(20))
    email = Column(String(255))
    address = Column(Text)
    gst_number = Column(String(50))
    status = Column(String(20), default="active", nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)


class Airport(Base):
    __tablename__ = "airports"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    airport_name = Column(String(255), nullable=False)
    airport_code = Column(String(10), unique=True, nullable=False)
    city = Column(String(100))
    country = Column(String(100))
    fuel_storage_capacity = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)


class FuelPurchase(Base):
    __tablename__ = "fuel_purchases"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    purchase_id = Column(String(50), unique=True, nullable=False)
    fuel_agent_id = Column(UUID(as_uuid=True), ForeignKey("fuel_agents.id"), nullable=False)
    airport_id = Column(UUID(as_uuid=True), ForeignKey("airports.id"), nullable=False)
    fuel_type = Column(String(50), default="ATF", nullable=False)
    quantity_purchased = Column(Float, nullable=False)
    purchase_rate = Column(Float, nullable=False)
    total_amount = Column(Float, nullable=False)
    purchase_date = Column(Date, nullable=False)
    invoice_number = Column(String(100))
    payment_status = Column(String(20), default="pending", nullable=False)
    invoice_document = Column(String(500))
    remarks = Column(Text)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)


class FuelStock(Base):
    __tablename__ = "fuel_stocks"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    airport_id = Column(UUID(as_uuid=True), ForeignKey("airports.id"), nullable=False)
    fuel_type = Column(String(50), default="ATF", nullable=False)
    current_stock = Column(Float, default=0.0, nullable=False)
    last_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class FuelStockLog(Base):
    __tablename__ = "fuel_stock_logs"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    airport_id = Column(UUID(as_uuid=True), ForeignKey("airports.id"), nullable=False)
    fuel_type = Column(String(50), nullable=False)
    transaction_type = Column(String(20), nullable=False)
    quantity = Column(Float, nullable=False)
    reference_id = Column(UUID(as_uuid=True), nullable=True)
    reference_type = Column(String(50), nullable=True)
    notes = Column(Text, nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class Aircraft(Base):
    __tablename__ = "aircrafts"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    aircraft_number = Column(String(50), unique=True, nullable=False)
    aircraft_model = Column(String(100))
    airline_name = Column(String(255))
    fuel_capacity = Column(Float)
    status = Column(String(20), default="active", nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)


class AircraftFilling(Base):
    __tablename__ = "aircraft_fillings"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    filling_id = Column(String(50), unique=True, nullable=False)
    aircraft_id = Column(UUID(as_uuid=True), ForeignKey("aircrafts.id"), nullable=False)
    airport_id = Column(UUID(as_uuid=True), ForeignKey("airports.id"), nullable=False)
    quantity_filled = Column(Float, nullable=False)
    fuel_rate = Column(Float, nullable=False)
    total_cost = Column(Float, nullable=False)
    filled_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    filling_datetime = Column(DateTime(timezone=True), nullable=False)
    flight_number = Column(String(50))
    remarks = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)


class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    action = Column(String(50), nullable=False)
    entity_type = Column(String(100))
    entity_id = Column(String(255))
    ip_address = Column(String(50))
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


# ---------------------------------------------------------------------------
# Demo data definitions
# ---------------------------------------------------------------------------

USERS = [
    {"email": "rajesh.kumar@aerofuel.com", "username": "rajesh", "password": "Operator@123",
     "full_name": "Rajesh Kumar", "role": "operator"},
    {"email": "priya.sharma@aerofuel.com", "username": "priya", "password": "Operator@123",
     "full_name": "Priya Sharma", "role": "operator"},
    {"email": "ahmed.khan@aerofuel.com", "username": "ahmed", "password": "Operator@123",
     "full_name": "Ahmed Khan", "role": "operator"},
    {"email": "viewer@aerofuel.com", "username": "viewer", "password": "Viewer@123",
     "full_name": "Reports Viewer", "role": "viewer"},
]

AGENTS = [
    ("Indian Oil Aviation", "Indian Oil Corporation Ltd", "Anil Mehta", "+91-22-26447000",
     "aviation@indianoil.in", "IndianOil Bhavan, G-9, Ali Yavar Jung Marg, Bandra (E), Mumbai 400051",
     "27AAACI1681G1ZQ", "active"),
    ("BPCL Air BP", "Bharat Petroleum Corporation Ltd", "Sunita Reddy", "+91-22-22713000",
     "airbp@bharatpetroleum.in", "Bharat Bhavan, 4 & 6 Currimbhoy Road, Ballard Estate, Mumbai 400001",
     "27AAACB2902M1ZV", "active"),
    ("HPCL Aviation", "Hindustan Petroleum Corporation Ltd", "Vikram Singh", "+91-22-22863000",
     "aviation@hpcl.in", "Petroleum House, 17 Jamshedji Tata Road, Mumbai 400020",
     "27AAACH1118B1Z7", "active"),
    ("Reliance Aviation Fuels", "Reliance Industries Ltd", "Karthik Iyer", "+91-22-30327000",
     "aviation@ril.com", "Maker Chambers IV, 222 Nariman Point, Mumbai 400021",
     "27AAACR5055K1ZK", "active"),
    ("Shell Aviation India", "Shell India Markets Pvt Ltd", "Margaret D'Souza", "+91-80-66501000",
     "aviation.india@shell.com", "Campus 4A, RMZ Millenia Business Park, Perungudi, Chennai 600096",
     "29AAACS6232D1Z8", "active"),
    ("Nayara Energy Aviation", "Nayara Energy Ltd", "Deepak Rao", "+91-22-67137000",
     "aviation@nayaraenergy.com", "Khambhalia Post, Devbhumi Dwarka, Gujarat 361305",
     "24AAACN0717L1ZV", "inactive"),
]

AIRPORTS = [
    ("Indira Gandhi International Airport", "DEL", "New Delhi", "India", 5_000_000.0, 2_400_000.0),
    ("Chhatrapati Shivaji Maharaj International Airport", "BOM", "Mumbai", "India", 4_500_000.0, 2_100_000.0),
    ("Kempegowda International Airport", "BLR", "Bengaluru", "India", 3_500_000.0, 1_650_000.0),
    ("Chennai International Airport", "MAA", "Chennai", "India", 3_000_000.0, 1_400_000.0),
    ("Rajiv Gandhi International Airport", "HYD", "Hyderabad", "India", 2_800_000.0, 1_250_000.0),
    ("Netaji Subhas Chandra Bose International Airport", "CCU", "Kolkata", "India", 2_500_000.0, 1_100_000.0),
    ("Cochin International Airport", "COK", "Kochi", "India", 2_000_000.0, 900_000.0),
    ("Goa Dabolim Airport", "GOI", "Goa", "India", 1_500_000.0, 680_000.0),
]

AIRCRAFTS = [
    ("VT-ANA", "Boeing 777-300ER", "Air India", 181_283.0),
    ("VT-ANB", "Boeing 777-300ER", "Air India", 181_283.0),
    ("VT-ALN", "Boeing 787-8 Dreamliner", "Air India", 126_372.0),
    ("VT-JEK", "Airbus A330-300", "Vistara", 139_090.0),
    ("VT-IZB", "Airbus A320neo", "IndiGo", 27_200.0),
    ("VT-IZC", "Airbus A320neo", "IndiGo", 27_200.0),
    ("VT-IZG", "Airbus A321neo", "IndiGo", 32_940.0),
    ("VT-IZH", "Airbus A321neo", "IndiGo", 32_940.0),
    ("VT-SCH", "Boeing 737 MAX 8", "SpiceJet", 25_816.0),
    ("VT-SCJ", "Boeing 737-800", "SpiceJet", 26_020.0),
    ("VT-TVA", "Airbus A320neo", "Vistara", 27_200.0),
    ("VT-TVB", "Airbus A321neo", "Vistara", 32_940.0),
    ("VT-AYC", "Airbus A320neo", "AirAsia India", 27_200.0),
    ("VT-RGA", "ATR 72-600", "IndiGo", 6_400.0),
    ("VT-RGB", "ATR 72-600", "Alliance Air", 6_400.0),
    ("VT-BJA", "Bombardier Global 6000", "JetSetGo Aviation", 21_546.0),
    ("VT-BJB", "Gulfstream G650", "Taj Air", 20_634.0),
]

FUEL_TYPES = ["ATF", "JET-A1", "AVGAS"]
FUEL_TYPE_WEIGHTS = [0.65, 0.30, 0.05]
FUEL_RATE_RANGES = {"ATF": (92.0, 108.0), "JET-A1": (95.0, 112.0), "AVGAS": (180.0, 245.0)}
PAYMENT_STATUSES = ["paid", "pending", "partial"]
PAYMENT_WEIGHTS = [0.70, 0.20, 0.10]
FLIGHT_PREFIXES = ["AI", "6E", "SG", "UK", "I5", "QP"]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def hash_password(plain: str) -> str:
    """Return a bcrypt hash compatible with passlib's bcrypt scheme."""
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt(rounds=12)).decode("utf-8")


def weighted_choice(items, weights):
    return random.choices(items, weights=weights, k=1)[0]


def random_datetime_on(d: date) -> datetime:
    return datetime.combine(
        d,
        time(random.randint(5, 22), random.randint(0, 59), random.randint(0, 59)),
        tzinfo=timezone.utc,
    )


def random_flight_number() -> str:
    return f"{random.choice(FLIGHT_PREFIXES)}{random.randint(100, 2999)}"


def generate_purchase_id() -> str:
    suffix = ''.join(random.choices('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', k=4))
    return f"FP-{date.today().strftime('%Y%m%d')}-{suffix}"


def generate_filling_id() -> str:
    suffix = ''.join(random.choices('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', k=4))
    return f"AF-{date.today().strftime('%Y%m%d')}-{suffix}"


def normalize_db_url(url: str) -> str:
    """Convert async URLs to sync; this script uses psycopg2."""
    url = url.replace("postgresql+asyncpg://", "postgresql+psycopg2://")
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+psycopg2://", 1)
    return url


def resolve_db_url(cli_value: str | None) -> str:
    """Pick DB URL in priority order: --db-url > env > backend/.env."""
    if cli_value:
        return cli_value
    env_val = os.environ.get("DATABASE_URL")
    if env_val:
        return env_val
    # Fall back to backend/.env if present
    repo_root = Path(__file__).resolve().parent.parent
    env_file = repo_root / "backend" / ".env"
    if env_file.exists():
        for line in env_file.read_text().splitlines():
            line = line.strip()
            if line.startswith("DATABASE_URL="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    return "postgresql+psycopg2://fuel_user:fuel_pass@localhost:5432/fuel_management"


# ---------------------------------------------------------------------------
# Wipe (used by --reset)
# ---------------------------------------------------------------------------

def wipe(session: Session) -> None:
    print("Wiping existing data (keeping admin user)...")
    session.execute(delete(AuditLog))
    session.execute(delete(AircraftFilling))
    session.execute(delete(FuelStockLog))
    session.execute(delete(FuelStock))
    session.execute(delete(FuelPurchase))
    session.execute(delete(Aircraft))
    session.execute(delete(Airport))
    session.execute(delete(FuelAgent))
    session.execute(delete(User).where(User.email != "admin@aerofuel.com"))
    session.commit()
    print("  [OK] wipe complete")


# ---------------------------------------------------------------------------
# Seed routines (sync — uses regular Session)
# ---------------------------------------------------------------------------

def seed_admin_if_missing(session: Session) -> User:
    existing = session.execute(select(User).where(User.email == "admin@aerofuel.com")).scalar_one_or_none()
    if existing:
        return existing
    admin = User(
        email="admin@aerofuel.com",
        username="admin",
        hashed_password=hash_password("Admin@123"),
        full_name="System Administrator",
        role="admin",
        is_active=True,
    )
    session.add(admin)
    session.commit()
    session.refresh(admin)
    print("  [OK] admin user created (admin@aerofuel.com / Admin@123)")
    return admin


def seed_users(session: Session) -> dict[str, User]:
    print("Seeding users...")
    users: dict[str, User] = {}
    admin = seed_admin_if_missing(session)
    users["admin"] = admin
    for u in USERS:
        user = User(
            email=u["email"], username=u["username"],
            hashed_password=hash_password(u["password"]),
            full_name=u["full_name"], role=u["role"], is_active=True,
        )
        session.add(user)
        users[u["username"]] = user
    session.commit()
    for u in users.values():
        session.refresh(u)
    print(f"  [OK] {len(USERS)} additional users created")
    return users


def seed_agents(session: Session) -> list[FuelAgent]:
    print("Seeding fuel agents...")
    agents = []
    for tup in AGENTS:
        agent = FuelAgent(
            agent_name=tup[0], company_name=tup[1], contact_person=tup[2],
            phone=tup[3], email=tup[4], address=tup[5], gst_number=tup[6], status=tup[7],
        )
        session.add(agent)
        agents.append(agent)
    session.commit()
    for a in agents:
        session.refresh(a)
    print(f"  [OK] {len(agents)} fuel agents created")
    return agents


def seed_airports_with_opening_stock(session: Session, admin_id: uuid.UUID) -> list[Airport]:
    print("Seeding airports + opening stock...")
    airports = []
    for tup in AIRPORTS:
        a = Airport(airport_name=tup[0], airport_code=tup[1], city=tup[2],
                    country=tup[3], fuel_storage_capacity=tup[4])
        session.add(a)
        airports.append(a)
    session.commit()
    for a in airports:
        session.refresh(a)

    for airport, defn in zip(airports, AIRPORTS):
        total = defn[5]
        for ft, share in [("ATF", 0.70), ("JET-A1", 0.25), ("AVGAS", 0.05)]:
            qty = round(total * share, 2)
            session.add(FuelStock(airport_id=airport.id, fuel_type=ft, current_stock=qty))
            session.add(FuelStockLog(
                airport_id=airport.id, fuel_type=ft, transaction_type="adjustment",
                quantity=qty, reference_type="opening_balance",
                notes="Opening stock balance", created_by=admin_id,
            ))
    session.commit()
    print(f"  [OK] {len(airports)} airports + opening stock seeded")
    return airports


def seed_aircrafts(session: Session) -> list[Aircraft]:
    print("Seeding aircrafts...")
    aircrafts = []
    for tail, model, airline, cap in AIRCRAFTS:
        ac = Aircraft(aircraft_number=tail, aircraft_model=model,
                      airline_name=airline, fuel_capacity=cap, status="active")
        session.add(ac)
        aircrafts.append(ac)
    session.commit()
    for ac in aircrafts:
        session.refresh(ac)
    print(f"  [OK] {len(aircrafts)} aircrafts created")
    return aircrafts


def _add_stock(session: Session, airport_id, fuel_type: str, qty: float,
               trans_type: str, ref_id, ref_type: str, notes: str, user_id):
    """Update stock and log the change inline (no external service)."""
    stock = session.execute(
        select(FuelStock).where(
            FuelStock.airport_id == airport_id,
            FuelStock.fuel_type == fuel_type,
        )
    ).scalar_one_or_none()
    if stock is None:
        stock = FuelStock(airport_id=airport_id, fuel_type=fuel_type, current_stock=0.0)
        session.add(stock)
        session.flush()
    stock.current_stock = max(0.0, stock.current_stock + qty)
    session.add(FuelStockLog(
        airport_id=airport_id, fuel_type=fuel_type, transaction_type=trans_type,
        quantity=qty, reference_id=ref_id, reference_type=ref_type,
        notes=notes, created_by=user_id,
    ))


def seed_transactions(session: Session, users: dict[str, User],
                      agents: list[FuelAgent], airports: list[Airport],
                      aircrafts: list[Aircraft], days: int = 60) -> tuple[int, int]:
    print(f"Generating ~{days} days of transactions...")
    operators = [u for k, u in users.items() if u.role == "operator"] or [users["admin"]]
    active_agents = [a for a in agents if a.status == "active"]

    today = date.today()
    start = today - timedelta(days=days)
    purchase_count = 0
    filling_count = 0

    for day_offset in range(days + 1):
        current = start + timedelta(days=day_offset)
        is_weekend = current.weekday() >= 5

        for _ in range(random.randint(1, 2) if not is_weekend else random.randint(0, 1)):
            agent = random.choice(active_agents)
            airport = random.choice(airports)
            ft = weighted_choice(FUEL_TYPES, FUEL_TYPE_WEIGHTS)
            rmin, rmax = FUEL_RATE_RANGES[ft]
            rate = round(random.uniform(rmin, rmax), 2)
            qty = round(random.uniform(80_000, 250_000), 2)
            op = random.choice(operators)
            purchase = FuelPurchase(
                purchase_id=generate_purchase_id(),
                fuel_agent_id=agent.id, airport_id=airport.id, fuel_type=ft,
                quantity_purchased=qty, purchase_rate=rate,
                total_amount=round(qty * rate, 2), purchase_date=current,
                invoice_number=f"INV-{current.strftime('%Y%m%d')}-{random.randint(1000, 9999)}",
                payment_status=weighted_choice(PAYMENT_STATUSES, PAYMENT_WEIGHTS),
                remarks=random.choice([None, "Bulk monthly order", "Emergency restock",
                                       "Scheduled delivery", None, "Quarterly contract delivery"]),
                created_by=op.id,
            )
            session.add(purchase)
            session.flush()
            _add_stock(session, airport.id, ft, qty, "purchase",
                       purchase.id, "fuel_purchase", "Stock added from purchase", op.id)
            purchase_count += 1

        for _ in range(random.randint(3, 6) if not is_weekend else random.randint(2, 4)):
            aircraft = random.choice(aircrafts)
            airport = random.choice(airports)
            ft = "ATF" if ("MAX" in aircraft.aircraft_model or "neo" in aircraft.aircraft_model.lower()) \
                else weighted_choice(FUEL_TYPES, FUEL_TYPE_WEIGHTS)

            stock = session.execute(
                select(FuelStock).where(
                    FuelStock.airport_id == airport.id, FuelStock.fuel_type == ft,
                )
            ).scalar_one_or_none()
            available = stock.current_stock if stock else 0.0

            max_fill = min(aircraft.fuel_capacity * random.uniform(0.25, 0.85), available * 0.4)
            if max_fill < 500:
                continue
            qty = round(random.uniform(500, max_fill), 2)
            rmin, rmax = FUEL_RATE_RANGES[ft]
            rate = round(random.uniform(rmin, rmax) + 5.0, 2)
            op = random.choice(operators)
            filling = AircraftFilling(
                filling_id=generate_filling_id(), aircraft_id=aircraft.id, airport_id=airport.id,
                quantity_filled=qty, fuel_rate=rate, total_cost=round(qty * rate, 2),
                filled_by=op.id, filling_datetime=random_datetime_on(current),
                flight_number=random_flight_number(),
                remarks=random.choice([None, None, None, "Routine refueling",
                                       "Pre-departure check completed", "Long-haul preparation"]),
            )
            session.add(filling)
            session.flush()
            _add_stock(session, airport.id, ft, -qty, "filling",
                       filling.id, "aircraft_filling", "Stock deducted for aircraft filling", op.id)
            filling_count += 1

        session.commit()
        if (day_offset + 1) % 10 == 0:
            print(f"  ... day {day_offset + 1}/{days + 1}: "
                  f"{purchase_count} purchases, {filling_count} fillings")

    print(f"  [OK] {purchase_count} purchases, {filling_count} fillings over {days} days")
    return purchase_count, filling_count


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> int:
    parser = argparse.ArgumentParser(description="Seed AeroFuel demo data.")
    parser.add_argument("--db-url", help="PostgreSQL connection string. "
                                           "Overrides DATABASE_URL and backend/.env.")
    parser.add_argument("--reset", action="store_true",
                        help="Wipe existing demo data before seeding (keeps admin user).")
    parser.add_argument("--days", type=int, default=60,
                        help="Days of transaction history to generate (default: 60).")
    args = parser.parse_args()

    db_url = normalize_db_url(resolve_db_url(args.db_url))
    redacted = db_url.split("@")[-1] if "@" in db_url else db_url

    print("=" * 60)
    print(" AeroFuel Demo Data Seeder (standalone)")
    print("=" * 60)
    print(f"Connecting to: ...@{redacted}")

    engine = create_engine(db_url, future=True)
    Base.metadata.create_all(engine)  # ensures tables exist

    with Session(engine, future=True) as session:
        existing = session.execute(select(FuelAgent).limit(1)).scalar_one_or_none()
        if existing and not args.reset:
            print("Demo data already present. Re-run with --reset to wipe and reseed.")
            return 0
        if args.reset:
            wipe(session)

        users = seed_users(session)
        agents = seed_agents(session)
        airports = seed_airports_with_opening_stock(session, users["admin"].id)
        aircrafts = seed_aircrafts(session)
        seed_transactions(session, users, agents, airports, aircrafts, days=args.days)

    print("=" * 60)
    print(" Demo data seeded successfully.")
    print("=" * 60)
    print("Login credentials:")
    print("  Admin:    admin@aerofuel.com         / Admin@123")
    print("  Operator: rajesh.kumar@aerofuel.com  / Operator@123")
    print("  Viewer:   viewer@aerofuel.com        / Viewer@123")
    return 0


if __name__ == "__main__":
    sys.exit(main())
