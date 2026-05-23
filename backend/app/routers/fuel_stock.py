import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.airport import Airport
from app.models.fuel_stock import FuelStock, FuelStockLog
from app.models.user import User
from app.schemas.common import MessageResponse, PaginatedResponse
from app.schemas.fuel_stock import FuelStockLogResponse, FuelStockResponse, StockAdjustmentRequest
from app.services.stock_service import manual_adjustment
from app.utils.audit import log_action
from app.utils.auth import get_current_active_user, require_operator_or_admin
from app.utils.pagination import PaginationParams, paginate

router = APIRouter(prefix="/api/fuel-stock", tags=["Fuel Stock"])


@router.get("", response_model=list[FuelStockResponse])
async def list_all_stocks(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(FuelStock)
        .options(selectinload(FuelStock.airport))
        .order_by(FuelStock.last_updated.desc())
    )
    stocks = result.scalars().all()
    return stocks


@router.get("/airport/{airport_id}", response_model=list[FuelStockResponse])
async def get_airport_stock(
    airport_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    airport_result = await db.execute(select(Airport).where(Airport.id == airport_id))
    if not airport_result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Airport not found")

    result = await db.execute(
        select(FuelStock)
        .options(selectinload(FuelStock.airport))
        .where(FuelStock.airport_id == airport_id)
    )
    stocks = result.scalars().all()
    return stocks


@router.post("/adjustment", response_model=FuelStockResponse)
async def adjust_stock(
    body: StockAdjustmentRequest,
    request: Request,
    current_user: User = Depends(require_operator_or_admin),
    db: AsyncSession = Depends(get_db),
):
    airport_result = await db.execute(select(Airport).where(Airport.id == body.airport_id))
    if not airport_result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Airport not found")

    stock = await manual_adjustment(
        db,
        airport_id=body.airport_id,
        fuel_type=body.fuel_type,
        quantity=body.quantity,
        notes=body.notes,
        user_id=current_user.id,
    )

    ip_address = request.client.host if request.client else None
    await log_action(
        db,
        user_id=current_user.id,
        action="update",
        entity_type="fuel_stock",
        entity_id=str(stock.id),
        new_values={
            "airport_id": str(body.airport_id),
            "quantity_adjusted": body.quantity,
            "notes": body.notes,
        },
        ip_address=ip_address,
    )
    await db.commit()
    await db.refresh(stock)

    result = await db.execute(
        select(FuelStock)
        .options(selectinload(FuelStock.airport))
        .where(FuelStock.id == stock.id)
    )
    return result.scalar_one()


@router.get("/logs", response_model=PaginatedResponse[FuelStockLogResponse])
async def list_stock_logs(
    airport_id: Optional[uuid.UUID] = None,
    transaction_type: Optional[str] = None,
    pagination: PaginationParams = Depends(),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(FuelStockLog).options(selectinload(FuelStockLog.airport))
    if airport_id:
        query = query.where(FuelStockLog.airport_id == airport_id)
    if transaction_type:
        query = query.where(FuelStockLog.transaction_type == transaction_type)
    query = query.order_by(FuelStockLog.created_at.desc())

    items, total, pages = await paginate(db, query, pagination.page, pagination.page_size)
    return PaginatedResponse(
        items=items,
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
        pages=pages,
    )
