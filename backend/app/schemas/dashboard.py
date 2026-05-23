from typing import Any, Optional
from pydantic import BaseModel


class AirportStockSummary(BaseModel):
    airport_id: str
    airport_name: str
    airport_code: str
    current_stock: float
    fuel_storage_capacity: float


class DashboardStats(BaseModel):
    total_stock: float
    monthly_purchased: float
    monthly_consumed: float
    total_aircraft_fueled: int
    airport_stock_summary: list[AirportStockSummary]


class MonthlyPurchaseData(BaseModel):
    month: str
    quantity: float
    amount: float


class MonthlyConsumptionData(BaseModel):
    month: str
    quantity: float


class VendorAnalyticsData(BaseModel):
    agent_name: str
    total_quantity: float
    total_amount: float


class AirportUsageData(BaseModel):
    airport_code: str
    airport_name: str
    stock: float
    consumed: float


class RecentTransaction(BaseModel):
    id: str
    type: str
    reference_id: str
    description: str
    quantity: float
    amount: Optional[float] = None
    date: str
    status: Optional[str] = None
