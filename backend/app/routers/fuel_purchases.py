import os
import uuid
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_db
from app.models.airport import Airport
from app.models.fuel_agent import FuelAgent
from app.models.fuel_purchase import FuelPurchase
from app.models.user import User
from app.schemas.common import MessageResponse, PaginatedResponse
from app.schemas.fuel_purchase import FuelPurchaseCreate, FuelPurchaseResponse, FuelPurchaseUpdate
from app.services.stock_service import reverse_purchase_stock, update_stock_on_purchase
from app.utils.audit import log_action
from app.utils.auth import get_current_active_user, require_operator_or_admin
from app.utils.id_generator import generate_purchase_id
from app.utils.pagination import PaginationParams, paginate

router = APIRouter(prefix="/api/fuel-purchases", tags=["Fuel Purchases"])
settings = get_settings()

ALLOWED_INVOICE_TYPES = {"application/pdf", "image/jpeg", "image/png", "image/jpg"}
MAX_FILE_SIZE_MB = 10


async def _get_purchase_with_relations(purchase_id: uuid.UUID, db: AsyncSession) -> FuelPurchase:
    result = await db.execute(
        select(FuelPurchase)
        .options(selectinload(FuelPurchase.fuel_agent), selectinload(FuelPurchase.airport))
        .where(FuelPurchase.id == purchase_id)
    )
    return result.scalar_one_or_none()


@router.get("", response_model=PaginatedResponse[FuelPurchaseResponse])
async def list_fuel_purchases(
    airport_id: Optional[uuid.UUID] = None,
    agent_id: Optional[uuid.UUID] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    payment_status: Optional[str] = None,
    fuel_type: Optional[str] = None,
    pagination: PaginationParams = Depends(),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(FuelPurchase).options(
        selectinload(FuelPurchase.fuel_agent), selectinload(FuelPurchase.airport)
    )
    if airport_id:
        query = query.where(FuelPurchase.airport_id == airport_id)
    if agent_id:
        query = query.where(FuelPurchase.fuel_agent_id == agent_id)
    if start_date:
        query = query.where(FuelPurchase.purchase_date >= start_date)
    if end_date:
        query = query.where(FuelPurchase.purchase_date <= end_date)
    if payment_status:
        query = query.where(FuelPurchase.payment_status == payment_status)
    if fuel_type:
        query = query.where(FuelPurchase.fuel_type == fuel_type)
    query = query.order_by(FuelPurchase.created_at.desc())

    items, total, pages = await paginate(db, query, pagination.page, pagination.page_size)
    return PaginatedResponse(
        items=items,
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
        pages=pages,
    )


@router.post("", response_model=FuelPurchaseResponse, status_code=status.HTTP_201_CREATED)
async def create_fuel_purchase(
    purchase_in: FuelPurchaseCreate,
    request: Request,
    current_user: User = Depends(require_operator_or_admin),
    db: AsyncSession = Depends(get_db),
):
    agent = await db.execute(select(FuelAgent).where(FuelAgent.id == purchase_in.fuel_agent_id))
    if not agent.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fuel agent not found")

    airport = await db.execute(select(Airport).where(Airport.id == purchase_in.airport_id))
    if not airport.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Airport not found")

    purchase_id_str = generate_purchase_id()
    total_amount = round(purchase_in.quantity_purchased * purchase_in.purchase_rate, 2)

    purchase = FuelPurchase(
        purchase_id=purchase_id_str,
        fuel_agent_id=purchase_in.fuel_agent_id,
        airport_id=purchase_in.airport_id,
        fuel_type=purchase_in.fuel_type,
        quantity_purchased=purchase_in.quantity_purchased,
        purchase_rate=purchase_in.purchase_rate,
        total_amount=total_amount,
        purchase_date=purchase_in.purchase_date,
        invoice_number=purchase_in.invoice_number,
        payment_status=purchase_in.payment_status,
        remarks=purchase_in.remarks,
        created_by=current_user.id,
    )
    db.add(purchase)
    await db.flush()

    await update_stock_on_purchase(
        db,
        airport_id=purchase_in.airport_id,
        fuel_type=purchase_in.fuel_type,
        quantity=purchase_in.quantity_purchased,
        purchase_id=purchase.id,
        user_id=current_user.id,
    )

    ip_address = request.client.host if request.client else None
    await log_action(
        db,
        user_id=current_user.id,
        action="create",
        entity_type="fuel_purchase",
        entity_id=str(purchase.id),
        new_values={"purchase_id": purchase_id_str, "total_amount": total_amount},
        ip_address=ip_address,
    )
    await db.commit()
    purchase_with_rel = await _get_purchase_with_relations(purchase.id, db)
    return purchase_with_rel


@router.get("/{purchase_id}", response_model=FuelPurchaseResponse)
async def get_fuel_purchase(
    purchase_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    purchase = await _get_purchase_with_relations(purchase_id, db)
    if not purchase:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Fuel purchase not found"
        )
    return purchase


@router.put("/{purchase_id}", response_model=FuelPurchaseResponse)
async def update_fuel_purchase(
    purchase_id: uuid.UUID,
    purchase_in: FuelPurchaseUpdate,
    request: Request,
    current_user: User = Depends(require_operator_or_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(FuelPurchase).where(FuelPurchase.id == purchase_id))
    purchase = result.scalar_one_or_none()
    if not purchase:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Fuel purchase not found"
        )

    old_values = {
        "quantity_purchased": purchase.quantity_purchased,
        "purchase_rate": purchase.purchase_rate,
        "total_amount": purchase.total_amount,
        "airport_id": str(purchase.airport_id),
        "fuel_type": purchase.fuel_type,
        "payment_status": purchase.payment_status,
    }

    old_qty = purchase.quantity_purchased
    old_airport_id = purchase.airport_id
    old_fuel_type = purchase.fuel_type

    update_data = purchase_in.model_dump(exclude_none=True)
    for field, value in update_data.items():
        setattr(purchase, field, value)

    new_qty = purchase.quantity_purchased
    new_airport_id = purchase.airport_id
    new_fuel_type = purchase.fuel_type
    purchase.total_amount = round(purchase.quantity_purchased * purchase.purchase_rate, 2)

    if old_airport_id != new_airport_id or old_fuel_type != new_fuel_type or old_qty != new_qty:
        await reverse_purchase_stock(
            db,
            airport_id=old_airport_id,
            fuel_type=old_fuel_type,
            quantity=old_qty,
            purchase_id=purchase.id,
            user_id=current_user.id,
        )
        await update_stock_on_purchase(
            db,
            airport_id=new_airport_id,
            fuel_type=new_fuel_type,
            quantity=new_qty,
            purchase_id=purchase.id,
            user_id=current_user.id,
        )

    ip_address = request.client.host if request.client else None
    await log_action(
        db,
        user_id=current_user.id,
        action="update",
        entity_type="fuel_purchase",
        entity_id=str(purchase.id),
        old_values=old_values,
        new_values=update_data,
        ip_address=ip_address,
    )
    await db.commit()
    purchase_with_rel = await _get_purchase_with_relations(purchase.id, db)
    return purchase_with_rel


@router.delete("/{purchase_id}", response_model=MessageResponse)
async def delete_fuel_purchase(
    purchase_id: uuid.UUID,
    request: Request,
    current_user: User = Depends(require_operator_or_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(FuelPurchase).where(FuelPurchase.id == purchase_id))
    purchase = result.scalar_one_or_none()
    if not purchase:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Fuel purchase not found"
        )

    await reverse_purchase_stock(
        db,
        airport_id=purchase.airport_id,
        fuel_type=purchase.fuel_type,
        quantity=purchase.quantity_purchased,
        purchase_id=purchase.id,
        user_id=current_user.id,
    )

    if purchase.invoice_document:
        file_path = os.path.join(settings.UPLOAD_DIR, "invoices", purchase.invoice_document)
        if os.path.exists(file_path):
            os.remove(file_path)

    ip_address = request.client.host if request.client else None
    await log_action(
        db,
        user_id=current_user.id,
        action="delete",
        entity_type="fuel_purchase",
        entity_id=str(purchase_id),
        ip_address=ip_address,
    )
    await db.delete(purchase)
    await db.commit()
    return MessageResponse(message="Fuel purchase deleted successfully")


@router.post("/{purchase_id}/upload-invoice", response_model=FuelPurchaseResponse)
async def upload_invoice(
    purchase_id: uuid.UUID,
    file: UploadFile = File(...),
    current_user: User = Depends(require_operator_or_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(FuelPurchase).where(FuelPurchase.id == purchase_id))
    purchase = result.scalar_one_or_none()
    if not purchase:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Fuel purchase not found"
        )

    if file.content_type not in ALLOWED_INVOICE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed: PDF, JPG, PNG",
        )

    content = await file.read()
    if len(content) > MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Maximum size: {MAX_FILE_SIZE_MB}MB",
        )

    upload_dir = os.path.join(settings.UPLOAD_DIR, "invoices")
    os.makedirs(upload_dir, exist_ok=True)

    ext = os.path.splitext(file.filename or "file")[1] or ".pdf"
    filename = f"{purchase.purchase_id}{ext}"
    file_path = os.path.join(upload_dir, filename)
    with open(file_path, "wb") as f:
        f.write(content)

    if purchase.invoice_document and purchase.invoice_document != filename:
        old_path = os.path.join(upload_dir, purchase.invoice_document)
        if os.path.exists(old_path):
            os.remove(old_path)

    purchase.invoice_document = filename
    await db.commit()
    purchase_with_rel = await _get_purchase_with_relations(purchase.id, db)
    return purchase_with_rel
