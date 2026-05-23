"""
Standalone seed script — creates the default admin user.
Run with: python -m app.seed

Note: this also runs automatically on every uvicorn startup via main.py lifespan.
"""
import asyncio
from sqlalchemy import select
from app.database import AsyncSessionLocal, engine, Base
from app.models.user import User
from app.utils.auth import hash_password
import app.models  # noqa: F401 — register all models


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

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
            print("Default admin created: admin@aerofuel.com / Admin@123")
        else:
            print("Admin already exists, skipping seed.")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed())
