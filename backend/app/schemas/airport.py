import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class AirportCreate(BaseModel):
    airport_name: str
    airport_code: str
    city: Optional[str] = None
    country: Optional[str] = None
    fuel_storage_capacity: float = 0.0


class AirportUpdate(BaseModel):
    airport_name: Optional[str] = None
    airport_code: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    fuel_storage_capacity: Optional[float] = None


class AirportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    airport_name: str
    airport_code: str
    city: Optional[str] = None
    country: Optional[str] = None
    fuel_storage_capacity: float
    current_stock: float = 0.0
    created_at: datetime
    updated_at: Optional[datetime] = None


class AirportList(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    airport_name: str
    airport_code: str
    city: Optional[str] = None
    country: Optional[str] = None
    fuel_storage_capacity: float
    current_stock: float = 0.0
    created_at: datetime
