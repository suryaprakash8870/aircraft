import io
import uuid
from datetime import date, datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.aircraft import Aircraft
from app.models.aircraft_filling import AircraftFilling
from app.models.airport import Airport
from app.models.fuel_agent import FuelAgent
from app.models.fuel_purchase import FuelPurchase
from app.models.fuel_stock import FuelStock, FuelStockLog
from app.models.user import User
from app.utils.auth import get_current_active_user

router = APIRouter(prefix="/api/reports", tags=["Reports"])


@router.get("/fuel-purchases")
async def report_fuel_purchases(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    airport_id: Optional[uuid.UUID] = None,
    agent_id: Optional[uuid.UUID] = None,
    format: str = "json",
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(FuelPurchase).options(
        selectinload(FuelPurchase.fuel_agent), selectinload(FuelPurchase.airport)
    )
    if start_date:
        query = query.where(FuelPurchase.purchase_date >= start_date)
    if end_date:
        query = query.where(FuelPurchase.purchase_date <= end_date)
    if airport_id:
        query = query.where(FuelPurchase.airport_id == airport_id)
    if agent_id:
        query = query.where(FuelPurchase.fuel_agent_id == agent_id)
    query = query.order_by(FuelPurchase.purchase_date.desc())

    result = await db.execute(query)
    purchases = result.scalars().all()

    data = [
        {
            "purchase_id": p.purchase_id,
            "purchase_date": str(p.purchase_date),
            "fuel_type": p.fuel_type,
            "quantity_purchased": p.quantity_purchased,
            "purchase_rate": p.purchase_rate,
            "total_amount": p.total_amount,
            "payment_status": p.payment_status,
            "invoice_number": p.invoice_number,
            "agent_name": p.fuel_agent.agent_name if p.fuel_agent else None,
            "airport_name": p.airport.airport_name if p.airport else None,
            "airport_code": p.airport.airport_code if p.airport else None,
        }
        for p in purchases
    ]

    if format == "xlsx":
        return _generate_xlsx_response(
            data,
            headers=[
                "purchase_id", "purchase_date", "fuel_type", "quantity_purchased",
                "purchase_rate", "total_amount", "payment_status", "invoice_number",
                "agent_name", "airport_name", "airport_code",
            ],
            filename="fuel_purchases_report.xlsx",
        )
    return {"data": data, "total": len(data)}


@router.get("/fuel-consumption")
async def report_fuel_consumption(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    aircraft_id: Optional[uuid.UUID] = None,
    airport_id: Optional[uuid.UUID] = None,
    format: str = "json",
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(AircraftFilling).options(
        selectinload(AircraftFilling.aircraft), selectinload(AircraftFilling.airport)
    )
    if start_date:
        query = query.where(AircraftFilling.filling_datetime >= start_date)
    if end_date:
        query = query.where(AircraftFilling.filling_datetime <= end_date)
    if aircraft_id:
        query = query.where(AircraftFilling.aircraft_id == aircraft_id)
    if airport_id:
        query = query.where(AircraftFilling.airport_id == airport_id)
    query = query.order_by(AircraftFilling.filling_datetime.desc())

    result = await db.execute(query)
    fillings = result.scalars().all()

    data = [
        {
            "filling_id": f.filling_id,
            "filling_datetime": str(f.filling_datetime),
            "aircraft_number": f.aircraft.aircraft_number if f.aircraft else None,
            "airline_name": f.aircraft.airline_name if f.aircraft else None,
            "flight_number": f.flight_number,
            "airport_code": f.airport.airport_code if f.airport else None,
            "airport_name": f.airport.airport_name if f.airport else None,
            "quantity_filled": f.quantity_filled,
            "fuel_rate": f.fuel_rate,
            "total_cost": f.total_cost,
        }
        for f in fillings
    ]

    if format == "xlsx":
        return _generate_xlsx_response(
            data,
            headers=[
                "filling_id", "filling_datetime", "aircraft_number", "airline_name",
                "flight_number", "airport_code", "airport_name", "quantity_filled",
                "fuel_rate", "total_cost",
            ],
            filename="fuel_consumption_report.xlsx",
        )
    return {"data": data, "total": len(data)}


@router.get("/airport-stock")
async def report_airport_stock(
    airport_id: Optional[uuid.UUID] = None,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(FuelStock).options(selectinload(FuelStock.airport))
    if airport_id:
        query = query.where(FuelStock.airport_id == airport_id)
    query = query.order_by(FuelStock.last_updated.desc())

    result = await db.execute(query)
    stocks = result.scalars().all()

    data = [
        {
            "airport_name": s.airport.airport_name if s.airport else None,
            "airport_code": s.airport.airport_code if s.airport else None,
            "fuel_type": s.fuel_type,
            "current_stock": s.current_stock,
            "fuel_storage_capacity": s.airport.fuel_storage_capacity if s.airport else None,
            "last_updated": str(s.last_updated),
        }
        for s in stocks
    ]
    return {"data": data, "total": len(data)}


@router.get("/aircraft-history")
async def report_aircraft_history(
    aircraft_id: Optional[uuid.UUID] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    format: str = "json",
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    if not aircraft_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="aircraft_id is required",
        )

    aircraft_result = await db.execute(select(Aircraft).where(Aircraft.id == aircraft_id))
    aircraft = aircraft_result.scalar_one_or_none()
    if not aircraft:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Aircraft not found")

    query = select(AircraftFilling).options(selectinload(AircraftFilling.airport)).where(
        AircraftFilling.aircraft_id == aircraft_id
    )
    if start_date:
        query = query.where(AircraftFilling.filling_datetime >= start_date)
    if end_date:
        query = query.where(AircraftFilling.filling_datetime <= end_date)
    query = query.order_by(AircraftFilling.filling_datetime.desc())

    result = await db.execute(query)
    fillings = result.scalars().all()

    total_qty = sum(f.quantity_filled for f in fillings)
    total_cost = sum(f.total_cost for f in fillings)

    data = {
        "aircraft": {
            "id": str(aircraft.id),
            "aircraft_number": aircraft.aircraft_number,
            "aircraft_model": aircraft.aircraft_model,
            "airline_name": aircraft.airline_name,
        },
        "summary": {
            "total_fillings": len(fillings),
            "total_quantity_filled": total_qty,
            "total_cost": total_cost,
        },
        "fillings": [
            {
                "filling_id": f.filling_id,
                "filling_datetime": str(f.filling_datetime),
                "airport_code": f.airport.airport_code if f.airport else None,
                "airport_name": f.airport.airport_name if f.airport else None,
                "flight_number": f.flight_number,
                "quantity_filled": f.quantity_filled,
                "fuel_rate": f.fuel_rate,
                "total_cost": f.total_cost,
            }
            for f in fillings
        ],
    }
    return data


@router.get("/vendor")
async def report_vendor(
    agent_id: Optional[uuid.UUID] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    format: str = "json",
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    if not agent_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="agent_id is required",
        )

    agent_result = await db.execute(select(FuelAgent).where(FuelAgent.id == agent_id))
    agent = agent_result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fuel agent not found")

    query = select(FuelPurchase).options(selectinload(FuelPurchase.airport)).where(
        FuelPurchase.fuel_agent_id == agent_id
    )
    if start_date:
        query = query.where(FuelPurchase.purchase_date >= start_date)
    if end_date:
        query = query.where(FuelPurchase.purchase_date <= end_date)
    query = query.order_by(FuelPurchase.purchase_date.desc())

    result = await db.execute(query)
    purchases = result.scalars().all()

    total_qty = sum(p.quantity_purchased for p in purchases)
    total_amount = sum(p.total_amount for p in purchases)

    data = {
        "agent": {
            "id": str(agent.id),
            "agent_name": agent.agent_name,
            "company_name": agent.company_name,
            "gst_number": agent.gst_number,
        },
        "summary": {
            "total_purchases": len(purchases),
            "total_quantity": total_qty,
            "total_amount": total_amount,
        },
        "purchases": [
            {
                "purchase_id": p.purchase_id,
                "purchase_date": str(p.purchase_date),
                "airport_code": p.airport.airport_code if p.airport else None,
                "fuel_type": p.fuel_type,
                "quantity_purchased": p.quantity_purchased,
                "purchase_rate": p.purchase_rate,
                "total_amount": p.total_amount,
                "payment_status": p.payment_status,
                "invoice_number": p.invoice_number,
            }
            for p in purchases
        ],
    }
    return data


async def _build_purchases_dataset(db, start_date, end_date, airport_id, agent_id):
    query = select(FuelPurchase).options(
        selectinload(FuelPurchase.fuel_agent), selectinload(FuelPurchase.airport)
    )
    if start_date:
        query = query.where(FuelPurchase.purchase_date >= start_date)
    if end_date:
        query = query.where(FuelPurchase.purchase_date <= end_date)
    if airport_id:
        query = query.where(FuelPurchase.airport_id == airport_id)
    if agent_id:
        query = query.where(FuelPurchase.fuel_agent_id == agent_id)
    query = query.order_by(FuelPurchase.purchase_date.desc())
    result = await db.execute(query)
    records = result.scalars().all()
    rows = [
        {
            "Purchase ID": p.purchase_id,
            "Date": str(p.purchase_date),
            "Fuel Type": p.fuel_type,
            "Quantity (L)": round(p.quantity_purchased, 2),
            "Rate (per L)": round(p.purchase_rate, 2),
            "Total Amount": round(p.total_amount, 2),
            "Payment Status": p.payment_status,
            "Invoice Number": p.invoice_number or "",
            "Agent": p.fuel_agent.agent_name if p.fuel_agent else "",
            "Airport": p.airport.airport_name if p.airport else "",
            "Airport Code": p.airport.airport_code if p.airport else "",
        }
        for p in records
    ]
    return "Fuel Purchases Report", rows


async def _build_consumption_dataset(db, start_date, end_date, airport_id, aircraft_id):
    query = select(AircraftFilling).options(
        selectinload(AircraftFilling.aircraft), selectinload(AircraftFilling.airport)
    )
    if start_date:
        query = query.where(AircraftFilling.filling_datetime >= start_date)
    if end_date:
        query = query.where(AircraftFilling.filling_datetime <= end_date)
    if airport_id:
        query = query.where(AircraftFilling.airport_id == airport_id)
    if aircraft_id:
        query = query.where(AircraftFilling.aircraft_id == aircraft_id)
    query = query.order_by(AircraftFilling.filling_datetime.desc())
    result = await db.execute(query)
    records = result.scalars().all()
    rows = [
        {
            "Filling ID": f.filling_id,
            "Date/Time": str(f.filling_datetime),
            "Aircraft": f.aircraft.aircraft_number if f.aircraft else "",
            "Airline": f.aircraft.airline_name if f.aircraft else "",
            "Flight No.": f.flight_number or "",
            "Airport Code": f.airport.airport_code if f.airport else "",
            "Airport": f.airport.airport_name if f.airport else "",
            "Quantity (L)": round(f.quantity_filled, 2),
            "Rate (per L)": round(f.fuel_rate, 2),
            "Total Cost": round(f.total_cost, 2),
        }
        for f in records
    ]
    return "Fuel Consumption Report", rows


async def _build_airport_stock_dataset(db, airport_id):
    query = select(FuelStock).options(selectinload(FuelStock.airport))
    if airport_id:
        query = query.where(FuelStock.airport_id == airport_id)
    query = query.order_by(FuelStock.last_updated.desc())
    result = await db.execute(query)
    records = result.scalars().all()
    rows = [
        {
            "Airport": s.airport.airport_name if s.airport else "",
            "Code": s.airport.airport_code if s.airport else "",
            "Fuel Type": s.fuel_type,
            "Current Stock (L)": round(s.current_stock, 2),
            "Capacity (L)": round(s.airport.fuel_storage_capacity, 2) if s.airport else 0,
            "Last Updated": str(s.last_updated),
        }
        for s in records
    ]
    return "Airport Stock Report", rows


async def _build_aircraft_history_dataset(db, aircraft_id, start_date, end_date):
    if not aircraft_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="aircraft_id is required for aircraft_history export",
        )
    aircraft_result = await db.execute(select(Aircraft).where(Aircraft.id == aircraft_id))
    aircraft = aircraft_result.scalar_one_or_none()
    if not aircraft:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Aircraft not found")
    query = select(AircraftFilling).options(selectinload(AircraftFilling.airport)).where(
        AircraftFilling.aircraft_id == aircraft_id
    )
    if start_date:
        query = query.where(AircraftFilling.filling_datetime >= start_date)
    if end_date:
        query = query.where(AircraftFilling.filling_datetime <= end_date)
    query = query.order_by(AircraftFilling.filling_datetime.desc())
    result = await db.execute(query)
    records = result.scalars().all()
    rows = [
        {
            "Filling ID": f.filling_id,
            "Date/Time": str(f.filling_datetime),
            "Airport Code": f.airport.airport_code if f.airport else "",
            "Flight No.": f.flight_number or "",
            "Quantity (L)": round(f.quantity_filled, 2),
            "Rate (per L)": round(f.fuel_rate, 2),
            "Total Cost": round(f.total_cost, 2),
        }
        for f in records
    ]
    title = f"Aircraft Fuel History - {aircraft.aircraft_number} ({aircraft.airline_name or ''})"
    return title, rows


async def _build_vendor_dataset(db, agent_id, start_date, end_date):
    if not agent_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="agent_id is required for vendor export",
        )
    agent_result = await db.execute(select(FuelAgent).where(FuelAgent.id == agent_id))
    agent = agent_result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fuel agent not found")
    query = select(FuelPurchase).options(selectinload(FuelPurchase.airport)).where(
        FuelPurchase.fuel_agent_id == agent_id
    )
    if start_date:
        query = query.where(FuelPurchase.purchase_date >= start_date)
    if end_date:
        query = query.where(FuelPurchase.purchase_date <= end_date)
    query = query.order_by(FuelPurchase.purchase_date.desc())
    result = await db.execute(query)
    records = result.scalars().all()
    rows = [
        {
            "Purchase ID": p.purchase_id,
            "Date": str(p.purchase_date),
            "Airport Code": p.airport.airport_code if p.airport else "",
            "Fuel Type": p.fuel_type,
            "Quantity (L)": round(p.quantity_purchased, 2),
            "Rate (per L)": round(p.purchase_rate, 2),
            "Total Amount": round(p.total_amount, 2),
            "Payment Status": p.payment_status,
            "Invoice": p.invoice_number or "",
        }
        for p in records
    ]
    title = f"Vendor Report - {agent.agent_name}"
    return title, rows


@router.get("/export")
async def export_report(
    type: str = "purchases",
    format: str = "xlsx",
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    airport_id: Optional[uuid.UUID] = None,
    agent_id: Optional[uuid.UUID] = None,
    aircraft_id: Optional[uuid.UUID] = None,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Unified export endpoint.

    type:   purchases | consumption | airport_stock | aircraft_history | vendor
    format: xlsx | csv | pdf
    """
    # Build the dataset for the requested type
    if type == "purchases":
        title, data = await _build_purchases_dataset(db, start_date, end_date, airport_id, agent_id)
    elif type == "consumption":
        title, data = await _build_consumption_dataset(db, start_date, end_date, airport_id, aircraft_id)
    elif type == "airport_stock":
        title, data = await _build_airport_stock_dataset(db, airport_id)
    elif type == "aircraft_history":
        title, data = await _build_aircraft_history_dataset(db, aircraft_id, start_date, end_date)
    elif type == "vendor":
        title, data = await _build_vendor_dataset(db, agent_id, start_date, end_date)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="type must be one of: purchases, consumption, airport_stock, aircraft_history, vendor",
        )

    headers = list(data[0].keys()) if data else []
    stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    base_name = f"{type}_report_{stamp}"

    if format == "xlsx":
        return _generate_xlsx_response(data, headers=headers, filename=f"{base_name}.xlsx")
    if format == "csv":
        return _generate_csv_response(data, headers=headers, filename=f"{base_name}.csv")
    if format == "pdf":
        return _generate_pdf_response(data, headers=headers, title=title, filename=f"{base_name}.pdf")

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="format must be one of: xlsx, csv, pdf",
    )


def _generate_csv_response(data: list, headers: list, filename: str) -> StreamingResponse:
    import csv as _csv

    buffer = io.StringIO()
    writer = _csv.DictWriter(buffer, fieldnames=headers, extrasaction="ignore")
    writer.writeheader()
    for row in data:
        writer.writerow(row)
    csv_bytes = buffer.getvalue().encode("utf-8-sig")  # BOM for Excel compatibility
    return StreamingResponse(
        io.BytesIO(csv_bytes),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


def _generate_pdf_response(
    data: list, headers: list, title: str, filename: str
) -> StreamingResponse:
    """Render a landscape-A4 PDF table report with a branded header."""
    from reportlab.lib import colors as _colors
    from reportlab.lib.pagesizes import A4, landscape
    from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
    from reportlab.lib.units import cm
    from reportlab.platypus import (
        Paragraph,
        SimpleDocTemplate,
        Spacer,
        Table,
        TableStyle,
    )

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=landscape(A4),
        leftMargin=1.2 * cm,
        rightMargin=1.2 * cm,
        topMargin=1.2 * cm,
        bottomMargin=1.2 * cm,
        title=title,
    )
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "ReportTitle",
        parent=styles["Title"],
        textColor=_colors.HexColor("#1a3c6e"),
        fontSize=18,
        alignment=0,
        spaceAfter=4,
    )
    sub_style = ParagraphStyle(
        "ReportSub",
        parent=styles["Normal"],
        textColor=_colors.HexColor("#7f8c8d"),
        fontSize=9,
        spaceAfter=10,
    )

    story = [
        Paragraph(f"AeroFuel Management &mdash; {title}", title_style),
        Paragraph(
            f"Generated: {datetime.now().strftime('%d %b %Y, %H:%M')} &nbsp;&nbsp;|&nbsp;&nbsp; Records: {len(data)}",
            sub_style,
        ),
    ]

    if not data:
        story.append(Paragraph("No records found for the selected filters.", styles["Italic"]))
    else:
        # Table data
        table_data = [headers] + [[str(row.get(h, "")) for h in headers] for row in data]

        # Compute column widths to fit landscape A4 (about 27cm usable)
        usable = 25.5 * cm
        col_w = usable / len(headers)
        col_widths = [col_w] * len(headers)

        tbl = Table(table_data, colWidths=col_widths, repeatRows=1)
        tbl.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), _colors.HexColor("#1a3c6e")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), _colors.white),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, 0), 8.5),
                    ("ALIGN", (0, 0), (-1, 0), "CENTER"),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("FONTSIZE", (0, 1), (-1, -1), 7.5),
                    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [_colors.white, _colors.HexColor("#f5f7fa")]),
                    ("GRID", (0, 0), (-1, -1), 0.25, _colors.HexColor("#dfe3e8")),
                    ("LEFTPADDING", (0, 0), (-1, -1), 4),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                    ("TOPPADDING", (0, 0), (-1, -1), 4),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ]
            )
        )
        story.append(tbl)

    doc.build(story)
    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


def _generate_xlsx_response(data: list, headers: list, filename: str) -> StreamingResponse:
    import openpyxl
    from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
    from openpyxl.utils import get_column_letter

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Report"

    header_fill = PatternFill(start_color="1A3C6E", end_color="1A3C6E", fill_type="solid")
    header_font = Font(bold=True, color="FFFFFF", size=11)
    header_alignment = Alignment(horizontal="center", vertical="center")

    thin_border = Border(
        left=Side(style="thin"),
        right=Side(style="thin"),
        top=Side(style="thin"),
        bottom=Side(style="thin"),
    )

    if not headers and data:
        headers = list(data[0].keys())

    for col_idx, header in enumerate(headers, start=1):
        cell = ws.cell(row=1, column=col_idx, value=header)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = header_alignment
        cell.border = thin_border

    alt_fill = PatternFill(start_color="ECF0F1", end_color="ECF0F1", fill_type="solid")
    for row_idx, row_data in enumerate(data, start=2):
        for col_idx, header in enumerate(headers, start=1):
            value = row_data.get(header, "") if isinstance(row_data, dict) else row_data[col_idx - 1]
            cell = ws.cell(row=row_idx, column=col_idx, value=value)
            cell.border = thin_border
            cell.alignment = Alignment(vertical="center")
            if row_idx % 2 == 0:
                cell.fill = alt_fill

    for col_idx in range(1, len(headers) + 1):
        max_length = 0
        col_letter = get_column_letter(col_idx)
        for cell in ws[col_letter]:
            try:
                if cell.value and len(str(cell.value)) > max_length:
                    max_length = len(str(cell.value))
            except Exception:
                pass
        ws.column_dimensions[col_letter].width = min(max_length + 4, 40)

    ws.row_dimensions[1].height = 25

    buffer = io.BytesIO()
    wb.save(buffer)
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
