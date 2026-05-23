import uuid
from datetime import date, datetime

from sqlalchemy import Date, DateTime, Float, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class FuelPurchase(Base):
    __tablename__ = "fuel_purchases"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    purchase_id: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    fuel_agent_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("fuel_agents.id"), nullable=False
    )
    airport_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("airports.id"), nullable=False
    )
    fuel_type: Mapped[str] = mapped_column(String(50), default="ATF", nullable=False)
    quantity_purchased: Mapped[float] = mapped_column(Float, nullable=False)
    purchase_rate: Mapped[float] = mapped_column(Float, nullable=False)
    total_amount: Mapped[float] = mapped_column(Float, nullable=False)
    purchase_date: Mapped[date] = mapped_column(Date, nullable=False)
    invoice_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    payment_status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)
    invoice_document: Mapped[str | None] = mapped_column(String(500), nullable=True)
    remarks: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), onupdate=func.now(), nullable=True
    )

    fuel_agent: Mapped["FuelAgent"] = relationship("FuelAgent", back_populates="fuel_purchases")
    airport: Mapped["Airport"] = relationship("Airport", back_populates="fuel_purchases")
    creator: Mapped["User | None"] = relationship(
        "User", back_populates="fuel_purchases", foreign_keys=[created_by]
    )
