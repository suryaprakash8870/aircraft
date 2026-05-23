import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.airport import Airport
from app.models.fuel_stock import FuelStock
from app.models.user import User
from app.schemas.airport import AirportCreate, AirportList, AirportResponse, AirportUpdate
from app.schemas.common import MessageResponse, PaginatedResponse
from app.utils.audit import log_action
from app.utils.auth import get_current_active_user, require_operator_or_admin
from app.utils.pagination import PaginationParams, paginate

router = APIRouter(prefix="/api/airports", tags=["Airports"])


async def _enrich_airport(airport: Airport, db: AsyncSession) -> dict:
    stock_result = await db.execute(
        select(FuelStock).where(FuelStock.airport_id == airport.id)
    )
    stocks = stock_result.scalars().all()
    current_stock = sum(s.current_stock for s in stocks)
    data = {
        "id": airport.id,
        "airport_name": airport.airport_name,
        "airport_code": airport.airport_code,
        "city": airport.city,
        "country": airport.country,
        "fuel_storage_capacity": airport.fuel_storage_capacity,
        "current_stock": current_stock,
        "created_at": airport.created_at,
        "updated_at": airport.updated_at,
    }
    return data


@router.get("", response_model=PaginatedResponse[AirportList])
async def list_airports(
    search: Optional[str] = None,
    pagination: PaginationParams = Depends(),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Airport)
    if search:
        query = query.where(
            Airport.airport_name.ilike(f"%{search}%")
            | Airport.airport_code.ilike(f"%{search}%")
            | Airport.city.ilike(f"%{search}%")
        )
    query = query.order_by(Airport.created_at.desc())

    items, total, pages = await paginate(db, query, pagination.page, pagination.page_size)

    enriched = []
    for airport in items:
        enriched.append(AirportList(**await _enrich_airport(airport, db)))

    return PaginatedResponse(
        items=enriched,
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
        pages=pages,
    )


@router.post("", response_model=AirportResponse, status_code=status.HTTP_201_CREATED)
async def create_airport(
    airport_in: AirportCreate,
    request: Request,
    current_user: User = Depends(require_operator_or_admin),
    db: AsyncSession = Depends(get_db),
):
    existing = await db.execute(
        select(Airport).where(Airport.airport_code == airport_in.airport_code)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Airport code already exists",
        )

    airport = Airport(**airport_in.model_dump())
    db.add(airport)
    await db.flush()

    ip_address = request.client.host if request.client else None
    await log_action(
        db,
        user_id=current_user.id,
        action="create",
        entity_type="airport",
        entity_id=str(airport.id),
        new_values={"airport_name": airport.airport_name, "airport_code": airport.airport_code},
        ip_address=ip_address,
    )
    await db.commit()
    await db.refresh(airport)
    return AirportResponse(**await _enrich_airport(airport, db))


@router.get("/{airport_id}", response_model=AirportResponse)
async def get_airport(
    airport_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Airport).where(Airport.id == airport_id))
    airport = result.scalar_one_or_none()
    if not airport:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Airport not found")
    return AirportResponse(**await _enrich_airport(airport, db))


@router.put("/{airport_id}", response_model=AirportResponse)
async def update_airport(
    airport_id: uuid.UUID,
    airport_in: AirportUpdate,
    request: Request,
    current_user: User = Depends(require_operator_or_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Airport).where(Airport.id == airport_id))
    airport = result.scalar_one_or_none()
    if not airport:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Airport not found")

    old_values = {
        "airport_name": airport.airport_name,
        "airport_code": airport.airport_code,
    }

    if airport_in.airport_code is not None and airport_in.airport_code != airport.airport_code:
        existing = await db.execute(
            select(Airport).where(
                Airport.airport_code == airport_in.airport_code,
                Airport.id != airport_id,
            )
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Airport code already in use"
            )

    update_data = airport_in.model_dump(exclude_none=True)
    for field, value in update_data.items():
        setattr(airport, field, value)

    ip_address = request.client.host if request.client else None
    await log_action(
        db,
        user_id=current_user.id,
        action="update",
        entity_type="airport",
        entity_id=str(airport.id),
        old_values=old_values,
        new_values=update_data,
        ip_address=ip_address,
    )
    await db.commit()
    await db.refresh(airport)
    return AirportResponse(**await _enrich_airport(airport, db))


@router.delete("/{airport_id}", response_model=MessageResponse)
async def delete_airport(
    airport_id: uuid.UUID,
    request: Request,
    current_user: User = Depends(require_operator_or_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Airport).where(Airport.id == airport_id))
    airport = result.scalar_one_or_none()
    if not airport:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Airport not found")

    await db.delete(airport)

    ip_address = request.client.host if request.client else None
    await log_action(
        db,
        user_id=current_user.id,
        action="delete",
        entity_type="airport",
        entity_id=str(airport_id),
        ip_address=ip_address,
    )
    await db.commit()
    return MessageResponse(message="Airport deleted successfully")
