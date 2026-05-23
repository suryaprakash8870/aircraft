import uuid
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, field_validator

from app.schemas.fuel_agent import FuelAgentList
from app.schemas.airport import AirportList


class FuelPurchaseCreate(BaseModel):
    fuel_agent_id: uuid.UUID
    airport_id: uuid.UUID
    fuel_type: str = "ATF"
    quantity_purchased: float
    purchase_rate: float
    purchase_date: date
    invoice_number: Optional[str] = None
    payment_status: str = "pending"
    remarks: Optional[str] = None

    @field_validator("fuel_type")
    @classmethod
    def validate_fuel_type(cls, v: str) -> str:
        allowed = {"ATF", "AVGAS", "JET-A1"}
        if v not in allowed:
            raise ValueError(f"Fuel type must be one of {allowed}")
        return v

    @field_validator("payment_status")
    @classmethod
    def validate_payment_status(cls, v: str) -> str:
        allowed = {"paid", "pending", "partial"}
        if v not in allowed:
            raise ValueError(f"Payment status must be one of {allowed}")
        return v


class FuelPurchaseUpdate(BaseModel):
    fuel_agent_id: Optional[uuid.UUID] = None
    airport_id: Optional[uuid.UUID] = None
    fuel_type: Optional[str] = None
    quantity_purchased: Optional[float] = None
    purchase_rate: Optional[float] = None
    purchase_date: Optional[date] = None
    invoice_number: Optional[str] = None
    payment_status: Optional[str] = None
    remarks: Optional[str] = None

    @field_validator("fuel_type")
    @classmethod
    def validate_fuel_type(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            allowed = {"ATF", "AVGAS", "JET-A1"}
            if v not in allowed:
                raise ValueError(f"Fuel type must be one of {allowed}")
        return v

    @field_validator("payment_status")
    @classmethod
    def validate_payment_status(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            allowed = {"paid", "pending", "partial"}
            if v not in allowed:
                raise ValueError(f"Payment status must be one of {allowed}")
        return v


class FuelPurchaseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    purchase_id: str
    fuel_agent_id: uuid.UUID
    airport_id: uuid.UUID
    fuel_type: str
    quantity_purchased: float
    purchase_rate: float
    total_amount: float
    purchase_date: date
    invoice_number: Optional[str] = None
    payment_status: str
    invoice_document: Optional[str] = None
    remarks: Optional[str] = None
    created_by: Optional[uuid.UUID] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    fuel_agent: Optional[FuelAgentList] = None
    airport: Optional[AirportList] = None
