import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.schemas.airport import AirportList


class FuelStockResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    airport_id: uuid.UUID
    fuel_type: str
    current_stock: float
    last_updated: datetime
    airport: Optional[AirportList] = None


class FuelStockLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    airport_id: uuid.UUID
    fuel_type: str
    transaction_type: str
    quantity: float
    reference_id: Optional[uuid.UUID] = None
    reference_type: Optional[str] = None
    notes: Optional[str] = None
    created_by: Optional[uuid.UUID] = None
    created_at: datetime
    airport: Optional[AirportList] = None


class StockAdjustmentRequest(BaseModel):
    airport_id: uuid.UUID
    fuel_type: str = "ATF"
    quantity: float
    notes: Optional[str] = None
