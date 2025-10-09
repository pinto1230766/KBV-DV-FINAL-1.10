@echo off
setlocal enabledelayedexpansion

echo ========================================
echo   Copie des Photos des Orateurs
echo ========================================
echo.

set "SOURCE=D:\PROJETCS APLICATIONS ANDROIDE\KBV DV LYON"
set "DEST=C:\Users\FP123\Downloads\kbv-dv-lyon-final\public\photos"

echo Creation du dossier photos...
if not exist "%DEST%" mkdir "%DEST%"

echo.
echo Copie des 11 photos...
echo.

copy "%SOURCE%\david vieira.png" "%DEST%\" >nul 2>&1 && echo [OK] david vieira.png || echo [ERREUR] david vieira.png
copy "%SOURCE%\dimitri.png" "%DEST%\" >nul 2>&1 && echo [OK] dimitri.png || echo [ERREUR] dimitri.png
copy "%SOURCE%\eddy silva.png" "%DEST%\" >nul 2>&1 && echo [OK] eddy silva.png || echo [ERREUR] eddy silva.png
copy "%SOURCE%\faria.png" "%DEST%\" >nul 2>&1 && echo [OK] faria.png || echo [ERREUR] faria.png
copy "%SOURCE%\gilberto.png" "%DEST%\" >nul 2>&1 && echo [OK] gilberto.png || echo [ERREUR] gilberto.png
copy "%SOURCE%\lucio.png" "%DEST%\" >nul 2>&1 && echo [OK] lucio.png || echo [ERREUR] lucio.png
copy "%SOURCE%\luis cardoso.png" "%DEST%\" >nul 2>&1 && echo [OK] luis cardoso.png || echo [ERREUR] luis cardoso.png
copy "%SOURCE%\mario miranda.png" "%DEST%\" >nul 2>&1 && echo [OK] mario miranda.png || echo [ERREUR] mario miranda.png
copy "%SOURCE%\vendredi.png" "%DEST%\" >nul 2>&1 && echo [OK] vendredi.png || echo [ERREUR] vendredi.png
copy "%SOURCE%\victore ribeiro.png" "%DEST%\" >nul 2>&1 && echo [OK] victore ribeiro.png || echo [ERREUR] victore ribeiro.png
copy "%SOURCE%\yuri brada.png" "%DEST%\" >nul 2>&1 && echo [OK] yuri brada.png || echo [ERREUR] yuri brada.png

echo.
echo Verification...
dir /b "%DEST%\*.png" 2>nul | find /c /v "" > temp.txt
set /p COUNT=<temp.txt
del temp.txt

echo.
echo ========================================
echo   %COUNT% photos copiees avec succes !
echo ========================================
echo.

pause
