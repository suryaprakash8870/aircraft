import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.schemas.aircraft import AircraftList
from app.schemas.airport import AirportList


class AircraftFillingCreate(BaseModel):
    aircraft_id: uuid.UUID
    airport_id: uuid.UUID
    quantity_filled: float
    fuel_rate: float
    filling_datetime: datetime
    flight_number: Optional[str] = None
    remarks: Optional[str] = None


class AircraftFillingUpdate(BaseModel):
    aircraft_id: Optional[uuid.UUID] = None
    airport_id: Optional[uuid.UUID] = None
    quantity_filled: Optional[float] = None
    fuel_rate: Optional[float] = None
    filling_datetime: Optional[datetime] = None
    flight_number: Optional[str] = None
    remarks: Optional[str] = None


class AircraftFillingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    filling_id: str
    aircraft_id: uuid.UUID
    airport_id: uuid.UUID
    quantity_filled: float
    fuel_rate: float
    total_cost: float
    filled_by: Optional[uuid.UUID] = None
    filling_datetime: datetime
    flight_number: Optional[str] = None
    remarks: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    aircraft: Optional[AircraftList] = None
    airport: Optional[AirportList] = None
