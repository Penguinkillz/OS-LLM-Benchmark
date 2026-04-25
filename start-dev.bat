@echo off
setlocal EnableExtensions
cd /d "%~dp0"

echo.
echo [OS-LLM-Benchmark] Starting local dev stack (Windows)
echo  - Docker: Postgres + Redis only (so you can run the worker in Python with --reload^)
echo  - New windows: Python worker (uvicorn) and Next.js (npm run dev^)
echo.

where docker >nul 2>&1
if errorlevel 1 (
  echo ERROR: docker not in PATH. Install Docker Desktop, or start Postgres/Redis yourself.
  goto :fail
)

echo Starting: docker compose up -d db redis ...
docker compose up -d db redis
if errorlevel 1 (
  echo ERROR: docker compose failed. Is Docker Desktop running?
  goto :fail
)

set "ROOT=%~dp0"
set "WDIR=%ROOT%services\benchmark-worker"
set "VPY=%WDIR%\.venv\Scripts\python.exe"
if not exist "%VPY%" (
  echo.
  echo No Python venv at services\benchmark-worker\.venv
  echo Create it once:  cd services\benchmark-worker
  echo                      py -3.12 -m venv .venv
  echo                      .venv\Scripts\activate
  echo                      pip install -r requirements.txt
  echo.
  goto :fail
)

if not exist "%ROOT%node_modules" (
  echo.
  echo Run once from repo root:  npm install
  echo.
  goto :fail
)

if not exist "%ROOT%apps\web\.env.local" if not exist "%ROOT%.env" (
  echo WARNING: No .env or apps\web\.env.local found. Copy apps\web\.env.example to apps\web\.env.local
  echo   Set DATABASE_URL=postgresql://osllm:osllm@127.0.0.1:5432/osllm
  echo   WORKER_BASE_URL=http://127.0.0.1:8081  and  WORKER_API_KEY=change-me
  echo.
)

echo Waiting for Postgres health ...
timeout /t 3 /nobreak >nul
echo Applying SQL migrations (safe to re-run) ...
type "%ROOT%db\migrations\001_init.sql" | docker compose exec -T db psql -U osllm -d osllm 2>nul
type "%ROOT%db\migrations\002_run_params.sql" | docker compose exec -T db psql -U osllm -d osllm 2>nul

echo Starting worker in a new window (port 8081, WORKER_API_KEY=change-me) ...
start "osllm-worker" cmd /k "cd /d %WDIR% && call .venv\Scripts\activate.bat && set WORKER_API_KEY=change-me && title OS-LLM worker && uvicorn main:app --reload --port 8081 --host 127.0.0.1"

timeout /t 2 /nobreak >nul

echo Starting Next.js in a new window (port 3000) ...
start "osllm-web" cmd /k "cd /d %ROOT% && title OS-LLM web && npm run dev"

echo.
echo Done. Open http://localhost:3000
echo Ensure DATABASE_URL points at localhost:5432 and WORKER_BASE_URL=http://127.0.0.1:8081
echo.
endlocal
exit /b 0

:fail
endlocal
exit /b 1
