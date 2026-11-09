@echo off
title AETHER-VJ // WI-FI PROPIO (ZONA CON COBERTURA INALAMBRICA)
cd /d "%~dp0"
echo ====================================================================
echo   AETHER-VJ // ENCENDIENDO EL WI-FI PROPIO DE ESTE PC
echo   Red: AETHER-VJ    Clave: aethervj2026
echo ====================================================================
rem Se usa Windows PowerShell 5.1 (incluye WinRT). -ExecutionPolicy Bypass para doble clic.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0INICIAR-HOTSPOT-WINDOWS.ps1" %*
echo.
pause
