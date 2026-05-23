import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.aircraft import Aircraft
from app.models.user import User
from app.schemas.aircraft import AircraftCreate, AircraftList, AircraftResponse, AircraftUpdate
from app.schemas.common import MessageResponse, PaginatedResponse
from app.utils.audit import log_action
from app.utils.auth import get_current_active_user, require_operator_or_admin
from app.utils.pagination import PaginationParams, paginate

router = APIRouter(prefix="/api/aircrafts", tags=["Aircrafts"])


@router.get("", response_model=PaginatedResponse[AircraftList])
async def list_aircrafts(
    search: Optional[str] = None,
    status_filter: Optional[str] = None,
    pagination: PaginationParams = Depends(),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Aircraft)
    if search:
        query = query.where(
            Aircraft.aircraft_number.ilike(f"%{search}%")
            | Aircraft.aircraft_model.ilike(f"%{search}%")
            | Aircraft.airline_name.ilike(f"%{search}%")
        )
    if status_filter:
        query = query.where(Aircraft.status == status_filter)
    query = query.order_by(Aircraft.created_at.desc())

    items, total, pages = await paginate(db, query, pagination.page, pagination.page_size)
    return PaginatedResponse(
        items=items,
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
        pages=pages,
    )


@router.post("", response_model=AircraftResponse, status_code=status.HTTP_201_CREATED)
async def create_aircraft(
    aircraft_in: AircraftCreate,
    request: Request,
    current_user: User = Depends(require_operator_or_admin),
    db: AsyncSession = Depends(get_db),
):
    existing = await db.execute(
        select(Aircraft).where(Aircraft.aircraft_number == aircraft_in.aircraft_number)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Aircraft number already registered",
        )

    aircraft = Aircraft(**aircraft_in.model_dump())
    db.add(aircraft)
    await db.flush()

    ip_address = request.client.host if request.client else None
    await log_action(
        db,
        user_id=current_user.id,
        action="create",
        entity_type="aircraft",
        entity_id=str(aircraft.id),
        new_values={"aircraft_number": aircraft.aircraft_number},
        ip_address=ip_address,
    )
    await db.commit()
    await db.refresh(aircraft)
    return aircraft


@router.get("/{aircraft_id}", response_model=AircraftResponse)
async def get_aircraft(
    aircraft_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Aircraft).where(Aircraft.id == aircraft_id))
    aircraft = result.scalar_one_or_none()
    if not aircraft:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Aircraft not found")
    return aircraft


@router.put("/{aircraft_id}", response_model=AircraftResponse)
async def update_aircraft(
    aircraft_id: uuid.UUID,
    aircraft_in: AircraftUpdate,
    request: Request,
    current_user: User = Depends(require_operator_or_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Aircraft).where(Aircraft.id == aircraft_id))
    aircraft = result.scalar_one_or_none()
    if not aircraft:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Aircraft not found")

    old_values = {"aircraft_number": aircraft.aircraft_number, "status": aircraft.status}

    if aircraft_in.aircraft_number is not None and aircraft_in.aircraft_number != aircraft.aircraft_number:
        existing = await db.execute(
            select(Aircraft).where(
                Aircraft.aircraft_number == aircraft_in.aircraft_number,
                Aircraft.id != aircraft_id,
            )
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Aircraft number already in use",
            )

    update_data = aircraft_in.model_dump(exclude_none=True)
    for field, value in update_data.items():
        setattr(aircraft, field, value)

    ip_address = request.client.host if request.client else None
    await log_action(
        db,
        user_id=current_user.id,
        action="update",
        entity_type="aircraft",
        entity_id=str(aircraft.id),
        old_values=old_values,
        new_values=update_data,
        ip_address=ip_address,
    )
    await db.commit()
    await db.refresh(aircraft)
    return aircraft


@router.delete("/{aircraft_id}", response_model=MessageResponse)
async def delete_aircraft(
    aircraft_id: uuid.UUID,
    request: Request,
    current_user: User = Depends(require_operator_or_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Aircraft).where(Aircraft.id == aircraft_id))
    aircraft = result.scalar_one_or_none()
    if not aircraft:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Aircraft not found")

    aircraft.status = "inactive"

    ip_address = request.client.host if request.client else None
    await log_action(
        db,
        user_id=current_user.id,
        action="delete",
        entity_type="aircraft",
        entity_id=str(aircraft_id),
        ip_address=ip_address,
    )
    await db.commit()
    return MessageResponse(message="Aircraft deactivated successfully")
