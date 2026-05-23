"""
Demo data seeder for AeroFuel Management System.

Generates ~2 months of realistic fuel purchase + aircraft filling activity
across multiple airports, vendors, and aircrafts. Uses the actual stock
service so the fuel_stocks and fuel_stock_logs tables stay consistent.

Usage:
    python -m app.seed_demo            # idempotent — skips if data exists
    python -m app.seed_demo --reset    # wipes demo data, then reseeds
                                          (preserves the admin user)
"""
from __future__ import annotations

import asyncio
import random
import sys
import uuid
from datetime import date, datetime, time, timedelta, timezone
from typing import Iterable

from sqlalchemy import delete, select

from app.database import AsyncSessionLocal
from app.models.aircraft import Aircraft
from app.models.aircraft_filling import AircraftFilling
from app.models.airport import Airport
from app.models.audit_log import AuditLog
from app.models.fuel_agent import FuelAgent
from app.models.fuel_purchase import FuelPurchase
from app.models.fuel_stock import FuelStock, FuelStockLog
from app.models.user import User
from app.services.stock_service import (
    deduct_stock_on_filling,
    update_stock_on_purchase,
)
from app.utils.auth import hash_password
from app.utils.id_generator import generate_filling_id, generate_purchase_id


# Reproducible randomness
random.seed(42)


# ---------------------------------------------------------------------------
# Demo data definitions
# ---------------------------------------------------------------------------

USERS = [
    {
        "email": "rajesh.kumar@aerofuel.com",
        "username": "rajesh",
        "password": "Operator@123",
        "full_name": "Rajesh Kumar",
        "role": "operator",
    },
    {
        "email": "priya.sharma@aerofuel.com",
        "username": "priya",
        "password": "Operator@123",
        "full_name": "Priya Sharma",
        "role": "operator",
    },
    {
        "email": "ahmed.khan@aerofuel.com",
        "username": "ahmed",
        "password": "Operator@123",
        "full_name": "Ahmed Khan",
        "role": "operator",
    },
    {
        "email": "viewer@aerofuel.com",
        "username": "viewer",
        "password": "Viewer@123",
        "full_name": "Reports Viewer",
        "role": "viewer",
    },
]

AGENTS = [
    {
        "agent_name": "Indian Oil Aviation",
        "company_name": "Indian Oil Corporation Ltd",
        "contact_person": "Anil Mehta",
        "phone": "+91-22-26447000",
        "email": "aviation@indianoil.in",
        "address": "IndianOil Bhavan, G-9, Ali Yavar Jung Marg, Bandra (E), Mumbai 400051",
        "gst_number": "27AAACI1681G1ZQ",
        "status": "active",
    },
    {
        "agent_name": "BPCL Air BP",
        "company_name": "Bharat Petroleum Corporation Ltd",
        "contact_person": "Sunita Reddy",
        "phone": "+91-22-22713000",
        "email": "airbp@bharatpetroleum.in",
        "address": "Bharat Bhavan, 4 & 6 Currimbhoy Road, Ballard Estate, Mumbai 400001",
        "gst_number": "27AAACB2902M1ZV",
        "status": "active",
    },
    {
        "agent_name": "HPCL Aviation",
        "company_name": "Hindustan Petroleum Corporation Ltd",
        "contact_person": "Vikram Singh",
        "phone": "+91-22-22863000",
        "email": "aviation@hpcl.in",
        "address": "Petroleum House, 17 Jamshedji Tata Road, Mumbai 400020",
        "gst_number": "27AAACH1118B1Z7",
        "status": "active",
    },
    {
        "agent_name": "Reliance Aviation Fuels",
        "company_name": "Reliance Industries Ltd",
        "contact_person": "Karthik Iyer",
        "phone": "+91-22-30327000",
        "email": "aviation@ril.com",
        "address": "Maker Chambers IV, 222 Nariman Point, Mumbai 400021",
        "gst_number": "27AAACR5055K1ZK",
        "status": "active",
    },
    {
        "agent_name": "Shell Aviation India",
        "company_name": "Shell India Markets Pvt Ltd",
        "contact_person": "Margaret D'Souza",
        "phone": "+91-80-66501000",
        "email": "aviation.india@shell.com",
        "address": "Campus 4A, RMZ Millenia Business Park, Perungudi, Chennai 600096",
        "gst_number": "29AAACS6232D1Z8",
        "status": "active",
    },
    {
        "agent_name": "Nayara Energy Aviation",
        "company_name": "Nayara Energy Ltd",
        "contact_person": "Deepak Rao",
        "phone": "+91-22-67137000",
        "email": "aviation@nayaraenergy.com",
        "address": "Khambhalia Post, Devbhumi Dwarka, Gujarat 361305",
        "gst_number": "24AAACN0717L1ZV",
        "status": "inactive",
    },
]

AIRPORTS = [
    {
        "airport_name": "Indira Gandhi International Airport",
        "airport_code": "DEL",
        "city": "New Delhi",
        "country": "India",
        "fuel_storage_capacity": 5_000_000.0,
        "initial_stock": 2_400_000.0,
    },
    {
        "airport_name": "Chhatrapati Shivaji Maharaj International Airport",
        "airport_code": "BOM",
        "city": "Mumbai",
        "country": "India",
        "fuel_storage_capacity": 4_500_000.0,
        "initial_stock": 2_100_000.0,
    },
    {
        "airport_name": "Kempegowda International Airport",
        "airport_code": "BLR",
        "city": "Bengaluru",
        "country": "India",
        "fuel_storage_capacity": 3_500_000.0,
        "initial_stock": 1_650_000.0,
    },
    {
        "airport_name": "Chennai International Airport",
        "airport_code": "MAA",
        "city": "Chennai",
        "country": "India",
        "fuel_storage_capacity": 3_000_000.0,
        "initial_stock": 1_400_000.0,
    },
    {
        "airport_name": "Rajiv Gandhi International Airport",
        "airport_code": "HYD",
        "city": "Hyderabad",
        "country": "India",
        "fuel_storage_capacity": 2_800_000.0,
        "initial_stock": 1_250_000.0,
    },
    {
        "airport_name": "Netaji Subhas Chandra Bose International Airport",
        "airport_code": "CCU",
        "city": "Kolkata",
        "country": "India",
        "fuel_storage_capacity": 2_500_000.0,
        "initial_stock": 1_100_000.0,
    },
    {
        "airport_name": "Cochin International Airport",
        "airport_code": "COK",
        "city": "Kochi",
        "country": "India",
        "fuel_storage_capacity": 2_000_000.0,
        "initial_stock": 900_000.0,
    },
    {
        "airport_name": "Goa Dabolim Airport",
        "airport_code": "GOI",
        "city": "Goa",
        "country": "India",
        "fuel_storage_capacity": 1_500_000.0,
        "initial_stock": 680_000.0,
    },
]

AIRCRAFTS = [
    # Widebody
    ("VT-ANA", "Boeing 777-300ER", "Air India", 181_283.0),
    ("VT-ANB", "Boeing 777-300ER", "Air India", 181_283.0),
    ("VT-ALN", "Boeing 787-8 Dreamliner", "Air India", 126_372.0),
    ("VT-JEK", "Airbus A330-300", "Vistara", 139_090.0),
    # Narrowbody
    ("VT-IZB", "Airbus A320neo", "IndiGo", 27_200.0),
    ("VT-IZC", "Airbus A320neo", "IndiGo", 27_200.0),
    ("VT-IZG", "Airbus A321neo", "IndiGo", 32_940.0),
    ("VT-IZH", "Airbus A321neo", "IndiGo", 32_940.0),
    ("VT-SCH", "Boeing 737 MAX 8", "SpiceJet", 25_816.0),
    ("VT-SCJ", "Boeing 737-800", "SpiceJet", 26_020.0),
    ("VT-TVA", "Airbus A320neo", "Vistara", 27_200.0),
    ("VT-TVB", "Airbus A321neo", "Vistara", 32_940.0),
    ("VT-AYC", "Airbus A320neo", "AirAsia India", 27_200.0),
    # Regional
    ("VT-RGA", "ATR 72-600", "IndiGo", 6_400.0),
    ("VT-RGB", "ATR 72-600", "Alliance Air", 6_400.0),
    # Business jets
    ("VT-BJA", "Bombardier Global 6000", "JetSetGo Aviation", 21_546.0),
    ("VT-BJB", "Gulfstream G650", "Taj Air", 20_634.0),
]

FUEL_TYPES = ["ATF", "JET-A1", "AVGAS"]
FUEL_TYPE_WEIGHTS = [0.65, 0.30, 0.05]  # ATF dominates in India

# Fuel rate ranges (₹ per litre)
FUEL_RATE_RANGES = {
    "ATF": (92.0, 108.0),
    "JET-A1": (95.0, 112.0),
    "AVGAS": (180.0, 245.0),
}

PAYMENT_STATUSES = ["paid", "pending", "partial"]
PAYMENT_WEIGHTS = [0.70, 0.20, 0.10]

FLIGHT_PREFIXES = ["AI", "6E", "SG", "UK", "I5", "QP"]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def weighted_choice(items, weights):
    return random.choices(items, weights=weights, k=1)[0]


def random_datetime_on(d: date) -> datetime:
    """Return a random time on the given date, timezone-aware UTC."""
    hour = random.randint(5, 22)
    minute = random.randint(0, 59)
    second = random.randint(0, 59)
    return datetime.combine(d, time(hour, minute, second), tzinfo=timezone.utc)


def random_flight_number() -> str:
    prefix = random.choice(FLIGHT_PREFIXES)
    number = random.randint(100, 2999)
    return f"{prefix}{number}"


# ---------------------------------------------------------------------------
# Wipe (for --reset)
# ---------------------------------------------------------------------------

async def wipe_demo_data(db):
    """Delete everything except the admin user."""
    print("Wiping existing data...")
    # Order matters due to FKs — children first
    await db.execute(delete(AuditLog))
    await db.execute(delete(AircraftFilling))
    await db.execute(delete(FuelStockLog))
    await db.execute(delete(FuelStock))
    await db.execute(delete(FuelPurchase))
    await db.execute(delete(Aircraft))
    await db.execute(delete(Airport))
    await db.execute(delete(FuelAgent))
    # Keep admin, remove other users
    await db.execute(delete(User).where(User.email != "admin@aerofuel.com"))
    await db.commit()
    print("  [OK] Wipe complete")


# ---------------------------------------------------------------------------
# Seed steps
# ---------------------------------------------------------------------------

async def seed_users(db) -> dict[str, User]:
    print("Seeding users...")
    users = {}
    # Pick up the existing admin so we can use it as creator on early records
    result = await db.execute(select(User).where(User.email == "admin@aerofuel.com"))
    admin = result.scalar_one_or_none()
    if admin:
        users["admin"] = admin

    for u in USERS:
        user = User(
            email=u["email"],
            username=u["username"],
            hashed_password=hash_password(u["password"]),
            full_name=u["full_name"],
            role=u["role"],
            is_active=True,
        )
        db.add(user)
        users[u["username"]] = user

    await db.flush()
    print(f"  [OK] {len(USERS)} users created")
    return users


async def seed_agents(db) -> list[FuelAgent]:
    print("Seeding fuel agents...")
    agents = []
    for a in AGENTS:
        agent = FuelAgent(**a)
        db.add(agent)
        agents.append(agent)
    await db.flush()
    print(f"  [OK] {len(agents)} fuel agents created")
    return agents


async def seed_airports(db, admin_id) -> list[Airport]:
    print("Seeding airports with initial stock...")
    airports = []
    for a in AIRPORTS:
        airport = Airport(
            airport_name=a["airport_name"],
            airport_code=a["airport_code"],
            city=a["city"],
            country=a["country"],
            fuel_storage_capacity=a["fuel_storage_capacity"],
        )
        db.add(airport)
        airports.append(airport)
    await db.flush()

    # Seed opening stock per airport (split across fuel types)
    for airport, defn in zip(airports, AIRPORTS):
        total = defn["initial_stock"]
        # 70% ATF, 25% JET-A1, 5% AVGAS for opening balance
        for fuel_type, share in [("ATF", 0.70), ("JET-A1", 0.25), ("AVGAS", 0.05)]:
            qty = round(total * share, 2)
            db.add(FuelStock(
                airport_id=airport.id,
                fuel_type=fuel_type,
                current_stock=qty,
            ))
            db.add(FuelStockLog(
                airport_id=airport.id,
                fuel_type=fuel_type,
                transaction_type="adjustment",
                quantity=qty,
                reference_type="opening_balance",
                notes="Opening stock balance",
                created_by=admin_id,
            ))
    await db.flush()
    print(f"  [OK] {len(airports)} airports + opening stock seeded")
    return airports


async def seed_aircrafts(db) -> list[Aircraft]:
    print("Seeding aircrafts...")
    aircrafts = []
    for tail, model, airline, capacity in AIRCRAFTS:
        aircraft = Aircraft(
            aircraft_number=tail,
            aircraft_model=model,
            airline_name=airline,
            fuel_capacity=capacity,
            status="active",
        )
        db.add(aircraft)
        aircrafts.append(aircraft)
    await db.flush()
    print(f"  [OK] {len(aircrafts)} aircrafts created")
    return aircrafts


async def seed_transactions(
    db,
    *,
    users: dict[str, User],
    agents: list[FuelAgent],
    airports: list[Airport],
    aircrafts: list[Aircraft],
    days: int = 60,
) -> tuple[int, int]:
    print(f"Generating ~{days} days of transactions...")
    operators = [u for k, u in users.items() if u.role == "operator"]
    if not operators:
        operators = [users["admin"]]
    active_agents = [a for a in agents if a.status == "active"]

    today = date.today()
    start_date = today - timedelta(days=days)

    purchase_count = 0
    filling_count = 0

    # Iterate day by day
    for day_offset in range(days + 1):
        current_date = start_date + timedelta(days=day_offset)
        is_weekend = current_date.weekday() >= 5

        # --- Purchases (1-2 per day on weekdays, 0-1 on weekends) ---
        n_purchases = random.randint(1, 2) if not is_weekend else random.randint(0, 1)
        for _ in range(n_purchases):
            agent = random.choice(active_agents)
            airport = random.choice(airports)
            fuel_type = weighted_choice(FUEL_TYPES, FUEL_TYPE_WEIGHTS)
            rate_min, rate_max = FUEL_RATE_RANGES[fuel_type]
            rate = round(random.uniform(rate_min, rate_max), 2)
            # Purchase quantities: large bulk orders
            quantity = round(random.uniform(80_000, 250_000), 2)
            total = round(quantity * rate, 2)
            operator = random.choice(operators)

            purchase = FuelPurchase(
                purchase_id=generate_purchase_id(),
                fuel_agent_id=agent.id,
                airport_id=airport.id,
                fuel_type=fuel_type,
                quantity_purchased=quantity,
                purchase_rate=rate,
                total_amount=total,
                purchase_date=current_date,
                invoice_number=f"INV-{current_date.strftime('%Y%m%d')}-{random.randint(1000, 9999)}",
                payment_status=weighted_choice(PAYMENT_STATUSES, PAYMENT_WEIGHTS),
                remarks=random.choice([
                    None,
                    "Bulk monthly order",
                    "Emergency restock",
                    "Scheduled delivery",
                    None,
                    "Quarterly contract delivery",
                ]),
                created_by=operator.id,
            )
            db.add(purchase)
            await db.flush()

            await update_stock_on_purchase(
                db,
                airport_id=airport.id,
                fuel_type=fuel_type,
                quantity=quantity,
                purchase_id=purchase.id,
                user_id=operator.id,
            )
            purchase_count += 1

        # --- Fillings (3-6 per day on weekdays, 2-4 on weekends) ---
        n_fillings = random.randint(3, 6) if not is_weekend else random.randint(2, 4)
        for _ in range(n_fillings):
            aircraft = random.choice(aircrafts)
            airport = random.choice(airports)
            fuel_type = "ATF" if "MAX" in aircraft.aircraft_model or "neo" in aircraft.aircraft_model.lower() else weighted_choice(FUEL_TYPES, FUEL_TYPE_WEIGHTS)

            # Stock check — find available stock to avoid overdraft
            stock_q = select(FuelStock).where(
                FuelStock.airport_id == airport.id,
                FuelStock.fuel_type == fuel_type,
            )
            stock_res = await db.execute(stock_q)
            stock_row = stock_res.scalar_one_or_none()
            available = stock_row.current_stock if stock_row else 0.0

            # Realistic fill: 25-85% of aircraft capacity, but capped by available stock
            max_fill = min(aircraft.fuel_capacity * random.uniform(0.25, 0.85), available * 0.4)
            if max_fill < 500:
                continue  # Skip if no usable stock
            quantity = round(random.uniform(500, max_fill), 2)

            rate_min, rate_max = FUEL_RATE_RANGES[fuel_type]
            rate = round(random.uniform(rate_min, rate_max) + 5.0, 2)  # filling rate slightly above purchase
            total = round(quantity * rate, 2)
            operator = random.choice(operators)

            filling = AircraftFilling(
                filling_id=generate_filling_id(),
                aircraft_id=aircraft.id,
                airport_id=airport.id,
                quantity_filled=quantity,
                fuel_rate=rate,
                total_cost=total,
                filled_by=operator.id,
                filling_datetime=random_datetime_on(current_date),
                flight_number=random_flight_number(),
                remarks=random.choice([
                    None, None, None,
                    "Routine refueling",
                    "Pre-departure check completed",
                    "Long-haul preparation",
                ]),
            )
            db.add(filling)
            await db.flush()

            try:
                await deduct_stock_on_filling(
                    db,
                    airport_id=airport.id,
                    fuel_type=fuel_type,
                    quantity=quantity,
                    filling_id=filling.id,
                    user_id=operator.id,
                )
                filling_count += 1
            except Exception:
                # Insufficient stock — roll back this filling
                await db.delete(filling)
                await db.flush()

        # Commit per day so each day's transactions persist together
        await db.commit()
        if (day_offset + 1) % 10 == 0:
            print(f"  ... day {day_offset + 1}/{days + 1}: {purchase_count} purchases, {filling_count} fillings")

    print(f"  [OK] {purchase_count} purchases, {filling_count} fillings created over {days} days")
    return purchase_count, filling_count


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

async def main(reset: bool = False):
    print("=" * 60)
    print("AeroFuel Demo Data Seeder")
    print("=" * 60)

    async with AsyncSessionLocal() as db:
        # Check if demo data already exists
        result = await db.execute(select(FuelAgent).limit(1))
        existing = result.scalar_one_or_none()

        if existing and not reset:
            print("Demo data already exists. Use --reset to wipe and reseed.")
            return

        if reset:
            await wipe_demo_data(db)

        users = await seed_users(db)
        await db.commit()

        admin_id = users["admin"].id if "admin" in users else None
        agents = await seed_agents(db)
        airports = await seed_airports(db, admin_id)
        aircrafts = await seed_aircrafts(db)
        await db.commit()

        await seed_transactions(
            db,
            users=users,
            agents=agents,
            airports=airports,
            aircrafts=aircrafts,
            days=60,
        )

    print("=" * 60)
    print("Demo data seeded successfully!")
    print("=" * 60)
    print("Login credentials:")
    print("  Admin:    admin@aerofuel.com    / Admin@123")
    print("  Operator: rajesh.kumar@aerofuel.com / Operator@123")
    print("  Viewer:   viewer@aerofuel.com   / Viewer@123")
    print()


if __name__ == "__main__":
    reset_flag = "--reset" in sys.argv
    asyncio.run(main(reset=reset_flag))
