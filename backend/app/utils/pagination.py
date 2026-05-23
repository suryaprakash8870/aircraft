import math
from typing import Any, TypeVar

from fastapi import Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

T = TypeVar("T")


class PaginationParams:
    def __init__(
        self,
        page: int = Query(default=1, ge=1, description="Page number"),
        page_size: int = Query(default=20, ge=1, le=1000, description="Items per page"),
    ):
        self.page = page
        self.page_size = page_size


async def paginate(
    db: AsyncSession,
    query,
    page: int,
    page_size: int,
) -> tuple[list[Any], int, int]:
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    offset = (page - 1) * page_size
    paginated_query = query.offset(offset).limit(page_size)
    result = await db.execute(paginated_query)
    items = result.scalars().all()

    pages = math.ceil(total / page_size) if total > 0 else 1
    return list(items), total, pages
