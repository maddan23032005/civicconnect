@echo off
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM nginx.exe >nul 2>&1
echo All CivicConnect processes stopped.
pause