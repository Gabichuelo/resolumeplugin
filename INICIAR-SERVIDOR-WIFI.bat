@echo off
title AETHER-VJ // SERVIDOR WI-FI + MANDO MOVIL
cd /d "%~dp0"
echo ====================================================================
echo   INICIANDO SERVIDOR WI-FI AETHER-VJ (PUERTO 8080)
echo ====================================================================
node server-remote.js
pause
