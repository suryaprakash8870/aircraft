import io
from datetime import datetime
from typing import Any

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm, mm
from reportlab.platypus import (
    HRFlowable,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from app.config import get_settings

settings = get_settings()

BRAND_BLUE = colors.HexColor("#1a3c6e")
BRAND_LIGHT_BLUE = colors.HexColor("#2980b9")
BRAND_GRAY = colors.HexColor("#7f8c8d")
BRAND_LIGHT_GRAY = colors.HexColor("#ecf0f1")
WHITE = colors.white
BLACK = colors.black


def _base_styles():
    styles = getSampleStyleSheet()
    styles.add(
        ParagraphStyle(
            name="HeaderTitle",
            fontSize=22,
            textColor=WHITE,
            alignment=TA_LEFT,
            fontName="Helvetica-Bold",
            spaceAfter=4,
        )
    )
    styles.add(
        ParagraphStyle(
            name="HeaderSubtitle",
            fontSize=11,
            textColor=colors.HexColor("#cce0ff"),
            alignment=TA_LEFT,
            fontName="Helvetica",
        )
    )
    styles.add(
        ParagraphStyle(
            name="SectionTitle",
            fontSize=12,
            textColor=BRAND_BLUE,
            fontName="Helvetica-Bold",
            spaceAfter=6,
            spaceBefore=12,
        )
    )
    styles.add(
        ParagraphStyle(
            name="FieldLabel",
            fontSize=9,
            textColor=BRAND_GRAY,
            fontName="Helvetica",
        )
    )
    styles.add(
        ParagraphStyle(
            name="FieldValue",
            fontSize=10,
            textColor=BLACK,
            fontName="Helvetica",
        )
    )
    styles.add(
        ParagraphStyle(
            name="FooterText",
            fontSize=8,
            textColor=BRAND_GRAY,
            alignment=TA_CENTER,
            fontName="Helvetica",
        )
    )
    return styles


def _header_table(title: str, subtitle: str, ref_label: str, ref_value: str, styles):
    header_data = [
        [
            Paragraph(settings.COMPANY_NAME, styles["HeaderTitle"]),
            Paragraph(ref_label, ParagraphStyle("rl", fontSize=9, textColor=colors.HexColor("#cce0ff"), fontName="Helvetica", alignment=TA_RIGHT)),
        ],
        [
            Paragraph(subtitle, styles["HeaderSubtitle"]),
            Paragraph(ref_value, ParagraphStyle("rv", fontSize=12, textColor=WHITE, fontName="Helvetica-Bold", alignment=TA_RIGHT)),
        ],
    ]
    header_table = Table(header_data, colWidths=[12 * cm, 6.5 * cm])
    header_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), BRAND_BLUE),
                ("TEXTCOLOR", (0, 0), (-1, -1), WHITE),
                ("TOPPADDING", (0, 0), (-1, -1), 14),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 14),
                ("LEFTPADDING", (0, 0), (0, -1), 18),
                ("RIGHTPADDING", (-1, 0), (-1, -1), 18),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ]
        )
    )
    return header_table


def _two_col_detail_table(left_items: list, right_items: list, styles):
    max_rows = max(len(left_items), len(right_items))
    data = []
    for i in range(max_rows):
        left = left_items[i] if i < len(left_items) else ("", "")
        right = right_items[i] if i < len(right_items) else ("", "")
        data.append(
            [
                Paragraph(left[0], styles["FieldLabel"]),
                Paragraph(str(left[1]), styles["FieldValue"]),
                Paragraph(right[0], styles["FieldLabel"]),
                Paragraph(str(right[1]), styles["FieldValue"]),
            ]
        )
    t = Table(data, colWidths=[3.5 * cm, 6 * cm, 3.5 * cm, 6 * cm])
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), BRAND_LIGHT_GRAY),
                ("ROWBACKGROUNDS", (0, 0), (-1, -1), [WHITE, BRAND_LIGHT_GRAY]),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
            ]
        )
    )
    return t


def generate_purchase_pdf(purchase_data: dict) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=1.5 * cm,
        rightMargin=1.5 * cm,
        topMargin=1.5 * cm,
        bottomMargin=2 * cm,
    )
    styles = _base_styles()
    story = []

    story.append(
        _header_table(
            title=settings.COMPANY_NAME,
            subtitle="Fuel Purchase Invoice",
            ref_label="Purchase ID",
            ref_value=purchase_data.get("purchase_id", "N/A"),
            styles=styles,
        )
    )
    story.append(Spacer(1, 8 * mm))

    purchase_date = purchase_data.get("purchase_date", "N/A")
    created_at = purchase_data.get("created_at", "N/A")
    if isinstance(created_at, datetime):
        created_at = created_at.strftime("%d %b %Y %H:%M")

    story.append(Paragraph("Purchase Details", styles["SectionTitle"]))
    story.append(
        _two_col_detail_table(
            left_items=[
                ("Purchase ID", purchase_data.get("purchase_id", "N/A")),
                ("Fuel Type", purchase_data.get("fuel_type", "N/A")),
                ("Quantity", f"{purchase_data.get('quantity_purchased', 0):,.2f} L"),
            ],
            right_items=[
                ("Purchase Date", str(purchase_date)),
                ("Invoice No.", purchase_data.get("invoice_number", "N/A") or "N/A"),
                ("Payment Status", purchase_data.get("payment_status", "N/A").upper()),
            ],
            styles=styles,
        )
    )
    story.append(Spacer(1, 6 * mm))

    agent = purchase_data.get("fuel_agent") or {}
    story.append(Paragraph("Fuel Agent Information", styles["SectionTitle"]))
    story.append(
        _two_col_detail_table(
            left_items=[
                ("Agent Name", agent.get("agent_name", "N/A")),
                ("Company", agent.get("company_name", "N/A") or "N/A"),
                ("GST Number", agent.get("gst_number", "N/A") or "N/A"),
            ],
            right_items=[
                ("Contact Person", agent.get("contact_person", "N/A") or "N/A"),
                ("Phone", agent.get("phone", "N/A") or "N/A"),
                ("Email", agent.get("email", "N/A") or "N/A"),
            ],
            styles=styles,
        )
    )
    story.append(Spacer(1, 6 * mm))

    airport = purchase_data.get("airport") or {}
    story.append(Paragraph("Airport Information", styles["SectionTitle"]))
    story.append(
        _two_col_detail_table(
            left_items=[
                ("Airport Name", airport.get("airport_name", "N/A")),
                ("Airport Code", airport.get("airport_code", "N/A")),
            ],
            right_items=[
                ("City", airport.get("city", "N/A") or "N/A"),
                ("Country", airport.get("country", "N/A") or "N/A"),
            ],
            styles=styles,
        )
    )
    story.append(Spacer(1, 6 * mm))

    story.append(Paragraph("Payment Summary", styles["SectionTitle"]))
    rate = purchase_data.get("purchase_rate", 0)
    qty = purchase_data.get("quantity_purchased", 0)
    total = purchase_data.get("total_amount", 0)
    payment_data = [
        ["Description", "Quantity (L)", "Rate (per L)", "Amount (INR)"],
        [
            purchase_data.get("fuel_type", "Fuel"),
            f"{qty:,.2f}",
            f"₹{rate:,.2f}",
            f"₹{total:,.2f}",
        ],
        ["", "", "Total Amount", f"₹{total:,.2f}"],
    ]
    payment_table = Table(
        payment_data, colWidths=[6 * cm, 3.5 * cm, 3.5 * cm, 3.5 * cm]
    )
    payment_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), BRAND_BLUE),
                ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, 0), 10),
                ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
                ("ROWBACKGROUNDS", (0, 1), (-1, -2), [WHITE, BRAND_LIGHT_GRAY]),
                ("BACKGROUND", (0, -1), (-1, -1), BRAND_LIGHT_BLUE),
                ("TEXTCOLOR", (0, -1), (-1, -1), WHITE),
                ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("BOX", (0, 0), (-1, -1), 0.5, BRAND_GRAY),
                ("LINEABOVE", (0, -1), (-1, -1), 1, BRAND_BLUE),
            ]
        )
    )
    story.append(payment_table)

    if purchase_data.get("remarks"):
        story.append(Spacer(1, 6 * mm))
        story.append(Paragraph("Remarks", styles["SectionTitle"]))
        story.append(Paragraph(purchase_data["remarks"], styles["FieldValue"]))

    story.append(Spacer(1, 12 * mm))
    sig_data = [
        ["Prepared By", "", "Authorized Signatory"],
        ["", "", ""],
        ["________________________", "", "________________________"],
        ["Date: " + datetime.now().strftime("%d %b %Y"), "", settings.COMPANY_NAME],
    ]
    sig_table = Table(sig_data, colWidths=[6 * cm, 6.5 * cm, 6 * cm])
    sig_table.setStyle(
        TableStyle(
            [
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("TOPPADDING", (0, 2), (-1, 2), 20),
                ("TEXTCOLOR", (0, 0), (-1, -1), BRAND_BLUE),
            ]
        )
    )
    story.append(sig_table)

    story.append(Spacer(1, 6 * mm))
    story.append(HRFlowable(width="100%", thickness=0.5, color=BRAND_GRAY))
    story.append(Spacer(1, 3 * mm))
    story.append(
        Paragraph(
            f"Generated on {datetime.now().strftime('%d %b %Y %H:%M')} | {settings.COMPANY_NAME} | Confidential Document",
            styles["FooterText"],
        )
    )

    doc.build(story)
    return buffer.getvalue()


def generate_filling_pdf(filling_data: dict) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=1.5 * cm,
        rightMargin=1.5 * cm,
        topMargin=1.5 * cm,
        bottomMargin=2 * cm,
    )
    styles = _base_styles()
    story = []

    story.append(
        _header_table(
            title=settings.COMPANY_NAME,
            subtitle="Aircraft Fueling Receipt",
            ref_label="Filling ID",
            ref_value=filling_data.get("filling_id", "N/A"),
            styles=styles,
        )
    )
    story.append(Spacer(1, 8 * mm))

    aircraft = filling_data.get("aircraft") or {}
    story.append(Paragraph("Aircraft Details", styles["SectionTitle"]))
    story.append(
        _two_col_detail_table(
            left_items=[
                ("Aircraft Number", aircraft.get("aircraft_number", "N/A")),
                ("Aircraft Model", aircraft.get("aircraft_model", "N/A") or "N/A"),
            ],
            right_items=[
                ("Airline", aircraft.get("airline_name", "N/A") or "N/A"),
                ("Flight Number", filling_data.get("flight_number", "N/A") or "N/A"),
            ],
            styles=styles,
        )
    )
    story.append(Spacer(1, 6 * mm))

    airport = filling_data.get("airport") or {}
    story.append(Paragraph("Airport & Filling Details", styles["SectionTitle"]))
    filling_dt = filling_data.get("filling_datetime", "N/A")
    if isinstance(filling_dt, datetime):
        filling_dt = filling_dt.strftime("%d %b %Y %H:%M")

    story.append(
        _two_col_detail_table(
            left_items=[
                ("Airport", airport.get("airport_name", "N/A")),
                ("Airport Code", airport.get("airport_code", "N/A")),
                ("Filling Date/Time", str(filling_dt)),
            ],
            right_items=[
                ("City", airport.get("city", "N/A") or "N/A"),
                ("Filling ID", filling_data.get("filling_id", "N/A")),
                ("", ""),
            ],
            styles=styles,
        )
    )
    story.append(Spacer(1, 6 * mm))

    story.append(Paragraph("Cost Breakdown", styles["SectionTitle"]))
    qty = filling_data.get("quantity_filled", 0)
    rate = filling_data.get("fuel_rate", 0)
    total = filling_data.get("total_cost", 0)
    cost_data = [
        ["Description", "Quantity (L)", "Rate (per L)", "Total (INR)"],
        ["ATF Fuel", f"{qty:,.2f}", f"₹{rate:,.2f}", f"₹{total:,.2f}"],
        ["", "", "Grand Total", f"₹{total:,.2f}"],
    ]
    cost_table = Table(cost_data, colWidths=[6 * cm, 3.5 * cm, 3.5 * cm, 3.5 * cm])
    cost_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), BRAND_BLUE),
                ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
                ("ROWBACKGROUNDS", (0, 1), (-1, -2), [WHITE, BRAND_LIGHT_GRAY]),
                ("BACKGROUND", (0, -1), (-1, -1), BRAND_LIGHT_BLUE),
                ("TEXTCOLOR", (0, -1), (-1, -1), WHITE),
                ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("BOX", (0, 0), (-1, -1), 0.5, BRAND_GRAY),
            ]
        )
    )
    story.append(cost_table)

    if filling_data.get("remarks"):
        story.append(Spacer(1, 6 * mm))
        story.append(Paragraph("Remarks", styles["SectionTitle"]))
        story.append(Paragraph(filling_data["remarks"], styles["FieldValue"]))

    story.append(Spacer(1, 12 * mm))
    sig_data = [
        ["Aircraft Captain / Operator", "", "Fuel Station Operator"],
        ["", "", ""],
        ["________________________", "", "________________________"],
        [datetime.now().strftime("%d %b %Y"), "", settings.COMPANY_NAME],
    ]
    sig_table = Table(sig_data, colWidths=[6 * cm, 6.5 * cm, 6 * cm])
    sig_table.setStyle(
        TableStyle(
            [
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("TOPPADDING", (0, 2), (-1, 2), 20),
                ("TEXTCOLOR", (0, 0), (-1, -1), BRAND_BLUE),
            ]
        )
    )
    story.append(sig_table)

    story.append(Spacer(1, 6 * mm))
    story.append(HRFlowable(width="100%", thickness=0.5, color=BRAND_GRAY))
    story.append(Spacer(1, 3 * mm))
    story.append(
        Paragraph(
            f"Generated on {datetime.now().strftime('%d %b %Y %H:%M')} | {settings.COMPANY_NAME}",
            styles["FooterText"],
        )
    )

    doc.build(story)
    return buffer.getvalue()


def generate_stock_report_pdf(stock_data: list, logs_data: list) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=1.5 * cm,
        rightMargin=1.5 * cm,
        topMargin=1.5 * cm,
        bottomMargin=2 * cm,
    )
    styles = _base_styles()
    story = []

    story.append(
        _header_table(
            title=settings.COMPANY_NAME,
            subtitle="Fuel Stock Report",
            ref_label="Report Date",
            ref_value=datetime.now().strftime("%d %b %Y"),
            styles=styles,
        )
    )
    story.append(Spacer(1, 8 * mm))

    story.append(Paragraph("Airport-Wise Stock Summary", styles["SectionTitle"]))
    stock_table_data = [["Airport", "Code", "Fuel Type", "Current Stock (L)", "Capacity (L)"]]
    for s in stock_data:
        airport = s.get("airport") or {}
        stock_table_data.append(
            [
                airport.get("airport_name", "N/A"),
                airport.get("airport_code", "N/A"),
                s.get("fuel_type", "N/A"),
                f"{s.get('current_stock', 0):,.2f}",
                f"{airport.get('fuel_storage_capacity', 0):,.2f}",
            ]
        )
    if len(stock_table_data) == 1:
        stock_table_data.append(["No data available", "", "", "", ""])

    st = Table(stock_table_data, colWidths=[5 * cm, 2.5 * cm, 2.5 * cm, 4 * cm, 4 * cm])
    st.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), BRAND_BLUE),
                ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("ALIGN", (3, 0), (-1, -1), "RIGHT"),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, BRAND_LIGHT_GRAY]),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("BOX", (0, 0), (-1, -1), 0.5, BRAND_GRAY),
                ("INNERGRID", (0, 0), (-1, -1), 0.25, BRAND_GRAY),
            ]
        )
    )
    story.append(st)
    story.append(Spacer(1, 8 * mm))

    story.append(Paragraph("Recent Stock Movements (Last 20)", styles["SectionTitle"]))
    logs_table_data = [["Date", "Airport", "Type", "Fuel", "Quantity (L)", "Notes"]]
    for log in logs_data[:20]:
        airport = log.get("airport") or {}
        created_at = log.get("created_at", "N/A")
        if isinstance(created_at, datetime):
            created_at = created_at.strftime("%d/%m/%Y %H:%M")
        qty = log.get("quantity", 0)
        qty_str = f"+{qty:,.2f}" if qty >= 0 else f"{qty:,.2f}"
        logs_table_data.append(
            [
                str(created_at),
                airport.get("airport_code", "N/A"),
                log.get("transaction_type", "N/A"),
                log.get("fuel_type", "N/A"),
                qty_str,
                (log.get("notes", "") or "")[:40],
            ]
        )
    if len(logs_table_data) == 1:
        logs_table_data.append(["No data available", "", "", "", "", ""])

    lt = Table(logs_table_data, colWidths=[3.5 * cm, 2.5 * cm, 2.5 * cm, 2 * cm, 3 * cm, 5 * cm])
    lt.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), BRAND_BLUE),
                ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
                ("ALIGN", (4, 0), (4, -1), "RIGHT"),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, BRAND_LIGHT_GRAY]),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("BOX", (0, 0), (-1, -1), 0.5, BRAND_GRAY),
                ("INNERGRID", (0, 0), (-1, -1), 0.25, BRAND_GRAY),
            ]
        )
    )
    story.append(lt)

    story.append(Spacer(1, 6 * mm))
    story.append(HRFlowable(width="100%", thickness=0.5, color=BRAND_GRAY))
    story.append(Spacer(1, 3 * mm))
    story.append(
        Paragraph(
            f"Generated on {datetime.now().strftime('%d %b %Y %H:%M')} | {settings.COMPANY_NAME}",
            styles["FooterText"],
        )
    )

    doc.build(story)
    return buffer.getvalue()


def generate_analytics_pdf(analytics_data: dict, date_range: dict) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=1.5 * cm,
        rightMargin=1.5 * cm,
        topMargin=1.5 * cm,
        bottomMargin=2 * cm,
    )
    styles = _base_styles()
    story = []

    start_date = date_range.get("start_date", "N/A")
    end_date = date_range.get("end_date", "N/A")
    story.append(
        _header_table(
            title=settings.COMPANY_NAME,
            subtitle="Fuel Analytics Report",
            ref_label="Period",
            ref_value=f"{start_date} to {end_date}",
            styles=styles,
        )
    )
    story.append(Spacer(1, 8 * mm))

    summary = analytics_data.get("summary") or {}
    story.append(Paragraph("Executive Summary", styles["SectionTitle"]))
    summary_data = [
        ["Metric", "Value"],
        ["Total Purchases (L)", f"{summary.get('total_purchased', 0):,.2f}"],
        ["Total Purchase Amount (INR)", f"₹{summary.get('total_purchase_amount', 0):,.2f}"],
        ["Total Consumption (L)", f"{summary.get('total_consumed', 0):,.2f}"],
        ["Total Aircraft Serviced", str(summary.get("total_aircraft_serviced", 0))],
        ["Active Airports", str(summary.get("active_airports", 0))],
    ]
    summary_table = Table(summary_data, colWidths=[9 * cm, 9.5 * cm])
    summary_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), BRAND_BLUE),
                ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("ALIGN", (1, 0), (1, -1), "RIGHT"),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, BRAND_LIGHT_GRAY]),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("BOX", (0, 0), (-1, -1), 0.5, BRAND_GRAY),
                ("INNERGRID", (0, 0), (-1, -1), 0.25, BRAND_GRAY),
            ]
        )
    )
    story.append(summary_table)

    vendor_data = analytics_data.get("vendor_analytics") or []
    if vendor_data:
        story.append(Spacer(1, 8 * mm))
        story.append(Paragraph("Vendor Performance", styles["SectionTitle"]))
        vendor_table_data = [["Vendor", "Total Quantity (L)", "Total Amount (INR)"]]
        for v in vendor_data:
            vendor_table_data.append(
                [
                    v.get("agent_name", "N/A"),
                    f"{v.get('total_quantity', 0):,.2f}",
                    f"₹{v.get('total_amount', 0):,.2f}",
                ]
            )
        vt = Table(vendor_table_data, colWidths=[7 * cm, 5.75 * cm, 5.75 * cm])
        vt.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), BRAND_BLUE),
                    ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, -1), 9),
                    ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
                    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, BRAND_LIGHT_GRAY]),
                    ("TOPPADDING", (0, 0), (-1, -1), 6),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                    ("LEFTPADDING", (0, 0), (-1, -1), 8),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                    ("BOX", (0, 0), (-1, -1), 0.5, BRAND_GRAY),
                    ("INNERGRID", (0, 0), (-1, -1), 0.25, BRAND_GRAY),
                ]
            )
        )
        story.append(vt)

    airport_usage = analytics_data.get("airport_usage") or []
    if airport_usage:
        story.append(Spacer(1, 8 * mm))
        story.append(Paragraph("Airport Usage", styles["SectionTitle"]))
        airport_table_data = [["Airport", "Code", "Current Stock (L)", "Consumed (L)"]]
        for a in airport_usage:
            airport_table_data.append(
                [
                    a.get("airport_name", "N/A"),
                    a.get("airport_code", "N/A"),
                    f"{a.get('stock', 0):,.2f}",
                    f"{a.get('consumed', 0):,.2f}",
                ]
            )
        at = Table(airport_table_data, colWidths=[6 * cm, 3 * cm, 4.75 * cm, 4.75 * cm])
        at.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), BRAND_BLUE),
                    ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, -1), 9),
                    ("ALIGN", (2, 0), (-1, -1), "RIGHT"),
                    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, BRAND_LIGHT_GRAY]),
                    ("TOPPADDING", (0, 0), (-1, -1), 6),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                    ("LEFTPADDING", (0, 0), (-1, -1), 8),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                    ("BOX", (0, 0), (-1, -1), 0.5, BRAND_GRAY),
                    ("INNERGRID", (0, 0), (-1, -1), 0.25, BRAND_GRAY),
                ]
            )
        )
        story.append(at)

    story.append(Spacer(1, 6 * mm))
    story.append(HRFlowable(width="100%", thickness=0.5, color=BRAND_GRAY))
    story.append(Spacer(1, 3 * mm))
    story.append(
        Paragraph(
            f"Generated on {datetime.now().strftime('%d %b %Y %H:%M')} | {settings.COMPANY_NAME} | Confidential",
            styles["FooterText"],
        )
    )

    doc.build(story)
    return buffer.getvalue()
