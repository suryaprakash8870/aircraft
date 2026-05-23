import uuid
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.aircraft import Aircraft
from app.models.aircraft_filling import AircraftFilling
from app.models.airport import Airport
from app.models.user import User
from app.schemas.aircraft_filling import (
    AircraftFillingCreate,
    AircraftFillingResponse,
    AircraftFillingUpdate,
)
from app.schemas.common import MessageResponse, PaginatedResponse
from app.services.stock_service import deduct_stock_on_filling, reverse_filling_stock
from app.utils.audit import log_action
from app.utils.auth import get_current_active_user, require_operator_or_admin
from app.utils.id_generator import generate_filling_id
from app.utils.pagination import PaginationParams, paginate

router = APIRouter(prefix="/api/aircraft-filling", tags=["Aircraft Filling"])

FUEL_TYPE_DEFAULT = "ATF"


async def _get_filling_with_relations(filling_id: uuid.UUID, db: AsyncSession) -> AircraftFilling:
    result = await db.execute(
        select(AircraftFilling)
        .options(
            selectinload(AircraftFilling.aircraft),
            selectinload(AircraftFilling.airport),
        )
        .where(AircraftFilling.id == filling_id)
    )
    return result.scalar_one_or_none()


@router.get("", response_model=PaginatedResponse[AircraftFillingResponse])
async def list_fillings(
    aircraft_id: Optional[uuid.UUID] = None,
    airport_id: Optional[uuid.UUID] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    pagination: PaginationParams = Depends(),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(AircraftFilling).options(
        selectinload(AircraftFilling.aircraft),
        selectinload(AircraftFilling.airport),
    )
    if aircraft_id:
        query = query.where(AircraftFilling.aircraft_id == aircraft_id)
    if airport_id:
        query = query.where(AircraftFilling.airport_id == airport_id)
    if start_date:
        query = query.where(AircraftFilling.filling_datetime >= start_date)
    if end_date:
        query = query.where(AircraftFilling.filling_datetime <= end_date)
    query = query.order_by(AircraftFilling.filling_datetime.desc())

    items, total, pages = await paginate(db, query, pagination.page, pagination.page_size)
    return PaginatedResponse(
        items=items,
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
        pages=pages,
    )


@router.post("", response_model=AircraftFillingResponse, status_code=status.HTTP_201_CREATED)
async def create_filling(
    filling_in: AircraftFillingCreate,
    request: Request,
    current_user: User = Depends(require_operator_or_admin),
    db: AsyncSession = Depends(get_db),
):
    aircraft_result = await db.execute(
        select(Aircraft).where(Aircraft.id == filling_in.aircraft_id)
    )
    if not aircraft_result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Aircraft not found")

    airport_result = await db.execute(
        select(Airport).where(Airport.id == filling_in.airport_id)
    )
    if not airport_result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Airport not found")

    filling_id_str = generate_filling_id()
    total_cost = round(filling_in.quantity_filled * filling_in.fuel_rate, 2)

    filling = AircraftFilling(
        filling_id=filling_id_str,
        aircraft_id=filling_in.aircraft_id,
        airport_id=filling_in.airport_id,
        quantity_filled=filling_in.quantity_filled,
        fuel_rate=filling_in.fuel_rate,
        total_cost=total_cost,
        filled_by=current_user.id,
        filling_datetime=filling_in.filling_datetime,
        flight_number=filling_in.flight_number,
        remarks=filling_in.remarks,
    )
    db.add(filling)
    await db.flush()

    await deduct_stock_on_filling(
        db,
        airport_id=filling_in.airport_id,
        fuel_type=FUEL_TYPE_DEFAULT,
        quantity=filling_in.quantity_filled,
        filling_id=filling.id,
        user_id=current_user.id,
    )

    ip_address = request.client.host if request.client else None
    await log_action(
        db,
        user_id=current_user.id,
        action="create",
        entity_type="aircraft_filling",
        entity_id=str(filling.id),
        new_values={"filling_id": filling_id_str, "total_cost": total_cost},
        ip_address=ip_address,
    )
    await db.commit()
    return await _get_filling_with_relations(filling.id, db)


@router.get("/{filling_id}", response_model=AircraftFillingResponse)
async def get_filling(
    filling_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    filling = await _get_filling_with_relations(filling_id, db)
    if not filling:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Aircraft filling not found"
        )
    return filling


@router.put("/{filling_id}", response_model=AircraftFillingResponse)
async def update_filling(
    filling_id: uuid.UUID,
    filling_in: AircraftFillingUpdate,
    request: Request,
    current_user: User = Depends(require_operator_or_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(AircraftFilling).where(AircraftFilling.id == filling_id))
    filling = result.scalar_one_or_none()
    if not filling:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Aircraft filling not found"
        )

    old_values = {
        "quantity_filled": filling.quantity_filled,
        "fuel_rate": filling.fuel_rate,
        "total_cost": filling.total_cost,
        "airport_id": str(filling.airport_id),
    }
    old_qty = filling.quantity_filled
    old_airport_id = filling.airport_id

    update_data = filling_in.model_dump(exclude_none=True)
    for field, value in update_data.items():
        setattr(filling, field, value)

    new_qty = filling.quantity_filled
    new_airport_id = filling.airport_id
    filling.total_cost = round(filling.quantity_filled * filling.fuel_rate, 2)

    if old_airport_id != new_airport_id or old_qty != new_qty:
        await reverse_filling_stock(
            db,
            airport_id=old_airport_id,
            fuel_type=FUEL_TYPE_DEFAULT,
            quantity=old_qty,
            filling_id=filling.id,
            user_id=current_user.id,
        )
        await deduct_stock_on_filling(
            db,
            airport_id=new_airport_id,
            fuel_type=FUEL_TYPE_DEFAULT,
            quantity=new_qty,
            filling_id=filling.id,
            user_id=current_user.id,
        )

    ip_address = request.client.host if request.client else None
    await log_action(
        db,
        user_id=current_user.id,
        action="update",
        entity_type="aircraft_filling",
        entity_id=str(filling.id),
        old_values=old_values,
        new_values=update_data,
        ip_address=ip_address,
    )
    await db.commit()
    return await _get_filling_with_relations(filling.id, db)


@router.delete("/{filling_id}", response_model=MessageResponse)
async def delete_filling(
    filling_id: uuid.UUID,
    request: Request,
    current_user: User = Depends(require_operator_or_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(AircraftFilling).where(AircraftFilling.id == filling_id))
    filling = result.scalar_one_or_none()
    if not filling:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Aircraft filling not found"
        )

    await reverse_filling_stock(
        db,
        airport_id=filling.airport_id,
        fuel_type=FUEL_TYPE_DEFAULT,
        quantity=filling.quantity_filled,
        filling_id=filling.id,
        user_id=current_user.id,
    )

    ip_address = request.client.host if request.client else None
    await log_action(
        db,
        user_id=current_user.id,
        action="delete",
        entity_type="aircraft_filling",
        entity_id=str(filling_id),
        ip_address=ip_address,
    )
    await db.delete(filling)
    await db.commit()
    return MessageResponse(message="Aircraft filling deleted successfully")
