import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.schemas.common import MessageResponse, PaginatedResponse
from app.schemas.user import PasswordChange, UserCreate, UserList, UserResponse, UserUpdate
from app.utils.audit import log_action
from app.utils.auth import (
    get_current_active_user,
    hash_password,
    require_admin,
    verify_password,
)
from app.utils.pagination import PaginationParams, paginate

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.get("", response_model=PaginatedResponse[UserList])
async def list_users(
    search: Optional[str] = None,
    role: Optional[str] = None,
    is_active: Optional[bool] = None,
    pagination: PaginationParams = Depends(),
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    query = select(User)
    if search:
        query = query.where(
            or_(
                User.email.ilike(f"%{search}%"),
                User.username.ilike(f"%{search}%"),
                User.full_name.ilike(f"%{search}%"),
            )
        )
    if role:
        query = query.where(User.role == role)
    if is_active is not None:
        query = query.where(User.is_active == is_active)
    query = query.order_by(User.created_at.desc())

    items, total, pages = await paginate(db, query, pagination.page, pagination.page_size)
    return PaginatedResponse(
        items=items,
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
        pages=pages,
    )


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_in: UserCreate,
    request: Request,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    existing = await db.execute(
        select(User).where(
            or_(User.email == user_in.email, User.username == user_in.username)
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email or username already registered",
        )

    user = User(
        email=user_in.email,
        username=user_in.username,
        hashed_password=hash_password(user_in.password),
        full_name=user_in.full_name,
        role=user_in.role,
    )
    db.add(user)
    await db.flush()

    ip_address = request.client.host if request.client else None
    await log_action(
        db,
        user_id=current_user.id,
        action="create",
        entity_type="user",
        entity_id=str(user.id),
        new_values={"email": user.email, "username": user.username, "role": user.role},
        ip_address=ip_address,
    )
    await db.commit()
    await db.refresh(user)
    return user


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: uuid.UUID,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: uuid.UUID,
    user_in: UserUpdate,
    request: Request,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    old_values = {
        "email": user.email,
        "username": user.username,
        "role": user.role,
        "is_active": user.is_active,
    }

    if user_in.email is not None:
        existing = await db.execute(
            select(User).where(User.email == user_in.email, User.id != user_id)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Email already in use"
            )
        user.email = user_in.email
    if user_in.username is not None:
        existing = await db.execute(
            select(User).where(User.username == user_in.username, User.id != user_id)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Username already in use"
            )
        user.username = user_in.username
    if user_in.full_name is not None:
        user.full_name = user_in.full_name
    if user_in.role is not None:
        user.role = user_in.role
    if user_in.is_active is not None:
        user.is_active = user_in.is_active

    ip_address = request.client.host if request.client else None
    await log_action(
        db,
        user_id=current_user.id,
        action="update",
        entity_type="user",
        entity_id=str(user.id),
        old_values=old_values,
        new_values=user_in.model_dump(exclude_none=True),
        ip_address=ip_address,
    )
    await db.commit()
    await db.refresh(user)
    return user


@router.delete("/{user_id}", response_model=MessageResponse)
async def delete_user(
    user_id: uuid.UUID,
    request: Request,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot deactivate yourself"
        )
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.is_active = False

    ip_address = request.client.host if request.client else None
    await log_action(
        db,
        user_id=current_user.id,
        action="delete",
        entity_type="user",
        entity_id=str(user.id),
        ip_address=ip_address,
    )
    await db.commit()
    return MessageResponse(message="User deactivated successfully")


@router.put("/{user_id}/password", response_model=MessageResponse)
async def change_password(
    user_id: uuid.UUID,
    body: PasswordChange,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "admin" and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to change this user's password",
        )

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if current_user.id == user_id:
        if not verify_password(body.current_password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect"
            )

    user.hashed_password = hash_password(body.new_password)

    ip_address = request.client.host if request.client else None
    await log_action(
        db,
        user_id=current_user.id,
        action="update",
        entity_type="user",
        entity_id=str(user.id),
        new_values={"password": "changed"},
        ip_address=ip_address,
    )
    await db.commit()
    return MessageResponse(message="Password changed successfully")
