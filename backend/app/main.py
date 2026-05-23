import logging
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

# Use uvicorn's logger so startup messages match the rest of the server output
log = logging.getLogger("uvicorn.error")


async def _seed_default_admin() -> None:
    """Create the default admin user if it doesn't exist."""
    from sqlalchemy import select
    from app.models.user import User
    from app.utils.auth import hash_password

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(User).where(User.email == "admin@aerofuel.com")
        )
        if result.scalar_one_or_none():
            log.info("Default admin user already present, skipping seed.")
            return

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
        log.info("Default admin user seeded: admin@aerofuel.com / Admin@123")


@asynccontextmanager
async def lifespan(fastapi_app: FastAPI):
    # --- Startup ---------------------------------------------------------
    app_title = fastapi_app.title
    app_version = fastapi_app.version
    log.info("Starting %s v%s", app_title, app_version)

    upload_dir = settings.UPLOAD_DIR
    os.makedirs(os.path.join(upload_dir, "invoices"), exist_ok=True)
    log.info("Upload directory ready: %s", os.path.abspath(upload_dir))

    # Ensure all SQLAlchemy models are imported so Base.metadata sees them.
    # NOTE: do not name the lifespan parameter `app` — `import app.models`
    # below would shadow it and break later references.
    from app.database import Base
    import app.models  # noqa: F401

    log.info("Initializing database schema (%d tables)", len(Base.metadata.tables))
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    log.info("Database schema ready.")

    await _seed_default_admin()

    log.info("%s startup complete.", app_title)

    yield

    # --- Shutdown --------------------------------------------------------
    log.info("Shutting down, disposing database engine.")
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
