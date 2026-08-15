@echo off
title Instalador Comercial TrendPulse YT v1.0.0
color 0A
cls

echo ====================================================================
echo                 INSTALADOR COMERCIAL TRENDPULSE YT v1.0.0
echo ====================================================================
echo.
echo  Instalando archivos de la extension en tu equipo...
echo.

set TARGET_DIR=%LOCALAPPDATA%\TrendPulseYT
if not exist "%TARGET_DIR%" mkdir "%TARGET_DIR%"

echo  [1/3] Copiando extension a %TARGET_DIR%...
xcopy /E /I /Y "%~dp0TrendPulseYT_Extension\*" "%TARGET_DIR%\" >nul

echo  [2/3] Creando acceso directo en el Escritorio...
set SHORTCUT_SCRIPT=%TEMP%\create_tp_shortcut.vbs
echo Set oWS = WScript.CreateObject("WScript.Shell") > "%SHORTCUT_SCRIPT%"
echo sLinkFile = oWS.SpecialFolders("Desktop") ^& "\TrendPulse YT - Abrir Extension.url" >> "%SHORTCUT_SCRIPT%"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%SHORTCUT_SCRIPT%"
echo oLink.TargetPath = "chrome://extensions" >> "%SHORTCUT_SCRIPT%"
echo oLink.Save >> "%SHORTCUT_SCRIPT%"
cscript //nologo "%SHORTCUT_SCRIPT%"
del "%SHORTCUT_SCRIPT%" >nul

echo  [3/3] Abriendo navegador Chrome/Edge...
echo.
echo ====================================================================
echo               ¡INSTALACION COMPLETADA CON EXITO!
echo ====================================================================
echo.
echo  INSTRUCCIONES PARA ACTIVAR EN CHROME / EDGE:
echo  1. En el navegador que se abrira, activa "Modo de desarrollador" (arriba a la derecha).
echo  2. Haz clic en "Cargar descomprimida" (Load unpacked).
echo  3. Selecciona la carpeta: %TARGET_DIR%
echo.
echo  Presiona cualquier tecla para abrir Chrome en la pagina de extensiones...
pause >nul

start chrome "chrome://extensions"
start msedge "edge://extensions"
explorer "%TARGET_DIR%"
exit
