import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.aircraft_filling import AircraftFilling
from app.models.fuel_purchase import FuelPurchase
from app.models.fuel_stock import FuelStock, FuelStockLog
from app.models.user import User
from app.services.pdf_service import (
    generate_analytics_pdf,
    generate_filling_pdf,
    generate_purchase_pdf,
    generate_stock_report_pdf,
)
from app.utils.auth import get_current_active_user

router = APIRouter(prefix="/api/pdf", tags=["PDF Generation"])


def _model_to_dict(obj) -> dict:
    if obj is None:
        return {}
    result = {}
    for col in obj.__table__.columns:
        val = getattr(obj, col.name)
        result[col.name] = str(val) if hasattr(val, 'isoformat') else val
    return result


@router.get("/purchase/{purchase_id}")
async def download_purchase_pdf(
    purchase_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(FuelPurchase)
        .options(selectinload(FuelPurchase.fuel_agent), selectinload(FuelPurchase.airport))
        .where(FuelPurchase.id == purchase_id)
    )
    purchase = result.scalar_one_or_none()
    if not purchase:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fuel purchase not found")

    purchase_data = _model_to_dict(purchase)
    purchase_data["fuel_agent"] = _model_to_dict(purchase.fuel_agent) if purchase.fuel_agent else {}
    purchase_data["airport"] = _model_to_dict(purchase.airport) if purchase.airport else {}

    pdf_bytes = generate_purchase_pdf(purchase_data)

    return StreamingResponse(
        iter([pdf_bytes]),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=purchase_{purchase.purchase_id}.pdf"
        },
    )


@router.get("/filling/{filling_id}")
async def download_filling_pdf(
    filling_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(AircraftFilling)
        .options(
            selectinload(AircraftFilling.aircraft),
            selectinload(AircraftFilling.airport),
        )
        .where(AircraftFilling.id == filling_id)
    )
    filling = result.scalar_one_or_none()
    if not filling:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Aircraft filling not found")

    filling_data = _model_to_dict(filling)
    filling_data["aircraft"] = _model_to_dict(filling.aircraft) if filling.aircraft else {}
    filling_data["airport"] = _model_to_dict(filling.airport) if filling.airport else {}

    pdf_bytes = generate_filling_pdf(filling_data)

    return StreamingResponse(
        iter([pdf_bytes]),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=filling_{filling.filling_id}.pdf"
        },
    )


@router.get("/stock-report")
async def download_stock_report_pdf(
    airport_id: Optional[uuid.UUID] = None,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy.orm import selectinload as sl

    stocks_query = select(FuelStock).options(selectinload(FuelStock.airport))
    if airport_id:
        stocks_query = stocks_query.where(FuelStock.airport_id == airport_id)
    stocks_result = await db.execute(stocks_query)
    stocks = stocks_result.scalars().all()

    logs_query = select(FuelStockLog).options(selectinload(FuelStockLog.airport))
    if airport_id:
        logs_query = logs_query.where(FuelStockLog.airport_id == airport_id)
    logs_query = logs_query.order_by(FuelStockLog.created_at.desc()).limit(50)
    logs_result = await db.execute(logs_query)
    logs = logs_result.scalars().all()

    def stock_to_dict(s):
        d = _model_to_dict(s)
        d["airport"] = _model_to_dict(s.airport) if s.airport else {}
        return d

    stock_data = [stock_to_dict(s) for s in stocks]
    logs_data = [stock_to_dict(l) for l in logs]

    pdf_bytes = generate_stock_report_pdf(stock_data, logs_data)

    return StreamingResponse(
        iter([pdf_bytes]),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=stock_report.pdf"},
    )


@router.get("/analytics")
async def download_analytics_pdf(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy import func
    from app.models.airport import Airport
    from app.models.aircraft_filling import AircraftFilling
    from app.models.fuel_agent import FuelAgent
    from app.models.fuel_purchase import FuelPurchase

    total_purchased = await db.execute(select(func.sum(FuelPurchase.quantity_purchased)))
    total_amount = await db.execute(select(func.sum(FuelPurchase.total_amount)))
    total_consumed = await db.execute(select(func.sum(AircraftFilling.quantity_filled)))
    aircraft_count = await db.execute(select(func.count(AircraftFilling.id.distinct())))

    vendor_result = await db.execute(
        select(
            FuelAgent.agent_name,
            func.sum(FuelPurchase.quantity_purchased).label("total_quantity"),
            func.sum(FuelPurchase.total_amount).label("total_amount"),
        )
        .join(FuelPurchase, FuelPurchase.fuel_agent_id == FuelAgent.id)
        .group_by(FuelAgent.id, FuelAgent.agent_name)
        .order_by(func.sum(FuelPurchase.total_amount).desc())
    )
    vendor_rows = vendor_result.all()

    airports_result = await db.execute(select(Airport))
    airports = airports_result.scalars().all()
    airport_usage = []
    for airport in airports:
        stock_result = await db.execute(
            select(func.sum(FuelStock.current_stock)).where(FuelStock.airport_id == airport.id)
        )
        consumed_result = await db.execute(
            select(func.sum(AircraftFilling.quantity_filled)).where(
                AircraftFilling.airport_id == airport.id
            )
        )
        airport_usage.append({
            "airport_name": airport.airport_name,
            "airport_code": airport.airport_code,
            "stock": stock_result.scalar_one() or 0.0,
            "consumed": consumed_result.scalar_one() or 0.0,
        })

    analytics_data = {
        "summary": {
            "total_purchased": total_purchased.scalar_one() or 0.0,
            "total_purchase_amount": total_amount.scalar_one() or 0.0,
            "total_consumed": total_consumed.scalar_one() or 0.0,
            "total_aircraft_serviced": aircraft_count.scalar_one() or 0,
            "active_airports": len(airports),
        },
        "vendor_analytics": [
            {"agent_name": r.agent_name, "total_quantity": r.total_quantity or 0.0, "total_amount": r.total_amount or 0.0}
            for r in vendor_rows
        ],
        "airport_usage": airport_usage,
    }
    date_range = {
        "start_date": start_date or "All time",
        "end_date": end_date or "Present",
    }

    pdf_bytes = generate_analytics_pdf(analytics_data, date_range)

    return StreamingResponse(
        iter([pdf_bytes]),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=analytics_report.pdf"},
    )
