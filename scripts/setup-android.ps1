# Script d'installation automatique pour KBV Lyon - Android
# Exécutez ce script dans PowerShell avec : .\setup-android.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Installation KBV Lyon - Android" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Fonction pour vérifier si une commande existe
function Test-Command {
    param($Command)
    try {
        if (Get-Command $Command -ErrorAction Stop) {
            return $true
        }
    }
    catch {
        return $false
    }
}

# Vérification de Node.js
Write-Host "[1/8] Vérification de Node.js..." -ForegroundColor Yellow
if (Test-Command "node") {
    $nodeVersion = node --version
    Write-Host "✓ Node.js installé : $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "✗ Node.js n'est pas installé !" -ForegroundColor Red
    Write-Host "Téléchargez-le depuis : https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Vérification de npm
Write-Host "[2/8] Vérification de npm..." -ForegroundColor Yellow
if (Test-Command "npm") {
    $npmVersion = npm --version
    Write-Host "✓ npm installé : $npmVersion" -ForegroundColor Green
} else {
    Write-Host "✗ npm n'est pas installé !" -ForegroundColor Red
    exit 1
}

# Installation des dépendances
Write-Host "[3/8] Installation des dépendances npm..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Dépendances installées avec succès" -ForegroundColor Green
} else {
    Write-Host "✗ Erreur lors de l'installation des dépendances" -ForegroundColor Red
    exit 1
}

# Vérification du fichier .env.local
Write-Host "[4/8] Vérification du fichier .env.local..." -ForegroundColor Yellow
if (Test-Path ".env.local") {
    Write-Host "✓ Fichier .env.local trouvé" -ForegroundColor Green
    Write-Host "⚠ N'oubliez pas d'ajouter votre clé API Gemini !" -ForegroundColor Yellow
} else {
    Write-Host "⚠ Fichier .env.local non trouvé, création..." -ForegroundColor Yellow
    @"
VITE_GEMINI_API_KEY=votre_cle_api_gemini_ici
"@ | Out-File -FilePath ".env.local" -Encoding UTF8
    Write-Host "✓ Fichier .env.local créé" -ForegroundColor Green
    Write-Host "⚠ IMPORTANT : Ajoutez votre clé API Gemini dans .env.local" -ForegroundColor Yellow
}

# Construction de l'application
Write-Host "[5/8] Construction de l'application web..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Application construite avec succès" -ForegroundColor Green
} else {
    Write-Host "✗ Erreur lors de la construction" -ForegroundColor Red
    exit 1
}

# Vérification de Capacitor CLI
Write-Host "[6/8] Vérification de Capacitor..." -ForegroundColor Yellow
if (Test-Command "npx") {
    Write-Host "✓ npx disponible" -ForegroundColor Green
} else {
    Write-Host "✗ npx n'est pas disponible" -ForegroundColor Red
    exit 1
}

# Ajout de la plateforme Android
Write-Host "[7/8] Ajout de la plateforme Android..." -ForegroundColor Yellow
if (Test-Path "android") {
    Write-Host "⚠ Le dossier android existe déjà" -ForegroundColor Yellow
    $response = Read-Host "Voulez-vous le recréer ? (o/n)"
    if ($response -eq "o" -or $response -eq "O") {
        Remove-Item -Recurse -Force "android"
        npx cap add android
    }
} else {
    npx cap add android
}

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Plateforme Android ajoutée" -ForegroundColor Green
} else {
    Write-Host "✗ Erreur lors de l'ajout de la plateforme Android" -ForegroundColor Red
    exit 1
}

# Configuration du AndroidManifest.xml
Write-Host "[8/8] Configuration du AndroidManifest.xml..." -ForegroundColor Yellow
$manifestPath = "android\app\src\main\AndroidManifest.xml"
$templatePath = "AndroidManifest.template.xml"

if (Test-Path $templatePath) {
    if (Test-Path $manifestPath) {
        Copy-Item $templatePath $manifestPath -Force
        Write-Host "✓ AndroidManifest.xml configuré avec toutes les autorisations" -ForegroundColor Green
    } else {
        Write-Host "⚠ Fichier AndroidManifest.xml non trouvé" -ForegroundColor Yellow
        Write-Host "  Copiez manuellement AndroidManifest.template.xml vers $manifestPath" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠ Template AndroidManifest.template.xml non trouvé" -ForegroundColor Yellow
}

# Synchronisation
Write-Host ""
Write-Host "Synchronisation avec Android..." -ForegroundColor Yellow
npx cap sync android

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Synchronisation réussie" -ForegroundColor Green
} else {
    Write-Host "⚠ Erreur lors de la synchronisation" -ForegroundColor Yellow
}

# Résumé
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Installation terminée !" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Prochaines étapes :" -ForegroundColor Yellow
Write-Host "1. Ajoutez votre clé API Gemini dans .env.local" -ForegroundColor White
Write-Host "2. Activez le mode développeur sur votre tablette Samsung" -ForegroundColor White
Write-Host "3. Connectez votre tablette via USB" -ForegroundColor White
Write-Host "4. Exécutez : npx cap open android" -ForegroundColor White
Write-Host "5. Dans Android Studio, cliquez sur Run (▶️)" -ForegroundColor White
Write-Host ""
Write-Host "Consultez DEPLOIEMENT_SAMSUNG_S10_ULTRA.md pour plus de détails" -ForegroundColor Cyan
Write-Host ""

# Demander si l'utilisateur veut ouvrir Android Studio
$openStudio = Read-Host "Voulez-vous ouvrir Android Studio maintenant ? (o/n)"
if ($openStudio -eq "o" -or $openStudio -eq "O") {
    Write-Host "Ouverture d'Android Studio..." -ForegroundColor Yellow
    npx cap open android
}

Write-Host ""
Write-Host "✓ Script terminé avec succès !" -ForegroundColor Green
