import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, field_validator


class AircraftCreate(BaseModel):
    aircraft_number: str
    aircraft_model: Optional[str] = None
    airline_name: Optional[str] = None
    fuel_capacity: Optional[float] = None
    status: str = "active"

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        allowed = {"active", "inactive"}
        if v not in allowed:
            raise ValueError(f"Status must be one of {allowed}")
        return v


class AircraftUpdate(BaseModel):
    aircraft_number: Optional[str] = None
    aircraft_model: Optional[str] = None
    airline_name: Optional[str] = None
    fuel_capacity: Optional[float] = None
    status: Optional[str] = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            allowed = {"active", "inactive"}
            if v not in allowed:
                raise ValueError(f"Status must be one of {allowed}")
        return v


class AircraftResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    aircraft_number: str
    aircraft_model: Optional[str] = None
    airline_name: Optional[str] = None
    fuel_capacity: Optional[float] = None
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None


class AircraftList(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    aircraft_number: str
    aircraft_model: Optional[str] = None
    airline_name: Optional[str] = None
    fuel_capacity: Optional[float] = None
    status: str
    created_at: datetime
