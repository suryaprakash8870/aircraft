from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

from app.config import get_settings

settings = get_settings()

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    # Long timeouts so a request paused at a breakpoint doesn't get its
    # connection killed mid-flight. Production-safe; only affects how long
    # an idle/checked-out connection is tolerated.
    pool_recycle=3600,         # recycle connections after 1h (default: -1)
    pool_timeout=120,          # wait up to 2 min for a free conn (default: 30s)
    connect_args={
        "command_timeout": 600,            # 10 min per query (default: None=no limit, but some drivers cap)
        "server_settings": {
            "idle_in_transaction_session_timeout": "0",  # never kill idle tx (good for debugging)
            "statement_timeout": "0",                     # never kill long queries
        },
    },
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
