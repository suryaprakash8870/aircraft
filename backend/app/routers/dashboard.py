from datetime import datetime, date, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.aircraft_filling import AircraftFilling
from app.models.airport import Airport
from app.models.fuel_agent import FuelAgent
from app.models.fuel_purchase import FuelPurchase
from app.models.fuel_stock import FuelStock, FuelStockLog
from app.models.user import User
from app.schemas.dashboard import (
    AirportStockSummary,
    AirportUsageData,
    DashboardStats,
    MonthlyConsumptionData,
    MonthlyPurchaseData,
    RecentTransaction,
    VendorAnalyticsData,
)
from app.utils.auth import get_current_active_user

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    total_stock_result = await db.execute(select(func.sum(FuelStock.current_stock)))
    total_stock = total_stock_result.scalar_one() or 0.0

    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    monthly_purchased_result = await db.execute(
        select(func.sum(FuelPurchase.quantity_purchased)).where(
            FuelPurchase.created_at >= month_start
        )
    )
    monthly_purchased = monthly_purchased_result.scalar_one() or 0.0

    monthly_consumed_result = await db.execute(
        select(func.sum(AircraftFilling.quantity_filled)).where(
            AircraftFilling.filling_datetime >= month_start
        )
    )
    monthly_consumed = monthly_consumed_result.scalar_one() or 0.0

    total_aircraft_fueled_result = await db.execute(
        select(func.count(AircraftFilling.id)).where(
            AircraftFilling.filling_datetime >= month_start
        )
    )
    total_aircraft_fueled = total_aircraft_fueled_result.scalar_one() or 0

    airports_result = await db.execute(select(Airport))
    airports = airports_result.scalars().all()

    airport_stock_summary = []
    for airport in airports:
        stock_result = await db.execute(
            select(func.sum(FuelStock.current_stock)).where(
                FuelStock.airport_id == airport.id
            )
        )
        current_stock = stock_result.scalar_one() or 0.0
        airport_stock_summary.append(
            AirportStockSummary(
                airport_id=str(airport.id),
                airport_name=airport.airport_name,
                airport_code=airport.airport_code,
                current_stock=current_stock,
                fuel_storage_capacity=airport.fuel_storage_capacity,
            )
        )

    return DashboardStats(
        total_stock=total_stock,
        monthly_purchased=monthly_purchased,
        monthly_consumed=monthly_consumed,
        total_aircraft_fueled=total_aircraft_fueled,
        airport_stock_summary=airport_stock_summary,
    )


@router.get("/charts/monthly-purchase", response_model=list[MonthlyPurchaseData])
async def monthly_purchase_chart(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    now = datetime.now(timezone.utc)
    result = []

    for i in range(11, -1, -1):
        month_date = now - timedelta(days=30 * i)
        month_start = month_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if month_date.month == 12:
            month_end = month_date.replace(year=month_date.year + 1, month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        else:
            month_end = month_date.replace(month=month_date.month + 1, day=1, hour=0, minute=0, second=0, microsecond=0)

        qty_result = await db.execute(
            select(func.sum(FuelPurchase.quantity_purchased)).where(
                FuelPurchase.created_at >= month_start,
                FuelPurchase.created_at < month_end,
            )
        )
        amount_result = await db.execute(
            select(func.sum(FuelPurchase.total_amount)).where(
                FuelPurchase.created_at >= month_start,
                FuelPurchase.created_at < month_end,
            )
        )
        result.append(
            MonthlyPurchaseData(
                month=month_start.strftime("%b %Y"),
                quantity=qty_result.scalar_one() or 0.0,
                amount=amount_result.scalar_one() or 0.0,
            )
        )
    return result


@router.get("/charts/monthly-consumption", response_model=list[MonthlyConsumptionData])
async def monthly_consumption_chart(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    now = datetime.now(timezone.utc)
    result = []

    for i in range(11, -1, -1):
        month_date = now - timedelta(days=30 * i)
        month_start = month_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if month_date.month == 12:
            month_end = month_date.replace(year=month_date.year + 1, month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        else:
            month_end = month_date.replace(month=month_date.month + 1, day=1, hour=0, minute=0, second=0, microsecond=0)

        qty_result = await db.execute(
            select(func.sum(AircraftFilling.quantity_filled)).where(
                AircraftFilling.filling_datetime >= month_start,
                AircraftFilling.filling_datetime < month_end,
            )
        )
        result.append(
            MonthlyConsumptionData(
                month=month_start.strftime("%b %Y"),
                quantity=qty_result.scalar_one() or 0.0,
            )
        )
    return result


@router.get("/charts/vendor-analytics", response_model=list[VendorAnalyticsData])
async def vendor_analytics_chart(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(
            FuelAgent.agent_name,
            func.sum(FuelPurchase.quantity_purchased).label("total_quantity"),
            func.sum(FuelPurchase.total_amount).label("total_amount"),
        )
        .join(FuelPurchase, FuelPurchase.fuel_agent_id == FuelAgent.id)
        .group_by(FuelAgent.id, FuelAgent.agent_name)
        .order_by(func.sum(FuelPurchase.total_amount).desc())
    )
    rows = result.all()
    return [
        VendorAnalyticsData(
            agent_name=row.agent_name,
            total_quantity=row.total_quantity or 0.0,
            total_amount=row.total_amount or 0.0,
        )
        for row in rows
    ]


@router.get("/charts/airport-usage", response_model=list[AirportUsageData])
async def airport_usage_chart(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    airports_result = await db.execute(select(Airport))
    airports = airports_result.scalars().all()

    result = []
    for airport in airports:
        stock_result = await db.execute(
            select(func.sum(FuelStock.current_stock)).where(FuelStock.airport_id == airport.id)
        )
        consumed_result = await db.execute(
            select(func.sum(AircraftFilling.quantity_filled)).where(
                AircraftFilling.airport_id == airport.id
            )
        )
        result.append(
            AirportUsageData(
                airport_code=airport.airport_code,
                airport_name=airport.airport_name,
                stock=stock_result.scalar_one() or 0.0,
                consumed=consumed_result.scalar_one() or 0.0,
            )
        )
    return result


@router.get("/recent-transactions", response_model=list[RecentTransaction])
async def recent_transactions(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    purchases_result = await db.execute(
        select(FuelPurchase)
        .order_by(FuelPurchase.created_at.desc())
        .limit(5)
    )
    purchases = purchases_result.scalars().all()

    fillings_result = await db.execute(
        select(AircraftFilling)
        .order_by(AircraftFilling.filling_datetime.desc())
        .limit(5)
    )
    fillings = fillings_result.scalars().all()

    transactions = []
    for p in purchases:
        transactions.append(
            RecentTransaction(
                id=str(p.id),
                type="purchase",
                reference_id=p.purchase_id,
                description=f"Fuel purchase - {p.fuel_type}",
                quantity=p.quantity_purchased,
                amount=p.total_amount,
                date=p.purchase_date.isoformat(),
                status=p.payment_status,
            )
        )
    for f in fillings:
        transactions.append(
            RecentTransaction(
                id=str(f.id),
                type="filling",
                reference_id=f.filling_id,
                description=f"Aircraft filling - {f.flight_number or 'N/A'}",
                quantity=f.quantity_filled,
                amount=f.total_cost,
                date=f.filling_datetime.isoformat(),
                status=None,
            )
        )

    transactions.sort(key=lambda x: x.date, reverse=True)
    return transactions[:10]
