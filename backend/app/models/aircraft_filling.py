import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class AircraftFilling(Base):
    __tablename__ = "aircraft_fillings"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    filling_id: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    aircraft_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("aircrafts.id"), nullable=False
    )
    airport_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("airports.id"), nullable=False
    )
    quantity_filled: Mapped[float] = mapped_column(Float, nullable=False)
    fuel_rate: Mapped[float] = mapped_column(Float, nullable=False)
    total_cost: Mapped[float] = mapped_column(Float, nullable=False)
    filled_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    filling_datetime: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    flight_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    remarks: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), onupdate=func.now(), nullable=True
    )

    aircraft: Mapped["Aircraft"] = relationship("Aircraft", back_populates="aircraft_fillings")
    airport: Mapped["Airport"] = relationship("Airport", back_populates="aircraft_fillings")
    operator: Mapped["User | None"] = relationship(
        "User", back_populates="aircraft_fillings", foreign_keys=[filled_by]
    )
