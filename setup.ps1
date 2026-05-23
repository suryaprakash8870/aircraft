# AeroFuel Management - first-time setup (Windows PowerShell)
# Usage:  .\setup.ps1
$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
python "$ScriptDir\scripts\setup.py" @args
