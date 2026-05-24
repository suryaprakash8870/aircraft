"""
Assemble all screenshots in `screenshots/` into a polished Word document.

Run AFTER scripts/capture_screenshots.py has produced the PNG files.

    python scripts/build_screenshots_doc.py

Output: docs/AeroFuel-UI-Walkthrough.docx
"""
from __future__ import annotations

import sys
from datetime import datetime
from pathlib import Path

try:
    from docx import Document
    from docx.enum.table import WD_TABLE_ALIGNMENT
    from docx.enum.text import WD_ALIGN_PARAGRAPH
    from docx.oxml.ns import qn
    from docx.oxml import OxmlElement
    from docx.shared import Cm, Pt, RGBColor
except ImportError:
    print("Missing dependency. Install: pip install python-docx Pillow")
    sys.exit(2)

REPO_ROOT = Path(__file__).resolve().parent.parent
SCREENSHOTS_DIR = REPO_ROOT / "screenshots"
DOCS_DIR = REPO_ROOT / "docs"
DOCS_DIR.mkdir(exist_ok=True)
OUTPUT = DOCS_DIR / "AeroFuel-UI-Walkthrough.docx"

# Map filename -> (title, description). Same order as the capture script.
PAGES: list[tuple[str, str, str]] = [
    ("01_login.png",            "Login",
     "Email + password sign-in page. Branded left panel with aviation gradient, "
     "form on the right. Validation feedback inline. Token returned by the backend "
     "is stored in localStorage."),
    ("02_dashboard.png",        "Dashboard",
     "Home page after login. Shows four KPI tiles (Total Fuel Stock, Purchased This "
     "Month, Consumed This Month, Total Aircraft Fueled), four ApexCharts widgets, "
     "and a Recent Transactions feed."),
    ("03_fuel_agents.png",      "Fuel Agents — List",
     "Paginated list of fuel vendors with search and status filter. Each row shows "
     "agent name, company, contact, phone, email, GST number, and status chip."),
    ("04_fuel_agent_form.png",  "Fuel Agents — Add Form",
     "Form to register a new fuel vendor. Captures contact details, GST number, and "
     "an active/inactive status. Validates required fields with React Hook Form."),
    ("05_airports.png",         "Airports — List",
     "All airports with capacity vs. current stock. The Current Stock column "
     "renders a linear progress bar coloured green / orange / red by fill level."),
    ("06_airport_form.png",     "Airports — Add Form",
     "Form to register a new airport. IATA code is auto-uppercased, capacity is "
     "captured in litres."),
    ("07_fuel_purchases.png",   "Fuel Purchases — List",
     "All fuel purchases with filters (airport, agent, payment status, fuel type, "
     "date range). Each row has actions to view, edit, delete, and download the "
     "invoice PDF."),
    ("08_purchase_form.png",    "Fuel Purchases — Add Form",
     "Records a new fuel purchase. Selects agent and airport, sets quantity, rate, "
     "and date — total amount is computed live. Backend auto-generates the "
     "FP-YYYYMMDD-XXXX purchase ID and updates the airport's fuel stock."),
    ("09_fuel_stock.png",       "Fuel Stock",
     "Tabbed view of current stock per airport and the stock movement log. Each "
     "log entry is colour-coded (green for purchase additions, blue for filling "
     "deductions, orange for manual adjustments)."),
    ("10_aircrafts.png",        "Aircrafts — List",
     "Registry of all aircraft with tail number, model, airline, fuel capacity, "
     "and status."),
    ("11_aircraft_form.png",    "Aircrafts — Add Form",
     "Form to register a new aircraft. Captures tail number, model, airline, "
     "capacity, and active/inactive status."),
    ("12_aircraft_filling.png", "Aircraft Filling — List",
     "All fueling operations sorted by date/time. Each row links to a detail page "
     "and offers receipt PDF download."),
    ("13_filling_form.png",     "Aircraft Filling — Add Form",
     "Records a fueling operation. Total cost is auto-computed; on save, stock at "
     "the chosen airport is automatically deducted by the backend."),
    ("14_reports.png",          "Reports",
     "Tabbed reports (purchases, consumption, airport stock, aircraft history, "
     "vendor). Each tab supports filters and export to PDF, Excel, or CSV."),
    ("15_users.png",            "Users (Admin)",
     "User management page (admin only). Add/edit users, assign roles, deactivate "
     "accounts, reset passwords."),
    ("16_audit_logs.png",       "Audit Logs (Admin)",
     "Audit log viewer (admin only). Filters by user, action, entity type, date "
     "range. Each entry stores old + new JSON values for full traceability."),
]


def add_page_break(doc: Document) -> None:
    p = doc.add_paragraph()
    run = p.add_run()
    run.add_break(6)  # WD_BREAK.PAGE = 6 (= page break)


def add_cover(doc: Document) -> None:
    title = doc.add_paragraph()
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = title.add_run("AeroFuel Management System")
    run.bold = True
    run.font.size = Pt(32)
    run.font.color.rgb = RGBColor(0x15, 0x65, 0xC0)

    sub = doc.add_paragraph()
    sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    sub_run = sub.add_run("UI Walkthrough — Screen Captures")
    sub_run.font.size = Pt(16)
    sub_run.font.color.rgb = RGBColor(0x63, 0x73, 0x81)

    spacer = doc.add_paragraph()
    spacer.add_run("\n\n\n")

    meta = doc.add_paragraph()
    meta.alignment = WD_ALIGN_PARAGRAPH.CENTER
    meta_run = meta.add_run(f"Generated {datetime.now().strftime('%d %B %Y, %H:%M')}")
    meta_run.font.size = Pt(11)
    meta_run.italic = True
    meta_run.font.color.rgb = RGBColor(0x91, 0x9E, 0xAB)

    spacer = doc.add_paragraph()
    spacer.add_run("\n\n")

    info = doc.add_paragraph()
    info.alignment = WD_ALIGN_PARAGRAPH.CENTER
    info_run = info.add_run(
        "Full-stack aviation fuel management application\n"
        "React 18 · Material UI · FastAPI · PostgreSQL"
    )
    info_run.font.size = Pt(12)
    info_run.font.color.rgb = RGBColor(0x45, 0x4F, 0x5B)


def add_toc(doc: Document) -> None:
    h = doc.add_paragraph()
    h_run = h.add_run("Contents")
    h_run.bold = True
    h_run.font.size = Pt(20)
    h_run.font.color.rgb = RGBColor(0x15, 0x65, 0xC0)
    doc.add_paragraph()

    for i, (_filename, title, _desc) in enumerate(PAGES, start=1):
        p = doc.add_paragraph()
        p.paragraph_format.left_indent = Cm(0.5)
        run = p.add_run(f"{i:>2}.  {title}")
        run.font.size = Pt(12)


def add_page(doc: Document, idx: int, filename: str, title: str, description: str) -> bool:
    image_path = SCREENSHOTS_DIR / filename
    if not image_path.exists():
        print(f"  [skip] {filename} not found")
        return False

    # Section heading
    heading = doc.add_paragraph()
    run = heading.add_run(f"{idx}. {title}")
    run.bold = True
    run.font.size = Pt(20)
    run.font.color.rgb = RGBColor(0x15, 0x65, 0xC0)

    # Description
    desc_p = doc.add_paragraph()
    desc_run = desc_p.add_run(description)
    desc_run.font.size = Pt(11)
    desc_run.font.color.rgb = RGBColor(0x45, 0x4F, 0x5B)

    # Image — full width (A4 portrait usable ≈ 16 cm)
    doc.add_paragraph()
    img_para = doc.add_paragraph()
    img_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
    img_para.add_run().add_picture(str(image_path), width=Cm(16))

    # Caption
    caption = doc.add_paragraph()
    caption.alignment = WD_ALIGN_PARAGRAPH.CENTER
    cap_run = caption.add_run(f"Figure {idx} — {title}")
    cap_run.italic = True
    cap_run.font.size = Pt(9)
    cap_run.font.color.rgb = RGBColor(0x91, 0x9E, 0xAB)

    return True


def main() -> int:
    if not SCREENSHOTS_DIR.exists() or not any(SCREENSHOTS_DIR.glob("*.png")):
        print(f"No screenshots in {SCREENSHOTS_DIR}.")
        print("Run scripts/capture_screenshots.py first.")
        return 1

    print(f"Building Word doc from {SCREENSHOTS_DIR}")

    doc = Document()
    # Default font
    style = doc.styles["Normal"]
    style.font.name = "Calibri"
    style.font.size = Pt(11)

    # Default margins
    for section in doc.sections:
        section.top_margin = Cm(1.8)
        section.bottom_margin = Cm(1.8)
        section.left_margin = Cm(1.8)
        section.right_margin = Cm(1.8)

    add_cover(doc)
    add_page_break(doc)

    add_toc(doc)
    add_page_break(doc)

    count = 0
    for i, (filename, title, description) in enumerate(PAGES, start=1):
        if add_page(doc, i, filename, title, description):
            count += 1
        if i < len(PAGES):
            add_page_break(doc)

    doc.save(OUTPUT)
    size_kb = OUTPUT.stat().st_size / 1024
    print(f"\n[OK] Wrote {OUTPUT}  ({size_kb:,.1f} KB, {count} page sections)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
