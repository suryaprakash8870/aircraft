"""
Capture full-page screenshots of every AeroFuel UI screen using Playwright.

Prereqs:
    pip install playwright python-docx
    python -m playwright install chromium

Usage (with backend on :8000 and frontend dev server on :3000):
    python scripts/capture_screenshots.py
"""
from __future__ import annotations

import sys
import time
from pathlib import Path

from playwright.sync_api import Page, sync_playwright

REPO_ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = REPO_ROOT / "screenshots"
OUT_DIR.mkdir(exist_ok=True)

BASE_URL = "http://localhost:3000"
LOGIN_EMAIL = "admin@aerofuel.com"
LOGIN_PASSWORD = "Admin@123"

VIEWPORT = {"width": 1440, "height": 900}

# (filename, route, title, settle_seconds, optional pre-action callable)
PAGES: list[tuple[str, str, str, float]] = [
    ("01_login.png",            "/login",             "Login Page",                    1.5),
    ("02_dashboard.png",        "/dashboard",         "Dashboard",                     3.0),
    ("03_fuel_agents.png",      "/fuel-agents",       "Fuel Agents (List)",            2.0),
    ("04_fuel_agent_form.png",  "/fuel-agents/new",   "Fuel Agent - Add Form",         1.5),
    ("05_airports.png",         "/airports",          "Airports (List)",               2.0),
    ("06_airport_form.png",     "/airports/new",      "Airport - Add Form",            1.5),
    ("07_fuel_purchases.png",   "/fuel-purchases",    "Fuel Purchases (List)",         2.0),
    ("08_purchase_form.png",    "/fuel-purchases/new", "Fuel Purchase - Add Form",     1.5),
    ("09_fuel_stock.png",       "/fuel-stock",        "Fuel Stock",                    2.5),
    ("10_aircrafts.png",        "/aircrafts",         "Aircrafts (List)",              2.0),
    ("11_aircraft_form.png",    "/aircrafts/new",     "Aircraft - Add Form",           1.5),
    ("12_aircraft_filling.png", "/aircraft-filling",  "Aircraft Filling (List)",       2.0),
    ("13_filling_form.png",     "/aircraft-filling/new", "Aircraft Filling - Add Form", 1.5),
    ("14_reports.png",          "/reports",           "Reports",                       2.5),
    ("15_users.png",            "/users",             "Users (Admin)",                 2.0),
    ("16_audit_logs.png",       "/audit-logs",        "Audit Logs (Admin)",            2.0),
]


def login(page: Page) -> None:
    print("  [login] Navigating to /login")
    page.goto(f"{BASE_URL}/login", wait_until="networkidle")
    page.wait_for_selector('input[type="email"]', timeout=15_000)
    page.fill('input[type="email"]', LOGIN_EMAIL)
    page.fill('input[type="password"]', LOGIN_PASSWORD)
    page.click('button[type="submit"]')
    page.wait_for_url("**/dashboard", timeout=15_000)
    print("  [login] Authenticated.")


def capture(page: Page, route: str, filename: str, settle: float) -> None:
    url = f"{BASE_URL}{route}"
    print(f"  -> {filename}  ({route})")
    page.goto(url, wait_until="networkidle")
    # Extra settle so charts/tables finish rendering
    time.sleep(settle)
    out_path = OUT_DIR / filename
    page.screenshot(path=str(out_path), full_page=True, type="png")
    size_kb = out_path.stat().st_size / 1024
    print(f"     saved {filename}  ({size_kb:,.1f} KB)")


def main() -> int:
    print(f"Output dir: {OUT_DIR}")
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        context = browser.new_context(viewport=VIEWPORT, device_scale_factor=1)
        page = context.new_page()

        # 1. Login screen first (unauthenticated)
        print("\n[1/2] Capturing login screen (logged out)")
        first = PAGES[0]
        capture(page, first[1], first[0], first[3])

        # 2. Authenticate then capture all protected pages
        print("\n[2/2] Logging in and capturing protected pages")
        login(page)
        for filename, route, title, settle in PAGES[1:]:
            try:
                capture(page, route, filename, settle)
            except Exception as e:
                print(f"     ERROR on {route}: {e}")

        browser.close()

    print(f"\nDone. {len(list(OUT_DIR.glob('*.png')))} screenshots in {OUT_DIR}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
