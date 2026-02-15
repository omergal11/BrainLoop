@echo off
echo 🧠 Resetting BrainLoop Docker containers...
echo.
echo This will:
echo - Stop all containers
echo - Remove MySQL volume (database data will be lost!)
echo - Rebuild and start everything fresh
echo.
pause

echo.
echo Stopping containers...
docker-compose -f docker-compose.dev.yml down -v

echo.
echo Starting fresh...
docker-compose -f docker-compose.dev.yml up --build

pause
