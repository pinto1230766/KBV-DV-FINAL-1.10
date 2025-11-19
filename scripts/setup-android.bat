@echo off
chcp 65001 >nul
cls

echo ========================================
echo   Installation KBV Lyon - Android
echo ========================================
echo.

REM Vérification de Node.js
echo [1/8] Vérification de Node.js...
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ✗ Node.js n'est pas installé !
    echo Téléchargez-le depuis : https://nodejs.org/
    pause
    exit /b 1
)
node --version
echo ✓ Node.js installé
echo.

REM Vérification de npm
echo [2/8] Vérification de npm...
where npm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ✗ npm n'est pas installé !
    pause
    exit /b 1
)
npm --version
echo ✓ npm installé
echo.

REM Installation des dépendances
echo [3/8] Installation des dépendances npm...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ✗ Erreur lors de l'installation des dépendances
    pause
    exit /b 1
)
echo ✓ Dépendances installées avec succès
echo.

REM Vérification du fichier .env.local
echo [4/8] Vérification du fichier .env.local...
if exist ".env.local" (
    echo ✓ Fichier .env.local trouvé
    echo ⚠ N'oubliez pas d'ajouter votre clé API Gemini !
) else (
    echo ⚠ Fichier .env.local non trouvé, création...
    echo VITE_GEMINI_API_KEY=votre_cle_api_gemini_ici > .env.local
    echo ✓ Fichier .env.local créé
    echo ⚠ IMPORTANT : Ajoutez votre clé API Gemini dans .env.local
)
echo.

REM Construction de l'application
echo [5/8] Construction de l'application web...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ✗ Erreur lors de la construction
    pause
    exit /b 1
)
echo ✓ Application construite avec succès
echo.

REM Ajout de la plateforme Android
echo [6/8] Ajout de la plateforme Android...
if exist "android" (
    echo ⚠ Le dossier android existe déjà
    set /p recreate="Voulez-vous le recréer ? (o/n) : "
    if /i "%recreate%"=="o" (
        rmdir /s /q android
        call npx cap add android
    )
) else (
    call npx cap add android
)

if %ERRORLEVEL% NEQ 0 (
    echo ✗ Erreur lors de l'ajout de la plateforme Android
    pause
    exit /b 1
)
echo ✓ Plateforme Android ajoutée
echo.

REM Configuration du AndroidManifest.xml
echo [7/8] Configuration du AndroidManifest.xml...
if exist "AndroidManifest.template.xml" (
    if exist "android\app\src\main\AndroidManifest.xml" (
        copy /y "AndroidManifest.template.xml" "android\app\src\main\AndroidManifest.xml" >nul
        echo ✓ AndroidManifest.xml configuré avec toutes les autorisations
    ) else (
        echo ⚠ Fichier AndroidManifest.xml non trouvé
        echo   Copiez manuellement AndroidManifest.template.xml
    )
) else (
    echo ⚠ Template AndroidManifest.template.xml non trouvé
)
echo.

REM Synchronisation
echo [8/8] Synchronisation avec Android...
call npx cap sync android
if %ERRORLEVEL% NEQ 0 (
    echo ⚠ Erreur lors de la synchronisation
) else (
    echo ✓ Synchronisation réussie
)
echo.

REM Résumé
echo ========================================
echo   Installation terminée !
echo ========================================
echo.
echo Prochaines étapes :
echo 1. Ajoutez votre clé API Gemini dans .env.local
echo 2. Activez le mode développeur sur votre tablette Samsung
echo 3. Connectez votre tablette via USB
echo 4. Exécutez : npx cap open android
echo 5. Dans Android Studio, cliquez sur Run (▶️)
echo.
echo Consultez DEPLOIEMENT_SAMSUNG_S10_ULTRA.md pour plus de détails
echo.

REM Demander si l'utilisateur veut ouvrir Android Studio
set /p openStudio="Voulez-vous ouvrir Android Studio maintenant ? (o/n) : "
if /i "%openStudio%"=="o" (
    echo Ouverture d'Android Studio...
    call npx cap open android
)

echo.
echo ✓ Script terminé avec succès !
echo.
pause
