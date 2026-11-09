@echo off
title GrandDas DMX512 Studio
cd /d "%~dp0"
:: El lanzador .exe se encarga de todo: motor Art-Net, ventana de la consola sin congelarse
:: en segundo plano, una sola instancia y cierre limpio del motor al cerrar la consola.
if exist "%~dp0GrandDas_DMX512_Studio.exe" (
    start "" "%~dp0GrandDas_DMX512_Studio.exe"
    exit /b 0
)
echo No se encuentra GrandDas_DMX512_Studio.exe en esta carpeta.
pause
