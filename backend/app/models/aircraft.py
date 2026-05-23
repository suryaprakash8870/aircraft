import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Aircraft(Base):
    __tablename__ = "aircrafts"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    aircraft_number: Mapped[str] = mapped_column(
        String(50), unique=True, index=True, nullable=False
    )
    aircraft_model: Mapped[str | None] = mapped_column(String(100), nullable=True)
    airline_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    fuel_capacity: Mapped[float | None] = mapped_column(Float, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="active", nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), onupdate=func.now(), nullable=True
    )

    aircraft_fillings: Mapped[list["AircraftFilling"]] = relationship(
        "AircraftFilling", back_populates="aircraft"
    )
