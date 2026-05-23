import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import get_settings
from app.database import AsyncSessionLocal, engine
from app.routers import (
    auth,
    users,
    fuel_agents,
    airports,
    fuel_purchases,
    fuel_stock,
    aircrafts,
    aircraft_filling,
    dashboard,
    reports,
    pdf,
    audit_logs,
)

settings = get_settings()


async def create_default_admin():
    from sqlalchemy import select
    from app.models.user import User
    from app.utils.auth import hash_password

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(User).where(User.email == "admin@aerofuel.com")
        )
        existing = result.scalar_one_or_none()
        if not existing:
            admin = User(
                email="admin@aerofuel.com",
                username="admin",
                hashed_password=hash_password("Admin@123"),
                full_name="System Administrator",
                role="admin",
                is_active=True,
            )
            db.add(admin)
            await db.commit()
            print("Default admin user created: admin@aerofuel.com / Admin@123")
        else:
            print("Default admin user already exists.")


@asynccontextmanager
async def lifespan(app: FastAPI):
    os.makedirs(os.path.join(settings.UPLOAD_DIR, "invoices"), exist_ok=True)
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    from app.database import Base
    import app.models  # noqa: F401 - ensure all models registered

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    await create_default_admin()

    yield

    await engine.dispose()


app = FastAPI(
    title="AeroFuel Management System",
    description="Aviation Fuel Management System API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

upload_dir = settings.UPLOAD_DIR
os.makedirs(upload_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=upload_dir), name="uploads")

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(fuel_agents.router)
app.include_router(airports.router)
app.include_router(fuel_purchases.router)
app.include_router(fuel_stock.router)
app.include_router(aircrafts.router)
app.include_router(aircraft_filling.router)
app.include_router(dashboard.router)
app.include_router(reports.router)
app.include_router(pdf.router)
app.include_router(audit_logs.router)


@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "service": "AeroFuel Management System",
        "version": "1.0.0",
    }


@app.get("/", tags=["Root"])
async def root():
    return {
        "message": "Welcome to AeroFuel Management System API",
        "docs": "/docs",
        "redoc": "/redoc",
    }
