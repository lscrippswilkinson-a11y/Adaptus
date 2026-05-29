@echo off
title Adaptus
cd /d "%~dp0"

REM Make sure Node/npm is available (falls back to the default install path).
where npm >nul 2>nul || set "PATH=%ProgramFiles%\nodejs;%PATH%"

echo.
echo   Starting Adaptus...
echo   Your browser will open at http://localhost:5173/ in a few seconds.
echo   Keep this window open while you use the app. Close it (or press Ctrl+C) to stop.
echo.

REM Open the browser shortly after the dev server starts.
start "" /b powershell -NoProfile -Command "Start-Sleep 4; Start-Process 'http://localhost:5173/'"

npm run dev
