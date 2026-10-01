@echo off
cd /d D:\dev\tools\nginx
start "" nginx.exe -p D:\CivicConnect\infra\nginx -c nginx.conf

cd /d D:\CivicConnect
timeout /t 2 > NUL 2>&1

start "GW-4000"      cmd /k "set GATEWAY_PORT=4000 && node gateway/src/index.js"
start "GW-4001"      cmd /k "set GATEWAY_PORT=4001 && node gateway/src/index.js"
timeout /t 3 >nul

start "AUTH"         cmd /k "node services/auth-service/src/index.js"
start "PROFILE"      cmd /k "node services/profile-service/src/index.js"
start "DOCUMENT"     cmd /k "node services/document-service/src/index.js"
start "GRIEVANCE"    cmd /k "node services/grievance-service/src/index.js"
start "NOTIFICATION" cmd /k "node services/notification-service/src/index.js"
start "AI"           cmd /k "node services/ai-service/src/index.js"
start "PAYMENT"      cmd /k "node services/payment-service/src/index.js"
timeout /t 3 >nul

start "FRONTEND"     cmd /k "cd frontend && npm run dev"
timeout /t 8 >nul
start http://localhost:5173