from app.schemas.common import PaginatedResponse, MessageResponse
from app.schemas.auth import LoginRequest, TokenResponse, TokenRefreshRequest, UserMe
from app.schemas.user import UserCreate, UserUpdate, UserResponse, UserList, PasswordChange
from app.schemas.fuel_agent import FuelAgentCreate, FuelAgentUpdate, FuelAgentResponse, FuelAgentList
from app.schemas.airport import AirportCreate, AirportUpdate, AirportResponse, AirportList
from app.schemas.fuel_purchase import FuelPurchaseCreate, FuelPurchaseUpdate, FuelPurchaseResponse
from app.schemas.fuel_stock import FuelStockResponse, FuelStockLogResponse, StockAdjustmentRequest
from app.schemas.aircraft import AircraftCreate, AircraftUpdate, AircraftResponse, AircraftList
from app.schemas.aircraft_filling import AircraftFillingCreate, AircraftFillingUpdate, AircraftFillingResponse
from app.schemas.dashboard import DashboardStats, MonthlyPurchaseData, MonthlyConsumptionData, VendorAnalyticsData, AirportUsageData, RecentTransaction
from app.schemas.audit_log import AuditLogResponse

__all__ = [
    "PaginatedResponse",
    "MessageResponse",
    "LoginRequest",
    "TokenResponse",
    "TokenRefreshRequest",
    "UserMe",
    "UserCreate",
    "UserUpdate",
    "UserResponse",
    "UserList",
    "PasswordChange",
    "FuelAgentCreate",
    "FuelAgentUpdate",
    "FuelAgentResponse",
    "FuelAgentList",
    "AirportCreate",
    "AirportUpdate",
    "AirportResponse",
    "AirportList",
    "FuelPurchaseCreate",
    "FuelPurchaseUpdate",
    "FuelPurchaseResponse",
    "FuelStockResponse",
    "FuelStockLogResponse",
    "StockAdjustmentRequest",
    "AircraftCreate",
    "AircraftUpdate",
    "AircraftResponse",
    "AircraftList",
    "AircraftFillingCreate",
    "AircraftFillingUpdate",
    "AircraftFillingResponse",
    "DashboardStats",
    "MonthlyPurchaseData",
    "MonthlyConsumptionData",
    "VendorAnalyticsData",
    "AirportUsageData",
    "RecentTransaction",
    "AuditLogResponse",
]
