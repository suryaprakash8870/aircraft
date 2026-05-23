import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.fuel_agent import FuelAgent
from app.models.user import User
from app.schemas.common import MessageResponse, PaginatedResponse
from app.schemas.fuel_agent import FuelAgentCreate, FuelAgentList, FuelAgentResponse, FuelAgentUpdate
from app.utils.audit import log_action
from app.utils.auth import get_current_active_user, require_operator_or_admin
from app.utils.pagination import PaginationParams, paginate

router = APIRouter(prefix="/api/fuel-agents", tags=["Fuel Agents"])


@router.get("", response_model=PaginatedResponse[FuelAgentList])
async def list_fuel_agents(
    search: Optional[str] = None,
    status: Optional[str] = None,
    pagination: PaginationParams = Depends(),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(FuelAgent)
    if search:
        query = query.where(
            FuelAgent.agent_name.ilike(f"%{search}%")
            | FuelAgent.company_name.ilike(f"%{search}%")
            | FuelAgent.contact_person.ilike(f"%{search}%")
        )
    if status:
        query = query.where(FuelAgent.status == status)
    query = query.order_by(FuelAgent.created_at.desc())

    items, total, pages = await paginate(db, query, pagination.page, pagination.page_size)
    return PaginatedResponse(
        items=items,
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
        pages=pages,
    )


@router.post("", response_model=FuelAgentResponse, status_code=status.HTTP_201_CREATED)
async def create_fuel_agent(
    agent_in: FuelAgentCreate,
    request: Request,
    current_user: User = Depends(require_operator_or_admin),
    db: AsyncSession = Depends(get_db),
):
    agent = FuelAgent(**agent_in.model_dump())
    db.add(agent)
    await db.flush()

    ip_address = request.client.host if request.client else None
    await log_action(
        db,
        user_id=current_user.id,
        action="create",
        entity_type="fuel_agent",
        entity_id=str(agent.id),
        new_values={"agent_name": agent.agent_name},
        ip_address=ip_address,
    )
    await db.commit()
    await db.refresh(agent)
    return agent


@router.get("/{agent_id}", response_model=FuelAgentResponse)
async def get_fuel_agent(
    agent_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(FuelAgent).where(FuelAgent.id == agent_id))
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fuel agent not found")
    return agent


@router.put("/{agent_id}", response_model=FuelAgentResponse)
async def update_fuel_agent(
    agent_id: uuid.UUID,
    agent_in: FuelAgentUpdate,
    request: Request,
    current_user: User = Depends(require_operator_or_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(FuelAgent).where(FuelAgent.id == agent_id))
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fuel agent not found")

    old_values = {
        "agent_name": agent.agent_name,
        "status": agent.status,
    }
    update_data = agent_in.model_dump(exclude_none=True)
    for field, value in update_data.items():
        setattr(agent, field, value)

    ip_address = request.client.host if request.client else None
    await log_action(
        db,
        user_id=current_user.id,
        action="update",
        entity_type="fuel_agent",
        entity_id=str(agent.id),
        old_values=old_values,
        new_values=update_data,
        ip_address=ip_address,
    )
    await db.commit()
    await db.refresh(agent)
    return agent


@router.delete("/{agent_id}", response_model=MessageResponse)
async def delete_fuel_agent(
    agent_id: uuid.UUID,
    request: Request,
    current_user: User = Depends(require_operator_or_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(FuelAgent).where(FuelAgent.id == agent_id))
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fuel agent not found")

    agent.status = "inactive"

    ip_address = request.client.host if request.client else None
    await log_action(
        db,
        user_id=current_user.id,
        action="delete",
        entity_type="fuel_agent",
        entity_id=str(agent.id),
        ip_address=ip_address,
    )
    await db.commit()
    return MessageResponse(message="Fuel agent deactivated successfully")
