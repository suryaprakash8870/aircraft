import uuid
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.fuel_stock import FuelStock, FuelStockLog


async def _get_or_create_stock(
    db: AsyncSession, airport_id: uuid.UUID, fuel_type: str
) -> FuelStock:
    result = await db.execute(
        select(FuelStock).where(
            FuelStock.airport_id == airport_id,
            FuelStock.fuel_type == fuel_type,
        )
    )
    stock = result.scalar_one_or_none()
    if stock is None:
        stock = FuelStock(
            airport_id=airport_id,
            fuel_type=fuel_type,
            current_stock=0.0,
        )
        db.add(stock)
        await db.flush()
    return stock


async def update_stock_on_purchase(
    db: AsyncSession,
    airport_id: uuid.UUID,
    fuel_type: str,
    quantity: float,
    purchase_id: uuid.UUID,
    user_id: Optional[uuid.UUID],
) -> None:
    stock = await _get_or_create_stock(db, airport_id, fuel_type)
    stock.current_stock += quantity

    log = FuelStockLog(
        airport_id=airport_id,
        fuel_type=fuel_type,
        transaction_type="purchase",
        quantity=quantity,
        reference_id=purchase_id,
        reference_type="fuel_purchase",
        notes=f"Stock added from purchase",
        created_by=user_id,
    )
    db.add(log)
    await db.flush()


async def reverse_purchase_stock(
    db: AsyncSession,
    airport_id: uuid.UUID,
    fuel_type: str,
    quantity: float,
    purchase_id: uuid.UUID,
    user_id: Optional[uuid.UUID],
) -> None:
    stock = await _get_or_create_stock(db, airport_id, fuel_type)
    stock.current_stock = max(0.0, stock.current_stock - quantity)

    log = FuelStockLog(
        airport_id=airport_id,
        fuel_type=fuel_type,
        transaction_type="adjustment",
        quantity=-quantity,
        reference_id=purchase_id,
        reference_type="fuel_purchase",
        notes="Stock reversed due to purchase deletion",
        created_by=user_id,
    )
    db.add(log)
    await db.flush()


async def deduct_stock_on_filling(
    db: AsyncSession,
    airport_id: uuid.UUID,
    fuel_type: str,
    quantity: float,
    filling_id: uuid.UUID,
    user_id: Optional[uuid.UUID],
) -> None:
    stock = await _get_or_create_stock(db, airport_id, fuel_type)
    if stock.current_stock < quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Insufficient fuel stock at airport. "
                f"Available: {stock.current_stock:.2f} L, Required: {quantity:.2f} L"
            ),
        )
    stock.current_stock -= quantity

    log = FuelStockLog(
        airport_id=airport_id,
        fuel_type=fuel_type,
        transaction_type="filling",
        quantity=-quantity,
        reference_id=filling_id,
        reference_type="aircraft_filling",
        notes="Stock deducted for aircraft filling",
        created_by=user_id,
    )
    db.add(log)
    await db.flush()


async def reverse_filling_stock(
    db: AsyncSession,
    airport_id: uuid.UUID,
    fuel_type: str,
    quantity: float,
    filling_id: uuid.UUID,
    user_id: Optional[uuid.UUID],
) -> None:
    stock = await _get_or_create_stock(db, airport_id, fuel_type)
    stock.current_stock += quantity

    log = FuelStockLog(
        airport_id=airport_id,
        fuel_type=fuel_type,
        transaction_type="adjustment",
        quantity=quantity,
        reference_id=filling_id,
        reference_type="aircraft_filling",
        notes="Stock restored due to filling deletion",
        created_by=user_id,
    )
    db.add(log)
    await db.flush()


async def manual_adjustment(
    db: AsyncSession,
    airport_id: uuid.UUID,
    fuel_type: str,
    quantity: float,
    notes: Optional[str],
    user_id: Optional[uuid.UUID],
) -> FuelStock:
    stock = await _get_or_create_stock(db, airport_id, fuel_type)
    stock.current_stock = max(0.0, stock.current_stock + quantity)

    log = FuelStockLog(
        airport_id=airport_id,
        fuel_type=fuel_type,
        transaction_type="adjustment",
        quantity=quantity,
        reference_id=None,
        reference_type="manual",
        notes=notes or "Manual stock adjustment",
        created_by=user_id,
    )
    db.add(log)
    await db.flush()
    await db.refresh(stock)
    return stock
