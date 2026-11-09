@echo off
title GrandDas DMX512 - Consola Profesional + Puente Hahan USB Art-Net
cd /d "%~dp0"
echo ======================================================================
echo   GRANDDAS DMX512 - INICIANDO MOTOR HAHAN SL04 BOX (2.0.0.44) + WEB
echo ======================================================================
start "" "http://localhost:5175"
node server/artnetServer.cjs
pause
