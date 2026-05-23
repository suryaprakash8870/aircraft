import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Airport(Base):
    __tablename__ = "airports"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    airport_name: Mapped[str] = mapped_column(String(255), nullable=False)
    airport_code: Mapped[str] = mapped_column(String(10), unique=True, index=True, nullable=False)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    country: Mapped[str | None] = mapped_column(String(100), nullable=True)
    fuel_storage_capacity: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), onupdate=func.now(), nullable=True
    )

    fuel_purchases: Mapped[list["FuelPurchase"]] = relationship(
        "FuelPurchase", back_populates="airport"
    )
    fuel_stocks: Mapped[list["FuelStock"]] = relationship(
        "FuelStock", back_populates="airport"
    )
    fuel_stock_logs: Mapped[list["FuelStockLog"]] = relationship(
        "FuelStockLog", back_populates="airport"
    )
    aircraft_fillings: Mapped[list["AircraftFilling"]] = relationship(
        "AircraftFilling", back_populates="airport"
    )
