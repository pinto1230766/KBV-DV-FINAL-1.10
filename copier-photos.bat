@echo off
echo ========================================
echo   Copie des Photos des Orateurs
echo ========================================
echo.

echo Creation du dossier photos...
if not exist "public\photos" mkdir "public\photos"

echo.
echo Copie des photos depuis l'ancien projet...
copy "D:\PROJETCS APLICATIONS ANDROIDE\KBV DV LYON\david vieira.png" "public\photos\"
copy "D:\PROJETCS APLICATIONS ANDROIDE\KBV DV LYON\dimitri.png" "public\photos\"
copy "D:\PROJETCS APLICATIONS ANDROIDE\KBV DV LYON\eddy silva.png" "public\photos\"
copy "D:\PROJETCS APLICATIONS ANDROIDE\KBV DV LYON\faria.png" "public\photos\"
copy "D:\PROJETCS APLICATIONS ANDROIDE\KBV DV LYON\gilberto.png" "public\photos\"
copy "D:\PROJETCS APLICATIONS ANDROIDE\KBV DV LYON\lucio.png" "public\photos\"
copy "D:\PROJETCS APLICATIONS ANDROIDE\KBV DV LYON\luis cardoso.png" "public\photos\"
copy "D:\PROJETCS APLICATIONS ANDROIDE\KBV DV LYON\mario miranda.png" "public\photos\"
copy "D:\PROJETCS APLICATIONS ANDROIDE\KBV DV LYON\vendredi.png" "public\photos\"
copy "D:\PROJETCS APLICATIONS ANDROIDE\KBV DV LYON\victore ribeiro.png" "public\photos\"
copy "D:\PROJETCS APLICATIONS ANDROIDE\KBV DV LYON\yuri brada.png" "public\photos\"

echo.
echo Verification...
dir /b "public\photos\*.png"

echo.
echo ========================================
echo   Copie terminee !
echo ========================================
echo.
echo 11 photos copiees dans public\photos\
echo.
pause
