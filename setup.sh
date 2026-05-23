#!/usr/bin/env bash
# AeroFuel Management — first-time setup (macOS / Linux)
# Usage: bash setup.sh
set -e
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
python3 "$SCRIPT_DIR/scripts/setup.py" "$@"
