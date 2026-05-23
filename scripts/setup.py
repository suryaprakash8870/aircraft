"""
Cross-platform first-time setup for AeroFuel Management System.

Run from the repo root (works on Windows, macOS, Linux):

    python scripts/setup.py

What it does:
  1. Copies backend/.env.example -> backend/.env (if .env doesn't exist)
  2. Reports any missing prerequisites (Python, Node, Docker)
  3. Prints the next-step commands
"""
from __future__ import annotations

import os
import shutil
import subprocess
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parent.parent
BACKEND_ENV = REPO_ROOT / "backend" / ".env"
BACKEND_ENV_EXAMPLE = REPO_ROOT / "backend" / ".env.example"
FRONTEND_ENV = REPO_ROOT / "frontend" / ".env"
FRONTEND_ENV_EXAMPLE = REPO_ROOT / "frontend" / ".env.example"


def info(msg: str) -> None:
    print(f"  {msg}")


def ok(msg: str) -> None:
    print(f"  [OK]   {msg}")


def warn(msg: str) -> None:
    print(f"  [WARN] {msg}")


def fail(msg: str) -> None:
    print(f"  [FAIL] {msg}")


def step(num: int, title: str) -> None:
    print(f"\n[{num}] {title}")


def _copy_one(label: str, template: Path, target: Path) -> bool:
    """Copy a template .env.example -> .env if target doesn't already exist."""
    if not template.exists():
        fail(f"{label} template not found: {template}")
        return False
    if target.exists():
        ok(f"{label} .env already exists at {target} (left untouched)")
        return True
    shutil.copy2(template, target)
    ok(f"Created {target} from {template.name}")
    return True


def copy_env_files() -> bool:
    """Materialize backend/.env and frontend/.env from their templates."""
    backend_ok = _copy_one("backend", BACKEND_ENV_EXAMPLE, BACKEND_ENV)
    if backend_ok and not BACKEND_ENV.exists():
        return False
    if backend_ok and BACKEND_ENV.exists():
        info("    Review and update SECRET_KEY before production!")

    frontend_ok = _copy_one("frontend", FRONTEND_ENV_EXAMPLE, FRONTEND_ENV)
    return backend_ok and frontend_ok


def has_command(cmd: str) -> bool:
    return shutil.which(cmd) is not None


def get_version(cmd: list[str]) -> str | None:
    try:
        out = subprocess.run(cmd, capture_output=True, text=True, timeout=5)
        return (out.stdout or out.stderr).strip().splitlines()[0]
    except Exception:
        return None


def check_prerequisites() -> dict[str, bool]:
    results: dict[str, bool] = {}

    # Python
    py_ver = sys.version.split()[0]
    if sys.version_info >= (3, 11):
        ok(f"Python {py_ver}")
        results["python"] = True
    else:
        warn(f"Python {py_ver} - backend requires >= 3.11")
        results["python"] = False

    # Node
    if has_command("node"):
        ver = get_version(["node", "--version"])
        ok(f"Node {ver}")
        results["node"] = True
    else:
        warn("Node.js not found - frontend dev requires Node >= 18")
        results["node"] = False

    # Docker
    if has_command("docker"):
        ver = get_version(["docker", "--version"])
        ok(f"{ver}")
        results["docker"] = True
    else:
        warn("Docker not found - required for the Quick Start path")
        results["docker"] = False

    # Docker Compose
    if has_command("docker-compose") or has_command("docker"):
        try:
            out = subprocess.run(
                ["docker", "compose", "version"], capture_output=True, text=True, timeout=5
            )
            if out.returncode == 0:
                ok((out.stdout or out.stderr).strip().splitlines()[0])
                results["docker_compose"] = True
            else:
                results["docker_compose"] = False
        except Exception:
            results["docker_compose"] = False
    else:
        results["docker_compose"] = False

    return results


def print_next_steps(prereq: dict[str, bool]) -> None:
    print("\nNext steps:")
    print("-" * 60)

    if prereq.get("docker") and prereq.get("docker_compose"):
        print("Run the full stack with Docker (recommended):")
        print("    docker-compose up --build")
        print()

    if prereq.get("python") and prereq.get("node"):
        print("Or run locally:")
        if os.name == "nt":
            print("    # Backend (Windows PowerShell):")
            print("    cd backend")
            print("    python -m venv .venv")
            print("    .\\.venv\\Scripts\\Activate.ps1")
            print("    pip install -r requirements.txt")
            print("    uvicorn app.main:app --reload --port 8000")
        else:
            print("    # Backend (macOS / Linux):")
            print("    cd backend")
            print("    python3 -m venv .venv")
            print("    source .venv/bin/activate")
            print("    pip install -r requirements.txt")
            print("    uvicorn app.main:app --reload --port 8000")
        print()
        print("    # Frontend (any OS, in a separate terminal):")
        print("    cd frontend")
        print("    npm install")
        print("    npm run dev")
        print()

    print("Once running:")
    print("    Frontend:  http://localhost:3000")
    print("    API docs:  http://localhost:8000/docs")
    print("    Login:     admin@aerofuel.com / Admin@123")


def main() -> int:
    print("=" * 60)
    print(" AeroFuel Management - First-time Setup")
    print("=" * 60)

    step(1, "Creating .env files from templates")
    if not copy_env_files():
        return 1

    step(2, "Checking prerequisites")
    prereq = check_prerequisites()

    print_next_steps(prereq)

    print()
    print("=" * 60)
    print(" Setup complete.")
    print("=" * 60)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
