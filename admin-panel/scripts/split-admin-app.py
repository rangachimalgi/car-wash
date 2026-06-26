#!/usr/bin/env python3
"""Split monolithic App.jsx into useAdminPanel hook + tab components + thin App shell."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1] / 'src'
APP = ROOT / 'App.jsx'
lines = APP.read_text().splitlines(keepends=True)

HOOK_START = 66  # line after function App() {
HOOK_END = 3088   # line before return (

hook_lines = lines[HOOK_START:HOOK_END]

SKIP_STATE = {
    'activeTab', 'setActiveTab',
    'sidebarOpen', 'setSidebarOpen',
    'navOpen', 'setNavOpen',
    'authToken', 'setAuthToken',
}

filtered = []
skip_block = False
for line in hook_lines:
    if 'const inventoryLowStockCount' in line or 'const iconStroke' in line:
        skip_block = True
        continue
    if skip_block:
        if line.strip().startswith('const completedStatuses'):
            skip_block = False
            filtered.append(line)
        continue
    if any(f'const [{name},' in line or f'const [{name} ' in line for name in SKIP_STATE):
        continue
  # broken - fix skip for useState
PY