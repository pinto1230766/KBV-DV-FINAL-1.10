@echo off
echo ========================================
echo   Push vers GitHub - KBV Lyon
echo ========================================
echo.

echo Ajout du remote GitHub...
git remote add origin https://github.com/pinto1230766/KBV-DV-FINAL-1.10.git

echo.
echo Verification du remote...
git remote -v

echo.
echo Push vers GitHub...
git push -u origin main

echo.
echo ========================================
echo   Push termine !
echo ========================================
pause
